'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Target, MapPin, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'generate_plan', title: 'Gere sua missão IA', description: 'Use o Estrategista para receber um plano tático.', icon: Target },
  { id: 'send_to_sim', title: 'Simule um hotspot', description: 'Envie um ponto ou plano para o simulador Pro+.', icon: MapPin },
  { id: 'favorite', title: 'Salve um favorito', description: 'Guarde o cenário ideal e reabra direto por aqui.', icon: Star },
];

type InsightsGettingStartedProps = {
  completed: string[];
  onGeneratePlan: () => void;
  onOpenSimulator: () => void;
  isPro: boolean;
  onUpgrade: () => void;
};

function InsightsGettingStartedComponent({ completed, onGeneratePlan, onOpenSimulator, isPro, onUpgrade }: InsightsGettingStartedProps) {
  if (!isPro) {
    return (
      <section className="lg:col-span-2">
        <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm p-5 md:p-6 flex flex-col gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Pro+</p>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Desbloqueie o Combo IA + Simulador</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gere missões com IA, envie para o simulador avançado e salve favoritos — tudo isso faz parte do Giro Pro+.
            </p>
          </div>
          <Button className="w-fit rounded-full" onClick={onUpgrade}>
            Conhecer o Pro+
          </Button>
        </div>
      </section>
    );
  }

  const allDone = STEPS.every((step) => completed.includes(step.id));
  if (allDone) return null;

  return (
    <section className="lg:col-span-2">
      <div className="rounded-3xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 shadow-lg p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Comece por aqui</p>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Integre a IA ao simulador</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conclua os passos abaixo para aproveitar o combo Pro+ completo.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" onClick={onGeneratePlan}>
            Gerar missão
          </Button>
        </div>

        <div className="space-y-3">
          {STEPS.map((step) => {
            const done = completed.includes(step.id);
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-3',
                  done ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/30 dark:bg-emerald-900/20' : 'border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40'
                )}
              >
                <div className="p-2 rounded-full bg-white dark:bg-gray-800">
                  {done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Icon className="w-4 h-4 text-gray-500" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={onGeneratePlan}>
            Gerar missão IA
          </Button>
          <Button variant="secondary" className="rounded-full" onClick={onOpenSimulator}>
            Abrir simulador
          </Button>
        </div>
      </div>
    </section>
  );
}

export const InsightsGettingStarted = memo(InsightsGettingStartedComponent);
