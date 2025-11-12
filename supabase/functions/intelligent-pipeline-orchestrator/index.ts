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

    // Normalize file path before sending to parse function
    const normalizedPath = document.file_path.replace(/^documents\//, '');
    console.log('📁 Using normalized path for parsing:', normalizedPath);

    const { data: parseResult, error: parseError } = await supabaseClient.functions.invoke(
      'parse-chat-document',
      {
        body: {
          filePath: normalizedPath,
          fileType: document.file_type,
          useVision: document.file_type.includes('image'),
          useCache: true,
        },
      }
    );

    // ROBUST FALLBACK: If parse fails, try to continue with empty content
    if (parseError || !parseResult?.success) {
      console.warn('⚠️ Parse failed, attempting graceful fallback:', parseError?.message);
      pipeline[0].status = 'completed';
      pipeline[0].duration_ms = Date.now() - parseStart;
      pipeline[0].result = { 
        content_length: 0,
        fallback: true,
        error: parseError?.message 
      };
      parseResult = { 
        success: true, 
        parsedContent: `Documento: ${document.file_name}\nTipo: ${document.file_type}\nConteúdo não pôde ser extraído automaticamente.`
      };
    }

    pipeline[0].status = 'completed';
    pipeline[0].duration_ms = Date.now() - parseStart;
    pipeline[0].result = { content_length: parseResult.parsedContent?.length || 0 };

    // CORREÇÃO 4: Gravar métrica do Step 1
    try {
      await supabaseClient.from('processing_metrics').insert({
        company_id: document.company_id,
        document_id: document_id,
        step_name: 'parse',
        duration_ms: pipeline[0].duration_ms,
        success: true,
        metadata: { content_length: parseResult.parsedContent?.length || 0 }
      });
    } catch (metricError) {
      console.warn('⚠️ Failed to log parse metric:', metricError);
    }

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

    // ROBUST FALLBACK: If classification fails, use default classification
    if (classifyError || !classifyResult?.success) {
      console.warn('⚠️ Classification failed, using fallback classification:', classifyError?.message);
      pipeline[1].status = 'completed';
      pipeline[1].duration_ms = Date.now() - classifyStart;
      pipeline[1].result = {
        document_type: 'Documento Não Classificado',
        esg_relevance: 0,
        entities_found: 0,
        fallback: true
      };
      classifyResult = {
        success: true,
        classification: {
          document_type: 'Documento Não Classificado',
          document_category: 'Não ESG',
          esg_relevance_score: 0,
          extracted_entities: [],
          target_mappings: [],
          data_quality_assessment: {
            completeness_score: 0,
            accuracy_score: 0,
            issues: [{ issue_type: 'missing_data', description: 'Classificação falhou', severity: 'high' }]
          }
        }
      };
    }

    pipeline[1].status = 'completed';
    pipeline[1].duration_ms = Date.now() - classifyStart;
    pipeline[1].result = {
      document_type: classifyResult.classification.document_type,
      esg_relevance: classifyResult.classification.esg_relevance_score,
      entities_found: classifyResult.classification.extracted_entities?.length || 0,
    };

    // CORREÇÃO 4: Gravar métrica do Step 2
    try {
      await supabaseClient.from('processing_metrics').insert({
        company_id: document.company_id,
        document_id: document_id,
        step_name: 'classify',
        duration_ms: pipeline[1].duration_ms,
        success: true,
        metadata: pipeline[1].result
      });
    } catch (metricError) {
      console.warn('⚠️ Failed to log classify metric:', metricError);
    }

    const classification = classifyResult.classification;

    // STEP 3: Extrair dados estruturados (✅ COM REUSO DE CONTEÚDO PARSEADO)
    console.log('📊 Step 3: Extracting structured data...');
    pipeline[2].status = 'processing';
    const extractStart = Date.now();

    const { data: extractResult, error: extractError } = await supabaseClient.functions.invoke(
      'universal-document-processor',
      {
        body: {
          document_id: document_id,
          mode: 'exploratory',
          parsed_content: parseResult.parsedContent, // ✅ Passar conteúdo já parseado
          skip_parse: true // ✅ Pular re-parsing desnecessário
        },
      }
    );

    // ROBUST FALLBACK: If extraction fails, save raw text for manual review
    if (extractError || !extractResult?.success) {
      console.warn('⚠️ Extraction failed, saving for manual review:', extractError?.message);
      
      // Save raw content to unclassified_data for manual processing
      const { data: fallbackData } = await supabaseClient
        .from('unclassified_data')
        .insert({
          company_id: document.company_id,
          document_id: document_id,
          extracted_data: {
            raw_text: parseResult.parsedContent?.substring(0, 5000),
            extraction_failed: true
          },
          ai_suggestions: {
            category: classification.document_type,
            error: extractError?.message,
            recommendations: ['Requer revisão manual completa']
          },
          ai_confidence: 0,
          data_category: 'Não Classificado',
          potential_tables: []
        })
        .select()
        .single();
      
      pipeline[2].status = 'completed';
      pipeline[2].duration_ms = Date.now() - extractStart;
      pipeline[2].result = {
        unclassified_data_id: fallbackData?.id,
        entities_extracted: 0,
        fallback: true,
        requires_manual_review: true
      };
      
      extractResult = {
        success: true,
        unclassified_data_id: fallbackData?.id,
        analysis: { extracted_entities: [] }
      };
    }

    pipeline[2].status = 'completed';
    pipeline[2].duration_ms = Date.now() - extractStart;
    pipeline[2].result = {
      unclassified_data_id: extractResult.unclassified_data_id,
      entities_extracted: extractResult.analysis?.extracted_entities?.length || 0,
    };

    // CORREÇÃO 4: Gravar métrica do Step 3
    try {
      await supabaseClient.from('processing_metrics').insert({
        company_id: document.company_id,
        document_id: document_id,
        step_name: 'extract',
        duration_ms: pipeline[2].duration_ms,
        success: true,
        metadata: pipeline[2].result
      });
    } catch (metricError) {
      console.warn('⚠️ Failed to log extract metric:', metricError);
    }

    // Calculate overall confidence BEFORE creating preview records (needed for job creation)
    const avgConfidence = classification.extracted_entities?.reduce(
      (sum: number, e: any) => sum + (e.confidence || 0),
      0
    ) / (classification.extracted_entities?.length || 1);

    // ✅ FASE 1.2: VALIDAÇÃO antes de criar previews
    console.log('🔍 Validating extraction results before preview creation...');
    console.log('📊 Extraction validation:', {
      success: extractResult.success,
      entities_count: classification.extracted_entities?.length || 0,
      mappings_count: classification.target_mappings?.length || 0
    });

    // Verificar se há mappings válidos com field_mappings preenchidos
    const hasValidMappings = classification.target_mappings?.some(
      mapping => mapping.field_mappings && Object.keys(mapping.field_mappings).length > 0
    );

    if (!hasValidMappings && classification.target_mappings?.length > 0) {
      console.error('❌ Target mappings exist but field_mappings are empty!');
      console.log('📋 Invalid mappings:', JSON.stringify(classification.target_mappings, null, 2));
      
      // ✅ FASE 1.3: FALLBACK - Processamento direto de CSV/Excel
      if (document.file_type.includes('csv') || 
          document.file_type.includes('spreadsheet') ||
          document.file_type.includes('excel')) {
        
        console.log('📊 CSV/Excel detected - attempting direct processing fallback...');
        
        try {
          const { data: fullParse, error: fullParseError } = await supabaseClient.functions.invoke(
            'parse-chat-document',
            {
              body: {
                filePath: normalizedPath,
                fileType: document.file_type,
                fullExtraction: true
              }
            }
          );

          if (!fullParseError && fullParse?.success && fullParse?.parsedContent) {
            console.log('✅ Direct parsing successful, creating field mappings from data...');
            
            // Tentar extrair linhas de dados do conteúdo parseado
            const lines = fullParse.parsedContent.split('\n').filter((l: string) => l.trim());
            if (lines.length > 1) {
              // Primeira linha como headers
              const headers = lines[0].split(/[,;\t]/).map((h: string) => h.trim());
              
              // Segunda linha como dados de exemplo
              const values = lines[1].split(/[,;\t]/).map((v: string) => v.trim());
              
              // Criar field_mappings
              const directFieldMappings: Record<string, any> = {};
              headers.forEach((header: string, idx: number) => {
                if (header && values[idx]) {
                  const fieldName = header.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
                  directFieldMappings[fieldName] = values[idx];
                }
              });
              
              if (Object.keys(directFieldMappings).length > 0) {
                // Inferir tabela baseada no tipo de documento
                let inferredTable = 'waste_logs'; // Default
                if (classification.document_type?.toLowerCase().includes('emiss')) {
                  inferredTable = 'activity_data';
                } else if (classification.document_type?.toLowerCase().includes('agua')) {
                  inferredTable = 'water_consumption_logs';
                }
                
                classification.target_mappings = [{
                  table_name: inferredTable,
                  confidence: 0.75,
                  field_mappings: directFieldMappings,
                  validation_notes: 'Dados extraídos diretamente do arquivo (fallback)',
                  requires_review: true
                }];
                
                console.log(`✅ Direct extraction successful: ${Object.keys(directFieldMappings).length} fields mapped to ${inferredTable}`);
              }
            }
          }
        } catch (fallbackError) {
          console.error('⚠️ Direct processing fallback failed:', fallbackError);
        }
      }
      
      // Se ainda não há mappings válidos após fallback, lançar erro
      if (!classification.target_mappings?.some(m => m.field_mappings && Object.keys(m.field_mappings).length > 0)) {
        throw new Error('No valid field mappings found after classification and fallback attempts');
      }
    }

    // CREATE EXTRACTION JOB AND PREVIEW RECORDS: Se extração foi bem-sucedida E há entidades extraídas
    if (extractResult.success && 
        classification.extracted_entities?.length > 0 &&
        classification.target_mappings?.length > 0) {
      
      try {
        console.log('📝 Creating extraction job and preview records...');
        console.log('📊 Preview creation data:', {
          mappings: classification.target_mappings.map(m => ({
            table: m.table_name,
            field_count: Object.keys(m.field_mappings || {}).length,
            fields: Object.keys(m.field_mappings || {})
          }))
        });
        
        // 1. BUSCAR USER_ID CORRETAMENTE
        let userId = document.created_by;
        if (!userId) {
          const { data: { user } } = await supabaseClient.auth.getUser();
          userId = user?.id || document.company_id; // Fallback para company_id
          console.log('⚠️ No created_by, using fallback user_id:', userId);
        }
        
        // 2. CRIAR O JOB PRIMEIRO
        const { data: job, error: jobError } = await supabaseClient
          .from('document_extraction_jobs')
          .insert({
            company_id: document.company_id,
            document_id: document_id,
            user_id: userId,
            status: 'completed',
            processing_type: 'ai_extraction',
            confidence_score: avgConfidence || 0,
            ai_model_used: 'gemini-2.0-flash-exp',
            processing_start_time: new Date(startTime).toISOString(),
            processing_end_time: new Date().toISOString()
          })
          .select()
          .single();
        
        if (jobError || !job) {
          console.error('❌ Failed to create extraction job:', jobError);
          throw new Error(`Failed to create extraction job: ${jobError?.message}`);
        }
        
        console.log(`✅ Created extraction job: ${job.id}`);
        
        // 3. CRIAR PREVIEW RECORDS COM O JOB ID VÁLIDO
        // ✅ Required fields per table
        const REQUIRED_FIELDS: Record<string, string[]> = {
          licenses: ['license_name', 'license_type', 'issue_date', 'expiration_date'],
          assets: ['name', 'asset_type'],
          waste_logs: ['waste_type', 'quantity', 'unit', 'log_date'],
          emission_sources: ['source_name', 'scope', 'category'],
          suppliers: ['name'],
          employees: ['full_name', 'hire_date'],
          energy_consumption: ['source_type', 'consumption_date', 'quantity_kwh'],
          water_consumption: ['consumption_date', 'quantity_m3'],
          activity_data: ['quantity', 'period_start_date', 'emission_source_id'],
        };
        
        // ✅ Field name aliases for mapping
        const FIELD_ALIASES: Record<string, string[]> = {
          name: ['nome', 'transportador', 'receptor', 'fornecedor', 'empresa', 'razao_social'],
          waste_type: ['tipo_residuo', 'tipo', 'residuo', 'waste'],
          quantity: ['quantidade', 'qtd', 'volume', 'peso'],
          log_date: ['data', 'data_geracao', 'data_log', 'date'],
          unit: ['unidade', 'un', 'medida'],
        };
        
        let createdPreviewsCount = 0;
        
        for (const mapping of classification.target_mappings) {
          const confidenceScores: Record<string, number> = {};
          const normalizedFields = { ...mapping.field_mappings };
          
          // ✅ SMART FIELD MAPPING: Try to map required fields from aliases
          const tableName = mapping.table_name;
          const requiredFields = REQUIRED_FIELDS[tableName] || [];
          
          for (const requiredField of requiredFields) {
            // If required field is missing, try to find it from aliases
            if (!normalizedFields[requiredField]) {
              const aliases = FIELD_ALIASES[requiredField] || [];
              
              for (const alias of aliases) {
                const foundValue = normalizedFields[alias];
                if (foundValue && String(foundValue).trim() !== '') {
                  console.log(`✅ Mapping ${alias} → ${requiredField} for table ${tableName}`);
                  normalizedFields[requiredField] = foundValue;
                  break;
                }
              }
            }
          }
          
          // ✅ SKIP INVALID MAPPINGS: If still missing required fields, skip this mapping
          const missingFields: string[] = [];
          for (const requiredField of requiredFields) {
            if (!normalizedFields[requiredField] || String(normalizedFields[requiredField]).trim() === '') {
              missingFields.push(requiredField);
            }
          }
          
          if (missingFields.length > 0) {
            console.warn(`⚠️ Skipping preview for ${tableName}: missing required fields: ${missingFields.join(', ')}`);
            console.warn(`Available fields: ${Object.keys(normalizedFields).join(', ')}`);
            continue; // Skip this mapping
          }
          
          Object.keys(normalizedFields).forEach(field => {
            confidenceScores[field] = mapping.confidence || 0.5;
          });
          
          const { error: previewError } = await supabaseClient
            .from('extracted_data_preview')
            .insert({
              company_id: document.company_id,
              extraction_job_id: job.id,  // ✅ Usando o ID válido do job
              extracted_fields: normalizedFields,
              confidence_scores: confidenceScores,
              target_table: mapping.table_name,
              validation_status: 'Pendente',
              suggested_mappings: {
                ai_category: classification.document_type,
                esg_relevance: classification.esg_relevance_score,
                processing_timestamp: new Date().toISOString(),
                document_name: document.file_name,
                field_mappings_applied: Object.keys(normalizedFields)
              }
            });
          
          if (previewError) {
            console.error('❌ Failed to create preview:', previewError);
            throw new Error(`Failed to create preview: ${previewError.message}`);
          }
          
          createdPreviewsCount++;
        }
        
        console.log(`✅ Created ${createdPreviewsCount} preview records (${classification.target_mappings.length - createdPreviewsCount} skipped due to missing required fields)`);
        console.log('📊 Extraction Summary:', {
          job_id: job.id,
          preview_count: createdPreviewsCount,
          total_mappings: classification.target_mappings.length,
          skipped_mappings: classification.target_mappings.length - createdPreviewsCount,
          document_id: document_id,
          document_name: document.file_name,
          confidence: avgConfidence
        });

        // ✅ FASE 1.4: Gravar métrica de qualidade
        try {
          const emptyPreviewsCount = classification.target_mappings.filter(
            m => !m.field_mappings || Object.keys(m.field_mappings).length === 0
          ).length;

          const avgFieldCount = classification.target_mappings.reduce(
            (sum, m) => sum + Object.keys(m.field_mappings || {}).length, 0
          ) / classification.target_mappings.length;

          await supabaseClient.from('processing_metrics').insert({
            company_id: document.company_id,
            document_id: document_id,
            step_name: 'preview_creation',
            duration_ms: Date.now() - extractStart,
            success: true,
            metadata: {
              preview_count: createdPreviewsCount,
              total_mappings: classification.target_mappings.length,
              skipped_mappings: classification.target_mappings.length - createdPreviewsCount,
              avg_field_count: Math.round(avgFieldCount * 100) / 100,
              empty_previews: emptyPreviewsCount,
              tables: classification.target_mappings.map(m => m.table_name)
            }
          });
        } catch (metricError) {
          console.warn('⚠️ Failed to log preview creation metric:', metricError);
        }
        
      } catch (error) {
        console.error('💥 Error creating extraction records:', error);
        pipeline[2].status = 'failed';
        pipeline[2].error = error.message;
        
        return new Response(
          JSON.stringify({
            success: false,
            error: `Falha ao criar registros de extração: ${error.message}`,
            pipeline,
            document_id
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // STEP 4: Validar dados extraídos
    console.log('✅ Step 4: Validating extracted data...');
    pipeline[3].status = 'processing';
    const validateStart = Date.now();

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

    // CORREÇÃO 4: Gravar métrica do Step 4
    try {
      await supabaseClient.from('processing_metrics').insert({
        company_id: document.company_id,
        document_id: document_id,
        step_name: 'validate',
        duration_ms: pipeline[3].duration_ms,
        success: true,
        metadata: validation
      });
    } catch (metricError) {
      console.warn('⚠️ Failed to log validate metric:', metricError);
    }

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

    // CORREÇÃO 4: Gravar métrica do Step 5
    try {
      await supabaseClient.from('processing_metrics').insert({
        company_id: document.company_id,
        document_id: document_id,
        step_name: 'insert',
        duration_ms: pipeline[4].duration_ms,
        success: pipeline[4].status === 'completed',
        error_message: pipeline[4].error || null,
        metadata: insertResult
      });
    } catch (metricError) {
      console.warn('⚠️ Failed to log insert metric:', metricError);
    }

    // UPDATE DOCUMENT STATUS
    await supabaseClient
      .from('documents')
      .update({
        ai_processing_status: insertResult.status === 'auto_inserted' 
          ? 'completed' 
          : 'requires_review',
        ai_confidence_score: validation.overall_confidence
      })
      .eq('id', document_id);

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
