import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface ParseResult {
  success: boolean;
  content?: string;
  structured?: {
    headers: string[];
    records: any[];
    totalRows: number;
  };
  error?: string;
}

export async function parseFileClientSide(file: File): Promise<ParseResult> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  try {
    // CSV Processing
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return await parseCSV(file);
    }
    
    // Excel Processing
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || 
        fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel') {
      return await parseExcel(file);
    }
    
    // PDF Processing (basic text indication)
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    }
    
    // Image Processing
    if (fileType.startsWith('image/')) {
      return { 
        success: true, 
        content: `[Imagem: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]` 
      };
    }
    
    return { success: false, error: 'Tipo de arquivo não suportado' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const records = results.data;
        
        const summary = `CSV com ${records.length} linhas e ${headers.length} colunas\nColunas: ${headers.join(', ')}`;
        
        resolve({
          success: true,
          content: summary,
          structured: {
            headers,
            records,
            totalRows: records.length
          }
        });
      },
      error: (error) => {
        resolve({ success: false, error: error.message });
      }
    });
  });
}

async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        if (jsonData.length === 0) {
          resolve({ success: false, error: 'Planilha vazia' });
          return;
        }
        
        const headers = (jsonData[0] as any[]).map(h => String(h || ''));
        const records = jsonData.slice(1).map((row: any) => {
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });
        
        const summary = `Excel (${workbook.SheetNames[0]}) com ${records.length} linhas e ${headers.length} colunas\nColunas: ${headers.join(', ')}`;
        
        resolve({
          success: true,
          content: summary,
          structured: {
            headers,
            records,
            totalRows: records.length
          }
        });
      } catch (error) {
        resolve({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro ao processar Excel' 
        });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, error: 'Erro ao ler arquivo' });
    };
    
    reader.readAsArrayBuffer(file);
  });
}

async function parsePDF(file: File): Promise<ParseResult> {
  return {
    success: true,
    content: `[PDF: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]

📄 Arquivo PDF detectado. Extração avançada de texto será implementada em breve.
Por enquanto, você pode descrever o conteúdo do documento na sua mensagem.`
  };
}
