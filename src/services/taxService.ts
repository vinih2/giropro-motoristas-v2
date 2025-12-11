// src/services/taxService.ts

import { supabase } from '@/lib/supabase';

export type TaxReport = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  type: 'DARF' | 'DAS';
  amount: number;
  status: 'pending' | 'paid';
  due_date: string | null;
  pdf_url: string | null;
  metadata?: Record<string, unknown>;
};

const TAX_RATE = 0.115; // 11.5% Carnê-Leão estimado

const calculateDueDate = (periodEnd: string) => {
  const end = new Date(periodEnd);
  const due = new Date(end.getTime());
  due.setMonth(due.getMonth(), 20); // dia 20 do mês corrente
  if (due < end) {
    due.setMonth(due.getMonth() + 1);
  }
  return due.toISOString();
};

export type TaxReportType = 'DARF' | 'DAS';

export async function generateTaxReport(
  userId: string,
  start: string,
  end: string,
  taxRateOverride?: number | null,
  type: TaxReportType = 'DARF'
) {
  const { data: giros, error } = await supabase
    .from('registros')
    .select('lucro')
    .eq('user_id', userId)
    .gte('data', start)
    .lte('data', end);

  if (error) throw error;

  const totalLucro = giros?.reduce((acc, giro) => acc + (giro.lucro || 0), 0) || 0;
  const effectiveRate = typeof taxRateOverride === 'number' && taxRateOverride > 0 ? taxRateOverride : TAX_RATE;
  const amount = Number((totalLucro * effectiveRate).toFixed(2));
  const dueDate = calculateDueDate(end);

  const { data: insertData, error: insertError } = await supabase
    .from('tax_reports')
    .insert({
      user_id: userId,
      period_start: start,
      period_end: end,
      type,
      amount,
      status: 'pending',
      due_date: dueDate,
      metadata: { totalLucro, tax_rate: effectiveRate }
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return insertData as TaxReport;
}

export async function fetchTaxReports(userId: string, start?: string, end?: string) {
  let query = supabase
    .from('tax_reports')
    .select('*')
    .eq('user_id', userId)
    .order('period_start', { ascending: false });

  if (start) query = query.gte('period_start', start);
  if (end) query = query.lte('period_end', end);

  const { data, error } = await query;
  if (error) throw error;
  return (data as TaxReport[]) || [];
}

export async function markTaxReportPaid(reportId: string) {
  const { data, error } = await supabase
    .from('tax_reports')
    .update({ status: 'paid' })
    .eq('id', reportId)
    .select()
    .single();
  if (error) throw error;
  return data as TaxReport;
}
