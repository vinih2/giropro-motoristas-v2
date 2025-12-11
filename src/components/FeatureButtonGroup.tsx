// src/components/FeatureButtonGroup.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FeatureButtonGroupProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: any) => void;
  colorClass: string; // Ex: 'bg-orange-100 text-orange-700'
}

export default function FeatureButtonGroup({
  label,
  options,
  selected,
  onSelect,
  colorClass,
}: FeatureButtonGroupProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {options.map((p) => (
          <button 
            key={p} 
            onClick={() => onSelect(p)} 
            className={cn(
              'p-3 rounded-xl text-sm font-bold transition-all',
              selected === p 
                ? `${colorClass} shadow-inner dark:bg-opacity-40` 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}