import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import pdfParse from 'npm:pdf-parse@1.1.1';
import * as XLSX from 'npm:xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📄 parse-chat-document: Request received');

  try {
    const body = await req.json();
    const { filePath, fileType, useVision = false } = body;

    console.log('📄 Parsing request:', { filePath, fileType, useVision });

    if (!filePath || !fileType) {
      throw new Error('filePath e fileType são obrigatórios');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('chat-attachments')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError?.message}`);
    }

    let parsedContent: any = {};
    let tables: number | null = null;
    let rows: number | null = null;

    // Parse based on file type
    if (fileType.includes('pdf')) {
      console.log('Parsing PDF...');
      const buffer = await fileData.arrayBuffer();
      const data = await pdfParse(new Uint8Array(buffer));
      
      parsedContent = {
        content: data.text.trim(),
        pages: data.numpages,
        metadata: data.info || {}
      };

    } else if (fileType.includes('csv')) {
      console.log('Parsing CSV...');
      const text = await fileData.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const dataRows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
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
        rows: dataRows
      };

    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      console.log('Parsing Excel...');
      const buffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const headers = jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];

      tables = headers.length;
      rows = jsonData.length;

      const textSummary = [
        `📊 Excel: ${firstSheetName}`,
        `Colunas: ${headers.join(', ')}`,
        `Total de linhas: ${rows}`,
        '',
        '📋 Primeiras linhas:',
        ...jsonData.slice(0, 5).map((row: any, idx: number) => {
          const values = headers.map(h => row[h] || '').join(' | ');
          return `${idx + 1}. ${values}`;
        })
      ].join('\n');
      
      parsedContent = {
        content: textSummary,
        headers,
        rows: jsonData
      };

    } else if (fileType.includes('image') && useVision) {
      console.log('Parsing Image with Vision...');
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY não configurada');
      }

      const buffer = await fileData.arrayBuffer();
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
                  text: 'Extraia TODOS os dados visíveis nesta imagem de forma estruturada. Inclua textos, números, tabelas, formulários, e qualquer informação relevante. Retorne em formato markdown.'
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
        throw new Error(`Vision API error: ${visionResponse.status}`);
      }

      const visionData = await visionResponse.json();
      const extractedText = visionData.choices?.[0]?.message?.content || '';

      parsedContent = {
        content: extractedText.trim()
      };

    } else {
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
    }

    console.log('Document parsed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        parsedContent: parsedContent.content,
        tables,
        rows,
        structured: parsedContent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error parsing document:', error);
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
