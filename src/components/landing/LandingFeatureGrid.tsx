'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Wrench, Zap, ShieldCheck, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function LandingFeatureGrid() {
  return (
    <section id="recursos" className="py-20 bg-gray-50 dark:bg-zinc-950/50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[1fr] gap-6">
          <Card className="md:col-span-2 lg:col-span-3 border-0 shadow-xl bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-10 relative z-10 h-full flex flex-col gap-8">
              <div>
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-green-600 transform group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Plano fechado com lucro por km real</h3>
                <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  Abastecimento, oficina, IPVA e km rodado entram automático na conta. Você sai da garagem sabendo quanto sobra e qual missão precisa bater.
                </p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">+R$ 420/mês</p>
                  <p>Quem trava meta pelo custo real corta corrida negativa e roda menos estressado.</p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Alertas inteligentes</p>
                  <p>Receba sinal quando o km rodado saiu da curva e ajuste antes de fechar o turno.</p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-3 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">Meta guiada</p>
                  <p>IA cruza ganhos e despesas e sugere quantas corridas fechar pra garantir o boleto pago.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-2xl bg-green-50 dark:bg-green-900/10 p-4 border border-green-100 dark:border-green-900/40">
                  <p className="text-xs uppercase font-bold text-green-800 dark:text-green-200">Baselines semanais</p>
                  <p className="text-gray-600 dark:text-gray-200">Compare custo/km por dia útil, madrugada e fim de semana pra planejar folga.</p>
                </div>
                <div className="rounded-2xl bg-green-50 dark:bg-green-900/10 p-4 border border-green-100 dark:border-green-900/40">
                  <p className="text-xs uppercase font-bold text-green-800 dark:text-green-200">Filtro por app</p>
                  <p className="text-gray-600 dark:text-gray-200">UberX, 99, particular ou corporativo separados pra achar onde o lucro sobe.</p>
                </div>
                <div className="rounded-2xl bg-green-50 dark:bg-green-900/10 p-4 border border-green-100 dark:border-green-900/40">
                  <p className="text-xs uppercase font-bold text-green-800 dark:text-green-200">Checklist financeiro</p>
                  <p className="text-gray-600 dark:text-gray-200">Checklist mensal com abastecimento, pneus e DARF pra não esquecer nada.</p>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-green-500/10 to-transparent rounded-tl-full pointer-events-none"></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
            <CardContent className="p-8 h-full flex flex-col gap-6">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:rotate-12 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Radar ao vivo da rua</h3>
                <p className="text-gray-500 dark:text-gray-300 text-sm leading-relaxed mb-4">
                  Coach IA sugere missão curta, a comunidade avisa blitz e pico e o alerta fiscal lembra da DARF. É o grupo bom do WhatsApp, só que organizado.
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Missões de 15 minutos pra encaixar entre corridas.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Alertas priorizados pela sua cidade, zona e app.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Checklist diário com meta, DARF e manutenção do dia.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gray-900 text-white rounded-[2rem] overflow-hidden group relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
            <CardContent className="p-8 h-full flex flex-col gap-6 relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-md">
                <Wrench className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h3 className="text-2xl font-black mb-2">GiroGarage</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Conta seus km reais, estima desgaste e cutuca antes de quebrar. Pare de descobrir problema na porta da oficina.
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-orange-300">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  Avisa troca de óleo, pneu e fluido pelo km rodado no app.
                </div>
                <div className="flex items-center gap-2 text-orange-300">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  Lembra do licenciamento, seguro e multas antes do vencimento.
                </div>
                <div className="flex items-center gap-2 text-orange-300">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  Histórico de revisões e peças por placa pra negociar melhor.
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-left">
                <p className="text-xs text-orange-100">“Ele avisou da troca de pneu 400 km antes. Planejei, negociei e não parei o carro.”</p>
                <p className="text-[11px] text-white/80 mt-1 font-semibold">Renata, BH</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
            <CardContent className="p-8 h-full flex flex-col gap-6">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">DARF sem susto</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Calcula imposto com seu CPF, alíquota e ganhos mensais, gera a guia e notifica antes do vencimento. Paga, marca e esquece.
                </p>
                <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Envie o recibo pro contador com um clique.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Timeline pago/pendente pra não atrasar mais.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3 border-0 shadow-xl bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-[2rem] overflow-hidden relative">
            <CardContent className="p-10 relative z-10 h-full flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="max-w-xl">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-3">GiroPro+</h3>
                  <p className="text-orange-100 text-lg leading-relaxed">
                    Histórico ilimitado, PDFs de renda, IA sem trava e suporte humano em minutos. O kit completo pra quem roda todo dia e quer previsibilidade.
                  </p>
                </div>
                <div className="bg-white/15 rounded-2xl p-5 backdrop-blur-md flex-1">
                  <p className="text-xs uppercase tracking-[0.3em] mb-3 text-yellow-100 font-semibold">Inclui</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1" />
                      PDFs assinados prontos pro banco, locadora ou financiamento.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1" />
                      Assistente IA sem limite com roteiros por zona e app.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1" />
                      Favoritos, metas e simulador sincronizados na nuvem.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white mt-1" />
                      Suporte com especialista Giro em até 5 minutos.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl h-12 px-6 shadow-lg border-0"
                >
                  <Link href="/giropro-plus">Ver tudo do Pro+</Link>
                </Button>
                <Button asChild variant="ghost" className="text-white hover:bg-white/20">
                  <Link href="/login">Testar grátis hoje</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
