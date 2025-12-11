'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import GiroDataService from '@/services/giroService';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profileReady, setProfileReady] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    let active = true;
    setCheckingProfile(true);
    GiroDataService.getProfileStatus(user.id)
      .then((status) => {
        if (!active) return;
        if (status.needsOnboarding && pathname !== '/onboarding') {
          router.replace(`/onboarding?next=${encodeURIComponent(pathname || '/')}`);
          return;
        }
        if (status.needsProfileDetails && pathname !== '/perfil') {
          router.replace(`/perfil?from=${encodeURIComponent(pathname || '/')}`);
          return;
        }
        // Allow Perfil page to render even se incompleto
        setProfileReady(true);
      })
      .catch(() => setProfileReady(true))
      .finally(() => {
        if (active) setCheckingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (checkingProfile || !profileReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
