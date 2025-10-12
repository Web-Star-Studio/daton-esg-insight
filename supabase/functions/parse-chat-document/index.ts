import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import pdfParse from 'npm:pdf-parse@1.1.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, fileType, useVision = false } = await req.json();

    if (!filePath || !fileType) {
      throw new Error('filePath and fileType are required');
    }

    console.log('Parsing document:', { filePath, fileType });

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
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let parsedContent: any = {};

    // Parse based on file type
    if (fileType.includes('pdf')) {
      console.log('Parsing PDF...');
      const buffer = await fileData.arrayBuffer();
      const data = await pdfParse(new Uint8Array(buffer));
      
      parsedContent = {
        type: 'pdf',
        text: data.text,
        pages: data.numpages,
        metadata: data.info,
        structured: {
          content: data.text,
          pageCount: data.numpages
        }
      };

    } else if (fileType.includes('csv')) {
      console.log('Parsing CSV...');
      const text = await fileData.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      parsedContent = {
        type: 'csv',
        text: text,
        structured: {
          headers,
          rows,
          rowCount: rows.length
        }
      };

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
      console.log('Parsing Image with Vision...');
      
      // Use Lovable AI Vision to extract text from image
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
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
                  text: 'Extraia TODOS os dados visíveis nesta imagem. Inclua textos, números, tabelas, formulários, medidores, placas, qualquer informação relevante. Retorne em formato estruturado e detalhado.'
                },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl }
                }
              ]
            }
          ]
        })
      });

      if (!visionResponse.ok) {
        throw new Error(`Vision API error: ${visionResponse.statusText}`);
      }

      const visionData = await visionResponse.json();
      const extractedText = visionData.choices?.[0]?.message?.content || '';

      parsedContent = {
        type: 'image',
        text: extractedText,
        structured: {
          extractedText,
          visionAnalysis: true
        }
      };

    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    console.log('Document parsed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        content: parsedContent.text,
        structured: parsedContent.structured,
        type: parsedContent.type
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
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
