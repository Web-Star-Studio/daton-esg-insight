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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar autenticação
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

    // Obter company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      throw new Error('User company not found');
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').slice(-1)[0];

    console.log('Document AI Processor:', req.method, path);

    if (req.method === 'POST' && path === 'process') {
      return await handleProcessDocument(req, supabase, profile.company_id, user.id);
    }

    if (req.method === 'GET' && path === 'status') {
      return await handleGetStatus(req, supabase, profile.company_id);
    }

    if (req.method === 'POST' && path === 'approve') {
      return await handleApproveData(req, supabase, profile.company_id, user.id);
    }

    if (req.method === 'POST' && path === 'reject') {
      return await handleRejectData(req, supabase, profile.company_id, user.id);
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Error in document-ai-processor:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleProcessDocument(req: Request, supabase: any, companyId: string, userId: string) {
  const { documentId } = await req.json();

  console.log('Processing document:', documentId);

  // Buscar documento no banco
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
      status: 'Processando'
    })
    .select()
    .single();

  if (jobError) {
    throw new Error('Failed to create extraction job');
  }

  // Processar documento em background
  EdgeRuntime.waitUntil(processDocumentWithAI(supabase, job, document));

  return new Response(JSON.stringify({ 
    jobId: job.id, 
    status: 'processing',
    message: 'Document processing started' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function processDocumentWithAI(supabase: any, job: any, document: any) {
  try {
    console.log('Starting AI processing for document:', document.id);

    // Atualizar status
    await supabase
      .from('document_extraction_jobs')
      .update({ status: 'Processando' })
      .eq('id', job.id);

    // Baixar arquivo do storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    let extractedData: any = {};
    let confidenceScore = 0;

    if (document.file_type.includes('pdf')) {
      // Processar PDF com OpenAI Vision
      const result = await processPDFWithAI(fileData, document);
      extractedData = result.data;
      confidenceScore = result.confidence;
    } else if (document.file_type.includes('sheet') || document.file_type.includes('csv')) {
      // Processar Excel/CSV
      const result = await processSpreadsheetWithAI(fileData, document);
      extractedData = result.data;
      confidenceScore = result.confidence;
    }

    // Detectar categoria do documento
    const detectedCategory = await detectDocumentCategory(extractedData, document);

    // Salvar dados extraídos para revisão
    const { error: previewError } = await supabase
      .from('extracted_data_preview')
      .insert({
        extraction_job_id: job.id,
        company_id: job.company_id,
        target_table: getTargetTable(detectedCategory),
        extracted_fields: extractedData,
        confidence_scores: generateConfidenceScores(extractedData, confidenceScore),
        suggested_mappings: generateSuggestedMappings(extractedData, detectedCategory)
      });

    if (previewError) {
      throw new Error(`Failed to save extracted data: ${previewError.message}`);
    }

    // Atualizar documento com categoria detectada
    await supabase
      .from('documents')
      .update({
        ai_processing_status: 'Processado',
        ai_extracted_category: detectedCategory,
        ai_confidence_score: confidenceScore
      })
      .eq('id', document.id);

    // Finalizar job
    await supabase
      .from('document_extraction_jobs')
      .update({
        status: 'Concluído',
        confidence_score: confidenceScore,
        processing_end_time: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log('AI processing completed for document:', document.id);

  } catch (error) {
    console.error('Error processing document with AI:', error);
    
    // Atualizar job com erro
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

async function processPDFWithAI(fileData: Blob, document: any) {
  console.log('Processing PDF with OpenAI Vision...');
  
  // Converter para base64
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em extração de dados de documentos corporativos. 
          Analise este PDF e extraia dados estruturados relevantes para um sistema de gestão ESG/GHG.
          Procure por: datas, valores numéricos, CNPJs, consumos de energia, quantidades de resíduos, 
          emissões, licenças, etc. Retorne os dados em JSON estruturado.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analise este documento PDF e extraia os dados relevantes. 
              Nome do arquivo: ${document.file_name}.
              Foque em campos como: período, quantidades, valores, datas, CNPJs, consumos.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${document.file_type};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    })
  });

  const result = await response.json();
  
  if (result.error) {
    throw new Error(`OpenAI API error: ${result.error.message}`);
  }

  const extractedText = result.choices[0].message.content;
  
  // Tentar parsear JSON da resposta
  let extractedData = {};
  try {
    // Extrair JSON da resposta (pode vir com texto adicional)
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.warn('Failed to parse JSON from AI response, using raw text');
    extractedData = { raw_text: extractedText };
  }

  return {
    data: extractedData,
    confidence: 0.8 // Base confidence for PDF processing
  };
}

async function processSpreadsheetWithAI(fileData: Blob, document: any) {
  console.log('Processing spreadsheet with AI...');
  
  // Simular processamento de planilha (implementação completa dependeria de biblioteca específica)
  const arrayBuffer = await fileData.arrayBuffer();
  const text = new TextDecoder().decode(arrayBuffer);
  
  // Usar OpenAI para analisar texto da planilha
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analise este conteúdo de planilha e extraia dados estruturados para um sistema ESG.
          Identifique colunas, linhas de dados e converta para JSON estruturado.
          Procure por padrões como: datas, quantidades, tipos de resíduo, MTRs, consumos, etc.`
        },
        {
          role: 'user',
          content: `Arquivo: ${document.file_name}\nConteúdo:\n${text.substring(0, 3000)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    })
  });

  const result = await response.json();
  
  let extractedData = {};
  try {
    const jsonMatch = result.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    extractedData = { raw_analysis: result.choices[0].message.content };
  }

  return {
    data: extractedData,
    confidence: 0.9 // Higher confidence for structured data
  };
}

