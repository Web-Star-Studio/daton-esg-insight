import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, FileText, Database } from 'lucide-react';
import { ProcessingResult } from '@/hooks/useDocumentProcessing';

interface ProcessingResultsCardProps {
  results: ProcessingResult[];
}

export function ProcessingResultsCard({ results }: ProcessingResultsCardProps) {
  if (results.length === 0) return null;

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Resultados do Processamento
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            {successCount} sucesso • {errorCount} erro(s)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {results.map((result, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
          >
            {result.status === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{result.fileName}</p>
              {result.status === 'success' ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {result.documentType || 'Tipo desconhecido'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    {result.entitiesExtracted || 0} entidades
                  </span>
                  <span className={result.autoInserted ? 'text-green-600' : 'text-amber-600'}>
                    {result.autoInserted ? '✓ Inserido' : '⚠ Revisão manual'}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-destructive mt-1">{result.error}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
