import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting document-ai-processor...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    supabaseClient.auth.setSession({ access_token: authHeader.replace('Bearer ', ''), refresh_token: '' })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      console.error('Unauthorized: No user found');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { document_id, processing_type } = await req.json()
    console.log('Processing document:', document_id, 'Type:', processing_type);

    // Get document info
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      console.error('Document not found:', docError);
      throw new Error('Document not found')
    }

    // Create job
    const { data: job, error: jobError } = await supabaseClient
      .from('document_extraction_jobs')
      .insert({
        document_id,
        processing_type: processing_type || 'general_extraction',
        status: 'Processando',
        company_id: user.id,
        user_id: user.id
      })
      .select()
      .single()

    if (jobError) {
      console.error('Failed to create job:', jobError);
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    console.log('Job created:', job.id);

    // Process document in background
    EdgeRuntime.waitUntil(processDocumentWithAI(supabaseClient, job.id, document, user.id));

    return new Response(JSON.stringify(job), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in document-ai-processor:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processDocumentWithAI(supabaseClient: any, jobId: string, document: any, userId: string) {
  try {
    console.log('Starting AI processing for job:', jobId);

    // 1. Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download file');
    }

    console.log('File downloaded, size:', fileData.size, 'type:', document.file_type);

    // 2. Extract content based on file type
    let extractedContent = '';
    let imageBase64 = '';

    if (document.file_type === 'application/pdf') {
      // For PDFs, call parse-chat-document
      const formData = new FormData();
      formData.append('file', fileData, document.file_name);
      
      const parseResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/parse-chat-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          filePath: document.file_path,
          fileType: document.file_type
        })
      });

      if (parseResponse.ok) {
        const parseResult = await parseResponse.json();
        extractedContent = parseResult.content || '';
      }
    } else if (document.file_type.startsWith('image/')) {
      // For images, convert to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      imageBase64 = `data:${document.file_type};base64,${base64}`;
    }

    console.log('Content extracted, length:', extractedContent.length, 'has image:', !!imageBase64);

    // 3. Analyze with Lovable AI
    const analysisPrompt = buildAnalysisPrompt(document.file_name, extractedContent);
    
    const aiMessages: any[] = [
      { role: "system", content: "Você é um assistente especializado em análise de documentos ESG e ambientais. Sua tarefa é extrair dados estruturados de documentos e sugerir onde no sistema eles devem ser registrados." },
      { role: "user", content: analysisPrompt }
    ];

    // Add image if available
    if (imageBase64) {
      aiMessages[1].content = [
        { type: "text", text: analysisPrompt },
        { type: "image_url", image_url: { url: imageBase64 } }
      ];
    }

    console.log('Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        tools: [{
          type: "function",
          function: {
            name: "extract_document_data",
            description: "Extrai dados estruturados do documento e sugere tabelas de destino",
            parameters: {
              type: "object",
              properties: {
                document_type: {
                  type: "string",
                  description: "Tipo identificado: licenca, relatorio_emissoes, nota_fiscal_residuos, consumo_energia, consumo_agua, etc."
                },
                confidence: {
                  type: "number",
                  description: "Confiança na identificação (0-100)"
                },
                suggested_tables: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tabelas sugeridas: licenses, emission_sources, waste_logs, energy_consumption, water_consumption, etc."
                },
                extracted_fields: {
                  type: "object",
                  description: "Campos extraídos organizados por tabela sugerida"
                },
                summary: {
                  type: "string",
                  description: "Resumo executivo do documento"
                }
              },
              required: ["document_type", "confidence", "suggested_tables", "extracted_fields", "summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_document_data" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log('Data extracted:', extractedData.document_type, 'confidence:', extractedData.confidence);

    // 4. Save extracted data preview
    const { error: previewError } = await supabaseClient
      .from('extracted_data_preview')
      .insert({
        job_id: jobId,
        document_id: document.id,
        company_id: document.company_id,
        user_id: userId,
        document_type: extractedData.document_type,
        suggested_tables: extractedData.suggested_tables,
        extracted_fields: extractedData.extracted_fields,
        confidence_score: extractedData.confidence / 100,
        summary: extractedData.summary,
        validation_status: 'Pendente'
      });

    if (previewError) {
      console.error('Failed to save preview:', previewError);
    }

    // 5. Update job status
    await supabaseClient
      .from('document_extraction_jobs')
      .update({
        status: 'Concluído',
        completed_at: new Date().toISOString(),
        confidence_score: extractedData.confidence / 100
      })
      .eq('id', jobId);

    console.log('Job completed successfully:', jobId);

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update job with error
    await supabaseClient
      .from('document_extraction_jobs')
      .update({
        status: 'Erro',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', jobId);
  }
}

function buildAnalysisPrompt(fileName: string, content: string): string {
  return `
Analise o seguinte documento e extraia informações estruturadas relevantes para um sistema de gestão ESG/Ambiental.

**Nome do arquivo:** ${fileName}

**Conteúdo do documento:**
${content ? content.substring(0, 8000) : 'Conteúdo não disponível em texto, analisar imagem.'}

**Instruções:**
1. Identifique o tipo de documento (licença ambiental, relatório de emissões, nota fiscal de resíduos, conta de energia, etc.)
2. Extraia TODOS os campos relevantes com seus valores exatos
3. Sugira as tabelas do sistema onde esses dados devem ser inseridos
4. Forneça uma confiança (0-100) na sua análise

**Tabelas disponíveis no sistema:**
- licenses: Licenças ambientais (license_name, license_number, license_type, issuing_body, issue_date, expiration_date, status)
- emission_sources: Fontes de emissão GEE (source_name, scope, category, fuel_type, location)
- activity_data: Dados de atividades com emissões (quantity, unit, period_start_date, period_end_date)
- waste_logs: Gestão de resíduos (waste_type, quantity, unit, treatment_method, disposal_site, log_date)
- energy_consumption: Consumo de energia (source_type, quantity_kwh, consumption_date, cost)
- water_consumption: Consumo de água (source, quantity_m3, consumption_date, cost)
- suppliers: Fornecedores (name, cnpj, category, status)

**Exemplo de resposta esperada:**
Se for uma licença ambiental, extraia: número da licença, órgão emissor, data de emissão, validade, condicionantes, etc.
Se for nota fiscal de resíduos, extraia: tipo de resíduo, quantidade, unidade, destinador, data, etc.

Seja preciso e extraia o máximo de informações úteis possível.
`;
}