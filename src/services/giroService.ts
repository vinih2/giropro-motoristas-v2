// src/services/giroService.ts

import { supabase } from "@/lib/supabase";
import { Registro } from "./authService"; 
import { calculateGiroPro, GiroInput } from "@/lib/calculations"; 

const STREAK_KEY = 'giropro_streak';

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
        } catch (e) { return 0; }
    },
    updateStreak: (registroData: string) => {
        if (typeof window === 'undefined') return { streak: 0, new: false };
        const today = new Date(registroData).toISOString().split('T')[0];
        let currentStreak: LocalStreak = { current_streak: 0, last_login: '' };
        try {
            const stored = localStorage.getItem(STREAK_KEY);
            if (stored) currentStreak = JSON.parse(stored);
        } catch {}
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
        // @ts-ignore
        if (!error && this.updateOdometer) await this.updateOdometer(data.user_id, data.km_rodados);
        return { success: !error, data: insertedData, error };
    },
    async fetchGiroHistory(userId: string, isPro: boolean = false) {
        let query = supabase
            .from('registros')
            .select('*', { count: 'exact' }) 
            .eq('user_id', userId)
            .order('data', { ascending: false });
        
        let totalCount = 0;

        if (!isPro) {
            query = query.limit(7); 
        }
        
        const { data, error, count } = await query;
        
        if (count) {
            totalCount = count;
        }

        return { data: data as any, error, totalCount };
    },
    async deleteGiro(giroId: string) {
        const { error } = await supabase.from('registros').delete().eq('id', giroId);
        return { success: !error, error };
    },
    async updateGiro(giroId: string, updates: Partial<any>) {
        const { data, error } = await supabase.from('registros').update(updates).eq('id', giroId).select();
        return { success: !error, data: data?.[0] as any, error };
    },

    // --- GARAGEM ---
    // @ts-ignore
    async updateOdometer(userId: string, kmRodadosHoje: number) {
        try {
            const { data: veiculo } = await supabase.from('veiculos').select('km_atual').eq('user_id', userId).single();
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
};

export default GiroService;