import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarMoeda } from './calculations';

type JsPDFWithInternal = jsPDF & {
  internal: {
    getNumberOfPages: () => number;
    pageSize: { height: number };
  };
};

interface GiroData {
    data: string;
    plataforma: string;
    ganho_bruto: number;
    lucro: number;
    km: number;
}

export const generateGiroReport = (registros: GiroData[], userName: string = 'Motorista') => {
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFontSize(22);
  doc.setTextColor(249, 115, 22); // Orange
  doc.text('GiroPro - Relatório Financeiro', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);
  doc.text(`Motorista: ${userName}`, 14, 33);

  // Totais
  const totalBruto = registros.reduce((acc, r) => acc + (r.ganho_bruto || 0), 0);
  const totalLucro = registros.reduce((acc, r) => acc + (r.lucro || 0), 0);
  const totalKM = registros.reduce((acc, r) => acc + (r.km || 0), 0);

  doc.setDrawColor(200);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Faturamento Bruto: ${formatarMoeda(totalBruto)}`, 14, 50);
  doc.text(`Lucro Líquido: ${formatarMoeda(totalLucro)}`, 80, 50);
  doc.text(`KM Total: ${totalKM} km`, 150, 50);

  // Tabela
  const tableData = registros.map((registro) => [
    new Date(registro.data).toLocaleDateString('pt-BR'),
    registro.plataforma || 'Geral',
    formatarMoeda(registro.ganho_bruto || 0),
    formatarMoeda(registro.lucro || 0),
    `${registro.km || 0} km`
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Data', 'Plataforma', 'Bruto', 'Líquido', 'KM']],
    body: tableData,
    headStyles: { fillColor: [249, 115, 22] }, // Laranja
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10 },
  });

  // Rodapé
  const docWithInternal = doc as JsPDFWithInternal;
  const pageCount = docWithInternal.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text('GiroPro App - Seu Coach Financeiro', 14, docWithInternal.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, 180, docWithInternal.internal.pageSize.height - 10);
  }

  doc.save(`Relatorio_GiroPro_${new Date().toISOString().slice(0, 10)}.pdf`);
};

interface ServiceData {
  created_at: string;
  tipo_servico: string;
  custo_servico: number | null;
  km_servico: number | null;
  descricao?: string | null;
}

export const generateServiceReport = (servicos: ServiceData[], metadata?: { modelo?: string | null; placa?: string | null }) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.setTextColor(249, 115, 22);
  doc.text('GiroPro - Histórico de Manutenções', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 28);
  if (metadata?.modelo || metadata?.placa) {
    doc.text(`Veículo: ${metadata?.modelo ?? 'n/d'} • Placa: ${metadata?.placa ?? 'n/d'}`, 14, 33);
  }

  const totalCusto = servicos.reduce((acc, s) => acc + (s.custo_servico || 0), 0);
  doc.setDrawColor(220);
  doc.line(14, 40, 196, 40);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Serviços registrados: ${servicos.length}`, 14, 50);
  doc.text(`Custo total estimado: ${formatarMoeda(totalCusto)}`, 80, 50);

  const tableData = servicos.map((s) => [
    new Date(s.created_at).toLocaleDateString('pt-BR'),
    SERVICE_LABELS[s.tipo_servico as keyof typeof SERVICE_LABELS] ?? s.tipo_servico,
    s.km_servico ? `${s.km_servico} km` : '--',
    s.custo_servico ? formatarMoeda(s.custo_servico) : '--',
    s.descricao ? s.descricao.slice(0, 40) : '--',
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['Data', 'Serviço', 'KM', 'Custo', 'Observação']],
    body: tableData,
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 10, cellWidth: 'wrap' },
    columnStyles: { 4: { cellWidth: 60 } },
  });

  const docWithInternal = doc as JsPDFWithInternal;
  const pageCount = docWithInternal.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text('GiroPro App - Diário de bordo inteligente', 14, docWithInternal.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, 180, docWithInternal.internal.pageSize.height - 10);
  }

  doc.save(`GiroGarage_Manutencoes_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const SERVICE_LABELS: Record<string, string> = {
  oleo: 'Troca de óleo',
  pneu: 'Pneus',
  correia: 'Correia dentada',
};
