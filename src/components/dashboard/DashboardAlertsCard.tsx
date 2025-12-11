'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Award } from 'lucide-react';

export type DashboardAlert = {
  title: string;
  description: string;
  accent: 'success' | 'warning' | 'info';
};

type DashboardAlertsCardProps = {
  alerts: DashboardAlert[];
  onViewInsights: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function DashboardAlertsCard({ alerts, onViewInsights, loading, error, onRetry }: DashboardAlertsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Central de alertas</p>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Plano tático diário</h3>
        </div>
        <Button variant="outline" size="sm" className="rounded-full text-xs font-bold" onClick={onViewInsights}>
          Ver Insights
        </Button>
      </div>
      <div className="space-y-3">
        {loading && (
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/80 dark:border-blue-900/40 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-200">
            Gerando missão tática com a IA...
          </div>
        )}
        {error && (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50/70 dark:border-red-900/40 dark:bg-red-900/20 flex flex-col gap-2">
            <p className="text-sm font-semibold text-red-700 dark:text-red-200">{error}</p>
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-xs font-bold text-red-700 dark:text-red-200 px-3"
                onClick={onRetry}
              >
                Tentar novamente
              </Button>
            )}
          </div>
        )}
        {alerts.map((alert, idx) => (
          <div
            key={`${alert.title}-${idx}`}
            className={cn(
              'p-4 rounded-2xl border flex gap-3',
              alert.accent === 'success' && 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/20',
              alert.accent === 'warning' && 'border-amber-200 bg-amber-50/70 dark:bg-amber-900/20',
              alert.accent === 'info' && 'border-blue-200 bg-blue-50/70 dark:bg-blue-900/20'
            )}
          >
            <Award className="w-4 h-4 mt-1" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{alert.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{alert.description}</p>
            </div>
          </div>
        ))}
        {!loading && !error && alerts.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Sem alertas agora — gere um plano no Insights.</p>
        )}
      </div>
    </div>
  );
}
