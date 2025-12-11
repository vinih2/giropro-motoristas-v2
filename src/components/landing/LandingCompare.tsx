'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLandingLeadForm } from './LandingLeadFormContext';

const FEATURES = [
  { label: 'Controle de custo/km e metas', free: true, pro: true },
  { label: 'Missões IA por cidade/plataforma', free: false, pro: true },
  { label: 'Simulador avançado com favoritos', free: false, pro: true },
  { label: 'Darfs e PDF premium', free: false, pro: true },
  { label: 'Suporte prioridade + comunidade fechada', free: false, pro: true },
];

export function LandingCompare() {
  const { triggerLeadForm } = useLandingLeadForm();

  const handleLeadClick = () => {
    triggerLeadForm();
  };

  return (
    <section className="py-16 bg-white dark:bg-black">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-10 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Comparativo</p>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Começa grátis, sobe pro Pro+ quando a rua pedir</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controle custo e metas no plano Free. Precisa de DARF, PDF e IA sem limite? Ativa o Pro+ e mantém tudo no mesmo lugar.
          </p>
        </div>
        <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-3xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-left p-4"></th>
                <th className="text-center p-4 font-black text-gray-900 dark:text-white">Free</th>
                <th className="text-center p-4 font-black text-gray-900 dark:text-white">GiroPro+</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr key={feature.label} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="p-4 text-gray-600 dark:text-gray-300">{feature.label}</td>
                  <td className="text-center">
                    {feature.free && <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />}
                  </td>
                  <td className="text-center">
                    {feature.pro && <CheckCircle2 className="w-5 h-5 text-orange-500 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-8">
          <Button className="rounded-full px-10" onClick={handleLeadClick}>
            Falar com especialista agora
          </Button>
        </div>
      </div>
    </section>
  );
}
