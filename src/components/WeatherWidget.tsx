// src/components/WeatherWidget.tsx
"use client";

import React, { useMemo } from "react";
import { Sun, CloudRain, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WeatherHourly = {
  time: string;
  temp: number;
  main: string;
  description: string;
  icon: string;
  rainChance: number;
  wind: number;
};

type Props = {
  cidade: string;
  clima?: {
    temp?: number;
    descricao?: string;
    principal?: string;
    hourly?: WeatherHourly[];
  } | null;
  isPro?: boolean;
  onUpgradeClick?: () => void;
};

const ICON_MAP: Record<string, React.ReactNode> = {
  Clear: <Sun className="w-4 h-4 text-yellow-400" />,
  Clouds: <Cloud className="w-4 h-4 text-gray-400" />,
  Rain: <CloudRain className="w-4 h-4 text-blue-400" />,
  Drizzle: <CloudRain className="w-4 h-4 text-blue-400" />,
  Thunderstorm: <Zap className="w-4 h-4 text-purple-400" />,
};

function formatTimeLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function WeatherWidget({ cidade, clima, isPro, onUpgradeClick }: Props) {
  const hourly = clima?.hourly || [];
  const rainAlert = hourly.find((item) => item.rainChance >= 60);

  const proMessage = useMemo(() => {
    if (!rainAlert) return "Sem eventos de chuva forte nas próximas horas.";
    const time = formatTimeLabel(rainAlert.time);
    return `Chuva forte prevista por volta de ${time}. Prepare-se para dinâmicas!`;
  }, [rainAlert]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white rounded-3xl p-4 shadow-xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Clima agora</p>
          <h3 className="text-2xl font-black">{cidade}</h3>
          <p className="text-sm text-slate-300 capitalize">{clima?.descricao || "Carregando..."}</p>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black">{clima ? `${clima.temp}°C` : "--"}</span>
          <div className="text-xs text-slate-400">{ICON_MAP[clima?.principal || ""] || <Cloud className="w-4 h-4" />}</div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">Previsão próximas horas</p>
        {hourly.length ? (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {hourly.map((item) => (
              <div
                key={item.time}
                className={cn(
                  "flex flex-col items-center justify-between min-w-[72px] px-2 py-3 rounded-2xl border border-white/10 bg-white/5",
                  item.rainChance >= 60 && "border-blue-400/60 bg-blue-500/10"
                )}
              >
                <span className="text-xs text-slate-400">{formatTimeLabel(item.time)}</span>
                <span className="text-lg font-bold">{item.temp}°</span>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 capitalize text-center">
                  {ICON_MAP[item.main] || <Cloud className="w-3 h-3" />}
                  {item.description.split(" ")[0]}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <CloudRain className="w-3 h-3" /> {item.rainChance}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Previsão indisponível.</p>
        )}
      </div>

      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold">Previsão de dinâmica</p>
            <p className="text-sm text-slate-200">
              {isPro ? proMessage : "Assine o Pro+ para ver alertas de demanda baseada no clima."}
            </p>
          </div>
          {!isPro && (
            <Button size="sm" className="rounded-full" onClick={onUpgradeClick}>
              Desbloquear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
