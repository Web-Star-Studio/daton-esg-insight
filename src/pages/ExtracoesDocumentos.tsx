import { DocumentExtractionApproval } from '@/components/DocumentExtractionApproval';
import { AIExtractionStats } from '@/components/ai/AIExtractionStats';
import { useAIHealth } from '@/hooks/useAIHealth';
import { FileCheck, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ExtracoesDocumentos() {
  const { data: health } = useAIHealth();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Aprovação de Extrações</h1>
              <p className="text-muted-foreground">
                Revise e aprove os dados extraídos automaticamente dos documentos
              </p>
            </div>
          </div>
          
          {health && (
            <Alert 
              variant={health.status === 'critical' ? 'destructive' : 'default'}
              className="w-auto"
            >
              <div className="flex items-center gap-2">
                {health.status === 'healthy' ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : health.status === 'degraded' ? (
                  <Activity className="h-4 w-4 text-warning" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <div>
                  <AlertTitle className="text-sm mb-0">
                    Sistema {health.status === 'healthy' ? 'Operacional' : health.status === 'degraded' ? 'Degradado' : 'Crítico'}
                  </AlertTitle>
                  {health.issues.length > 0 && (
                    <AlertDescription className="text-xs">
                      {health.issues[0]}
                    </AlertDescription>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </div>
      </div>

      <AIExtractionStats />
      <DocumentExtractionApproval />
    </div>
  );
}
