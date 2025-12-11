'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { calcularGiroDia, formatarMoeda } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Scenario, EnrichedScenario, BaseScenario } from '@/components/simulador/types';
import { ScenarioCard } from '@/components/simulador/ScenarioCard';
import { CustomSimulator } from '@/components/simulador/CustomSimulator';
import { SimulatorKpis } from '@/components/simulador/SimulatorKpis';
import { SimulatorTips } from '@/components/simulador/SimulatorTips';
import { SimulatorHero } from '@/components/simulador/SimulatorHero';
import { SimulatorPaywall } from '@/components/simulador/SimulatorPaywall';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { readSimuladorPrefill, clearSimuladorPrefill, SimuladorPrefillPayload, readStoredSimuladorScenarios, persistStoredSimuladorScenarios, StoredSimuladorScenario } from '@/lib/dashboard-bridge';
import type { UserProfile } from '@/services/giroService';
import { fetchSimulatorFavorites, replaceSimulatorFavorites } from '@/services/simulatorFavoritesService';
import { logAnalyticsEvent } from '@/services/analyticsService';

const DEMAND_MULTIPLIERS: Record<string, number> = {
  Baixa: 0.85,
  Média: 1,
  Alta: 1.2,
  Pico: 1.4,
};

type SortOption = 'recent' | 'lucro' | 'km' | 'plataforma';

const DEFAULT_SCENARIOS: BaseScenario[] = [
  { id: 'manha', name: 'Centro • manhã', cidade: 'São Paulo', plataforma: 'Uber', horas: 4, tarifaMedia: 32, km: 70, demanda: 'Alta' },
  { id: 'noite', name: 'Zona Leste • noite', cidade: 'São Paulo', plataforma: '99', horas: 6, tarifaMedia: 28, km: 110, demanda: 'Pico' },
  { id: 'madrugada', name: 'Rodovia • madrugada', cidade: 'Campinas', plataforma: 'Uber', horas: 5, tarifaMedia: 24, km: 130, demanda: 'Média' },
];

const CUSTOM_SCENARIO_LIMIT = 5;

const getMultiplier = (demanda: string) => DEMAND_MULTIPLIERS[demanda] ?? 1;
const INITIAL_SCENARIOS: Scenario[] = DEFAULT_SCENARIOS.map((scenario) => ({
  ...scenario,
  custom: false,
}));

function useCustoPadrao(profile?: UserProfile | null) {
  const [custo, setCusto] = useState(0.5);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem('custoPorKm');
      if (persisted) setCusto(parseFloat(persisted));
    }
  }, []);

  useEffect(() => {
    if (!profile || typeof profile.custo_km !== 'number') return;
    const next = Math.max(0, profile.custo_km);
    setCusto(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('custoPorKm', next.toFixed(2));
    }
  }, [profile]);

  return [custo, setCusto] as const;
}

function enrichScenario(scenario: Scenario, custoPadrao: number): EnrichedScenario {
  const custo = custoPadrao;
  const multiplicador = getMultiplier(scenario.demanda);
  const ganho = scenario.tarifaMedia * scenario.horas * multiplicador;
  const calc = calcularGiroDia(
    {
      plataforma: scenario.plataforma as any,
      ganhoBruto: ganho,
      horasTrabalhadas: scenario.horas,
      kmRodados: scenario.km,
    },
    custo
  );

  return {
    ...scenario,
    ganho,
    lucro: calc.lucroFinal,
    ganhoHora: calc.ganhoPorHora,
    custo,
  };
}

function useEnrichedScenarios(list: Scenario[], custoPadrao: number) {
  return useMemo(() => list.map((scenario) => enrichScenario(scenario, custoPadrao)), [list, custoPadrao]);
}

