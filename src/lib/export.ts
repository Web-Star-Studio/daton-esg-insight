import * as XLSX from 'xlsx';
import { DatabaseSection } from '@/hooks/useAllDatabaseData';

// Professional export utilities for the database module
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includeMetadata?: boolean;
  flattenObjects?: boolean;
}

// Flatten nested objects for CSV/Excel export
export const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = '';
    } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}_`));
    } else if (Array.isArray(obj[key])) {
      flattened[prefix + key] = obj[key].join(', ');
    } else {
      flattened[prefix + key] = obj[key];
    }
  }
  
  return flattened;
};

// Normalize data for export
export const normalizeDataForExport = (data: any[], options: ExportOptions = { format: 'xlsx' }): any[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  return data.map(item => {
    if (options.flattenObjects && typeof item === 'object') {
      return flattenObject(item);
    }
    return item;
  });
};

// Export single section to CSV
export const exportSectionToCSV = (section: DatabaseSection, options: ExportOptions = { format: 'csv', flattenObjects: true }) => {
  const normalizedData = normalizeDataForExport(section.data, options);
  
  if (normalizedData.length === 0) {
    throw new Error(`Nenhum dado encontrado para exportar na seção: ${section.title}`);
  }
  
  const ws = XLSX.utils.json_to_sheet(normalizedData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${section.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export single section to Excel
export const exportSectionToExcel = (section: DatabaseSection, options: ExportOptions = { format: 'xlsx', flattenObjects: true }) => {
  const normalizedData = normalizeDataForExport(section.data, options);
  
  if (normalizedData.length === 0) {
    throw new Error(`Nenhum dado encontrado para exportar na seção: ${section.title}`);
  }
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(normalizedData);
  
  // Auto-size columns
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (cell && cell.v) {
        const cellLength = cell.v.toString().length;
        maxWidth = Math.max(maxWidth, Math.min(cellLength, 50));
      }
    }
    colWidths.push({ wch: maxWidth });
  }
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, section.title.substring(0, 31));
  
  const fileName = `${section.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export all sections to a multi-sheet Excel workbook
export const exportAllToExcel = (sections: DatabaseSection[], options: ExportOptions = { format: 'xlsx', flattenObjects: true, includeMetadata: true }) => {
  const wb = XLSX.utils.book_new();
  let sheetsAdded = 0;
  
  // Add summary sheet first
  if (options.includeMetadata) {
    const summaryData = sections.map(section => ({
      'Seção': section.title,
      'Categoria': section.category,
      'Registros': section.count,
      'Status': section.status,
      'Última Atualização': section.lastUpdated || 'N/A',
      'Descrição': section.description
    }));
    
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
    sheetsAdded++;
  }
  
  // Add data sheets
  for (const section of sections) {
    if (section.data && Array.isArray(section.data) && section.data.length > 0) {
      const normalizedData = normalizeDataForExport(section.data, options);
      
      if (normalizedData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(normalizedData);
        
        // Auto-size columns
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const colWidths = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 10;
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellAddress];
            if (cell && cell.v) {
              const cellLength = cell.v.toString().length;
              maxWidth = Math.max(maxWidth, Math.min(cellLength, 50));
            }
          }
          colWidths.push({ wch: maxWidth });
        }
        ws['!cols'] = colWidths;
        
        // Ensure sheet name is valid (max 31 chars, no invalid chars)
        const sheetName = section.title
          .replace(/[\/\\\?\*\[\]]/g, '_')
          .substring(0, 31);
        
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        sheetsAdded++;
      }
    }
  }
  
  if (sheetsAdded === 0) {
    throw new Error('Nenhum dado encontrado para exportar');
  }
  
  const fileName = `Banco_de_Dados_Completo_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return sheetsAdded;
};

// Export section as JSON
export const exportSectionToJSON = (section: DatabaseSection) => {
  const exportData = {
    section: {
      id: section.id,
      title: section.title,
      category: section.category,
      description: section.description,
      count: section.count,
      status: section.status,
      lastUpdated: section.lastUpdated,
      exportedAt: new Date().toISOString()
    },
    data: section.data
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${section.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Route mapping for navigation
export const SECTION_ROUTES: Record<string, string> = {
  'assets': '/ativos',
  'emission-sources': '/inventario-gee',
  'calculated-emissions': '/inventario-gee',
  'activity-data': '/coleta-dados',
  'data-collection-tasks': '/coleta-dados',
  'form-submissions': '/coleta-dados',
  'emission-factors': '/biblioteca-fatores',
  'license-alerts': '/licenciamento/analise',
  'license-ai-analysis': '/licenciamento/analise',
  'document-extraction-jobs': '/licenciamento/teste',
  'extracted-data': '/licenciamento/analise',
  'extractions': '/licenciamento/teste',
  'extraction-items-staging': '/licenciamento/teste',
  'extraction-items-curated': '/licenciamento/analise',
  'carbon-projects': '/projetos-carbono',
  'credit-purchases': '/projetos-carbono',
  'credit-retirements': '/projetos-carbono',
  'conservation-activities': '/projetos-carbono',
  'documents': '/documentos',
  'document-folders': '/documentos',
  'files': '/documentos',
  'goals': '/metas',
  'goal-progress': '/metas',
  'esg-metrics': '/desempenho',
  'esg-solutions': '/marketplace',
  'esg-solution-providers': '/marketplace',
  'compliance-tasks': '/compliance',
  'audits': '/auditoria',
  'audit-findings': '/auditoria',
  'generated-reports': '/relatorios',
  'company': '/configuracao',
  'profiles': '/configuracao',
  'custom-forms': '/formularios-customizados'
};