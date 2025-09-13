import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bot, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  getExtractionJobs, 
  getPendingExtractions, 
  getAIProcessingStats,
  approveExtractedData,
  rejectExtractedData,
  formatConfidenceScore,
  getConfidenceBadgeVariant,
  getDocumentTypeLabel
} from '@/services/documentAI';
import type { ExtractionJob, ExtractedDataPreview } from '@/services/documentAI';
import { toast } from 'sonner';

interface AIExtractionDashboardProps {
  className?: string;
}

export const AIExtractionDashboard: React.FC<AIExtractionDashboardProps> = ({ className }) => {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [pendingExtractions, setPendingExtractions] = useState<ExtractedDataPreview[]>([]);
  const [stats, setStats] = useState({
    totalProcessed: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    averageConfidence: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedExtraction, setSelectedExtraction] = useState<ExtractedDataPreview | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobsData, pendingData, statsData] = await Promise.all([
        getExtractionJobs(),
        getPendingExtractions(),
        getAIProcessingStats()
      ]);

      setJobs(jobsData);
      setPendingExtractions(pendingData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading AI extraction data:', error);
      toast.error('Erro ao carregar dados de extração IA');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (previewId: string, finalData: Record<string, any>) => {
    try {
      await approveExtractedData(previewId, finalData);
      toast.success('Dados aprovados com sucesso');
      loadData();
    } catch (error) {
      console.error('Error approving data:', error);
      toast.error('Erro ao aprovar dados');
    }
  };

  const handleReject = async (previewId: string, notes: string) => {
    try {
      await rejectExtractedData(previewId, notes);
      toast.success('Dados rejeitados');
      loadData();
    } catch (error) {
      console.error('Error rejecting data:', error);
      toast.error('Erro ao rejeitar dados');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Processando':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'Concluído':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processando':
        return 'blue';
      case 'Concluído':
        return 'green';
      case 'Erro':
        return 'red';
      default:
        return 'gray';
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <span className="ml-2">Carregando dashboard IA...</span>
      </div>
    );
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
            <div className="text-2xl font-bold text-blue-600">{stats.pendingApproval}</div>
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

      {/* Pending Extractions */}
      {pendingExtractions.length > 0 && (
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
            {pendingExtractions.map((extraction) => (
              <div key={extraction.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {/* TODO: Display document name from relations */}
                        Documento {extraction.extraction_job_id?.toString().slice(-6)}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExtraction(extraction)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Revisar
                    </Button>
                  </div>
                </div>

                {/* Preview of extracted data */}
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Dados Extraídos:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(extraction.extracted_fields).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{String(value).slice(0, 20)}...</span>
                      </div>
                    ))}
                  </div>
                  {Object.keys(extraction.extracted_fields).length > 4 && (
                    <p className="text-xs text-muted-foreground">
                      +{Object.keys(extraction.extracted_fields).length - 4} campos adicionais
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Confiança:</span>
                    <Badge variant={getConfidenceBadgeVariant(
                      Object.values(extraction.confidence_scores).reduce((a, b) => a + b, 0) / 
                      Object.values(extraction.confidence_scores).length
                    )}>
                      {formatConfidenceScore(
                        Object.values(extraction.confidence_scores).reduce((a, b) => a + b, 0) / 
                        Object.values(extraction.confidence_scores).length
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReject(extraction.id, 'Dados incorretos')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApprove(extraction.id, extraction.extracted_fields)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum processamento IA encontrado</p>
              <p className="text-sm">Envie documentos com processamento IA habilitado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 10).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                    
                    <Badge 
                      variant={getStatusColor(job.status) as any}
                      className="text-xs"
                    >
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