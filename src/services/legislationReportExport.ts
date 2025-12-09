import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Legislation, fetchLegislations, fetchLegislationStats } from './legislations';
import { supabase } from '@/integrations/supabase/client';

export interface LegislationReportConfig {
  reportType: 'global' | 'unit' | 'theme';
  format: 'pdf' | 'excel' | 'both';
  branchId?: string;
  themeId?: string;
  sections: {
    summary: boolean;
    byApplicability: boolean;
    byStatus: boolean;
    byJurisdiction: boolean;
    alerts: boolean;
    detailedList: boolean;
  };
  includeCharts: boolean;
}

export const LEGISLATION_REPORT_TEMPLATES = {
  global: {
    title: 'Relatório Global de Legislações',
    description: 'Visão completa de todas as legislações da empresa',
    sections: ['Resumo Executivo', 'Por Aplicabilidade', 'Por Status', 'Por Jurisdição', 'Alertas', 'Lista Detalhada'],
  },
  unit: {
    title: 'Relatório por Unidade',
    description: 'Conformidade legal por unidade/filial',
    sections: ['Legislações Aplicáveis', 'Status de Conformidade', 'Pendências', 'Planos de Ação'],
  },
  theme: {
    title: 'Relatório por Tema',
    description: 'Análise de legislações por macrotema',
    sections: ['Distribuição por Tema', 'Conformidade por Tema', 'Detalhamento'],
  },
};

const APPLICABILITY_LABELS: Record<string, string> = {
  real: 'Aplicabilidade Real',
  potential: 'Potencial',
  revoked: 'Revogada',
  na: 'Não Aplicável',
  pending: 'Pendente de Avaliação',
};

const STATUS_LABELS: Record<string, string> = {
  conforme: 'Conforme',
  para_conhecimento: 'Para Conhecimento',
  adequacao: 'Em Adequação',
  plano_acao: 'Plano de Ação',
  pending: 'Pendente',
};

const JURISDICTION_LABELS: Record<string, string> = {
  federal: 'Federal',
  estadual: 'Estadual',
  municipal: 'Municipal',
  nbr: 'NBR',
  internacional: 'Internacional',
};

