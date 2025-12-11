'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLandingLeadForm } from '@/components/landing/LandingLeadFormContext';

export function LandingHero() {
  const { triggerLeadForm } = useLandingLeadForm();

  const handleLeadClick = () => {
    triggerLeadForm();
  };

  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="container mx-auto max-w-5xl text-center space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-1.5 text-sm rounded-full mb-6 border border-orange-100">
            Construído junto com motoristas full time
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
            Plano do dia pronto,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-500">
              lucro líquido por km travado antes de ligar o carro.
            </span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
            A IA cruza clima, app favorito e seu custo real, sugere missão e o simulador mostra na hora se vale pegar corrida. Você controla meta, DARF e manutenção num lugar só.
          </p>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
            <Button
              asChild
              className="w-full sm:w-auto h-16 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-10 font-bold shadow-xl shadow-orange-500/20 transition-all hover:scale-105"
            >
              <Link href="/login">
                Começar grátis agora <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto h-16 text-lg rounded-2xl px-8 font-bold border-gray-300 dark:border-gray-700"
            >
              <Link href="/giropro-plus">Explorar o Pro+</Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full sm:w-auto h-16 text-lg rounded-2xl px-8 font-bold text-gray-600 dark:text-gray-200"
              onClick={handleLeadClick}
            >
              Chamar nosso time
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-6">Sem cartão. Cancelamento pelo app em 1 clique.</p>
        </div>
      </div>
    </section>
  );
}
