"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type FeatureKey =
  | "missions_ai"
  | "pdf_export"
  | "tax_reports"
  | "timeline_pro"
  | "weather_pro";

export type FeatureConfig = {
  key: FeatureKey;
  enabled: boolean;
  free_limit?: number | null;
  pro_limit?: number | null;
  description?: string | null;
};

const DEFAULT_FLAGS: Record<FeatureKey, FeatureConfig> = {
  missions_ai: { key: "missions_ai", enabled: true, free_limit: 3, pro_limit: null },
  pdf_export: { key: "pdf_export", enabled: true, free_limit: 0, pro_limit: 1 },
  tax_reports: { key: "tax_reports", enabled: true, free_limit: 0, pro_limit: 1 },
  timeline_pro: { key: "timeline_pro", enabled: true },
  weather_pro: { key: "weather_pro", enabled: true },
};

const FeatureFlagsContext = createContext<Record<FeatureKey, FeatureConfig>>(DEFAULT_FLAGS);
type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  free_limit?: number | null;
  pro_limit?: number | null;
  description?: string | null;
};

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState(DEFAULT_FLAGS);

  useEffect(() => {
    supabase
      .from('feature_flags')
      .select('*')
      .then(({ data, error }) => {
        if (error || !data) return;
        const merged = { ...DEFAULT_FLAGS };
        (data as FeatureFlagRow[]).forEach((flag) => {
          const flagKey = flag.key as FeatureKey;
          if (merged[flagKey]) {
            merged[flagKey] = {
              key: flagKey,
              enabled: flag.enabled,
              free_limit: flag.free_limit,
              pro_limit: flag.pro_limit,
              description: flag.description,
            };
          }
        });
        setFlags(merged);
      });
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function hasFeature(
  flags: Record<FeatureKey, FeatureConfig>,
  key: FeatureKey,
  isPro: boolean,
  usageCount?: number
) {
  const config = flags[key];
  if (!config?.enabled) return false;
  if (isPro) return true;

  if (typeof config.free_limit === 'number' && typeof usageCount === 'number') {
    return usageCount < config.free_limit;
  }
  if (typeof config.free_limit === 'number' && config.free_limit <= 0) return false;
  return true;
}
