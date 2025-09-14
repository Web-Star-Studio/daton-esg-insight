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
    document_type: { type: "string", enum: ["licenca", "termo", "despacho", "outro"] },
    issuer: { type: "string" },
    issue_date: { type: "string", format: "date" },
    valid_until: { type: "string", format: "date" },
    process_number: { type: "string" },
    company: { type: "string" },
    cnpj: { type: "string" },
    site: { type: "string" },
    conditions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          text: { type: "string" },
          deadline_days: { type: ["integer", "null"] },
          source_snippet: { type: "string" },
          confidence: { type: "number" }
        },
        required: ["text"]
      }
    },
    confidence: { type: "number" }
  },
  required: ["confidence"]
};

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
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'extract_error',
        target_id: file_id,
        details: { error: 'File not found or access denied', correlation_id: correlationId }
      });
      
      return new Response(JSON.stringify({ ok: false, error: 'file not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${correlationId}] Processing file: ${file.original_name} (${file.mime})`);

    // Update file status to parsing
    await supabase.from('files').update({ status: 'parsed' }).eq('id', file_id);

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
      
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'extract_error',
        target_id: file_id,
        details: { error: 'Download failed', correlation_id: correlationId }
      });

      return new Response(JSON.stringify({ ok: false, error: 'download failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let documentText = '';

    // Parse file based on type
    if (file.mime === 'application/pdf') {
      // For now, use a simple text extraction fallback
      const arrayBuffer = await fileData.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      documentText = text.substring(0, 10000); // Limit to prevent token overflow
      console.log(`[${correlationId}] Extracted text from PDF (${documentText.length} chars)`);
    } else if (file.mime === 'text/csv') {
      documentText = await fileData.text();
      console.log(`[${correlationId}] Read CSV content (${documentText.length} chars)`);
    } else {
      // For other file types, try to read as text
      try {
        documentText = await fileData.text();
        console.log(`[${correlationId}] Read file as text (${documentText.length} chars)`);
      } catch (error) {
        console.log(`[${correlationId}] Failed to read file as text:`, error);
        documentText = `Filename: ${file.original_name}`;
      }
    }

    // Call OpenAI for extraction
    console.log(`[${correlationId}] Calling OpenAI for extraction...`);
    
    let extractedData: any = { confidence: 0.1 };

    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'system',
            content: `Você é um especialista em análise de documentos de licenciamento ambiental. 
            Extraia informações estruturadas do documento fornecido. 
            - Extraia apenas campos com base textual no documento; nunca invente dados
            - Sempre preencha source_snippet quando possível
            - Use confidence entre 0 e 1 baseado na certeza da extração
            - Normalize datas para formato YYYY-MM-DD
            - Normalize CNPJ removendo pontos e barras`
          }, {
            role: 'user',
            content: `Analise este documento:\n\n${documentText}`
          }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "license_extraction",
              schema: JSON_SCHEMA
            }
          },
          temperature: 0
        })
      });

      if (openaiResponse.ok) {
        const aiResult = await openaiResponse.json();
        extractedData = JSON.parse(aiResult.choices[0].message.content);
        console.log(`[${correlationId}] OpenAI extraction successful, confidence: ${extractedData.confidence}`);
      } else {
        console.log(`[${correlationId}] OpenAI API error:`, await openaiResponse.text());
        throw new Error('OpenAI API error');
      }
    } catch (error) {
      console.log(`[${correlationId}] AI extraction failed, using fallback:`, error);
      // Fallback extraction from filename
      const filename = file.original_name.toLowerCase();
      if (filename.includes('licenca') || filename.includes('license')) {
        extractedData = {
          document_type: "licenca",
          issuer: filename.includes('ibama') ? 'IBAMA' : 'Órgão não identificado',
          company: 'Empresa não identificada',
          confidence: 0.3,
          conditions: []
        };
      }
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
    const basicFields = ['document_type', 'issuer', 'issue_date', 'valid_until', 'process_number', 'company', 'cnpj', 'site'];
    for (const field of basicFields) {
      if (extractedData[field]) {
        stagingItems.push({
          extraction_id: extraction.id,
          field_name: field,
          extracted_value: extractedData[field],
          source_text: documentText.substring(0, 100), // Sample source text
          confidence: extractedData.confidence || 0.5,
          status: 'pending'
        });
      }
    }

    // Conditions
    if (extractedData.conditions && Array.isArray(extractedData.conditions)) {
      extractedData.conditions.forEach((condition: any, index: number) => {
        stagingItems.push({
          extraction_id: extraction.id,
          row_index: index,
          field_name: 'condition_text',
          extracted_value: condition.text,
          source_text: condition.source_snippet || '',
          confidence: condition.confidence || extractedData.confidence || 0.5,
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
        correlation_id: correlationId
      }
    });

    console.log(`[${correlationId}] Extraction completed successfully`);

    return new Response(JSON.stringify({ 
      ok: true, 
      extraction_id: extraction.id,
      items_count: stagingItems.length,
      confidence: extractedData.confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[${correlationId}] Extraction failed:`, error);
    
    // Log error to audit table
    try {
      const { file_id } = await req.json();
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && file_id) {
        await supabase.from('files').update({ 
          status: 'failed', 
          error: error.message 
        }).eq('id', file_id);

        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'extract_error',
          target_id: file_id,
          details: { 
            error: error.message, 
            stack: error.stack,
            correlation_id: correlationId
          }
        });
      }
    } catch (logError) {
      console.error(`[${correlationId}] Failed to log error:`, logError);
    }

    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});