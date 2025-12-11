'use client';

import { Plataforma } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2, BrainCircuit, Zap, ChevronRight, Target, Star } from 'lucide-react';
import Link from 'next/link';

type TacticalPlanCardProps = {
  cidade: string;
  plataforma: Plataforma;
  onPlatformChange: (value: Plataforma) => void;
  insight: string;
  loading: boolean;
  reachedLimit: boolean;
  freeMissionLimit: number;
  iaUseCount: number;
  isPro: boolean;
  onGenerate: () => void;
  onApplyNewRun: () => void;
  onSendToSimulator: () => void;
  onSaveFavorite: () => void;
  onUpgrade: () => void;
  errorMessage?: string;
  onRetry?: () => void;
};

const PLATFORM_OPTIONS: Plataforma[] = ['Uber', '99', 'iFood', 'Rappi'];

export function TacticalPlanCard({
  cidade,
  plataforma,
  onPlatformChange,
  insight,
  loading,
  reachedLimit,
  freeMissionLimit,
  iaUseCount,
  isPro,
  onGenerate,
  onApplyNewRun,
  onSendToSimulator,
  onSaveFavorite,
  onUpgrade,
  errorMessage,
  onRetry,
}: TacticalPlanCardProps) {
  const remaining = Math.max(freeMissionLimit - iaUseCount, 0);

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl shadow-2xl border border-gray-800 p-6 text-white flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Plano Tático</p>
          <h3 className="text-2xl font-black flex items-center gap-2">
            Estrategista IA <Sparkles className="w-4 h-4 text-orange-400" />
          </h3>
          <p className="text-xs text-gray-400 font-medium">Powered by Gemini • {cidade}</p>
        </div>
        <div className="p-3 rounded-2xl bg-white/10 border border-white/20">
          <BrainCircuit className="w-6 h-6 text-orange-300" />
        </div>
      </div>
      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50/70 text-red-700 text-xs font-semibold px-4 py-3 flex items-center justify-between gap-3 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-200">
          <span>{errorMessage}</span>
          {onRetry && (
            <Button size="sm" variant="ghost" className="text-xs text-red-700 dark:text-red-200 px-2 py-1 h-auto" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.3em]">Plataforma ativa</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((option) => {
            const active = plataforma === option;
            return (
              <button
                key={option}
                onClick={() => onPlatformChange(option)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold transition-all border',
                  active
                    ? 'bg-orange-500/90 text-white border-orange-400 shadow-lg shadow-orange-500/30'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-white/5 rounded-2xl p-4 mb-6 border border-white/10 overflow-y-auto scrollbar-hide flex items-center justify-center text-center min-h-[180px]">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-orange-300 animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm font-medium text-white">Gerando estratégia...</p>
          </div>
        ) : insight ? (
          <div className="animate-in fade-in duration-300 flex items-start text-left gap-3">
            <Sparkles className="w-4 h-4 text-yellow-300 mt-1 flex-shrink-0" />
            <p className="text-sm text-gray-100 leading-relaxed font-medium">{insight}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-70 gap-3">
            <Zap className="w-8 h-8 text-gray-500" />
            <p className="text-xs font-medium max-w-[220px] text-gray-300">
              Peça uma análise tática para planejar o próximo giro.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={onGenerate}
          disabled={loading || reachedLimit}
          className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Gerando...' : 'Desenhar missão agora'}
        </Button>
        <div className="space-y-2">
          <Button
            variant="outline"
            disabled={!insight || loading}
            onClick={onApplyNewRun}
            className="w-full h-11 rounded-2xl text-sm font-bold border-gray-200 dark:border-gray-800 bg-white/10 text-white"
          >
            Aplicar no Novo Giro
          </Button>
          <Button
            variant="secondary"
            disabled={!insight || loading}
            onClick={onSendToSimulator}
            className="w-full h-10 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 bg-white text-gray-900 border border-white/40 hover:bg-gray-100 dark:bg-white/15 dark:text-white dark:hover:bg-white/25"
          >
            <Target className="w-3.5 h-3.5" /> Simular cenário
          </Button>
          <Button
            variant="ghost"
            disabled={!insight || loading}
            onClick={isPro ? onSaveFavorite : onUpgrade}
            className="w-full h-10 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-50 dark:border-amber-500/40"
          >
            <Star className="w-3.5 h-3.5" />
            {isPro ? 'Salvar favorito' : 'Liberar favoritos'}
          </Button>
        </div>
      </div>

      {!isPro && (
        <div className="text-center mt-3">
          <p className="text-[11px] text-gray-400 font-medium">
            {reachedLimit ? 'Limite diário alcançado.' : `Você ainda tem ${remaining} de ${freeMissionLimit} estratégias hoje.`}
          </p>
          <Link href="/giropro-plus" className="inline-flex items-center justify-center gap-1 text-xs font-bold text-orange-400 mt-1">
            Liberar IA ilimitada
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
