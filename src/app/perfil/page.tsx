// src/app/perfil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, User as UserIcon, ShieldCheck, Car, Target, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const cleanDigits = (value: string) => value.replace(/\D/g, '');
const sanitizeName = (value: string) => value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
const sanitizePlate = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
const sanitizeAlphaNumeric = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
const formatPlate = (value: string) => sanitizePlate(value);
const formatCpf = (value: string) => {
  const digits = cleanDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};
const formatPhone = (value: string) => {
  const digits = cleanDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}${digits.length === 2 ? ')' : ''}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};


function PerfilContent() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const loading = profileLoading;
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [taxRate, setTaxRate] = useState('11.5');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleFuel, setVehicleFuel] = useState('Flex');
  const [cnh, setCnh] = useState('');
  const [crlv, setCrlv] = useState('');
  const [metaDiaria, setMetaDiaria] = useState('');
  const [metaMensal, setMetaMensal] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  const [themePreference, setThemePreference] = useState('system');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || profileLoading) return;
    if (!profile) {
      setFullName(user.user_metadata?.full_name || '');
      setCpf('');
      setTaxRate('11.5');
      setVehicleModel('');
      setVehiclePlate('');
      setVehicleYear('');
      setVehicleFuel('Flex');
      setCnh('');
      setCrlv('');
      setMetaDiaria('');
      setMetaMensal('');
      setPhone('');
      setLanguage('pt-BR');
      setThemePreference('system');
      setNotifyEmail(true);
      setNotifyPush(true);
      return;
    }
    setFullName(profile.full_name || user.user_metadata?.full_name || '');
    setCpf(profile.cpf ? formatCpf(profile.cpf) : '');
    if (typeof profile.tax_rate === 'number') {
      setTaxRate(((profile.tax_rate || 0) * 100).toString());
    }
    setVehicleModel(profile.vehicle_model || '');
    setVehiclePlate(profile.vehicle_plate ? formatPlate(profile.vehicle_plate) : '');
    setVehicleYear(profile.vehicle_year || '');
    setVehicleFuel(profile.vehicle_fuel || 'Flex');
    setCnh(profile.cnh ? cleanDigits(profile.cnh).slice(0, 11) : '');
    setCrlv(profile.crlv ? sanitizeAlphaNumeric(profile.crlv) : '');
    if (typeof profile.meta_diaria === 'number') setMetaDiaria(profile.meta_diaria.toString());
    if (typeof profile.meta_mensal === 'number') setMetaMensal(profile.meta_mensal.toString());
    setPhone(profile.phone ? formatPhone(profile.phone) : '');
    setLanguage(profile.language || 'pt-BR');
    setThemePreference(profile.theme_preference || 'system');
    setNotifyEmail(profile.notify_email ?? true);
    setNotifyPush(profile.notify_push ?? true);
  }, [user, profile, profileLoading]);

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) return toast.error('Informe seu nome completo.');
    setSaving(true);
    try {
      const parsedRate = parseFloat(taxRate.replace(',', '.')) / 100;
      const parsedMeta = parseFloat(metaDiaria.replace(',', '.'));
      const parsedMetaMensal = parseFloat(metaMensal.replace(',', '.'));
      const normalizedCpf = cleanDigits(cpf);
      const normalizedPhone = cleanDigits(phone);
      const normalizedPlate = sanitizePlate(vehiclePlate);
      const normalizedCnh = cleanDigits(cnh);
      const normalizedCrlv = sanitizeAlphaNumeric(crlv);
      await updateProfile({
        full_name: fullName.trim(),
        cpf: normalizedCpf,
        tax_rate: isNaN(parsedRate) ? null : parsedRate,
        vehicle_model: vehicleModel.trim(),
        vehicle_plate: normalizedPlate,
        vehicle_year: vehicleYear.trim(),
        vehicle_fuel: vehicleFuel,
        cnh: normalizedCnh,
        crlv: normalizedCrlv,
        meta_diaria: isNaN(parsedMeta) ? undefined : parsedMeta,
        meta_mensal: isNaN(parsedMetaMensal) ? null : parsedMetaMensal,
        phone: normalizedPhone,
        language,
        theme_preference: themePreference,
        notify_email: notifyEmail,
        notify_push: notifyPush,
      });
      await supabase.auth.updateUser({ data: { full_name: fullName.trim(), phone: normalizedPhone } });
      toast.success('Perfil atualizado!');
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-24 pt-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
            <UserIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Meu Perfil</h1>
          <p className="text-sm text-gray-500">Atualize seus dados pessoais e fiscais.</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Informações pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Nome completo</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(sanitizeName(e.target.value))}
                placeholder="Seu nome"
                className="mt-1"
                maxLength={60}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">CPF</label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="mt-1"
                inputMode="numeric"
                maxLength={14}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Telefone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-0000"
                className="mt-1"
                inputMode="numeric"
                maxLength={16}
              />
            </div>
          </CardContent>
        </Card>


        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Configurações fiscais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">Personalize a alíquota usada no cálculo do DARF. Valor padrão: 11,5%.</p>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Alíquota (%)</label>
              <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="mt-1" step="0.1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <Car className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Dados do veículo</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Modelo</label>
              <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Ex: Corolla 2022" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Placa</label>
              <Input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(formatPlate(e.target.value))}
                placeholder="ABC1D23"
                className="mt-1 uppercase"
                maxLength={7}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Ano</label>
              <Input
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="2022"
                className="mt-1"
                inputMode="numeric"
                maxLength={4}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Combustível</label>
              <Input value={vehicleFuel} onChange={(e) => setVehicleFuel(e.target.value)} placeholder="Flex, Gasolina..." className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">CNH</label>
              <Input
                value={cnh}
                onChange={(e) => setCnh(cleanDigits(e.target.value).slice(0, 11))}
                placeholder="00000000000"
                className="mt-1"
                inputMode="numeric"
                maxLength={11}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">CRLV</label>
              <Input
                value={crlv}
                onChange={(e) => setCrlv(sanitizeAlphaNumeric(e.target.value).slice(0, 11))}
                placeholder="Número do CRLV"
                className="mt-1 uppercase"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Configuração de metas</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Meta diária (R$)</label>
              <Input type="number" value={metaDiaria} onChange={(e) => setMetaDiaria(e.target.value)} placeholder="200" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Meta mensal (R$)</label>
              <Input type="number" value={metaMensal} onChange={(e) => setMetaMensal(e.target.value)} placeholder="6000" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Idioma e tema</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Idioma</label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="pt-BR" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Tema</label>
              <Input value={themePreference} onChange={(e) => setThemePreference(e.target.value)} placeholder="system/light/dark" className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Preferências de notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Email</p>
                <p className="text-xs text-gray-500">Receber alertas de metas e impostos</p>
              </div>
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Push</p>
                <p className="text-xs text-gray-500">Notificações no app</p>
              </div>
              <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Preferências de notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Email</p>
                <p className="text-xs text-gray-500">Receber alertas de metas e impostos</p>
              </div>
              <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Push</p>
                <p className="text-xs text-gray-500">Notificações no app</p>
              </div>
              <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Segurança</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500">
              Último login: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : '---'}
            </p>
            <Button variant="outline" onClick={async () => {
              try {
                await supabase.auth.signOut({ scope: 'others' });
                toast.success('Outros dispositivos foram desconectados.');
              } catch (error) {
                console.error(error);
                toast.error('Não foi possível desconectar.');
              }
            }}>
              Desconectar outros dispositivos
            </Button>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 text-lg font-bold">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <PerfilContent />
    </ProtectedRoute>
  );
}
