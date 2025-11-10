import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface GRIContentIndexItem {
  id: string;
  report_id: string;
  indicator_id: string;
  indicator_code: string;
  indicator_title: string;
  indicator_description?: string;
  disclosure_status: 'fully_reported' | 'partially_reported' | 'not_applicable' | 'omitted';
  omission_reason?: string;
  report_section_id?: string;
  page_number?: number;
  section_reference?: string;
  direct_url?: string;
  related_content?: string;
  supporting_documents?: any[];
  ai_confidence_score?: number;
  ai_identified: boolean;
  manually_verified: boolean;
  verification_notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExportOptions {
  includeOnlyReported?: boolean;
  includeDescriptions?: boolean;
  includeNotes?: boolean;
  includeMetadata?: boolean;
  layout?: 'full' | 'summary' | 'custom';
}

export async function generateGRIContentIndex(
  reportId: string, 
  regenerate: boolean = false
): Promise<GRIContentIndexItem[]> {
  const { data, error } = await supabase.functions.invoke('gri-index-generator', {
    body: { report_id: reportId, regenerate }
  });

  if (error) throw error;
  return data.items || [];
}

export async function getGRIContentIndex(reportId: string): Promise<GRIContentIndexItem[]> {
  const { data, error } = await supabase
    .from('gri_content_index_items')
    .select('*')
    .eq('report_id', reportId)
    .order('indicator_code');

  if (error) throw error;
  return (data || []) as GRIContentIndexItem[];
}

export async function updateGRIContentIndexItem(
  itemId: string, 
  updates: Partial<GRIContentIndexItem>
): Promise<GRIContentIndexItem> {
  const { data, error } = await supabase
    .from('gri_content_index_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as GRIContentIndexItem;
}

export async function addManualGRIContentIndexItem(
  reportId: string, 
  indicatorId: string, 
  itemData: Partial<GRIContentIndexItem>
): Promise<GRIContentIndexItem> {
  const { data: indicator } = await supabase
    .from('gri_indicators_library')
    .select('*')
    .eq('id', indicatorId)
    .single();

  const { data, error } = await supabase
    .from('gri_content_index_items')
    .insert({
      report_id: reportId,
      indicator_id: indicatorId,
      indicator_code: indicator?.code || '',
      indicator_title: indicator?.title || '',
      indicator_description: indicator?.description,
      ai_identified: false,
      manually_verified: true,
      ...itemData
    })
    .select()
    .single();

  if (error) throw error;
  return data as GRIContentIndexItem;
}

export async function deleteGRIContentIndexItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('gri_content_index_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

export async function exportGRIContentIndexPDF(
  reportId: string,
  items: GRIContentIndexItem[],
  options: ExportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF();
  
  // Fetch report data
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies!inner(*)')
    .eq('id', reportId)
    .single();

  const companyName = report?.companies ? (Array.isArray(report.companies) ? report.companies[0]?.name : (report.companies as any)?.name) : '';

  // Header
  doc.setFontSize(18);
  doc.text('ÍNDICE DE CONTEÚDO GRI', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('GRI Content Index - GRI Standards 2021', 105, 28, { align: 'center' });
  
  if (report) {
    doc.setFontSize(14);
    doc.text(companyName || '', 105, 40, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`Relatório de Sustentabilidade ${report.year}`, 105, 47, { align: 'center' });
  }

  // Filter items
  let filteredItems = items;
  if (options.includeOnlyReported) {
    filteredItems = items.filter(i => i.disclosure_status === 'fully_reported');
  }

  // Group by category
  const grouped = filteredItems.reduce((acc, item) => {
    const prefix = item.indicator_code.split('-')[0];
    const category = prefix === 'GRI 2' ? 'Universal' :
                     prefix.startsWith('20') ? 'Econômico' :
                     prefix.startsWith('30') ? 'Ambiental' :
                     prefix.startsWith('40') ? 'Social' : 'Outros';
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, GRIContentIndexItem[]>);

  let yPos = 60;

  Object.entries(grouped).forEach(([category, categoryItems]) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(category.toUpperCase(), 14, yPos);
    yPos += 8;

    const tableData = categoryItems.map(item => [
      item.indicator_code,
      item.indicator_title,
      item.section_reference || `p.${item.page_number || '-'}`,
      item.disclosure_status === 'fully_reported' ? '✓ Atendido' :
      item.disclosure_status === 'partially_reported' ? '⚠ Parcial' :
      item.disclosure_status === 'omitted' ? '❌ Omitido' : '⊘ N/A'
    ]);

    (doc as any).autoTable({
      startY: yPos,
      head: [['Código', 'Descrição', 'Localização', 'Status']],
      body: tableData,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [100, 116, 139], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString('pt-BR')} | Daton - Plataforma ESG`,
      105,
      285,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

export async function exportGRIContentIndexExcel(
  reportId: string,
  items: GRIContentIndexItem[],
  options: ExportOptions = {}
): Promise<Blob> {
  const workbook = XLSX.utils.book_new();

  // Fetch report data
  const { data: report } = await supabase
    .from('gri_reports')
    .select('*, companies!inner(*)')
    .eq('id', reportId)
    .single();

  // Main sheet
  const mainData = items.map(item => ({
    'Código GRI': item.indicator_code,
    'Descrição': item.indicator_title,
    'Localização': item.section_reference || `p.${item.page_number || '-'}`,
    'Status': item.disclosure_status === 'fully_reported' ? 'Atendido' :
              item.disclosure_status === 'partially_reported' ? 'Parcial' :
              item.disclosure_status === 'omitted' ? 'Omitido' : 'N/A',
    'Confiança IA': item.ai_confidence_score ? `${(item.ai_confidence_score * 100).toFixed(0)}%` : '-',
    'Verificado': item.manually_verified ? 'Sim' : 'Não'
  }));

  const mainSheet = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'Índice GRI Completo');

  // Summary sheet
  const summary = {
    'Total de Indicadores': items.length,
    'Totalmente Atendidos': items.filter(i => i.disclosure_status === 'fully_reported').length,
    'Parcialmente Atendidos': items.filter(i => i.disclosure_status === 'partially_reported').length,
    'Omitidos': items.filter(i => i.disclosure_status === 'omitted').length,
    'Não Aplicáveis': items.filter(i => i.disclosure_status === 'not_applicable').length,
    'Identificados por IA': items.filter(i => i.ai_identified).length,
    'Verificados Manualmente': items.filter(i => i.manually_verified).length
  };

  const summarySheet = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportGRIContentIndex(
  reportId: string, 
  format: 'pdf' | 'excel' | 'csv',
  options: ExportOptions = {}
): Promise<Blob> {
  const items = await getGRIContentIndex(reportId);

  if (format === 'pdf') {
    return exportGRIContentIndexPDF(reportId, items, options);
  } else if (format === 'excel') {
    return exportGRIContentIndexExcel(reportId, items, options);
  } else if (format === 'csv') {
    const csvData = items.map(item => ({
      codigo: item.indicator_code,
      descricao: item.indicator_title,
      localizacao: item.section_reference || `p.${item.page_number || '-'}`,
      status: item.disclosure_status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return new Blob([csv], { type: 'text/csv' });
  }

  throw new Error('Formato não suportado');
}
