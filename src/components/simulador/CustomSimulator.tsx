'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import type { SimuladorPrefillPayload } from '@/lib/dashboard-bridge';
import type { Scenario } from './types';

type CustomSimulatorProps = {
  onSimulate: (scenario: Scenario) => void;
  prefill?: SimuladorPrefillPayload | null;
};

export function CustomSimulator({ onSimulate, prefill }: CustomSimulatorProps) {
  const limitNumber = (value: string, max: number) => Math.min(Number(value) || 0, max);
  const [form, setForm] = useState({
    name: 'Custom',
    cidade: 'São Paulo',
    plataforma: 'Uber',
    horas: '6',
    km: '120',
    tarifaMedia: '30',
    demanda: 'Média',
    tag: '',
  });

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!prefill) return;
    setForm({
      name: prefill.name || 'Custom',
      cidade: prefill.cidade || 'São Paulo',
      plataforma: prefill.plataforma || 'Uber',
      horas: prefill.horas?.toString() || '6',
      km: prefill.km?.toString() || '120',
      tarifaMedia: prefill.tarifaMedia?.toString() || '30',
      demanda: prefill.demanda || 'Média',
      tag: '',
    });
  }, [prefill]);

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('Informe o nome do cenário.');
    if (!form.cidade.trim()) return toast.error('Informe a cidade.');
    if (!form.plataforma.trim()) return toast.error('Informe a plataforma.');
    if (!form.demanda.trim()) return toast.error('Informe a demanda.');

    const horasValue = limitNumber(form.horas, 24);
    const kmValue = limitNumber(form.km, 500);
    const tarifaValue = limitNumber(form.tarifaMedia, 500);

    if (horasValue <= 0) return toast.error('Horas devem ser maior que zero.');
    if (kmValue <= 0) return toast.error('KM deve ser maior que zero.');
    if (tarifaValue <= 0) return toast.error('Tarifa média deve ser maior que zero.');

    onSimulate({
      id: `custom-${Date.now()}`,
      name: form.name.trim() || 'Estratégia customizada',
      cidade: form.cidade.trim(),
      plataforma: form.plataforma.trim(),
      horas: horasValue,
      km: kmValue,
      tarifaMedia: tarifaValue,
      demanda: form.demanda.trim(),
      tag: form.tag.trim() || undefined,
      favorite: false,
      custom: true,
      savedAt: Date.now(),
    });
  };

  return (
    <Card className="border-0 shadow-xl rounded-3xl bg-white dark:bg-gray-900">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-500" />
          <p className="text-xs uppercase tracking-[0.35em] text-gray-400 font-bold">Simular cenário</p>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Nome</label>
            <Input value={form.name} maxLength={40} onChange={(e) => handleChange('name', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Cidade</label>
            <Input value={form.cidade} maxLength={30} onChange={(e) => handleChange('cidade', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Plataforma</label>
            <Input value={form.plataforma} maxLength={20} onChange={(e) => handleChange('plataforma', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Demanda</label>
            <Input value={form.demanda} maxLength={10} onChange={(e) => handleChange('demanda', e.target.value)} placeholder="Baixa/Média/Alta/Pico" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Etiqueta (opcional)</label>
            <Input value={form.tag} maxLength={20} placeholder="Plano manhã" onChange={(e) => handleChange('tag', e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Horas</label>
            <Input
              type="number"
              value={form.horas}
              min={1}
              max={24}
              onChange={(e) => handleChange('horas', e.target.value.replace(/[^0-9.]/g, '').slice(0, 5))}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">KM estimado</label>
            <Input
              type="number"
              value={form.km}
              min={1}
              max={500}
              onChange={(e) => handleChange('km', e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-400">Tarifa média (R$)</label>
            <Input
              type="number"
              value={form.tarifaMedia}
              min={1}
              max={500}
              onChange={(e) => handleChange('tarifaMedia', e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))}
            />
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600">Simular cenário</Button>
      </CardContent>
    </Card>
  );
}
