import { supabase } from '@/integrations/supabase/client';
import { parseFileClientSide } from '@/utils/clientSideParsers';
import { sendToAnthropic, getApiKey } from '@/utils/anthropicClient';
import { toast } from 'sonner';

export interface DocumentProcessingResult {
  success: boolean;
  jobId?: string;
  previewId?: string;
  error?: string;
  summary?: {
    document_type?: string;
    esg_relevance?: number;
    overall_confidence?: number;
    auto_inserted?: boolean;
    records_inserted?: number;
    requires_review?: boolean;
  };
}

export class DocumentClientProcessor {
  private apiKey: string | null;

  constructor() {
    this.apiKey = getApiKey();
  }

  async processDocument(documentId: string): Promise<DocumentProcessingResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API Key do Anthropic não configurada. Configure nas configurações do chat.'
      };
    }

    try {
      // 1. Get document from database
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Documento não encontrado');
      }

      // 2. Get user company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Perfil não encontrado');
      }

      // 3. Create extraction job
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

      // 4. Download file from storage
      const { data: fileData, error: downloadError } = await supabase
        .storage
        .from('documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        throw new Error('Falha ao baixar arquivo do storage');
      }

      // 5. Convert blob to File
      const file = new File([fileData], document.file_name, { type: document.file_type });

      // 6. Parse file client-side
      const parseResult = await parseFileClientSide(file);

      if (!parseResult.success) {
        // Update job status to failed
        await supabase
          .from('document_extraction_jobs')
          .update({
            status: 'Erro',
            error_message: parseResult.error || 'Falha no parse do documento'
          })
          .eq('id', job.id);

        return {
          success: false,
          jobId: job.id,
          error: parseResult.error || 'Falha ao processar arquivo'
        };
      }

      // 7. Analyze with Anthropic AI
      const analysisPrompt = this.buildAnalysisPrompt(
        document.file_name,
        parseResult.content || '',
        parseResult.structured
      );

      const aiResponse = await sendToAnthropic([
        {
          role: 'user',
          content: analysisPrompt
        }
      ], this.apiKey);

      // 8. Parse AI response
      const analysis = this.parseAIResponse(aiResponse.content);

      // 9. Create extracted data preview
      const { data: preview, error: previewError } = await supabase
        .from('extracted_data_preview')
        .insert({
          company_id: profile.company_id,
          extraction_job_id: job.id,
          extracted_fields: analysis.extractedFields,
          confidence_scores: analysis.confidenceScores,
          target_table: analysis.targetTable || 'generic_data',
          validation_status: 'Pendente',
          suggested_mappings: analysis.suggestedMappings
        })
        .select()
        .single();

      if (previewError) {
        console.error('Error creating preview:', previewError);
      }

      // 10. Update job status
      await supabase
        .from('document_extraction_jobs')
        .update({
          status: 'Concluído',
          confidence_score: analysis.overallConfidence,
          result_data: {
            document_type: analysis.documentType,
            esg_relevance: analysis.esgRelevance,
            field_count: Object.keys(analysis.extractedFields).length
          }
        })
        .eq('id', job.id);

      // 11. Update document AI status
      await supabase
        .from('documents')
        .update({
          ai_processing_status: 'completed',
          ai_confidence_score: analysis.overallConfidence,
          ai_extracted_category: analysis.documentType
        })
        .eq('id', documentId);

      return {
        success: true,
        jobId: job.id,
        previewId: preview?.id,
        summary: {
          document_type: analysis.documentType,
          esg_relevance: analysis.esgRelevance,
          overall_confidence: analysis.overallConfidence,
          requires_review: analysis.overallConfidence < 0.8
        }
      };

    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no processamento'
      };
    }
  }

  private buildAnalysisPrompt(fileName: string, content: string, structured?: any): string {
    let prompt = `Analise o seguinte documento e extraia informações estruturadas.

Documento: ${fileName}

`;

    if (structured) {
      prompt += `Dados estruturados:
- Total de linhas: ${structured.totalRows}
- Colunas: ${structured.headers?.join(', ') || 'N/A'}

Primeiras linhas:
${JSON.stringify(structured.records?.slice(0, 5), null, 2)}

`;
    } else {
      prompt += `Conteúdo:
${content.slice(0, 3000)}

`;
    }

    prompt += `
Por favor, retorne uma análise em formato JSON com a seguinte estrutura:
{
  "documentType": "tipo do documento (ex: invoice, contract, report, spreadsheet)",
  "esgRelevance": número de 0-100 indicando relevância ESG,
  "overallConfidence": número de 0-1 indicando confiança geral,
  "extractedFields": {
    "campo1": "valor1",
    "campo2": "valor2"
  },
  "confidenceScores": {
    "campo1": 0.95,
    "campo2": 0.87
  },
  "targetTable": "nome da tabela sugerida para inserção",
  "suggestedMappings": {
    "campo_documento": "campo_banco"
  }
}

Retorne APENAS o JSON, sem texto adicional.`;

    return prompt;
  }

  private parseAIResponse(response: string): {
    documentType: string;
    esgRelevance: number;
    overallConfidence: number;
    extractedFields: Record<string, any>;
    confidenceScores: Record<string, number>;
    targetTable?: string;
    suggestedMappings?: Record<string, string>;
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        documentType: parsed.documentType || 'unknown',
        esgRelevance: parsed.esgRelevance || 0,
        overallConfidence: parsed.overallConfidence || 0.5,
        extractedFields: parsed.extractedFields || {},
        confidenceScores: parsed.confidenceScores || {},
        targetTable: parsed.targetTable,
        suggestedMappings: parsed.suggestedMappings
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      // Return fallback values
      return {
        documentType: 'unknown',
        esgRelevance: 0,
        overallConfidence: 0.3,
        extractedFields: { raw_content: response.slice(0, 500) },
        confidenceScores: { raw_content: 0.3 }
      };
    }
  }
}
