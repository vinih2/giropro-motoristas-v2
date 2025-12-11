import jsPDF from 'jspdf';
import { formatarMoeda } from '@/lib/calculations';
import { TaxReport } from '@/services/taxService';

interface ProfileInfo {
  full_name?: string | null;
  cpf?: string | null;
}

export function generateDarfPdf(report: TaxReport, profile?: ProfileInfo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const name = profile?.full_name || 'Motorista GiroPro';
  const cpf = profile?.cpf || '000.000.000-00';
  const period = `${new Date(report.period_start).toLocaleDateString('pt-BR')} a ${new Date(report.period_end).toLocaleDateString('pt-BR')}`;
  const dueDate = report.due_date ? new Date(report.due_date).toLocaleDateString('pt-BR') : '---';
  const isDarf = report.type !== 'DAS';
  const codigoReceita = isDarf ? '0190' : 'PGMEI/DAS';
  const reference = `${new Date(report.period_end).getMonth() + 1}/${new Date(report.period_end).getFullYear()}`;
  const totalLucro = typeof report.metadata?.totalLucro === 'number' ? report.metadata.totalLucro : undefined;
  const taxaAplicada = typeof report.metadata?.tax_rate === 'number' ? report.metadata.tax_rate : undefined;

  // Header premium
  doc.setFillColor(249, 115, 22);
  doc.rect(15, 15, 180, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('GiroPro • Guia Fiscal Assistida', 25, 28);
  doc.setFontSize(9);
  doc.text('Resumo auxiliar para emissão do DARF oficial (Receita 0190)', 25, 34);

  // Sub header
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`${isDarf ? 'DARF' : 'DAS'} - Documento de Arrecadação`, 15, 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(247, 247, 247);
  doc.rect(15, 55, 180, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTIFICAÇÃO DO CONTRIBUINTE', 20, 62);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${name}`, 20, 70);
  doc.text(`CPF: ${cpf}`, 120, 70);
  doc.text(`Período apurado: ${period}`, 20, 78);

  // Dados da guia
  const infoStartY = 90;
  const rowHeight = 14;
  const infoRows = [
    { label: isDarf ? 'Código da Receita' : 'Tipo de Guia', value: codigoReceita },
    { label: 'Nº Referência', value: reference },
    { label: 'Data de Vencimento', value: dueDate },
    { label: 'Valor do Principal', value: formatarMoeda(report.amount) },
  ];

  infoRows.forEach((row, index) => {
    const y = infoStartY + index * rowHeight;
    doc.setFillColor(index % 2 === 0 ? 255 : 245, 245, 245);
    doc.rect(15, y, 180, rowHeight - 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(row.label, 20, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(row.value, 120, y + 6);
  });

  // Resumo de cálculo
  const summaryStartY = infoStartY + infoRows.length * rowHeight + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Resumo do cálculo', 15, summaryStartY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(255, 255, 255);
  doc.rect(15, summaryStartY + 4, 180, 18, 'F');
  doc.text(`Lucro apurado: ${totalLucro !== undefined ? formatarMoeda(totalLucro) : '---'}`, 20, summaryStartY + 14);
  doc.text(`Taxa aplicada: ${taxaAplicada !== undefined ? `${(taxaAplicada * 100).toFixed(2)}%` : '---'}`, 120, summaryStartY + 14);

  // Total destacado
  doc.setFillColor(15, 23, 42);
  doc.rect(15, summaryStartY + 26, 180, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('Valor total da guia', 25, summaryStartY + 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(formatarMoeda(report.amount), 150, summaryStartY + 40, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  const disclaimerStart = summaryStartY + 56;
  doc.text('Observação: guia auxiliar gerada pelo GiroPro com base no seu histórico.', 15, disclaimerStart);
  doc.text('Faça a emissão/pagamento oficial do DARF/DAS nos sistemas da Receita Federal (Carnê-Leão, PGMEI ou e-CAC).', 15, disclaimerStart + 6);
  doc.text('Mantenha comprovantes e consulte seu contador em caso de dúvida.', 15, disclaimerStart + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura do contribuinte ____________________________________________', 15, disclaimerStart + 24);

  doc.save(`DARF_${reference.replace('/', '-')}.pdf`);
}
