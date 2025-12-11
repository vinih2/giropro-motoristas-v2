'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type LeadFormContextValue = {
  showLeadForm: boolean;
  openLeadForm: () => void;
  closeLeadForm: () => void;
  setLeadFormVisible: (value: boolean) => void;
  triggerLeadForm: () => void;
};

const LandingLeadFormContext = createContext<LeadFormContextValue | undefined>(undefined);

export function LandingLeadFormProvider({ children }: { children: React.ReactNode }) {
  const [showLeadForm, setShowLeadForm] = useState(false);

  const openLeadForm = useCallback(() => setShowLeadForm(true), []);
  const closeLeadForm = useCallback(() => setShowLeadForm(false), []);
  const setLeadFormVisible = useCallback((value: boolean) => setShowLeadForm(value), []);

  const triggerLeadForm = useCallback(() => {
    setShowLeadForm(true);
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        const section = document.getElementById('giroproplus');
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  return (
    <LandingLeadFormContext.Provider
      value={{ showLeadForm, openLeadForm, closeLeadForm, setLeadFormVisible, triggerLeadForm }}
    >
      {children}
    </LandingLeadFormContext.Provider>
  );
}

export function useLandingLeadForm() {
  const context = useContext(LandingLeadFormContext);
  if (!context) {
    throw new Error('useLandingLeadForm must be used within LandingLeadFormProvider');
  }
  return context;
}
