// src/app/desempenho/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { formatarMoeda } from '@/lib/calculations';
import {
  Clock, Navigation, DollarSign, TrendingUp, 
  PieChart as PieChartIcon, Calendar, ArrowUpRight, Loader2, BrainCircuit, Sparkles, BarChart4, Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link'; // Importar Link

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

function DesempenhoContent() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [analiseIA, setAnaliseIA] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);

  useEffect(() => { if (user) carregarDados(); }, [user]);

  const carregarDados = async () => {
    if (!user) return;
    const { data } = await supabase.from('registros').select('*').eq('user_id', user.id).order('data', { ascending: true });
    if (data) setRegistros(data);
    setLoading(false);
  };

  // --- Cálculos ---
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const registrosMes = registros.filter((r) => new Date(r.data) >= inicioMes);
  const lucroMensal = registrosMes.reduce((acc, r) => acc + (r.lucro || 0), 0);
  const totalHoras = registrosMes.reduce((acc, r) => acc + (r.horas || 0), 0);
  const totalKm = registrosMes.reduce((acc, r) => acc + (r.km || 0), 0);
  const mediaHora = totalHoras > 0 ? lucroMensal / totalHoras : 0;
  const mediaKm = totalKm > 0 ? lucroMensal / totalKm : 0;

  const dadosDiariosMap = new Map();
  registrosMes.forEach(r => {
      const dia = new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dadosDiariosMap.has(dia)) dadosDiariosMap.set(dia, { data: dia, lucro: 0 });
      dadosDiariosMap.get(dia).lucro += r.lucro || 0;
  });
  const dadosGrafico = Array.from(dadosDiariosMap.values());

  const platMap: Record<string, number> = {};
  registrosMes.forEach(r => platMap[r.plataforma] = (platMap[r.plataforma] || 0) + 1);
  const dadosPizza = Object.entries(platMap).map(([name, value]) => ({ name, value }));
  const CORES_PIZZA = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6'];

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
        
        <div className="flex justify-between items-end">
            <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Performance</p>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Seus Números</h1>
            </div>
            <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1">
                <Calendar className="w-3 h-3 mr-2" /> Este Mês
            </Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Lucro Líquido" value={formatarMoeda(lucroMensal)} icon={<DollarSign/>} trend="positive" color="text-emerald-600" />
            <KpiCard title="Média / Hora" value={formatarMoeda(mediaHora)} icon={<Clock/>} color="text-blue-600" />
            <KpiCard title="Média / KM" value={formatarMoeda(mediaKm)} icon={<Navigation/>} color="text-orange-600" />
            <KpiCard title="Total Horas" value={`${totalHoras.toFixed(0)}h`} icon={<TrendingUp/>} color="text-purple-600" />
        </div>

        <Card className="border-0 shadow-lg rounded-3xl overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" /> Curva de Lucro
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[300px] bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-black relative">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                            formatter={(value: number) => [formatarMoeda(value), 'Lucro']}
                        />
                        <Area type="monotone" dataKey="lucro" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorLucro)" />
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
                        <div className="animate-in fade-in slide-in-from-bottom-2"><p className="text-zinc-300 leading-relaxed font-medium text-sm md:text-base">"{analiseIA}"</p></div>
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

function KpiCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 ${color}`}>{icon}</div>
            </div>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1 tracking-tight">{value}</p>
        </div>
    )
}

export default function Desempenho() {
  return <ProtectedRoute><DesempenhoContent /></ProtectedRoute>;
}