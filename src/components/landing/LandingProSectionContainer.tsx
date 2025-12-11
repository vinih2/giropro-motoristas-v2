'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import GiroService from '@/services/giroService';
import { LandingProSection } from './LandingProSection';
import { useLandingLeadForm } from './LandingLeadFormContext';

export function LandingProSectionContainer() {
  const [leadName, setLeadName] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadCity, setLeadCity] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);
  const { showLeadForm, openLeadForm, closeLeadForm } = useLandingLeadForm();

  const handleLeadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!leadName.trim() || !leadWhatsapp.trim()) {
      toast.error('Informe nome e WhatsApp para falar com o time.');
      return;
    }
    setLeadLoading(true);
    try {
      const { error } = await GiroService.createProPlusLead({
        name: leadName.trim(),
        whatsapp: leadWhatsapp.trim(),
        cidade: leadCity.trim() || undefined,
        source: 'landing',
      });
      if (error) throw error;
      toast.success('Recebemos seu contato! Vamos falar com você no WhatsApp.');
      setLeadName('');
      setLeadWhatsapp('');
      setLeadCity('');
      closeLeadForm();
      // Abrir WhatsApp com mensagem pré-preenchida
      const whatsappUrl = `https://wa.me/5511999999999?text=Olá! Sou ${encodeURIComponent(leadName)} e gostaria de saber mais sobre o GiroPro+`;
      setTimeout(() => window.open(whatsappUrl, '_blank'), 500);
    } catch (error) {
      console.error(error);
      toast.error('Não conseguimos enviar agora. Tente novamente ou chame no WhatsApp.');
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <LandingProSection
      showForm={showLeadForm}
      onToggleForm={(value) => (value ? openLeadForm() : closeLeadForm())}
      leadName={leadName}
      leadWhatsapp={leadWhatsapp}
      leadCity={leadCity}
      onLeadNameChange={setLeadName}
      onLeadWhatsappChange={setLeadWhatsapp}
      onLeadCityChange={setLeadCity}
      onSubmit={handleLeadSubmit}
      loading={leadLoading}
    />
  );
}