function SimuladorContent() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [custoPadrao] = useCustoPadrao(profile);
  const [scenarios, setScenarios] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [prefillData, setPrefillData] = useState<SimuladorPrefillPayload | null>(null);
  const userId = user?.id;
  const isPro = !!profile?.is_pro;
  const accessChecked = !profileLoading;
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [platformFilter, setPlatformFilter] = useState<string>('Todos');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [failedPrefill, setFailedPrefill] = useState<SimuladorPrefillPayload | null>(null);

  const mapStoredToScenario = useCallback(
    (scenario: StoredSimuladorScenario): Scenario => ({
      id: scenario.id,
      name: scenario.name,
      cidade: scenario.cidade,
      plataforma: scenario.plataforma || 'Uber',
      horas: scenario.horas,
      km: scenario.km,
      tarifaMedia: scenario.tarifaMedia,
      demanda: scenario.demanda || 'Média',
      custom: true,
      savedAt: scenario.savedAt,
      favorite: !!scenario.favorite,
      tag: scenario.tag,
    }),
    []
  );

  useEffect(() => {
    if (!userId) return;
    const stored = readStoredSimuladorScenarios(userId);
    if (stored.length) {
      const orderedCustom = stored.map(mapStoredToScenario).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
      setScenarios([...orderedCustom, ...DEFAULT_SCENARIOS]);
    }
    let cancelled = false;
    const fetchRemote = async () => {
      const { data } = await fetchSimulatorFavorites(userId);
      if (cancelled || !data.length) return;
      const ordered = data.map(mapStoredToScenario).sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
      setScenarios((prev) => {
        const staticOnes = prev.filter((scenario) => !scenario.custom);
        return [...ordered, ...staticOnes];
      });
      persistStoredSimuladorScenarios(userId, data);
    };
    fetchRemote().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [mapStoredToScenario, userId]);

  const syncRemoteFavorites = useCallback(
    async (payload: StoredSimuladorScenario[]) => {
      if (!userId) return;
      try {
        await replaceSimulatorFavorites(userId, payload);
      } catch (error) {
        console.warn('Não foi possível sincronizar favoritos no servidor', error);
      }
    },
    [userId]
  );

  const persistCustomScenarios = useCallback(
    (list: Scenario[]) => {
      if (!userId) return;
      const payload = list
        .filter((scenario) => scenario.custom)
        .map((scenario) => ({
          id: scenario.id,
          name: scenario.name,
          cidade: scenario.cidade,
          plataforma: scenario.plataforma,
          horas: scenario.horas,
          km: scenario.km,
          tarifaMedia: scenario.tarifaMedia,
          demanda: scenario.demanda,
          savedAt: scenario.savedAt ?? Date.now(),
          favorite: !!scenario.favorite,
          tag: scenario.tag,
        }));
      persistStoredSimuladorScenarios(userId, payload);
      syncRemoteFavorites(payload);
    },
    [syncRemoteFavorites, userId]
  );

  const upsertCustomScenario = useCallback(
    (incoming: Scenario) => (prev: Scenario[]) => {
      const next = incoming.savedAt ? incoming : { ...incoming, savedAt: Date.now() };
      const existingCustom = prev.filter((scenario) => scenario.custom && scenario.id !== next.id);
      const staticScenarios = prev.filter((scenario) => !scenario.custom);
      const orderedCustom = [next, ...existingCustom]
        .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))
        .slice(0, CUSTOM_SCENARIO_LIMIT);
      return [...orderedCustom, ...staticScenarios];
    },
    []
  );

  const updateScenarios = useCallback(
    (updater: (prev: Scenario[]) => Scenario[]) => {
      setScenarios((prev) => {
        const next = updater(prev);
        persistCustomScenarios(next);
        return next;
      });
    },
    [persistCustomScenarios]
  );

  const importPrefillScenario = useCallback(
    (prefill: SimuladorPrefillPayload) => {
      setPrefillData(prefill);
      const scenario: Scenario = {
        id: `prefill-${Date.now()}`,
        name: prefill.name,
        cidade: prefill.cidade,
        plataforma: prefill.plataforma || 'Uber',
        horas: prefill.horas,
        km: prefill.km,
        tarifaMedia: prefill.tarifaMedia,
        demanda: prefill.demanda || 'Média',
        custom: true,
        savedAt: Date.now(),
        favorite: false,
      };
      updateScenarios(upsertCustomScenario(scenario));
      toast.success('Cenário importado!', { description: prefill.hint || 'Hotspot enviado.' });
      logAnalyticsEvent(userId, 'simulator_import_prefill', {
        cidade: prefill.cidade,
        plataforma: prefill.plataforma,
        hint: prefill.hint,
      });
      clearSimuladorPrefill();
    },
    [updateScenarios, upsertCustomScenario, userId]
  );

  useEffect(() => {
    if (!isPro) return;
    if (typeof window === 'undefined') return;

    const handler = () => {
        const prefill = readSimuladorPrefill();
        if (!prefill) return;
        try {
            importPrefillScenario(prefill);
            setPrefillError(null);
            setFailedPrefill(null);
        } catch (error) {
            console.error('Falha ao importar cenário', error);
            setPrefillError('Não foi possível importar o cenário enviado.');
            setFailedPrefill(prefill);
        }
    };

    handler();
    window.addEventListener('simulador:prefill', handler as EventListener);
    return () => window.removeEventListener('simulador:prefill', handler as EventListener);
  }, [isPro, importPrefillScenario]);

  const handleRetryPrefill = useCallback(() => {
    if (!failedPrefill) return;
    try {
      importPrefillScenario(failedPrefill);
      setPrefillError(null);
      setFailedPrefill(null);
    } catch (error) {
      console.error('Falha ao reimportar cenário', error);
      setPrefillError('Ainda não foi possível importar. Reenvie pelo Insights.');
    }
  }, [failedPrefill, importPrefillScenario]);

  const enriched = useEnrichedScenarios(scenarios, custoPadrao);
  const hasCustomScenarios = useMemo(() => scenarios.some((scenario) => scenario.custom), [scenarios]);
  const hasFavorites = useMemo(() => scenarios.some((scenario) => scenario.favorite), [scenarios]);
  const best = useMemo(() => enriched.reduce((prev, curr) => (curr.lucro > prev.lucro ? curr : prev), enriched[0] || null), [enriched]);
  const platformOptions = useMemo(
    () => ['Todos', ...Array.from(new Set(scenarios.map((scenario) => scenario.plataforma)))],
    [scenarios]
  );
  const sortOptionsList: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recentes' },
    { value: 'lucro', label: 'Maior lucro' },
    { value: 'km', label: 'Menor km' },
    { value: 'plataforma', label: 'Plataforma' },
  ];
  const filteredScenarios = useMemo(() => {
    let list = enriched;
    if (platformFilter !== 'Todos') {
      list = list.filter((scenario) => scenario.plataforma === platformFilter);
    }
    if (showFavoritesOnly) {
      list = list.filter((scenario) => scenario.favorite);
    }
    return list;
  }, [enriched, platformFilter, showFavoritesOnly]);
  const sortedScenarios = useMemo(() => {
    const list = [...filteredScenarios];
    switch (sortOption) {
      case 'lucro':
        return list.sort((a, b) => b.lucro - a.lucro);
      case 'km':
        return list.sort((a, b) => a.km - b.km);
      case 'plataforma':
        return list.sort((a, b) => a.plataforma.localeCompare(b.plataforma));
      default:
        return list;
    }
  }, [filteredScenarios, sortOption]);

  useEffect(() => {
    if (platformFilter !== 'Todos' && !platformOptions.includes(platformFilter)) {
      setPlatformFilter('Todos');
    }
  }, [platformOptions, platformFilter]);

  useEffect(() => {
    if (!hasFavorites && showFavoritesOnly) {
      setShowFavoritesOnly(false);
    }
  }, [hasFavorites, showFavoritesOnly]);

  const handleSimulate = useCallback(
    (scenario: Scenario) => {
      updateScenarios(upsertCustomScenario({ ...scenario, custom: true }));
    },
    [updateScenarios, upsertCustomScenario]
  );

  const handleRemoveScenario = useCallback(
    (id: string) => {
      updateScenarios((prev) => prev.filter((scenario) => !(scenario.custom && scenario.id === id)));
    },
    [updateScenarios]
  );

  const handleClearCustomScenarios = useCallback(() => {
    updateScenarios((prev) => prev.filter((scenario) => !scenario.custom));
    toast.success('Histórico limpo', { description: 'Cenários salvos foram removidos.' });
  }, [updateScenarios]);
  const handleToggleFavorite = useCallback(
    (id: string) => {
      updateScenarios((prev) =>
        prev.map((scenario) =>
          scenario.id === id ? { ...scenario, favorite: !scenario.favorite } : scenario
        )
      );
    },
    [updateScenarios]
  );
  const handlePrefillFromScenario = useCallback((scenario: Scenario) => {
    setPrefillData({
      name: scenario.name,
      cidade: scenario.cidade,
      plataforma: scenario.plataforma,
      horas: scenario.horas,
      km: scenario.km,
      tarifaMedia: scenario.tarifaMedia,
      demanda: scenario.demanda,
      hint: scenario.tag,
    });
  }, []);

  if (!accessChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isPro) {
    return <SimulatorPaywall />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 pt-8 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <SimulatorHero />

        <SimulatorKpis
          items={[
            { label: 'Melhor cenário', value: best ? best.name : '--', hint: best ? formatarMoeda(best.lucro) : '---' },
            {
              label: 'Média lucros',
              value: formatarMoeda(enriched.reduce((a, b) => a + b.lucro, 0) / (enriched.length || 1)),
              hint: 'por cenário',
            },
            { label: 'Custo padrão', value: formatarMoeda(custoPadrao), hint: '/ km' },
          ]}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Cenários</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                  <select
                    value={platformFilter}
                    onChange={(event) => setPlatformFilter(event.target.value)}
                    className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-xs font-semibold"
                  >
                    {platformOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1">
                    {hasFavorites && (
                      <Button
                        size="sm"
                        variant={showFavoritesOnly ? 'secondary' : 'ghost'}
                        className="text-xs"
                        onClick={() => setShowFavoritesOnly((prev) => !prev)}
                      >
                        {showFavoritesOnly ? 'Todos os cards' : 'Só favoritos'}
                      </Button>
                    )}
                    {sortOptionsList.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={sortOption === option.value ? 'secondary' : 'ghost'}
                        className="text-xs"
                        onClick={() => setSortOption(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              {hasCustomScenarios && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCustomScenarios}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Apagar cards
                </Button>
              )}
            </div>
            {prefillError && (
              <div className="p-4 rounded-2xl border border-red-200 bg-red-50/70 text-sm text-red-700 flex flex-col gap-3 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-semibold">Erro ao importar cenário</p>
                    <p className="text-xs mt-1">{prefillError}</p>
                  </div>
                </div>
                {failedPrefill && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetryPrefill}
                    className="w-full border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    🔄 Tentar importar novamente
                  </Button>
                )}
              </div>
            )}
            {sortedScenarios.length === 0 && !prefillError && (
              <div className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center space-y-3 bg-gray-50/50 dark:bg-gray-900/20">
                <div className="text-4xl">📊</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum cenário criado</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use o formulário acima para criar seu primeiro cenário de simulação.</p>
              </div>
            )}
            {sortedScenarios.length ? (
              sortedScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  highlight={best?.id === scenario.id}
                  onRemove={scenario.custom ? () => handleRemoveScenario(scenario.id) : undefined}
                  onToggleFavorite={scenario.custom ? () => handleToggleFavorite(scenario.id) : undefined}
                  onDuplicate={scenario.custom ? () => handlePrefillFromScenario(scenario) : undefined}
                />
              ))
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white">Nenhum cenário encontrado com os filtros atuais.</p>
                <p className="text-xs mt-2">
                  Ajuste os filtros, carregue um hotspot do Insights ou use o formulário ao lado para criar um plano em segundos.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <CustomSimulator onSimulate={handleSimulate} prefill={prefillData} />
            <SimulatorTips />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SimuladorPage() {
  return (
    <ProtectedRoute>
      <SimuladorContent />
    </ProtectedRoute>
  );
}
