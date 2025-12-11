// src/services/giroService.ts

import { supabase } from "@/lib/supabase";
import { Registro } from "./authService"; 
import { calculateGiroPro, GiroInput } from "@/lib/calculations"; 

const STREAK_KEY = 'giropro_streak';
const FREE_HISTORY_LIMIT = 7;

interface LocalStreak {
    current_streak: number;
    last_login: string;
}

export interface CombustivelPreco {
    posto_nome: string;
    latitude: number;
    longitude: number;
    preco: number;
    tipo_combustivel: 'gasolina' | 'etanol' | 'diesel';
    user_id: string;
}

export type GiroRecord = GiroInput & {
    id: string;
    created_at: string;
    user_id: string;
    lucro_bruto: number;
    custo_total: number;
    lucro_liquido: number;
    lucro_por_km: number;
    ganho_bruto?: number;
    km?: number;
    lucro?: number;
    horas?: number;
    custo_km?: number;
    plataforma?: string;
    cidade?: string;
};

export interface UserProfile {
    user_id: string;
    meta_diaria: number;
    custo_km: number;
    cidade_padrao: string;
    is_pro: boolean;
    customer_id?: string | null;
    subscription_id?: string | null;
    subscription_status?: string | null;
    custo_variavel_km?: number | null;
    min_lucro_km?: number | null;
    km_meta_diaria?: number | null;
    depreciacao_por_km?: number | null;
    full_name?: string | null;
    cpf?: string | null;
    tax_rate?: number | null;
    vehicle_model?: string | null;
    vehicle_year?: string | null;
    vehicle_plate?: string | null;
    vehicle_fuel?: string | null;
    cnh?: string | null;
    crlv?: string | null;
    meta_mensal?: number | null;
    phone?: string | null;
    language?: string | null;
    theme_preference?: string | null;
    notify_email?: boolean | null;
    notify_push?: boolean | null;
    onboarding_steps?: string[] | null;
}

export type ProPlusLead = {
    id: string;
    name: string;
    whatsapp: string;
    cidade?: string | null;
    source?: string | null;
    metadata?: Record<string, string> | null;
    created_at: string;
};

interface VehicleData {
  id?: string;
  user_id?: string;
  km_atual?: number;
  km_oleo?: number;
  km_pneu?: number;
  km_correia?: number;
  modelo?: string | null;
  placa?: string | null;
  cor?: string | null;
  ano?: number | null;
  foto_url?: string | null;
  valor_ipva?: number | null;
  valor_seguro?: number | null;
  valor_financiamento?: number | null;
  intervalo_oleo?: number | null;
  intervalo_pneu?: number | null;
  intervalo_correia?: number | null;
}


