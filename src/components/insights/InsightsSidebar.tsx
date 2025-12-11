'use client';

import { WeatherWidget } from '@/components/WeatherWidget';
import { TacticalPlanCard } from '@/components/insights/TacticalPlanCard';
import type { Plataforma } from '@/lib/types';

interface InsightsSidebarProps {
  cidade: string;
  plataforma: Plataforma;
  onPlatformChange: (value: Plataforma) => void;
  clima?: { temp?: number; descricao?: string } | null;
  isPro: boolean;
  loadingIA: boolean;
  insight: string;
  reachedLimit: boolean;
  freeMissionLimit: number;
  iaUseCount: number;
  onGenerate: () => void;
  onApplyNewRun: () => void;
  onSendToSimulator: () => void;
  onUpgrade: () => void;
  onSaveFavoritePlan: () => void;
  iaError?: string;
  onRetryGenerate?: () => void;
}

export function InsightsSidebar({
  cidade,
  plataforma,
  onPlatformChange,
  clima,
  isPro,
  loadingIA,
  insight,
  reachedLimit,
  freeMissionLimit,
  iaUseCount,
  onGenerate,
  onApplyNewRun,
  onSendToSimulator,
  onUpgrade,
  onSaveFavoritePlan,
  iaError,
  onRetryGenerate,
}: InsightsSidebarProps) {
  return (
    <section className="lg:col-span-1 flex flex-col gap-4">
      <WeatherWidget cidade={cidade} clima={clima} isPro={isPro} onUpgradeClick={onUpgrade} />
      <TacticalPlanCard
        cidade={cidade}
        plataforma={plataforma}
        onPlatformChange={onPlatformChange}
        insight={insight}
        loading={loadingIA}
        reachedLimit={reachedLimit}
        freeMissionLimit={freeMissionLimit}
        iaUseCount={iaUseCount}
        isPro={isPro}
        onGenerate={onGenerate}
        onApplyNewRun={onApplyNewRun}
        onSendToSimulator={onSendToSimulator}
        onSaveFavorite={onSaveFavoritePlan}
        onUpgrade={onUpgrade}
        errorMessage={iaError}
        onRetry={onRetryGenerate}
      />
    </section>
  );
}
