// src/components/GiroShotCard.tsx
'use client';

import * as React from 'react';
import { useRef, useCallback } from 'react';
// IMPORTAÇÕES DA BIBLIOTECA REMOVIDAS DO TOPO PARA EVITAR SSR

import { Button } from './ui/button';
import { formatarMoeda } from '@/lib/calculations';
import { Zap, Clock, Navigation, DollarSign, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; 

interface GiroShotData {
    lucro: number;
    horas: number;
    km: number;
    meta: number;
    insight: string;
    plataforma: string;
    cidade: string;
}

interface GiroShotCardProps {
    data: GiroShotData;
}

// O componente visual para ser capturado
const GiroShotCard = React.forwardRef<HTMLDivElement, GiroShotCardProps>(({ data }, ref) => {
    const progresso = Math.min((data.lucro / data.meta) * 100, 100);

    return (
        <div 
            ref={ref}
            // Estilos em linha para evitar variáveis oklch
            className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-2xl relative overflow-hidden font-sans"
            style={{ 
                fontFamily: 'var(--font-inter)',
                // Cores de fundo e texto fixas (HEX seguro)
                background: 'linear-gradient(135deg, #111827, #371C00)', // Gradiente Escuro Fixo
                color: '#FFFFFF' 
            }}
        >
            <Zap className="w-16 h-16 absolute -top-4 -right-4 opacity-10" style={{ color: '#FCD34D' }} />

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-extrabold" style={{ color: '#FFFFFF' }}>GiroPro - {data.plataforma}</h3>
                <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>{data.cidade}</span>
            </div>

            <div 
                className="rounded-xl p-4 mb-4 border border-white/20" 
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
            >
                <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Lucro Líquido do Dia</p>
                {/* Cor do valor fixa em amarelo */}
                <p className="text-4xl font-black mt-1" style={{ color: '#FCD34D' }}>{formatarMoeda(data.lucro)}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center mb-5">
                {[
                    { value: `${data.horas}h`, icon: Clock },
                    { value: `${data.km}km`, icon: Navigation },
                    { value: formatarMoeda(data.meta), icon: DollarSign }
                ].map((item, index) => (
                    <div 
                        key={index} 
                        className="p-2 rounded-lg" 
                        style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }}
                    >
                        <item.icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
                        <p className="text-sm font-bold">{item.value}</p>
                    </div>
                ))}
            </div>

            <p className="text-xs italic mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                "🧠 Insight da IA: {data.insight}"
            </p>

            <div className="w-full h-2 bg-white/30 rounded-full">
                <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progresso}%`, background: '#FCD34D' }}
                />
            </div>
            <p className="text-xs text-center mt-2 font-semibold">{progresso.toFixed(0)}% da Meta Diária</p>

        </div>
    );
});

GiroShotCard.displayName = 'GiroShotCard';

export function GiroShotButton({ data }: { data: GiroShotData }) {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleShare = useCallback(async () => {
        if (!cardRef.current) {
            toast.error("Referência DOM não encontrada. Tente recarregar a página.");
            return;
        }

        try {
            // FIX CRÍTICO: Importa a biblioteca APENAS quando a função é executada no cliente
            // Isso previne a falha de SSR.
            const domtoimage = (await import('dom-to-image-more')).default;
            
            toast.loading("Preparando GiroShot para compartilhamento...", { duration: 1500 });
            
            const element = cardRef.current;
            
            const dataUrl = await domtoimage.toPng(element, { 
                quality: 0.95,
                width: 384, 
                height: element.offsetHeight,
            });

            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            if (!blob) {
                toast.error("Falha ao gerar a imagem blob.");
                return;
            }

            // Lógica de Compartilhamento
            if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'GiroShot.png', { type: 'image/png' })] })) {
                navigator.share({
                    files: [new File([blob], 'GiroShot.png', { type: 'image/png' })],
                    title: 'Meu GiroPro de Hoje!',
                    text: 'Confira meu desempenho com o GiroPro:',
                }).then(() => toast.success("GiroShot compartilhado com sucesso!")).catch(() => {});
            } else {
                // Fallback para Download
                const link = document.createElement('a');
                link.download = 'GiroShot.png';
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success("GiroShot baixado! Compartilhe a imagem.");
            }

        } catch (error) {
            console.error("GiroShot CRITICAL ERROR:", error); 
            toast.error("ERRO CRÍTICO ao criar GiroShot. A falha de renderização foi capturada, mas o problema na imagem ainda persiste (cor/layout).");
        }
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* O card é renderizado fora da tela (hidden) para a captura */}
            <div className="absolute -left-[9999px] -top-[9999px]">
                <GiroShotCard ref={cardRef} data={data} />
            </div>

            <Button onClick={handleShare} className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg shadow-xl">
                <Share2 className="w-5 h-5 mr-2" /> Gerar GiroShot (Compartilhar)
            </Button>
        </div>
    );
}