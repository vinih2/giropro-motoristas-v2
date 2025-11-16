// src/app/historico/page.tsx
'use client';

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import GiroService, { GiroRecord } from "@/services/giroService";
import { 
  Loader2, Trash2, Edit, MoreVertical, DollarSign, 
  Clock, Calendar, MapPin, TrendingUp, Fuel, Save, 
  Lightbulb, Flame, FileText, Lock, Plus, BarChart4, Crown, Zap 
} from "lucide-react"; // Adicionados Crown e Zap
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { calculateGiroPro, formatarMoeda, GiroFormSchema } from "@/lib/calculations";
import { generateGiroReport } from "@/lib/pdfGenerator"; 
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import Link from "next/link"; 

type GiroInput = z.infer<typeof GiroFormSchema>;

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

// --- COMPONENTE CARD DE UPGRADE (PAYWALL) ---
const UpgradeCard = ({ totalRegistros }: { totalRegistros: number }) => {
    return (
        <Card className="mt-8 border-4 border-orange-500 shadow-2xl bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/10 dark:to-yellow-900/10 animate-in fade-in duration-500">
            <CardContent className="p-6 text-center">
                <div className="mx-auto bg-orange-100 dark:bg-orange-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-4 ring-white dark:ring-black">
                    <Crown className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Desbloqueie seu Histórico Completo</h3>
                <p className="text-gray-500 mt-2 mb-6">
                    Você está vendo apenas os 7 registros mais recentes. Você tem <strong className="text-gray-700 dark:text-white">{totalRegistros}</strong> registros salvos.
                    Faça upgrade para ver tudo!
                </p>
                <Link href="/giropro-plus">
                    <Button className="w-full h-12 text-lg font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20">
                        <Zap className="w-4 h-4 mr-2 fill-white" /> Liberar Acesso PRO
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
};


export default function HistoricoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<GiroRecord[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0); // Novo
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGiro, setSelectedGiro] = useState<GiroRecord | null>(null);
  const [resumoSemanal, setResumoSemanal] = useState('');
  const [loadingResumo, setLoadingResumo] = useState(false);

  const form = useForm<GiroInput>({
    resolver: zodResolver(GiroFormSchema),
    defaultValues: { valor_combustivel: 0, km_rodados: 0, consumo_medio: 0, ganhos_brutos: 0, comissao_app: 0, outros_gastos: 0, tipo_combustivel: "gasolina", cidade: "" },
  });

  useEffect(() => {
    if (user) {
        GiroService.fetchUserProfile(user.id).then(({ data }) => { 
            // @ts-ignore
            const userIsPro = !!data?.is_pro;
            setIsPro(userIsPro); 
            fetchHistory(userIsPro); // Passa o status pro para o fetch
        });
    }
  }, [user]);

  // MUDANÇA AQUI: Aceita o status 'isPro'
  const fetchHistory = async (userIsPro: boolean) => {
    if (!user) return;
    setLoading(true);
    const { data, totalCount } = await GiroService.fetchGiroHistory(user.id, userIsPro); 
    if (data) setHistory(data);
    if (totalCount) setTotalRegistros(totalCount);
    setLoading(false);
  };

  const gerarResumoSemanal = async () => {
    // ... (função mantida) ...
  };
  const handleExportPDF = () => {
    // ... (função mantida) ...
  };
  const handleDelete = async () => {
    // ... (função mantida) ...
  };
  const handleOpenEdit = (giro: GiroRecord) => {
    // ... (função mantida) ...
  };
  const handleSaveEdit = async (data: GiroInput) => {
    // ... (função mantida) ...
  };

  let lastMonth = "";

  return (
    <ProtectedRoute>
      <div className="container max-w-2xl mx-auto py-8 px-4 pb-32">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-orange-500" /> Histórico
            </h1>
        </div>
        
        {(history.length > 0 || loadingResumo) && (
            <div className="mb-6 flex flex-wrap justify-center gap-3">
                <Button onClick={gerarResumoSemanal} disabled={loadingResumo} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 transition-all rounded-full px-4">
                    {loadingResumo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />} {loadingResumo ? 'Gerando...' : 'Insight Semanal'}
                </Button>
                <Button onClick={handleExportPDF} className={`shadow-sm border transition-all rounded-full px-4 ${isPro ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:border-gray-700'}`}>
                    {isPro ? <FileText className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />} {isPro ? 'Baixar PDF' : 'Relatório PDF (PRO)'}
                </Button>
            </div>
        )}

        {resumoSemanal && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-orange-100 dark:border-orange-900 rounded-2xl p-5 mb-8 animate-in fade-in slide-in-from-top-2">
                <p className="text-gray-800 dark:text-gray-200 italic font-medium">"{resumoSemanal}"</p>
            </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
        ) : history.length === 0 ? (
          <EmptyState /> 
        ) : (
          <div className="space-y-3 animate-in fade-in duration-300">
            {history.map((giro) => {
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
                    <Card className={`border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm ${isHighProfit ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-gray-300 dark:border-l-gray-700'}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{dataObj.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}</span>
                                    {giro.plataforma && <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 uppercase font-bold tracking-wide">{giro.plataforma}</span>}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/> Bruto: {formatarMoeda(ganhoBruto)}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {giro.cidade || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className={`text-lg font-black ${isHighProfit ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>{formatarMoeda(lucro)}</p>
                                    {isHighProfit && <span className="text-[10px] text-green-600 font-bold flex justify-end items-center gap-1"><Flame className="w-3 h-3"/> TOP</span>}
                                </div>
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
            
            {/* ADICIONA O CARD DE UPGRADE (se não for Pro e tiver atingido o limite) */}
            {!isPro && history.length === 7 && (
                <UpgradeCard totalRegistros={totalRegistros} />
            )}

          </div>
        )}
        
        {/* Modais de Deletar e Editar (sem alterações) */}
        {/* ... (AlertDialog e Dialog) ... */}
      </div>
    </ProtectedRoute>
  );
}