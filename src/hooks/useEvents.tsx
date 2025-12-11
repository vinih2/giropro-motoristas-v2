"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { sendEvent } from '@/lib/eventsClient';

export function useEvents() {
  const supabase = createClientComponentClient();

  async function track(event: string, metadata: unknown = null) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? undefined;
      return await sendEvent(event, metadata, token);
    } catch (err) {
      // fallback: try without token
      return await sendEvent(event, metadata);
    }
  }

  return { track };
}
