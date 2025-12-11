'use client';

import { useEffect, useRef } from 'react';
import { Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PRO_FEATURES = [
  'IA ilimitada com missões por zona, clima e plataforma',
  'Simulador com favoritos, tags e importação em 1 toque',
  'Suporte prioridade + grupo fechado com especialistas Giro',
  'Dashboard financeiro completo com DARF automático',
  'PDFs de renda e histórico ilimitado pra banco ou locadora',
];

type LandingProSectionProps = {
  showForm: boolean;
  onToggleForm: (value: boolean) => void;
  leadName: string;
  leadWhatsapp: string;
  leadCity: string;
  onLeadNameChange: (value: string) => void;
  onLeadWhatsappChange: (value: string) => void;
  onLeadCityChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  loading: boolean;
};

export function LandingProSection({
  showForm,
  onToggleForm,
  leadName,
  leadWhatsapp,
  leadCity,
  onLeadNameChange,
  onLeadWhatsappChange,
  onLeadCityChange,
  onSubmit,
  loading,
}: LandingProSectionProps) {
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showForm) {
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
      });
    }
  }, [showForm]);

  return (
    <section id="giroproplus" className="py-20 bg-white dark:bg-black scroll-mt-24 lg:scroll-mt-32">
      <div className="container mx-auto px-6 max-w-4xl text-center space-y-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Plano Pro+</p>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white">Assinatura pra quem vive do app e quer previsibilidade</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-3">
            IA liberada, simulador avançado, DARF automático e PDF de renda. Tudo pronto pra focar na rua e crescer com segurança.
          </p>
        </div>

        <div className="rounded-[2rem] border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 shadow-2xl p-8 text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-semibold">
                <Sparkles className="w-4 h-4" /> Mais pedido
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-3">GiroPro+</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Ideal pra quem roda todo dia, quer bater meta com folga e precisa comprovar renda sempre que chamar crédito.
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm uppercase tracking-[0.3em] text-gray-400 font-bold">a partir de</p>
              <p className="text-4xl font-black text-gray-900 dark:text-white">
                R$ 39<span className="text-lg font-semibold">/mês</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Cobrança mensal, cancele quando quiser.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {PRO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3 text-left">
                <Star className="w-4 h-4 text-orange-500 mt-1" />
                <p className="text-sm text-gray-600 dark:text-gray-300">{feature}</p>
              </div>
            ))}
          </div>

          {showForm ? (
            <form onSubmit={onSubmit} className="mt-8 grid md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="lead-name" className="sr-only">
                  Nome
                </Label>
                <Input
                  id="lead-name"
                  ref={nameInputRef}
                  placeholder="Seu nome"
                  value={leadName}
                  onChange={(event) => onLeadNameChange(event.target.value)}
                  className="rounded-full"
                  autoComplete="name"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="lead-whatsapp" className="sr-only">
                  WhatsApp
                </Label>
                <Input
                  id="lead-whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder="WhatsApp"
                  value={leadWhatsapp}
                  onChange={(event) => onLeadWhatsappChange(event.target.value)}
                  className="rounded-full"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="lead-city" className="sr-only">
                  Cidade (opcional)
                </Label>
                <Input
                  id="lead-city"
                  placeholder="Cidade (opcional)"
                  value={leadCity}
                  onChange={(event) => onLeadCityChange(event.target.value)}
                  className="rounded-full"
                  autoComplete="address-level2"
                />
              </div>
              <div className="md:col-span-3 flex flex-wrap gap-3">
                <Button type="submit" className="rounded-full px-8" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar e chamar no WhatsApp'}
                </Button>
                <Button type="button" variant="ghost" className="rounded-full px-6" onClick={() => onToggleForm(false)}>
                  Cancelar
                </Button>
                <Button asChild variant="ghost" className="rounded-full px-6">
                  <Link href="/login">Testar grátis primeiro</Link>
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="rounded-full px-8" onClick={() => onToggleForm(true)}>
                Falar com especialista
              </Button>
              <Button asChild variant="ghost" className="rounded-full px-6">
                <Link href="/login">Testar grátis primeiro</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