const GiroService = {
    // --- STREAK (LOCAL) ---
    getStreak: (): number => {
        if (typeof window === 'undefined') return 0;
        try {
            const stored = localStorage.getItem(STREAK_KEY);
            if (!stored) return 0;
            const streak: LocalStreak = JSON.parse(stored);
            return streak.current_streak;
        } catch (error) {
            console.error('Erro ao ler streak local', error);
            return 0;
        }
    },
    updateStreak: (registroData: string) => {
        if (typeof window === 'undefined') return { streak: 0, new: false };
        const today = new Date(registroData).toISOString().split('T')[0];
        let currentStreak: LocalStreak = { current_streak: 0, last_login: '' };
        try {
            const stored = localStorage.getItem(STREAK_KEY);
            if (stored) currentStreak = JSON.parse(stored);
        } catch (error) {
            console.error('Erro ao ler streak local', error);
        }
        const lastLoginDate = currentStreak.last_login;
        let newStreakCount = currentStreak.current_streak;
        let isNewUpdate = false;
        if (lastLoginDate === today) return { streak: newStreakCount, new: false };
        const yesterdayDateObj = new Date(registroData);
        yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
        const yesterday = yesterdayDateObj.toISOString().split('T')[0];
        if (lastLoginDate === yesterday) { newStreakCount += 1; isNewUpdate = true; } 
        else if (lastLoginDate !== '') { newStreakCount = 1; isNewUpdate = true; }
        else { newStreakCount = 1; isNewUpdate = true; }
        if (isNewUpdate) {
            const newStreakData = { current_streak: newStreakCount, last_login: today };
            localStorage.setItem(STREAK_KEY, JSON.stringify(newStreakData));
            return { streak: newStreakCount, new: true };
        }
        return { streak: newStreakCount, new: false };
    },
    
    // --- PERFIL DE USUÁRIO (NUVEM) ---
    async fetchUserProfile(userId: string) {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        return { data: data as UserProfile | null, error };
    },
    async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
        const { error } = await supabase
            .from('user_profiles')
            .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' });
        return { error };
    },

    async createProPlusLead(payload: { name: string; whatsapp: string; cidade?: string | null; source?: string; metadata?: Record<string, string> }) {
        const { data, error } = await supabase
            .from('pro_plus_leads')
            .insert({
                name: payload.name,
                whatsapp: payload.whatsapp,
                cidade: payload.cidade ?? null,
                source: payload.source ?? null,
                metadata: payload.metadata ?? null,
            })
            .select()
            .single();
        return { data, error };
    },

    // --- (CORRIGIDO) RESUMO DO DIA ---
    async fetchTodaySummary(userId: string) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

        const { data, error } = await supabase
            .from('registros')
            .select('lucro, horas, km')
            .eq('user_id', userId)
            .gte('data', startOfDay) 
            .lte('data', endOfDay);  

        if (error) return { data: null, error };

        const summary = data.reduce(
            (acc, giro) => {
                acc.totalLucro += giro.lucro || 0;
                acc.totalHoras += giro.horas || 0;
                acc.totalKm += giro.km || 0;
                return acc;
            },
            { totalLucro: 0, totalHoras: 0, totalKm: 0 }
        );
        
        return { data: summary, error: null };
    },

    // --- CRUD HISTÓRICO ---
    insertRegistro: (registro: Omit<Registro, 'id' | 'created_at'>) => {
        return supabase.from('registros').insert(registro);
    },
    async saveGiro(data: GiroInput & { user_id: string }) {
        const calculatedResult = calculateGiroPro(data);
        const dataToInsert = {
            user_id: data.user_id, data: new Date().toISOString(),
            ganho_bruto: data.ganhos_brutos, lucro: calculatedResult.lucro_liquido,
            km: data.km_rodados, custo_km: calculatedResult.custo_total / (data.km_rodados || 1),
            km_por_litro: data.consumo_medio, valor_combustivel: data.valor_combustivel,
            tipo_combustivel: data.tipo_combustivel, cidade: data.cidade || 'Simulação',
            plataforma: 'Simulador', horas: 0
        };
        const { data: insertedData, error } = await supabase.from('registros').insert(dataToInsert).select();
        if (!error) {
            await this.updateOdometer(data.user_id, data.km_rodados);
        }
        return { success: !error, data: insertedData, error };
    },
    async fetchGiroHistory(userId: string, isPro: boolean = false) {
        let query = supabase
            .from('registros')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        query = isPro ? query : query.limit(FREE_HISTORY_LIMIT);
        const { data, error, count } = await query;

        return { data: data ?? [], error, totalCount: count ?? 0 };
    },
    async deleteGiro(giroId: string) {
        const { error } = await supabase.from('registros').delete().eq('id', giroId);
        return { success: !error, error };
    },
    async updateGiro(giroId: string, updates: Partial<GiroRecord>) {
        const { data, error } = await supabase.from('registros').update(updates).eq('id', giroId).select();
        return { success: !error, data: data?.[0] ?? null, error };
    },
    async fetchRecentPerformance(userId: string, days: number = 7) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        const { data, error } = await supabase
            .from('registros')
            .select('lucro, horas, data')
            .eq('user_id', userId)
            .gte('data', fromDate.toISOString())
            .order('data', { ascending: false });

        if (error) return { data: null, error };

        const dayMap = new Map<string, { lucro: number; horas: number }>();
        data?.forEach((reg) => {
            const day = new Date(reg.data).toISOString().split('T')[0];
            const entry = dayMap.get(day) || { lucro: 0, horas: 0 };
            entry.lucro += reg.lucro || 0;
            entry.horas += reg.horas || 0;
            dayMap.set(day, entry);
        });

        const dias = Array.from(dayMap.values());
        const avgLucro = dias.length ? dias.reduce((sum, d) => sum + d.lucro, 0) / dias.length : 0;
        const avgHoras = dias.length ? dias.reduce((sum, d) => sum + d.horas, 0) / dias.length : 0;
        return { data: { avgLucro, avgHoras, dias: dias.length }, error: null };
    },

    // --- GARAGEM ---
    async updateOdometer(userId: string, kmRodadosHoje: number) {
        try {
            const { data } = await supabase.from('veiculos').select('km_atual').eq('user_id', userId).limit(1);
            const veiculo = Array.isArray(data) ? data[0] : data;
            if (veiculo) {
                const novoKm = (veiculo.km_atual || 0) + kmRodadosHoje;
                await supabase.from('veiculos').update({ km_atual: novoKm }).eq('user_id', userId);
            }
        } catch (error) {
            console.error("Erro ao atualizar hodômetro (ignorado):", error);
        }
    },

    // --- FUEL MAP ---
    insertPrecoCombustivel: (data: CombustivelPreco) => {
        return supabase.from('combustiveis').insert(data);
    },
    fetchPrecosProximos: () => {
        return supabase.from('combustiveis').select('*').order('data_reporte', { ascending: false }).limit(100);
    },

    async fetchVehicle(userId: string) {
        const { data, error } = await supabase.from('veiculos').select('*').eq('user_id', userId).limit(1);
        const record = Array.isArray(data) ? data[0] : data;
        return { data: record || null, error };
    },
    async upsertVehicle(userId: string, payload: Partial<VehicleData>) {
        const { data, error } = await supabase
            .from('veiculos')
            .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' })
            .select();
        const record = Array.isArray(data) ? data[0] : data;
        return { data: record || null, error };
    },
    async getProfileStatus(userId: string) {
        const [profileResult, vehicleResult] = await Promise.all([
            this.fetchUserProfile(userId),
            this.fetchVehicle(userId).catch(() => ({ data: null, error: null }))
        ]);

        const profile = profileResult.data;
        const vehicle = vehicleResult?.data ?? null;

        const hasMeta = typeof profile?.meta_diaria === 'number' && profile.meta_diaria > 0;
        const hasCity = Boolean(profile?.cidade_padrao);
        const hasVehicle = Boolean(vehicle || profile?.vehicle_model || profile?.vehicle_plate);
        const hasName = Boolean(profile?.full_name && profile.full_name.trim().length > 1);

        const needsOnboarding = !hasMeta || !hasCity;
        const needsProfileDetails = !needsOnboarding && !hasName;
        const complete = !needsOnboarding && !needsProfileDetails;

        return {
            profile,
            vehicle,
            hasMeta,
            hasCity,
            hasVehicle,
            hasName,
            needsOnboarding,
            needsProfileDetails,
            complete
        };
    },

    async fetchRecentExpenses(userId: string, startDate?: string) {
        let query = supabase
            .from('despesas_pessoais')
            .select('*')
            .eq('user_id', userId)
            .order('data_despesa', { ascending: false })
            .limit(5);

        if (startDate) query = query.gte('data_despesa', startDate);

        const { data, error } = await query;
        return { data, error };
    }
};

export default GiroService;
