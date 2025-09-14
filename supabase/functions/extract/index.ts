import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractionRequest {
  file_id: string;
}

const JSON_SCHEMA = {
  type: "object",
  properties: {
    confidence: { type: "number", minimum: 0, maximum: 1 },
    _evidence_chars: { type: "number" },
    license_number: { type: "string" },
    issuing_agency: { type: "string" },
    issue_date: { type: "string", format: "date" },
    expiration_date: { type: "string", format: "date" },
    company_name: { type: "string" },
    cnpj: { type: "string" },
    address: { type: "string" },
    coordinates: {
      type: "object",
      properties: {
        latitude: { type: "number" },
        longitude: { type: "number" }
      }
    },
    activity_description: { type: "string" },
    company_size: { 
      type: "string", 
      enum: ["micro", "pequeno", "medio", "grande"] 
    },
    conditions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          source_snippet: { type: "string" },
          category: { 
            type: "string",
            enum: ["residuos", "emissoes", "ruido", "oleos_combustiveis", "riscos", "monitoramento", "geral"]
          },
          due_date: { type: "string", format: "date" },
          frequency: { type: "string" },
          responsible: { type: "string" }
        },
        required: ["description", "source_snippet"]
      }
    }
  },
  required: ["confidence", "_evidence_chars"]
};

const INSTRUCTIONS = `Você vai ler o PDF/Imagem anexado e extrair apenas informações que estejam visíveis no documento.

Retorne somente JSON válido no schema.

Não invente nada: se um campo não existir, omita.

Sempre inclua em cada condition um source_snippet curto (até 280 chars) retirado do documento.

Preencha _evidence_chars com a soma dos comprimentos dos principais trechos copiados do documento usados como evidência.

Datas em YYYY-MM-DD.

CNPJ com pontuação.

category é uma label curta (ex.: residuos, emissoes, ruido, oleos_combustiveis, riscos).

Se o arquivo for ilegível (scan ruim) ou tiver pouco texto, retorne um JSON somente com confidence: 0.0 e _evidence_chars: 0.`;

