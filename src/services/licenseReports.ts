import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig, GeneratedReport, ReportTemplate } from '@/types/licenseReport';
import type { LicenseDetail } from '@/services/licenses';

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  executive: {
    title: 'Relatório Executivo',
    description: 'Visão geral resumida da licença com informações principais',
    icon: 'FileText',
    sections: ['Informações da Licença', 'Status de Conformidade', 'Resumo de Condicionantes', 'Alertas Ativos'],
    estimatedPages: 2,
  },
  conditions_detailed: {
    title: 'Relatório Detalhado de Condicionantes',
    description: 'Lista completa com todas as condicionantes e evidências',
    icon: 'CheckSquare',
    sections: ['Condicionantes', 'Status Individual', 'Evidências', 'Responsáveis'],
    estimatedPages: 5,
  },
  compliance: {
    title: 'Relatório de Compliance',
    description: 'Análise de conformidade com gráficos e indicadores',
    icon: 'TrendingUp',
    sections: ['Taxa de Cumprimento', 'Evolução Temporal', 'Análise de Riscos', 'Recomendações'],
    estimatedPages: 8,
  },
  renewal_dossier: {
    title: 'Dossiê para Renovação',
    description: 'Documentação completa necessária para renovação',
    icon: 'FolderOpen',
    sections: ['Documentos', 'Histórico', 'Condicionantes Cumpridas', 'Checklist de Requisitos'],
    estimatedPages: 15,
  },
};

export async function generateLicenseReport(
  licenseId: string,
  license: LicenseDetail,
  config: ReportConfig
): Promise<GeneratedReport> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.company_id) throw new Error('Company not found');

    let pdfPath: string | undefined;
    let xlsxPath: string | undefined;

    // Generate PDF
    if (config.format === 'pdf' || config.format === 'both') {
      pdfPath = await generatePDFReport(license, config, profile.full_name);
    }

    // Generate Excel
    if (config.format === 'excel' || config.format === 'both') {
      xlsxPath = await generateExcelReport(license, config);
    }

    // Save report record
    const { data, error } = await supabase
      .from('license_report_history')
      .insert({
        license_id: licenseId,
        company_id: profile.company_id,
        report_type: config.type,
        report_config: config as any,
        file_path_pdf: pdfPath,
        file_path_xlsx: xlsxPath,
        generated_by_user_id: user.id,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('Relatório gerado com sucesso!');
    return {
      ...data,
      report_type: config.type,
      report_config: config,
    } as GeneratedReport;
  } catch (error) {
    console.error('Error generating report:', error);
    toast.error('Erro ao gerar relatório');
    throw error;
  }
}

async function generatePDFReport(
  license: LicenseDetail,
  config: ReportConfig,
  generatedBy: string
): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(REPORT_TEMPLATES[config.type].title, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(`Por: ${generatedBy}`, pageWidth / 2, yPosition + 5, { align: 'center' });

  yPosition += 20;

  // License Information
  if (config.sections.license_info) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações da Licença', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const info = [
      ['Nome', license.name],
      ['Tipo', license.type],
      ['Órgão Emissor', license.issuing_body],
      ['Nº Processo', license.process_number || '-'],
      ['Data de Emissão', license.issue_date ? format(new Date(license.issue_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'],
      ['Data de Vencimento', format(new Date(license.expiration_date), 'dd/MM/yyyy', { locale: ptBR })],
      ['Status', license.status],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: info,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 'auto' },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Conditions
  if (config.sections.conditions) {
    // Fetch conditions
    const { data: conditions } = await supabase
      .from('license_conditions')
      .select('*')
      .eq('license_id', license.id);

    if (conditions && conditions.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Condicionantes', 14, yPosition);
      yPosition += 8;

      const conditionsData = conditions.map((c, i) => [
        (i + 1).toString(),
        c.condition_text.substring(0, 80) + (c.condition_text.length > 80 ? '...' : ''),
        c.status === 'completed' ? 'Concluída' : c.status === 'in_progress' ? 'Em Andamento' : 'Pendente',
        c.priority === 'high' ? 'Alta' : c.priority === 'medium' ? 'Média' : 'Baixa',
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Condicionante', 'Status', 'Prioridade']],
        body: conditionsData,
        theme: 'striped',
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 100 },
          2: { cellWidth: 35 },
          3: { cellWidth: 30 },
        },
      });
    }
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
    if (config.options.include_watermark) {
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.text('CONFIDENCIAL', pageWidth / 2, doc.internal.pageSize.height / 2, { 
        align: 'center',
        angle: 45,
      });
    }
  }

  // Save to storage
  const pdfBlob = doc.output('blob');
  const fileName = `relatorio_${config.type}_${license.id}_${Date.now()}.pdf`;
  const filePath = `reports/licenses/${license.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  return filePath;
}

async function generateExcelReport(
  license: LicenseDetail,
  config: ReportConfig
): Promise<string> {
  const workbook = XLSX.utils.book_new();

  // License Info Sheet
  if (config.sections.license_info) {
    const licenseData = [
      ['Informações da Licença', ''],
      ['Nome', license.name],
      ['Tipo', license.type],
      ['Órgão Emissor', license.issuing_body],
      ['Nº Processo', license.process_number || '-'],
      ['Data de Emissão', license.issue_date ? format(new Date(license.issue_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'],
      ['Data de Vencimento', format(new Date(license.expiration_date), 'dd/MM/yyyy', { locale: ptBR })],
      ['Status', license.status],
    ];

    const ws = XLSX.utils.aoa_to_sheet(licenseData);
    XLSX.utils.book_append_sheet(workbook, ws, 'Informações');
  }

  // Conditions Sheet
  if (config.sections.conditions) {
    const { data: conditions } = await supabase
      .from('license_conditions')
      .select('*')
      .eq('license_id', license.id);

    if (conditions && conditions.length > 0) {
      const conditionsData = [
        ['#', 'Condicionante', 'Categoria', 'Status', 'Prioridade', 'Frequência', 'Vencimento'],
        ...conditions.map((c, i) => [
          i + 1,
          c.condition_text,
          c.condition_category,
          c.status === 'completed' ? 'Concluída' : c.status === 'in_progress' ? 'Em Andamento' : 'Pendente',
          c.priority === 'high' ? 'Alta' : c.priority === 'medium' ? 'Média' : 'Baixa',
          c.frequency || '-',
          c.due_date ? format(new Date(c.due_date), 'dd/MM/yyyy', { locale: ptBR }) : '-',
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(conditionsData);
      XLSX.utils.book_append_sheet(workbook, ws, 'Condicionantes');
    }
  }

  // Convert to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Upload to storage
  const fileName = `relatorio_${config.type}_${license.id}_${Date.now()}.xlsx`;
  const filePath = `reports/licenses/${license.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, blob, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  return filePath;
}

export async function downloadReport(filePath: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('license-reports')
      .createSignedUrl(filePath, 3600);

    if (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`Erro ao gerar URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error('URL de download não foi gerada');
    }

    const link = document.createElement('a');
    link.href = data.signedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Download iniciado com sucesso');
  } catch (error) {
    console.error('Error downloading report:', error);
    toast.error('Erro ao fazer download do relatório');
    throw error;
  }
}
