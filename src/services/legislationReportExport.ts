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

// Unit Report - PDF Export
export const exportUnitReportToPDF = async (
  companyId: string,
  companyName: string,
  branchId: string,
  branchName: string,
  config: LegislationReportConfig
): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Fetch unit compliance data
  const { data: unitData, error } = await supabase
    .from('legislation_unit_compliance')
    .select(`
      *,
      legislation:legislation_id (id, title, norm_number, norm_type, jurisdiction),
      responsible_user:profiles!unit_responsible_user_id (full_name)
    `)
    .eq('branch_id', branchId);

  if (error) throw error;

  const records = unitData || [];
  
  // Calculate stats
  const stats = {
    total: records.length,
    conforme: records.filter(d => d.compliance_status === 'conforme').length,
    adequacao: records.filter(d => d.compliance_status === 'adequacao').length,
    plano_acao: records.filter(d => d.compliance_status === 'plano_acao').length,
    real: records.filter(d => d.applicability === 'real').length,
  };
  
  const complianceRate = stats.real > 0 ? Math.round((stats.conforme / stats.real) * 100) : 0;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Conformidade por Unidade', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(branchName, pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, pageWidth / 2, 43, { align: 'center' });
  
  const reportDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${reportDate}`, pageWidth / 2, 50, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  let yPos = 65;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO EXECUTIVO', 14, yPos);
  yPos += 10;

  const summaryData = [
    ['Total de legislações avaliadas', stats.total.toString()],
    ['Com aplicabilidade real', stats.real.toString()],
    ['Em conformidade', `${stats.conforme} (${complianceRate}%)`],
    ['Em adequação', stats.adequacao.toString()],
    ['Com plano de ação', stats.plano_acao.toString()],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Pendencias Section
  const pendencias = records.filter(d => d.has_pending_requirements);
  if (pendencias.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`PENDÊNCIAS (${pendencias.length})`, 14, yPos);
    yPos += 10;

    const pendenciasData = pendencias.map(p => [
      (p.legislation as any)?.norm_number || '-',
      ((p.legislation as any)?.title || 'Legislação').substring(0, 35) + '...',
      ((p as any).observation || 'Pendência registrada').substring(0, 50) + '...',
      (p.responsible_user as any)?.full_name || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Norma', 'Legislação', 'Pendência', 'Responsável']],
      body: pendenciasData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Planos de Ação Section
  const planosAcao = records.filter(d => d.action_plan);
  if (planosAcao.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`PLANOS DE AÇÃO (${planosAcao.length})`, 14, yPos);
    yPos += 10;

    const planosData = planosAcao.map(p => [
      (p.legislation as any)?.norm_number || '-',
      ((p.legislation as any)?.title || 'Legislação').substring(0, 30) + '...',
      (p.action_plan || '').substring(0, 40) + '...',
      p.action_plan_deadline ? format(new Date(p.action_plan_deadline), 'dd/MM/yyyy') : '-',
      (p.responsible_user as any)?.full_name || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Norma', 'Legislação', 'Plano', 'Prazo', 'Responsável']],
      body: planosData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Detailed List
  if (config.sections.detailedList && records.length > 0) {
    doc.addPage();
    yPos = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LISTA DETALHADA', 14, yPos);
    yPos += 10;

    const detailData = records.map(r => [
      (r.legislation as any)?.norm_number || '-',
      ((r.legislation as any)?.title || '-').substring(0, 40) + '...',
      APPLICABILITY_LABELS[r.applicability || 'pending'] || r.applicability,
      STATUS_LABELS[r.compliance_status || 'pending'] || r.compliance_status,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Norma', 'Título', 'Aplicabilidade', 'Status']],
      body: detailData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
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

  const fileName = `relatorio_unidade_${branchName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(fileName);
};

