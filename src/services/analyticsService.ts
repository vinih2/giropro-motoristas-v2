import { supabase } from '@/lib/supabase';

type AnalyticsMetadata = Record<string, unknown> | null;

export async function logAnalyticsEvent(userId: string | undefined, event: string, metadata?: AnalyticsMetadata) {
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId ?? null,
      event,
      metadata: metadata ?? null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Falha ao registrar evento de analytics', error);
  }
}