async function detectDocumentCategory(extractedData: any, document: any) {
  const fileName = document.file_name.toLowerCase();
  const dataStr = JSON.stringify(extractedData).toLowerCase();

  // Lógica de detecção de categoria
  if (fileName.includes('energia') || fileName.includes('eletrica') || 
      dataStr.includes('kwh') || dataStr.includes('energia')) {
    return 'energy_invoice';
  }
  
  if (fileName.includes('residuo') || fileName.includes('mtr') || 
      dataStr.includes('residuo') || dataStr.includes('mtr')) {
    return 'waste_document';
  }
  
  if (fileName.includes('combustivel') || fileName.includes('gasolina') || 
      dataStr.includes('litros') || dataStr.includes('combustivel')) {
    return 'fuel_invoice';
  }
  
  if (fileName.includes('licenca') || dataStr.includes('licenca')) {
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
    // Scores mais altos para campos numéricos e datas
    if (typeof extractedData[key] === 'number') {
      scores[key] = Math.min(baseConfidence + 0.1, 1.0);
    } else if (key.includes('data') || key.includes('date')) {
      scores[key] = Math.min(baseConfidence + 0.05, 1.0);
    } else {
      scores[key] = baseConfidence;
    }
  }
  
  return scores;
}

function generateSuggestedMappings(extractedData: any, category: string): any {
  const mappings = {};
  
  if (category === 'energy_invoice') {
    for (const key in extractedData) {
      if (key.includes('kwh') || key.includes('consumo')) {
        mappings[key] = 'quantity';
      } else if (key.includes('periodo') || key.includes('data')) {
        mappings[key] = 'period_start_date';
      }
    }
  } else if (category === 'waste_document') {
    for (const key in extractedData) {
      if (key.includes('quantidade') || key.includes('peso')) {
        mappings[key] = 'quantity';
      } else if (key.includes('mtr')) {
        mappings[key] = 'mtr_number';
      }
    }
  }
  
  return mappings;
}

function getProcessingType(fileType: string): string {
  if (fileType.includes('pdf')) return 'ocr_pdf';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'excel_parse';
  if (fileType.includes('csv')) return 'csv_parse';
  return 'unknown';
}

async function handleGetStatus(req: Request, supabase: any, companyId: string) {
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');

  if (!jobId) {
    throw new Error('Job ID required');
  }

  const { data: job, error } = await supabase
    .from('document_extraction_jobs')
    .select(`
      *,
      extracted_data_preview (*)
    `)
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

async function handleApproveData(req: Request, supabase: any, companyId: string, userId: string) {
  const { previewId, finalData } = await req.json();

  // Buscar dados do preview
  const { data: preview, error: previewError } = await supabase
    .from('extracted_data_preview')
    .select('*')
    .eq('id', previewId)
    .eq('company_id', companyId)
    .single();

  if (previewError || !preview) {
    throw new Error('Preview data not found');
  }

  // Inserir dados na tabela final
  const targetTable = preview.target_table;
  const dataToInsert = {
    ...finalData,
    company_id: companyId,
    user_id: userId
  };

  const { error: insertError } = await supabase
    .from(targetTable)
    .insert(dataToInsert);

  if (insertError) {
    throw new Error(`Failed to insert data: ${insertError.message}`);
  }

  // Atualizar status do preview
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
    message: 'Data approved and imported successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleRejectData(req: Request, supabase: any, companyId: string, userId: string) {
  const { previewId, rejectionNotes } = await req.json();

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
    throw new Error('Failed to reject data');
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Data rejected successfully' 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}