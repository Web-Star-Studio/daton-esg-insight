import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, X, RefreshCw, FileText, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRealtimeReporting } from "@/hooks/useRealtimeReporting";

interface ReportGenerationMonitorProps {
  onDownload?: (reportId: string) => void;
  onCancel?: (reportId: string) => void;
  onRetry?: (reportId: string) => void;
}

export function ReportGenerationMonitor({ onDownload, onCancel, onRetry }: ReportGenerationMonitorProps) {
  const { activeJobs, stats } = useRealtimeReporting();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processando</Badge>;
      default:
        return <Badge variant="outline">Na Fila</Badge>;
    }
  };

  const activeJobsFiltered = activeJobs.filter(
    job => job.status === 'queued' || job.status === 'processing'
  );

  const completedJobsFiltered = activeJobs.filter(
    job => job.status === 'completed' || job.status === 'failed'
  ).slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Jobs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processando</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-600 opacity-50 animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{Math.round(stats.successRate)}%</p>
              </div>
              <Progress value={stats.successRate} className="w-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs */}
      {activeJobsFiltered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Relatórios em Geração
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso dos relatórios sendo gerados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobsFiltered.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 space-y-3 bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <h4 className="font-medium">{job.template_name || job.template_id}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Iniciado {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      {onCancel && job.status === 'processing' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(job.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{job.progress || 0}%</span>
                    </div>
                    <Progress value={job.progress || 0} className="h-2" />
                  </div>

                  {job.estimated_completion && (
                    <p className="text-xs text-muted-foreground">
                      Conclusão estimada: {format(new Date(job.estimated_completion), "HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Concluídos Recentemente
          </CardTitle>
          <CardDescription>
            Últimos 10 relatórios gerados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedJobsFiltered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum relatório gerado ainda</p>
              <p className="text-sm">Comece configurando um novo relatório</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {completedJobsFiltered.map((job) => (
                  <div
                    key={job.id}
                    className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(job.status)}
                      <div className="space-y-1">
                        <p className="font-medium">{job.template_name || job.template_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(job.completed_at || job.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && onDownload && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(job.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {job.status === 'failed' && onRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRetry(job.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Tentar Novamente
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}