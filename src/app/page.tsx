// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plataforma } from '@/lib/types';
import { calcularGiroDia, formatarMoeda } from '@/lib/calculations';
import { 
  TrendingUp, DollarSign, Zap, AlertTriangle, 
  Calculator, Check, X, MapPin, ChevronDown, Clock, Award, 
  Gauge, Plus, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import GiroDataService from '@/services/giroService'; 
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import VoiceInput from '@/components/VoiceInput';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import FeatureButtonGroup from '@/components/FeatureButtonGroup';
import { Skeleton } from '@/components/ui/skeleton';
import LandingPage from '@/components/LandingPage'; 

const GiroShotButton = dynamic(() => 
  import('@/components/GiroShotCard').then(mod => mod.GiroShotButton), 
  { ssr: false, loading: () => <div className="p-2 w-full"><Skeleton className="h-12 w-full bg-purple-200 dark:bg-purple-900" /></div> }
);

const CIDADES_PRINCIPAIS = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Curitiba', 'Porto Alegre', 'Goiânia', 'Campinas', 'Recife'
];

function DashboardContent({ user }: { user: any }) {
  
  // --- Estados de Configuração ---
  const [cidade, setCidade] = useState('São Paulo');
  const [metaDiaria, setMetaDiaria] = useState('200');
  const [custoPorKm, setCustoPorKm] = useState(0.50);
  const [currentStreak, setCurrentStreak] = useState(0); 

  // --- Estados de UI ---
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isCalcVisible, setIsCalcVisible] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [alerta, setAlerta] = useState('');

  // --- Estados de DADOS DO DIA ---
  const [totalLucroDia, setTotalLucroDia] = useState(0);
  const [totalHorasDia, setTotalHorasDia] = useState(0);
  const [totalKmDia, setTotalKmDia] = useState(0);
  const [ultimoResultado, setUltimoResultado] = useState<any>(null); 

  // --- Estados do Formulário "Novo Giro" ---
  const [plataforma, setPlataforma] = useState<Plataforma>('Uber');
  const [ganhoBruto, setGanhoBruto] = useState('');
  const [horas, setHoras] = useState('');
  const [km, setKm] = useState('');

  // --- Estados da Calculadora Rápida ---
  const [quickValor, setQuickValor] = useState('');
  const [quickKm, setQuickKm] = useState('');
  const [quickResultado, setQuickResultado] = useState<{ lucro: number; valeApena: boolean } | null>(null);

  const plataformas: Plataforma[] = ['Uber', '99', 'iFood', 'Rappi', 'Shopee', 'Amazon', 'Loggi', 'Outro'];

  // --- EFEITOS (CARREGAMENTO INICIAL) ---
  useEffect(() => {
    if (user) {
        GiroDataService.fetchUserProfile(user.id).then(({ data }) => {
            if (data) {
                if (data.meta_diaria) setMetaDiaria(data.meta_diaria.toString());
                if (data.custo_km) setCustoPorKm(data.custo_km);
                if (data.cidade_padrao) setCidade(data.cidade_padrao);
            }
        });
        
        GiroDataService.fetchTodaySummary(user.id).then(({ data }) => {
            if (data) {
                setTotalLucroDia(data.totalLucro);
                setTotalHorasDia(data.totalHoras);
                setTotalKmDia(data.totalKm);
            }
        });
        
        setCurrentStreak(GiroDataService.getStreak()); 
    }
  }, [user]);

  // Salva meta e cidade na nuvem (com debounce)
  useEffect(() => {
    if (user) {
        const timer = setTimeout(() => {
             GiroDataService.updateUserProfile(user.id, {
                meta_diaria: parseFloat(metaDiaria) || 0,
                cidade_padrao: cidade
            });
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [metaDiaria, cidade, user]); 

  // Gera Alerta
  useEffect(() => {
    if (currentStreak > 0 || totalLucroDia > 0) gerarAlerta(); 
  }, [currentStreak, totalLucroDia]); 

  // --- LÓGICA ---

  const gerarAlerta = async () => {
    const metaNum = parseFloat(metaDiaria) || 0;
    if (!user) return; 
    try {
      const promptText = `Analise para motorista em ${cidade}. Lucro total hoje: R$ ${totalLucroDia.toFixed(2)}. Meta: R$ ${metaNum}. Streak: ${currentStreak}. Alerta curto (max 10 palavras) motivador.`;
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidade, prompt: promptText }),
      });
      const data = await response.json();
      setAlerta(data.insight);
    } catch (error) {
      setAlerta('✅ Dados sincronizados! Continue assim.');
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
    if (!ganhoBruto || !horas || !km) return toast.error('Preenchimento obrigatório!');
    
    const dados = {
      plataforma,
      ganhoBruto: parseFloat(ganhoBruto),
      horasTrabalhadas: parseFloat(horas),
      kmRodados: parseFloat(km),
    };

    const calc = calcularGiroDia(dados, custoPorKm);
    setUltimoResultado(calc); 
    setLoading(true);

    const registroData = new Date().toISOString();
    
    if (user) {
      await GiroDataService.insertRegistro({ 
        user_id: user.id, data: registroData, plataforma: dados.plataforma,
        ganho_bruto: dados.ganhoBruto, horas: dados.horasTrabalhadas,
        km: dados.kmRodados, custo_km: custoPorKm, lucro: calc.lucroFinal 
      });

      // @ts-ignore
      if(GiroDataService.updateOdometer) { 
        // @ts-ignore
        await GiroDataService.updateOdometer(user.id, dados.kmRodados); 
      }
    }
    
    setTotalLucroDia(prev => prev + calc.lucroFinal);
    setTotalHorasDia(prev => prev + dados.horasTrabalhadas);
    setTotalKmDia(prev => prev + dados.kmRodados);

    setGanhoBruto(''); setHoras(''); setKm('');

    const streakResult = GiroDataService.updateStreak(registroData);
    if (streakResult.new) {
      setCurrentStreak(streakResult.streak);
      toast.success(`🎉 Streak de ${streakResult.streak} dias!`);
    }

    setLoading(false);
    setIsRegisterOpen(false); 
    toast.success("Giro salvo com sucesso!", {
        description: `Lucro de ${formatarMoeda(calc.lucroFinal)} adicionado ao seu dia.`,
    });
  };

  const salvarNoLocalStorage = (dados: any, calc: any) => {/* Lógica de fallback (mantida) */};

  // Cálculo da meta com proteção contra divisão por zero/Infinity
  const metaGoal = parseFloat(metaDiaria);
  const safeMetaGoal = metaGoal > 0 ? metaGoal : 1; 
  const progresso = Math.min(100, (totalLucroDia / safeMetaGoal) * 100);

  // --- COMPONENTE: ANEL DE PROGRESSO ---
  const ProgressRing = ({ percent }: { percent: number }) => {
      const size = 240; 
      const strokeWidth = 14;
      const radius = 95; 
      const circumference = 2 * Math.PI * radius;
      const strokeDashoffset = circumference - (percent / 100) * circumference;
      
      return (
          <div className="relative flex items-center justify-center my-6">
              <div className="relative w-[240px] h-[240px]">
                  <svg width={size} height={size} className="transform -rotate-90 block mx-auto overflow-visible" viewBox={`0 0 ${size} ${size}`}>
                      <circle stroke="currentColor" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} className="text-gray-200 dark:text-gray-800" strokeLinecap="round" />
                      <circle stroke="currentColor" fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }} strokeLinecap="round" r={radius} cx={size / 2} cy={size / 2} className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
                      <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Meta</span>
                      <div className="flex items-baseline justify-center">
                        <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">{percent.toFixed(0)}</span>
                        <span className="text-2xl text-orange-500 font-bold ml-0.5">%</span>
                      </div>
                      <div className="flex items-center mt-3 bg-gray-50 dark:bg-gray-900/50 rounded-full px-3 py-1 border border-gray-100 dark:border-gray-800 hover:border-orange-200 transition-colors">
                        <span className="text-[10px] text-gray-400 mr-1 font-bold uppercase">R$</span>
                        <Input 
                            type="text" // CORREÇÃO 1: Troca para text
                            inputMode="numeric" // Pede teclado numérico no mobile
                            value={metaDiaria} 
                            onChange={(e) => {
                                const val = e.target.value;
                                // CORREÇÃO 2: Permite string vazia ou valor >= 1
                                if (val === '' || parseFloat(val) >= 1) {
                                    setMetaDiaria(val);
                                } else if (parseFloat(val) < 1 && val !== '') {
                                    toast.error("A meta deve ser no mínimo R$ 1.");
                                    setMetaDiaria('1'); 
                                }
                            }}
                            className="h-6 w-16 p-0 border-0 bg-transparent text-lg font-bold text-gray-900 dark:text-white focus-visible:ring-0 text-center"
                        />
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen pb-32 bg-white dark:bg-black font-sans selection:bg-orange-100 dark:selection:bg-orange-900">
      <header className="flex justify-between items-center pt-8 px-6">
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Dashboard
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="relative">
                <select value={cidade} onChange={(e) => setCidade(e.target.value)} className="appearance-none bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 pl-3 pr-7 rounded-full outline-none cursor-pointer border border-transparent hover:border-orange-200 transition-all">
                    {CIDADES_PRINCIPAIS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <MapPin className="w-3 h-3 text-orange-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {currentStreak > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-2 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 fill-yellow-500" />
                </div>
            )}
        </div>
      </header>

      <div className="container max-w-md mx-auto px-6">
        <ProgressRing percent={progresso} />
        
         <div className="grid grid-cols-3 gap-3 mb-8 animate-in fade-in duration-500">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center shadow-sm">
                <p className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1 tracking-wider">Lucro Hoje</p>
                <p className="text-xl font-black text-emerald-600 tracking-tight">{formatarMoeda(totalLucroDia)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 text-center">
                <p className="text-[10px] uppercase font-bold text-blue-600/70 mb-1 tracking-wider">Horas Hoje</p>
                <p className="text-xl font-black text-blue-600 tracking-tight">{totalHorasDia.toFixed(1)}h</p>
            </div>
             <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 text-center">
                <p className="text-[10px] uppercase font-bold text-orange-600/70 mb-1 tracking-wider">KM Hoje</p>
                <p className="text-xl font-black text-orange-600 tracking-tight">{totalKmDia.toFixed(0)}km</p>
            </div>
         </div>
        
        {alerta && (
            <div className="w-full bg-gray-900 dark:bg-gray-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 mb-8">
                <div className="bg-orange-500 p-1 rounded-full"><Award className="w-3 h-3 text-white"/></div>
                <p className="text-xs font-medium leading-snug">{alerta}</p>
            </div>
        )}

        <div className="grid gap-4">
            <Drawer open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                <DrawerTrigger asChild>
                    <button className="w-full group relative overflow-hidden bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-3xl shadow-xl shadow-orange-500/20 transition-all active:scale-95">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-2xl font-black tracking-tight group-hover:translate-x-1 transition-transform">Novo Giro</p>
                                <p className="text-xs text-orange-100 font-medium opacity-90 mt-1">Registrar corrida agora</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm group-hover:rotate-90 transition-transform duration-500">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    </button>
                </DrawerTrigger>
                <DrawerContent className="dark:bg-gray-950 border-t dark:border-gray-800 h-[85vh]">
                     <div className="mx-auto w-full max-w-md px-6 py-6 h-full overflow-y-auto">
                        <DrawerHeader className="px-0 mb-6 text-left">
                            <DrawerTitle className="text-3xl font-black">Registrar</DrawerTitle>
                            <DrawerDescription>Preencha os dados da sua rodagem.</DrawerDescription>
                        </DrawerHeader>
                        <div className="space-y-8">
                            <FeatureButtonGroup label="Plataforma" options={plataformas} selected={plataforma} onSelect={setPlataforma} colorClass="bg-gray-900 text-white shadow-md dark:bg-white dark:text-black" />
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Ganho Total</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">R$</span>
                                        <Input type="number" value={ganhoBruto} onChange={e => setGanhoBruto(e.target.value)} placeholder="0.00" className="pl-12 h-20 text-4xl font-black rounded-2xl bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all" />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2"><VoiceInput onResult={setGanhoBruto} /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Horas</label>
                                        <Input type="number" value={horas} onChange={e => setHoras(e.target.value)} placeholder="0" className="h-14 text-xl font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">KM</label>
                                        <Input type="number" value={km} onChange={e => setKm(e.target.value)} placeholder="0" className="h-14 text-xl font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center" />
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleCalcular} disabled={loading} className="w-full h-16 text-lg font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-xl shadow-orange-500/20">
                                {loading ? <Loader2 className="animate-spin" /> : 'Calcular e Salvar'}
                            </Button>
                        </div>
                     </div>
                </DrawerContent>
            </Drawer>
            
            {ultimoResultado && (
                 <div className="col-span-2">
                     <GiroShotButton data={{ lucro: ultimoResultado.lucroFinal, horas: parseFloat(horas || '0'), km: parseFloat(km || '0'), meta: parseFloat(metaDiaria), insight: 'Giro registrado!', plataforma: plataforma, cidade: cidade, }} />
                 </div>
            )}
        </div>
      </div>
      
      {isCalcVisible && (
          <div className={cn("fixed bottom-24 right-4 z-[60] md:bottom-8 transition-all duration-500 ease-in-out transform", isCalcOpen ? "translate-y-[200%] opacity-0" : "translate-y-0 opacity-100")}>
            <Drawer open={isCalcOpen} onOpenChange={setIsCalcOpen}>
            <DrawerTrigger asChild>
                <Button className="h-14 w-14 rounded-full bg-white dark:bg-gray-800 text-blue-600 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/50 dark:shadow-none flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 relative group">
                    <Calculator className="h-6 w-6" />
                </Button>
            </DrawerTrigger>
            <button onClick={(e) => { e.stopPropagation(); setIsCalcVisible(false); }} className="absolute -top-1 -left-1 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full p-1 shadow-sm hover:bg-red-500 hover:text-white transition-colors z-50"><X className="w-3 h-3" /></button>
            <DrawerContent className="dark:bg-gray-900 dark:border-gray-800">
                <DrawerClose className="absolute right-4 top-4 opacity-50 hover:opacity-100"><X className="h-6 w-6" /></DrawerClose>
                <div className="mx-auto w-full max-w-sm p-6 space-y-6">
                    <DrawerHeader className="p-0 text-center mb-2">
                        <DrawerTitle className="text-xl font-black text-gray-900 dark:text-white">Simulador Rápido</DrawerTitle>
                        <DrawerDescription className="text-sm text-gray-500">Vale a pena aceitar?</DrawerDescription>
                    </DrawerHeader>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Valor (R$)</label><Input type="number" className="text-xl h-12 font-bold bg-gray-50 border-0" value={quickValor} onChange={e => setQuickValor(e.target.value)} /></div>
                        <div><label className="text-xs font-bold uppercase text-gray-400 mb-1 block">KM Total</label><Input type="number" className="text-xl h-12 font-bold bg-gray-50 border-0" value={quickKm} onChange={e => setQuickKm(e.target.value)} /></div>
                    </div>
                    <Button onClick={calcularRapido} className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-lg shadow-blue-500/20">Verificar</Button>
                    {quickResultado && (
                    <div className={`p-4 rounded-xl text-center border-2 animate-in zoom-in duration-300 ${quickResultado.valeApena ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                        <div className="flex justify-center items-center gap-2 text-3xl font-black mb-1">{quickResultado.valeApena ? <Check size={32}/> : <X size={32}/>} {quickResultado.valeApena ? 'ACEITA!' : 'RECUSA!'}</div>
                        <p className="font-bold text-lg opacity-80">Lucro: {formatarMoeda(quickResultado.lucro)}</p>
                    </div>
                    )}
                </div>
            </DrawerContent>
            </Drawer>
          </div>
      )}
    </div>
  );
}

export default function HomePage() {
    const { user, loading } = useAuth();
    const [checkingProfile, setCheckingProfile] = useState(true); 
    const router = useRouter();

    useEffect(() => {
        if (loading) return; 

        if (user) {
            setCheckingProfile(true);
            GiroDataService.fetchUserProfile(user.id).then(({ data, error }) => {
                
                // Se o perfil não existe (erro PGRST116) ou se está VAZIO
                // @ts-ignore
                if (error?.code === 'PGRST116' || !data || !data.cidade_padrao || data.meta_diaria === null || data.meta_diaria === 0) {
                    router.push('/onboarding');
                } else {
                    setCheckingProfile(false); // Perfil completo
                }
            });
        } else {
            setCheckingProfile(false);
        }
    }, [user, loading, router]);

    if (loading || checkingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-orange-500 rounded-2xl animate-pulse flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">G</span>
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Carregando Motor...</p>
                </div>
            </div>
        );
    }

    if (user) {
        return <DashboardContent user={user} />;
    }

    return <LandingPage />;
}