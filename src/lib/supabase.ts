"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export const supabase = createClientComponentClient();

export interface Registro {
  id?: number;
  user_id: string;
  data: string;
  plataforma: string;
  horas: number;
  km: number;
  ganho_bruto: number;
  custo_km: number;
  lucro: number;
  created_at?: string;
}
