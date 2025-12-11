// src/components/MapWidget.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server'; 
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Fuel, ThumbsUp, MapPin } from 'lucide-react';
import GiroService from '@/services/giroService'; 
import { cn } from '@/lib/utils';

// --- ÍCONE DINÂMICO (SEM ARQUIVO PNG) ---
const fuelIconSvg = renderToStaticMarkup(
  <div className="relative flex items-center justify-center w-8 h-8">
    <div className="absolute w-full h-full bg-orange-500 rounded-full opacity-30 animate-ping"></div>
    <div className="relative z-10 w-6 h-6 bg-orange-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
      <Fuel size={12} />
    </div>
  </div>
);

const customIcon = L.divIcon({
  html: fuelIconSvg,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

const COORDENADAS: Record<string, [number, number]> = {
  'São Paulo': [-23.5505, -46.6333],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'Belo Horizonte': [-19.9167, -43.9345],
  'Brasília': [-15.7801, -47.9292],
  'Salvador': [-12.9777, -38.5016],
  'Fortaleza': [-3.7172, -38.5433],
  'Curitiba': [-25.4284, -49.2733],
  'Manaus': [-3.1190, -60.0217],
  'Recife': [-8.0543, -34.8813],
  'Porto Alegre': [-30.0346, -51.2177],
  'Goiânia': [-16.6869, -49.2648],
  'Belém': [-1.4558, -48.4902],
  'Guarulhos': [-23.4542, -46.5337],
  'Campinas': [-22.9099, -47.0626],
  'São Luís': [-2.5307, -44.3068],
  'São Gonçalo': [-22.8275, -43.0632],
  'Maceió': [-9.6662, -35.7351],
  'Duque de Caxias': [-22.7923, -43.3082],
  'Natal': [-5.7945, -35.2110],
  'Campo Grande': [-20.4697, -54.6201],
  'Teresina': [-5.0919, -42.8034],
  'João Pessoa': [-7.1195, -34.8450],
  'Florianópolis': [-27.5954, -48.5480],
  'Cuiabá': [-15.6014, -56.0979],
  'Aracaju': [-10.9472, -37.0731],
  'Vitória': [-20.3194, -40.3377],
};

interface MapWidgetProps {
  cidade: string;
  className?: string;
  hotspots?: Array<{ lat: number; lng: number; title: string; subtitle?: string }>;
}

interface CombustivelMarker {
    id?: string;
    posto_nome: string;
    latitude: number;
    longitude: number;
    preco: number;
    tipo_combustivel: string;
    upvotes?: number;
    data_reporte?: string;
}

const hotspotIconSvg = renderToStaticMarkup(
  <div className="relative flex items-center justify-center w-8 h-8">
    <div className="absolute w-full h-full bg-purple-500 rounded-full opacity-30 animate-ping"></div>
    <div className="relative z-10 w-6 h-6 bg-purple-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
      <MapPin size={12} />
    </div>
  </div>
);

const hotspotIcon = L.divIcon({
  html: hotspotIconSvg,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function MapWidget({ cidade, className, hotspots = [] }: MapWidgetProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [precos, setPrecos] = useState<CombustivelMarker[]>([]);
  const center: [number, number] = useMemo(() => COORDENADAS[cidade] || COORDENADAS['São Paulo'], [cidade]);

  useEffect(() => {
    setIsMounted(true);
    
    const carregarPrecos = async () => {
      if (process.env.NODE_ENV !== 'production') console.debug("🗺️ Buscando preços no mapa...");
      const { data, error } = await GiroService.fetchPrecosProximos();
        
      if (error) {
        if (process.env.NODE_ENV !== 'production') console.error("❌ Erro ao buscar preços:", error);
      }

      if (data && Array.isArray(data) && data.length > 0) {
        if (process.env.NODE_ENV !== 'production') console.debug(`✅ Encontrados ${data.length} preços.`);
        setPrecos(data as unknown as CombustivelMarker[]);
      } else {
        if (process.env.NODE_ENV !== 'production') console.debug("⚠️ Nenhum preço encontrado no banco.");
      }
    };
    
    carregarPrecos();
  }, [cidade]);

  if (!isMounted) {
    return (
      <div className={cn("w-full bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse flex items-center justify-center text-gray-400", className)}>
        <span className="flex items-center gap-2"><Fuel className="animate-bounce" /> Carregando Mapa...</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 relative z-0", className)}>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }} 
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} />

        {precos.map((p, index) => (
            <Marker 
                key={index} 
                position={[p.latitude, p.longitude]} 
                icon={customIcon}
            >
                <Popup className="rounded-xl">
                    <div className="p-1 font-sans min-w-[150px]">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{p.posto_nome}</h4>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                            <p className="text-lg font-black text-green-700 flex items-center gap-1">
                                <span className="text-xs font-normal text-green-600">R$</span>
                                {Number(p.preco).toFixed(2)}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-green-600 tracking-wider">
                                {p.tipo_combustivel}
                            </p>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                            <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3 text-blue-500" /> {p.upvotes || 0}
                            </span>
                            <span className="text-[10px]">
                                {p.data_reporte ? new Date(p.data_reporte).toLocaleDateString() : 'Hoje'}
                            </span>
                        </div>
                    </div>
                </Popup>
            </Marker>
        ))}
        {hotspots.map((h, index) => (
            <Marker
                key={`hotspot-${index}`}
                position={[h.lat, h.lng]}
                icon={hotspotIcon}
            >
                <Popup>
                    <div className="text-sm">
                        <p className="font-bold text-gray-900">{h.title}</p>
                        {h.subtitle && <p className="text-xs text-gray-500">{h.subtitle}</p>}
                    </div>
                </Popup>
            </Marker>
        ))}

        <Circle center={center} radius={2000} pathOptions={{ color: 'transparent', fillColor: '#3b82f6', fillOpacity: 0.1 }} />
      </MapContainer>
      
      {/* MUDANÇA AQUI: Texto mais engajador */}
      <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/80 px-3 py-1.5 rounded-lg shadow-md z-[400] backdrop-blur-sm border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Preços dos Parceiros 🤝
        </p>
      </div>
    </div>
  );
}
