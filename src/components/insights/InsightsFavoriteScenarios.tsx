'use client';

import { useMemo, memo } from 'react';
import { StoredSimuladorScenario } from '@/lib/dashboard-bridge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Sparkles } from 'lucide-react';

type InsightsFavoriteScenariosProps = {
  scenarios: StoredSimuladorScenario[];
  onSimulate: (scenario: StoredSimuladorScenario) => void;
  onOpenSimulator: () => void;
};

function InsightsFavoriteScenariosComponent({
  scenarios,
  onSimulate,
  onOpenSimulator,
}: InsightsFavoriteScenariosProps) {
  const prioritized = useMemo(() => {
    if (!scenarios?.length) return [];
    const favorites = scenarios.filter((scenario) => scenario.favorite);
    const tagged = scenarios.filter((scenario) => scenario.tag && !scenario.favorite);
    const others = scenarios.filter((scenario) => !scenario.favorite && !scenario.tag);
    return [...favorites, ...tagged, ...others].slice(0, 3);
  }, [scenarios]);

  return (
    <section className="lg:col-span-2">
      <Card className="border border-gray-100 dark:border-gray-900 rounded-3xl shadow-lg">
        <CardContent className="p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Favoritos</p>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Planos prontos para rodar</h3>
                <p className="text-xs text-gray-500">
                  Use seus cenários salvos ou etiquetados para começar o próximo turno sem perder tempo.
                </p>
              </div>
            </div>
            {prioritized.length > 0 && (
              <Button size="sm" variant="outline" className="rounded-full" onClick={onOpenSimulator}>
                Ver tudo
              </Button>
            )}
          </div>

          {prioritized.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {prioritized.map((scenario) => (
                <article
                  key={scenario.id}
                  className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{scenario.name}</p>
                      <p className="text-xs text-gray-500">
                        {scenario.cidade} • {scenario.plataforma}
                      </p>
                    </div>
                    {(scenario.tag || scenario.favorite) && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-600 border-0 dark:bg-amber-400/10 dark:text-amber-300"
                      >
                        {scenario.tag || 'Favorito'}
                      </Badge>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div className="space-y-1">
                      <dt className="uppercase tracking-wide text-[10px]">Horas</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{scenario.horas}h</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="uppercase tracking-wide text-[10px]">Km</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">{scenario.km} km</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="uppercase tracking-wide text-[10px]">Tarifa</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">
                        R$ {scenario.tarifaMedia.toFixed(2)}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="uppercase tracking-wide text-[10px]">Demanda</dt>
                      <dd className="text-base font-semibold text-gray-900 dark:text-white">
                        {scenario.demanda || 'Média'}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{scenario.favorite ? 'Prioridade Pro+' : 'Plano sugerido'}</span>
                    </div>
                    <Button size="sm" className="rounded-full" onClick={() => onSimulate(scenario)}>
                      Simular agora
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Sem favoritos por enquanto</p>
              <p className="text-xs text-gray-500">
                Personalize um cenário no simulador, marque como favorito ou adicione uma etiqueta para encontrá-lo aqui.
              </p>
              <div>
                <Button size="sm" className="rounded-full" onClick={onOpenSimulator}>
                  Abrir simulador
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export const InsightsFavoriteScenarios = memo(InsightsFavoriteScenariosComponent);
