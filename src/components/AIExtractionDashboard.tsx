// Enhanced AIExtractionDashboard with Smart Cache and React.memo optimization
import React, { useState, memo, useCallback } from 'react';
import { EnhancedLoading } from '@/components/EnhancedLoading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Database
} from 'lucide-react';
import { 
  getExtractionJobs, 
  getPendingExtractions, 
  getAIProcessingStats,
  formatConfidenceScore,
  getConfidenceBadgeVariant,
  getDocumentTypeLabel
} from '@/services/documentAI';
import type { ExtractionJob, ExtractedDataPreview } from '@/services/documentAI';
import { ExtractedDataReviewCard } from './ExtractedDataReviewCard';
import { toast } from 'sonner';
import { useSmartCache } from '@/hooks/useSmartCache';

interface AIExtractionDashboardProps {
  className?: string;
}

const AIExtractionDashboardComponent: React.FC<AIExtractionDashboardProps> = ({ className }) => {
  const [selectedExtraction, setSelectedExtraction] = useState<ExtractedDataPreview | null>(null);

  // Smart cache for extraction jobs (high priority)
  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useSmartCache<ExtractionJob[]>({
    queryKey: ['ai-extraction-jobs'],
    queryFn: async () => {
      try {
        return await getExtractionJobs();
      } catch (error) {
        console.error('Error loading jobs:', error);
        return [];
      }
    },
    priority: 'high',
    staleTime: 30000, // 30 seconds
  });

  // Smart cache for pending extractions (high priority)
  const { data: pendingExtractions = [], isLoading: pendingLoading, refetch: refetchPending } = useSmartCache<ExtractedDataPreview[]>({
    queryKey: ['ai-pending-extractions'],
    queryFn: async () => {
      try {
        return await getPendingExtractions();
      } catch (error) {
        console.error('Error loading pending:', error);
        return [];
      }
    },
    priority: 'high',
    staleTime: 20000, // 20 seconds
    preloadRelated: [['ai-extraction-jobs']],
  });

  // Smart cache for stats (high priority)
  const { data: stats = { totalProcessed: 0, pendingApproval: 0, approved: 0, rejected: 0, averageConfidence: 0 }, isLoading: statsLoading } = useSmartCache({
    queryKey: ['ai-processing-stats'],
    queryFn: async () => {
      try {
        return await getAIProcessingStats();
      } catch (error) {
        console.error('Error loading stats:', error);
        return { totalProcessed: 0, pendingApproval: 0, approved: 0, rejected: 0, averageConfidence: 0 };
      }
    },
    priority: 'high',
    staleTime: 30000,
  });

  const loading = jobsLoading || pendingLoading || statsLoading;

  const handleDataUpdate = useCallback(() => {
    refetchJobs();
    refetchPending();
    setSelectedExtraction(null);
  }, [refetchJobs, refetchPending]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'Processando':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'Concluído':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusVariant = useCallback((status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Processando':
        return 'secondary';
      case 'Concluído':
        return 'default';
      case 'Erro':
        return 'destructive';
      default:
        return 'outline';
    }
  }, []);

  const getDocumentName = useCallback((extraction: ExtractedDataPreview): string => {
    // Handle both foreign key relationship and fallback with type safety
    try {
      if (extraction.extraction_job && 
          typeof extraction.extraction_job === 'object' && 
          !('error' in extraction.extraction_job)) {
        const job = extraction.extraction_job as any;
        if (job.document && job.document.file_name) {
          return job.document.file_name;
        }
      }
    } catch (error) {
      console.warn('Error accessing extraction job data:', error);
    }
    
    // Fallback to extraction job ID
    return `Documento ${extraction.extraction_job_id?.toString().slice(-6) || extraction.id.slice(-6)}`;
  }, []);

  if (loading) {
    return <EnhancedLoading message="Carregando dashboard IA..." />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processados</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
            <p className="text-xs text-muted-foreground">Total de documentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Dados integrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Processamento falhou</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatConfidenceScore(stats.averageConfidence)}</div>
            <p className="text-xs text-muted-foreground">Média de precisão</p>
          </CardContent>
        </Card>
      </div>

      {/* Selected Extraction Detail */}
      {selectedExtraction && (
        <ExtractedDataReviewCard
          extraction={selectedExtraction}
          onUpdate={() => {
            handleDataUpdate();
            setSelectedExtraction(null);
          }}
        />
      )}

      {/* Pending Extractions */}
      {pendingExtractions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Dados Aguardando Aprovação ({pendingExtractions.length})
            </CardTitle>
            <CardDescription>
              Revise e aprove os dados extraídos pela IA antes da integração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingExtractions.map((extraction) => {
              const avgConfidence = Object.values(extraction.confidence_scores || {}).length > 0
                ? Object.values(extraction.confidence_scores as Record<string, number>).reduce((a, b) => a + b, 0) / 
                  Object.values(extraction.confidence_scores as Record<string, number>).length
                : 0.7;

              return (
                <div key={extraction.id} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {getDocumentName(extraction)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getDocumentTypeLabel(extraction.target_table)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(extraction.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getConfidenceBadgeVariant(avgConfidence)}>
                        {formatConfidenceScore(avgConfidence)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedExtraction(extraction)}
                      >
                        Revisar
                      </Button>
                    </div>
                  </div>

                  {/* Preview of extracted data */}
                  <div className="bg-muted/50 rounded p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Dados Extraídos:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(extraction.extracted_fields || {}).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium truncate ml-2">
                            {String(value).slice(0, 20)}{String(value).length > 20 ? '...' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    {Object.keys(extraction.extracted_fields || {}).length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        +{Object.keys(extraction.extracted_fields || {}).length - 4} campos adicionais
                      </p>
                    )}
                  </div>

                  {avgConfidence < 0.6 && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">
                        Este documento possui baixa confiança e requer revisão cuidadosa
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum documento pendente</h3>
            <p className="text-muted-foreground">
              Todos os documentos processados pela IA foram revisados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Jobs de Processamento Recentes
          </CardTitle>
          <CardDescription>
            Histórico dos últimos processamentos de documentos com IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum processamento IA encontrado</p>
              <p className="text-sm">Envie documentos com processamento IA habilitado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 10).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium">
                        Job {job.id.slice(-8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {job.processing_type}
                    </Badge>
                    
                    {job.confidence_score && (
                      <Badge variant={getConfidenceBadgeVariant(job.confidence_score)}>
                        {formatConfidenceScore(job.confidence_score)}
                      </Badge>
                    )}
                    
                    <Badge variant={getStatusVariant(job.status)} className="text-xs">
                      {job.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Export memoized component for performance
export const AIExtractionDashboard = memo(AIExtractionDashboardComponent);