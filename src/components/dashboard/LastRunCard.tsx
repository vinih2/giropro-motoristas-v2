'use client';

import { formatarMoeda } from '@/lib/calculations';
import type { ResultadoDia } from '@/lib/types';

type LastRunCardProps = {
  result: ResultadoDia | null;
  onNewRun?: () => void;
};

export function LastRunCard({ result, onNewRun }: LastRunCardProps) {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Último giro</p>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">Resumo instantâneo</h3>
        </div>
        {result && <span className="text-lg font-black text-emerald-600">{formatarMoeda(result.lucroFinal)}</span>}
      </div>
      {result ? (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Ganhos/h</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatarMoeda(result.ganhoPorHora || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Ganhos/km</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatarMoeda(result.ganhoPorKm || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Custo diário</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatarMoeda(result.custoDiario || 0)}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4 text-sm text-gray-600 dark:text-gray-300 space-y-3">
          <p>
            Você ainda não registrou nenhum giro hoje. Registre o primeiro turno para liberar o histórico e acompanhar seu desempenho.
          </p>
          {onNewRun && (
            <button
              onClick={onNewRun}
              className="inline-flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold px-4 py-2 dark:bg-white dark:text-gray-900"
            >
              Registrar giro agora
            </button>
          )}
        </div>
      )}
    </div>
  );
}
