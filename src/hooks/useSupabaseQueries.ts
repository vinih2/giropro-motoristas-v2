'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Hook para fetch de registros do usuário com React Query
 * Exemplo de uso em componentes para melhor caching e performance
 */
export function useRegistros(userId: string | null, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['registros', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('registros')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && options?.enabled !== false,
  });
}

/**
 * Hook para fetch do perfil do usuário
 */
export function useUserProfileData(userId: string | null) {
  return useQuery({
    queryKey: ['user_profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Hook para inserir novo registro
 */
export function useInsertRegistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registro: any) => {
      const { data, error } = await supabase
        .from('registros')
        .insert([registro])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch registros queries
      queryClient.invalidateQueries({ queryKey: ['registros'] });
    },
  });
}

/**
 * Hook para atualizar perfil
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { userId }) => {
      // Update cache directly
      queryClient.setQueryData(['user_profile', userId], data?.[0]);
    },
  });
}
