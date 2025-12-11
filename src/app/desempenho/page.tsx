// src/app/desempenho/page.tsx
'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { formatarMoeda } from '@/lib/calculations';
import {
  Clock, Navigation, DollarSign, TrendingUp, 
  Calendar, Loader2, BrainCircuit, Sparkles, BarChart4, Plus, Crown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { usePeriod } from '@/context/PeriodContext';
import { logAnalyticsEvent } from '@/services/analyticsService';
import type { TooltipProps } from 'recharts';

interface Registro {
  id: number; user_id: string; data: string; plataforma: string;
  horas: number; km: number; ganho_bruto: number; custo_km: number; lucro: number;
}

// --- COMPONENTE TELA VAZIA (NOVO) ---
const EmptyState = () => (
    <div className="text-center py-20 px-6 flex flex-col items-center animate-in fade-in duration-500">
        <div className="flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-900 shadow-sm mb-6">
            <BarChart4 className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        </div>
        <h2 className="text-xl font-black text-gray-800 dark:text-white mb-2">Sem Dados para Análise</h2>
        <p className="text-gray-500 max-w-xs mb-8">
            O desempenho é calculado com base nos seus giros. Registre seus ganhos no Dashboard para ver seus gráficos de evolução.
        </p>
        <Link href="/">
            <Button className="h-12 px-6 font-bold text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                <Plus className="w-5 h-5 mr-2"/>
                Registrar Giro
            </Button>
        </Link>
    </div>
);

const LucroTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const value = typeof payload[0].value === 'number' ? payload[0].value : 0;
  return (
    <div className="rounded-2xl bg-zinc-900/95 border border-white/10 px-4 py-3 shadow-xl min-w-[160px]">
      <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-500 font-bold mb-1">Dia {label}</p>
      <p className="text-lg font-black text-white">{formatarMoeda(value)}</p>
      <p className="text-[11px] text-zinc-400 mt-1">Lucro líquido registrado</p>
    </div>
  );
};

