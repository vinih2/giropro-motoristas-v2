// src/components/MetricCard.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { formatarMoeda } from '@/lib/calculations'; 

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string; // Ex: 'km', 'h'
  isCurrency?: boolean;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  icon: React.ReactNode;
  className?: string;
}

const colorMap = {
  green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
};

/**
 * Componente reutilizável para exibir uma métrica chave (KPI).
 */
export default function MetricCard({
  title,
  value,
  unit,
  isCurrency = true,
  color,
  icon,
  className,
}: MetricCardProps) {
  
  const formattedValue = isCurrency 
    ? formatarMoeda(value) 
    : `${value % 1 === 0 ? value : value.toFixed(1)}${unit || ''}`;
    
  const valueClass = cn(
    'mt-1 font-bold',
    isCurrency && color === 'green' && 'text-green-800 dark:text-green-300',
    isCurrency && color === 'blue' && 'text-blue-800 dark:text-blue-300',
    !isCurrency && 'text-gray-900 dark:text-white',
    'text-2xl'
  );

  return (
    <div className={cn('p-4 rounded-xl border flex flex-col justify-between', colorMap[color], className)}>
        <div className="flex items-center justify-between">
            <span className={cn('text-sm font-medium', colorMap[color])}>{title}</span>
            <div className={cn('size-6', colorMap[color], 'text-2xl')}>
                {icon}
            </div>
        </div>
        <p className={valueClass}>
            {formattedValue}
        </p>
    </div>
  );
}