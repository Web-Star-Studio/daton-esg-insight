import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface ExtractionResult {
  success: boolean;
  structuredData: any;
  metadata: {
    extractionMethod: string;
    confidence: number;
    recordCount?: number;
    fieldsMapped?: Record<string, string>;
  };
  rawData?: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileType, classification } = await req.json();

    console.log('📤 Advanced extraction started:', { filePath, fileType, docType: classification?.documentType });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download file
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('chat-attachments')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let result: ExtractionResult;

    // Route to appropriate extraction method based on file type
    if (fileType.includes('spreadsheet') || fileType.includes('excel') || filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      result = await extractExcelData(fileData, classification);
    } else if (fileType.includes('csv')) {
      result = await extractCSVData(fileData, classification);
    } else if (fileType.includes('pdf')) {
      result = await extractPDFData(fileData, classification);
    } else if (fileType.includes('image')) {
      result = await extractImageData(fileData, fileType, classification);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('✅ Extraction completed:', { 
      method: result.metadata.extractionMethod,
      confidence: result.metadata.confidence,
      recordCount: result.metadata.recordCount 
    });

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Extraction error:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ============= EXCEL EXTRACTION =============
async function extractExcelData(fileData: Blob, classification: any): Promise<ExtractionResult> {
  console.log('📊 Extracting Excel data...');

  const buffer = await fileData.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Get all sheet names
  const sheetNames = workbook.SheetNames;
  console.log('📋 Found sheets:', sheetNames);

  // Find the most relevant sheet based on classification
  let targetSheet = workbook.Sheets[sheetNames[0]]; // Default to first sheet
  let targetSheetName = sheetNames[0];

  // If we have classification, try to find relevant sheet
  if (classification?.category) {
    const relevantKeywords = getRelevantKeywords(classification.category);
    for (const sheetName of sheetNames) {
      const nameLower = sheetName.toLowerCase();
      if (relevantKeywords.some(kw => nameLower.includes(kw))) {
        targetSheet = workbook.Sheets[sheetName];
        targetSheetName = sheetName;
        console.log('🎯 Selected relevant sheet:', sheetName);
        break;
      }
    }
  }

  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(targetSheet, { 
    header: 1,
    defval: '',
    blankrows: false 
  });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('Excel file is empty');
  }

  // First row is headers
  const headers = (jsonData[0] as any[]) || [];
  const dataRows = jsonData.slice(1);

  console.log('📊 Excel parsed:', { 
    sheet: targetSheetName,
    headers: headers.length, 
    rows: dataRows.length 
  });

  // Convert to structured records
  const records = dataRows.map((row: any, index: number) => {
    const record: Record<string, any> = { _row: index + 2 }; // +2 because of header and 1-indexed
    headers.forEach((header: string, colIndex: number) => {
      if (header) {
        record[header] = row[colIndex] !== undefined ? row[colIndex] : '';
      }
    });
    return record;
  }).filter(record => {
    // Filter out empty rows
    const values = Object.values(record).filter(v => v !== '' && v !== '_row');
    return values.length > 0;
  });

  // Smart field mapping based on classification
  const fieldMappings = await smartFieldMapping(headers, classification);

  return {
    success: true,
    structuredData: {
      headers,
      records,
      sheetName: targetSheetName,
      allSheets: sheetNames,
      totalRecords: records.length
    },
    metadata: {
      extractionMethod: 'xlsx_library',
      confidence: 0.95,
      recordCount: records.length,
      fieldsMapped: fieldMappings
    },
    rawData: {
      workbook: sheetNames.map(name => ({
        name,
        rowCount: XLSX.utils.sheet_to_json(workbook.Sheets[name]).length
      }))
    }
  };
}

// ============= CSV EXTRACTION =============
async function extractCSVData(fileData: Blob, classification: any): Promise<ExtractionResult> {
  console.log('📄 Extracting CSV data...');

  const text = await fileData.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  console.log('🔍 Detected delimiter:', delimiter);

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
  
  const records = lines.slice(1).map((line, index) => {
    const values = line.split(delimiter).map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    const record: Record<string, any> = { _row: index + 2 };
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    return record;
  }).filter(record => {
    const values = Object.values(record).filter(v => v !== '' && v !== '_row');
    return values.length > 0;
  });

  const fieldMappings = await smartFieldMapping(headers, classification);

  return {
    success: true,
    structuredData: {
      headers,
      records,
      delimiter,
      totalRecords: records.length
    },
    metadata: {
      extractionMethod: 'csv_parser',
      confidence: 0.9,
      recordCount: records.length,
      fieldsMapped: fieldMappings
    }
  };
}

