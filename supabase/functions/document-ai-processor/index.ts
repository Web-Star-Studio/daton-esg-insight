import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      throw new Error('documentId é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get document from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Documento não encontrado');
    }

    // 2. Get authorization header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // 3. Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    // 4. Create extraction job
    const { data: job, error: jobError } = await supabase
      .from('document_extraction_jobs')
      .insert({
        document_id: documentId,
        processing_type: 'general_extraction',
        status: 'Processando',
        company_id: profile.company_id,
        user_id: user.id
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error('Falha ao criar job de processamento');
    }

    // 5. Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: 'Falha ao baixar arquivo do storage'
        })
        .eq('id', job.id);

      throw new Error('Falha ao baixar arquivo do storage');
    }

    // 6. Convert to text (basic parsing)
    const fileContent = await fileData.text();
    
    // 7. Build analysis prompt
    const analysisPrompt = `Analise o seguinte documento e extraia informações estruturadas.

Documento: ${document.file_name}
Tipo: ${document.file_type}

Conteúdo:
${fileContent.substring(0, 50000)} // Limit to 50k chars

Por favor, retorne um JSON com a seguinte estrutura:
{
  "document_type": "tipo do documento (ex: MTR, Nota Fiscal, Contrato)",
  "esg_relevance": 0-100 (relevância ESG),
  "confidence": 0-100 (confiança da análise),
  "extracted_fields": {
    // campos extraídos específicos do tipo de documento
  },
  "entities": ["entidade1", "entidade2"],
  "summary": "resumo do documento"
}`;

    // 8. Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente especializado em análise de documentos ESG. Sempre retorne respostas em formato JSON válido.' 
          },
          { role: 'user', content: analysisPrompt }
        ]
      })
    });

    // Handle rate limits and payment errors
    if (aiResponse.status === 429) {
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: 'Limite de requisições atingido. Tente novamente em alguns minutos.'
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'rate_limit',
          message: 'Limite de requisições atingido. Tente novamente em alguns minutos.' 
        }), 
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (aiResponse.status === 402) {
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: 'Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.'
        })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'payment_required',
          message: 'Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.' 
        }), 
        { 
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    // 9. Parse AI response
    let analysis;
    try {
      // Try to extract JSON from response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to default structure
        analysis = {
          document_type: 'Desconhecido',
          esg_relevance: 50,
          confidence: 50,
          extracted_fields: {},
          entities: [],
          summary: aiContent.substring(0, 500)
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        document_type: 'Erro no parse',
        esg_relevance: 0,
        confidence: 0,
        extracted_fields: {},
        entities: [],
        summary: 'Falha ao processar resposta da IA'
      };
    }

    // 10. Create extracted data preview
    const { data: preview, error: previewError } = await supabase
      .from('extracted_data_preview')
      .insert({
        job_id: job.id,
        document_id: documentId,
        extracted_fields: analysis.extracted_fields || {},
        confidence_score: analysis.confidence || 50,
        validation_status: 'pending',
        document_type: analysis.document_type || 'Desconhecido',
        company_id: profile.company_id,
        user_id: user.id
      })
      .select()
      .single();

    if (previewError) {
      console.error('Preview creation error:', previewError);
      throw new Error('Falha ao criar preview dos dados extraídos');
    }

    // 11. Update job status
    await supabase
      .from('document_extraction_jobs')
      .update({
        status: 'Concluído',
        processed_records: 1,
        inserted_records: 0,
        error_records: 0
      })
      .eq('id', job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        previewId: preview.id,
        summary: {
          document_type: analysis.document_type,
          esg_relevance: analysis.esg_relevance,
          overall_confidence: analysis.confidence,
          requires_review: true,
          auto_inserted: false,
          records_inserted: 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in document-ai-processor:', error);
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
