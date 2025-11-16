'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
// Importa o serviço de autenticação
import { authService } from '@/services/authService'; 

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Hook de roteamento

  useEffect(() => {
    // Verificar sessão atual
    authService.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função de Logout Corrigida
  const signOut = async () => {
    await authService.signOut();
    
    // MUDANÇA AQUI: Redireciona para a raiz (Landing Page)
    router.push('/');
    router.refresh(); // Garante que o estado seja limpo
  };

  return { user, loading, signOut };
}