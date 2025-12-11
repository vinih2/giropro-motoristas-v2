'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo, ReactNode, useRef, useCallback } from 'react';
import { Disc, Activity, RefreshCw, ShieldCheck, Crown, Droplet, Palette, Camera, History, DollarSign, CheckCircle2, AlertTriangle, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/ProtectedRoute';
import { formatarMoeda } from '@/lib/calculations';
import { generateServiceReport } from '@/lib/pdfGenerator';
import { PostgrestError } from '@supabase/supabase-js';
import Link from 'next/link';

const LIMITS = { OLEO: 10000, PNEU: 50000, CORREIA: 60000 };
const COSTS = { OLEO: 150, PNEU: 2200, CORREIA: 950 };
const VEHICLE_BUCKET = 'vehicle-photos';
const DNA_CHECKLIST = [
  { key: 'modelo', label: 'Modelo do veículo' },
  { key: 'placa', label: 'Placa' },
  { key: 'cor', label: 'Cor' },
  { key: 'ano', label: 'Ano' },
  { key: 'foto_url', label: 'Foto real' },
  { key: 'valor_ipva', label: 'Valor do IPVA' },
  { key: 'valor_seguro', label: 'Valor do seguro' },
  { key: 'valor_financiamento', label: 'Parcela do financiamento' },
];

const SERVICE_LABELS: Record<string, string> = {
  oleo: 'Troca de óleo',
  pneu: 'Serviço de pneus',
  correia: 'Correia dentada',
};

const EMPTY_VEHICLE = {
  km_atual: 0,
  km_oleo: 0,
  km_pneu: 0,
  km_correia: 0,
};

type MaintenancePart = 'oleo' | 'pneu' | 'correia';

interface VehicleData {
  id?: string;
  user_id?: string;
  km_atual: number;
  km_oleo: number;
  km_pneu: number;
  km_correia: number;
  modelo?: string | null;
  placa?: string | null;
  cor?: string | null;
  ano?: number | null;
  foto_url?: string | null;
  valor_ipva?: number | null;
  valor_seguro?: number | null;
  valor_financiamento?: number | null;
  intervalo_oleo?: number | null;
  intervalo_pneu?: number | null;
  intervalo_correia?: number | null;
}

interface VehicleService {
  id: string;
  veiculo_id: string;
  user_id: string;
  tipo_servico: string;
  custo_servico: number | null;
  km_servico: number | null;
  descricao?: string | null;
  created_at: string;
}

const VEHICLE_FORM_DEFAULT = {
  modelo: '',
  placa: '',
  cor: '',
  ano: '',
  foto_url: '',
  valor_ipva: '',
  valor_seguro: '',
  valor_financiamento: '',
  intervalo_oleo: '',
  intervalo_pneu: '',
  intervalo_correia: '',
};

type MaintenanceStatus = {
  usage: number;
  remaining: number;
  percentage: number;
  color: string;
  bg: string;
  bar: string;
  label: string;
};

const getPartStatus = (currentKm: number, lastChangeKm: number, limit: number): MaintenanceStatus => {
  const usage = currentKm - lastChangeKm;
  const remaining = Math.max(0, limit - usage);
  const percentage = Math.max(0, Math.min(100, (remaining / limit) * 100));
  let status = { color: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500', label: 'OK' };
  if (percentage < 20) status = { color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-600', label: 'CRÍTICO' };
  else if (percentage < 40) status = { color: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500', label: 'ATENÇÃO' };
  return { usage, remaining, percentage, ...status };
};

const pickFirstVehicle = (data: VehicleData | VehicleData[] | null): VehicleData | null => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
};

export default function GiroGaragePage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [services, setServices] = useState<VehicleService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [editKmOpen, setEditKmOpen] = useState(false);
  const [newKm, setNewKm] = useState('');
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(VEHICLE_FORM_DEFAULT);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState<MaintenancePart | null>(null);
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const isPro = !!profile?.is_pro;
  const accessChecked = !profileLoading;
  const userId = user?.id ?? null;

  const fetchVehicle = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await (supabase as any)
        .from('veiculos')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
      if (error) throw error;
      setVehicle(pickFirstVehicle(data));
    } catch (error) {
      console.error('Erro ao carregar veículo', error);
      setVehicle(null);
    }
  }, [userId]);

  const fetchServices = useCallback(async (vehicleId: string) => {
    setLoadingServices(true);
    try {
      const { data, error } = await (supabase as any)
        .from('servicos_veiculo')
        .select('*')
        .eq('veiculo_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setServices(data ?? []);
    } catch (error) {
      console.error('Erro ao buscar serviços', error);
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    if (!userId || profileLoading) return;
    if (isPro) {
      fetchVehicle();
    } else {
      setVehicle(null);
    }
  }, [userId, isPro, profileLoading, fetchVehicle]);

  useEffect(() => {
    if (vehicle?.id) {
      fetchServices(vehicle.id);
    } else {
      setServices([]);
    }
  }, [vehicle?.id, fetchServices]);

  const currentVehicle = vehicle ?? (EMPTY_VEHICLE as VehicleData);

  const maintenanceLimits = useMemo(() => ({
    oleo: vehicle?.intervalo_oleo || LIMITS.OLEO,
    pneu: vehicle?.intervalo_pneu || LIMITS.PNEU,
    correia: vehicle?.intervalo_correia || LIMITS.CORREIA,
  }), [vehicle]);

  const stats = useMemo(() => {
    const kmAtual = currentVehicle.km_atual || 0;
    return {
      oleo: getPartStatus(kmAtual, currentVehicle.km_oleo || 0, maintenanceLimits.oleo),
      pneu: getPartStatus(kmAtual, currentVehicle.km_pneu || 0, maintenanceLimits.pneu),
      correia: getPartStatus(kmAtual, currentVehicle.km_correia || 0, maintenanceLimits.correia),
    };
  }, [currentVehicle, maintenanceLimits]);

  const upcoming = useMemo(
    () =>
      [
        { key: 'oleo', title: 'Troca de óleo', desc: 'Motor sempre liso', cost: COSTS.OLEO },
        { key: 'pneu', title: 'Pneus e alinhamento', desc: 'Segurança total', cost: COSTS.PNEU },
        { key: 'correia', title: 'Correia dentada', desc: 'Sistema sincronizado', cost: COSTS.CORREIA },
      ]
        .map((item) => ({
          ...item,
          remaining: stats[item.key as keyof typeof stats].remaining,
          status: stats[item.key as keyof typeof stats].label,
        }))
        .sort((a, b) => a.remaining - b.remaining),
    [stats]
  );

  const criticalAlert = useMemo(() => upcoming.find((item) => item.status === 'CRÍTICO' || item.remaining <= 2000), [upcoming]);

  const custoFixoDiario = useMemo(() => {
    if (!vehicle) return 0;
    const ipva = vehicle.valor_ipva || 0;
    const seguro = vehicle.valor_seguro || 0;
    const financiamentoMensal = vehicle.valor_financiamento || 0;
    return ((ipva + seguro) / 365) + ((financiamentoMensal * 12) / 365);
  }, [vehicle]);

  const custoDetalhes = useMemo(() => {
    if (!vehicle) return { ipva: 0, seguro: 0, financiamento: 0 };
    return {
      ipva: (vehicle.valor_ipva || 0) / 365,
      seguro: (vehicle.valor_seguro || 0) / 365,
      financiamento: ((vehicle.valor_financiamento || 0) * 12) / 365,
    };
  }, [vehicle]);

  const completionPercent = useMemo(() => {
    if (!vehicle) return 0;
    const total = DNA_CHECKLIST.length;
    if (total === 0) return 0;
    const filled = DNA_CHECKLIST.filter(({ key }) => {
      const value = vehicle[key as keyof VehicleData];
      return value !== null && value !== undefined && value !== '';
    }).length;
    return Math.min(100, Math.round((filled / total) * 100));
  }, [vehicle]);

  const completionLabel = completionPercent >= 100 ? 'Documento completo' : `Documento ${completionPercent}%`;

  const vehicleHasIdentity = Boolean(vehicle?.modelo || vehicle?.placa || vehicle?.foto_url);

  const startVehicleForm = () => {
    if (vehicle) {
      setVehicleForm({
        modelo: vehicle.modelo || '',
        placa: vehicle.placa || '',
        cor: vehicle.cor || '',
        ano: vehicle.ano ? String(vehicle.ano) : '',
        foto_url: vehicle.foto_url || '',
        valor_ipva: vehicle.valor_ipva ? String(vehicle.valor_ipva) : '',
        valor_seguro: vehicle.valor_seguro ? String(vehicle.valor_seguro) : '',
        valor_financiamento: vehicle.valor_financiamento ? String(vehicle.valor_financiamento) : '',
        intervalo_oleo: vehicle.intervalo_oleo ? String(vehicle.intervalo_oleo) : '',
        intervalo_pneu: vehicle.intervalo_pneu ? String(vehicle.intervalo_pneu) : '',
        intervalo_correia: vehicle.intervalo_correia ? String(vehicle.intervalo_correia) : '',
      });
    } else {
      setVehicleForm(VEHICLE_FORM_DEFAULT);
    }
    setVehicleFormOpen(true);
  };

  const buildVehiclePayload = (overrides?: Partial<VehicleData>) => {
    const basePayload = {
      ...(vehicle?.id ? { id: vehicle.id } : {}),
      user_id: userId,
      km_atual: vehicle?.km_atual ?? 0,
      km_oleo: vehicle?.km_oleo ?? 0,
      km_pneu: vehicle?.km_pneu ?? 0,
      km_correia: vehicle?.km_correia ?? 0,
    };
    return { ...basePayload, ...overrides };
  };

  const formatSupabaseError = (error: unknown) => {
    if (!error) return 'Erro desconhecido.';
    if (typeof error === 'object' && 'message' in error) {
      return (error as PostgrestError).message || 'Erro desconhecido.';
    }
    return String(error);
  };

  const handleSaveVehicle = async () => {
    if (!userId) return;
    setSavingVehicle(true);
    try {
      const payload = buildVehiclePayload({
        modelo: vehicleForm.modelo || null,
        placa: vehicleForm.placa || null,
        cor: vehicleForm.cor || null,
        ano: vehicleForm.ano ? Number(vehicleForm.ano) : null,
        foto_url: vehicleForm.foto_url || null,
        valor_ipva: vehicleForm.valor_ipva ? Number(vehicleForm.valor_ipva) : null,
        valor_seguro: vehicleForm.valor_seguro ? Number(vehicleForm.valor_seguro) : null,
        valor_financiamento: vehicleForm.valor_financiamento ? Number(vehicleForm.valor_financiamento) : null,
        intervalo_oleo: vehicleForm.intervalo_oleo ? Number(vehicleForm.intervalo_oleo) : null,
        intervalo_pneu: vehicleForm.intervalo_pneu ? Number(vehicleForm.intervalo_pneu) : null,
        intervalo_correia: vehicleForm.intervalo_correia ? Number(vehicleForm.intervalo_correia) : null,
      });
      const { data, error } = await (supabase as any).from('veiculos').upsert(payload, { onConflict: 'user_id' }).select();
      if (error) throw error;
      setVehicle(pickFirstVehicle(data));
      setVehicleFormOpen(false);
      toast.success('Documento do veículo atualizado!');
    } catch (error) {
      console.error(error);
      toast.error(formatSupabaseError(error));
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleUpdateKm = async () => {
    if (!userId) return;
    const km = parseFloat(newKm);
    if (Number.isNaN(km) || km < (vehicle?.km_atual ?? 0)) {
      return toast.error('Informe um hodômetro válido.');
    }
    try {
      const payload = buildVehiclePayload({
        km_atual: km,
        km_oleo: vehicle?.km_oleo ?? km,
        km_pneu: vehicle?.km_pneu ?? km,
        km_correia: vehicle?.km_correia ?? km,
      });
      const { data, error } = await (supabase as any).from('veiculos').upsert(payload, { onConflict: 'user_id' }).select();
      if (error) throw error;
      setVehicle(pickFirstVehicle(data));
      setEditKmOpen(false);
      setNewKm('');
      toast.success('Odômetro atualizado!');
    } catch (error) {
      console.error(error);
      toast.error(formatSupabaseError(error));
    }
  };

  const openMaintenanceDialog = (part: MaintenancePart) => {
    if (!vehicle) {
      toast.error('Cadastre seu veículo primeiro.');
      return;
    }
    setMaintenanceType(part);
    const defaultCost = COSTS[part.toUpperCase() as keyof typeof COSTS];
    setMaintenanceCost(defaultCost ? String(defaultCost) : '');
    setMaintenanceDescription('');
  };

  const handleMaintenanceSubmit = async () => {
    if (!userId || !vehicle || !maintenanceType) return;
    const costValue = parseFloat(maintenanceCost) || 0;
    setSavingMaintenance(true);
    try {
      const field = `km_${maintenanceType}` as keyof VehicleData;
      const payload = buildVehiclePayload({
        [field]: vehicle.km_atual,
      });
      const { data, error } = await (supabase as any).from('veiculos').upsert(payload, { onConflict: 'user_id' }).select();
      if (error) throw error;

      const updatedVehicle = pickFirstVehicle(data);
      if (!updatedVehicle) throw new Error('Veículo não retornado após atualização.');
      setVehicle(updatedVehicle);

      if (updatedVehicle.id) {
        const { error: logError } = await supabase.from('servicos_veiculo').insert({
          veiculo_id: updatedVehicle.id,
          user_id: userId,
          tipo_servico: maintenanceType,
          custo_servico: costValue,
          km_servico: updatedVehicle.km_atual,
          descricao: maintenanceDescription || null,
        });
        if (logError) throw logError;
        fetchServices(updatedVehicle.id);
      }
      toast.success('Serviço registrado no diário de bordo!');
    } catch (error) {
      console.error(error);
      toast.error(formatSupabaseError(error));
    } finally {
      setSavingMaintenance(false);
      setMaintenanceType(null);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return;
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}_${vehicle?.id || 'veiculo'}.${fileExt || 'jpg'}`;
      const { error: uploadError } = await supabase.storage.from(VEHICLE_BUCKET).upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from(VEHICLE_BUCKET).getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;
      const payload = buildVehiclePayload({ foto_url: publicUrl });
      const { data, error } = await (supabase as any).from('veiculos').upsert(payload, { onConflict: 'user_id' }).select();
      if (error) throw error;
      setVehicle(pickFirstVehicle(data));
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error(formatSupabaseError(error));
    } finally {
      event.target.value = '';
      setPhotoUploading(false);
    }
  };

  const handleRequestHistory = () => {
    toast.info('Histórico completo estará disponível em breve.');
  };

  const handleExportHistory = () => {
    if (!isPro) {
      toast.error('Disponível apenas no GiroPro+');
      return;
    }
    if (!services.length) {
      toast.error('Nenhum serviço registrado.');
      return;
    }
    generateServiceReport(
      services.map((s) => ({
        created_at: s.created_at,
        tipo_servico: s.tipo_servico,
        custo_servico: s.custo_servico,
        km_servico: s.km_servico,
        descricao: s.descricao,
      })),
      { modelo: vehicle?.modelo, placa: vehicle?.placa }
    );
    toast.success('Histórico exportado com sucesso.');
  };

  const lastService = services[0];

  if (!accessChecked) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!isPro) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
          <div className="max-w-lg w-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-2xl space-y-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <Crown className="w-12 h-12 text-orange-500" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Garagem Inteligente</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Foto do carro, custo real de posse, diário de bordo exportável e alertas inteligentes. Disponível apenas para assinantes Pro+.
              </p>
            </div>
            <Link href="/giropro-plus">
              <Button className="w-full h-12 text-lg font-black rounded-2xl">Desbloquear agora</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-white dark:from-black dark:via-gray-950 dark:to-black px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
            {vehicle?.foto_url && (
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: `url(${vehicle.foto_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            )}
            <div className="relative p-6 md:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        Documento oficial
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl font-black leading-tight">
                          {vehicleHasIdentity ? vehicle?.modelo || 'Veículo cadastrado' : 'Cadastre seu carro'}
                    </h1>
                    <p className="text-sm text-gray-300">
                      {vehicle?.placa ? `Placa ${vehicle.placa}` : 'Adicione placa, ano e cor para personalizar seu documento.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20" onClick={startVehicleForm}>
                      {vehicle ? 'Editar veículo' : 'Cadastrar veículo'}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full bg-white text-gray-900 hover:bg-gray-100"
                      onClick={() => setEditKmOpen(true)}
                    >
                      Atualizar KM
                    </Button>
                  </div>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-[11px] uppercase tracking-[0.3em] bg-white/10 text-white px-3 py-1 rounded-full border border-white/20">
                          {completionLabel}
                        </span>
                        {completionPercent < 100 && (
                          <span className="text-xs text-gray-300">
                            Complete os dados para desbloquear o documento completo.
                          </span>
                        )}
                      </div>
                      {completionPercent < 100 && (
                        <div className="bg-white/10 border border-white/20 rounded-2xl p-3 space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-300 font-bold">Checklist DNA do carro</p>
                          <div className="space-y-1">
                            {DNA_CHECKLIST.map(({ key, label }) => {
                              const filled = vehicle?.[key as keyof VehicleData];
                              return (
                                <div key={key} className="flex items-center gap-2 text-xs">
                                  {filled ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                  )}
                                  <span className="text-gray-200">{label}</span>
                                </div>
                              );
                            })}
                          </div>
                          <Button size="sm" variant="secondary" className="rounded-full mt-2" onClick={startVehicleForm}>
                            Completar documento
                          </Button>
                        </div>
                      )}
                    </div>
                    </div>
                    <div className="w-full md:w-64">
                      <div className="relative aspect-video rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center overflow-hidden">
                        {vehicle?.foto_url ? (
                          <Image
                            src={vehicle.foto_url}
                            alt="Veículo"
                            fill
                            className="object-cover"
                            sizes="(min-width: 768px) 256px, 100vw"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-gray-300">
                            <Camera className="w-10 h-10" />
                            <span className="text-xs text-center max-w-[150px]">Envie uma foto real para personalizar seu documento.</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1 rounded-full font-bold"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={photoUploading}
                        >
                          {photoUploading ? 'Enviando...' : vehicle?.foto_url ? 'Atualizar foto' : 'Enviar foto'}
                        </Button>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center mt-4 text-xs text-gray-300">
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                          <p className="uppercase tracking-[0.25em] text-[10px] text-gray-400 font-bold">Ano</p>
                      <p className="text-base font-black">{vehicle?.ano || '--'}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <p className="uppercase tracking-[0.25em] text-[10px] text-gray-400 font-bold">Cor</p>
                      <p className="text-base font-black flex items-center justify-center gap-1">
                        {vehicle?.cor || '--'}
                        {vehicle?.cor && <Palette className="w-3 h-3" />}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-300 font-bold">Odômetro oficial</p>
                  <p className="text-3xl font-black">{(vehicle?.km_atual || 0).toLocaleString()} km</p>
                  <p className="text-xs text-gray-300 mt-1">Atualizado sempre que você envia um giro.</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gray-300 font-bold">Custo fixo diário</p>
                  <p className="text-3xl font-black text-emerald-300">{formatarMoeda(custoFixoDiario || 0)}</p>
                  <p className="text-xs text-gray-300 mt-1">IPVA + Seguro + financiamento diluídos por dia.</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-gray-300 font-bold">DNA financeiro</p>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center justify-between">
                      <span>IPVA</span>
                      <span>{formatarMoeda(custoDetalhes.ipva)}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Seguro</span>
                      <span>{formatarMoeda(custoDetalhes.seguro)}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Financiamento</span>
                      <span>{formatarMoeda(custoDetalhes.financiamento)}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 border border-white/10 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-gray-300 font-bold">Intervalos recomendados</p>
                    <p className="text-xs text-gray-300">Personalize conforme o manual do veículo.</p>
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-full" onClick={startVehicleForm}>
                    Ajustar
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-center text-xs text-gray-200">
                  {[
                    { key: 'oleo', label: 'Troca de óleo', value: maintenanceLimits.oleo },
                    { key: 'pneu', label: 'Pneus', value: maintenanceLimits.pneu },
                    { key: 'correia', label: 'Correia dentada', value: maintenanceLimits.correia },
                  ].map((item) => (
                    <div key={item.key} className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col items-center gap-1">
                      <Gauge className="w-4 h-4 text-white/70" />
                      <p className="uppercase tracking-[0.25em] text-[10px] text-gray-300 font-bold">{item.label}</p>
                      <p className="text-base font-black">{item.value.toLocaleString()} km</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MaintenanceItem
                  title="Saúde do óleo"
                  icon={<Droplet className="w-5 h-5" />}
                  data={stats.oleo}
                  limit={maintenanceLimits.oleo}
                  onLog={() => openMaintenanceDialog('oleo')}
                />
                <MaintenanceItem
                  title="Pneus e alinhamento"
                  icon={<Disc className="w-5 h-5" />}
                  data={stats.pneu}
                  limit={maintenanceLimits.pneu}
                  onLog={() => openMaintenanceDialog('pneu')}
                />
                <MaintenanceItem
                  title="Correia dentada"
                  icon={<Activity className="w-5 h-5" />}
                  data={stats.correia}
                  limit={maintenanceLimits.correia}
                  onLog={() => openMaintenanceDialog('correia')}
                />
              </div>

              {lastService && (
                <Card className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 shadow-lg bg-emerald-50/70 dark:bg-emerald-900/10">
                  <CardContent className="p-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-600 font-bold">Último serviço</p>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">
                        {SERVICE_LABELS[lastService.tipo_servico] || 'Serviço registrado'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-200">
                        {new Date(lastService.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        • {lastService.km_servico?.toLocaleString() || '--'} km •{' '}
                        {formatarMoeda(lastService.custo_servico || 0)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full" onClick={handleRequestHistory}>
                      Ver histórico completo
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400 font-bold">Diário de bordo</p>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white">Histórico de serviços</h3>
                    </div>
                    <History className="w-5 h-5 text-orange-500" />
                  </div>
                  {loadingServices ? (
                    <p className="text-sm text-gray-500">Sincronizando registros...</p>
                  ) : services.length ? (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div key={service.id} className="relative pl-6">
                          <span className="absolute left-0 top-3 w-3 h-3 bg-orange-500 rounded-full" />
                          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {SERVICE_LABELS[service.tipo_servico] || 'Serviço registrado'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(service.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}{' '}
                                  • {service.km_servico?.toLocaleString() || '--'} km
                                </p>
                              </div>
                              <p className="text-sm font-black text-orange-500">
                                {formatarMoeda(service.custo_servico || 0)}
                              </p>
                            </div>
                            {service.descricao && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{service.descricao}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-5 text-center">
                      Nenhum serviço registrado ainda. Use os botões de manutenção ou registre manualmente para construir o
                      histórico do seu carro.
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={handleRequestHistory}>
                      Ver histórico completo
                    </Button>
                    <Button className="flex-1 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900" onClick={handleExportHistory}>
                      Exportar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-gray-100 dark:border-gray-900 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-gray-400 font-bold">Agenda inteligente</p>
                      <h2 className="text-lg font-black text-gray-900 dark:text-white">Próximos alertas</h2>
                    </div>
                    <BadgePill label="Monitorado" />
                  </div>
                  {criticalAlert && (
                    <div className="p-4 rounded-2xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase font-bold text-orange-600">Atenção urgente</p>
                          <p className="text-sm font-black text-orange-700 dark:text-orange-200">{criticalAlert.title}</p>
                        </div>
                        <span className="text-sm font-black text-orange-600">{criticalAlert.remaining.toLocaleString()} km</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-full bg-orange-600 hover:bg-orange-500 text-white"
                        onClick={() => openMaintenanceDialog(criticalAlert.key as MaintenancePart)}
                      >
                        Agendar agora
                      </Button>
                    </div>
                  )}
                  <div className="space-y-3">
                    {upcoming.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 uppercase font-bold">Restam</p>
                          <p className="text-lg font-black text-gray-900 dark:text-white">{item.remaining.toLocaleString()} km</p>
                          <p className="text-[11px] text-orange-500 font-bold">{formatarMoeda(item.cost)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-dashed border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 shadow-inner">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-gray-500 font-bold">Meta inteligente</p>
                      <h3 className="text-lg font-black text-orange-600">Use seu custo fixo diário</h3>
                    </div>
                  </div>
                  <p className="text-sm text-orange-700">
                    Na tela inicial, considere adicionar R$ {formatarMoeda(custoFixoDiario || 0)} ao valor da meta diária. Assim, você
                    sempre sabe quanto está realmente lucrando.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <Dialog open={editKmOpen} onOpenChange={setEditKmOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Atualizar odômetro</DialogTitle>
              <DialogDescription>Informe o odômetro atual para manter o documento em dia.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-center">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Odômetro atual</p>
                <p className="text-2xl font-mono font-bold">{(vehicle?.km_atual || 0).toLocaleString()} km</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Novo Valor</label>
                <Input
                  type="number"
                  value={newKm}
                  onChange={(e) => setNewKm(e.target.value)}
                  className="text-xl h-12 font-bold"
                  placeholder="Ex: 50100"
                />
              </div>
            </div>
            <Button onClick={handleUpdateKm} className="w-full h-12 bg-orange-600 hover:bg-orange-700 font-bold text-lg">
              Salvar KM
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={vehicleFormOpen} onOpenChange={setVehicleFormOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{vehicle ? 'Editar veículo' : 'Cadastrar veículo'}</DialogTitle>
              <DialogDescription>Esses dados personalizam seu documento digital e alimentam os cálculos de custo real.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <Input placeholder="Modelo (ex: Corolla XEi)" value={vehicleForm.modelo} onChange={(e) => setVehicleForm((prev) => ({ ...prev, modelo: e.target.value }))} />
              <Input placeholder="Placa" value={vehicleForm.placa} onChange={(e) => setVehicleForm((prev) => ({ ...prev, placa: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Ano" type="number" value={vehicleForm.ano} onChange={(e) => setVehicleForm((prev) => ({ ...prev, ano: e.target.value }))} />
                <Input placeholder="Cor" value={vehicleForm.cor} onChange={(e) => setVehicleForm((prev) => ({ ...prev, cor: e.target.value }))} />
              </div>
              <Input placeholder="URL da foto do veículo" value={vehicleForm.foto_url} onChange={(e) => setVehicleForm((prev) => ({ ...prev, foto_url: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  placeholder="IPVA (ano)"
                  value={vehicleForm.valor_ipva}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, valor_ipva: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Seguro (ano)"
                  value={vehicleForm.valor_seguro}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, valor_seguro: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Financiamento (mês)"
                  value={vehicleForm.valor_financiamento}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, valor_financiamento: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Intervalos recomendados (km)</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    placeholder="Óleo"
                    value={vehicleForm.intervalo_oleo}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, intervalo_oleo: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Pneus"
                    value={vehicleForm.intervalo_pneu}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, intervalo_pneu: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Correia"
                    value={vehicleForm.intervalo_correia}
                    onChange={(e) => setVehicleForm((prev) => ({ ...prev, intervalo_correia: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveVehicle} disabled={savingVehicle} className="w-full h-12 font-bold text-lg">
              {savingVehicle ? 'Salvando...' : 'Salvar veículo'}
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={!!maintenanceType} onOpenChange={(open) => !open && setMaintenanceType(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar serviço</DialogTitle>
              <DialogDescription>Esse registro será salvo no seu diário de bordo e resetará o status da peça.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="bg-gray-50 dark:bg-gray-900/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-sm">
                <p className="text-gray-500">Componente</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{SERVICE_LABELS[maintenanceType ?? ''] || 'Manutenção'}</p>
                <p className="text-xs text-gray-500 mt-1">KM atual: {(vehicle?.km_atual || 0).toLocaleString()} km</p>
              </div>
              <Input
                type="number"
                placeholder="Custo do serviço"
                value={maintenanceCost}
                onChange={(e) => setMaintenanceCost(e.target.value)}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={maintenanceDescription}
                onChange={(e) => setMaintenanceDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleMaintenanceSubmit} disabled={savingMaintenance} className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold text-lg">
              {savingMaintenance ? 'Registrando...' : 'Confirmar manutenção'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

function MaintenanceItem({
  title,
  icon,
  data,
  limit,
  onLog,
}: {
  title: string;
  icon: ReactNode;
  data: MaintenanceStatus;
  limit: number;
  onLog: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg p-5">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-200">{icon}</div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{title}</h3>
            <p className="text-xs text-gray-500 font-medium">Troca a cada {limit / 1000}k km</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${data.bg} ${data.color}`}>{data.label}</span>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Saúde</span>
          <span>{Math.round(data.percentage)}%</span>
        </div>
        <Progress value={data.percentage} className={`h-3 rounded-full bg-gray-100 dark:bg-gray-800 [&>div]:${data.bar}`} />
        <div className="flex justify-between items-center pt-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Restam <strong className="text-gray-900 dark:text-white">{data.remaining.toLocaleString()} km</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLog}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold h-8 px-3 text-xs"
          >
            Registrar troca
          </Button>
        </div>
      </div>
    </div>
  );
}

function BadgePill({ label }: { label: string }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.3em] text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300 font-bold px-3 py-1 rounded-full">
      {label}
    </span>
  );
}
