'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Crown, TrendingUp, Gauge, Star } from 'lucide-react';

export function SimulatorPaywall() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-2xl space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Crown className="w-10 h-10 text-orange-500" />
          <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 font-bold">Simulador Pro+</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Comparador de cenários exclusivo</h1>
          <p className="text-sm text-gray-500">
            Monte estratégias por horário, plataforma e demanda, compare lucros e ajuste seu cronograma antes de sair de casa.
            Essa ferramenta faz parte do pacote Pro+.
          </p>
        </div>
        <div className="space-y-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5" />
            <span>Rank automático do melhor cenário e ticket/hora.</span>
          </div>
          <div className="flex items-start gap-3">
            <Gauge className="w-4 h-4 text-emerald-500 mt-0.5" />
            <span>Customização completa por cidade, demanda e custo/km.</span>
          </div>
          <div className="flex items-start gap-3">
            <Star className="w-4 h-4 text-emerald-500 mt-0.5" />
            <span>Histórico de simulações para apoiar decisões rápidas.</span>
          </div>
        </div>
        <Link href="/giropro-plus">
          <Button className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 rounded-2xl">
            Desbloquear com Pro+
          </Button>
        </Link>
      </div>
    </div>
  );
}
