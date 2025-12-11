'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MapPin, Gauge, Clock, Star, Star as FavoriteStar, Crown, Trash2, Copy } from 'lucide-react';
import { formatarMoeda } from '@/lib/calculations';
import type { EnrichedScenario } from './types';
import { memo } from 'react';

function ScenarioCardComponent({
  scenario,
  highlight,
  onRemove,
  onToggleFavorite,
  onDuplicate,
}: {
  scenario: EnrichedScenario;
  highlight?: boolean;
  onRemove?: () => void;
  onToggleFavorite?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <Card className={cn('border rounded-3xl shadow-lg transition-all', highlight ? 'border-orange-400 shadow-orange-400/30' : 'border-zinc-200 dark:border-zinc-800')}> 
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <p className="text-sm font-black text-zinc-900 dark:text-white">{scenario.name}</p>
            {scenario.tag && (
              <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-semibold">{scenario.tag}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {scenario.custom && onToggleFavorite && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleFavorite();
                }}
                className={cn(
                  'p-1 rounded-full transition-colors',
                  scenario.favorite
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-zinc-400 hover:text-yellow-500'
                )}
                title={scenario.favorite ? 'Remover dos favoritos' : 'Favoritar cenário'}
                aria-label="Favoritar cenário"
              >
                <FavoriteStar className={cn('w-4 h-4', scenario.favorite ? 'fill-current' : 'fill-transparent')} />
              </button>
            )}
            {highlight && <Crown className="w-4 h-4 text-orange-500" />}
            {scenario.custom && onRemove && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Remover cenário"
                aria-label="Remover cenário"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {scenario.custom && onDuplicate && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate();
                }}
                className="p-1 rounded-full text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors"
                title="Copiar para formulário"
                aria-label="Copiar cenário"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-zinc-500 dark:text-zinc-300">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {scenario.cidade}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {scenario.horas}h</span>
          <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {scenario.km} km</span>
          <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {scenario.demanda}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-bold">Lucro</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">{formatarMoeda(scenario.lucro)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-bold">Ganhos/h</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white">{formatarMoeda(scenario.ganhoHora)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const ScenarioCard = memo(ScenarioCardComponent);
