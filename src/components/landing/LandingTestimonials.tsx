'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TESTIMONIALS = [
  {
    name: 'Bruno "Ceará" Lima',
    city: 'São Paulo - SP',
    quote: 'O coach IA me manda rota certa e o custo real mostra quando parar. Em 2 semanas reduzi 2h de volante por dia.',
  },
  {
    name: 'Larissa Campos',
    city: 'Brasília - DF',
    quote: 'O Pro+ salva: gero DARF e PDF de renda em minutos. Usei pra aprovar crédito do carro novo sem estresse.',
  },
  {
    name: 'Jefferson Rocha',
    city: 'Recife - PE',
    quote: 'Simulo missão antes de aceitar corrida. Se não bate meu mínimo por km eu já recuso. Lucro ficou previsível.',
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-20 bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-6 max-w-5xl text-center space-y-8">
        <div>
          <Badge className="bg-white text-orange-600 border-orange-200">Prova Social</Badge>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-4">Quem roda com o GiroPro</h2>
          <p className="text-gray-500 dark:text-gray-400">Motoristas que já colocam o lucro no piloto automático.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((item) => (
            <Card key={item.name} className="border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">“{item.quote}”</p>
                <div className="text-left">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.city}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
