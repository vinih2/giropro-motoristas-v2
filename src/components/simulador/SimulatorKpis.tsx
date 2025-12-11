'use client';

import { memo } from 'react';

type KpiItem = {
  label: string;
  value: string;
  hint?: string;
};

function SimulatorKpisComponent({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm"
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold">{item.label}</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{item.value}</p>
          {item.hint && <p className="text-xs text-gray-500">{item.hint}</p>}
        </div>
      ))}
    </div>
  );
}

export const SimulatorKpis = memo(SimulatorKpisComponent);
