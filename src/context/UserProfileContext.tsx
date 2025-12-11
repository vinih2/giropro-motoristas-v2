'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import GiroService, { UserProfile } from '@/services/giroService';
import { AuthContext } from './AuthContext';

type UserProfileContextValue = {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

export const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('UserProfileProvider must be rendered within AuthProvider');
  }

  const { user, loading: authLoading } = auth;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { data, error } = await GiroService.fetchUserProfile(user.id);
    if (error) {
      setError(error.message || 'Não foi possível carregar o perfil.');
      setProfile(null);
    } else {
      setError(null);
      setProfile(data ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    fetchProfile();
  }, [authLoading, fetchProfile]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user?.id) return;
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
      const { error } = await GiroService.updateUserProfile(user.id, updates);
      if (error) {
        setError(error.message || 'Erro ao atualizar perfil.');
        await fetchProfile();
        throw new Error(error.message || 'Erro ao atualizar perfil.');
      }
      setError(null);
      await fetchProfile();
    },
    [user, fetchProfile]
  );

  const value = useMemo(
    () => ({
      profile,
      loading: loading || authLoading,
      error,
      refresh: fetchProfile,
      updateProfile,
    }),
    [profile, loading, authLoading, error, fetchProfile, updateProfile]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}
