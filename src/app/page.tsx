'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { Plataforma, ResultadoDia } from '@/lib/types';
import { calcularGiroDia, formatarMoeda } from '@/lib/calculations';
import { Check, X, Loader2, Sun, Cloud, CloudRain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import GiroDataService from '@/services/giroService';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import VoiceInput from '@/components/VoiceInput';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import FeatureButtonGroup from '@/components/FeatureButtonGroup';
import LandingPage from '@/components/LandingPage';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { GoalTrackerCard } from '@/components/dashboard/GoalTrackerCard';
import { DashboardAlertsCard, DashboardAlert } from '@/components/dashboard/DashboardAlertsCard';
import { LastRunCard } from '@/components/dashboard/LastRunCard';
import ImportTripsModal from '@/components/ImportTripsModal';
const UPSSELL_DISMISS_KEY = 'pro_plus_upsell_dismissed';
const UPSSELL_RESHOW_DAYS = 7;

const CIDADES_PRINCIPAIS = [
  'São Paulo',
  'Rio de Janeiro',
  'Belo Horizonte',
  'Brasília',
  'Salvador',
  'Curitiba',
  'Porto Alegre',
  'Goiânia',
  'Campinas',
  'Recife',
];
const plataformas: Plataforma[] = ['Uber', '99', 'iFood', 'Rappi', 'Shopee', 'Amazon', 'Loggi', 'Outro'];
const MIN_CUSTO_KM = 0.1;

type VehicleInfo = {
  valor_ipva?: number | null;
  valor_seguro?: number | null;
  valor_financiamento?: number | null;
};

type ClimaData = {
  temp: number;
  descricao: string;
  icon: string;
  principal: string;
};

type WeatherApiResponse = ClimaData | { error: string };

function DashboardContent({ user }: { user: User }) {
  const router = useRouter();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const profileReady = !profileLoading;

  // Configuração
  const [cidade, setCidade] = useState('São Paulo');
  const [metaDiaria, setMetaDiaria] = useState('200');
  const [custoPorKm, setCustoPorKm] = useState(0.5); // custo variável (combustível/manutenção)
  const [kmMetaDiaria, setKmMetaDiaria] = useState(200);
  const [minLucroPorKm, setMinLucroPorKm] = useState(1);
  const [minLucroInput, setMinLucroInput] = useState('1');
  const [minLucroPrefillLocked, setMinLucroPrefillLocked] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [profileCusto, setProfileCusto] = useState<number | null>(null);
  const [initialCustoLoaded, setInitialCustoLoaded] = useState(false);
  const [custoManualDirty, setCustoManualDirty] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [showLeadBanner, setShowLeadBanner] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadCity, setLeadCity] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);

  // UI
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alerta, setAlerta] = useState('');

  // Dados do dia
  const [totalLucroDia, setTotalLucroDia] = useState(0);
  const [totalHorasDia, setTotalHorasDia] = useState(0);
  const [totalKmDia, setTotalKmDia] = useState(0);
  const [ultimoResultado, setUltimoResultado] = useState<ResultadoDia | null>(null);

  // Formulário
  const [plataforma, setPlataforma] = useState<Plataforma>('Uber');
  const [ganhoBruto, setGanhoBruto] = useState('');
  const [horas, setHoras] = useState('');
  const [km, setKm] = useState('');

  // Calculadora rápida
  const [quickValor, setQuickValor] = useState('');
  const [quickKm, setQuickKm] = useState('');
  const [quickResultado, setQuickResultado] = useState<{ lucro: number; valeApena: boolean } | null>(null);
  const [clima, setClima] = useState<ClimaData | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // Keyboard shortcuts: Ctrl+N for new entry, Ctrl+I for import
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N or Cmd+N to open new giro
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setIsRegisterOpen(true);
      }
      // Ctrl+I or Cmd+I to open import
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setIsImportOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save form data to localStorage to prevent data loss
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('dashboard_form_state', JSON.stringify({
        plataforma,
        ganhoBruto,
        horas,
        km,
      }));
    }, 500); // Debounce saves
    return () => clearTimeout(timer);
  }, [plataforma, ganhoBruto, horas, km]);

  const sanitizeDecimalInput = (value: string, max?: number, min?: number) => {
    let sanitized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const firstDot = sanitized.indexOf('.');
    if (firstDot !== -1) {
      sanitized = sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, '');
    }
    if (sanitized) {
      const num = parseFloat(sanitized);
      if (!Number.isNaN(num)) {
        if (max !== undefined && num > max) return String(max);
        if (min !== undefined && num < min) return String(min);
      }
    }
    return sanitized;
  };

  const sanitizeIntegerInput = (value: string, max?: number) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    let num = parseInt(digits, 10);
    if (max !== undefined) num = Math.min(num, max);
    return num.toString();
  };

  const parseNumber = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value);
  };

  const handleMetaDiariaChange = (value: string) => {
    const sanitized = sanitizeDecimalInput(value, 20000, 1);
    if (!sanitized) {
      setMetaDiaria('');
      return;
    }
    const parsed = parseFloat(sanitized);
    if (!Number.isNaN(parsed) && parsed < 1) {
      toast.error('A meta deve ser no mínimo R$ 1.');
      setMetaDiaria('1');
      return;
    }
    setMetaDiaria(sanitized);
  };

  const commitMinLucro = (value?: string) => {
    const target = value ?? minLucroInput;
    if (!target) {
      setMinLucroPorKm(1);
      setMinLucroInput('1');
      return;
    }
    const parsed = parseFloat(target);
    if (Number.isNaN(parsed) || parsed < 0.2) {
      setMinLucroPorKm(1);
      setMinLucroInput('1');
      return;
    }
    setMinLucroPorKm(parsed);
    setMinLucroInput(parsed.toString());
    setMinLucroPrefillLocked(false);
  };

  const custoFixoDiario = useMemo(() => {
    if (!vehicle) return 0;
    const ipva = vehicle.valor_ipva || 0;
    const seguro = vehicle.valor_seguro || 0;
    const financiamentoMensal = vehicle.valor_financiamento || 0;
    return ((ipva + seguro) / 365) + ((financiamentoMensal * 12) / 365);
  }, [vehicle]);

  const custoFixoPorKm = useMemo(() => {
    const kmReferencia = Math.max(1, kmMetaDiaria || 1);
    return custoFixoDiario / kmReferencia;
  }, [custoFixoDiario, kmMetaDiaria]);

  const custoKmEfetivo = useMemo(() => {
    return Math.max(MIN_CUSTO_KM, custoPorKm) + custoFixoPorKm;
  }, [custoPorKm, custoFixoPorKm]);

  // Carregamento inicial
  useEffect(() => {
    if (!user) {
      setVehicle(null);
      setProfileCusto(null);
      setIsPro(false);
      return;
    }
    setCustoManualDirty(false);
    setInitialCustoLoaded(false);

    GiroDataService.fetchVehicle(user.id).then(({ data }) => {
      setVehicle((data as VehicleInfo) || null);
    });

    GiroDataService.fetchTodaySummary(user.id).then(({ data }) => {
      if (data) {
        setTotalLucroDia(data.totalLucro);
        setTotalHorasDia(data.totalHoras);
        setTotalKmDia(data.totalKm);
      }
    });

    setCurrentStreak(GiroDataService.getStreak());
  }, [user]);

  useEffect(() => {
    if (!profile) {
      setIsPro(false);
      return;
    }
    if (profile.meta_diaria) setMetaDiaria(profile.meta_diaria.toString());
    if (typeof profile.min_lucro_km === 'number') {
      const minVal = Math.max(0.5, profile.min_lucro_km);
      setMinLucroPorKm(minVal);
      if (minLucroPrefillLocked) {
        setMinLucroInput(minVal.toString());
      }
    }
    if (typeof profile.km_meta_diaria === 'number' && profile.km_meta_diaria > 0) {
      setKmMetaDiaria(profile.km_meta_diaria);
    }
    if (profile.cidade_padrao) setCidade(profile.cidade_padrao);
    setIsPro(!!profile.is_pro);
    if (!profile.is_pro && typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(UPSSELL_DISMISS_KEY);
      if (!dismissed) {
        setShowLeadBanner(true);
      } else if (dismissed !== 'permanent') {
        const timestamp = parseInt(dismissed, 10);
        if (Number.isFinite(timestamp)) {
          const diffDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          if (diffDays >= UPSSELL_RESHOW_DAYS) {
            localStorage.removeItem(UPSSELL_DISMISS_KEY);
            setShowLeadBanner(true);
          } else {
            setShowLeadBanner(false);
          }
        } else {
          setShowLeadBanner(false);
        }
      } else {
        setShowLeadBanner(false);
      }
    }
  }, [profile, minLucroPrefillLocked]);

  useEffect(() => {
    setMinLucroPrefillLocked(true);
  }, [user?.id]);

  useEffect(() => {
    if (!isPro && typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(UPSSELL_DISMISS_KEY);
      if (!dismissed) {
        setShowLeadBanner(true);
      } else if (dismissed !== 'permanent') {
        const timestamp = parseInt(dismissed, 10);
        if (Number.isFinite(timestamp)) {
          const diffDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          if (diffDays >= UPSSELL_RESHOW_DAYS) {
            localStorage.removeItem(UPSSELL_DISMISS_KEY);
            setShowLeadBanner(true);
          } else {
            setShowLeadBanner(false);
          }
        } else {
          setShowLeadBanner(false);
        }
      } else {
        setShowLeadBanner(false);
      }
    }
  }, [isPro]);

  useEffect(() => {
    if (profileLoading) return;
    if (profile && typeof profile.custo_km === 'number') {
      setProfileCusto(Math.max(MIN_CUSTO_KM, profile.custo_km));
      setCustoManualDirty(false);
      setInitialCustoLoaded(false);
    } else {
      setProfileCusto(null);
    }
  }, [profile, profileLoading]);

  useEffect(() => {
    if (!profileReady || profileCusto === null || custoManualDirty) return;
    if (initialCustoLoaded && Math.abs(custoPorKm - Math.max(MIN_CUSTO_KM, profileCusto - custoFixoPorKm)) < 0.0001) {
      return;
    }
    setCustoPorKm(Math.max(MIN_CUSTO_KM, profileCusto - custoFixoPorKm));
    setCustoManualDirty(false);
    setInitialCustoLoaded(true);
  }, [profileReady, profileCusto, custoFixoPorKm, custoManualDirty, initialCustoLoaded, custoPorKm]);

  useEffect(() => {
    let active = true;
    let retries = 2;

    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?cidade=${encodeURIComponent(cidade)}`);
        if (!active) return;
        
        const data = (await res.json()) as WeatherApiResponse;
        if ('error' in data) {
          setClima(null);
          return;
        }
        setClima(data);
      } catch (error) {
        // Retry on network error
        if (retries > 0 && active) {
          retries--;
          setTimeout(fetchWeather, 1000);
        } else {
          console.error('Weather fetch failed:', error);
          if (active) setClima(null);
        }
      }
    };

    fetchWeather();
    return () => {
      active = false;
    };
  }, [cidade]);

  // Persistir meta
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      updateProfile({
        meta_diaria: parseFloat(metaDiaria) || 0,
        cidade_padrao: cidade,
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [metaDiaria, cidade, user, updateProfile]);

  useEffect(() => {
    if (!user || !profileReady || !initialCustoLoaded) return;
    const timer = setTimeout(() => {
      updateProfile({
        custo_km: custoKmEfetivo,
        min_lucro_km: minLucroPorKm,
        km_meta_diaria: kmMetaDiaria,
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [user, profileReady, initialCustoLoaded, custoKmEfetivo, minLucroPorKm, kmMetaDiaria, updateProfile]);

  const gerarAlerta = useCallback(async () => {
    const metaNum = parseFloat(metaDiaria) || 0;
    if (!user) return;
    setCoachLoading(true);
    setCoachError(null);
    try {
      const promptText = `Analise para motorista em ${cidade}. Lucro total hoje: R$ ${totalLucroDia.toFixed(
        2
      )}. Meta: R$ ${metaNum}. Streak: ${currentStreak}. Alerta curto (max 10 palavras) motivador.`;
      const response = await fetch('/api/generate-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidade, prompt: promptText }),
      });
      const data = await response.json();
      if (!response.ok || !data?.insight) {
        setCoachError('Coach IA indisponível. Gere um plano na aba Insights.');
        setAlerta('');
        return;
      }
      setCoachError(null);
      setAlerta(data.insight);
    } catch (err) {
      console.error('Coach IA falhou', err);
      setCoachError('Coach IA indisponível. Gere um plano na aba Insights.');
      setAlerta('');
    } finally {
      setCoachLoading(false);
    }
  }, [cidade, currentStreak, metaDiaria, totalLucroDia, user]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      gerarAlerta();
    }, 600);
    return () => clearTimeout(timer);
  }, [user, gerarAlerta]);

  const getWeatherIcon = () => {
    if (!clima) return <Cloud className="w-6 h-6 text-gray-400" />;
    const main = clima.principal;
    if (['Rain', 'Drizzle'].includes(main)) return <CloudRain className="w-6 h-6 text-blue-500" />;
    if (main === 'Clear') return <Sun className="w-6 h-6 text-orange-500" />;
    return <Cloud className="w-6 h-6 text-gray-400" />;
  };

  const handleQuickCalcular = () => {
    commitMinLucro();
    const v = parseNumber(quickValor);
    const k = parseNumber(quickKm);
    if (!v || !k) return;
    const lucro = v - k * custoKmEfetivo;
    setQuickResultado({ lucro, valeApena: lucro / k >= minLucroPorKm });
  };

  const handleUpsellSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!leadWhatsapp.trim()) {
      toast.error('Informe seu WhatsApp para conversar com o time.');
      return;
    }
    setLeadLoading(true);
    try {
      const { error } = await GiroDataService.createProPlusLead({
        name: leadName.trim() || (profile?.full_name ?? 'Motorista Free'),
        whatsapp: leadWhatsapp.trim(),
        cidade: leadCity.trim() || profile?.cidade_padrao || undefined,
        source: 'in-app',
        metadata: { page: 'dashboard' },
      });
      if (error) throw error;
      toast.success('Valeu! Vamos chamar você no Whats imediatamente.');
      setLeadName('');
      setLeadWhatsapp('');
      setLeadCity('');
      setShowLeadBanner(false);
      localStorage.setItem(UPSSELL_DISMISS_KEY, 'permanent');
      // TODO: abrir link do WhatsApp oficial quando disponível
      } catch (error) {
        console.error(error);
        toast.error('Não deu certo agora. Tente novamente em instantes.');
    } finally {
      setLeadLoading(false);
    }
  };

  const handleCalcular = async () => {
    const ganhoValue = parseNumber(ganhoBruto);
    const horasValue = parseNumber(horas);
    const kmValue = parseNumber(km);
    if (!ganhoValue || !horasValue || !kmValue) return toast.error('Preenchimento obrigatório!');

    const dados = {
      plataforma,
      ganhoBruto: ganhoValue,
      horasTrabalhadas: horasValue,
      kmRodados: kmValue,
    };

    const calc = calcularGiroDia(dados, custoKmEfetivo);
    setUltimoResultado(calc);
    setLoading(true);

    const registroData = new Date().toISOString();

    if (user) {
      await GiroDataService.insertRegistro({
        user_id: user.id,
        data: registroData,
        plataforma: dados.plataforma,
        ganho_bruto: dados.ganhoBruto,
        horas: dados.horasTrabalhadas,
        km: dados.kmRodados,
        custo_km: custoKmEfetivo,
        lucro: calc.lucroFinal,
      });

      if (GiroDataService.updateOdometer) {
        await GiroDataService.updateOdometer(user.id, dados.kmRodados);
      }
    }

    setTotalLucroDia((prev) => prev + calc.lucroFinal);
    setTotalHorasDia((prev) => prev + dados.horasTrabalhadas);
    setTotalKmDia((prev) => prev + dados.kmRodados);

    setGanhoBruto('');
    setHoras('');
    setKm('');

    const streakResult = GiroDataService.updateStreak(registroData);
    if (streakResult.new) {
      setCurrentStreak(streakResult.streak);
      toast.success(`🎉 Streak de ${streakResult.streak} dias!`);
    }

    setLoading(false);
    setIsRegisterOpen(false);
    toast.success('Giro salvo com sucesso!', {
      description: `Lucro de ${formatarMoeda(calc.lucroFinal)} adicionado ao seu dia.`,
    });
  };

  const metaGoal = parseFloat(metaDiaria);
  const safeMetaGoal = metaGoal > 0 ? metaGoal : 1;
  const progresso = Math.min(100, (totalLucroDia / safeMetaGoal) * 100);
  const metaRemaining = Math.max(0, safeMetaGoal - totalLucroDia);
  const weatherDescription = clima?.descricao || 'Aguardando clima...';
  const weatherTemp = clima ? Math.round(clima.temp) : '--';
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }),
    []
  );
  const metaDiariaValue = Number.isFinite(metaGoal) ? metaGoal : 0;

  const alerts = useMemo<DashboardAlert[]>(() => {
    const items: DashboardAlert[] = [];
    items.push({
      title: 'Meta diária',
      description:
        metaRemaining > 0
          ? `Faltam ${formatarMoeda(metaRemaining)} para atingir sua meta.`
          : 'Meta batida! Continue garantindo horas de qualidade.',
      accent: metaRemaining > 0 ? 'warning' : 'success',
    });
    if (currentStreak > 0) {
      items.push({
        title: 'Streak ativo',
        description: `${currentStreak} dia${currentStreak > 1 ? 's' : ''} consecutivo${
          currentStreak > 1 ? 's' : ''
        }. Não pare agora.`,
        accent: 'success',
      });
    }
    if (alerta) {
      items.push({
        title: 'Coach IA',
        description: alerta,
        accent: 'info',
      });
    } else {
      items.push({
        title: 'Coach IA',
        description: 'Peça um novo plano na aba Insights para liberar uma missão tática.',
        accent: 'info',
      });
    }
    return items;
  }, [metaRemaining, alerta, currentStreak]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <DashboardHeader
        dateLabel={todayLabel}
        isPro={isPro}
        onUpgrade={() => router.push('/giropro-plus')}
        onNewGiro={() => setIsRegisterOpen(true)}
        onImport={() => setIsImportOpen(true)}
        cidade={cidade}
        cidades={CIDADES_PRINCIPAIS}
        onCidadeChange={setCidade}
        weatherIcon={getWeatherIcon()}
        weatherTemp={weatherTemp}
        weatherDescription={weatherDescription}
        metaDiaria={metaDiariaValue}
        custoKmEfetivo={custoKmEfetivo}
        currentStreak={currentStreak}
      />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <GoalTrackerCard
              progresso={progresso}
              metaDiaria={metaDiaria}
              onMetaDiariaChange={handleMetaDiariaChange}
              totalLucroDia={totalLucroDia}
              totalHorasDia={totalHorasDia}
              totalKmDia={totalKmDia}
              metaRemaining={metaRemaining}
              custoKmEfetivo={custoKmEfetivo}
              custoPorKm={custoPorKm}
              custoFixoPorKm={custoFixoPorKm}
            />

            <DashboardAlertsCard
              alerts={alerts}
              onViewInsights={() => router.push('/insights')}
              loading={coachLoading}
              error={coachError}
              onRetry={gerarAlerta}
            />

            <LastRunCard result={ultimoResultado} onNewRun={() => setIsRegisterOpen(true)} />
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Clima hoje</p>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{cidade}</h3>
                </div>
                {getWeatherIcon()}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">{weatherDescription}</p>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Streak</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">
                    {currentStreak > 0 ? `${currentStreak} dias` : 'Sem streak'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Custo/km</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{formatarMoeda(custoKmEfetivo)}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Base {formatarMoeda(custoPorKm)} • Fixo {formatarMoeda(custoFixoPorKm)}/km
                  </p>
                </div>
              </div>
            </div>

            {!isPro && showLeadBanner && (
              <div className="bg-white dark:bg-gray-950 rounded-3xl border border-dashed border-orange-200 dark:border-orange-500/40 shadow-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-orange-400 font-bold">Pro+</p>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">Desbloqueie o combo IA + simulador</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Foi maluco nas corridas? Bora liberar tudo com a gente.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeadBanner(false);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(UPSSELL_DISMISS_KEY, Date.now().toString());
                      }
                    }}
                    className="text-sm text-orange-500 hover:underline"
                  >
                    Agora não
                  </button>
                </div>
                <form onSubmit={handleUpsellSubmit} className="grid gap-3">
                  <Input
                    placeholder="Nome"
                    value={leadName}
                    onChange={(event) => setLeadName(event.target.value)}
                  />
                  <Input
                    placeholder="WhatsApp"
                    value={leadWhatsapp}
                    onChange={(event) => setLeadWhatsapp(event.target.value)}
                    required
                  />
                  <Input
                    placeholder="Cidade (opcional)"
                    value={leadCity}
                    onChange={(event) => setLeadCity(event.target.value)}
                  />
                  <Button type="submit" className="rounded-full" disabled={leadLoading}>
                    {leadLoading ? 'Enviando...' : 'Quero falar com o time'}
                  </Button>
                </form>
              </div>
            )}

            <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Calculadora rápida</p>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Avalie corridas em segundos</h3>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsCalcOpen(true)}>
                  Abrir
                </Button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-400 font-bold tracking-[0.3em]">Mínimo R$/km aceitável</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={minLucroInput}
                  onChange={(e) => {
                    const sanitized = sanitizeDecimalInput(e.target.value, 10);
                    setMinLucroInput(sanitized);
                    setMinLucroPrefillLocked(false);
                  }}
                  onBlur={() => commitMinLucro()}
                  placeholder="Ex: 2,50"
                  className="h-12 text-lg font-black rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent"
                />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Corridas abaixo de {formatarMoeda(minLucroPorKm)} por km aparecem como Recusar.
                </p>
              </div>
              {quickResultado ? (
                <div
                  className={cn(
                    'p-4 rounded-2xl border text-center',
                    quickResultado.valeApena
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  )}
                >
                  <div className="flex justify-center items-center gap-2 text-2xl font-black mb-1">
                    {quickResultado.valeApena ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                    {quickResultado.valeApena ? 'Aceita!' : 'Recusa!'}
                  </div>
                  <p className="text-sm font-semibold">Lucro estimado: {formatarMoeda(quickResultado.lucro)}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use a calculadora para testar viagens antes mesmo de aceitar.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Simulador & IA</p>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Monte cenários completos</h3>
                </div>
                <Button size="sm" className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900" onClick={() => router.push('/simulador')}>
                  Abrir simulador
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Combine missões, hotspots e o simulador Pro+ para decidir onde rodar antes de sair de casa.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ImportTripsModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          // Refresh data
          window.location.reload();
        }}
      />

      <Drawer open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DrawerContent className="dark:bg-gray-950 border-t dark:border-gray-800 h-[85vh]">
          <div className="mx-auto w-full max-w-md px-6 py-6 h-full overflow-y-auto">
            <DrawerHeader className="px-0 mb-6 text-left">
              <DrawerTitle className="text-3xl font-black">Registrar</DrawerTitle>
              <DrawerDescription>Preencha os dados da sua rodagem.</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-8">
              <FeatureButtonGroup
                label="Plataforma"
                options={plataformas}
                selected={plataforma}
                onSelect={setPlataforma}
                colorClass="bg-gray-900 text-white shadow-md dark:bg-white dark:text-black"
              />
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Ganho Total</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={ganhoBruto}
                      onChange={(e) => setGanhoBruto(sanitizeDecimalInput(e.target.value, 20000, 1))}
                      placeholder="0.00"
                      className="pl-12 h-16 text-3xl font-black rounded-2xl bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <VoiceInput onResult={(val: string) => setGanhoBruto(sanitizeDecimalInput(val, 20000, 1))} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Horas</label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={horas}
                      onChange={(e) => setHoras(sanitizeIntegerInput(e.target.value, 24))}
                      placeholder="0"
                      className="h-16 text-lg font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">KM rodados</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={km}
                      onChange={(e) => setKm(sanitizeDecimalInput(e.target.value, 600, 1))}
                      placeholder="0"
                      className="h-16 text-lg font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Custo variável (combustível) por km</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={custoPorKm.toFixed(2)}
                      onChange={(e) => {
                        setCustoManualDirty(true);
                        const sanitized = sanitizeDecimalInput(e.target.value, 50, MIN_CUSTO_KM);
                        if (!sanitized) {
                          setCustoPorKm(MIN_CUSTO_KM);
                          return;
                        }
                        const parsed = Math.round(parseFloat(sanitized) * 100) / 100;
                        if (!Number.isNaN(parsed)) {
                          setCustoPorKm(Math.max(MIN_CUSTO_KM, parsed));
                        }
                      }}
                      placeholder="0.50"
                      className="pl-12 h-16 text-lg font-bold rounded-2xl bg-gray-50 dark:bg-gray-900 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    DNA do carro entra automático pelo documento. Este campo é só combustível + manutenção.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">KM médio por dia</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={kmMetaDiaria.toString()}
                    onChange={(e) => {
                      const sanitized = sanitizeIntegerInput(e.target.value, 600);
                      setKmMetaDiaria(sanitized ? parseInt(sanitized, 10) : 1);
                    }}
                    placeholder="180"
                    className="h-14 text-xl font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Usamos esse valor para diluir IPVA, seguro e financiamento nos seus custos/km.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                <Button
                  onClick={handleCalcular}
                  disabled={loading}
                  className="h-14 rounded-2xl font-black text-lg bg-gray-900 text-white hover:bg-black"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Salvar giro'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsRegisterOpen(false)}
                  className="h-12 rounded-2xl border-gray-300 dark:border-gray-700"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isCalcOpen} onOpenChange={setIsCalcOpen}>
        <DrawerContent className="dark:bg-gray-950 border-t dark:border-gray-800 h-[70vh]">
          <div className="mx-auto w-full max-w-md px-6 py-6 h-full overflow-y-auto">
            <DrawerHeader className="px-0 mb-6 text-left">
              <DrawerTitle className="text-3xl font-black">Calculadora rápida</DrawerTitle>
              <DrawerDescription>Teste viagens antes de aceitar.</DrawerDescription>
            </DrawerHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Valor da corrida</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={quickValor}
                      onChange={(e) => setQuickValor(sanitizeDecimalInput(e.target.value, 500, 5))}
                      placeholder="15,00"
                      className="pl-10 h-16 text-lg font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Distância (km)</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={quickKm}
                    onChange={(e) => setQuickKm(sanitizeDecimalInput(e.target.value, 200, 1))}
                    placeholder="8"
                    className="h-16 text-lg font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Mínimo R$/km aceitável</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={minLucroInput}
                  onChange={(e) => {
                    const sanitized = sanitizeDecimalInput(e.target.value, 10);
                    setMinLucroInput(sanitized);
                    setMinLucroPrefillLocked(false);
                  }}
                  onBlur={() => commitMinLucro()}
                  className="h-16 text-lg font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-transparent text-center"
                />
              </div>
              <Button
                onClick={handleQuickCalcular}
                className="w-full h-14 rounded-2xl font-black text-lg bg-orange-500 hover:bg-orange-600"
              >
                Calcular
              </Button>
              {quickResultado && (
                <div
                  className={cn(
                    'p-4 rounded-2xl border text-center',
                    quickResultado.valeApena
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  )}
                >
                  <p className="text-sm uppercase font-bold tracking-[0.3em] mb-1">
                    {quickResultado.valeApena ? 'Boa' : 'Fuja'}
                  </p>
                  <p className="text-3xl font-black">{formatarMoeda(quickResultado.lucro)}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Considerando seu custo atual de {formatarMoeda(custoKmEfetivo)} por km.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default function Page() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <DashboardContent user={user} />;
}
