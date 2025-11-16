'use client';

import { useState, useEffect } from 'react';
import { 
  Wrench, Settings, AlertTriangle, CheckCircle, 
  Gauge, Disc, Activity, Save, RefreshCw, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase'; 
import ProtectedRoute from '@/components/ProtectedRoute';

const LIMITS = { OLEO: 10000, PNEU: 50000, CORREIA: 60000 };

interface VehicleData {
    km_atual: number; km_oleo: number; km_pneu: number; km_correia: number;
}

export default function GiroGaragePage() {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<VehicleData>({ km_atual: 0, km_oleo: 0, km_pneu: 0, km_correia: 0 });
  const [editKmOpen, setEditKmOpen] = useState(false);
  const [newKm, setNewKm] = useState('');

  useEffect(() => { if (user) fetchVehicle(); }, [user]);

  const fetchVehicle = async () => {
    const { data } = await supabase.from('veiculos').select('*').eq('user_id', user?.id).single();
    if (data) setVehicle(data);
  };

  const handleUpdateKm = async () => {
    const km = parseFloat(newKm);
    if (isNaN(km) || km < vehicle.km_atual) return toast.error("KM inválido.");
    const { error } = await supabase.from('veiculos').upsert({ user_id: user?.id, km_atual: km }).select();
    if (!error) {
        setVehicle(prev => ({ ...prev, km_atual: km }));
        setEditKmOpen(false);
        toast.success("Hodômetro atualizado!");
    }
  };

  const handleMaintenance = async (part: 'oleo' | 'pneu' | 'correia') => {
    const field = `km_${part}`; 
    const { error } = await supabase.from('veiculos').upsert({ 
        user_id: user?.id, km_atual: vehicle.km_atual, [field]: vehicle.km_atual 
    });
    if (!error) {
        setVehicle(prev => ({ ...prev, [field]: prev.km_atual }));
        toast.success(`Troca registrada!`);
    }
  };

  const getPartStatus = (lastChangeKm: number, limit: number) => {
    const usage = vehicle.km_atual - lastChangeKm;
    const remaining = limit - usage;
    const percentage = Math.max(0, Math.min(100, (remaining / limit) * 100));
    let status = { color: "text-emerald-600", bg: "bg-emerald-100", bar: "bg-emerald-500", label: "OK" };
    if (percentage < 20) status = { color: "text-red-600", bg: "bg-red-100", bar: "bg-red-600", label: "CRÍTICO" };
    else if (percentage < 40) status = { color: "text-amber-600", bg: "bg-amber-100", bar: "bg-amber-500", label: "ATENÇÃO" };
    return { usage, remaining, percentage, ...status };
  };

  const stats = {
    oleo: getPartStatus(vehicle.km_oleo, LIMITS.OLEO),
    pneu: getPartStatus(vehicle.km_pneu, LIMITS.PNEU),
    correia: getPartStatus(vehicle.km_correia, LIMITS.CORREIA),
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-8 px-4 pb-32 font-sans">
      <div className="container max-w-xl mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
                <Wrench className="w-8 h-8 text-orange-600"/> Giro<span className="text-orange-600">Garage</span>
            </h1>
            <p className="text-gray-500 font-medium">Gestão inteligente da sua frota.</p>
        </div>
        <div className="relative group cursor-pointer" onClick={() => { setNewKm(vehicle.km_atual.toString()); setEditKmOpen(true); }}>
            <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl shadow-gray-900/20 relative overflow-hidden transition-transform hover:scale-[1.02]">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Quilometragem Total</p>
                        <div className="text-5xl font-mono font-bold tracking-tighter">
                            {vehicle.km_atual.toLocaleString('pt-BR')}
                            <span className="text-lg text-gray-500 ml-1">km</span>
                        </div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
                        <Gauge className="w-6 h-6 text-orange-500" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-yellow-500"></div>
            </div>
            <p className="text-center text-xs text-orange-600 font-bold mt-3 opacity-0 group-hover:opacity-100 transition-opacity">Toque para atualizar KM</p>
        </div>
        <div className="grid gap-5">
            <MaintenanceItem title="Óleo do Motor" icon={<Disc />} data={stats.oleo} limit={LIMITS.OLEO} onReset={() => handleMaintenance('oleo')} />
            <MaintenanceItem title="Pneus" icon={<Disc />} data={stats.pneu} limit={LIMITS.PNEU} onReset={() => handleMaintenance('pneu')} />
            <MaintenanceItem title="Correia Dentada" icon={<Activity />} data={stats.correia} limit={LIMITS.CORREIA} onReset={() => handleMaintenance('correia')} />
        </div>
      </div>
      <Dialog open={editKmOpen} onOpenChange={setEditKmOpen}>
        <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Atualizar Painel</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Atual</p>
                    <p className="text-2xl font-mono font-bold">{vehicle.km_atual} km</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Novo Valor</label>
                    <Input type="number" value={newKm} onChange={(e) => setNewKm(e.target.value)} className="text-xl h-12 font-bold" placeholder="Ex: 50100" />
                </div>
            </div>
            <Button onClick={handleUpdateKm} className="w-full h-12 bg-orange-600 hover:bg-orange-700 font-bold text-lg">Salvar KM</Button>
        </DialogContent>
      </Dialog>
    </div>
    </ProtectedRoute>
  );
}

function MaintenanceItem({ title, icon, data, limit, onReset }: any) {
    return (
        <Card className={`border-l-4 ${data.percentage < 20 ? 'border-l-red-500' : 'border-l-green-500'} shadow-sm`}>
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-300">{icon}</div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">Troca a cada {limit/1000}k km</p>
                        </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${data.bg} ${data.color}`}>{data.label}</span>
                </div>
                <div className="px-5 pb-5 space-y-3">
                    <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <span>Saúde</span>
                        <span>{Math.round(data.percentage)}%</span>
                    </div>
                    <Progress value={data.percentage} className={`h-3 rounded-full bg-gray-100 dark:bg-gray-800 [&>div]:${data.bar}`} />
                    <div className="flex justify-between items-center pt-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Restam <strong className="text-gray-900 dark:text-white">{data.remaining.toLocaleString()} km</strong></span>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold h-8 px-3 text-xs">Registrar Troca <ChevronRight className="w-3 h-3 ml-1" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5"/> Confirmar Manutenção</DialogTitle></DialogHeader>
                                <div className="py-4 text-center">
                                    <p className="text-gray-600 mb-4">Você confirma que realizou a troca de <strong>{title}</strong> hoje?</p>
                                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg text-sm text-orange-800">Isso resetará a contagem para 100% de vida útil.</div>
                                </div>
                                <Button onClick={onReset} className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold text-lg">Sim, Confirmar</Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}