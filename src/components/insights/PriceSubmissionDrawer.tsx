'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Loader2, Navigation, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import GiroService from '@/services/giroService';
import { queueRegistroPrefill } from '@/lib/dashboard-bridge';
import type { Plataforma } from '@/lib/types';

const TIPOS_COMBUSTIVEL = ['gasolina', 'etanol', 'diesel'];

type PriceSubmissionDrawerProps = {
  cidade: string;
  plataforma: Plataforma;
  color?: 'green' | 'orange';
};

export function PriceSubmissionDrawer({ cidade, plataforma, color = 'green' }: PriceSubmissionDrawerProps) {
  const { user } = useAuth();
  const [posto, setPosto] = useState('');
  const [preco, setPreco] = useState('');
  const [tipo, setTipo] = useState(TIPOS_COMBUSTIVEL[0]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('last_fuel_submission');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.posto) setPosto(parsed.posto);
        if (parsed.tipo) setTipo(parsed.tipo);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return toast.error('GPS não suportado.');
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoadingLocation(false);
        toast.success('Localização precisa capturada!');
      },
      () => {
        setLoadingLocation(false);
        toast.error('Erro no GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!user) return toast.error('Faça login.');
    if (!posto || !preco || !location) return toast.error('Preencha todos os campos.');
    setSubmitting(true);
    try {
        const { error } = await GiroService.insertPrecoCombustivel({
        posto_nome: posto,
        latitude: location.lat,
        longitude: location.lon,
        preco: parseFloat(preco),
        tipo_combustivel: tipo as any,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success('Preço enviado! Obrigado pela colaboração.');
      setLocation(null);
      try {
        localStorage.setItem('last_fuel_submission', JSON.stringify({ posto, tipo }));
      } catch {
        // ignore
      }
      queueRegistroPrefill({
        origem: 'combustivel',
        cidade,
        plataforma,
        hint: `Preço salvo: ${posto} (${tipo.toUpperCase()}) - R$ ${preco}. Abra Novo Giro para usar.`,
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const accent =
    color === 'orange'
      ? {
          primary: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20',
          trigger: 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20',
          focus: 'focus:ring-orange-500',
          confirmed: 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/20 font-bold',
        }
      : {
          primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
          trigger: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20',
          focus: 'focus:ring-emerald-500',
          confirmed: 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 font-bold',
        };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button className={`w-full rounded-xl h-12 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 transform shadow-lg ${accent.trigger}`}>
          <DollarSign className="w-5 h-5" />
          Lançar Preço
        </Button>
      </DrawerTrigger>
      <DrawerContent className="dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 h-[60vh]">
        <DrawerHeader className="text-center space-y-1">
          <DrawerTitle>Lançar Preço</DrawerTitle>
          <DrawerDescription>Ajude a rapaziada de {cidade}.</DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto w-full max-w-md pb-8 px-6 space-y-6 pt-2 overflow-y-auto h-full">

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Posto / Bandeira</label>
              <Input
                placeholder="Ex: Shell Av. Paulista"
                value={posto}
                onChange={(event) => setPosto(event.target.value)}
                className="h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-lg font-bold rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Preço (R$)</label>
                <Input
                  type="number"
                  placeholder="5.59"
                  value={preco}
                  onChange={(event) => setPreco(event.target.value)}
                  className="h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xl font-black rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Combustível</label>
                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                  className={`w-full h-14 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold outline-none focus:ring-2 ${accent.focus}`}
                >
                  {TIPOS_COMBUSTIVEL.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleGetLocation}
              disabled={loadingLocation || !!location}
              variant="outline"
              className={`w-full h-14 rounded-xl border-2 ${location ? accent.confirmed : 'border-dashed border-gray-300 text-gray-500'}`}
            >
              {loadingLocation ? (
                <Loader2 className="animate-spin" />
              ) : location ? (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5" /> Localização Confirmada
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" /> Usar Localização Atual
                </span>
              )}
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !location}
              className={`w-full h-16 text-lg font-black rounded-2xl transition-all active:scale-95 shadow-xl ${accent.primary}`}
            >
              {submitting ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ENVIO'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
