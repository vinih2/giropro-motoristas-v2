// src/app/financeiro/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, TrendingDown, TrendingUp, PieChart as PieIcon, 
  Plus, Trash2, Calendar, DollarSign, PiggyBank
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase'; 
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatarMoeda } from '@/lib/calculations';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const CATEGORIAS = ['Moradia', 'Alimentação', 'Transporte (Pessoal)', 'Lazer', 'Saúde', 'Dívidas', 'Outros'];
const CORES = ['#f97316', '#3b82f6', '#10b981', '#eab308', '#ef4444', '#8b5cf6', '#6b7280'];

export default function FinanceiroPage() {
  const { user } = useAuth();
  const [despesas, setDespesas] = useState<any[]>([]);
  const [lucroMes, setLucroMes] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);

  useEffect(() => {
    if (user) carregarDados();
  }, [user]);

  const carregarDados = async () => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

    // 1. Buscar Lucro Líquido do Mês (da tabela registros)
    const { data: giros } = await supabase
        .from('registros')
        .select('lucro')
        .eq('user_id', user?.id)
        .gte('data', inicioMes);
    
    const totalLucro = giros?.reduce((acc, r) => acc + (r.lucro || 0), 0) || 0;
    setLucroMes(totalLucro);

    // 2. Buscar Despesas Pessoais
    const { data: gastos } = await supabase
        .from('despesas_pessoais')
        .select('*')
        .eq('user_id', user?.id)
        .gte('data_despesa', inicioMes)
        .order('data_despesa', { ascending: false });
    
    if (gastos) setDespesas(gastos);
    setLoading(false);
  };

  const handleAddDespesa = async () => {
      if (!descricao || !valor) return toast.error("Preencha os campos.");
      
      const novaDespesa = {
          user_id: user?.id,
          descricao,
          valor: parseFloat(valor),
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

  // Cálculos
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const saldoFinal = lucroMes - totalDespesas;
  const saldoCor = saldoFinal >= 0 ? 'text-green-600' : 'text-red-600';

  // Dados para o Gráfico
  const dadosGrafico = CATEGORIAS.map(cat => ({
      name: cat,
      value: despesas.filter(d => d.categoria === cat).reduce((acc, d) => acc + d.valor, 0)
  })).filter(d => d.value > 0);

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-32 pt-8 px-4 font-sans">
      <div className="container max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <PiggyBank className="w-8 h-8 text-orange-600"/> Minhas <span className="text-orange-600">Finanças</span>
            </h1>
            <p className="text-gray-500 font-medium">Controle pessoal do seu lucro.</p>
        </div>

        {/* BALANÇO DO MÊS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 shadow-sm">
                <CardContent className="p-6 text-center">
                    <p className="text-xs font-bold uppercase text-green-600 mb-1">Lucro do App (Mês)</p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-400">{formatarMoeda(lucroMes)}</p>
                </CardContent>
            </Card>
            <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 shadow-sm">
                <CardContent className="p-6 text-center">
                    <p className="text-xs font-bold uppercase text-red-600 mb-1">Gastos Pessoais</p>
                    <p className="text-2xl font-black text-red-700 dark:text-red-400">- {formatarMoeda(totalDespesas)}</p>
                </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-900 shadow-lg border-2 border-gray-100 dark:border-gray-800">
                <CardContent className="p-6 text-center">
                    <p className="text-xs font-bold uppercase text-gray-500 mb-1">Saldo Real Livre</p>
                    <p className={`text-3xl font-black ${saldoCor}`}>{formatarMoeda(saldoFinal)}</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            
            {/* COLUNA 1: ADICIONAR + LISTA */}
            <div className="space-y-6">
                {/* Form */}
                <Card className="border-0 shadow-md">
                    <CardHeader className="pb-3"><CardTitle className="text-lg">Nova Despesa</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                             <Input placeholder="Descrição (Ex: Aluguel)" value={descricao} onChange={e => setDescricao(e.target.value)} />
                             <Input type="number" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} />
                        </div>
                        <Select value={categoria} onValueChange={setCategoria}>
                            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAddDespesa} className="w-full bg-gray-900 text-white hover:bg-gray-800">Adicionar</Button>
                    </CardContent>
                </Card>

                {/* Lista */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">Últimos Gastos</h3>
                    {despesas.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-8">Nenhuma despesa lançada este mês.</p>
                    ) : (
                        despesas.map(d => (
                            <div key={d.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
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
                <Card className="border-0 shadow-md h-full min-h-[400px] flex flex-col">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieIcon className="w-5 h-5 text-orange-500"/> Para onde vai o dinheiro?</CardTitle></CardHeader>
                    <CardContent className="flex-1">
                        {dadosGrafico.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={dadosGrafico} innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {dadosGrafico.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
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