"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Period = "today" | "week" | "month";

type PeriodContextValue = {
  period: Period;
  setPeriod: (p: Period) => void;
  range: { start: string; end: string };
};

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

const computeRange = (period: Period) => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    start.setDate(start.getDate() - 6);
  } else if (period === "month") {
    start.setDate(1);
  }

  return { start: start.toISOString(), end: end.toISOString() };
};

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriodState] = useState<Period>(() => {
    if (typeof window === "undefined") return "today";
    const stored = localStorage.getItem("giro-period") as Period | null;
    return stored || "today";
  });

  const setPeriod = (value: Period) => {
    setPeriodState(value);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("giro-period", period);
    }
  }, [period]);

  const range = useMemo(() => computeRange(period), [period]);

  return (
    <PeriodContext.Provider value={{ period, setPeriod, range }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod must be used within PeriodProvider");
  return ctx;
}
