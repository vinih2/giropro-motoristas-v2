'use client';

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { PriceSubmissionDrawer } from '@/components/insights/PriceSubmissionDrawer';
import type { Hotspot } from '@/services/placesService';
import { cn } from '@/lib/utils';

const MapWidget: any = dynamic(
  () => import('@/components/MapWidget').then((mod) => (mod as any).default),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] w-full bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm">
          <MapPin className="w-8 h-8 text-gray-300" />
        </div>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando Satélite...</span>
      </div>
    ),
  }
);

interface InsightsMapSectionProps {
  cidade: string;
  plataforma: string;
  hotspots: Hotspot[];
}

export function InsightsMapSection({ cidade, plataforma, hotspots }: InsightsMapSectionProps) {
  const markers = hotspots
    .filter((h) => h.location?.lat && h.location?.lng)
    .map((h) => ({
      lat: h.location!.lat,
      lng: h.location!.lng,
      title: h.name,
      subtitle: h.route?.durationInTraffic || h.route?.duration || h.address,
    }));

  return (
    <section className="lg:col-span-2 relative">
      <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-900 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black">
        <div className="relative">
          {(MapWidget as any) && <MapWidget cidade={cidade} className="h-[420px] md:h-[560px]" hotspots={markers} />}
          <div className="absolute inset-x-6 bottom-6 z-40 hidden lg:block">
            <CollabCard cidade={cidade} plataforma={plataforma} />
          </div>
        </div>
      </div>
      <div className="lg:hidden mt-4">
        <CollabCard cidade={cidade} plataforma={plataforma} compact />
      </div>
    </section>
  );
}

function CollabCard({ cidade, plataforma, compact }: { cidade: string; plataforma: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-950 rounded-3xl px-5 py-5 shadow-xl border border-gray-200 dark:border-gray-800 space-y-4',
        compact ? '' : 'bg-white/95 dark:bg-gray-950/95'
      )}
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Colabore</p>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">Compartilhe o melhor preço do seu posto</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ajude outros motoristas e ganhe destaque no mapa.</p>
      </div>
        <div className="w-full md:min-w-[220px]">
        <PriceSubmissionDrawer cidade={cidade} plataforma={plataforma as any} color="orange" />
      </div>
    </div>
  );
}
