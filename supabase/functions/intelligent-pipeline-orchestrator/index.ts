import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration_ms?: number;
  result?: any;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎯 Intelligent Pipeline Orchestrator: Starting...');

    const { document_id, auto_insert_threshold = 0.8 } = await req.json();

    if (!document_id) {
      throw new Error('document_id é obrigatório');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const pipeline: ProcessingStep[] = [
      { name: 'parse', status: 'pending' },
      { name: 'classify', status: 'pending' },
      { name: 'extract', status: 'pending' },
      { name: 'validate', status: 'pending' },
      { name: 'insert', status: 'pending' },
    ];

    const startTime = Date.now();

    // STEP 1: Parse documento
    console.log('📄 Step 1: Parsing document...');
    pipeline[0].status = 'processing';
    const parseStart = Date.now();

    const { data: document } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (!document) {
      throw new Error('Documento não encontrado');
    }

    const { data: parseResult, error: parseError } = await supabaseClient.functions.invoke(
      'parse-chat-document',
      {
        body: {
          filePath: document.file_path,
          fileType: document.file_type,
          useVision: document.file_type.includes('image'),
          useCache: true,
        },
      }
    );

    if (parseError || !parseResult?.success) {
      pipeline[0].status = 'failed';
      pipeline[0].error = parseError?.message || 'Parse failed';
      throw new Error(`Parse failed: ${parseError?.message}`);
    }

    pipeline[0].status = 'completed';
    pipeline[0].duration_ms = Date.now() - parseStart;
    pipeline[0].result = { content_length: parseResult.parsedContent?.length || 0 };

    // STEP 2: Classificar conteúdo
    console.log('🧠 Step 2: Classifying content...');
    pipeline[1].status = 'processing';
    const classifyStart = Date.now();

    const { data: classifyResult, error: classifyError } = await supabaseClient.functions.invoke(
      'smart-content-analyzer',
      {
        body: {
          content: parseResult.parsedContent,
          fileType: document.file_type,
          fileName: document.file_name,
          companyId: document.company_id,
        },
      }
    );

    if (classifyError || !classifyResult?.success) {
      pipeline[1].status = 'failed';
      pipeline[1].error = classifyError?.message || 'Classification failed';
      throw new Error(`Classification failed: ${classifyError?.message}`);
    }

    pipeline[1].status = 'completed';
    pipeline[1].duration_ms = Date.now() - classifyStart;
    pipeline[1].result = {
      document_type: classifyResult.classification.document_type,
      esg_relevance: classifyResult.classification.esg_relevance_score,
      entities_found: classifyResult.classification.extracted_entities?.length || 0,
    };

    const classification = classifyResult.classification;

    // STEP 3: Extrair dados estruturados
    console.log('📊 Step 3: Extracting structured data...');
    pipeline[2].status = 'processing';
    const extractStart = Date.now();

    const { data: extractResult, error: extractError } = await supabaseClient.functions.invoke(
      'universal-document-processor',
      {
        body: {
          document_id: document_id,
          mode: 'exploratory',
        },
      }
    );

    if (extractError || !extractResult?.success) {
      pipeline[2].status = 'failed';
      pipeline[2].error = extractError?.message || 'Extraction failed';
      throw new Error(`Extraction failed: ${extractError?.message}`);
    }

    pipeline[2].status = 'completed';
    pipeline[2].duration_ms = Date.now() - extractStart;
    pipeline[2].result = {
      unclassified_data_id: extractResult.unclassified_data_id,
      entities_extracted: extractResult.analysis?.extracted_entities?.length || 0,
    };

    // STEP 4: Validar dados extraídos
    console.log('✅ Step 4: Validating extracted data...');
    pipeline[3].status = 'processing';
    const validateStart = Date.now();

    // Calculate overall confidence
    const avgConfidence = classification.extracted_entities?.reduce(
      (sum: number, e: any) => sum + (e.confidence || 0),
      0
    ) / (classification.extracted_entities?.length || 1);

    const dataQuality = classification.data_quality_assessment;
    const hasIssues = dataQuality?.issues?.some((i: any) => i.severity === 'high') || false;

    const validation = {
      overall_confidence: avgConfidence,
      quality_score: dataQuality?.completeness_score || 0,
      has_critical_issues: hasIssues,
      requires_review: avgConfidence < auto_insert_threshold || hasIssues,
    };

    pipeline[3].status = 'completed';
    pipeline[3].duration_ms = Date.now() - validateStart;
    pipeline[3].result = validation;

    // STEP 5: Inserir dados (se confiança alta) ou enviar para revisão
    console.log('💾 Step 5: Inserting data or queueing for review...');
    pipeline[4].status = 'processing';
    const insertStart = Date.now();

    let insertResult: any = {};

    if (!validation.requires_review && classification.target_mappings?.length > 0) {
      // Auto-insert with intelligent-data-processor
      console.log('🚀 Auto-inserting with high confidence...');

      const operations = classification.target_mappings
        .filter((m: any) => m.confidence >= auto_insert_threshold)
        .map((mapping: any) => ({
          table: mapping.table_name,
          action: 'INSERT',
          data: mapping.field_mappings,
          deduplication: {
            check_fields: Object.keys(mapping.field_mappings).slice(0, 2),
            merge_strategy: 'skip_if_exists',
          },
          validation: {
            required_fields: Object.keys(mapping.field_mappings),
          },
        }));

      if (operations.length > 0) {
        const { data: processResult, error: processError } =
          await supabaseClient.functions.invoke('intelligent-data-processor', {
            body: {
              company_id: document.company_id,
              operations,
              execution_options: {
                auto_rollback: true,
                validate_before_insert: true,
                create_audit_log: true,
              },
            },
          });

        if (!processError && processResult?.success) {
          insertResult = {
            status: 'auto_inserted',
            records_inserted: processResult.records_inserted || 0,
            tables_affected: processResult.tables_affected || [],
          };
          pipeline[4].status = 'completed';
        } else {
          insertResult = {
            status: 'auto_insert_failed',
            error: processError?.message,
          };
          pipeline[4].status = 'failed';
          pipeline[4].error = processError?.message;
        }
      } else {
        insertResult = { status: 'no_operations', message: 'Nenhuma operação de alta confiança' };
        pipeline[4].status = 'completed';
      }
    } else {
      // Queue for manual review
      console.log('👁️ Queueing for manual review...');
      insertResult = {
        status: 'requires_review',
        reason: validation.requires_review
          ? 'Confiança abaixo do limiar ou problemas críticos'
          : 'Sem mapeamentos disponíveis',
        unclassified_data_id: extractResult.unclassified_data_id,
      };
      pipeline[4].status = 'completed';
    }

    pipeline[4].duration_ms = Date.now() - insertStart;
    pipeline[4].result = insertResult;

    const totalDuration = Date.now() - startTime;

    console.log(`✅ Pipeline completed in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        pipeline,
        total_duration_ms: totalDuration,
        final_status: insertResult.status,
        summary: {
          document_type: classification.document_type,
          esg_relevance: classification.esg_relevance_score,
          overall_confidence: validation.overall_confidence,
          auto_inserted: insertResult.status === 'auto_inserted',
          records_inserted: insertResult.records_inserted || 0,
          requires_review: insertResult.status === 'requires_review',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in intelligent-pipeline-orchestrator:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
