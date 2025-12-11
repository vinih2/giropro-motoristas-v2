// src/app/onboarding/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import GiroDataService from '@/services/giroService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Car, MapPin, Target, CheckCircle2,
  Fuel, Zap, ChevronRight, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logAnalyticsEvent } from '@/services/analyticsService';
// REMOVEMOS O ProtectedRoute daqui

const STEPS = [
  { id: 1, title: "Sua Máquina", icon: Car, desc: "Qual veículo você usa para trabalhar?" },
  { id: 2, title: "Sua Região", icon: MapPin, desc: "Onde você costuma rodar?" },
  { id: 3, title: "Sua Meta", icon: Target, desc: "Quanto você quer faturar por dia?" },
];

const CIDADES = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Salvador', 'Fortaleza', 'Brasília', 'Goiânia', 'Porto Alegre', 'Recife', 'Campinas'];

// O conteúdo agora é a exportação padrão
export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth(); // Verificação de auth interna
  const { refresh } = useUserProfile();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [guardLoading, setGuardLoading] = useState(true);
  const [allowFlow, setAllowFlow] = useState(false);

  // Dados do Formulário
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [cidade, setCidade] = useState('');
  const [meta, setMeta] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;
    setGuardLoading(true);
    GiroDataService.getProfileStatus(user.id).then((status) => {
        if (!active) return;
        if (status.needsOnboarding) {
            setAllowFlow(true);
        } else if (status.needsProfileDetails) {
            router.replace('/perfil?from=onboarding');
        } else {
            router.replace('/');
        }
    }).catch(() => setAllowFlow(true)).finally(() => {
        if (active) setGuardLoading(false);
    });

    return () => { active = false; };
  }, [authLoading, user, router]);

  const handleNext = async () => {
    if (step === 1 && !tipoVeiculo) return toast.error("Selecione um tipo de veículo.");
    if (step === 2 && !cidade) return toast.error("Selecione sua cidade.");
    if (step === 3 && (!meta || Number(meta) < 10)) return toast.error("Defina uma meta diária válida (mínimo R$ 10).");

    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      await finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    if (!user) return; 
    setLoading(true);

    let custoEstimado = 0.50;
    if (tipoVeiculo === 'Moto') custoEstimado = 0.20;
    if (tipoVeiculo === 'Elétrico') custoEstimado = 0.15;
    if (tipoVeiculo === 'Carro Flex') custoEstimado = 0.60;

    // Salva no Supabase (usando upsert)
    const metaValue = Number(meta);
    const kmMetaPadrao = 200;
    const minLucroRecomendado = Math.max(0.5, parseFloat((custoEstimado * 1.3).toFixed(2)));
    const { error } = await GiroDataService.updateUserProfile(user.id, {
        meta_diaria: metaValue,
        cidade_padrao: cidade,
        custo_km: custoEstimado,
        km_meta_diaria: kmMetaPadrao,
        min_lucro_km: minLucroRecomendado,
        onboarding_steps: ['vehicle', 'region', 'goal'],
        language: 'pt-BR',
        full_name: user.user_metadata?.full_name || undefined
    });

    if (!error && tipoVeiculo) {
         const { error: vehicleError } = await GiroDataService.upsertVehicle(user.id, { 
            km_atual: 0, 
            km_oleo: 0,
            km_pneu: 0,
            km_correia: 0,
            modelo: tipoVeiculo 
         });
         if (vehicleError) {
            console.warn('Não foi possível salvar veículo inicial.', vehicleError);
         }
    }

    if (!error) {
        toast.success("Perfil configurado! Vamos faturar. 🚀");
        if (typeof window !== 'undefined') localStorage.setItem('onboarding_complete', 'true');
        logAnalyticsEvent(user.id, 'onboarding_completed', {
          cidade,
          meta_diaria: metaValue,
          tipo_veiculo: tipoVeiculo,
        }).catch(() => {});
        await refresh().catch(() => {});
        router.push('/');
    } else {
        toast.error("Erro ao salvar perfil.");
    }
    setLoading(false);
  };

  // --- Verificação de Auth (Substitui o ProtectedRoute) ---
  if (authLoading || guardLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
      );
  }

  if (!allowFlow) {
      return null;
  }
  // --- Fim da Verificação ---

  const formattedMeta = meta ? Number(meta).toLocaleString('pt-BR') : '';

  const handleMetaInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setMeta(digits);
  };

  const handleMetaPreset = (val: number) => {
    setMeta(String(val));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        
        {/* Progresso */}
        <div className="flex justify-between items-center px-4">
            {STEPS.map((s) => (
                <div key={s.id} className={cn("flex flex-col items-center gap-2 transition-all", step === s.id ? "opacity-100 scale-105" : step > s.id ? "opacity-100 text-green-600" : "opacity-30")}>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2", 
                        step === s.id ? "border-orange-500 bg-orange-50 text-orange-600" : 
                        step > s.id ? "border-green-500 bg-green-50 text-green-600" : "border-gray-200 bg-gray-50 text-gray-400"
                    )}>
                        {step > s.id ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{s.title}</span>
                </div>
            ))}
        </div>

        {/* Card Principal */}
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-gray-900 relative">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-yellow-500 w-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
            
            <CardContent className="p-8 min-h-[400px] flex flex-col justify-between">
                
                {/* Conteúdo Dinâmico */}
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" key={step}>
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white">{STEPS[step-1].title}</h1>
                        <p className="text-gray-500">{STEPS[step-1].desc}</p>
                    </div>

                    {/* PASSO 1: VEÍCULO */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 gap-3">
                            {['Carro Flex', 'Moto', 'Elétrico'].map((v) => (
                                <button 
                                    key={v}
                                    onClick={() => setTipoVeiculo(v)}
                                    className={cn(
                                        "h-16 rounded-2xl border-2 flex items-center px-6 gap-4 transition-all hover:scale-[1.02]",
                                        tipoVeiculo === v 
                                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 shadow-md" 
                                            : "border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                                    )}
                                >
                                    {v === 'Carro Flex' && <Fuel className="w-6 h-6" />}
                                    {v === 'Moto' && <Zap className="w-6 h-6" />}
                                    {v === 'Elétrico' && <Zap className="w-6 h-6 text-green-500" />}
                                    <span className="font-bold text-lg">{v}</span>
                                    {tipoVeiculo === v && <CheckCircle2 className="w-5 h-5 ml-auto text-orange-500" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* PASSO 2: CIDADE */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <select 
                                value={cidade} 
                                onChange={(e) => setCidade(e.target.value)}
                                className="w-full h-16 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-lg font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Selecione sua cidade...</option>
                                {CIDADES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="text-center text-sm text-gray-400">Isso configura o mapa de preços para sua região.</div>
                        </div>
                    )}

                    {/* PASSO 3: META */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">R$</span>
                                <Input 
                                    type="text" 
                                    inputMode="numeric"
                                    placeholder="200" 
                                    value={formattedMeta}
                                    autoFocus
                                    onChange={(e) => handleMetaInput(e.target.value)}
                                    className="h-24 pl-16 text-5xl font-black rounded-3xl bg-gray-50 dark:bg-gray-800 border-0 focus:ring-0"
                                />
                            </div>
                            <div className="flex gap-2 justify-center">
                                {[150, 200, 300, 400].map(val => (
                                    <button key={val} onClick={() => handleMetaPreset(val)} className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-bold hover:bg-orange-100 hover:text-orange-600 transition-colors">
                                        R$ {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Botão de Ação */}
                <div className="pt-6">
                    <Button 
                        onClick={handleNext} 
                        disabled={loading}
                        className="w-full h-16 text-xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-[1.02] transition-transform rounded-2xl shadow-xl"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : step === 3 ? 'Finalizar e Começar' : 'Próximo'} 
                        {!loading && <ChevronRight className="ml-2 w-6 h-6" />}
                    </Button>
                </div>

            </CardContent>
        </Card>
      </div>
    </div>
  );
}

// REMOVEMOS O WRAPPER 'OnboardingPageWrapper'
