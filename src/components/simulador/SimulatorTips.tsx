'use client';

import { Card, CardContent } from '@/components/ui/card';

export function SimulatorTips() {
  return (
    <Card className="border-0 shadow-xl rounded-3xl bg-white dark:bg-gray-900">
      <CardContent className="p-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Dicas rápidas</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Multiplique sua tarifa média pelo fator de demanda (Pico 1.4x). Use esse número para precificar corridas longas.</li>
          <li>Se o cenário rodar mais de 120 km, considere trocar veículo ou usar o modo combustível mais barato.</li>
          <li>Compare cidades/horários semanalmente e salve o melhor como sua estratégia principal.</li>
        </ul>
      </CardContent>
    </Card>
  );
}
