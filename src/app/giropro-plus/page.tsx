// src/app/giropro-plus/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Check, Crown, Zap, FileText, ShieldCheck, 
  History, Wrench, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import GiroDataService from '@/services/giroService';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function GiroProPlusPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (user) {
      GiroDataService.fetchUserProfile(user.id).then(({ data }) => {
        // @ts-ignore
        if (data?.is_pro) setIsPro(true);
      });
    }
  }, [user]);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);

    // --- SIMULAÇÃO DE PAGAMENTO ---
    // @ts-ignore
    const { error } = await GiroDataService.updateUserProfile(user.id, { is_pro: true });

    if (!error) {
        toast.success("👑 Parabéns! Você agora é GiroPro+!");
        setIsPro(true);
        setTimeout(() => router.push('/'), 2000);
    } else {
        toast.error("Erro ao processar assinatura. Tente novamente.");
    }
    setLoading(false);
  };

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
            
            {/* Feature 1: GiroGarage (NOVO) */}
            <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border-l-4 border-l-orange-500 border-y border-r border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                    <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">GiroGarage: Mecânico Virtual</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Controle automático de troca de óleo, pneus e correia baseado no seu KM rodado. Receba alertas antes do problema acontecer.
                    </p>
                </div>
            </div>

            {/* Feature 2: Relatórios */}
            <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Relatórios Oficiais em PDF</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Chega de planilha. Gere comprovantes de renda profissionais para financiamentos, aluguel e declaração de MEI/IR com um clique.
                    </p>
                </div>
            </div>

            {/* Feature 3: Histórico */}
            <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                    <History className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Histórico Ilimitado</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        O plano grátis limita a visualização. No Pro+, você acessa cada corrida, cada ganho e cada KM desde o seu primeiro dia de uso.
                    </p>
                </div>
            </div>

            {/* Feature 4: IA Avançada */}
            <div className="flex gap-4 items-start p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                    <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Coach IA Ilimitado</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Análises profundas de desempenho semanal e mensal. Pergunte ao Coach onde melhorar e receba estratégias personalizadas.
                    </p>
                </div>
            </div>

          </div>

          {/* CARTÃO DE PREÇO (DIREITA - STICKY) */}
          <div className="lg:sticky lg:top-24">
            <Card className="border-4 border-yellow-400 shadow-2xl relative overflow-hidden bg-white dark:bg-gray-900 transform hover:scale-[1.02] transition-transform duration-300">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-yellow-400 to-orange-600"></div>
                <CardHeader className="text-center pt-10 pb-2">
                    <div className="mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Crown className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-3xl font-black text-gray-900 dark:text-white">Assinatura Pro</CardTitle>
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
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">GiroGarage (Manutenção)</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Relatórios PDF Oficiais</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Histórico Infinito</span></div>
                        <div className="flex items-center gap-3"><div className="bg-green-100 p-1 rounded-full"><Check className="w-3 h-3 text-green-600"/></div> <span className="font-medium">Sem Anúncios</span></div>
                    </div>
                </CardContent>
                <CardFooter className="pb-8">
                    {isPro ? (
                        <Button className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 font-bold rounded-xl shadow-lg cursor-default opacity-90" disabled>
                            <Check className="mr-2 w-6 h-6" /> VOCÊ JÁ É PRO
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleSubscribe} 
                            disabled={loading}
                            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-500/30 shadow-xl rounded-xl group transition-all hover:scale-[1.02]"
                        >
                            {loading ? 'Processando...' : (
                                <span className="flex items-center gap-2">
                                    QUERO SER PRO <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    )}
                </CardFooter>
            </Card>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> Pagamento 100% Seguro via Stripe/Pix
            </div>
          </div>

        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}