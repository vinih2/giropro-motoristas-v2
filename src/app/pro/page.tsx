// src/app/pro/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Check, Star, Zap, FileText, ShieldCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import GiroDataService from '@/services/giroService';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProPage() {
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

    // --- SIMULAÇÃO DE PAGAMENTO (Integração Stripe/MP entraria aqui) ---
    // Aqui estamos apenas atualizando o banco para TRUE direto
    // @ts-ignore
    const { error } = await GiroDataService.updateUserProfile(user.id, { is_pro: true });

    if (!error) {
        toast.success("🎉 Bem-vindo ao GiroPro+! Funcionalidades desbloqueadas.");
        setIsPro(true);
        setTimeout(() => router.push('/'), 2000);
    } else {
        toast.error("Erro ao processar assinatura.");
    }
    setLoading(false);
  };

  return (
    <ProtectedRoute>
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 mb-4">
          GiroPro<span className="text-black dark:text-white">+</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Dirija com inteligência. Lucre com estratégia.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Free Tier */}
        <Card className="border-2 border-gray-200 dark:border-gray-800 opacity-80 hover:opacity-100 transition-opacity">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-500">Motorista Básico</CardTitle>
            <p className="text-3xl font-bold mt-2">Grátis</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Calculadora de Lucro</li>
              <li className="flex items-center gap-2"><Check className="w-5 h-5 text-green-500" /> Mapa de Combustíveis</li>
              <li className="flex items-center gap-2"><History className="w-5 h-5 text-orange-500" /> Histórico (Últimos 7 dias)</li>
              <li className="flex items-center gap-2 text-gray-400"><XIcon className="w-5 h-5" /> Sem Relatórios PDF</li>
              <li className="flex items-center gap-2 text-gray-400"><XIcon className="w-5 h-5" /> Sem Gestão de Veículo</li>
            </ul>
          </CardContent>
        </Card>

        {/* Pro Tier */}
        <Card className="border-4 border-orange-500 relative transform md:scale-105 shadow-2xl bg-white dark:bg-gray-900">
          <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs font-bold uppercase rounded-bl-xl">Recomendado</div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Star className="fill-orange-500 w-6 h-6" /> GiroPro+
            </CardTitle>
            <p className="text-4xl font-black mt-2">R$ 19,90<span className="text-sm font-normal text-gray-500">/mês</span></p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-2 font-medium"><Check className="w-5 h-5 text-green-500" /> Tudo do plano Grátis</li>
              <li className="flex items-center gap-2 font-bold text-gray-800 dark:text-white"><History className="w-5 h-5 text-orange-500" /> Histórico ILIMITADO</li>
              <li className="flex items-center gap-2 font-bold text-gray-800 dark:text-white"><FileText className="w-5 h-5 text-blue-500" /> Relatórios PDF (IR/MEI)</li>
              <li className="flex items-center gap-2 font-medium"><Zap className="w-5 h-5 text-yellow-500" /> IA Coach Ilimitada</li>
              <li className="flex items-center gap-2 font-medium"><ShieldCheck className="w-5 h-5 text-green-600" /> Suporte Prioritário</li>
            </ul>

            {isPro ? (
                <Button className="w-full h-14 text-lg bg-green-600 hover:bg-green-700" disabled>
                    <Check className="mr-2" /> Você já é PRO
                </Button>
            ) : (
                <Button 
                    onClick={handleSubscribe} 
                    disabled={loading}
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg animate-pulse hover:animate-none"
                >
                    {loading ? 'Processando...' : 'QUERO SER PRO 🚀'}
                </Button>
            )}
            <p className="text-xs text-center text-gray-500 mt-3">Cancele quando quiser. Satisfação garantida.</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProtectedRoute>
  );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    )
}