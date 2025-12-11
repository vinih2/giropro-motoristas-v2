// src/app/insights/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plataforma } from '@/lib/types';
import { Cloud, CloudRain, Sun } from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProtectedRoute from '@/components/ProtectedRoute'; 
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useRouter } from 'next/navigation';
import { fetchHotspots, fetchHotspotDetails, Hotspot, HotspotDetails } from '@/services/placesService';
import { queueRegistroPrefill, queueSimuladorPrefill, readStoredSimuladorScenarios, StoredSimuladorScenario, SIMULADOR_SCENARIOS_SYNC_EVENT, persistStoredSimuladorScenarios } from '@/lib/dashboard-bridge';
import { HotspotList } from '@/components/insights/HotspotList';
import { InsightsHeader } from '@/components/insights/InsightsHeader';
const InsightsMapSection = dynamic(() => import('@/components/insights/InsightsMapSection').then((mod) => mod.InsightsMapSection), {
  ssr: false,
  loading: () => <div className="h-[420px] md:h-[560px] rounded-[32px] bg-gray-100 dark:bg-gray-900 animate-pulse" />,
});
import { InsightsSidebar } from '@/components/insights/InsightsSidebar';
import { InsightsFavoriteScenarios } from '@/components/insights/InsightsFavoriteScenarios';
import { ScenarioTagDialog } from '@/components/insights/ScenarioTagDialog';
import { InsightsGettingStarted } from '@/components/insights/InsightsGettingStarted';
import { fetchSimulatorFavorites, replaceSimulatorFavorites } from '@/services/simulatorFavoritesService';
import { logAnalyticsEvent } from '@/services/analyticsService';

// --- LISTA DE CIDADES (MOVIDA PARA O ESCOPO GLOBAL DESTE ARQUIVO) ---
const CIDADES_PRINCIPAIS = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Fortaleza', 
  'Curitiba', 'Manaus', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos', 
  'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal'
];
const getTodayStamp = () => new Date().toISOString().split('T')[0];
const getUsageKey = (userId: string) => `insights_ia_uses_${userId}`;
const GETTING_STARTED_KEY = 'insights_getting_started';
type ClimaData = {
  temp: number;
  descricao: string;
  icon: string;
  principal: string;
  hourly: Array<{
    time: string;
    temp: number;
    main: string;
    description: string;
    icon: string;
    rainChance: number;
    wind: number;
  }>;
} | null;

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
  'Belo Horizonte': { lat: -19.9167, lng: -43.9345 },
  'Brasília': { lat: -15.7801, lng: -47.9292 },
  'Salvador': { lat: -12.9777, lng: -38.5016 },
  'Fortaleza': { lat: -3.7172, lng: -38.5433 },
  'Curitiba': { lat: -25.4284, lng: -49.2733 },
  'Manaus': { lat: -3.119, lng: -60.0217 },
  'Recife': { lat: -8.0543, lng: -34.8813 },
  'Porto Alegre': { lat: -30.0346, lng: -51.2177 },
  'Goiânia': { lat: -16.6869, lng: -49.2648 },
  'Belém': { lat: -1.4558, lng: -48.4902 },
  'Guarulhos': { lat: -23.4542, lng: -46.5337 },
  'Campinas': { lat: -22.9099, lng: -47.0626 },
  'São Luís': { lat: -2.5307, lng: -44.3068 },
  'São Gonçalo': { lat: -22.8275, lng: -43.0632 },
  'Maceió': { lat: -9.6662, lng: -35.7351 },
  'Duque de Caxias': { lat: -22.7923, lng: -43.3082 },
  'Natal': { lat: -5.7945, lng: -35.211 },
  'Campo Grande': { lat: -20.4697, lng: -54.6201 },
  'Teresina': { lat: -5.0919, lng: -42.8034 },
  'João Pessoa': { lat: -7.1195, lng: -34.845 },
  'Florianópolis': { lat: -27.5954, lng: -48.548 },
  'Cuiabá': { lat: -15.6014, lng: -56.0979 },
  'Aracaju': { lat: -10.9472, lng: -37.0731 },
  'Vitória': { lat: -20.3194, lng: -40.3377 },
};