// PDF Export
export const exportLegislationReportToPDF = async (
  companyId: string,
  companyName: string,
  config: LegislationReportConfig
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Fetch data
  const legislations = await fetchLegislations(companyId, {
    themeId: config.themeId,
  });
  const stats = await fetchLegislationStats(companyId);
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(LEGISLATION_REPORT_TEMPLATES[config.reportType].title, pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, pageWidth / 2, 35, { align: 'center' });
  
  const reportDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${reportDate}`, pageWidth / 2, 42, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  let yPos = 55;
  
  // Summary Section
  if (config.sections.summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Total de legislações', stats.total.toString()],
      ['Com aplicabilidade real', `${stats.byApplicability.real} (${stats.total > 0 ? Math.round((stats.byApplicability.real / stats.total) * 100) : 0}%)`],
      ['Em conformidade', `${stats.byStatus.conforme} (${stats.byApplicability.real > 0 ? Math.round((stats.byStatus.conforme / stats.byApplicability.real) * 100) : 0}% das reais)`],
      ['Em adequação', stats.byStatus.adequacao.toString()],
      ['Com plano de ação', stats.byStatus.plano_acao.toString()],
      ['Alertas ativos', stats.alerts.toString()],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Valor']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 60, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // By Applicability Section
  if (config.sections.byApplicability) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUIÇÃO POR APLICABILIDADE', 14, yPos);
    yPos += 10;
    
    const applicabilityData = Object.entries(stats.byApplicability).map(([key, value]) => [
      APPLICABILITY_LABELS[key] || key,
      value.toString(),
      stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Aplicabilidade', 'Quantidade', 'Percentual']],
      body: applicabilityData,
      theme: 'striped',
      headStyles: { fillColor: [236, 72, 153] },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // By Status Section
  if (config.sections.byStatus) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUIÇÃO POR STATUS', 14, yPos);
    yPos += 10;
    
    const statusData = Object.entries(stats.byStatus).map(([key, value]) => [
      STATUS_LABELS[key] || key,
      value.toString(),
      stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Quantidade', 'Percentual']],
      body: statusData,
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // By Jurisdiction Section
  if (config.sections.byJurisdiction) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUIÇÃO POR JURISDIÇÃO', 14, yPos);
    yPos += 10;
    
    const jurisdictionData = Object.entries(stats.byJurisdiction).map(([key, value]) => [
      JURISDICTION_LABELS[key] || key,
      value.toString(),
      stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%',
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Jurisdição', 'Quantidade', 'Percentual']],
      body: jurisdictionData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      margin: { left: 14, right: 14 },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Detailed List Section
  if (config.sections.detailedList && legislations.length > 0) {
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LISTA DETALHADA DE LEGISLAÇÕES', 14, yPos);
    yPos += 10;
    
    const detailData = legislations.map(leg => [
      leg.norm_number || '-',
      leg.title.substring(0, 40) + (leg.title.length > 40 ? '...' : ''),
      JURISDICTION_LABELS[leg.jurisdiction] || leg.jurisdiction,
      APPLICABILITY_LABELS[leg.overall_applicability] || leg.overall_applicability,
      STATUS_LABELS[leg.overall_status] || leg.overall_status,
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Número', 'Título', 'Jurisdição', 'Aplicabilidade', 'Status']],
      body: detailData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 65 },
        2: { cellWidth: 25 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30 },
      },
      margin: { left: 14, right: 14 },
    });
  }
  
  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save
  const fileName = `relatorio_legislacoes_${config.reportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};

// Excel Export
export const exportLegislationReportToExcel = async (
  companyId: string,
  companyName: string,
  config: LegislationReportConfig
): Promise<void> => {
  const legislations = await fetchLegislations(companyId, {
    themeId: config.themeId,
  });
  const stats = await fetchLegislationStats(companyId);
  
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  if (config.sections.summary) {
    const summaryData = [
      ['RELATÓRIO DE LEGISLAÇÕES', ''],
      ['Empresa', companyName],
      ['Data do Relatório', format(new Date(), 'dd/MM/yyyy HH:mm')],
      ['Tipo de Relatório', LEGISLATION_REPORT_TEMPLATES[config.reportType].title],
      ['', ''],
      ['RESUMO EXECUTIVO', ''],
      ['Total de legislações', stats.total],
      ['Com aplicabilidade real', stats.byApplicability.real],
      ['Em conformidade', stats.byStatus.conforme],
      ['Em adequação', stats.byStatus.adequacao],
      ['Com plano de ação', stats.byStatus.plano_acao],
      ['Alertas ativos', stats.alerts],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
  }
  
  // Applicability Sheet
  if (config.sections.byApplicability) {
    const applicabilityData = [
      ['DISTRIBUIÇÃO POR APLICABILIDADE'],
      ['Aplicabilidade', 'Quantidade', 'Percentual'],
      ...Object.entries(stats.byApplicability).map(([key, value]) => [
        APPLICABILITY_LABELS[key] || key,
        value,
        stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%',
      ]),
    ];
    
    const applicabilitySheet = XLSX.utils.aoa_to_sheet(applicabilityData);
    XLSX.utils.book_append_sheet(workbook, applicabilitySheet, 'Por Aplicabilidade');
  }
  
  // Status Sheet
  if (config.sections.byStatus) {
    const statusData = [
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Status', 'Quantidade', 'Percentual'],
      ...Object.entries(stats.byStatus).map(([key, value]) => [
        STATUS_LABELS[key] || key,
        value,
        stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%',
      ]),
    ];
    
    const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Por Status');
  }
  
  // Jurisdiction Sheet
  if (config.sections.byJurisdiction) {
    const jurisdictionData = [
      ['DISTRIBUIÇÃO POR JURISDIÇÃO'],
      ['Jurisdição', 'Quantidade', 'Percentual'],
      ...Object.entries(stats.byJurisdiction).map(([key, value]) => [
        JURISDICTION_LABELS[key] || key,
        value,
        stats.total > 0 ? `${Math.round((value / stats.total) * 100)}%` : '0%',
      ]),
    ];
    
    const jurisdictionSheet = XLSX.utils.aoa_to_sheet(jurisdictionData);
    XLSX.utils.book_append_sheet(workbook, jurisdictionSheet, 'Por Jurisdição');
  }
  
  // Detailed List Sheet
  if (config.sections.detailedList) {
    const detailData = [
      ['LISTA DETALHADA DE LEGISLAÇÕES'],
      ['Número', 'Título', 'Tipo', 'Jurisdição', 'Aplicabilidade', 'Status', 'Responsável', 'Próxima Revisão'],
      ...legislations.map(leg => [
        leg.norm_number || '-',
        leg.title,
        leg.norm_type,
        JURISDICTION_LABELS[leg.jurisdiction] || leg.jurisdiction,
        APPLICABILITY_LABELS[leg.overall_applicability] || leg.overall_applicability,
        STATUS_LABELS[leg.overall_status] || leg.overall_status,
        leg.responsible_user?.full_name || '-',
        leg.next_review_date ? format(new Date(leg.next_review_date), 'dd/MM/yyyy') : '-',
      ]),
    ];
    
    const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
    detailSheet['!cols'] = [
      { wch: 15 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, detailSheet, 'Lista Detalhada');
  }
  
  // Save
  const fileName = `relatorio_legislacoes_${config.reportType}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Main export function
export const generateLegislationReport = async (
  companyId: string,
  companyName: string,
  config: LegislationReportConfig
): Promise<void> => {
  if (config.format === 'pdf' || config.format === 'both') {
    await exportLegislationReportToPDF(companyId, companyName, config);
  }
  
  if (config.format === 'excel' || config.format === 'both') {
    await exportLegislationReportToExcel(companyId, companyName, config);
  }
};
