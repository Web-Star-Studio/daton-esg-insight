import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

// Configurações do sistema inteligente
const AI_CONFIG = {
  models: {
    vision: 'gpt-4.1-2025-04-14',
    text: 'gpt-4.1-2025-04-14',
  },
  confidence: {
    auto_approve_threshold: 0.9,
    manual_review_threshold: 0.7,
    reject_threshold: 0.3
  },
  processing: {
    max_tokens: 2000,
    retry_attempts: 3,
    timeout_ms: 30000
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    console.log('Document AI Processor request:', req.method);

    // Get request body for POST requests
    let requestBody = null;
    if (req.method === 'POST') {
      try {
        const bodyText = await req.text();
        console.log('Raw request body:', bodyText);
        
        if (bodyText && bodyText.trim()) {
          requestBody = JSON.parse(bodyText);
          console.log('Parsed request body:', requestBody);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(JSON.stringify({ error: `Invalid JSON: ${parseError.message}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Route based on action in request body or query parameter
    const url = new URL(req.url);
    const action = requestBody?.action || url.searchParams.get('action') || 'process';

    console.log('Action:', action);

    switch (action) {
      case 'process':
        if (req.method !== 'POST') {
          throw new Error('Process action requires POST method');
        }
        return await handleProcessDocument(requestBody, supabase, profile.company_id, user.id);

      case 'status':
        return await handleGetStatus(req, supabase, profile.company_id);

      case 'approve':
        if (req.method !== 'POST') {
          throw new Error('Approve action requires POST method');
        }
        return await handleApproveData(requestBody, supabase, profile.company_id, user.id);

      case 'reject':
        if (req.method !== 'POST') {
          throw new Error('Reject action requires POST method');
        }
        return await handleRejectData(requestBody, supabase, profile.company_id, user.id);

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('Error in document-ai-processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleProcessDocument(requestBody: any, supabase: any, companyId: string, userId: string) {
  try {
    console.log('Processing request for company:', companyId);
    
    if (!requestBody) {
      throw new Error('Request body is required');
    }

    const { documentId } = requestBody;
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    // Buscar documento
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('company_id', companyId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Criar job de extração
    const { data: job, error: jobError } = await supabase
      .from('document_extraction_jobs')
      .insert({
        company_id: companyId,
        document_id: documentId,
        user_id: userId,
        processing_type: getProcessingType(document.file_type),
        status: 'Processando',
        ai_model_used: AI_CONFIG.models.vision
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    // Processar em background
    processDocumentWithAI(supabase, job, document).catch(console.error);

    return new Response(JSON.stringify({ 
      jobId: job.id, 
      status: 'processing',
      message: 'Document processing started'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in handleProcessDocument:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function processDocumentWithAI(supabase: any, job: any, document: any) {
  try {
    console.log('Starting AI processing for document:', document.id);

    // Baixar arquivo
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Download failed: ${downloadError?.message || 'No data'}`);
    }

    let extractedData: any = {};
    let confidenceScore = 0;

    if (document.file_type.toLowerCase().includes('pdf')) {
      const result = await processPDFWithAdvancedAI(fileData, document);
      extractedData = result.data;
      confidenceScore = result.confidence;
    } else {
      const result = await processSpreadsheetWithAdvancedAI(fileData, document);
      extractedData = result.data;
      confidenceScore = result.confidence;
    }

    // Detectar categoria
    const detectedCategory = detectDocumentCategory(extractedData, document);

    // Salvar preview
    await supabase
      .from('extracted_data_preview')
      .insert({
        extraction_job_id: job.id,
        company_id: job.company_id,
        target_table: getTargetTable(detectedCategory),
        extracted_fields: extractedData,
        confidence_scores: generateConfidenceScores(extractedData, confidenceScore),
        suggested_mappings: generateSuggestedMappings(extractedData, detectedCategory),
        validation_status: confidenceScore >= AI_CONFIG.confidence.auto_approve_threshold ? 'Auto-Aprovado' : 'Pendente'
      });

    // Finalizar job
    await supabase
      .from('document_extraction_jobs')
      .update({
        status: 'Concluído',
        confidence_score: confidenceScore,
        processing_end_time: new Date().toISOString()
      })
      .eq('id', job.id);

    await supabase
      .from('documents')
      .update({
        ai_processing_status: 'Processado',
        ai_extracted_category: detectedCategory,
        ai_confidence_score: confidenceScore
      })
      .eq('id', document.id);

    console.log('Processing completed successfully');

  } catch (error) {
    console.error('Processing error:', error);
    
    await supabase
      .from('document_extraction_jobs')
      .update({
        status: 'Erro',
        error_message: error.message,
        processing_end_time: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}

async function processPDFWithAdvancedAI(fileData: Blob, document: any) {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.models.vision,
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em extração de dados de documentos corporativos para sistemas ESG/GHG.
            Analise este PDF e extraia dados estruturados. Retorne APENAS um JSON válido sem texto adicional.
            Estrutura esperada: {"periodo_inicio": "YYYY-MM-DD", "periodo_fim": "YYYY-MM-DD", "quantidade_principal": number, "unidade": "string", "valor_total": number, "categoria": "string"}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extraia dados estruturados deste documento: ${document.file_name}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_completion_tokens: AI_CONFIG.processing.max_tokens,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI error: ${errorData.error?.message}`);
    }

    const result = await response.json();
    let extractedData = {};
    
    try {
      extractedData = JSON.parse(result.choices[0].message.content);
    } catch (parseError) {
      extractedData = { raw_analysis: result.choices[0].message.content };
    }

    return {
      data: extractedData,
      confidence: calculateConfidence(extractedData)
    };

  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      data: { error: error.message },
      confidence: 0.1
    };
  }
}

async function processSpreadsheetWithAdvancedAI(fileData: Blob, document: any) {
  try {
    const arrayBuffer = await fileData.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer).substring(0, 3000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_CONFIG.models.text,
        messages: [
          {
            role: 'system',
            content: 'Analise esta planilha e extraia dados estruturados em JSON. Identifique padrões como datas, quantidades, valores.'
          },
          {
            role: 'user',
            content: `Arquivo: ${document.file_name}\nConteúdo:\n${text}`
          }
        ],
        max_completion_tokens: AI_CONFIG.processing.max_tokens,
        response_format: { type: "json_object" }
      })
    });

    const result = await response.json();
    let extractedData = {};
    
    try {
      extractedData = JSON.parse(result.choices[0].message.content);
    } catch (parseError) {
      extractedData = { raw_analysis: result.choices[0].message.content };
    }

    return {
      data: extractedData,
      confidence: calculateConfidence(extractedData)
    };

  } catch (error) {
    return {
      data: { error: error.message },
      confidence: 0.1
    };
  }
}

function detectDocumentCategory(extractedData: any, document: any): string {
  const fileName = document.file_name.toLowerCase();
  const dataStr = JSON.stringify(extractedData).toLowerCase();

  if (fileName.includes('energia') || dataStr.includes('kwh')) {
    return 'energy_invoice';
  }
  if (fileName.includes('residuo') || dataStr.includes('mtr')) {
    return 'waste_document';
  }
  if (fileName.includes('combustivel') || dataStr.includes('litros')) {
    return 'fuel_invoice';
  }
  if (fileName.includes('licenca')) {
    return 'license_document';
  }
  
  return 'general_document';
}

function getTargetTable(category: string): string {
  const mapping = {
    'energy_invoice': 'activity_data',
    'fuel_invoice': 'activity_data',
    'waste_document': 'waste_logs',
    'license_document': 'licenses',
    'general_document': 'activity_data'
  };
  
  return mapping[category] || 'activity_data';
}

function generateConfidenceScores(extractedData: any, baseConfidence: number): any {
  const scores = {};
  
  for (const key in extractedData) {
    let confidence = baseConfidence;
    if (typeof extractedData[key] === 'number') {
      confidence = Math.min(confidence + 0.1, 1.0);
    }
    scores[key] = Math.round(confidence * 100) / 100;
  }
  
  return scores;
}

function generateSuggestedMappings(extractedData: any, category: string): any {
  const mappings = {};
  
  if (category === 'energy_invoice') {
    for (const key in extractedData) {
      if (key.toLowerCase().includes('quantidade')) {
        mappings[key] = 'quantity';
      }
    }
  }
  
  return mappings;
}

function calculateConfidence(data: any): number {
  const keys = Object.keys(data);
  let score = 0.5;
  
  if (keys.length > 3) score += 0.2;
  if (data.quantidade_principal) score += 0.1;
  if (data.periodo_inicio) score += 0.1;
  if (data.error) score -= 0.3;
  
  return Math.max(0.1, Math.min(1.0, score));
}

function getProcessingType(fileType: string): string {
  if (fileType.toLowerCase().includes('pdf')) return 'advanced_pdf_ocr';
  return 'structured_data';
}

async function handleGetStatus(req: Request, supabase: any, companyId: string) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    throw new Error('Job ID required');
  }

  const { data: job, error } = await supabase
    .from('document_extraction_jobs')
    .select(`*, extracted_data_preview (*)`)
    .eq('id', jobId)
    .eq('company_id', companyId)
    .single();

  if (error || !job) {
    throw new Error('Job not found');
  }

  return new Response(JSON.stringify(job), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleApproveData(requestBody: any, supabase: any, companyId: string, userId: string) {
  const { previewId, finalData } = requestBody;

  const { data: preview, error: previewError } = await supabase
    .from('extracted_data_preview')
    .select('*')
    .eq('id', previewId)
    .eq('company_id', companyId)
    .single();

  if (previewError || !preview) {
    throw new Error('Preview not found');
  }

  const { error: insertError } = await supabase
    .from(preview.target_table)
    .insert({
      ...finalData,
      company_id: companyId,
      user_id: userId
    });

  if (insertError) {
    throw new Error(`Insert failed: ${insertError.message}`);
  }

  await supabase
    .from('extracted_data_preview')
    .update({
      validation_status: 'Aprovado',
      approved_by_user_id: userId,
      approved_at: new Date().toISOString()
    })
    .eq('id', previewId);

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Data approved successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleRejectData(requestBody: any, supabase: any, companyId: string, userId: string) {
  const { previewId, rejectionNotes } = requestBody;

  const { error } = await supabase
    .from('extracted_data_preview')
    .update({
      validation_status: 'Rejeitado',
      validation_notes: rejectionNotes,
      approved_by_user_id: userId,
      approved_at: new Date().toISOString()
    })
    .eq('id', previewId)
    .eq('company_id', companyId);

  if (error) {
    throw new Error('Rejection failed');
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Data rejected successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}