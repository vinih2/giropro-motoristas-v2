// src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Plataforma } from '@/lib/types';
// CORREÇÃO: As funções agora são exports nomeados no calculations.ts
import { calcularGiroDia, formatarMoeda, avaliarDesempenho } from '@/lib/calculations'; 
import { TrendingUp, DollarSign, Navigation, Zap, AlertTriangle, Calculator, Check, X, MapPin, ChevronDown, Clock, Award } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
// Importação Padrão do Serviço
import GiroDataService from '@/services/giroService'; 
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Componente de Input
import VoiceInput from '@/components/VoiceInput';
import { toast } from 'sonner';

// Componentes Reutilizáveis (Assumindo que foram criados)
import MetricCard from '@/components/MetricCard'; 
import FeatureButtonGroup from '@/components/FeatureButtonGroup';
import { GiroShotButton } from '@/components/GiroShotCard'; 

// Lista de cidades principais
const CIDADES_PRINCIPAIS = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Fortaleza', 
  'Curitiba', 'Manaus', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos', 
  'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 
  'Campo Grande', 'Teresina', 'São Bernardo do Campo', 'João Pessoa', 'Osasco', 
  'Santo André', 'Uberlândia', 'Sorocaba', 'Ribeirão Preto', 'Florianópolis'
];

