// src/app/financeiro/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  Wallet, TrendingDown, TrendingUp, PieChart as PieIcon, 
  Plus, Trash2, Calendar, DollarSign, PiggyBank, ShieldCheck, Check, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase'; 
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatarMoeda } from '@/lib/calculations';
import { usePeriod } from '@/context/PeriodContext';
import { generateTaxReport, fetchTaxReports, markTaxReportPaid, TaxReport, TaxReportType } from '@/services/taxService';
import { generateDarfPdf } from '@/lib/darfGenerator';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { useTaxEstimate } from '@/hooks/useTaxEstimate';
import { logAnalyticsEvent } from '@/services/analyticsService';

const CATEGORIAS = ['Moradia', 'Alimentação', 'Transporte (Pessoal)', 'Lazer', 'Saúde', 'Dívidas', 'Outros'];
const TAX_TYPE_OPTIONS: { value: TaxReportType; label: string; hint: string }[] = [
  { value: 'DARF', label: 'DARF (PF)', hint: 'Autônomo/Carnê-Leão' },
  { value: 'DAS', label: 'DAS (MEI)', hint: 'Microempreendedor Individual' },
];

type Despesa = {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data_despesa: string;
};

type GiroRow = {
  lucro: number | null;
};

export default function FinanceiroPage() {
  const { user } = useAuth();
  const { range } = usePeriod();
  const featureFlags = useFeatureFlags();
  const { profile, loading: profileLoading } = useUserProfile();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [lucroMes, setLucroMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [taxReports, setTaxReports] = useState<TaxReport[]>([]);
  const [generatingTax, setGeneratingTax] = useState(false);
  const [taxType, setTaxType] = useState<TaxReportType>('DARF');
  const isPro = !!profile?.is_pro;
  const accessChecked = !profileLoading;
  const taxEstimate = useTaxEstimate(user?.id, profile?.tax_rate);
  const effectiveTaxRate = typeof profile?.tax_rate === 'number' && profile.tax_rate > 0 ? profile.tax_rate : 0.115;
  const userId = user?.id || null;

  // Form
  const cleanDigits = (value: string) => value.replace(/\D/g, '');
  const sanitizeDescricao = (value: string) => value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,-]/g, '').slice(0, 60);
  const formatCurrencyInput = (value: string) => {
    const digits = cleanDigits(value).slice(0, 8); // até 999.999,99
    if (!digits) return '';
    const number = Number(digits) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const parseCurrency = (value: string) => Number(value.replace(/\./g, '').replace(',', '.'));

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);

  const carregarDados = useCallback(async () => {
    if (!userId) return;
    const inicioPeriodo = range.start;
    try {
      const { data: giros } = await (supabase as any)
        .from('registros')
        .select('lucro')
        .eq('user_id', userId)
        .gte('data', inicioPeriodo)
        .lte('data', range.end);

      const totalLucro = giros?.reduce((acc: number, registro: any) => acc + (registro.lucro || 0), 0) || 0;
      setLucroMes(totalLucro);

      const { data: gastos } = await (supabase as any)
        .from('despesas_pessoais')
        .select('*')
        .eq('user_id', userId)
        .gte('data_despesa', inicioPeriodo)
        .lte('data_despesa', range.end)
        .order('data_despesa', { ascending: false });

      if (gastos) {
        setDespesas(gastos as Despesa[]);
      } else {
        setDespesas([]);
      }

      try {
        const reports = await fetchTaxReports(userId, range.start, range.end);
        setTaxReports(reports);
      } catch (error) {
        console.error('Erro ao buscar relatórios fiscais', error);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, range.start, range.end]);

  useEffect(() => {
    if (!user || !accessChecked) return;
    if (!isPro) {
      setLoading(false);
      return;
    }
    setLoading(true);
    carregarDados();
  }, [user, isPro, accessChecked, carregarDados]);

  const handleAddDespesa = async () => {
      if (!descricao || !valor) return toast.error("Preencha os campos.");
      const valorNumber = parseCurrency(valor);
      if (!valorNumber || valorNumber <= 0) return toast.error("Informe um valor válido.");
      if (!userId) return toast.error('Faça login para salvar despesas.');
      
      const novaDespesa: Omit<Despesa, 'id'> = {
          user_id: userId,
          descricao: descricao.trim(),
          valor: valorNumber,
          categoria,
          data_despesa: new Date().toISOString()
      };

      const { error } = await supabase.from('despesas_pessoais').insert(novaDespesa);

      if (!error) {
          toast.success("Despesa salva!");
          setDescricao(''); setValor('');
          carregarDados(); // Recarrega
      } else {
          toast.error("Erro ao salvar.");
      }
  };

  const handleDelete = async (id: string) => {
      const { error } = await supabase.from('despesas_pessoais').delete().eq('id', id);
      if (!error) {
          toast.success("Removido.");
          setDespesas(prev => prev.filter(d => d.id !== id));
      }
  };

  const handleGenerateTaxReport = async () => {
      if (!user) return;
      setGeneratingTax(true);
      try {
      const report = await generateTaxReport(user.id, range.start, range.end, profile?.tax_rate, taxType);
          setTaxReports(prev => [report, ...prev]);
          const label = report.type === 'DAS' ? 'DAS (MEI)' : 'DARF';
          toast.success(`${label} gerado: ${formatarMoeda(report.amount)}`);
          generateDarfPdf(report, {
            full_name: profile?.full_name || user.user_metadata?.full_name,
            cpf: profile?.cpf || (profile as any)?.documento,
          });
          logAnalyticsEvent(user.id, 'tax_report_generated', {
            type: report.type,
            amount: report.amount,
            period_start: range.start,
            period_end: range.end,
          }).catch(() => {});
      } catch (error) {
          console.error(error);
          toast.error('Erro ao gerar guia fiscal');
      } finally {
          setGeneratingTax(false);
      }
  };

  const handleMarkTaxPaid = async (reportId: string) => {
      try {
          const updated = await markTaxReportPaid(reportId);
          setTaxReports(prev => prev.map(r => r.id === updated.id ? updated : r));
          toast.success('Relatório marcado como pago.');
      } catch (error) {
          console.error(error);
          toast.error('Não foi possível atualizar.');
      }
  };

  // Cálculos
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const saldoFinal = lucroMes - totalDespesas;

  // Dados para o Gráfico
  const dadosGrafico = CATEGORIAS.map(cat => ({
      name: cat,
      value: despesas.filter(d => d.categoria === cat).reduce((acc, d) => acc + d.valor, 0)
  })).filter(d => d.value > 0);
  const pieColors = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#ef4444', '#8b5cf6', '#6b7280'];
  const currentTaxReport = useMemo(() => {
    if (!taxReports.length) return null;
    const match = taxReports.find((report) => report.type === taxType);
    return match ?? taxReports[0];
  }, [taxReports, taxType]);
  const taxFeatureEnabled = featureFlags.tax_reports.enabled;
  const taxTypeLabel = taxType === 'DAS' ? 'DAS (MEI)' : 'DARF (PF)';

  if (!accessChecked) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!isPro) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              <ShieldCheck className="w-12 h-12 text-orange-500" />
              <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 font-bold">Financeiro PRO+</p>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Controle fiscal exclusivo para assinantes</h1>
              <p className="text-sm text-gray-500">
                Geração automática de DARF/MEI, relatórios bancários e monitoramento de impostos fazem parte do pacote Pro+. 
                Assine para liberar esse cockpit financeiro completo.
              </p>
            </div>
            <div className="space-y-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Gerar DARF/DAS com seus dados e histórico de pagamentos.</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Relatórios oficiais em PDF para bancos e locadoras.</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Alertas fiscais inteligentes e acompanhamento do lucro líquido real.</span>
              </div>
            </div>
            <Link href="/giropro-plus">
              <Button className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 rounded-2xl">
                Desbloquear com Pro+
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-32 pt-8 px-4 font-sans">
      <div className="container max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white rounded-3xl p-6 shadow-2xl border border-zinc-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-500 font-bold mb-2 flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-orange-300" /> Centro Financeiro
                    </p>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                        <PiggyBank className="w-8 h-8 text-orange-400"/> Minhas Finanças
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">Veja para onde o lucro está indo e ajuste seu mês.</p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Saldo livre</p>
                    <p className={`text-3xl font-black ${saldoFinal >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatarMoeda(saldoFinal)}
                    </p>
                    <p className="text-[11px] text-zinc-500">Lucro {formatarMoeda(lucroMes)} • Despesas {formatarMoeda(totalDespesas)}</p>
                </div>
            </div>
        </div>
        <Card className="border border-zinc-100 dark:border-zinc-800 shadow-lg">
          <CardContent className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Imposto estimado (mês)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {formatarMoeda(taxEstimate.estimate)}
                </span>
                <span className="text-xs text-gray-500">({formatarMoeda(taxEstimate.lucro)} de lucro)</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Taxa aplicada: {(effectiveTaxRate * 100).toFixed(1)}%
              </p>
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold mb-1">Tipo de guia</p>
                <div className="inline-flex rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden text-xs font-semibold">
                  {TAX_TYPE_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => setTaxType(option.value)}
                      className={`px-4 py-2 transition-colors ${
                        taxType === option.value
                          ? 'bg-orange-600 text-white'
                          : 'bg-transparent text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {TAX_TYPE_OPTIONS.find((option) => option.value === taxType)?.hint}
                </p>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Os valores e guias são estimativas para auxiliar seu controle. A emissão oficial do DARF/DAS deve ser feita nos sistemas da Receita (Carnê-Leão, PGMEI ou e-CAC).
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              {isPro ? (
                <>
                  <Button 
                    onClick={handleGenerateTaxReport} 
                    disabled={generatingTax || taxEstimate.estimate <= 0}
                    className="flex-1 md:flex-none bg-orange-600 hover:bg-orange-700 text-white rounded-2xl"
                  >
                    {generatingTax ? 'Gerando...' : `Gerar ${taxType === 'DAS' ? 'DAS' : 'DARF'} agora`}
                  </Button>
                  <Link href="/financeiro" className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full rounded-2xl border-dashed">
                      Ver relatórios
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/giropro-plus" className="flex-1 md:flex-none">
                  <Button className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold">
                    Ativar Pro+ e gerar DARF
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OBRIGAÇÕES FISCAIS */}
        {isPro && taxFeatureEnabled ? (
            <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white rounded-3xl p-6 shadow-2xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Obrigações fiscais</p>
                        <h2 className="text-2xl font-black">{taxTypeLabel}</h2>
                        <p className="text-sm text-gray-400">Período selecionado ({new Date(range.start).toLocaleDateString('pt-BR')} - {new Date(range.end).toLocaleDateString('pt-BR')})</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase">Status</p>
                        <p className="text-lg font-black">{currentTaxReport ? (currentTaxReport.status === 'paid' ? 'Pago' : 'Pendente') : 'Não gerado'}</p>
                        {currentTaxReport && <p className="text-[11px] text-gray-400">Vencimento: {currentTaxReport.due_date ? new Date(currentTaxReport.due_date).toLocaleDateString('pt-BR') : '--'}</p>}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleGenerateTaxReport} disabled={generatingTax} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-6">
                        {generatingTax ? 'Gerando...' : `Gerar ${taxType === 'DAS' ? 'DAS' : 'DARF'} do período`}
                    </Button>
                    {currentTaxReport && currentTaxReport.status !== 'paid' && (
                        <Button variant="ghost" onClick={() => handleMarkTaxPaid(currentTaxReport.id)} className="rounded-full border border-white/20 text-white">
                            Marcar como pago
                        </Button>
                    )}
                    {currentTaxReport && (
                        <p className="text-sm text-gray-300 font-medium">Valor: {formatarMoeda(currentTaxReport.amount)}</p>
                    )}
                </div>
            </div>
        ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg space-y-3">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Compliance PRO</p>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Gere DARF/DAS automaticamente</h3>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assine o GiroPro+ para receber alertas fiscais e relatórios aceitos em bancos e financiamentos.</p>
                <Link href="/giropro-plus">
                    <Button className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold">Liberar no Pro+</Button>
                </Link>
            </div>
        )}

        {/* BALANÇO DO MÊS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FinanceCard
                title="Lucro do App (mês)"
                value={formatarMoeda(lucroMes)}
                icon={<TrendingUp className="w-4 h-4" />}
                bg="bg-emerald-500/10"
                accent="text-emerald-400"
            />
            <FinanceCard
                title="Gastos pessoais"
                value={`- ${formatarMoeda(totalDespesas)}`}
                icon={<TrendingDown className="w-4 h-4" />}
                bg="bg-red-500/10"
                accent="text-red-400"
            />
            <FinanceCard
                title="Saldo real livre"
                value={formatarMoeda(saldoFinal)}
                icon={<Wallet className="w-4 h-4" />}
                bg="bg-white dark:bg-gray-900"
                accent={saldoFinal >= 0 ? 'text-emerald-500' : 'text-red-500'}
                border
            />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            
            {/* COLUNA 1: ADICIONAR + LISTA */}
            <div className="space-y-6">
                {/* Form */}
                <Card className="border-0 shadow-md rounded-3xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-4 h-4 text-orange-500" /> Novo lançamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                             <Input
                                placeholder="Descrição (Ex: Aluguel)"
                                value={descricao}
                                maxLength={60}
                                onChange={e => setDescricao(sanitizeDescricao(e.target.value))}
                             />
                             <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Valor (R$)"
                                value={valor}
                                onChange={e => setValor(formatCurrencyInput(e.target.value))}
                             />
                        </div>
                        <Select value={categoria} onValueChange={setCategoria}>
                            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddDespesa} className="w-full rounded-2xl bg-orange-600 text-white hover:bg-orange-700">Adicionar despesa</Button>
                    </CardContent>
                </Card>

                {/* Lista */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" /> Últimos gastos
                    </h3>
                    {despesas.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Nenhuma despesa lançada este mês.</p>
                    ) : (
                        despesas.map(d => (
                            <div key={d.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                                        {d.categoria === 'Moradia' && <TrendingDown className="w-4 h-4"/>}
                                        {d.categoria !== 'Moradia' && <DollarSign className="w-4 h-4"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{d.descricao}</p>
                                        <p className="text-xs text-gray-500">{new Date(d.data_despesa).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-red-600">- {formatarMoeda(d.valor)}</span>
                                    <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* COLUNA 2: GRÁFICO */}
            <div>
                <Card className="border-0 shadow-md rounded-3xl h-full min-h-[400px] flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <PieIcon className="w-5 h-5 text-orange-500"/> Para onde vai o dinheiro?
                        </CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Distribuição das despesas pessoais neste mês.</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {dadosGrafico.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dadosGrafico} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                        {dadosGrafico.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados para o gráfico.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

function FinanceCard({
    title,
    value,
    icon,
    bg,
    accent,
    border = false,
}: {
    title: string;
    value: string;
    icon: ReactNode;
    bg: string;
    accent: string;
    border?: boolean;
}) {
    return (
        <Card className={`${border ? 'border-2 border-gray-100 dark:border-gray-800' : 'border-0'} shadow-md rounded-3xl ${bg}`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-white/60 dark:bg-black/20 ${accent}`}>{icon}</div>
                </div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 font-bold">{title}</p>
                <p className={`text-3xl font-black mt-2 ${accent}`}>{value}</p>
            </CardContent>
        </Card>
    );
}
