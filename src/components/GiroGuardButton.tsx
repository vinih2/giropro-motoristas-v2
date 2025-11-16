// src/components/GiroGuardButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth'; // IMPORTAR O HOOK DE AUTH

export default function GiroGuardButton() {
  const { user, loading: authLoading } = useAuth(); // VERIFICAR USUÁRIO
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contato, setContato] = useState('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const salvo = localStorage.getItem('giroguard_contato');
      if (salvo) setContato(salvo);
    }
  }, []);

  const handleSalvarContato = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoContato = e.target.value;
    setContato(novoContato);
    localStorage.setItem('giroguard_contato', novoContato);
  };

  const handleEmergency = () => {
    if (!contato) {
        toast.error("Configure um contato de emergência primeiro!");
        setIsOpen(true); 
        return;
    }

    setLoading(true);

    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `http://googleusercontent.com/maps/google.com/2{latitude},${longitude}`;
        const message = `🆘 *SOS GIROPRO* 🆘%0A%0APreciso de ajuda! Minha localização atual:%0A${mapsLink}`;
        
        const phone = contato.replace(/\D/g, '');
        
        window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
        
        setLoading(false);
        setIsOpen(false);
        toast.success("WhatsApp de emergência aberto.");
      },
      (error) => {
        console.error(error);
        toast.error("Erro ao obter localização. Verifique se o GPS está ativo.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // --- CORREÇÃO DE VISIBILIDADE ---
  // Se estiver carregando ou se NÃO tiver usuário, não renderiza nada.
  if (authLoading || !user) {
      return null;
  }
  // --- FIM DA CORREÇÃO ---

  return (
    <>
      {/* Botão Flutuante (FAB) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-50 bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-2xl border-4 border-white dark:border-gray-900 transition-transform active:scale-95 animate-pulse hover:animate-none"
        aria-label="Botão de Emergência"
      >
        <ShieldAlert className="w-6 h-6" />
      </button>

      {/* Modal de Confirmação/Configuração */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md border-red-500 border-2 p-6">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 text-xl font-bold">
                <ShieldAlert className="w-6 h-6" /> GIROGUARD
            </DialogTitle>
            <DialogDescription className="text-base">
              Modo de Emergência. Isso enviará sua localização exata para seu contato de confiança.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Contato de Emergência (DDD + Número)</label>
                <Input 
                    placeholder="Ex: 11999999999" 
                    value={contato} 
                    onChange={handleSalvarContato}
                    type="tel"
                    className="text-lg h-12 border-gray-300"
                />
                <p className="text-xs text-gray-500">O número fica salvo no seu celular.</p>
            </div>
          </div>

          {/* Layout em Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                className="w-full h-12 text-gray-600 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
                onClick={handleEmergency} 
                disabled={loading || !contato}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-12 shadow-lg order-1 sm:order-2"
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-5 h-5" />}
                ENVIAR SOS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}