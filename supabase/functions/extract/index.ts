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
    license_type: { type: "string" },
    license_number: { type: "string" },
    process_number: { type: "string" },
    issue_date: { type: "string", format: "date" },
    valid_from: { type: "string", format: "date" },
    valid_until: { type: "string", format: "date" },
    company: { type: "string" },
    cnpj: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    state: { type: "string" },
    latitude: { type: "number" },
    longitude: { type: "number" },
    activity: { type: "string" },
    area_size_m2: { type: "number" },
    previous_license_revoked: { type: "string" },
    conditions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          section_title: { type: "string" },
          text: { type: "string" },
          category: { type: "string" },
          deadline_days: { type: ["integer", "null"] },
          law_refs: { type: "string" },
          source_snippet: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["text"]
      }
    },
    confidence: { type: "number" },
    _evidence_chars: { type: "integer" }
  },
  required: ["confidence", "_evidence_chars"]
};

const INSTRUCTIONS = `Você é um agente de extração de dados ambientais. Receberá como entrada o conteúdo integral de um documento de licenciamento (PDF convertido em texto/tabelas). Esse documento pode ser uma Licença de Operação (LO), Licença Prévia (LP), Licença de Instalação (LI) ou outro tipo similar.

Seu trabalho é extrair apenas informações que estão de fato no documento e devolvê-las em JSON válido conforme o schema fornecido.

Regras obrigatórias:

1. Nunca invente informações. Se um campo não existir, simplesmente não retorne esse campo.
2. Sempre inclua um campo confidence de 0 a 1 e um source_snippet com o trecho textual que comprova cada dado extraído.
3. Datas devem ser padronizadas no formato YYYY-MM-DD.
4. CNPJs devem ser formatados com pontuação (99.999.999/9999-99).
5. Coordenadas devem ser numéricas (latitude/longitude).
6. Condicionantes/condições devem vir com código (se existir), texto, categoria resumida e snippet.
7. Se o documento estiver ilegível ou não houver dados suficientes, retorne apenas: { "confidence": 0.0, "_evidence_chars": 0 }

Instruções para interpretação:

- Identifique e preencha apenas os campos realmente encontrados no documento.
- Os campos são flexíveis: se a licença não traz "coordenadas" ou "área", esses campos não aparecem.
- Em "conditions", cada condicionante deve ser um item do array com:
  * código (se houver, ex. "3.1.1")
  * título da seção (ex. "Quanto aos Resíduos Sólidos")  
  * texto integral da condição
  * categoria curta (ex. residuos, emissoes, ruido, oleos, riscos)
  * snippet literal do trecho no documento
- Use _evidence_chars para somar o total de caracteres dos snippets coletados (medida de "quanto conteúdo real foi usado").

Saída esperada:
Sempre um único JSON válido que obedece ao schema. Não adicione explicações nem comentários fora do JSON.`;

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
    
    // Basic fields - updated for new schema
    const basicFields = [
      'license_type', 'license_number', 'process_number', 'issue_date', 
      'valid_from', 'valid_until', 'company', 'cnpj', 'address', 
      'city', 'state', 'activity', 'area_size_m2', 'previous_license_revoked'
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

    // Coordinates (separate latitude/longitude fields)
    if (extractedData.latitude || extractedData.longitude) {
      if (extractedData.latitude) {
        stagingItems.push({
          extraction_id: extraction.id,
          field_name: 'latitude',
          extracted_value: String(extractedData.latitude),
          source_text: `Coordinates extracted with confidence ${extractedData.confidence}`,
          confidence: extractedData.confidence,
          status: 'pending'
        });
      }
      if (extractedData.longitude) {
        stagingItems.push({
          extraction_id: extraction.id,
          field_name: 'longitude',
          extracted_value: String(extractedData.longitude),
          source_text: `Coordinates extracted with confidence ${extractedData.confidence}`,
          confidence: extractedData.confidence,
          status: 'pending'
        });
      }
    }

    // Conditions - updated for new schema structure
    if (extractedData.conditions && Array.isArray(extractedData.conditions)) {
      extractedData.conditions.forEach((condition: any, index: number) => {
        stagingItems.push({
          extraction_id: extraction.id,
          row_index: index,
          field_name: 'condition',
          extracted_value: JSON.stringify({
            code: condition.code,
            section_title: condition.section_title,
            text: condition.text,
            category: condition.category || 'geral',
            deadline_days: condition.deadline_days,
            law_refs: condition.law_refs,
            confidence: condition.confidence || extractedData.confidence
          }),
          source_text: condition.source_snippet || '',
          confidence: condition.confidence || extractedData.confidence,
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