serve(async (req) => {
  console.log('Starting document extraction...');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  console.log(`[${correlationId}] Starting extraction process`);
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log(`[${correlationId}] Authentication failed:`, userError);
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${correlationId}] Authenticated user: ${user.id}`);

    const { file_id }: ExtractionRequest = await req.json();
    if (!file_id) {
      return new Response(JSON.stringify({ ok: false, error: 'file_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get file metadata
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', file_id)
      .eq('user_id', user.id)
      .single();

    if (fileError || !file) {
      console.log(`[${correlationId}] File not found or access denied:`, fileError);
      return new Response(JSON.stringify({ ok: false, error: 'file not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${correlationId}] Processing file: ${file.original_name} (${file.mime})`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(file.storage_path);

    if (downloadError || !fileData) {
      console.log(`[${correlationId}] File download failed:`, downloadError);
      
      await supabase.from('files').update({ 
        status: 'failed', 
        error: 'Download failed' 
      }).eq('id', file_id);

      return new Response(JSON.stringify({ ok: false, error: 'download failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Convert file to blob for OpenAI upload
    const fileBuffer = await fileData.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.mime });
    
    console.log(`[${correlationId}] Uploading file to OpenAI...`);

    // Upload file to OpenAI
    const formData = new FormData();
    formData.append('file', fileBlob, file.original_name);
    formData.append('purpose', 'assistants');

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log(`[${correlationId}] OpenAI file upload failed:`, errorText);
      
      await supabase.from('files').update({ 
        status: 'failed', 
        error: 'OpenAI file upload failed' 
      }).eq('id', file_id);

      return new Response(JSON.stringify({ ok: false, error: 'file upload failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uploadResult = await uploadResponse.json();
    const openaiFileId = uploadResult.id;
    
    console.log(`[${correlationId}] File uploaded to OpenAI: ${openaiFileId}`);
    console.log(`[${correlationId}] Calling OpenAI Responses API...`);

    // Call OpenAI Responses API
    const responsesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: INSTRUCTIONS
            },
            {
              type: 'input_file',
              input_file: { file_id: openaiFileId }
            }
          ]
        }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'DatonLO',
            schema: JSON_SCHEMA
          }
        },
        temperature: 0
      })
    });

    // Clean up: Delete file from OpenAI
    try {
      await fetch(`https://api.openai.com/v1/files/${openaiFileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${openaiApiKey}` }
      });
      console.log(`[${correlationId}] Cleaned up OpenAI file: ${openaiFileId}`);
    } catch (cleanupError) {
      console.log(`[${correlationId}] Failed to cleanup OpenAI file:`, cleanupError);
    }

    if (!responsesResponse.ok) {
      const errorText = await responsesResponse.text();
      console.log(`[${correlationId}] OpenAI Responses API failed:`, errorText);
      
      await supabase.from('files').update({ 
        status: 'failed', 
        error: 'AI analysis failed' 
      }).eq('id', file_id);

      return new Response(JSON.stringify({ ok: false, error: 'ai analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResult = await responsesResponse.json();
    const extractedData = JSON.parse(aiResult.choices[0].message.content);
    
    console.log(`[${correlationId}] OpenAI extraction successful, confidence: ${extractedData.confidence}, evidence chars: ${extractedData._evidence_chars}`);

    // Validate response quality
    if (extractedData.confidence < 0.5 || extractedData._evidence_chars < 200) {
      console.log(`[${correlationId}] Document quality insufficient - confidence: ${extractedData.confidence}, evidence: ${extractedData._evidence_chars}`);
      
      await supabase.from('files').update({ 
        status: 'failed', 
        error: 'Documento ilegível/escaneado, não há evidência suficiente' 
      }).eq('id', file_id);

      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Documento ilegível/escaneado, não há evidência suficiente' 
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create extraction record
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .insert({
        file_id: file_id,
        model: 'gpt-4o-mini',
        quality_score: extractedData.confidence,
        raw_json: extractedData
      })
      .select()
      .single();

    if (extractionError || !extraction) {
      console.log(`[${correlationId}] Failed to create extraction record:`, extractionError);
      throw new Error('Failed to create extraction record');
    }

    console.log(`[${correlationId}] Created extraction record: ${extraction.id}`);

    // Create staging items
    const stagingItems = [];
    
    // Basic fields
    const basicFields = [
      'license_number', 'issuing_agency', 'issue_date', 'expiration_date', 
      'company_name', 'cnpj', 'address', 'activity_description', 'company_size'
    ];
    
    for (const field of basicFields) {
      if (extractedData[field]) {
        stagingItems.push({
          extraction_id: extraction.id,
          field_name: field,
          extracted_value: String(extractedData[field]),
          source_text: `Extracted from document with ${extractedData._evidence_chars} chars of evidence`,
          confidence: extractedData.confidence,
          status: 'pending'
        });
      }
    }

    // Coordinates (special handling)
    if (extractedData.coordinates && (extractedData.coordinates.latitude || extractedData.coordinates.longitude)) {
      stagingItems.push({
        extraction_id: extraction.id,
        field_name: 'coordinates',
        extracted_value: JSON.stringify(extractedData.coordinates),
        source_text: `Coordinates extracted with confidence ${extractedData.confidence}`,
        confidence: extractedData.confidence,
        status: 'pending'
      });
    }

    // Conditions
    if (extractedData.conditions && Array.isArray(extractedData.conditions)) {
      extractedData.conditions.forEach((condition: any, index: number) => {
        stagingItems.push({
          extraction_id: extraction.id,
          row_index: index,
          field_name: 'condition',
          extracted_value: JSON.stringify({
            description: condition.description,
            category: condition.category || 'geral',
            due_date: condition.due_date,
            frequency: condition.frequency,
            responsible: condition.responsible
          }),
          source_text: condition.source_snippet || '',
          confidence: extractedData.confidence,
          status: 'pending'
        });
      });
    }

    if (stagingItems.length > 0) {
      const { error: stagingError } = await supabase
        .from('extraction_items_staging')
        .insert(stagingItems);

      if (stagingError) {
        console.log(`[${correlationId}] Failed to create staging items:`, stagingError);
      } else {
        console.log(`[${correlationId}] Created ${stagingItems.length} staging items`);
      }
    }

    // Update file status to extracted
    await supabase.from('files').update({ status: 'extracted' }).eq('id', file_id);

    // Log success
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'extract_success',
      target_id: file_id,
      details: { 
        extraction_id: extraction.id, 
        items_count: stagingItems.length,
        confidence: extractedData.confidence,
        evidence_chars: extractedData._evidence_chars,
        correlation_id: correlationId
      }
    });

    console.log(`[${correlationId}] Extraction completed successfully`);

    return new Response(JSON.stringify({ 
      ok: true, 
      extraction_id: extraction.id,
      confidence: extractedData.confidence,
      evidence_chars: extractedData._evidence_chars
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.log(`[${correlationId}] Extraction failed:`, error);
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});