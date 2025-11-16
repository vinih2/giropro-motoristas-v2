// src/app/insights/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plataforma } from '@/lib/types';
import { 
  MapPin, Fuel, Loader2, Navigation, BrainCircuit, ChevronRight, 
  Cloud, CloudRain, Sun, Check, ArrowRight, Sparkles, Zap, DollarSign, Plus
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import GiroService from '@/services/giroService'; 
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; 
import ProtectedRoute from '@/components/ProtectedRoute'; 

// --- LISTA DE CIDADES (MOVIDA PARA O ESCOPO GLOBAL DESTE ARQUIVO) ---
const CIDADES_PRINCIPAIS = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Fortaleza', 
  'Curitiba', 'Manaus', 'Recife', 'Porto Alegre', 'Belém', 'Goiânia', 'Guarulhos', 
  'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal'
];
const TIPOS_COMBUSTIVEL = ['gasolina', 'etanol', 'diesel'];

// Mapa com Loading Skeleton Bonito
const MapWidget = dynamic(() => import('@/components/MapWidget'), { 
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] w-full bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-full shadow-sm">
            <MapPin className="w-8 h-8 text-gray-300" />
        </div>
        <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Carregando Satélite...</span>
    </div>
  )
});

// --- COMPONENTE DRAWER DE PREÇO (Refinado) ---
function PriceSubmissionDrawer({ cidade }: { cidade: string }) {
    const { user } = useAuth();
    const [posto, setPosto] = useState('');
    const [preco, setPreco] = useState('');
    const [tipo, setTipo] = useState(TIPOS_COMBUSTIVEL[0]);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);

    const handleGetLocation = () => {
        if (!navigator.geolocation) return toast.error("GPS não suportado.");
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                setLoadingLocation(false);
                toast.success("Localização precisa capturada!");
            },
            (err) => { setLoadingLocation(false); toast.error("Erro no GPS."); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        if (!user) return toast.error("Faça login.");
        if (!posto || !preco || !location) return toast.error("Preencha todos os campos.");
        setSubmitting(true);
        const { error } = await GiroService.insertPrecoCombustivel({
            posto_nome: posto, latitude: location.lat, longitude: location.lon,
            preco: parseFloat(preco), tipo_combustivel: tipo as any, user_id: user.id,
        });
        setSubmitting(false);
        if (error) return toast.error("Erro ao salvar.");
        toast.success("Preço enviado! Obrigado pela colaboração.");
        setPosto(''); setPreco(''); setLocation(null);
    };

    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 rounded-xl h-12 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 transform">
                    <DollarSign className="w-5 h-5" /> 
                    Lançar Preço
                </Button>
            </DrawerTrigger>
            <DrawerContent className="dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 h-[60vh]">
                <div className="mx-auto w-full max-w-md pb-8 px-6 space-y-6 pt-6 overflow-y-auto h-full">
                    <div className="text-center space-y-1">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white">Lançar Preço</h3>
                        <p className="text-sm text-gray-500">Ajude a rapaziada de {cidade}.</p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Posto / Bandeira</label>
                            <Input placeholder="Ex: Shell Av. Paulista" value={posto} onChange={e => setPosto(e.target.value)} className="h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-lg font-bold rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Preço (R$)</label>
                                <Input type="number" placeholder="5.59" value={preco} onChange={e => setPreco(e.target.value)} className="h-14 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xl font-black rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Combustível</label>
                                <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-14 px-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                                    {TIPOS_COMBUSTIVEL.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        <Button onClick={handleGetLocation} disabled={loadingLocation || !!location} variant="outline" className={`w-full h-14 rounded-xl border-2 ${location ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 font-bold' : 'border-dashed border-gray-300 text-gray-500'}`}>
                            {loadingLocation ? <Loader2 className="animate-spin" /> : location ? <span className="flex items-center gap-2"><Check className="w-5 h-5"/> Localização Confirmada</span> : <span className="flex items-center gap-2"><Navigation className="w-5 h-5"/> Usar Localização Atual</span>}
                        </Button>

                        <Button onClick={handleSubmit} disabled={submitting || !location} className="w-full h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95">
                            {submitting ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ENVIO'}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function InsightsContent() {
  const { user } = useAuth();
  const [cidade, setCidade] = useState(CIDADES_PRINCIPAIS[0]);
  const [plataforma, setPlataforma] = useState<Plataforma>('Uber');
  const [insightRapido, setInsightRapido] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [clima, setClima] = useState<any>(null);

  useEffect(() => {
      if (user) {
          GiroService.fetchUserProfile(user.id).then(({data}) => {
              if(data?.cidade_padrao) setCidade(data.cidade_padrao);
          });
      }
  }, [user]);

  useEffect(() => {
    if (cidade) {
      fetch(`/api/weather?cidade=${cidade}`)
        .then(res => res.json()).then(data => { if (!data.error) setClima(data); }).catch(() => {});
    }
  }, [cidade]);

  const handleGerar = async () => {
    setLoadingIA(true);
    try {
      const response = await fetch('/api/generate-insight', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cidade, plataforma, 
          prompt: `Sou motorista ${plataforma} em ${cidade}. Clima: ${clima?.descricao}. Me dê uma estratégia tática curta de onde ir agora para lucrar mais.`
        }),
      });
      const data = await response.json();
      setInsightRapido(data.insight);
    } catch { toast.error("Erro na IA."); } 
    finally { setLoadingIA(false); }
  };

  const getWeatherIcon = () => {
      if (!clima) return <Cloud className="text-gray-400" />;
      const main = clima.principal;
      if (['Rain', 'Drizzle'].includes(main)) return <CloudRain className="text-blue-500" />;
      if (main === 'Clear') return <Sun className="text-orange-500 fill-orange-100" />;
      return <Cloud className="text-gray-500 fill-gray-100" />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-32 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900">
      
      {/* --- HEADER (Compacto e Clean) --- */}
      <header className="flex justify-between items-center py-4 px-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black z-20 sticky top-0">
        <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Insights
                <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-200 text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">Beta</Badge>
            </h1>
        </div>
        
        {/* Widget Clima + Cidade */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-1.5 pl-4 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm">
             <div className="flex items-center gap-2">
                {getWeatherIcon()}
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {clima ? Math.round(clima.temp) : '--'}°C
                </span>
             </div>
             <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
             <div className="relative">
                <select 
                    value={cidade} 
                    onChange={(e) => setCidade(e.target.value)} 
                    className="appearance-none bg-transparent text-xs font-bold text-gray-600 dark:text-gray-300 py-1.5 pl-2 pr-6 outline-none cursor-pointer"
                >
                    {CIDADES_PRINCIPAIS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <MapPin className="w-3 h-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUNA 1: MAPA (Grande e Central) */}
            <section className="lg:col-span-2 relative">
                <Card className="overflow-hidden border-0 shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-100 dark:ring-gray-800 h-full flex flex-col">
                    
                    {/* Área do Mapa (Maior altura) */}
                    <div className="relative h-[500px] md:h-[600px] w-full bg-gray-100 dark:bg-gray-950">
                        <MapWidget cidade={cidade} />
                        
                        {/* Badge Radar no Topo (Flutuante) */}
                        <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 pointer-events-none">
                            <div className="flex items-center gap-2">
                                <Fuel className="w-4 h-4 text-orange-500" />
                                <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">Radar de Preço</h3>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Ação (Fundo do Card) */}
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                        <PriceSubmissionDrawer cidade={cidade} />
                    </div>
                </Card>
            </section>

            {/* COLUNA 2: IA COACH (Clean e Integrada) */}
            <section className="lg:col-span-1 flex flex-col">
                <Card className="flex-1 border-0 shadow-xl shadow-gray-200/50 dark:shadow-none bg-white dark:bg-gray-900 rounded-xl ring-1 ring-gray-100 dark:ring-gray-800 flex flex-col h-full">
                    <CardContent className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <BrainCircuit className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900 dark:text-white">Estrategista IA</h3>
                                <p className="text-xs text-gray-500 font-medium">Powered by Gemini</p>
                            </div>
                        </div>

                        {/* Seleção de Plataforma (Botões discretos) */}
                        <div className="space-y-3 mb-6">
                            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Plataforma Ativa</label>
                            <div className="flex flex-wrap gap-2">
                                {['Uber', '99', 'iFood', 'Rappi'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setPlataforma(p as any)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-xs font-bold transition-all",
                                            plataforma === p 
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Área de Resposta da IA */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-800 overflow-y-auto scrollbar-hide flex items-center justify-center text-center min-h-[150px]">
                            {loadingIA ? (
                                <div className="flex flex-col items-center gap-3 text-orange-500 animate-pulse">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <p className="text-sm font-medium">Gerando estratégia...</p>
                                </div>
                            ) : insightRapido ? (
                                <div className="animate-in fade-in duration-300 flex items-start text-left gap-3">
                                    <Sparkles className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                                        {insightRapido}
                                    </p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 gap-3">
                                    <Zap className="w-8 h-8 text-gray-300 dark:text-gray-700" />
                                    <p className="text-xs font-medium max-w-[200px] text-gray-400">Peça uma análise tática.</p>
                                </div>
                            )}
                        </div>

                        {/* Botão de Ação */}
                        <Button 
                            onClick={handleGerar} 
                            disabled={loadingIA} 
                            className="w-full h-12 bg-orange-600 text-white hover:bg-orange-700 font-bold text-sm rounded-lg shadow-lg shadow-orange-500/20 transition-all active:scale-95 group"
                        >
                            {loadingIA ? <Loader2 className="animate-spin mr-2 h-5 w-5"/> : <span className="flex items-center">GERAR ESTRATÉGIA <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"/></span>}
                        </Button>
                    </CardContent>
                </Card>
            </section>

        </div>
      </main>
    </div>
  );
}

export default function InsightsPageWithAuth() {
    return (
        <ProtectedRoute>
            <InsightsContent />
        </ProtectedRoute>
    );
}