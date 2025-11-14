import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to determine target table based on document type
function determineTargetTable(documentType: string): string {
  const typeMapping: Record<string, string> = {
    'MTR': 'waste_logs',
    'Nota Fiscal': 'suppliers',
    'Licença': 'licenses',
    'Planilha de Dados': 'suppliers',
    'Contrato': 'suppliers',
    'Fatura': 'suppliers',
    'Relatório': 'suppliers',
    'Certificado': 'licenses'
  };
  
  return typeMapping[documentType] || 'suppliers'; // fallback to suppliers
}

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

    console.log('📄 Processing document:', {
      documentId,
      fileName: document.file_name,
      fileType: document.file_type,
      jobId: job.id
    });

    // 5. Download file from storage
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('❌ Download error:', downloadError);
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: `Falha ao baixar arquivo: ${downloadError?.message || 'Unknown error'}`
        })
        .eq('id', job.id);

      throw new Error('Falha ao baixar arquivo do storage');
    }

    console.log('✅ File downloaded, size:', fileData.size, 'bytes');

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

    console.log('🤖 Calling Lovable AI for analysis...');
    
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

    console.log('📡 AI Response status:', aiResponse.status);
    
    // Handle rate limits and payment errors
    if (aiResponse.status === 429) {
      console.error('❌ Rate limit exceeded');
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: 'Limite de requisições atingido. Tente novamente em alguns minutos.',
          processing_end_time: new Date().toISOString()
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
      console.error('❌ Payment required');
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: 'Créditos insuficientes. Adicione créditos em Settings → Workspace → Usage.',
          processing_end_time: new Date().toISOString()
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
      console.error('❌ AI Gateway error:', {
        status: aiResponse.status,
        error: errorText
      });
      
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: `Erro na API de IA: ${aiResponse.status}`,
          processing_end_time: new Date().toISOString()
        })
        .eq('id', job.id);
      
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
        console.log('✅ AI analysis parsed successfully:', {
          documentType: analysis.document_type,
          confidence: analysis.confidence,
          fieldsCount: Object.keys(analysis.extracted_fields || {}).length
        });
      } else {
        console.warn('⚠️ No JSON found in AI response, using fallback');
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
      console.error('❌ Failed to parse AI response:', parseError);
      analysis = {
        document_type: 'Erro no parse',
        esg_relevance: 0,
        confidence: 0,
        extracted_fields: {},
        entities: [],
        summary: 'Falha ao processar resposta da IA'
      };
    }

    // 10. Create extracted data preview with correct schema
    const targetTable = determineTargetTable(analysis.document_type || 'Desconhecido');
    
    console.log('💾 Creating data preview:', {
      jobId: job.id,
      documentId,
      targetTable,
      documentType: analysis.document_type,
      confidence: analysis.confidence
    });
    
    const { data: preview, error: previewError } = await supabase
      .from('extracted_data_preview')
      .insert({
        extraction_job_id: job.id,  // ✅ CORRECTED: was job_id
        company_id: profile.company_id,
        target_table: targetTable,   // ✅ ADDED: required field
        extracted_fields: analysis.extracted_fields || {},
        confidence_scores: {
          overall: analysis.confidence || 50,
          esg_relevance: analysis.esg_relevance || 0
        },
        suggested_mappings: {
          document_id: documentId,
          document_name: document.file_name,
          document_type: analysis.document_type,
          esg_relevance: analysis.esg_relevance,
          entities: analysis.entities || [],
          summary: analysis.summary || '',
          processing_timestamp: new Date().toISOString()
        },
        validation_status: 'Pendente'  // ✅ CORRECTED: was 'pending', should be 'Pendente'
      })
      .select()
      .single();

    if (previewError) {
      console.error('❌ Preview creation error:', {
        error: previewError,
        code: previewError.code,
        details: previewError.details,
        hint: previewError.hint,
        message: previewError.message
      });
      
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Erro',
          error_message: `Falha ao criar preview: ${previewError.message}`,
          processing_end_time: new Date().toISOString()
        })
        .eq('id', job.id);
        
      throw new Error(`Preview creation failed: ${previewError.message}`);
    }

    console.log('✅ Preview created successfully:', preview.id);

    // 11. Update job status
    console.log('✅ Updating job status to Concluído');
    
    await supabase
      .from('document_extraction_jobs')
      .update({
        status: 'Concluído',
        processed_records: 1,
        inserted_records: 0,
        error_records: 0,
        processing_end_time: new Date().toISOString()
      })
      .eq('id', job.id);

    console.log('🎉 Document processing completed successfully!');

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
    console.error('❌ Error in document-ai-processor:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
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
