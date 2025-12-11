'use client';

import { Input } from '@/components/ui/input';
import { formatarMoeda } from '@/lib/calculations';

type GoalTrackerCardProps = {
  progresso: number;
  metaDiaria: string;
  onMetaDiariaChange: (value: string) => void;
  totalLucroDia: number;
  totalHorasDia: number;
  totalKmDia: number;
  metaRemaining: number;
  custoKmEfetivo: number;
  custoPorKm: number;
  custoFixoPorKm: number;
};

export function GoalTrackerCard({
  progresso,
  metaDiaria,
  onMetaDiariaChange,
  totalLucroDia,
  totalHorasDia,
  totalKmDia,
  metaRemaining,
  custoKmEfetivo,
  custoPorKm,
  custoFixoPorKm,
}: GoalTrackerCardProps) {
  const hasDayData = totalLucroDia > 0 || totalHorasDia > 0 || totalKmDia > 0;
  return (
    <div className="bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-xl">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr] p-6">
        <div className="relative flex items-center justify-center my-6">
          <div className="relative w-[240px] h-[240px]">
            <svg width={240} height={240} className="transform -rotate-90 block mx-auto overflow-visible" viewBox="0 0 240 240">
              <circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={14}
                r={95}
                cx={120}
                cy={120}
                className="text-gray-200 dark:text-gray-800"
                strokeLinecap="round"
              />
              <circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={14}
                strokeDasharray={`${2 * Math.PI * 95} ${2 * Math.PI * 95}`}
                style={{
                  strokeDashoffset: 2 * Math.PI * 95 - (progresso / 100) * (2 * Math.PI * 95),
                  transition: 'stroke-dashoffset 1s ease-out',
                }}
                strokeLinecap="round"
                r={95}
                cx={120}
                cy={120}
                className="text-gray-900 dark:text-white"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Meta</span>
              <div className="flex items-baseline justify-center">
                <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
                  {Number.isFinite(progresso) ? progresso.toFixed(0) : '0'}
                </span>
                <span className="text-2xl text-gray-500 font-bold ml-0.5">%</span>
              </div>
              <div className="flex items-center mt-3 bg-gray-50 dark:bg-gray-900/50 rounded-full px-3 py-1 border border-gray-100 dark:border-gray-800 hover:border-gray-300 transition-colors">
                <span className="text-[10px] text-gray-400 mr-1 font-bold uppercase">R$</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={metaDiaria}
                  onChange={(event) => onMetaDiariaChange(event.target.value)}
                  onFocus={(event) => event.stopPropagation()}
                  className="h-6 w-16 p-0 border-0 bg-transparent text-lg font-bold text-gray-900 dark:text-white focus-visible:ring-0 text-center"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6">
          {hasDayData ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1 tracking-wider">Lucro Hoje</p>
                <p className="text-xl font-black text-emerald-700">{formatarMoeda(totalLucroDia)}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-blue-600/70 mb-1 tracking-wider">Horas Hoje</p>
                <p className="text-xl font-black text-blue-600">{totalHorasDia.toFixed(1)}h</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/40 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-orange-600/70 mb-1 tracking-wider">KM Hoje</p>
                <p className="text-xl font-black text-orange-600">{totalKmDia.toFixed(0)}km</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">Nenhum giro registrado hoje.</p>
              <p className="text-xs mt-2">Toque em “Novo Giro” no topo da página ou importe um plano do simulador para começar a contar seu progresso.</p>
            </div>
          )}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/40 rounded-2xl px-4 py-3 border border-dashed border-gray-200 dark:border-gray-800">
            <div>
              <p className="text-xs uppercase text-gray-500 font-bold">Meta diária</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {metaRemaining > 0 ? `${formatarMoeda(metaRemaining)} restantes` : 'Meta concluída 🎯'}
              </p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Custo/km:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{formatarMoeda(custoKmEfetivo)}</span>
              <p className="text-[10px] text-gray-400 mt-1">
                Variável {formatarMoeda(custoPorKm)} + fixo {formatarMoeda(custoFixoPorKm)}/km
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
