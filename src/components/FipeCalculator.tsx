// src/components/FipeCalculator.tsx

'use client';

import { useState, useEffect } from 'react';
import { Car, TrendingDown, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatarMoeda } from '@/lib/calculations';
import { SelectWithSearch } from './SelectWithSearch'; // NOVO COMPONENTE
import { useAuth } from '@/hooks/useAuth';
import GiroService from '@/services/giroService';
import { toast } from 'sonner';

// URL BASE para o nosso novo endpoint de proxy
const LOCAL_FIPE_URL = '/api/fipe/marcas';

// Mantendo o filtro da frota brasileira para não poluir a lista
const MARCAS_PRINCIPAIS = [
  'Chevrolet', 'Volkswagen', 'Fiat', 'Ford', 'Toyota', 'Honda', 'Hyundai', 
  'Renault', 'Jeep', 'Nissan', 'Citroën', 'Peugeot', 'Mitsubishi', 'BMW', 
  'Mercedes-Benz', 'Audi', 'Kia', 'Chery', 'JAC', 'Land Rover', 'Volvo', 'Suzuki', 'BYD'
];

interface FipeOption {
  codigo: string;
  nome: string;
}

export default function FipeCalculator() {
  const { user } = useAuth();
  const [marcas, setMarcas] = useState<FipeOption[]>([]);
  const [modelos, setModelos] = useState<FipeOption[]>([]);
  const [anos, setAnos] = useState<FipeOption[]>([]);
  
  const [marcaSel, setMarcaSel] = useState('');
  const [modeloSel, setModeloSel] = useState('');
  const [anoSel, setAnoSel] = useState('');
  
  const [valorFipe, setValorFipe] = useState<number | null>(null);
  const [depreciacaoKm, setDepreciacaoKm] = useState<number | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [loadingValor, setLoadingValor] = useState(false);

  // Função para limpar estados subsequentes
  const clearModelo = () => { setModeloSel(''); setAnos([]); setAnoSel(''); setValorFipe(null); setDepreciacaoKm(null); };
  const clearAno = () => {
    setAnoSel('');
    setValorFipe(null);
    setDepreciacaoKm(null);
  };

  type FipeBrandResponse = FipeOption[];
  type FipeModelsResponse = { modelos: FipeOption[] };
  type FipeYearsResponse = FipeOption[];
  type FipeValueResponse = { Valor: string };

  // 1. Carregar Marcas (USANDO O NOVO PROXY)
  useEffect(() => {
    fetch(`${LOCAL_FIPE_URL}`)
      .then((res) => res.json() as Promise<FipeBrandResponse>)
      .then((data) => {
        if (!Array.isArray(data)) return;

        const sorted = data.sort((a, b) => {
          const aPrincipal = MARCAS_PRINCIPAIS.some((nome) => a.nome.includes(nome));
          const bPrincipal = MARCAS_PRINCIPAIS.some((nome) => b.nome.includes(nome));
          if (aPrincipal && !bPrincipal) return -1;
          if (!aPrincipal && bPrincipal) return 1;
          return a.nome.localeCompare(b.nome);
        });
        setMarcas(sorted);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // 2. Carregar Modelos (Ao escolher Marca)
  useEffect(() => {
    if (!marcaSel) {
        setModelos([]);
        clearModelo();
        return;
    }
    setLoadingModelos(true);
    clearModelo();
    
    fetch(`${LOCAL_FIPE_URL}/${marcaSel}/modelos`)
      .then((res) => res.json() as Promise<FipeModelsResponse>)
      .then((data) => {
        const mappedModels: FipeOption[] = (data.modelos || []).map((modelo) => ({
          codigo: modelo.codigo.toString(),
          nome: modelo.nome,
        }));
        setModelos(mappedModels);
        setLoadingModelos(false);
      })
      .catch((error) => {
        console.error(error);
        setLoadingModelos(false);
      });
  }, [marcaSel]);

  // 3. Carregar Anos (Ao escolher Modelo)
  useEffect(() => {
    if (!marcaSel || !modeloSel) {
        setAnos([]);
        clearAno();
        return;
    }
    setLoadingAnos(true);
    clearAno();

    fetch(`${LOCAL_FIPE_URL}/${marcaSel}/modelos/${modeloSel}/anos`)
      .then((res) => res.json() as Promise<FipeYearsResponse>)
      .then((data) => {
        const mappedAnos: FipeOption[] = (data || []).map((ano) => ({
          codigo: ano.codigo.toString(),
          nome: ano.nome,
        }));
        setAnos(mappedAnos);
        setLoadingAnos(false);
      })
      .catch((error) => {
        console.error(error);
        setLoadingAnos(false);
      });
  }, [marcaSel, modeloSel]);

  // 4. Buscar Valor Final (Ao escolher Ano)
  const buscarValor = async () => {
    if (!marcaSel || !modeloSel || !anoSel) return;
    setLoadingValor(true);
    try {
      const res = await fetch(`${LOCAL_FIPE_URL}/${marcaSel}/modelos/${modeloSel}/anos/${anoSel}`);
      const data = (await res.json()) as FipeValueResponse;

      const valorNumerico = parseFloat(data.Valor.replace('R$ ', '').replace('.', '').replace(',', '.'));
      setValorFipe(valorNumerico);

      const depPorKm = (valorNumerico * 0.15) / 40000;
      setDepreciacaoKm(depPorKm);

      if (user) {
        setSavingProfile(true);
        await GiroService.updateUserProfile(user.id, { depreciacao_por_km: depPorKm });
        toast.success('Depreciação sincronizada com o dashboard.');
      } else {
        toast.success('Depreciação calculada. Entre na conta para sincronizar.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProfile(false);
      setLoadingValor(false);
    }
  };

  const anoSelecionado = anos.find(a => a.codigo === anoSel)?.nome || '';

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 mt-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
        <Car className="text-blue-600" /> Depreciação Real (FIPE)
      </h3>

      <div className="space-y-4 mb-6">
        
        {/* MARCA (COMBOBOX) */}
        <SelectWithSearch
          label="Marca"
          placeholder="Selecione a marca..."
          options={marcas}
          selectedValue={marcaSel}
          onSelect={setMarcaSel}
          onClear={() => { setMarcaSel(''); setModelos([]); setAnos([]); clearModelo(); }}
        />

        {/* MODELO (COMBOBOX) */}
        <SelectWithSearch
          label="Modelo"
          placeholder="Selecione o modelo..."
          options={modelos}
          selectedValue={modeloSel}
          onSelect={setModeloSel}
          onClear={clearModelo}
          loading={loadingModelos}
          disabled={!marcaSel}
        />

        {/* ANO (COMBOBOX) */}
        <SelectWithSearch
          label="Ano"
          placeholder="Selecione o ano..."
          options={anos}
          selectedValue={anoSel}
          onSelect={setAnoSel}
          onClear={clearAno}
          loading={loadingAnos}
          disabled={!modeloSel}
        />
      </div>

      <Button 
        onClick={buscarValor} 
        disabled={!anoSel || loadingValor || savingProfile} 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl shadow-md active:scale-95 transition-all"
      >
        {loadingValor || savingProfile ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5" />
            {savingProfile ? 'Sincronizando...' : 'Calculando...'}
          </span>
        ) : (
          `Calcular Depreciação ${anoSelecionado ? `(${anoSelecionado})` : ''}`
        )}
      </Button>

      {valorFipe && depreciacaoKm && (
        <div className="mt-6 animate-scale-in">
          <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Valor de Tabela FIPE</span>
              <span className="font-bold text-lg text-gray-900 dark:text-white">{formatarMoeda(valorFipe)}</span>
            </div>
            <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingDown className="text-red-500 w-5 h-5" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Custo Depreciação/KM</span>
                </div>
                <span className="text-3xl font-extrabold text-red-600 dark:text-red-400">
                  {/* Exibir o custo por KM com formatação para R$ */}
                  {formatarMoeda(depreciacaoKm)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center flex items-center justify-center gap-1">
                <AlertCircle size={12} /> Estimativa para uso profissional (15% anual / 40k km).
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Sucesso! O custo de depreciação foi sincronizado com o dashboard e simulador.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
