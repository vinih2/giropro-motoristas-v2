'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '@/services/authService';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    authService.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    router.push('/');
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, loading, signOut }), [user, loading, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
