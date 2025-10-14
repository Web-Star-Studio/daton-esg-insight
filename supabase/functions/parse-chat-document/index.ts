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

  console.log('📄 parse-chat-document: Request received', {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  try {
    const body = await req.json();
    const { filePath, fileType, useVision = false } = body;

    console.log('📄 Parsing request:', { filePath, fileType, useVision });

    // Validação de entrada
    if (!filePath || typeof filePath !== 'string') {
      console.error('❌ Invalid filePath:', filePath);
      throw new Error('filePath é obrigatório e deve ser uma string');
    }

    if (!fileType || typeof fileType !== 'string') {
      console.error('❌ Invalid fileType:', fileType);
      throw new Error('fileType é obrigatório e deve ser uma string');
    }

    // Validação de tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    const isValidType = allowedTypes.some(type => fileType.includes(type.split('/')[1]));
    if (!isValidType) {
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`);
    }

    console.log('Parsing document:', { filePath, fileType, timestamp: new Date().toISOString() });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download file from storage com retry
    let fileData: Blob | null = null;
    let downloadError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabaseClient
          .storage
          .from('chat-attachments')
          .download(filePath);

        if (error) throw error;
        if (!data) throw new Error('Arquivo vazio retornado');

        fileData = data;
        break;
      } catch (error) {
        downloadError = error instanceof Error ? error : new Error('Erro desconhecido');
        console.error(`Download attempt ${attempt}/${maxRetries} failed:`, downloadError);

        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    if (!fileData || downloadError) {
      throw new Error(`Falha ao baixar arquivo após ${maxRetries} tentativas: ${downloadError?.message}`);
    }

    // Validação de tamanho
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (fileData.size > maxSize) {
      throw new Error(`Arquivo muito grande: ${(fileData.size / 1024 / 1024).toFixed(2)}MB (máx: 20MB)`);
    }

    let parsedContent: any = {};

    // Parse based on file type
    if (fileType.includes('pdf')) {
      console.log('Parsing PDF...', { size: fileData.size });
      
      try {
        const buffer = await fileData.arrayBuffer();
        const data = await pdfParse(new Uint8Array(buffer));
        
        if (!data || !data.text) {
          throw new Error('PDF parsing retornou conteúdo vazio');
        }

        console.log('PDF parsed successfully:', { 
          pages: data.numpages, 
          textLength: data.text.length,
          hasMetadata: !!data.info
        });
        
        parsedContent = {
          type: 'pdf',
          text: data.text.trim(),
          pages: data.numpages,
          metadata: data.info || {},
          structured: {
            content: data.text.trim(),
            pageCount: data.numpages,
            hasText: data.text.trim().length > 0
          }
        };
      } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }

    } else if (fileType.includes('csv')) {
      console.log('Parsing CSV...', { size: fileData.size });
      
      try {
        const text = await fileData.text();
        
        if (!text || text.trim().length === 0) {
          throw new Error('CSV vazio');
        }

        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          throw new Error('CSV não contém dados');
        }

        const headers = lines[0]?.split(',').map(h => h.trim()) || [];
        
        if (headers.length === 0) {
          throw new Error('CSV não contém cabeçalhos');
        }

        const rows = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] || '';
          });
          return row;
        }).filter(row => Object.values(row).some(v => v)); // Remove linhas vazias

        console.log('CSV parsed successfully:', { 
          headers: headers.length, 
          rows: rows.length,
          totalLines: lines.length
        });

        parsedContent = {
          type: 'csv',
          text: text.trim(),
          structured: {
            headers,
            rows,
            rowCount: rows.length,
            columnCount: headers.length
          }
        };
      } catch (error) {
        console.error('CSV parsing error:', error);
        throw new Error(`Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }

    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      console.log('Parsing Excel/Spreadsheet...');
      // For Excel files, we'll use Lovable AI Vision to extract data
      const buffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      parsedContent = {
        type: 'excel',
        text: 'Excel file - requires processing with AI',
        structured: {
          note: 'Use AI to extract structured data from this Excel file',
          fileBase64: base64.substring(0, 100) + '...' // Just a preview
        }
      };

    } else if (fileType.includes('image')) {
      console.log('Parsing Image with Vision...', { size: fileData.size });
      
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY não configurada');
        }

        const buffer = await fileData.arrayBuffer();
        
        // Validar tamanho da imagem
        if (buffer.byteLength === 0) {
          throw new Error('Imagem vazia');
        }

        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const dataUrl = `data:${fileType};base64,${base64}`;

        console.log('Calling Vision API...', { imageSize: buffer.byteLength });

        // Retry logic para Vision API
        let visionError: Error | null = null;
        let extractedText = '';

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
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
                        text: 'Extraia TODOS os dados visíveis nesta imagem de forma estruturada. Inclua:\n- Textos e títulos\n- Números e valores\n- Tabelas e listas\n- Formulários e campos\n- Medidores e indicadores\n- Placas e sinalizações\n- Datas e referências\n\nRetorne em formato markdown bem estruturado e organizado.'
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
              throw new Error(`Vision API retornou ${visionResponse.status}: ${errorText}`);
            }

            const visionData = await visionResponse.json();
            extractedText = visionData.choices?.[0]?.message?.content || '';

            if (!extractedText || extractedText.trim().length === 0) {
              throw new Error('Vision API não extraiu nenhum texto');
            }

            console.log('Vision API success:', { 
              textLength: extractedText.length,
              attempt 
            });

            break; // Success
          } catch (error) {
            visionError = error instanceof Error ? error : new Error('Erro desconhecido');
            console.error(`Vision API attempt ${attempt}/3 failed:`, visionError);

            if (attempt < 3) {
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }
        }

        if (!extractedText || visionError) {
          throw new Error(`Falha na extração de texto da imagem: ${visionError?.message}`);
        }

        parsedContent = {
          type: 'image',
          text: extractedText.trim(),
          structured: {
            extractedText: extractedText.trim(),
            visionAnalysis: true,
            imageSize: buffer.byteLength,
            hasContent: extractedText.trim().length > 0
          }
        };
      } catch (error) {
        console.error('Image parsing error:', error);
        throw new Error(`Erro ao processar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }

    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Document parsed successfully:', {
      type: parsedContent.type,
      hasContent: !!parsedContent.text && parsedContent.text.length > 0,
      contentLength: parsedContent.text?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Validação final
    if (!parsedContent.text || parsedContent.text.trim().length === 0) {
      throw new Error('Documento processado mas não contém texto extraível');
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: parsedContent.text,
        structured: parsedContent.structured,
        type: parsedContent.type,
        processedAt: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error parsing document:', {
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });

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