// Unit Report - Excel Export
export const exportUnitReportToExcel = async (
  companyId: string,
  companyName: string,
  branchId: string,
  branchName: string,
  config: LegislationReportConfig
): Promise<void> => {
  // Fetch unit compliance data
  const { data: unitData, error } = await supabase
    .from('legislation_unit_compliance')
    .select(`
      *,
      legislation:legislation_id (id, title, norm_number, norm_type, jurisdiction),
      responsible_user:responsible_user_id (full_name)
    `)
    .eq('branch_id', branchId);

  if (error) throw error;

  const records = unitData || [];
  const workbook = XLSX.utils.book_new();

  // Calculate stats
  const stats = {
    total: records.length,
    conforme: records.filter(d => d.compliance_status === 'conforme').length,
    adequacao: records.filter(d => d.compliance_status === 'adequacao').length,
    plano_acao: records.filter(d => d.compliance_status === 'plano_acao').length,
    real: records.filter(d => d.applicability === 'real').length,
  };
  const complianceRate = stats.real > 0 ? Math.round((stats.conforme / stats.real) * 100) : 0;

  // Summary Sheet
  const summaryData = [
    ['RELATÓRIO DE CONFORMIDADE POR UNIDADE', ''],
    ['Unidade', branchName],
    ['Empresa', companyName],
    ['Data do Relatório', format(new Date(), 'dd/MM/yyyy HH:mm')],
    ['', ''],
    ['RESUMO', ''],
    ['Total de legislações avaliadas', stats.total],
    ['Com aplicabilidade real', stats.real],
    ['Em conformidade', stats.conforme],
    ['Taxa de conformidade', `${complianceRate}%`],
    ['Em adequação', stats.adequacao],
    ['Com plano de ação', stats.plano_acao],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  // Pendencias Sheet
  const pendencias = records.filter(d => d.has_pending_requirements);
  if (pendencias.length > 0) {
    const pendenciasData = [
      ['PENDÊNCIAS'],
      ['Número da Norma', 'Legislação', 'Pendência', 'Responsável'],
      ...pendencias.map(p => [
        (p.legislation as any)?.norm_number || '-',
        (p.legislation as any)?.title || 'Legislação',
        (p as any).observation || 'Pendência registrada',
        (p.responsible_user as any)?.full_name || '-',
      ]),
    ];

    const pendenciasSheet = XLSX.utils.aoa_to_sheet(pendenciasData);
    pendenciasSheet['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 60 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, pendenciasSheet, 'Pendências');
  }

  // Planos de Ação Sheet
  const planosAcao = records.filter(d => d.action_plan);
  if (planosAcao.length > 0) {
    const planosData = [
      ['PLANOS DE AÇÃO'],
      ['Número da Norma', 'Legislação', 'Plano de Ação', 'Prazo', 'Responsável'],
      ...planosAcao.map(p => [
        (p.legislation as any)?.norm_number || '-',
        (p.legislation as any)?.title || 'Legislação',
        p.action_plan || '',
        p.action_plan_deadline ? format(new Date(p.action_plan_deadline), 'dd/MM/yyyy') : '-',
        (p.responsible_user as any)?.full_name || '-',
      ]),
    ];

    const planosSheet = XLSX.utils.aoa_to_sheet(planosData);
    planosSheet['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 60 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, planosSheet, 'Planos de Ação');
  }

  // Detailed List Sheet
  const detailData = [
    ['LISTA DETALHADA'],
    ['Número', 'Legislação', 'Tipo', 'Jurisdição', 'Aplicabilidade', 'Status', 'Responsável', 'Avaliado em'],
    ...records.map(r => [
      (r.legislation as any)?.norm_number || '-',
      (r.legislation as any)?.title || '-',
      (r.legislation as any)?.norm_type || '-',
      (r.legislation as any)?.jurisdiction || '-',
      APPLICABILITY_LABELS[r.applicability || 'pending'] || r.applicability,
      STATUS_LABELS[r.compliance_status || 'pending'] || r.compliance_status,
      (r.responsible_user as any)?.full_name || '-',
      r.evaluated_at ? format(new Date(r.evaluated_at), 'dd/MM/yyyy') : '-',
    ]),
  ];

  const detailSheet = XLSX.utils.aoa_to_sheet(detailData);
  detailSheet['!cols'] = [
    { wch: 15 }, { wch: 50 }, { wch: 15 }, { wch: 15 },
    { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Lista Detalhada');

  const fileName = `relatorio_unidade_${branchName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Main export function
export const generateLegislationReport = async (
  companyId: string,
  companyName: string,
  config: LegislationReportConfig,
  branchId?: string,
  branchName?: string
): Promise<void> => {
  // Unit-specific report
  if (config.reportType === 'unit' && branchId && branchName) {
    if (config.format === 'pdf' || config.format === 'both') {
      await exportUnitReportToPDF(companyId, companyName, branchId, branchName, config);
    }
    if (config.format === 'excel' || config.format === 'both') {
      await exportUnitReportToExcel(companyId, companyName, branchId, branchName, config);
    }
    return;
  }

  // Global/Theme report
  if (config.format === 'pdf' || config.format === 'both') {
    await exportLegislationReportToPDF(companyId, companyName, config);
  }
  
  if (config.format === 'excel' || config.format === 'both') {
    await exportLegislationReportToExcel(companyId, companyName, config);
  }
};
