'use client';

import { Button } from '@/components/ui/button';
import { formatarMoeda } from '@/lib/calculations';
import { MapPin, Crown, Plus, Upload } from 'lucide-react';
import { ReactNode } from 'react';

type DashboardHeaderProps = {
  dateLabel: string;
  isPro: boolean;
  onUpgrade: () => void;
  onNewGiro: () => void;
  onImport?: () => void;
  cidade: string;
  cidades: string[];
  onCidadeChange: (cidade: string) => void;
  weatherIcon: ReactNode;
  weatherTemp: string | number;
  weatherDescription: string;
  metaDiaria: number;
  custoKmEfetivo: number;
  currentStreak: number;
};

export function DashboardHeader({
  dateLabel,
  isPro,
  onUpgrade,
  onNewGiro,
  onImport,
  cidade,
  cidades,
  onCidadeChange,
  weatherIcon,
  weatherTemp,
  weatherDescription,
  metaDiaria,
  custoKmEfetivo,
  currentStreak,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-400 font-bold">{dateLabel}</p>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Painel do Motorista</h1>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-end">
            {isPro ? (
              <div className="flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 px-4 py-2 text-sm font-bold">
                <Crown className="w-4 h-4" /> Pro ativo
              </div>
            ) : (
              <Button
                variant="outline"
                className="rounded-full h-12 px-6 border-orange-400 text-orange-600 font-black shadow-sm"
                onClick={onUpgrade}
              >
                <Crown className="w-4 h-4 mr-2" /> Conhecer o Pro+
              </Button>
            )}
            {onImport && (
              <Button
                variant="outline"
                onClick={onImport}
                className="rounded-full h-12 px-6 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" /> Importar
              </Button>
            )}
            <Button
              onClick={onNewGiro}
              className="rounded-full h-12 px-6 bg-orange-600 hover:bg-orange-500 text-white font-black shadow-lg shadow-orange-500/30"
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Giro
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold mb-2">Cidade ativa</p>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <select
                  value={cidade}
                  onChange={(e) => onCidadeChange(e.target.value)}
                  className="w-full bg-transparent text-lg font-black text-gray-900 dark:text-white outline-none border-none focus:ring-0"
                >
                  {cidades.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 flex items-center gap-3 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center">{weatherIcon}</div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Clima</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{weatherTemp}°C</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{weatherDescription}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Meta do dia</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{formatarMoeda(metaDiaria)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Custo/km {formatarMoeda(custoKmEfetivo)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Streak</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{currentStreak} dias</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
