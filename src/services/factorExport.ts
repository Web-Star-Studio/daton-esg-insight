import { EmissionFactor } from "./emissionFactors";

interface ExportConfig {
  format: "csv" | "xlsx" | "pdf";
  includeSystemFactors: boolean;
  includeCustomFactors: boolean;
  useFilteredData: boolean;
  columns: string[];
  groupBy?: string;
}

export async function exportFactors(factors: EmissionFactor[], config: ExportConfig): Promise<void> {
  switch (config.format) {
    case 'csv':
      return exportToCSV(factors, config);
    case 'xlsx':
      return exportToExcel(factors, config);
    case 'pdf':
      return exportToPDF(factors, config);
    default:
      throw new Error('Formato de exportação não suportado');
  }
}

async function exportToCSV(factors: EmissionFactor[], config: ExportConfig): Promise<void> {
  // Prepare the data with selected columns
  const processedData = factors.map(factor => {
    const row: any = {};
    
    config.columns.forEach(columnId => {
      switch (columnId) {
        case 'name':
          row['Nome'] = factor.name;
          break;
        case 'category':
          row['Categoria'] = factor.category;
          break;
        case 'activity_unit':
          row['Unidade'] = factor.activity_unit;
          break;
        case 'co2_factor':
          row['Fator CO₂'] = factor.co2_factor || '';
          break;
        case 'ch4_factor':
          row['Fator CH₄'] = factor.ch4_factor || '';
          break;
        case 'n2o_factor':
          row['Fator N₂O'] = factor.n2o_factor || '';
          break;
        case 'source':
          row['Fonte'] = factor.source;
          break;
        case 'year_of_validity':
          row['Ano de Validade'] = factor.year_of_validity || '';
          break;
        case 'type':
          row['Tipo'] = factor.type === 'system' ? 'Sistema' : 'Customizado';
          break;
        case 'created_at':
          row['Data de Criação'] = new Date(factor.created_at).toLocaleDateString('pt-BR');
          break;
      }
    });
    
    return row;
  });

  // Group data if needed
  let finalData = processedData;
  if (config.groupBy) {
    finalData = groupData(processedData, config.groupBy);
  }

  // Convert to CSV
  const headers = Object.keys(finalData[0] || {});
  const csvContent = [
    headers.join(','),
    ...finalData.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  // Download the file
  downloadFile(csvContent, 'biblioteca-fatores-emissao.csv', 'text/csv');
}

async function exportToExcel(factors: EmissionFactor[], config: ExportConfig): Promise<void> {
  // For Excel export, we'll create a simple tab-separated format
  // In production, you'd want to use a library like xlsx
  
  const processedData = factors.map(factor => {
    const row: any = {};
    
    config.columns.forEach(columnId => {
      switch (columnId) {
        case 'name':
          row['Nome'] = factor.name;
          break;
        case 'category':
          row['Categoria'] = factor.category;
          break;
        case 'activity_unit':
          row['Unidade'] = factor.activity_unit;
          break;
        case 'co2_factor':
          row['Fator CO₂'] = factor.co2_factor || '';
          break;
        case 'ch4_factor':
          row['Fator CH₄'] = factor.ch4_factor || '';
          break;
        case 'n2o_factor':
          row['Fator N₂O'] = factor.n2o_factor || '';
          break;
        case 'source':
          row['Fonte'] = factor.source;
          break;
        case 'year_of_validity':
          row['Ano de Validade'] = factor.year_of_validity || '';
          break;
        case 'type':
          row['Tipo'] = factor.type === 'system' ? 'Sistema' : 'Customizado';
          break;
        case 'created_at':
          row['Data de Criação'] = new Date(factor.created_at).toLocaleDateString('pt-BR');
          break;
      }
    });
    
    return row;
  });

  // Convert to TSV (Tab-separated values) for better Excel compatibility
  const headers = Object.keys(processedData[0] || {});
  const tsvContent = [
    headers.join('\t'),
    ...processedData.map(row => 
      headers.map(header => row[header] || '').join('\t')
    )
  ].join('\n');

  // Download as Excel file
  downloadFile(tsvContent, 'biblioteca-fatores-emissao.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

async function exportToPDF(factors: EmissionFactor[], config: ExportConfig): Promise<void> {
  // Create HTML content for PDF
  const htmlContent = generatePDFHTML(factors);
  
  // For PDF generation, we'll create a printable HTML page
  // In production, you'd want to use a library like jsPDF or puppeteer
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  } else {
    throw new Error('Não foi possível abrir a janela de impressão');
  }
}

function groupData(data: any[], groupBy: string): any[] {
  if (!groupBy || groupBy === 'none') return data;
  
  const grouped: { [key: string]: any[] } = {};
  
  data.forEach(item => {
    const groupKey = item[getGroupColumnName(groupBy)] || 'Outros';
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(item);
  });
  
  // Flatten grouped data with headers
  const result: any[] = [];
  Object.keys(grouped).sort().forEach(groupKey => {
    // Add group header row
    const headerRow: any = {};
    Object.keys(data[0] || {}).forEach(col => {
      headerRow[col] = col === getGroupColumnName(groupBy) ? `=== ${groupKey} ===` : '';
    });
    result.push(headerRow);
    
    // Add group data
    result.push(...grouped[groupKey]);
    
    // Add empty row between groups
    const emptyRow: any = {};
    Object.keys(data[0] || {}).forEach(col => {
      emptyRow[col] = '';
    });
    result.push(emptyRow);
  });
  
  return result;
}

function getGroupColumnName(groupBy: string): string {
  const mapping: { [key: string]: string } = {
    'category': 'Categoria',
    'type': 'Tipo'
  };
  return mapping[groupBy] || groupBy;
}

function generatePDFHTML(factors: EmissionFactor[]): string {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Biblioteca de Fatores de Emissão</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
        .meta { font-size: 12px; color: #888; margin-top: 10px; }
        
        .stats { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .stats h3 { margin: 0 0 10px 0; font-size: 16px; }
        .stat-item { display: inline-block; margin-right: 20px; font-size: 14px; }
        
        .factor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .factor-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; page-break-inside: avoid; }
        .factor-name { font-weight: bold; font-size: 16px; color: #333; margin-bottom: 5px; }
        .factor-category { font-size: 12px; color: #666; margin-bottom: 10px; }
        .factor-details { font-size: 12px; line-height: 1.4; }
        .factor-type { display: inline-block; padding: 2px 6px; background-color: #e0e0e0; border-radius: 3px; font-size: 10px; }
        
        @media print {
          body { margin: 0; }
          .factor-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Biblioteca de Fatores de Emissão</div>
        <div class="subtitle">Relatório completo dos fatores cadastrados</div>
        <div class="meta">Gerado em: ${currentDate}</div>
      </div>
      
      <div class="stats">
        <h3>Estatísticas</h3>
        <div class="stat-item"><strong>Total:</strong> ${factors.length} fatores</div>
        <div class="stat-item"><strong>Sistema:</strong> ${factors.filter(f => f.type === 'system').length}</div>
        <div class="stat-item"><strong>Customizados:</strong> ${factors.filter(f => f.type === 'custom').length}</div>
        <div class="stat-item"><strong>Categorias:</strong> ${new Set(factors.map(f => f.category)).size}</div>
      </div>
      
      <div class="factor-grid">
        ${factors.map(factor => `
          <div class="factor-card">
            <div class="factor-name">${factor.name}</div>
            <div class="factor-category">${factor.category}</div>
            <div class="factor-details">
              <div><strong>Unidade:</strong> ${factor.activity_unit}</div>
              ${factor.co2_factor ? `<div><strong>CO₂:</strong> ${factor.co2_factor} kg CO₂/${factor.activity_unit}</div>` : ''}
              ${factor.ch4_factor ? `<div><strong>CH₄:</strong> ${factor.ch4_factor} kg CH₄/${factor.activity_unit}</div>` : ''}
              ${factor.n2o_factor ? `<div><strong>N₂O:</strong> ${factor.n2o_factor} kg N₂O/${factor.activity_unit}</div>` : ''}
              <div><strong>Fonte:</strong> ${factor.source}</div>
              ${factor.year_of_validity ? `<div><strong>Ano:</strong> ${factor.year_of_validity}</div>` : ''}
              <div style="margin-top: 5px;">
                <span class="factor-type">${factor.type === 'system' ? 'Sistema' : 'Customizado'}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}

function downloadFile(content: string, filename: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}