import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import pdfParse from 'npm:pdf-parse@1.1.1';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for parsed documents (1 hour TTL)
const parseCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📄 parse-chat-document: Request received');

  try {
    const body = await req.json();
    const { filePath, fileType, useVision = false, useCache = true } = body;

    console.log('📄 Parsing request:', { filePath, fileType, useVision });

    if (!filePath || !fileType) {
      throw new Error('filePath e fileType são obrigatórios');
    }

    // Download file first to generate content hash for robust caching
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Normalize file path (remove 'documents/' prefix if present)
    const normalizedPath = filePath.replace(/^documents\//, '');
    console.log('📁 Normalized path:', normalizedPath, '(original:', filePath, ')');

    // Download file from storage - try different buckets
    let fileData: Blob | null = null;
    let downloadError: any = null;
    
    const chatResult = await supabaseClient
      .storage
      .from('chat-attachments')
      .download(normalizedPath);
    
    if (chatResult.data) {
      fileData = chatResult.data;
      console.log('✅ File found in chat-attachments');
    } else {
      console.log('File not in chat-attachments, trying documents bucket...');
      const docsResult = await supabaseClient
        .storage
        .from('documents')
        .download(normalizedPath);
      
      if (docsResult.data) {
        fileData = docsResult.data;
        console.log('✅ File found in documents');
      } else {
        downloadError = docsResult.error || chatResult.error;
      }
    }

    if (downloadError || !fileData) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError?.message}`);
    }

    // Generate content hash for robust caching
    const buffer = await fileData.arrayBuffer();
    const contentHash = await crypto.subtle.digest('SHA-256', buffer);
    const hashHex = Array.from(new Uint8Array(contentHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const cacheKey = `${hashHex}-${fileType}-${useVision}`;
    console.log('🔑 Cache key:', cacheKey.substring(0, 20) + '...');
    
    // Check cache with content hash
    if (useCache) {
      const cached = parseCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('✅ Cache hit - returning cached result');
        return new Response(JSON.stringify(cached.result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    let parsedContent: any = {};
    let tables: number | null = null;
    let rows: number | null = null;

    // Parse based on file type (buffer already loaded above for hash)
    if (fileType.includes('pdf')) {
      console.log('📕 Parsing PDF with table detection...');
      const data = await pdfParse(new Uint8Array(buffer));
      
      // Enhanced table detection
      const hasTableIndicators = /\|.*\||\+[-+]+\+|[─│┌┐└┘├┤┬┴┼]/g.test(data.text);
      const tabularPatterns = data.text.match(/(\d+[\s\t]+[\w\s]+[\s\t]+\d+)/g);
      
      parsedContent = {
        content: data.text.trim(),
        pages: data.numpages,
        metadata: data.info || {},
        hasTable: hasTableIndicators || (tabularPatterns && tabularPatterns.length > 3),
      };

    } else if (fileType.includes('csv')) {
      console.log('📊 Parsing CSV with encoding detection...');
      
      // Try different encodings
      let text = '';
      try {
        text = new TextDecoder('utf-8').decode(buffer);
      } catch {
        try {
          text = new TextDecoder('iso-8859-1').decode(buffer);
        } catch {
          text = new TextDecoder('windows-1252').decode(buffer);
        }
      }

      // Detect delimiter
      const firstLine = text.split('\n')[0];
      const delimiters = [',', ';', '\t', '|'];
      const delimiter = delimiters.reduce((best, delim) => {
        const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
        return count > (firstLine.match(new RegExp(`\\${best}`, 'g')) || []).length ? delim : best;
      });

      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '')) || [];
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        return row;
      }).filter(row => Object.values(row).some(v => v));

      tables = headers.length;
      rows = dataRows.length;

      parsedContent = {
        content: text.trim(),
        headers,
        rows: dataRows,
        records: dataRows,  // Add for backward compatibility
        delimiter,
        encoding: 'utf-8',
      };

    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('sheet')) {
      console.log('📈 Parsing Excel with multi-sheet support...');
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      const allSheets: any[] = [];
      let totalRows = 0;
      let allHeaders: string[] = [];

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];
        
        allSheets.push({
          name: sheetName,
          headers,
          rows: jsonData,
          rowCount: jsonData.length,
        });
        
        totalRows += jsonData.length;
        allHeaders = [...new Set([...allHeaders, ...headers])];
      });

      tables = allHeaders.length;
      rows = totalRows;

      const textSummary = [
        `📊 Excel: ${workbook.SheetNames.length} planilha(s)`,
        '',
        ...allSheets.map(sheet => [
          `📄 ${sheet.name}:`,
          `   Colunas: ${sheet.headers.join(', ')}`,
          `   Linhas: ${sheet.rowCount}`,
          '',
          '   Primeiras linhas:',
          ...sheet.rows.slice(0, 3).map((row: any, idx: number) => {
            const values = sheet.headers.map((h: string) => row[h] || '').join(' | ');
            return `   ${idx + 1}. ${values}`;
          }),
        ]).flat(),
      ].join('\n');
      
      parsedContent = {
        content: textSummary,
        sheets: allSheets,
        headers: allHeaders,
        totalRows,
      };

    } else if (fileType.includes('json')) {
      console.log('🔧 Parsing JSON...');
      const text = new TextDecoder().decode(buffer);
      const json = JSON.parse(text);
      
      parsedContent = {
        content: JSON.stringify(json, null, 2),
        structured: json,
        dataType: 'json',
      };

    } else if (fileType.includes('xml')) {
      console.log('🔧 Parsing XML...');
      const text = new TextDecoder().decode(buffer);
      
      parsedContent = {
        content: text,
        dataType: 'xml',
      };

    } else if (fileType.includes('image') && useVision) {
      console.log('🖼️ Parsing Image with Gemini Vision...');
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY não configurada');
      }

      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const dataUrl = `data:${fileType};base64,${base64}`;

      const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                {
                  type: 'text',
                  text: `Extraia TODOS os dados visíveis nesta imagem de forma estruturada e detalhada.

INSTRUÇÕES:
1. Identifique TODOS os textos, números, tabelas, gráficos, formulários
2. Se houver tabelas, extraia linha por linha com cabeçalhos
3. Se houver valores numéricos, identifique unidades
4. Se houver datas, padronize no formato DD/MM/YYYY
5. Organize em formato markdown estruturado
6. Identifique o tipo de documento (Nota Fiscal, Relatório, Certificado, etc.)

Seja extremamente detalhado e preciso.`
                },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl }
                }
              ]
            }
          ],
          max_tokens: 4000
        })
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        throw new Error(`Vision API error: ${visionResponse.status} - ${errorText}`);
      }

      const visionData = await visionResponse.json();
      const extractedText = visionData.choices?.[0]?.message?.content || '';

      // Detect if tables are present in OCR
      const hasTable = /\|.*\||\+[-+]+\+|tabela|table/gi.test(extractedText);

      parsedContent = {
        content: extractedText.trim(),
        ocrMethod: 'gemini-vision',
        hasTable,
      };

    } else if (fileType.includes('word') || fileType.includes('document')) {
      console.log('📝 Word documents require external processing');
      throw new Error('Documentos Word (.doc/.docx) requerem processamento adicional. Use PDF ou imagem.');
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
    }

    console.log('✅ Document parsed successfully');

    const result = {
      success: true,
      parsedContent: parsedContent.content,
      tables,
      rows,
      structured: parsedContent,
    };

    // Cache result
    if (useCache) {
      parseCache.set(cacheKey, { result, timestamp: Date.now() });
      
      // Clean old cache entries
      if (parseCache.size > 100) {
        const oldestKey = Array.from(parseCache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        parseCache.delete(oldestKey);
      }
    }

    return new Response(JSON.stringify(result), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error parsing document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
