// src/app/historico/page.tsx
'use client';

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import GiroService, { GiroRecord } from "@/services/giroService";
import {
  Loader2,
  Trash2,
  Edit,
  MoreVertical,
  Clock,
  MapPin,
  Fuel,
  Lightbulb,
  FileText,
  Lock,
  Plus,
  BarChart4,
  Crown,
  Zap,
  Flame,
} from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatarMoeda } from "@/lib/calculations";
import { generateGiroReport } from "@/lib/pdfGenerator"; 
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link"; 
import { usePeriod } from "@/context/PeriodContext";

const EditGiroSchema = z.object({
  plataforma: z.string().min(1, "Selecione uma plataforma."),
  ganho_bruto: z.number().min(0.01, "Informe o ganho bruto."),
  horas: z.number().min(0.1, "Informe as horas trabalhadas."),
  km: z.number().min(0.1, "KM rodados devem ser maiores que zero."),
  cidade: z.string().optional(),
});

type EditGiroInput = z.infer<typeof EditGiroSchema>;

// --- COMPONENTE TELA VAZIA ---
const EmptyState = () => (
  <div className="text-center py-20 px-6 flex flex-col items-center animate-in fade-in duration-500">
      <div className="flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-900 shadow-sm mb-6">
          <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600" />
      </div>
      <h2 className="text-xl font-black text-gray-800 dark:text-white mb-2">Seu histórico começa aqui</h2>
      <p className="text-gray-500 max-w-xs mb-8">
          Assim que você registrar seu primeiro lucro no Dashboard, ele aparecerá aqui para análise.
      </p>
      <Link href="/">
          <Button className="h-12 px-6 font-bold text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5 mr-2"/>
              Registrar Primeiro Giro
          </Button>
      </Link>
  </div>
);

// --- CARD DE VENDA (PAYWALL) ---
const SaleCard = ({ totalRegistros }: { totalRegistros: number }) => {
    const features = [
        { icon: BarChart4, title: 'Histórico completo', desc: `Visualize todos os seus ${totalRegistros} giros sem limite.` },
        { icon: Zap, title: 'IA liberada', desc: 'Estratégias táticas ilimitadas para qualquer cidade.' },
        { icon: FileText, title: 'Relatórios premium', desc: 'PDF avançado e exportações profissionais.' },
    ];

    return (
        <Card className="mt-8 border-0 shadow-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 text-white animate-in fade-in duration-500">
            <CardContent className="p-6 lg:p-8 space-y-6">
                <div className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30">
                        <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] font-bold text-white/70">GiroPro+</p>
                        <h3 className="text-2xl font-black">Liberte todo o seu histórico</h3>
                    </div>
                    <p className="text-sm text-white/80 max-w-xl mx-auto">
                        Você está visualizando apenas os 7 registros mais recentes, mas já acumulou <strong className="text-white">{totalRegistros}</strong> viagens.
                        Faça upgrade para desbloquear todo o potencial do seu passado e da IA.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.title} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 text-left space-y-2">
                            <feature.icon className="w-6 h-6 text-white" />
                            <p className="text-sm font-black">{feature.title}</p>
                            <p className="text-xs text-white/80">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                <Link href="/giropro-plus" className="block">
                    <Button className="w-full h-12 text-lg font-bold bg-white text-orange-600 hover:bg-orange-50 rounded-2xl shadow-lg shadow-black/10">
                        Quero ser PRO
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
};


