// src/lib/dashboard-bridge.ts

export const REGISTRO_PREFILL_KEY = 'registro_prefill';
export const SIMULADOR_PREFILL_KEY = 'simulador_prefill';
export const SIMULADOR_SCENARIOS_SYNC_EVENT = 'simulador:scenarios-sync';
const SIMULADOR_SCENARIOS_KEY = 'simulador_scenarios';
const MAX_STORED_SCENARIOS = 5;

export type RegistroPrefillPayload = {
  plataforma?: string;
  cidade?: string;
  hint?: string;
  origem?: 'insight' | 'combustivel' | 'manual';
  metaSugerida?: number;
};

export type SimuladorPrefillPayload = {
  name: string;
  cidade: string;
  plataforma?: string;
  horas: number;
  km: number;
  tarifaMedia: number;
  demanda?: string;
  hint?: string;
};

export type StoredSimuladorScenario = SimuladorPrefillPayload & {
  id: string;
  savedAt: number;
  favorite?: boolean;
  tag?: string;
};

const getScenarioStorageKey = (userId: string) => `${SIMULADOR_SCENARIOS_KEY}_${userId}`;

export function queueRegistroPrefill(payload: RegistroPrefillPayload) {
  if (typeof window === 'undefined') return;
  const data = { ...payload, timestamp: Date.now() };
  localStorage.setItem(REGISTRO_PREFILL_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('registro:prefill', { detail: data }));
}

export function readRegistroPrefill(): (RegistroPrefillPayload & { timestamp: number }) | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REGISTRO_PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRegistroPrefill() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REGISTRO_PREFILL_KEY);
}

export function queueSimuladorPrefill(payload: SimuladorPrefillPayload) {
  if (typeof window === 'undefined') return;
  const data = { ...payload, timestamp: Date.now() };
  localStorage.setItem(SIMULADOR_PREFILL_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('simulador:prefill', { detail: data }));
}

export function readSimuladorPrefill() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SIMULADOR_PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSimuladorPrefill() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SIMULADOR_PREFILL_KEY);
}

export function readStoredSimuladorScenarios(userId: string): StoredSimuladorScenario[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
      const raw = localStorage.getItem(getScenarioStorageKey(userId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
  } catch {
      return [];
  }
}

export function persistStoredSimuladorScenarios(userId: string, scenarios: StoredSimuladorScenario[]) {
  if (typeof window === 'undefined' || !userId) return;
  const sanitized = scenarios
      .filter((scenario) => scenario && scenario.id)
      .sort((a, b) => b.savedAt - a.savedAt)
      .slice(0, MAX_STORED_SCENARIOS);
  localStorage.setItem(getScenarioStorageKey(userId), JSON.stringify(sanitized));
  try {
      window.dispatchEvent(new CustomEvent(SIMULADOR_SCENARIOS_SYNC_EVENT, { detail: sanitized }));
  } catch {
      // ignore dispatch issues (e.g., SSR)
  }
}