// ============= PDF EXTRACTION (Enhanced with AI) =============
async function extractPDFData(fileData: Blob, classification: any): Promise<ExtractionResult> {
  console.log('📑 Extracting PDF data with AI...');

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  // Convert PDF to base64 for Vision API
  const buffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  // Use AI to extract structured data
  const prompt = `Analise este documento PDF e extraia TODOS os dados estruturados.

${classification ? `Este é um documento do tipo: ${classification.documentType}` : ''}
${classification?.suggestedFields ? `Campos esperados: ${classification.suggestedFields.join(', ')}` : ''}

**INSTRUÇÕES:**
1. Identifique todas as tabelas, formulários, campos de dados
2. Extraia valores numéricos, datas, textos importantes
3. Preserve a estrutura e organização
4. Se houver múltiplas páginas/seções, separe-as

**Retorne um JSON com:**
{
  "tables": [ { "title": "...", "headers": [...], "rows": [[...]] } ],
  "fields": { "field_name": "value", ... },
  "sections": [ { "title": "...", "content": "..." } ],
  "metadata": { "dates": [...], "numbers": [...], "entities": [...] }
}`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`AI extraction failed: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const extractedContent = aiData.choices?.[0]?.message?.content || '';

  // Try to parse JSON from response
  let structuredData = {};
  try {
    const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structuredData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Could not parse JSON from AI response, using raw text');
    structuredData = { content: extractedContent };
  }

  return {
    success: true,
    structuredData,
    metadata: {
      extractionMethod: 'ai_vision',
      confidence: 0.8,
    },
    rawData: { extractedText: extractedContent }
  };
}

// ============= IMAGE EXTRACTION =============
async function extractImageData(fileData: Blob, fileType: string, classification: any): Promise<ExtractionResult> {
  console.log('🖼️ Extracting image data with Vision AI...');

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const buffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const dataUrl = `data:${fileType};base64,${base64}`;

  const prompt = `Analise esta imagem e extraia TODOS os dados estruturados com ALTA PRECISÃO.

${classification ? `Tipo de documento: ${classification.documentType}` : ''}

**EXTRAIA:**
- Todos os números e valores (com unidades)
- Todas as datas e horários
- Textos, títulos, labels
- Tabelas e listas
- Medidores e indicadores
- Códigos e referências
- Assinaturas e carimbos

**Retorne JSON estruturado:**
{
  "meter_readings": [ { "type": "", "value": 0, "unit": "" } ],
  "dates": [ { "label": "", "date": "" } ],
  "fields": { "field_name": "value" },
  "tables": [ { "headers": [], "rows": [] } ],
  "text_content": "..."
}`;

  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ],
      max_tokens: 3000
    })
  });

  if (!aiResponse.ok) {
    throw new Error(`Vision AI failed: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const extractedContent = aiData.choices?.[0]?.message?.content || '';

  let structuredData = {};
  try {
    const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structuredData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    structuredData = { content: extractedContent };
  }

  return {
    success: true,
    structuredData,
    metadata: {
      extractionMethod: 'vision_ai',
      confidence: 0.85,
    },
    rawData: { extractedText: extractedContent }
  };
}

// ============= HELPER FUNCTIONS =============

function getRelevantKeywords(category: string): string[] {
  const keywords: Record<string, string[]> = {
    'emissions': ['emissão', 'emissões', 'ghg', 'gee', 'co2', 'carbono', 'escopo'],
    'waste': ['resíduo', 'resíduos', 'lixo', 'reciclagem', 'destinação'],
    'employees': ['funcionário', 'colaborador', 'rh', 'pessoal', 'staff'],
    'licenses': ['licença', 'licenças', 'permissão', 'autorização'],
    'compliance': ['auditoria', 'conformidade', 'compliance', 'legal'],
    'financial': ['financeiro', 'custo', 'valor', 'pagamento']
  };
  return keywords[category] || [];
}

async function smartFieldMapping(headers: string[], classification: any): Promise<Record<string, string>> {
  const mappings: Record<string, string> = {};
  
  // Common field mappings by category
  const fieldMaps: Record<string, Record<string, string[]>> = {
    'emissions': {
      'source_name': ['fonte', 'source', 'origem', 'descrição'],
      'scope': ['escopo', 'scope'],
      'quantity': ['quantidade', 'value', 'valor', 'qtd', 'consumo'],
      'unit': ['unidade', 'unit', 'un'],
      'emission_factor': ['fator', 'factor', 'fe'],
      'period': ['período', 'period', 'data', 'mês']
    },
    'employees': {
      'full_name': ['nome', 'name', 'colaborador', 'funcionário'],
      'email': ['email', 'e-mail'],
      'department': ['departamento', 'dept', 'setor'],
      'position': ['cargo', 'position', 'função'],
      'hire_date': ['admissão', 'hire', 'entrada', 'data de admissão']
    },
    'waste': {
      'waste_type': ['tipo', 'resíduo', 'material'],
      'quantity': ['quantidade', 'peso', 'volume', 'qtd'],
      'unit': ['unidade', 'un'],
      'disposal_company': ['destinador', 'empresa', 'receptor'],
      'date': ['data', 'date']
    }
  };

  const categoryMap = fieldMaps[classification?.category] || {};

  // Match headers to system fields
  for (const header of headers) {
    const headerLower = header.toLowerCase();
    
    for (const [systemField, variants] of Object.entries(categoryMap)) {
      if (variants.some(v => headerLower.includes(v))) {
        mappings[header] = systemField;
        break;
      }
    }
  }

  return mappings;
}
