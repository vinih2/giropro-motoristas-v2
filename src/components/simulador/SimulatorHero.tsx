'use client';

import { Crown } from 'lucide-react';

export function SimulatorHero() {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-2xl">
        <Crown className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-gray-900 dark:text-white">Simulador Pro+</h1>
      <p className="text-sm text-gray-500 max-w-2xl mx-auto">
        Monte cenários por horário, plataforma e demanda. Compare automaticamente e descubra onde seu tempo rende mais.
      </p>
    </div>
  );
}
