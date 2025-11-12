import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normaliza string removendo espaços, aspas e caracteres invisíveis
 */
function normalizeValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .trim()
    .replace(/^["']|["']$/g, '') // Remove aspas nas pontas
    .replace(/\r/g, ''); // Remove carriage returns
}

/**
 * Verifica se uma row tem pelo menos um valor não vazio
 */
function hasNonEmptyValue(record: Record<string, any>): boolean {
  return Object.values(record).some(val => {
    const normalized = normalizeValue(val);
    return normalized.length > 0;
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileType, classification } = await req.json();
    
    console.log('🔬 Advanced extraction:', { filePath, fileType, classificationType: classification?.documentType });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('chat-attachments')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let structuredData: any = {
      headers: [],
      records: [],
      rowCount: 0,
      columnCount: 0
    };

    // Process based on file type
    if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        fileType === 'application/vnd.ms-excel') {
      // Excel processing
      console.log('📊 Processing Excel file...');
      
      const buffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        // First row as headers
        structuredData.headers = (jsonData[0] as any[]).map((h: any) => 
          normalizeValue(h)
        ).filter(h => h);
        
        // Remaining rows as records
        const dataRows = jsonData.slice(1) as any[][];
        const totalDataRows = dataRows.length;
        structuredData.records = dataRows
          .map((row: any[]) => {
            const record: any = {};
            structuredData.headers.forEach((header: string, idx: number) => {
              if (header && row[idx] !== undefined && row[idx] !== null) {
                record[header] = normalizeValue(row[idx]);
              }
            });
            return record;
          })
          // ✅ CRITICAL: Filter rows where ALL values are empty
          .filter(record => hasNonEmptyValue(record));
        
        structuredData.rowCount = structuredData.records.length;
        structuredData.columnCount = structuredData.headers.length;
        
        const emptyRowsCount = totalDataRows - structuredData.records.length;
        
        console.log(`✅ Excel Processing Details:`, {
          totalRows: totalDataRows,
          headers: structuredData.headers.length,
          recordsAfterFilter: structuredData.records.length,
          emptyRowsFiltered: emptyRowsCount
        });
        
        if (emptyRowsCount > totalDataRows * 0.3) {
          console.warn(`⚠️ High empty row ratio in Excel: ${emptyRowsCount}/${totalDataRows} (${Math.round(emptyRowsCount/totalDataRows*100)}%)`);
        }
      }
      
    } else if (fileType === 'text/csv') {
      // CSV processing
      console.log('📄 Processing CSV file...');
      
      const text = await fileData.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        // Detect delimiter (using same logic as parse-chat-document)
        const firstLine = lines[0];
        const delimiters = [',', ';', '\t', '|'];
        const delimiter = delimiters.reduce((best, delim) => {
          const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
          const bestCount = (firstLine.match(new RegExp(`\\${best}`, 'g')) || []).length;
          return count > bestCount ? delim : best;
        });
        
        console.log('🔍 CSV delimiter detection:', { delimiter, firstLinePreview: firstLine.substring(0, 100) });
        
        // Parse CSV with proper quote handling
        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        structuredData.headers = parseLine(lines[0]).map(h => normalizeValue(h)).filter(h => h);
        
        const totalDataLines = lines.length - 1;
        structuredData.records = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = parseLine(line);
            const record: any = {};
            structuredData.headers.forEach((header: string, idx: number) => {
              if (header && values[idx] !== undefined) {
                record[header] = normalizeValue(values[idx]);
              }
            });
            return record;
          })
          // ✅ CRITICAL: Filter rows where ALL values are empty (consistent with parse-chat-document)
          .filter(record => hasNonEmptyValue(record));
        
        structuredData.rowCount = structuredData.records.length;
        structuredData.columnCount = structuredData.headers.length;
        
        const emptyRowsCount = totalDataLines - structuredData.records.length;
        
        console.log(`✅ CSV Processing Details:`, {
          totalLines: lines.length,
          headers: structuredData.headers.length,
          recordsBeforeFilter: totalDataLines,
          recordsAfterFilter: structuredData.records.length,
          emptyRowsFiltered: emptyRowsCount
        });
        
        // Validação de sanidade
        if (structuredData.records.length === 0 && lines.length > 1) {
          console.warn('⚠️ WARNING: No records extracted but file has data!', {
            totalLines: lines.length,
            headers: structuredData.headers.length,
            firstDataLine: lines[1]?.substring(0, 100)
          });
        }
        
        // Detectar e alertar sobre muitas linhas vazias
        if (emptyRowsCount > totalDataLines * 0.3) { // > 30% vazias
          console.warn(`⚠️ High empty row ratio: ${emptyRowsCount}/${totalDataLines} (${Math.round(emptyRowsCount/totalDataLines*100)}%)`);
        }
      }
      
    } else if (fileType === 'application/pdf') {
      // PDF: refine existing structured data if available
      console.log('📃 PDF refinement (basic table detection)...');
      
      // For now, just pass through - could add table extraction here
      structuredData = {
        note: 'PDF content was parsed but table extraction requires additional processing',
        headers: [],
        records: [],
        rowCount: 0,
        columnCount: 0
      };
    }

    return new Response(JSON.stringify({ 
      structuredData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in advanced-document-extractor:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Extraction failed',
      structuredData: {
        headers: [],
        records: [],
        rowCount: 0,
        columnCount: 0
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
