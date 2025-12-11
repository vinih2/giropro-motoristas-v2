// src/services/authService.ts

import { User, Session } from "@supabase/supabase-js";
// Reutiliza a interface Registro e cliente compartilhado
import { supabase, Registro } from "@/lib/supabase"; 

export type { User, Session, Registro };

/**
 * Service Layer para operações de Autenticação.
 * O GiroService assume a responsabilidade da inserção/busca de registros.
 */
export const authService = {
  // Autenticação
  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  signInWithGoogle: () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: 'openid profile email',
      },
    });
  },

  signInWithOtp: (email: string) => {
    return supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
  },

  signOut: () => {
    return supabase.auth.signOut();
  },
};
