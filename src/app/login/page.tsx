// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { Mail, Chrome, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setMessage('');
    try {
      const { error } = await authService.signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      setMessage(getErrorMessage(error, 'Erro ao fazer login com Google'));
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoadingEmail(true);
    setMessage('');

    try {
      const { error } = await authService.signInWithOtp(email);

      if (error) throw error;

      setMessage('✅ Link de login enviado para seu email! Verifique sua caixa de entrada.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Erro ao enviar link de login'));
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="min-h-screen px-4 bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      <div className="max-w-md mx-auto pt-20 pb-12">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-orange-100 bg-orange-50 text-orange-600 text-sm font-bold">
            <span>🎯 Cockpit GiroPro</span>
            <span>KM, lucros e DARF num lugar só</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-500 bg-clip-text text-transparent">
            Bora entrar?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-sm mx-auto">
            Assim que logar você já vê seus custos, missões de IA, GiroGarage e, se for PRO+, o DARF pronto.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-500 dark:text-gray-300">
            <div className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="font-bold text-gray-900 dark:text-white">Controle do KM</p>
              <p>O custo salvo aqui alimenta dashboard, GiroGarage e DARF.</p>
            </div>
            <div className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="font-bold text-gray-900 dark:text-white">Missões & Radar</p>
              <p>Feed com IA, alertas fiscais e radar colaborativo.</p>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-4 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loadingGoogle ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                Continuar com Google
              </>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-300 font-medium">ou</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loadingEmail || !email}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:from-orange-600 hover:via-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingEmail ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Mandando link...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Receber link mágico
                </>
              )}
            </Button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-xl text-sm font-medium ${
              message.includes('✅') 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-2 mt-4">
            <p>Não recebeu o link? Cheque spam ou tente de novo em 60s.</p>
            <p>Ao entrar, você aceita nossos termos e política de privacidade.</p>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-300">
          <Button variant="ghost" onClick={() => router.push('/')}>← ver recursos</Button>
        </div>
      </div>
    </div>
  );
}
