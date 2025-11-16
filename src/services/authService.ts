// src/services/authService.ts

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from "@supabase/supabase-js";
// Reutiliza a interface Registro que está em lib/supabase.ts
import { Registro } from "@/lib/supabase"; 

// A instância do Supabase (criada no lib/supabase.ts)
const supabase = createClientComponentClient(); 

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