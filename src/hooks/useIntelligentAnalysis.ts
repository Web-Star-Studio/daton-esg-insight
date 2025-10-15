// Intelligent Analysis Hook - Análise avançada de arquivos com IA
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateExtractedData, validateESGData, formatValidationReport } from '@/utils/dataValidator';
import { ActionCardData } from '@/components/ai/ActionCard';
import { DataQualityScore } from '@/components/ai/DataQualityBadge';
import { useToast } from '@/hooks/use-toast';

export interface IntelligentAnalysisResult {
  summary: string;
  actionCards: ActionCardData[];
  dataQuality?: DataQualityScore;
  extractedData?: any[];
  visualizations?: any[];
  validationReport?: string;
}

export function useIntelligentAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  /**
   * Analisa arquivo com validação e geração de insights
   */
  const analyzeFile = useCallback(async (
    file: File,
    filePath: string
  ): Promise<IntelligentAnalysisResult> => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Step 1: Parse document (20%)
      setAnalysisProgress(20);
      const { data: parseData, error: parseError } = await supabase.functions.invoke(
        'parse-chat-document',
        {
          body: {
            filePath,
            fileType: file.type,
            useVision: false
          }
        }
      );

      if (parseError) throw parseError;

      // Step 2: Classify document (40%)
      setAnalysisProgress(40);
      const { data: classifyData, error: classifyError } = await supabase.functions.invoke(
        'intelligent-document-classifier',
        {
          body: {
            fileName: file.name,
            fileType: file.type,
            content: parseData?.content || ''
          }
        }
      );

      if (classifyError) throw classifyError;

      // Step 3: Extract structured data (60%)
      setAnalysisProgress(60);
      const { data: extractData, error: extractError } = await supabase.functions.invoke(
        'advanced-document-extractor',
        {
          body: {
            filePath,
            fileType: file.type,
            classificationType: classifyData?.documentType || 'generic'
          }
        }
      );

      if (extractError) throw extractError;

      // Step 4: Validate data (80%)
      setAnalysisProgress(80);
      let validationResult;
      let dataQuality: DataQualityScore | undefined;
      let validationReport: string | undefined;

      if (extractData?.extractedRecords && Array.isArray(extractData.extractedRecords)) {
        // Determine ESG category based on classification
        const categoryMap: Record<string, 'emissions' | 'waste' | 'energy' | 'water' | 'social'> = {
          'emissions_report': 'emissions',
          'emissions_spreadsheet': 'emissions',
          'waste_invoice': 'waste',
          'waste_management': 'waste',
          'energy_invoice': 'energy',
          'employee_spreadsheet': 'social'
        };

        const esgCategory = categoryMap[classifyData?.documentType];

        if (esgCategory) {
          validationResult = validateESGData(extractData.extractedRecords, esgCategory);
        } else {
          validationResult = validateExtractedData(extractData.extractedRecords);
        }

        dataQuality = validationResult.quality;
        validationReport = formatValidationReport(validationResult);
      }

      // Step 5: Generate action cards (100%)
      setAnalysisProgress(100);
      const actionCards = generateActionCards(
        classifyData,
        extractData,
        validationResult
      );

      // Build summary
      const summary = buildIntelligentSummary(
        file,
        classifyData,
        extractData,
        validationResult
      );

      return {
        summary,
        actionCards,
        dataQuality,
        extractedData: extractData?.extractedRecords,
        validationReport
      };

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar o arquivo completamente.',
        variant: 'destructive'
      });

      return {
        summary: 'Erro ao analisar arquivo. Dados básicos foram extraídos.',
        actionCards: []
      };
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [toast]);

  return {
    analyzeFile,
    isAnalyzing,
    analysisProgress
  };
}

/**
 * Gera Action Cards baseados na análise
 */
