// src/components/LandingPage.tsx
'use client';

import Link from 'next/link';
import { 
  ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, 
  Zap, MapPin, Wallet, Wrench, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-orange-100 dark:selection:bg-orange-900 overflow-x-hidden">
      
      {/* --- NAV --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">G</div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">GiroPro</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
                <Button variant="ghost" className="font-bold text-gray-600 dark:text-gray-300">Entrar</Button>
            </Link>
            <Link href="/login">
                <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 font-bold rounded-full px-6 shadow-lg">
                    Começar
                </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO --- */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="container mx-auto max-w-5xl text-center space-y-8">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-4 py-1.5 text-sm rounded-full mb-6 border border-orange-100">
                    🚀 O Copiloto Financeiro do Motorista App
                </Badge>
                
                <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-6">
                    Dirija Menos,<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-500">Lucre Mais.</span>
                </h1>
                
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
                    Não é só anotar corridas. É inteligência. Controle seus ganhos, economize combustível com o mapa colaborativo e cuide do seu carro com o GiroGarage.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/login" className="w-full sm:w-auto">
                        <Button className="w-full h-16 text-lg bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-10 font-bold shadow-xl shadow-orange-500/20 transition-all hover:scale-105">
                            Criar Conta Grátis <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <p className="text-sm text-gray-400 mt-2 sm:mt-0">Sem cartão de crédito.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURE GRID (Bento Style) --- */}
      <section id="recursos" className="py-20 bg-gray-50 dark:bg-zinc-950/50">
        <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Feature 1: Lucro Real */}
                <Card className="md:col-span-2 border-0 shadow-xl bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-10 relative z-10 h-full flex flex-col justify-between min-h-[320px]">
                        <div>
                            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mb-6 text-green-600 transform group-hover:scale-110 transition-transform duration-300">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Lucro Líquido Real</h3>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                                O app calcula automaticamente o custo do seu KM (combustível + depreciação) e te mostra o que realmente sobrou no bolso. Pare de se enganar com o valor bruto.
                            </p>
                        </div>
                        <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-green-500/10 to-transparent rounded-tl-full pointer-events-none"></div>
                    </CardContent>
                </Card>

                {/* Feature 2: GiroGarage (NOVO) */}
                <Card className="border-0 shadow-xl bg-gray-900 text-white rounded-[2rem] overflow-hidden group relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Wrench className="w-7 h-7 text-orange-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black mb-2">GiroGarage</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Seu mecânico virtual. Controle a vida útil do óleo, pneus e correia baseado no KM que você roda. Nunca mais perca uma troca.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature 3: Mapa */}
                <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
                    <CardContent className="p-8 h-full flex flex-col justify-between">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:rotate-12 transition-transform">
                            <MapPin className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Radar de Preço</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Mapa colaborativo. Saiba onde os parceiros estão abastecendo mais barato na sua cidade em tempo real.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature 4: Pro (Premium) */}
                <Card className="md:col-span-2 border-0 shadow-xl bg-gradient-to-br from-orange-500 to-yellow-500 text-white rounded-[2rem] overflow-hidden relative">
                    <CardContent className="p-10 relative z-10 h-full flex flex-col justify-between min-h-[300px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                    <Crown className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-3xl font-black mb-3">GiroPro+</h3>
                                <p className="text-orange-100 text-lg max-w-md leading-relaxed">
                                    Para quem é profissional de verdade. Relatórios PDF para contabilidade, histórico ilimitado e IA Coach pessoal.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Link href="/login">
                                <Button className="bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl h-12 px-6 shadow-lg border-0">
                                    Conhecer o Plano Pro
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-gray-100 dark:border-gray-800 text-center">
        <p className="text-gray-400 text-sm font-medium">© 2025 GiroPro. Feito para quem não para.</p>
      </footer>
    </div>
  );
}