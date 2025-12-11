'use client';

import { MapPin, Sparkles } from 'lucide-react';
import { ReactNode } from 'react';

interface InsightsHeaderProps {
  cidades: string[];
  cidade: string;
  onCidadeChange: (cidade: string) => void;
  clima?: { temp?: number; descricao?: string } | null;
  weatherIcon: ReactNode;
}

export function InsightsHeader({ cidades, cidade, onCidadeChange, clima, weatherIcon }: InsightsHeaderProps) {
  return (
    <header className="py-6 px-6 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-white/40 font-bold">Plano Estratégico</p>
          <h1 className="text-3xl font-black flex items-center gap-3">
            Insights <Sparkles className="w-5 h-5 text-orange-300" />
          </h1>
          <p className="text-sm text-white/70">IA + hotspots para decidir onde rodar agora.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white/10 rounded-2xl border border-white/20 px-4 py-3 min-w-[260px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">{weatherIcon}</div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">Clima</p>
              <p className="text-xl font-black">{clima ? `${Math.round(clima.temp ?? 0)}°C` : '--'}</p>
              <p className="text-xs text-white/70">{clima?.descricao || 'Aguardando'}</p>
            </div>
          </div>
          <div className="sm:border-l border-white/20 sm:pl-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">Cidade</p>
            <div className="relative">
              <select
                value={cidade}
                onChange={(e) => onCidadeChange(e.target.value)}
                className="bg-transparent text-sm font-bold text-white pr-6 outline-none appearance-none"
              >
                {cidades.map((c) => (
                  <option key={c} value={c} className="text-gray-900">
                    {c}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-white/70 absolute right-1 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
