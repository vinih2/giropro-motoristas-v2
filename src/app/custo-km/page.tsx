// src/app/custo-km/page.tsx
'use client';

import { useState } from 'react';
import { TipoVeiculo } from '@/lib/types';
import { calcularCustoPorKm, formatarMoeda } from '@/lib/calculations';
import { 
    Fuel, Zap, TrendingDown, Car, Gauge, Plug, Leaf, BatteryCharging 
} from 'lucide-react';
import FipeCalculator from '@/components/FipeCalculator'; 
import FeatureButtonGroup from '@/components/FeatureButtonGroup';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { cn } from '@/lib/utils';

function CustoKmContent() {
  const [tipoVeiculo, setTipoVeiculo] = useState<TipoVeiculo>('Carro Flex');
  const [consumo, setConsumo] = useState('');
  const [preco, setPreco] = useState('');
  const [resultado, setResultado] = useState<any>(null);

  const tiposVeiculo: TipoVeiculo[] = ['Carro Flex', 'Moto', 'Elétrico', 'Diesel'];
  const isEletrico = tipoVeiculo === 'Elétrico';

  // Configuração Dinâmica de Tema (Cores e Ícones)
  const theme = isEletrico ? {
      gradient: 'from-emerald-400 to-cyan-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      bgIcon: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
      inputRing: 'focus:ring-emerald-500/20',
      labelInput1: 'Eficiência (km/kWh)',
      labelInput2: 'Custo Energia (R$/kWh)',
      placeholder1: 'Ex: 6.5', // BYD Dolphin faz ~6.5
      placeholder2: 'Ex: 0.80', // Custo residencial médio
      icon1: Zap,
      icon2: Plug,
      heroIcon: Leaf
  } : {
      gradient: 'from-blue-500 to-cyan-500',
      text: 'text-blue-600 dark:text-blue-400',
      bgIcon: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
      inputRing: 'focus:ring-blue-500/20',
      labelInput1: 'Consumo (Km/L)',
      labelInput2: 'Preço Combustível (R$)',
      placeholder1: 'Ex: 10.5',
      placeholder2: 'Ex: 5.49',
      icon1: Gauge,
      icon2: Fuel,
      heroIcon: Car
  };

  const handleCalcular = () => {
    const c = parseFloat(consumo);
    const p = parseFloat(preco);
    if (!c || !p) return;

    const calc = calcularCustoPorKm({
      tipoVeiculo, consumoMedio: c, precoCombustivel: p, kmRodados: 0 
    });
    setResultado(calc);
    
    if (typeof window !== 'undefined') {
        localStorage.setItem('custoPorKm', calc.custoPorKm.toFixed(2));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-32 pt-8 px-4 font-sans transition-colors duration-500">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
            <div className={cn("mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all duration-500 bg-gradient-to-br", theme.gradient)}>
                <theme.heroIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">Custo Real</h1>
            <p className="text-zinc-500 font-medium">
                {isEletrico ? 'Cálculo de eficiência energética' : 'Quanto seu carro gasta por KM?'}
            </p>
        </div>

        {/* CARD CALCULADORA */}
        <Card className="border-0 shadow-xl bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden ring-1 ring-zinc-100 dark:ring-zinc-800">
            <div className={cn("h-2 bg-gradient-to-r transition-all duration-500", theme.gradient)}></div>
            <CardContent className="p-8 space-y-8">
                
                {/* Seletor */}
                <FeatureButtonGroup
                    label="Seu Veículo"
                    options={tiposVeiculo}
                    selected={tipoVeiculo}
                    onSelect={setTipoVeiculo}
                    colorClass={isEletrico ? "bg-emerald-600 text-white shadow-md" : "bg-blue-600 text-white shadow-md"}
                />

                {/* Inputs Gigantes e Dinâmicos */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{theme.labelInput1}</label>
                        <div className="relative group">
                            <theme.icon1 className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", theme.bgIcon)}/>
                            <Input 
                                type="number" placeholder={theme.placeholder1} 
                                value={consumo} onChange={e => setConsumo(e.target.value)}
                                className={cn("pl-12 h-16 text-2xl font-black rounded-2xl bg-zinc-50 dark:bg-black border-transparent focus:bg-white transition-all focus:ring-2", theme.inputRing)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{theme.labelInput2}</label>
                        <div className="relative group">
                            <theme.icon2 className={cn("absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", theme.bgIcon)}/>
                            <Input 
                                type="number" placeholder={theme.placeholder2} 
                                value={preco} onChange={e => setPreco(e.target.value)}
                                className={cn("pl-12 h-16 text-2xl font-black rounded-2xl bg-zinc-50 dark:bg-black border-transparent focus:bg-white transition-all focus:ring-2", theme.inputRing)}
                            />
                        </div>
                    </div>
                </div>

                <Button onClick={handleCalcular} className={cn("w-full h-14 text-lg font-bold text-white rounded-2xl shadow-lg active:scale-95 transition-all", theme.button)}>
                    {isEletrico ? 'Calcular Energia' : 'Calcular Custo'}
                </Button>
                
                {/* Resultado */}
                {resultado && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-500">
                        <div className={cn("p-6 rounded-2xl text-center relative overflow-hidden border bg-opacity-10", isEletrico ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800")}>
                            <div className="relative z-10">
                                <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", theme.text)}>
                                    {isEletrico ? 'Custo por KM (Energia)' : 'Custo por KM (Combustível)'}
                                </p>
                                <div className={cn("flex items-center justify-center gap-1", theme.text)}>
                                    <span className="text-5xl font-black tracking-tighter">{formatarMoeda(resultado.custoPorKm)}</span>
                                    <span className="text-lg font-bold opacity-60">/ km</span>
                                </div>
                                
                                {/* Dica Extra para Elétrico */}
                                {isEletrico && (
                                    <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                                        <BatteryCharging className="w-4 h-4" /> 
                                        Economia de ~70% vs Gasolina
                                    </div>
                                )}

                                {resultado.comparacaoFlex && (
                                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50">
                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                            Melhor opção hoje: <strong>{resultado.comparacaoFlex.melhorOpcao}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Background Icon */}
                            <TrendingDown className={cn("absolute -right-4 -bottom-4 w-32 h-32 opacity-5 z-0", isEletrico ? "text-emerald-500" : "text-blue-500")} />
                        </div>
                        <p className="text-center text-[10px] text-zinc-400 mt-3 uppercase font-bold tracking-wide">
                            *Valor salvo para cálculos do dashboard.
                        </p>
                    </div>
                )}

            </CardContent>
        </Card>

        {/* COMPONENTE FIPE */}
        <div className="pt-4">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg"><Car className="w-5 h-5 text-zinc-500 dark:text-zinc-400"/></div>
                <div>
                    <h2 className="font-bold text-lg text-zinc-900 dark:text-white leading-none">Depreciação</h2>
                    <p className="text-xs text-zinc-500 font-medium">Custo invisível do carro (FIPE)</p>
                </div>
            </div>
            <FipeCalculator />
        </div>

      </div>
    </div>
  );
}

export default function CustoKm() {
  return <ProtectedRoute><CustoKmContent /></ProtectedRoute>;
}