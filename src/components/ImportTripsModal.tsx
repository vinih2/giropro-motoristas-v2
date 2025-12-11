// src/components/ImportTripsModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface ImportTripsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PreviewData {
  totalTrips: number;
  validTrips: number;
  invalidTrips: number;
  errors: Array<{ index: number; error: string }>;
  data: Array<any>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function retryFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (res.status === 408 || res.status === 429 || res.status === 500) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return retryFetch(url, options, retries - 1);
      }
    }
    return res;
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
}

export default function ImportTripsModal({ open, onOpenChange, onSuccess }: ImportTripsModalProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');

  // Persist form data to localStorage
  useEffect(() => {
    if (!open) {
      localStorage.removeItem('import_modal_state');
      return;
    }
    const state = { file: file?.name, step, preview };
    localStorage.setItem('import_modal_state', JSON.stringify(state));
  }, [open, file, step, preview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      toast.error('Apenas arquivos CSV são suportados');
      return;
    }

    setFile(selected);
  };

  const handlePreview = async () => {
    if (!file || !user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('action', 'preview');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No session');

      const res = await retryFetch('/api/import-trips', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao processar arquivo');
        return;
      }

      setPreview(data);
      setStep('preview');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fazer preview dos dados. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !user || !preview) return;

    setStep('importing');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('action', 'import');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No session');

      const res = await retryFetch('/api/import-trips', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao importar');
        setStep('preview');
        return;
      }

      toast.success(data.message);
      onOpenChange(false);
      setFile(null);
      setPreview(null);
      setStep('upload');
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao importar corridas. Verifique sua conexão e tente novamente.');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setPreview(null);
    setStep('upload');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Histórico de Corridas</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Envie um arquivo CSV com suas corridas do Uber ou 99'}
            {step === 'preview' && 'Revise os dados antes de importar'}
            {step === 'importing' && 'Importando corridas...'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center space-y-3">
              <FileText className="w-8 h-8 mx-auto text-gray-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Selecione um arquivo CSV</p>
                <p className="text-sm text-gray-500">ou arraste aqui</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input">
                <Button asChild variant="outline" className="cursor-pointer">
                  <span><Upload className="w-4 h-4 mr-2" />Escolher Arquivo</span>
                </Button>
              </label>
            </div>

            {file && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-400">
                  ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-semibold">Formato esperado (CSV):</p>
              <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                Date,Time,City,Category,Amount,Distance,Duration
              </code>
              <p className="text-xs">Exemplo: 2024-12-09,18:30,São Paulo,UberX,85.50,12.5,45</p>
              
              <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                <p className="font-semibold mb-2">Como extrair o CSV:</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">🚗 No Uber:</p>
                    <p className="text-gray-500 dark:text-gray-400">Abra o app → "Histórico" → "Exportar" → Salve como CSV</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">🅽 Na 99:</p>
                    <p className="text-gray-500 dark:text-gray-400">Histórico de viagens → "Baixar relatório" → Selecione CSV</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePreview}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Revisar Dados'}
            </Button>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{preview.validTrips}</p>
                <p className="text-xs text-green-700 dark:text-green-300 font-semibold">Corridas válidas</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{preview.invalidTrips}</p>
                <p className="text-xs text-red-700 dark:text-red-300 font-semibold">Com erro</p>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 space-y-2">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Erros encontrados:
                </p>
                <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1">
                  {preview.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>Linha {err.index + 1}: {err.error}</li>
                  ))}
                  {preview.errors.length > 3 && <li>...e mais {preview.errors.length - 3}</li>}
                </ul>
              </div>
            )}

            {preview.data.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Primeiras corridas:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {preview.data.map((trip, i) => (
                    <div key={i} className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <p>{trip.plataforma} - R$ {trip.ganho_bruto.toFixed(2)} ({trip.km.toFixed(1)}km, {trip.horas.toFixed(2)}h)</p>
                      <p className="text-gray-500 dark:text-gray-400">{new Date(trip.data).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setStep('upload'); }} disabled={loading}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={preview.validTrips === 0 || loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Importar'}
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-orange-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Importando corridas...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
