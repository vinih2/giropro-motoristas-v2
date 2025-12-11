// src/app/giropro-plus/page.tsx
'use client';

import { 
  Check, Crown, Zap, FileText, ShieldCheck, 
  History, Wrench, ChevronRight, Gauge 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProtectedRoute from '@/components/ProtectedRoute';
import PaywallButton from '@/components/PaywallButton';
import Link from 'next/link';

export default function GiroProPlusPage() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const isPro = !!profile?.is_pro;

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-black py-12 px-4">
      <div className="container max-w-5xl mx-auto">
        
        {/* HEADER COM ÍCONE CROWN */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4 shadow-lg animate-bounce-slow">
             <Crown className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 pb-2">
            GiroPro<span className="text-gray-900 dark:text-white">+</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            A ferramenta definitiva para quem leva o volante a sério.
            Desbloqueie o poder total dos seus dados.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* BENEFÍCIOS (ESQUERDA) */}
          <div className="lg:col-span-2 space-y-6">
            {[
                {
                    icon: ShieldCheck,
                    title: 'Compliance & Tributos automáticos',
                    desc: 'Gere DARF/DAS com CPF e alíquota personalizada, receba lembretes e registre pagamento em um clique.',
                    badge: 'NOVO',
                },
                {
                    icon: History,
                    title: 'Histórico infinito + Desempenho avançado',
                    desc: 'Gráficos de ticket diário, comparativos mensais e análises IA exclusivas.',
                },
                {
                    icon: Wrench,
                    title: 'GiroGarage inteligente',
                    desc: 'Alertas de manutenção baseados no seu KM real, projeção de custos e histórico para comprovação.',
                },
                {
                    icon: Zap,
                    title: 'Missões e Insights IA ilimitados',
                    desc: 'Coach inteligente 24/7 para planejar rotas, metas e otimizar ganhos.',
                },
                {
                    icon: FileText,
                    title: 'Relatórios oficiais e PDFs premium',
                    desc: 'Comprovantes prontos para bancos, locadoras e contadores sem marca d’água.',
                },
                {
                    icon: Gauge,
                    title: 'Hotspots em tempo real',
                    desc: 'Mapa com hotspots validados, detalhes via Place ID e integração direta com simulador.',
                    badge: 'AO VIVO'
                },
                {
                    icon: Zap,
                    title: 'Mentoria GiroGuard + WhatsApp',
                    desc: 'Alertas instantâneos e acionamento de mentors direto pelo app quando um giro desvia do plano.',
                }
            ].map(feature => (
                <div key={feature.title} className="p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30">
                            <feature.icon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                        </div>
                        {feature.badge && <Badge variant="secondary" className="bg-orange-500 text-white">{feature.badge}</Badge>}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-4">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">{feature.desc}</p>
                </div>
            ))}
          </div>

          {/* CARTÃO DE PREÇO (DIREITA - STICKY) */}
          <div className="lg:sticky lg:top-24">
            <Card className="border-4 border-yellow-400 shadow-2xl relative overflow-hidden bg-white dark:bg-gray-900 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 to-orange-600"></div>
                <CardHeader className="text-center pt-10 pb-2">
                    <div className="mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Crown className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-3xl font-black text-gray-900 dark:text-white">Assinatura Pro+</CardTitle>
                    <CardDescription className="text-base">Invista na sua carreira.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-base text-gray-400 line-through font-medium">R$ 29,90</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 font-bold">OFERTA</Badge>
                    </div>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-medium text-gray-500">R$</span>
                        <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">19,90</span>
                        <span className="text-lg font-medium text-gray-500">/mês</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Menos que uma corrida mínima por mês.</p>
                    
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3 text-left text-sm">
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Compliance tributário automatizado</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Desempenho mensal com IA ilimitada</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">GiroGarage completo</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Simulador Pro+ (cenários avançados)</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Relatórios premium e histórico total</span></div>
                    </div>
                </CardContent>
                <CardFooter className="pb-8">
                    {isPro ? (
                        <Button className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 font-bold rounded-xl shadow-lg cursor-default opacity-90" disabled>
                            <Check className="mr-2 w-6 h-6" /> VOCÊ JÁ É PRO
                        </Button>
                    ) : (
                        <PaywallButton 
                          priceLabel="QUERO SER PRO"
                          variant="default"
                          fullWidth
                        />
                    )}
                </CardFooter>
                <p className="text-xs text-center text-gray-400 dark:text-gray-300 px-6 -mt-4">
                    Ao continuar você concorda com os <Link href="/termos" className="text-orange-600 font-semibold">Termos de Serviço</Link>, a{' '}
                    <Link href="/privacidade" className="text-orange-600 font-semibold">Política de Privacidade</Link> e a{' '}
                    <Link href="/cancelamento" className="text-orange-600 font-semibold">Política de Cancelamento</Link>.
                </p>
            </Card>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> Pagamento 100% Seguro via Stripe/Pix
            </div>
          </div>

        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-6">
            <Card className="border border-gray-100 dark:border-gray-800 shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl font-black text-gray-900 dark:text-white">Plano gratuito</CardTitle>
                    <CardDescription className="text-sm">Acompanhe o dia a dia sem custo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Dashboard diário com registro de giros</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Histórico limitado (últimos 7 giros)</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Insights IA (3 missões/dia)</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Radar colaborativo de combustível</div>
                </CardContent>
            </Card>
            <Card className="border-2 border-orange-400 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        GiroPro+ completo <Badge variant="secondary" className="bg-orange-500 text-white">Recomendado</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">Ferramentas para quem vive do app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-gray-700 dark:text-gray-200 text-sm">
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Compliance e relatórios bancários</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Desempenho e histórico ilimitados</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> GiroGarage automatizado</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Simulador Pro+ de cenários</div>
                    <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Missões IA sem limite + suporte prioritário</div>
                </CardContent>
                <CardFooter className="pt-4">
                  {isPro ? (
                    <Button disabled className="w-full" variant="secondary">
                      ✓ Você já é Pro+
                    </Button>
                  ) : (
                    <PaywallButton 
                      priceLabel="Começar 7 dias grátis"
                      variant="default"
                      fullWidth
                    />
                  )}
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