function generateActionCards(
  classification: any,
  extraction: any,
  validation: any
): ActionCardData[] {
  const cards: ActionCardData[] = [];
  const recordCount = extraction?.extractedRecords?.length || 0;

  // Card 1: Import Data
  if (recordCount > 0 && validation?.isValid) {
    cards.push({
      id: 'import_data',
      title: `Importar ${recordCount} registro(s)`,
      description: `Os dados foram validados e estão prontos para importação no sistema.`,
      category: 'import',
      priority: 'high',
      confidence: validation.quality.score / 100,
      estimatedImpact: 'Alto',
      action: {
        label: 'Importar Dados',
        prompt: `Importar os ${recordCount} registros extraídos do arquivo para o sistema`
      },
      metadata: {
        dataPoints: recordCount,
        timeframe: 'Imediato'
      }
    });
  }

  // Card 2: Data Quality Issues
  if (validation && validation.quality.issues.length > 0) {
    const criticalIssues = validation.quality.issues.filter((i: any) => i.severity === 'high').length;
    
    cards.push({
      id: 'fix_quality',
      title: `Corrigir ${validation.quality.issues.length} problema(s) de qualidade`,
      description: `${criticalIssues} crítico(s). Recomendamos revisar antes de importar.`,
      category: 'alert',
      priority: criticalIssues > 0 ? 'high' : 'medium',
      confidence: 0.95,
      action: {
        label: 'Ver Detalhes',
        prompt: 'Mostrar detalhes dos problemas de qualidade e como corrigi-los'
      },
      metadata: {
        affectedItems: validation.quality.issues.length
      }
    });
  }

  // Card 3: Create Goals (if goals data detected)
  if (classification?.documentType === 'goals_spreadsheet' && recordCount > 0) {
    cards.push({
      id: 'create_goals',
      title: 'Criar metas ESG',
      description: 'Detectamos metas no arquivo. Cadastre-as no sistema para acompanhamento.',
      category: 'create',
      priority: 'high',
      estimatedImpact: 'Estratégico',
      action: {
        label: 'Cadastrar Metas',
        prompt: 'Criar metas ESG baseadas nos dados extraídos'
      },
      metadata: {
        dataPoints: recordCount
      }
    });
  }

  // Card 4: Schedule Tasks (if license detected)
  if (classification?.documentType === 'environmental_license' && extraction?.extractedRecords) {
    const hasExpiry = extraction.extractedRecords.some((r: any) => 
      r.expiration_date || r.validade || r.vencimento
    );
    
    if (hasExpiry) {
      cards.push({
        id: 'schedule_renewal',
        title: 'Agendar renovação de licença',
        description: 'Configure alertas para renovação antes do vencimento.',
        category: 'schedule',
        priority: 'high',
        action: {
          label: 'Criar Lembrete',
          prompt: 'Configurar alertas de renovação para as licenças detectadas'
        }
      });
    }
  }

  // Card 5: Analyze Trends (if numeric data)
  if (recordCount > 10 && extraction?.extractedRecords) {
    const hasNumericData = extraction.extractedRecords.some((r: any) =>
      Object.values(r).some(v => typeof v === 'number' || !isNaN(parseFloat(v as string)))
    );

    if (hasNumericData) {
      cards.push({
        id: 'analyze_trends',
        title: 'Analisar tendências',
        description: 'Gerar visualizações e identificar padrões nos dados.',
        category: 'analyze',
        priority: 'medium',
        estimatedImpact: 'Insights valiosos',
        action: {
          label: 'Gerar Análise',
          prompt: 'Analisar tendências e padrões nos dados extraídos'
        },
        metadata: {
          dataPoints: recordCount
        }
      });
    }
  }

  // Card 6: Opportunities
  if (classification?.suggestedActions && classification.suggestedActions.length > 0) {
    cards.push({
      id: 'opportunities',
      title: 'Oportunidades identificadas',
      description: classification.suggestedActions[0] || 'Ações recomendadas baseadas na análise.',
      category: 'opportunity',
      priority: 'low',
      action: {
        label: 'Ver Oportunidades',
        prompt: 'Mostrar oportunidades de melhoria identificadas na análise'
      }
    });
  }

  return cards.slice(0, 5); // Return top 5 most relevant
}

/**
 * Constrói resumo inteligente da análise
 */
function buildIntelligentSummary(
  file: File,
  classification: any,
  extraction: any,
  validation: any
): string {
  const fileName = file.name;
  const fileSize = (file.size / 1024).toFixed(1);
  const docType = classification?.documentType || 'desconhecido';
  const category = classification?.category || 'Não classificado';
  const confidence = Math.round((classification?.confidence || 0) * 100);
  const recordCount = extraction?.extractedRecords?.length || 0;
  const qualityScore = validation?.quality?.score || 0;

  let summary = `# 📊 Análise Inteligente Concluída\n\n`;
  summary += `**Arquivo:** ${fileName} (${fileSize} KB)\n`;
  summary += `**Tipo Detectado:** ${category} (${confidence}% confiança)\n\n`;

  if (recordCount > 0) {
    summary += `## ✅ Dados Extraídos\n`;
    summary += `- **${recordCount}** registros identificados\n`;
    summary += `- **Qualidade:** ${qualityScore}/100 `;
    
    if (qualityScore >= 90) summary += '🟢 Excelente\n';
    else if (qualityScore >= 70) summary += '🟡 Boa\n';
    else if (qualityScore >= 50) summary += '🟠 Regular\n';
    else summary += '🔴 Baixa - Requer revisão\n';
    
    summary += `\n`;
  }

  if (validation && validation.errors.length > 0) {
    summary += `## ⚠️ Atenção Necessária\n`;
    summary += `- **${validation.errors.length}** erro(s) detectado(s)\n`;
    summary += `- **${validation.warnings.length}** aviso(s) de qualidade\n\n`;
  }

  if (classification?.suggestedActions && classification.suggestedActions.length > 0) {
    summary += `## 💡 Próximos Passos Sugeridos\n`;
    classification.suggestedActions.slice(0, 3).forEach((action: string, idx: number) => {
      summary += `${idx + 1}. ${action}\n`;
    });
    summary += `\n`;
  }

  summary += `---\n`;
  summary += `*Análise realizada com IA. Revise os dados antes de importar.*`;

  return summary;
}
