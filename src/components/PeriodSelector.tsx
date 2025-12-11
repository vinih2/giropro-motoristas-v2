"use client";

import { usePathname } from "next/navigation";
import { usePeriod } from "@/context/PeriodContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const ALLOWED_PATHS = ["/financeiro", "/desempenho", "/historico"];

const OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "7 dias" },
  { value: "month", label: "Mês" },
] as const;

export default function PeriodSelector() {
  const pathname = usePathname();
  const { period, setPeriod } = usePeriod();
  const { user, loading } = useAuth();

  if (loading || !user) return null;
  if (!ALLOWED_PATHS.includes(pathname ?? "")) return null;

  return (
    <div className="container mx-auto px-4 mt-4 mb-6">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex p-1 gap-1">
        {OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setPeriod(option.value)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-bold transition-all",
              period === option.value
                ? "bg-orange-500 text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
