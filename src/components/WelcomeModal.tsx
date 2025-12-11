// src/components/WelcomeModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

const STORAGE_KEY = 'giropro_welcome_modal_v1';

export function WelcomeModal() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    setHasSeen(stored === 'true');
  }, []);

  const needsProfileBoost = useMemo(() => {
    if (!profile) return false;
    const missingName = !profile.full_name || profile.full_name.trim().length < 2;
    const missingPhone = !profile.phone;
    const missingVehicle = !profile.vehicle_model && !profile.vehicle_plate;
    return missingName || missingPhone || missingVehicle;
  }, [profile]);

  useEffect(() => {
    if (!user || loading) return;
    if (hasSeen) return;
    if (!needsProfileBoost) return;
    if (pathname === '/onboarding' || pathname === '/perfil') return;
    setOpen(true);
  }, [user, loading, hasSeen, needsProfileBoost, pathname]);

  const markSeen = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setHasSeen(true);
  };

  const handleClose = () => {
    markSeen();
    setOpen(false);
  };

  const handleCompleteProfile = () => {
    markSeen();
    setOpen(false);
    router.push('/perfil?from=welcome');
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-3xl border border-orange-100 dark:border-orange-900/40 p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 text-white px-6 py-4 flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] font-bold">Primeiros passos</p>
            <p className="text-lg font-black">Bem-vindo ao GiroPro</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white">
              Você entrou para o cockpit dos motoristas de elite.
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Para calibrar alertas, coach IA e documentos fiscais, precisamos conhecer um pouco mais do seu perfil e do seu veículo.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Metas e custos ajustados em tempo real para sua rotina.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>Coach IA e alertas táticos personalizados para sua cidade.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span>DARF/DAS e documentos com seus dados oficiais.</span>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleCompleteProfile} className="flex-1 h-12 text-base font-bold bg-orange-500 hover:bg-orange-600 rounded-2xl">
              Completar meu perfil agora
            </Button>
            <Button variant="ghost" onClick={handleClose} className="h-12 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400">
              Explorar depois
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
