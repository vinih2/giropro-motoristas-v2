import { supabase } from '@/lib/supabase';
import { StoredSimuladorScenario } from '@/lib/dashboard-bridge';

const TABLE = 'simulador_scenarios';

type SimulatorScenarioRow = {
  id: string;
  user_id: string;
  name: string;
  cidade: string;
  plataforma?: string | null;
  horas: number;
  km: number;
  tarifa_media: number;
  demanda?: string | null;
  hint?: string | null;
  favorite?: boolean | null;
  tag?: string | null;
  saved_at: string | number;
};

const mapRowToStored = (row: SimulatorScenarioRow): StoredSimuladorScenario => ({
  id: row.id,
  name: row.name,
  cidade: row.cidade,
  plataforma: row.plataforma || 'Uber',
  horas: row.horas,
  km: row.km,
  tarifaMedia: row.tarifa_media,
  demanda: row.demanda || 'Média',
  hint: row.hint || undefined,
  favorite: !!row.favorite,
  tag: row.tag || undefined,
  savedAt: typeof row.saved_at === 'number' ? row.saved_at : new Date(row.saved_at).getTime(),
});

const mapStoredToRow = (userId: string, scenario: StoredSimuladorScenario): Omit<SimulatorScenarioRow, 'user_id'> & { user_id: string } => ({
  id: scenario.id,
  user_id: userId,
  name: scenario.name,
  cidade: scenario.cidade,
  plataforma: scenario.plataforma,
  horas: scenario.horas,
  km: scenario.km,
  tarifa_media: scenario.tarifaMedia,
  demanda: scenario.demanda,
  hint: scenario.hint,
  favorite: scenario.favorite ?? false,
  tag: scenario.tag,
  saved_at: scenario.savedAt,
});

export async function fetchSimulatorFavorites(userId: string) {
  if (!userId) return { data: [] as StoredSimuladorScenario[], error: null };
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error || !data) {
    return { data: [] as StoredSimuladorScenario[], error };
  }
  return { data: data.map(mapRowToStored), error: null };
}

export async function replaceSimulatorFavorites(userId: string, scenarios: StoredSimuladorScenario[]) {
  if (!userId) return { error: null };
  await supabase.from(TABLE).delete().eq('user_id', userId);
  if (!scenarios.length) return { error: null };
  const payload = scenarios.map((scenario) => mapStoredToRow(userId, scenario));
  const { error } = await supabase.from(TABLE).insert(payload);
  return { error };
}
