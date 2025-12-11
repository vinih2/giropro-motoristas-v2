'use client';

import { useMemo, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hotspot, HotspotDetails } from '@/services/placesService';
import { MapPin, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'distance', label: 'Mais próximos' },
  { value: 'rating', label: 'Melhor avaliação' },
];

type HotspotListProps = {
  hotspots: Hotspot[];
  loading: boolean;
  expandedHotspot: string | null;
  onToggleHotspot: (spot: Hotspot) => void;
  hotspotDetails: Record<string, HotspotDetails>;
  loadingHotspotDetail: string | null;
  isPro: boolean;
  onSendToSimulator: (spot: Hotspot) => void;
  onUpgrade: () => void;
  getDemandHint: (details?: HotspotDetails | null) => string;
  sortOption: 'distance' | 'rating';
  filterOpen: 'all' | 'open';
  onSortChange: (value: 'distance' | 'rating') => void;
  onFilterChange: (value: 'all' | 'open') => void;
  onSaveFavorite?: (spot: Hotspot) => void;
  error?: string | null;
  onRetry?: () => void;
};

function HotspotListComponent({
  hotspots,
  loading,
  expandedHotspot,
  onToggleHotspot,
  hotspotDetails,
  loadingHotspotDetail,
  isPro,
  onSendToSimulator,
  onUpgrade,
  getDemandHint,
  sortOption,
  filterOpen,
  onSortChange,
  onFilterChange,
  onSaveFavorite,
  error,
  onRetry,
}: HotspotListProps) {
  const parseDistanceKm = (text?: string) => {
    if (!text) return Number.MAX_VALUE;
    const match = text.match(/([\d.,]+)/);
    if (!match) return Number.MAX_VALUE;
    return parseFloat(match[1].replace(',', '.')) || Number.MAX_VALUE;
  };

  const filteredHotspots = useMemo(() => {
    let list = hotspots;
    if (filterOpen === 'open') {
      list = list.filter((spot) => spot.openNow);
    }
    if (sortOption === 'rating') {
      return [...list].sort((a, b) => {
        const ratingA = hotspotDetails[a.placeId || '']?.rating ?? 0;
        const ratingB = hotspotDetails[b.placeId || '']?.rating ?? 0;
        return ratingB - ratingA;
      });
    }
    return [...list].sort((a, b) => parseDistanceKm(a.route?.distance) - parseDistanceKm(b.route?.distance));
  }, [hotspots, filterOpen, sortOption, hotspotDetails]);

  const controlsVisible = hotspots.length > 0;
  return (
    <section className="lg:col-span-1 space-y-4">
      <Card className="border border-gray-100 dark:border-gray-800 rounded-3xl shadow-lg lg:sticky lg:top-24">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">Hotspots</p>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Picos próximos</h3>
            </div>
          </div>
          {controlsVisible && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value as 'distance' | 'rating')}
                    className={cn(
                      'px-3 py-1 font-semibold rounded-full',
                      sortOption === option.value ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {['all', 'open'].map((state) => (
                  <Button
                    key={state}
                    size="sm"
                    variant={filterOpen === state ? 'secondary' : 'ghost'}
                    className="text-xs"
                    onClick={() => onFilterChange(state as 'all' | 'open')}
                  >
                    {state === 'all' ? 'Todos' : 'Apenas abertos'}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {error ? (
            <div className="p-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-200 flex flex-col gap-2">
              <span>{error}</span>
              {onRetry && (
                <Button variant="ghost" size="sm" className="self-start text-red-700 dark:text-red-200 px-2 py-1 h-auto" onClick={onRetry}>
                  Tentar novamente
                </Button>
              )}
            </div>
          ) : loading ? (
            <p className="text-xs text-gray-500">Buscando pontos...</p>
          ) : filteredHotspots.length ? (
            <ul className="space-y-3">
              {filteredHotspots.map((spot, idx) => {
                const isExpanded = spot.placeId && expandedHotspot === spot.placeId;
                const details = spot.placeId ? hotspotDetails[spot.placeId] : null;
                return (
                  <li key={`${spot.name}-${idx}`} className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{spot.name}</p>
                        <p className="text-xs text-gray-500">{spot.address}</p>
                      </div>
                      {spot.openNow != null && (
                        <Badge
                          variant={spot.openNow ? 'default' : 'secondary'}
                          className={
                            spot.openNow
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                          }
                        >
                          {spot.openNow ? 'Aberto' : 'Fechado'}
                        </Badge>
                      )}
                    </div>
                    {spot.route && (
                      <p className="text-xs text-orange-500">{spot.route.durationInTraffic || spot.route.duration} • {spot.route.distance}</p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onSendToSimulator(spot)}>
                        Enviar para simulador
                      </Button>
                      {onSaveFavorite && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-50 dark:border-amber-500/30"
                          onClick={() => (isPro ? onSaveFavorite(spot) : onUpgrade())}
                        >
                          <Star className="w-3.5 h-3.5 mr-1" />
                          Salvar favorito
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!spot.placeId}
                        className="w-full text-xs text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => spot.placeId && onToggleHotspot(spot)}
                      >
                        {!spot.placeId ? 'Detalhes indisponíveis' : isExpanded ? 'Ocultar' : 'Ver demanda'}
                      </Button>
                    </div>
                    {spot.placeId && isExpanded && (
                      <div className="mt-2 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 text-xs text-gray-600 dark:text-gray-300">
                        {isPro ? (
                          loadingHotspotDetail === spot.placeId ? (
                            <div className="flex items-center gap-2 text-orange-500">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Carregando comportamento...</span>
                            </div>
                          ) : details ? (
                            <div className="space-y-2">
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {details.rating ? `${details.rating.toFixed(1)} • ` : ''}
                                {details.userRatingsTotal ? `${details.userRatingsTotal} avaliações` : 'Sem avaliações'}
                              </p>
                              <p>{getDemandHint(details)}</p>
                              {details.weekdayText && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{details.weekdayText[0]}</p>
                              )}
                            </div>
                          ) : (
                            <p>Sem dados adicionais disponíveis.</p>
                          )
                        ) : (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Pro+</p>
                            <p>Veja comportamento em tempo real, avaliações e horários com o pacote Pro+.</p>
                            <Button size="sm" onClick={onUpgrade} className="rounded-full">
                              Desbloquear
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 text-xs text-gray-600 dark:text-gray-300 space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Sem hotspots para mostrar agora.</p>
              <p>Atualize sua cidade, ajuste os filtros ou encontre um ponto no mapa para enviar ao simulador.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export const HotspotList = memo(HotspotListComponent);