const parseDistanceKm = (text?: string) => {
  if (!text) return 0;
  const match = text.match(/([\d.,]+)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(',', '.'));
};

const parseDurationHours = (text?: string) => {
  if (!text) return 0;
  let hours = 0;
  const hourMatch = text.match(/(\d+)\s*h/);
  const minuteMatch = text.match(/(\d+)\s*min/);
  if (hourMatch) hours += parseInt(hourMatch[1], 10);
  if (minuteMatch) hours += parseInt(minuteMatch[1], 10) / 60;
  if (!hourMatch && !minuteMatch) {
    const numeric = parseFloat(text.replace(',', '.'));
    if (!Number.isNaN(numeric)) hours += numeric / 60;
  }
  return hours || 0;
};

function InsightsContent() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();
  const featureFlags = useFeatureFlags();
  const userId = user?.id ?? '';
  const [cidade, setCidade] = useState(CIDADES_PRINCIPAIS[0]);
  const [plataforma, setPlataforma] = useState<Plataforma>('Uber');
  const [insightRapido, setInsightRapido] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [clima, setClima] = useState<ClimaData>(null);
  const [iaUseCount, setIaUseCount] = useState(0);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [hotspotSort, setHotspotSort] = useState<'distance' | 'rating'>('distance');
  const [hotspotFilter, setHotspotFilter] = useState<'all' | 'open'>('all');
  const [loadingHotspots, setLoadingHotspots] = useState(false);
  const [expandedHotspot, setExpandedHotspot] = useState<string | null>(null);
  const [hotspotDetails, setHotspotDetails] = useState<Record<string, HotspotDetails>>({});
  const [loadingHotspotDetail, setLoadingHotspotDetail] = useState<string | null>(null);
  const [favoriteScenarios, setFavoriteScenarios] = useState<StoredSimuladorScenario[]>([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagDialogHint, setTagDialogHint] = useState('');
  const tagResolverRef = useRef<((value?: string) => void) | null>(null);
  const [iaError, setIaError] = useState('');
  const [hotspotsError, setHotspotsError] = useState<string | null>(null);
  const [gettingStartedSteps, setGettingStartedSteps] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(GETTING_STARTED_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const isPro = !!profile?.is_pro;
  const missionsConfig = featureFlags.missions_ai ?? { free_limit: 3 };
  const freeMissionLimit = missionsConfig.free_limit ?? 3;
  const hasMissionLimit = !isPro && typeof freeMissionLimit === 'number';
  const reachedLimit = hasMissionLimit && iaUseCount >= freeMissionLimit;

  useEffect(() => {
    if (profile?.cidade_padrao) {
      setCidade(profile.cidade_padrao);
    }
  }, [profile?.cidade_padrao]);

  useEffect(() => {
    if (!userId) {
      setIaUseCount(0);
      return;
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(getUsageKey(userId));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.date === getTodayStamp()) {
            setIaUseCount(parsed.count || 0);
            return;
          }
        }
      } catch {
        // ignore parse errors
      }
      setIaUseCount(0);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(GETTING_STARTED_KEY);
      if (stored) setGettingStartedSteps(JSON.parse(stored));
    } catch {
      setGettingStartedSteps([]);
    }
  }, []);

  const syncFavoriteScenarios = useCallback(async () => {
    if (!userId) {
      setFavoriteScenarios([]);
      return;
    }
    const stored = readStoredSimuladorScenarios(userId)
      .filter((scenario) => scenario.favorite || scenario.tag)
      .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
    setFavoriteScenarios(stored);
    try {
      const { data } = await fetchSimulatorFavorites(userId);
      if (data && data.length) {
        persistStoredSimuladorScenarios(userId, data);
        setFavoriteScenarios(
          data.filter((scenario) => scenario.favorite || scenario.tag).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
        );
      }
    } catch (error) {
      console.warn('Não foi possível sincronizar os favoritos remotos', error);
    }
  }, [userId]);

  useEffect(() => {
    syncFavoriteScenarios();
  }, [syncFavoriteScenarios]);

  const markGettingStartedStep = useCallback((stepId: string) => {
    setGettingStartedSteps((prev) => {
      if (prev.includes(stepId)) return prev;
      const next = [...prev, stepId];
      if (typeof window !== 'undefined') {
        localStorage.setItem(GETTING_STARTED_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const persistScenarioFromInsights = useCallback(
    async (scenario: StoredSimuladorScenario, successMessage: string) => {
      if (!userId) {
        toast.error('Não foi possível identificar o usuário para salvar o cenário.');
        return;
      }
      const stored = readStoredSimuladorScenarios(userId);
      const next = [scenario, ...stored.filter((item) => item.id !== scenario.id)];
      persistStoredSimuladorScenarios(userId, next);
      try {
        await replaceSimulatorFavorites(userId, next);
      } catch (error) {
        console.warn('Não foi possível salvar favoritos no servidor', error);
      }
      syncFavoriteScenarios();
      markGettingStartedStep('favorite');
      toast.success(successMessage);
    },
    [userId, syncFavoriteScenarios, markGettingStartedStep]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleSyncEvent = () => syncFavoriteScenarios();
    const storageKey = userId ? `simulador_scenarios_${userId}` : null;
    const handleStorage = (event: StorageEvent) => {
      if (!storageKey) return;
      if (event.key === storageKey) {
        syncFavoriteScenarios();
      }
    };
    window.addEventListener(SIMULADOR_SCENARIOS_SYNC_EVENT, handleSyncEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SIMULADOR_SCENARIOS_SYNC_EVENT, handleSyncEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncFavoriteScenarios, userId]);

  const closeTagDialog = useCallback(() => {
    setTagDialogOpen(false);
    setTagInputValue('');
    setTagDialogHint('');
  }, []);

  const resolveTagDialog = useCallback(
    (value?: string) => {
      if (tagResolverRef.current) {
        tagResolverRef.current(value && value.trim() ? value.trim() : undefined);
        tagResolverRef.current = null;
      }
      closeTagDialog();
    },
    [closeTagDialog]
  );
  const handleConfirmTagDialog = useCallback(() => resolveTagDialog(tagInputValue), [resolveTagDialog, tagInputValue]);
  const handleSkipTagDialog = useCallback(() => resolveTagDialog(undefined), [resolveTagDialog]);

  useEffect(() => {
    if (!cidade) return;
    type WeatherApiResponse = (Exclude<ClimaData, null> & { error?: undefined }) | { error: string };
    fetch(`/api/weather?cidade=${cidade}`)
      .then(async (res) => res.json() as Promise<WeatherApiResponse>)
      .then((data) => {
        if ('error' in data) return;
        setClima(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [cidade]);

  const HOTSPOT_KEYWORDS = useMemo(() => [
    'aeroporto',
    'rodoviaria',
    'ponto de taxi',
    'shopping',
    'hospital',
    'estadio',
    'terminal',
    'rodovia',
    'metrô',
  ], []);

  const loadHotspots = useCallback(async () => {
    if (!userId) return;
    const coords = CITY_COORDS[cidade] || CITY_COORDS['São Paulo'];
    setLoadingHotspots(true);
    setHotspotsError(null);
    try {
      const keywords = [...HOTSPOT_KEYWORDS].sort(() => Math.random() - 0.5).slice(0, 3);
      const results = await Promise.all(
        keywords.map((word) => fetchHotspots(coords.lat, coords.lng, word).catch(() => []))
      );
      const merged: Hotspot[] = [];
      const seen = new Set<string>();
      results.flat().forEach((spot) => {
        const key = `${spot.name}-${spot.location?.lat}-${spot.location?.lng}`;
        if (spot.location && !seen.has(key)) {
          seen.add(key);
          merged.push({ ...spot, category: keywords.join(', ') });
        }
      });
      setHotspots(merged.slice(0, 5));
      setHotspotsError(null);
    } catch {
      setHotspots([]);
      setHotspotsError('Não foi possível carregar os hotspots agora.');
    } finally {
      setLoadingHotspots(false);
    }
  }, [userId, cidade, HOTSPOT_KEYWORDS]);

  useEffect(() => {
    if (!userId) return;
    loadHotspots();
    const refreshTimer = setInterval(loadHotspots, 10 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, [userId, loadHotspots]);

  const persistUsage = (count: number) => {
      if (!userId || typeof window === 'undefined') return;
      localStorage.setItem(getUsageKey(userId), JSON.stringify({ date: getTodayStamp(), count }));
  };

  const handleGerar = async () => {
    if (reachedLimit) {
        toast.error("Limite diário de estratégias atingido. Torne-se PRO para uso ilimitado.");
        return;
    }
    setLoadingIA(true);
    setIaError('');
    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cidade, plataforma, 
          prompt: `Sou motorista ${plataforma} em ${cidade}. Clima: ${clima?.descricao}. Me dê uma estratégia tática curta de onde ir agora para lucrar mais.`
        }),
      });
      const data = await response.json();
      setInsightRapido(data.insight);
      setIaError('');
      logAnalyticsEvent(userId || undefined, 'insights_generate_plan', { cidade, plataforma, pro: isPro });
      queueRegistroPrefill({
        origem: 'insight',
        cidade,
        plataforma,
        hint: data.insight
      });
      markGettingStartedStep('generate_plan');
      const newCount = iaUseCount + 1;
      setIaUseCount(newCount);
      persistUsage(newCount);
    } catch (error) {
      console.error(error);
      toast.error("Erro na IA.");
      setIaError('Não foi possível gerar a missão agora.');
    } finally {
      setLoadingIA(false);
    }
  };

  const getWeatherIcon = () => {
      if (!clima) return <Cloud className="text-gray-400" />;
      const main = clima.principal;
      if (['Rain', 'Drizzle'].includes(main)) return <CloudRain className="text-blue-500" />;
      if (main === 'Clear') return <Sun className="text-orange-500 fill-orange-100" />;
      return <Cloud className="text-gray-500 fill-gray-100" />;
  };

  const getDemandHint = (details?: HotspotDetails | null) => {
      if (!details) return '';
      const rating = details.rating ?? 0;
      const total = details.userRatingsTotal ?? 0;
      if (details.openNow === false) {
          return 'Fechado agora — monitore para reabrir e aproveitar o fluxo inicial.';
      }
      if (rating >= 4.6 && total > 800) {
          return 'Muito bem avaliado e procura constante. Ótimo para aproveitar dinâmica.';
      }
      if (rating >= 4.2 && total > 300) {
          return 'Bom volume de pedidos e avaliações positivas.';
      }
      return 'Movimento moderado — bom ponto para completar a meta.';
  };

  const requestScenarioTag = useCallback(
    (suggestion: string) =>
      new Promise<string | undefined>((resolve) => {
        tagResolverRef.current = resolve;
        setTagInputValue(suggestion);
        setTagDialogHint(suggestion);
        setTagDialogOpen(true);
      }),
    []
  );

  const handleToggleHotspot = async (spot: Hotspot) => {
      if (!spot.placeId) return;
      if (expandedHotspot === spot.placeId) {
          setExpandedHotspot(null);
          return;
      }
      setExpandedHotspot(spot.placeId);
      if (hotspotDetails[spot.placeId]) return;
      setLoadingHotspotDetail(spot.placeId);
      try {
          const details = await fetchHotspotDetails(spot.placeId);
          if (details) {
            const placeKey = spot.placeId;
            if (placeKey) {
              setHotspotDetails((prev) => ({ ...prev, [placeKey]: details }));
            }
          }
      } catch (error) {
          console.error(error);
          toast.error("Não foi possível carregar os detalhes desse hotspot.");
      } finally {
          setLoadingHotspotDetail(null);
      }
  };

  const handleOpenSimulator = useCallback(() => {
    router.push('/simulador');
  }, [router]);

  const handleSendHotspotToSimulator = useCallback(
    (spot: Hotspot) => {
      const km = parseDistanceKm(spot.route?.distance) || 20;
      const horas = parseDurationHours(spot.route?.durationInTraffic || spot.route?.duration) || 1.2;
      queueSimuladorPrefill({
        name: spot.name,
        cidade,
        plataforma,
        horas: Math.max(1, Number(horas.toFixed(1))),
        km: Math.max(10, Math.round(km)),
        tarifaMedia: Number((26 + Math.random() * 6).toFixed(2)),
        demanda: spot.route ? 'Alta' : 'Média',
        hint: `Hotspot ${spot.name}`,
      });
      logAnalyticsEvent(userId || undefined, 'insights_send_to_simulator', {
        source: 'hotspot',
        cidade,
        plataforma,
        hotspotId: spot.placeId || spot.name,
      });
      markGettingStartedStep('send_to_sim');
      handleOpenSimulator();
    },
    [cidade, plataforma, handleOpenSimulator, userId, markGettingStartedStep]
  );

  const handleSimulateFavorite = useCallback(
    (scenario: StoredSimuladorScenario) => {
      queueSimuladorPrefill({
        name: scenario.name,
        cidade: scenario.cidade,
        plataforma: scenario.plataforma,
        horas: scenario.horas,
        km: scenario.km,
        tarifaMedia: scenario.tarifaMedia,
        demanda: scenario.demanda,
        hint: scenario.tag ? `Plano favorito • ${scenario.tag}` : 'Plano favorito do Insights',
      });
      logAnalyticsEvent(userId || undefined, 'insights_simulate_favorite', {
        scenarioId: scenario.id,
        cidade: scenario.cidade,
        plataforma: scenario.plataforma,
      });
      markGettingStartedStep('send_to_sim');
      handleOpenSimulator();
    },
    [handleOpenSimulator, userId, markGettingStartedStep]
  );

  const handleSaveInsightPlan = useCallback(async () => {
    if (!insightRapido) return;
    if (!isPro) {
      toast.error('Favoritos e etiquetas estão disponíveis no plano Pro+.');
      router.push('/giropro-plus');
      return;
    }
    const tag = await requestScenarioTag(`Plano ${cidade}`);
    const scenario: StoredSimuladorScenario = {
      id: `insight-${Date.now()}`,
      name: `Plano IA - ${cidade}`,
      cidade,
      plataforma,
      horas: 4,
      km: 80,
      tarifaMedia: 30,
      demanda: 'Alta',
      hint: insightRapido,
      favorite: true,
      tag,
      savedAt: Date.now(),
    };
    await persistScenarioFromInsights(scenario, 'Plano salvo nos favoritos do simulador.');
    logAnalyticsEvent(userId || undefined, 'insights_save_plan', { cidade, plataforma });
  }, [cidade, plataforma, insightRapido, isPro, persistScenarioFromInsights, requestScenarioTag, router, userId]);

  const handleSaveHotspotFavorite = useCallback(
    async (spot: Hotspot) => {
      if (!isPro) {
        toast.error('Favoritar cenários exige o plano Pro+.');
        router.push('/giropro-plus');
        return;
      }
      const km = parseDistanceKm(spot.route?.distance) || 20;
      const horas = parseDurationHours(spot.route?.durationInTraffic || spot.route?.duration) || 1.2;
      const tag = await requestScenarioTag(spot.name);
      const scenario: StoredSimuladorScenario = {
        id: `hotspot-${spot.placeId || Date.now()}`,
        name: spot.name,
        cidade,
        plataforma,
        horas: Math.max(1, Number(horas.toFixed(1))),
        km: Math.max(10, Math.round(km)),
        tarifaMedia: Number((26 + Math.random() * 6).toFixed(2)),
        demanda: spot.route ? 'Alta' : 'Média',
        hint: `Hotspot ${spot.name}`,
        favorite: true,
        tag,
        savedAt: Date.now(),
      };
      await persistScenarioFromInsights(scenario, 'Hotspot salvo como favorito no simulador.');
      logAnalyticsEvent(userId || undefined, 'insights_favorite_hotspot', {
        cidade,
        plataforma,
        hotspotId: spot.placeId || spot.name,
      });
    },
    [cidade, plataforma, isPro, persistScenarioFromInsights, requestScenarioTag, router, userId]
  );

  const handleApplyPlan = useCallback(() => {
    if (!insightRapido) return;
    queueRegistroPrefill({ origem: 'insight', cidade, plataforma, hint: insightRapido });
    toast.success('Plano enviado para o painel principal.');
    logAnalyticsEvent(userId || undefined, 'insights_apply_plan', { cidade, plataforma });
  }, [cidade, plataforma, insightRapido, userId]);

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-32 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      
      <InsightsHeader
        cidades={CIDADES_PRINCIPAIS}
        cidade={cidade}
        onCidadeChange={setCidade}
        clima={clima}
        weatherIcon={getWeatherIcon()}
      />

      <main className="container max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
            
            <InsightsMapSection cidade={cidade} plataforma={plataforma} hotspots={hotspots} />

            <InsightsGettingStarted
              completed={gettingStartedSteps}
              onGeneratePlan={handleGerar}
              onOpenSimulator={handleOpenSimulator}
              isPro={isPro}
              onUpgrade={() => router.push('/giropro-plus')}
            />

            <InsightsFavoriteScenarios
              scenarios={favoriteScenarios}
              onSimulate={handleSimulateFavorite}
              onOpenSimulator={handleOpenSimulator}
            />

            <InsightsSidebar
              cidade={cidade}
              plataforma={plataforma}
              onPlatformChange={setPlataforma}
              clima={clima}
              isPro={isPro}
              loadingIA={loadingIA}
              insight={insightRapido}
              reachedLimit={reachedLimit}
              freeMissionLimit={freeMissionLimit}
              iaUseCount={iaUseCount}
              onGenerate={handleGerar}
              onApplyNewRun={handleApplyPlan}
              onSendToSimulator={() => {
                if (!insightRapido) return;
                queueSimuladorPrefill({
                  name: `Plano IA - ${cidade}`,
                  cidade,
                  plataforma,
                  horas: 4,
                  km: 80,
                  tarifaMedia: 30,
                  demanda: 'Alta',
                  hint: insightRapido,
                });
                toast.success('Plano enviado para o simulador.');
                logAnalyticsEvent(userId || undefined, 'insights_send_to_simulator', {
                  source: 'ia_card',
                  cidade,
                  plataforma,
                });
                markGettingStartedStep('send_to_sim');
                handleOpenSimulator();
              }}
              onSaveFavoritePlan={handleSaveInsightPlan}
              onUpgrade={() => router.push('/giropro-plus')}
              iaError={iaError}
              onRetryGenerate={handleGerar}
            />

            <HotspotList
              hotspots={hotspots}
              loading={loadingHotspots}
              expandedHotspot={expandedHotspot}
              onToggleHotspot={handleToggleHotspot}
              hotspotDetails={hotspotDetails}
              loadingHotspotDetail={loadingHotspotDetail}
              isPro={isPro}
              onSendToSimulator={handleSendHotspotToSimulator}
              onUpgrade={() => router.push('/giropro-plus')}
              getDemandHint={getDemandHint}
              sortOption={hotspotSort}
              filterOpen={hotspotFilter}
              onSortChange={setHotspotSort}
              onFilterChange={setHotspotFilter}
              onSaveFavorite={handleSaveHotspotFavorite}
              error={hotspotsError}
              onRetry={loadHotspots}
            />

        </div>
      </main>
      <ScenarioTagDialog
        open={tagDialogOpen}
        value={tagInputValue}
        suggestion={tagDialogHint}
        onValueChange={setTagInputValue}
        onConfirm={handleConfirmTagDialog}
        onSkip={handleSkipTagDialog}
        onOpenChange={(next) => {
          if (!next && tagDialogOpen) {
            handleSkipTagDialog();
          }
        }}
      />
    </div>
  );
}

export default function InsightsPageWithAuth() {
    return (
        <ProtectedRoute>
            <InsightsContent />
        </ProtectedRoute>
    );
}