function DesempenhoContent() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { range } = usePeriod();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [analiseIA, setAnaliseIA] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const isPro = !!profile?.is_pro;
  const accessChecked = !profileLoading;

  const userId = user?.id;

  const carregarDados = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
        .from('registros')
        .select('*')
        .eq('user_id', userId)
        .gte('data', range.start)
        .lte('data', range.end)
        .order('data', { ascending: true });
    if (error) {
      setRegistros([]);
    } else if (data) {
      setRegistros(data);
    }
    setLoading(false);
  }, [userId, range.start, range.end]);

  useEffect(() => {
    if (!user || !isPro) return;
    setLoading(true);
    carregarDados();
  }, [user, isPro, carregarDados]);

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-2xl p-10 text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              <Crown className="w-12 h-12 text-orange-500" />
              <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 font-bold">Desempenho avançado</p>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">Gráficos e IA liberados no Pro+</h1>
              <p className="text-sm text-gray-500">
                Comparativos mensais, ticket médio, análise automática por IA e relatórios visuais fazem parte da assinatura.
                Atualize para enxergar a performance completa da sua operação.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Análises táticas do seu mês com IA (sem limite).</span>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Gráficos de lucro diário, plataformas e ticket médio.</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-500 mt-0.5" />
                <span>Comparativo de horas, km e metas com histórico completo.</span>
              </div>
            </div>
            <Link href="/giropro-plus">
              <Button className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 rounded-2xl">
                Desbloquear Desempenho Pro+
              </Button>
            </Link>
          </div>
      </div>
    );
  }

  // --- Cálculos ---
  const registrosPeriodo = registros;
  const lucroMensal = registrosPeriodo.reduce((acc, r) => acc + (r.lucro || 0), 0);
  const totalHoras = registrosPeriodo.reduce((acc, r) => acc + (r.horas || 0), 0);
  const totalKm = registrosPeriodo.reduce((acc, r) => acc + (r.km || 0), 0);
  const mediaHora = totalHoras > 0 ? lucroMensal / totalHoras : 0;
  const mediaKm = totalKm > 0 ? lucroMensal / totalKm : 0;

  const dadosDiariosMap = new Map<string, { data: string; lucro: number }>();
  registrosPeriodo.forEach((registro) => {
    const dia = new Date(registro.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!dadosDiariosMap.has(dia)) {
      dadosDiariosMap.set(dia, { data: dia, lucro: registro.lucro || 0 });
    } else {
      const diaAtual = dadosDiariosMap.get(dia);
      if (diaAtual) {
        diaAtual.lucro += registro.lucro || 0;
      }
    }
  });
  const dadosGrafico = Array.from(dadosDiariosMap.values());

  const platMap: Record<string, number> = {};
  registrosPeriodo.forEach(r => platMap[r.plataforma || 'Outro'] = (platMap[r.plataforma || 'Outro'] || 0) + 1);
  const dadosPizza = Object.entries(platMap).map(([name, value]) => ({ name, value }));
  const CORES_PIZZA = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6'];
  const diasAtivos = registrosPeriodo.reduce((set, r) => set.add(new Date(r.data).toDateString()), new Set<string>()).size;
  const ticketMedio = diasAtivos > 0 ? lucroMensal / diasAtivos : 0;
  const melhorDia = dadosGrafico.reduce(
    (prev, curr) => (curr.lucro > prev.lucro ? curr : prev),
    dadosGrafico[0] || { data: '--', lucro: 0 }
  );
  const heroStats = [
      { label: 'Lucro no mês', value: formatarMoeda(lucroMensal) },
      { label: 'Ticket por dia', value: formatarMoeda(ticketMedio) },
      { label: 'Horas investidas', value: `${totalHoras.toFixed(1)}h` },
      { label: 'Dias ativos', value: diasAtivos.toString() },
  ];

  const gerarAnalise = async () => {
    if (!registros.length) return;
    setLoadingIA(true);
    try {
      const res = await fetch('/api/generate-insight', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Analise meu mês: Lucro R$ ${lucroMensal}, Média/h R$ ${mediaHora}. Dê uma dica de ouro.` }),
      });
      const data = await res.json();
      setAnaliseIA(data.insight);
      logAnalyticsEvent(userId, 'coach_analysis_generated', {
        periodo: `${new Date(range.start).toISOString()}_${new Date(range.end).toISOString()}`,
        lucro: lucroMensal,
        media_hora: mediaHora,
      }).catch(() => {});
    } catch {} finally { setLoadingIA(false); }
  };

  // --- LÓGICA DE EXIBIÇÃO ---
  if (loading) {
      return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  }
  if (registros.length === 0) {
      return <EmptyState />; // MOSTRA A TELA VAZIA
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32 pt-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white rounded-3xl p-6 shadow-2xl border border-zinc-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-zinc-500 font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-300" /> Performance Radar
                    </p>
                    <h1 className="text-3xl font-black tracking-tight">Seu mês em alta</h1>
                    <p className="text-sm text-zinc-400 mt-2">Melhor dia {melhorDia?.data || '--'} com {formatarMoeda(melhorDia?.lucro || 0)} de lucro.</p>
                </div>
                <Badge className="bg-orange-500/20 text-orange-200 border border-orange-500/30 px-3 py-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Este mês
                </Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                {heroStats.map((stat) => (
                    <div key={stat.label} className="bg-white/5 rounded-2xl px-4 py-3 border border-white/10">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold">{stat.label}</p>
                        <p className="text-2xl font-black mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/historico">
                    <Button variant="secondary" className="bg-white text-zinc-900 font-bold rounded-full px-6 py-2 hover:bg-zinc-100">
                        Ver histórico completo
                    </Button>
                </Link>
                <Link href="/insights">
                    <Button variant="ghost" className="border border-white/20 text-white rounded-full px-6 py-2 hover:bg-white/10">
                        Abrir insights
                    </Button>
                </Link>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Lucro Líquido" value={formatarMoeda(lucroMensal)} icon={<DollarSign />} highlight="Meta atingida" />
            <KpiCard title="Média / Hora" value={formatarMoeda(mediaHora)} icon={<Clock />} helper="Quanto você fez por hora ativa." />
            <KpiCard title="Média / KM" value={formatarMoeda(mediaKm)} icon={<Navigation />} helper="Lucro a cada km rodado." />
        </div>

        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> Curva de Lucro
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[300px] bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-black relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico} margin={{ top: 24, right: 24, left: 24, bottom: 12 }}>
                        <defs>
                            <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fb923c" stopOpacity={0.55}/>
                                <stop offset="70%" stopColor="#fb923c" stopOpacity={0.08}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="1 6" stroke="#d4d4d8" opacity={0.4} />
                        <XAxis
                          dataKey="data"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#a1a1aa', fontSize: 12 }}
                          tickMargin={12}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: '#a1a1aa', fontSize: 11 }}
                          tickFormatter={(value) => formatarMoeda(value).replace('R$', '').trim()}
                          width={70}
                          tickMargin={8}
                        />
                        <Tooltip content={<LucroTooltip />} cursor={{ stroke: '#fb923c', strokeWidth: 1, opacity: 0.2 }} />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 6" />
                        <Area
                          type="monotone"
                          dataKey="lucro"
                          stroke="#fb923c"
                          strokeWidth={3}
                          fill="url(#colorLucro)"
                          dot={{ r: 3, strokeWidth: 2, stroke: '#fff', fill: '#fb923c' }}
                          activeDot={{ r: 5, strokeWidth: 0, fill: '#fdba74' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-0 shadow-md rounded-3xl ring-1 ring-zinc-100 dark:ring-zinc-800">
                <CardHeader><CardTitle className="text-base font-bold">Plataformas</CardTitle></CardHeader>
                <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={dadosPizza} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {dadosPizza.map((_, index) => <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="md:col-span-2 border-0 shadow-md rounded-3xl bg-zinc-900 text-white relative overflow-hidden flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg"><BrainCircuit className="w-6 h-6 text-orange-400"/></div>
                            <h3 className="font-bold text-lg">Análise do Coach</h3>
                        </div>
                        <Button onClick={gerarAnalise} disabled={loadingIA} size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-4">
                            {loadingIA ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Gerar'}
                        </Button>
                    </div>
                    {analiseIA ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-zinc-300 leading-relaxed font-medium text-sm md:text-base">&ldquo;{analiseIA}&rdquo;</p>
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">Toque em gerar para analisar seu mês.</p>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, helper, highlight }: { title: string; value: string; icon: ReactNode; helper?: string; highlight?: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all">
            <div className="flex justify-between items-center mb-3">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-orange-500">
                    {icon}
                </div>
                {highlight && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500">{highlight}</span>
                )}
            </div>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1 tracking-tight">{value}</p>
            {helper && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">{helper}</p>}
        </div>
    )
}

export default function Desempenho() {
  return <ProtectedRoute><DesempenhoContent /></ProtectedRoute>;
}
