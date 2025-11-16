import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarMoeda } from './calculations';

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
  const tableData = registros.map(r => [
    new Date(r.data).toLocaleDateString('pt-BR'),
    r.plataforma || 'Geral',
    formatarMoeda(r.ganho_bruto || 0),
    formatarMoeda(r.lucro || 0),
    `${r.km || 0} km`
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
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text('GiroPro App - Seu Coach Financeiro', 14, doc.internal.pageSize.height - 10);
    doc.text(`Página ${i} de ${pageCount}`, 180, doc.internal.pageSize.height - 10);
  }

  doc.save(`Relatorio_GiroPro_${new Date().toISOString().slice(0, 10)}.pdf`);
};