export default function HistoricoPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { range } = usePeriod();
  const [history, setHistory] = useState<GiroRecord[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0); // Novo
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGiro, setSelectedGiro] = useState<GiroRecord | null>(null);
  const [resumoSemanal, setResumoSemanal] = useState('');
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const plataformasDisponiveis = ['Uber', '99', 'iFood', 'Rappi', 'Shopee', 'Amazon', 'Loggi', 'Outro'];
  const isPro = !!profile?.is_pro;
  const custoPadrao = profile?.custo_km ?? 0.5;

  const form = useForm<EditGiroInput>({
    resolver: zodResolver(EditGiroSchema),
    defaultValues: { plataforma: 'Uber', ganho_bruto: 0, horas: 0, km: 0, cidade: '' },
  });

  const userId = user?.id;

  // MUDANÇA AQUI: Aceita o status 'isPro'
  const fetchHistory = useCallback(
    async (userIsPro: boolean) => {
      if (!userId) return;
      setLoading(true);
      const { data, totalCount } = await GiroService.fetchGiroHistory(userId, userIsPro);
      if (data) setHistory(data);
      if (totalCount) setTotalRegistros(totalCount);
      setLoading(false);
    },
    [userId]
  );

  useEffect(() => {
    if (!user || profileLoading) return;
    fetchHistory(isPro);
  }, [user, isPro, profileLoading, fetchHistory]);

  const gerarResumoSemanal = async () => {
    if (!userId) return;
    setLoadingResumo(true);
    try {
      const prompt = `Resuma meus últimos giros. Lucro total: ${formatarMoeda(totalLucroExibido)}, horas ${totalHorasExibidas.toFixed(1)}, km ${totalKmExibidos.toFixed(0)}. Crie insight motivacional.`;
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidade: 'Histórico', prompt }),
      });
      const data = await response.json();
      setResumoSemanal(data.insight || 'Continue acelerando!');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível gerar o insight.');
    } finally {
      setLoadingResumo(false);
    }
  };

  const handleExportPDF = () => {
    if (!isPro) {
      toast.error('Disponível apenas no GiroPro+');
      return;
    }
    if (!history.length) {
      toast.error('Não há dados suficientes para exportar.');
      return;
    }
    const registrosPDF = history.map((giro) => ({
      data: (giro as any).data,
      plataforma: giro.plataforma || '',
      ganho_bruto: giro.ganho_bruto ?? giro.ganhos_brutos ?? 0,
      lucro: giro.lucro ?? giro.lucro_liquido ?? 0,
      km: giro.km ?? 0,
    }));
    const userName = user?.user_metadata?.full_name || 'Motorista';
    generateGiroReport(registrosPDF, userName);
    toast.success('Relatório PDF gerado.');
  };

  const handleDelete = async () => {
    if (!selectedGiro) return;
    setIsDeleting(true);
    try {
      const { success, error } = await GiroService.deleteGiro(selectedGiro.id);
      if (!success) throw error;
      setHistory((prev) => prev.filter((g) => g.id !== selectedGiro.id));
      toast.success('Giro deletado.');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível deletar o giro.');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setSelectedGiro(null);
    }
  };

  const handleOpenEdit = (giro: GiroRecord) => {
    setSelectedGiro(giro);
    form.reset({
      plataforma: giro.plataforma || 'Uber',
      ganho_bruto: giro.ganho_bruto ?? giro.ganhos_brutos ?? 0,
      horas: giro.horas ?? 0,
      km: giro.km ?? giro.km_rodados ?? 0,
      cidade: giro.cidade || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (data: EditGiroInput) => {
    if (!selectedGiro) return;
    setIsSavingEdit(true);
    try {
      const custoBase = selectedGiro.custo_km ?? custoPadrao;
      const gastoTotal = data.km * custoBase;
      const lucro = data.ganho_bruto - gastoTotal;
      const updates = {
        plataforma: data.plataforma,
        ganho_bruto: data.ganho_bruto,
        horas: data.horas,
        km: data.km,
        cidade: data.cidade,
        custo_km: custoBase,
        lucro,
      };
      const { success, data: updated, error } = await GiroService.updateGiro(selectedGiro.id, updates);
      if (!success || !updated) throw error;
      setHistory((prev) => prev.map((g) => (g.id === selectedGiro.id ? { ...g, ...updated } : g)));
      toast.success('Giro atualizado!');
      setIsEditDialogOpen(false);
      setSelectedGiro(null);
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar as alterações.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  let lastMonth = "";
  const filteredHistory = useMemo(() => {
      const startTime = new Date(range.start).getTime();
      const endTime = new Date(range.end).getTime();
      return history.filter((giro) => {
          const reference = giro.created_at || (giro as any).data;
          if (!reference) return false;
          const giroTime = new Date(reference).getTime();
          if (Number.isNaN(giroTime)) return false;
          return giroTime >= startTime && giroTime <= endTime;
      });
  }, [history, range.start, range.end]);

  const totalLucroExibido = filteredHistory.reduce((acc, giro) => acc + (giro.lucro ?? giro.lucro_liquido ?? 0), 0);
  const totalHorasExibidas = filteredHistory.reduce((acc, giro) => acc + (giro.horas ?? 0), 0);
  const totalKmExibidos = filteredHistory.reduce((acc, giro) => acc + (giro.km ?? 0), 0);
  const melhorGiro = filteredHistory.reduce((prev, curr) => {
      const currLucro = curr.lucro ?? curr.lucro_liquido ?? 0;
      const prevLucro = prev ? (prev.lucro ?? prev.lucro_liquido ?? 0) : 0;
      return currLucro > prevLucro ? curr : prev;
  }, null as GiroRecord | null);
  const heroStats = [
      { label: 'Lucro exibido', value: formatarMoeda(totalLucroExibido) },
      { label: 'Horas rodadas', value: `${totalHorasExibidas.toFixed(1)}h` },
      { label: 'KM registrados', value: `${totalKmExibidos.toFixed(0)} km` },
      { label: 'Melhor giro', value: melhorGiro ? formatarMoeda(melhorGiro.lucro ?? melhorGiro.lucro_liquido ?? 0) : '--' },
  ];

  return (
    <ProtectedRoute>
      <div className="container max-w-2xl mx-auto py-8 px-4 pb-32 space-y-6">
        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white rounded-3xl p-6 shadow-2xl border border-zinc-800">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-500 font-bold">Linha do tempo</p>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                            <Clock className="w-8 h-8 text-orange-400" /> Histórico
                        </h1>
                        <p className="text-sm text-zinc-400 mt-1">
                            {melhorGiro
                              ? `Melhor giro: ${formatarMoeda(melhorGiro.lucro ?? melhorGiro.lucro_liquido ?? 0)} em ${new Date(melhorGiro.created_at || (melhorGiro as any).data || '').toLocaleDateString('pt-BR')}`
                              : 'Adicione giros para começar a análise.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={gerarResumoSemanal} disabled={loadingResumo} className="bg-white text-zinc-900 rounded-full px-4">
                            {loadingResumo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />} {loadingResumo ? 'Gerando...' : 'Insight semanal'}
                        </Button>
                        <Button onClick={handleExportPDF} className={`rounded-full px-4 ${isPro ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/10 text-zinc-300 border border-white/20'}`}>
                            {isPro ? <FileText className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />} {isPro ? 'Baixar PDF' : 'Relatório PRO'}
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {heroStats.map(stat => (
                        <div key={stat.label} className="bg-white/5 rounded-2xl border border-white/10 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">{stat.label}</p>
                            <p className="text-xl font-black">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {resumoSemanal && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-orange-100 dark:border-orange-900 rounded-2xl p-5 mb-8 animate-in fade-in slide-in-from-top-2">
                <p className="text-gray-800 dark:text-gray-200 italic font-medium">&ldquo;{resumoSemanal}&rdquo;</p>
            </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : history.length === 0 ? (
          <EmptyState /> 
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400">
            Nenhum giro no período selecionado.
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in duration-300">
            {filteredHistory.map((giro) => {
                // ... (lógica de renderização do card)
                const dataObj = new Date(giro.created_at || Date.now());
                const mesAtual = dataObj.toLocaleDateString("pt-BR", { month: 'long', year: 'numeric' });
                const mostrarHeader = mesAtual !== lastMonth;
                if (mostrarHeader) lastMonth = mesAtual;
                const lucro = giro.lucro ?? giro.lucro_liquido ?? 0;
                const ganhoBruto = giro.ganho_bruto ?? giro.ganhos_brutos ?? 0;
                const isHighProfit = lucro > 300;

                return (
                  <div key={giro.id}>
                    {mostrarHeader && ( <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-6 mb-3 ml-1 border-b border-gray-100 dark:border-gray-800 pb-1">{mesAtual}</h3> )}
                    <Card className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-[0.3em]">{dataObj.toLocaleDateString("pt-BR", { weekday: 'short' })}</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">{dataObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}</p>
                                    </div>
                                    {giro.plataforma && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-600 uppercase font-bold tracking-wide">{giro.plataforma}</span>}
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-black ${isHighProfit ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>{formatarMoeda(lucro)}</p>
                                    <p className="text-xs text-gray-400">Bruto {formatarMoeda(ganhoBruto)}</p>
                                    {isHighProfit && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold"><Flame className="w-3 h-3"/> Top dia</span>}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {giro.horas?.toFixed(1) || '0'}h</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {giro.cidade || 'Sem cidade'}</span>
                                <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> {giro.km?.toFixed(0) || 0} km</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 font-bold" onClick={() => handleOpenEdit(giro)}>
                                    Revisar giro
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"><MoreVertical className="h-4 w-4 text-gray-400" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenEdit(giro)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setSelectedGiro(giro); setIsDeleteDialogOpen(true); }} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Deletar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                  </div>
                );
            })}
            
            {/* Card de venda após atingir o limite */}
            {!isPro && history.length === 7 && (
                <SaleCard totalRegistros={totalRegistros} />
            )}

          </div>
        )}
        
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setSelectedGiro(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover giro</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o giro {selectedGiro ? `de ${new Date(selectedGiro.created_at).toLocaleDateString('pt-BR')}` : ''}? Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deletar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setSelectedGiro(null);
              form.reset();
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Revisar giro</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="plataforma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plataforma</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha uma plataforma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plataformasDisponiveis.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="ganho_bruto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ganho bruto (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="horas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KM rodados</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSavingEdit}>
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar alterações'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
