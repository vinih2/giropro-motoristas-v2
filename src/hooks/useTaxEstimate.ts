// src/hooks/useTaxEstimate.ts
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TaxEstimate = {
  lucro: number;
  estimate: number;
};

export function useTaxEstimate(userId?: string, rate?: number | null) {
  const [data, setData] = useState<TaxEstimate>({ lucro: 0, estimate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const resetState = () => {
      if (!active) return;
      setData({ lucro: 0, estimate: 0 });
      setLoading(false);
    };

    if (!userId) {
      resetState();
      return () => {
        active = false;
      };
    }

    const fetchData = async () => {
      if (!active) return;
      setLoading(true);
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date();
        endOfMonth.setHours(23, 59, 59, 999);

        const { data: giros, error } = await supabase
          .from("registros")
          .select("lucro")
          .eq("user_id", userId)
          .gte("data", startOfMonth.toISOString())
          .lte("data", endOfMonth.toISOString());

        if (error) throw error;
        if (!active) return;

        const totalLucro =
          giros?.reduce((acc, giro) => acc + (giro.lucro || 0), 0) || 0;
        const effectiveRate =
          typeof rate === "number" && rate > 0 ? rate : 0.115; // fallback 11.5%
        const estimate = Number((totalLucro * effectiveRate).toFixed(2));
        setData({ lucro: totalLucro, estimate });
      } catch (error) {
        console.error("Falha ao estimar imposto", error);
        resetState();
        return;
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [userId, rate]);

  return { ...data, loading };
}
