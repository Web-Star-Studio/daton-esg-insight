import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
          String(h || '').trim()
        ).filter(h => h);
        
        // Remaining rows as records
        const dataRows = jsonData.slice(1) as any[][];
        structuredData.records = dataRows
          .filter((row: any[]) => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map((row: any[]) => {
            const record: any = {};
            structuredData.headers.forEach((header: string, idx: number) => {
              if (header && row[idx] !== undefined && row[idx] !== null) {
                record[header] = row[idx];
              }
            });
            return record;
          });
        
        structuredData.rowCount = structuredData.records.length;
        structuredData.columnCount = structuredData.headers.length;
        
        console.log(`✅ Extracted ${structuredData.rowCount} records with ${structuredData.columnCount} columns`);
      }
      
    } else if (fileType === 'text/csv') {
      // CSV processing
      console.log('📄 Processing CSV file...');
      
      const text = await fileData.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length > 0) {
        // Detect delimiter
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : 
                         firstLine.includes('\t') ? '\t' : ',';
        
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
        
        structuredData.headers = parseLine(lines[0]);
        
        structuredData.records = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = parseLine(line);
            const record: any = {};
            structuredData.headers.forEach((header: string, idx: number) => {
              if (header && values[idx] !== undefined) {
                record[header] = values[idx];
              }
            });
            return record;
          });
        
        structuredData.rowCount = structuredData.records.length;
        structuredData.columnCount = structuredData.headers.length;
        
        console.log(`✅ Extracted ${structuredData.rowCount} CSV records with ${structuredData.columnCount} columns`);
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
