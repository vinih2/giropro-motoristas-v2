import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  queueRegistroPrefill,
  readRegistroPrefill,
  clearRegistroPrefill,
  queueSimuladorPrefill,
  readSimuladorPrefill,
  clearSimuladorPrefill,
  readStoredSimuladorScenarios,
  persistStoredSimuladorScenarios,
  SIMULADOR_SCENARIOS_SYNC_EVENT,
  StoredSimuladorScenario,
} from './dashboard-bridge';

const STORAGE_KEY = (userId: string) => `simulador_scenarios_${userId}`;

describe('dashboard-bridge storage helpers', () => {
  const userId = 'user-123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('queue and read registro prefill with events', () => {
    const listener = vi.fn();
    window.addEventListener('registro:prefill', listener as EventListener);
    const payload = { cidade: 'São Paulo', plataforma: 'Uber', hint: 'Teste' };
    queueRegistroPrefill(payload);

    const raw = localStorage.getItem('registro_prefill');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toMatchObject(payload);
    expect(parsed.timestamp).toBeDefined();

    expect(readRegistroPrefill()).toMatchObject(parsed);

    clearRegistroPrefill();
    expect(localStorage.getItem('registro_prefill')).toBeNull();

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toMatchObject(parsed);
    window.removeEventListener('registro:prefill', listener as EventListener);
  });

  it('queue and read simulador prefill with events', () => {
    const listener = vi.fn();
    window.addEventListener('simulador:prefill', listener as EventListener);

    const payload = {
      name: 'Plano Teste',
      cidade: 'Campinas',
      plataforma: '99',
      horas: 4,
      km: 80,
      tarifaMedia: 30,
    };
    queueSimuladorPrefill(payload);

    const stored = JSON.parse(localStorage.getItem('simulador_prefill')!);
    expect(stored).toMatchObject(payload);
    expect(readSimuladorPrefill()).toMatchObject(stored);

    clearSimuladorPrefill();
    expect(localStorage.getItem('simulador_prefill')).toBeNull();

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toMatchObject(stored);
    window.removeEventListener('simulador:prefill', listener as EventListener);
  });

  it('sanitizes, sorts, trims and dispatches event when persisting scenarios', () => {
    const listener = vi.fn<(event: Event) => void>();
    window.addEventListener(SIMULADOR_SCENARIOS_SYNC_EVENT, listener);

    const payload: StoredSimuladorScenario[] = Array.from({ length: 7 }).map((_, index) => ({
      id: `scenario-${index}`,
      name: `Plano ${index}`,
      cidade: 'São Paulo',
      plataforma: 'Uber',
      horas: 4 + index,
      km: 50 + index,
      tarifaMedia: 25 + index,
      demanda: 'Média',
      savedAt: Date.now() - index * 1000,
      favorite: index % 2 === 0,
    }));

    // inject item without id to prove it is ignored
    const dirtyPayload = [...payload, { ...payload[0], id: '' }];

    persistStoredSimuladorScenarios(userId, dirtyPayload);

    const raw = localStorage.getItem(STORAGE_KEY(userId));
    expect(raw).toBeTruthy();
    const stored: StoredSimuladorScenario[] = JSON.parse(raw!);
    expect(stored).toHaveLength(5); // limitado por MAX_STORED_SCENARIOS
    expect(stored[0].savedAt).toBeGreaterThanOrEqual(stored[stored.length - 1].savedAt);

    expect(listener).toHaveBeenCalledTimes(1);
    const eventDetail = (listener.mock.calls[0][0] as CustomEvent).detail;
    expect(eventDetail).toEqual(stored);

    window.removeEventListener(SIMULADOR_SCENARIOS_SYNC_EVENT, listener);
  });

  it('returns parsed scenarios when available', () => {
    const scenarios: StoredSimuladorScenario[] = [
      {
        id: 'abc',
        name: 'Plano manhã',
        cidade: 'Campinas',
        plataforma: '99',
        horas: 5,
        km: 80,
        tarifaMedia: 30,
        savedAt: Date.now(),
      },
    ];
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(scenarios));

    const result = readStoredSimuladorScenarios(userId);
    expect(result).toEqual(scenarios);
  });

  it('is resilient to malformed data or missing user id', () => {
    expect(readStoredSimuladorScenarios('')).toEqual([]);
    localStorage.setItem(STORAGE_KEY(userId), 'not-json');
    expect(readStoredSimuladorScenarios(userId)).toEqual([]);
  });
});