function DashboardContent() {
  const { user } = useAuth();
  
  const [plataforma, setPlataforma] = useState<Plataforma>('Uber');
  const [cidade, setCidade] = useState('São Paulo');
  const [ganhoBruto, setGanhoBruto] = useState('');
  const [horas, setHoras] = useState('');
  const [km, setKm] = useState('');
  const [metaDiaria, setMetaDiaria] = useState('200'); // Inicialização
  const [resultado, setResultado] = useState<any>(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [custoPorKm, setCustoPorKm] = useState(0.50);
  const [alerta, setAlerta] = useState('');
  const [currentStreak, setCurrentStreak] = useState(0); 

  // Calculadora Rápida
  const [quickValor, setQuickValor] = useState('');
  const [quickKm, setQuickKm] = useState('');
  const [quickResultado, setQuickResultado] = useState<{ lucro: number; valeApena: boolean } | null>(null);

  const plataformas: Plataforma[] = ['Uber', '99', 'iFood', 'Rappi', 'Shopee', 'Amazon', 'Loggi', 'Outro'];

  // EFEITO: Carregar configurações e Streak
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const custo = localStorage.getItem('custoPorKm');
      if (custo) setCustoPorKm(parseFloat(custo));
      
      const meta = localStorage.getItem('metaDiaria');
      // Se a meta for salva, usa-a. Senão, usa '200'.
      if (meta) setMetaDiaria(meta);

      const cidadeSalva = localStorage.getItem('cidadePadrao');
      if (cidadeSalva) setCidade(cidadeSalva);
    }
    
    // CHAMA A FUNÇÃO CORRETA
    setCurrentStreak(GiroDataService.getStreak()); 

  }, [user]);

  useEffect(() => {
    // Salva metaDiaria no localStorage sempre que muda
    if (typeof window !== 'undefined') {
      localStorage.setItem('metaDiaria', metaDiaria);
      localStorage.setItem('cidadePadrao', cidade);
    }
  }, [metaDiaria, cidade]);

  useEffect(() => {
    // Gerar alerta ao carregar a página ou ao ter novo resultado
    if (resultado || currentStreak > 0) gerarAlerta(); 
  }, [resultado, currentStreak]);

  const gerarAlerta = async () => {
    const metaNum = parseFloat(metaDiaria) || 0;
    
    if (!resultado && alerta) return;

    try {
      // Prompt ajustado para considerar o Streak
      const promptText = `Analise para motorista em ${cidade}. Ganho/h: R$ ${resultado?.ganhoPorHora.toFixed(2) || '0.00'}, Custo/km: R$ ${custoPorKm.toFixed(2)}. Meta: R$ ${metaNum}. Streak atual: ${currentStreak} dias.
      Gere alerta curto (max 2 linhas) com emoji que seja motivador ou prático. Se estiver chovendo, priorize a dinâmica.`
      
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidade, prompt: promptText }),
      });
      const data = await response.json();
      setAlerta(data.insight);
    } catch (error) {
      setAlerta('✅ Giro registrado! Acompanhe seus resultados.');
    }
  };

  const calcularRapido = () => {
    const v = parseFloat(quickValor);
    const k = parseFloat(quickKm);
    if (!v || !k) return;
    const lucro = v - (k * custoPorKm);
    setQuickResultado({ lucro, valeApena: (lucro / k) >= 1.0 });
  };

  const handleCalcular = async () => {
    if (!ganhoBruto || !horas || !km) return alert('Preencha os campos!');
    
    const dados = {
      plataforma,
      ganhoBruto: parseFloat(ganhoBruto),
      horasTrabalhadas: parseFloat(horas),
      kmRodados: parseFloat(km),
    };

    const calc = calcularGiroDia(dados, custoPorKm); // Usa a função agora nomeada
    setResultado(calc);
    setLoading(true);

    const registroData = new Date().toISOString();
    
    // 1. Inserir Registro no DB (se logado) ou LocalStorage (se não)
    if (user) {
      // Usa o service layer para inserir o registro no DB
      GiroDataService.insertRegistro({ 
        user_id: user.id, 
        data: registroData, 
        ...dados, 
        custo_km: custoPorKm, 
        lucro: calc.lucroFinal 
      }).then(async ({ error }) => {
        // Se a inserção no DB falhar, salva no LocalStorage (backup)
        if (error) salvarNoLocalStorage(dados, calc);
      });
    } else {
      salvarNoLocalStorage(dados, calc);
    }
    
    // 2. Atualizar Streak
    const streakResult = GiroDataService.updateStreak(registroData);
    if (streakResult.new) {
      setCurrentStreak(streakResult.streak);
      toast.success(`🎉 Streak de ${streakResult.streak} dias! Mantenha o ritmo!`, {
          duration: 5000,
          icon: <Award className="w-5 h-5 text-yellow-500" />
      });
    }

    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            dados, 
            resultado: calc, 
            cidade, 
            prompt: "Gere insight curto e motivador para este resultado considerando o clima atual." 
        }),
      });
      const data = await response.json();
      setInsight(data.insight);
    } catch (error) {
      setInsight('Seu giro está registrado! Continue assim.');
    } finally {
      setLoading(false);
    }
  };

  const salvarNoLocalStorage = (dados: any, calc: any) => {
    try {
      const registros = JSON.parse(localStorage.getItem('registros') || '[]');
      registros.unshift({
        id: Date.now(),
        user_id: 'local',
        data: new Date().toISOString().split('T')[0],
        ...dados,
        custo_km: custoPorKm,
        lucro: calc.lucroFinal,
      });
      localStorage.setItem('registros', JSON.stringify(registros));
    } catch (e) { console.error(e) }
  };

  const progresso = resultado ? Math.min((resultado.lucroFinal / parseFloat(metaDiaria || '1')) * 100, 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-32">
      {/* --- HEADER MELHORADO --- */}
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-500 bg-clip-text text-transparent mb-1">
            GiroPro
          </h1>
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Coach Financeiro
          </p>
        </div>
        
        {/* WIDGET STREAK */}
        {currentStreak > 0 && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-4 py-1 shadow-lg">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-bold">{currentStreak} DIAS DE STREAK!</span>
            </div>
        )}

        {/* --- SELETOR DE CIDADE (DESIGN CÁPSULA) --- */}
        <div className="flex justify-center">
          <div className="relative inline-flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 transition-all active:scale-95 hover:border-orange-300 dark:hover:border-orange-700 group">
            <MapPin className="w-4 h-4 text-orange-500 mr-2 group-hover:animate-bounce" />
            
            <div className="relative">
              <select 
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="appearance-none bg-transparent text-gray-700 dark:text-gray-200 font-semibold text-sm outline-none cursor-pointer pr-6 text-center"
              >
                  {CIDADES_PRINCIPAIS.map(c => <option key={c} value={c} className="text-black bg-white dark:bg-gray-900 dark:text-white">{c}</option>)}
              </select>
              {/* Seta customizada */}
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* MUDANÇA: WIDGET META AGORA É EDITÁVEL */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-md mx-auto mt-4">
          <div className="flex items-center justify-between text-sm font-medium mb-2 text-gray-600 dark:text-gray-300">
            <label htmlFor="meta-diaria" className="font-semibold">Meta Diária (R$)</label>
            <span>{progresso.toFixed(0)}%</span>
          </div>
          
          <Input
              id="meta-diaria"
              type="number"
              step="10"
              value={metaDiaria}
              onChange={(e) => setMetaDiaria(e.target.value)}
              placeholder="200"
              className="w-full text-lg h-10 text-center mb-2"
          />

          <Progress value={progresso} className="h-3 bg-gray-100 dark:bg-gray-800" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>R$ 0</span>
            <span>{formatarMoeda(parseFloat(metaDiaria))}</span>
          </div>
        </div>
      </div>

      {/* Alerta Inteligente */}
      {alerta && (
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-900 dark:text-amber-100 font-medium leading-relaxed">{alerta}</p>
          </div>
        </div>
      )}

      {/* --- FORMULÁRIO --- */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800 space-y-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="text-orange-500" /> Novo Registro
        </h2>

        {/* Componente Reutilizável: Seleção de Plataforma */}
        <FeatureButtonGroup
            label="Plataforma"
            options={plataformas}
            selected={plataforma}
            onSelect={setPlataforma}
            colorClass="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
        />

        {/* Inputs com Voz */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium dark:text-gray-300">Ganho Total (R$)</label>
            <div className="flex gap-2 mt-1">
              <Input type="number" value={ganhoBruto} onChange={e => setGanhoBruto(e.target.value)} placeholder="0.00" className="text-lg" />
              <VoiceInput onResult={setGanhoBruto} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Horas</label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="0" />
                <VoiceInput onResult={setHoras} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">KM</label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="0" />
                <VoiceInput onResult={setKm} />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleCalcular} className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg mt-4">
          {loading ? 'Calculando...' : 'Calcular'}
        </Button>
      </div>

      {/* Resultados e Botão GiroShot */}
      {resultado && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
              {/* Componente Reutilizável: Lucro */}
              <MetricCard
                title="Lucro Líquido"
                value={resultado.lucroFinal}
                color="green"
                icon={<DollarSign />}
              />
              {/* Componente Reutilizável: R$/H */}
              <MetricCard
                title="Ganho/Hora"
                value={resultado.ganhoPorHora}
                color="blue"
                icon={<Clock />}
              />
              <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 italic text-center border border-gray-200 dark:border-gray-700">
                "{insight}"
              </div>
          </div>

          {/* BOTÃO GIROSHOT (VIRALIZAÇÃO) */}
          <GiroShotButton data={{
              lucro: resultado.lucroFinal,
              horas: parseFloat(horas),
              km: parseFloat(km),
              meta: parseFloat(metaDiaria),
              insight: insight || 'Seu Giro de hoje foi registrado!',
              plataforma: plataforma,
              cidade: cidade,
          }} />
        </div>
      )}

      {/* FAB - Calculadora Rápida (Mantido) */}
      <div className="fixed bottom-24 right-4 z-[60] md:bottom-8">
        <Drawer>
          <DrawerTrigger asChild>
            <Button className="h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl flex flex-col items-center justify-center gap-1 border-4 border-white dark:border-gray-900 transition-transform hover:scale-105 active:scale-95">
              <Calculator className="h-6 w-6" />
              <span className="text-[10px]">Rápido</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="dark:bg-gray-900 dark:border-gray-800">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle className="dark:text-white">Calculadora Rápida</DrawerTitle>
                <DrawerDescription>Simule antes de aceitar a corrida.</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm dark:text-gray-300">Valor (R$)</label>
                    <Input type="number" className="text-lg" value={quickValor} onChange={e => setQuickValor(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm dark:text-gray-300">KM Total</label>
                    <Input type="number" className="text-lg" value={quickKm} onChange={e => setQuickKm(e.target.value)} />
                  </div>
                </div>
                <Button onClick={calcularRapido} className="w-full h-12 text-lg">Verificar</Button>
                
                {quickResultado && (
                  <div className={`p-4 rounded-xl text-center border-2 animate-scale-in ${quickResultado.valeApena ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                    <div className="flex justify-center items-center gap-2">
                        {quickResultado.valeApena ? <Check size={32}/> : <X size={32}/>}
                        <span className="text-2xl font-bold">{quickResultado.valeApena ? 'ACEITA!' : 'RECUSA!'}</span>
                    </div>
                    <p className="mt-1 font-medium">Lucro estimado: {formatarMoeda(quickResultado.lucro)}</p>
                  </div>
                )}
              </div>
              <DrawerFooter>
                <DrawerClose asChild><Button variant="outline">Fechar</Button></DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}