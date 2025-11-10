import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AIProcessingStatusProps {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
}

export function AIProcessingStatus({ status, progress = 0, message }: AIProcessingStatusProps) {
  if (status === 'idle') return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {status === 'processing' && (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">
                  {message || 'Processando com IA...'}
                </p>
                <Progress value={progress} />
              </div>
            </>
          )}

          {status === 'completed' && (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <p className="text-sm font-medium">{message || 'Processamento concluído!'}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-6 w-6 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {message || 'Erro no processamento'}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
