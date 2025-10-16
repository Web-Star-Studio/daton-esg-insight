import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { type ValidationIssue } from "@/hooks/useGRIReportValidation";

interface GRIValidationPanelProps {
  issues: ValidationIssue[];
  onDismiss?: () => void;
}

export function GRIValidationPanel({ issues, onDismiss }: GRIValidationPanelProps) {
  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');
  const infos = issues.filter(issue => issue.severity === 'info');

  if (issues.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Validação Completa</AlertTitle>
        <AlertDescription className="text-green-700">
          Seu relatório GRI passou em todas as validações e está pronto para ser finalizado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {errors.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              {errors.length} {errors.length === 1 ? 'Erro' : 'Erros'}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge variant="default" className="gap-1 bg-yellow-500 hover:bg-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              {warnings.length} {warnings.length === 1 ? 'Aviso' : 'Avisos'}
            </Badge>
          )}
          {infos.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Info className="h-3 w-3" />
              {infos.length} {infos.length === 1 ? 'Info' : 'Infos'}
            </Badge>
          )}
        </div>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Fechar
          </Button>
        )}
      </div>

      {/* Issues List */}
      <ScrollArea className="h-64 rounded-md border p-4">
        <div className="space-y-3">
          {errors.map((issue, index) => (
            <Alert key={`error-${index}`} variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-medium capitalize">
                {issue.field.replace(/_/g, ' ')}
              </AlertTitle>
              <AlertDescription className="text-sm">
                {issue.message}
              </AlertDescription>
            </Alert>
          ))}

          {warnings.map((issue, index) => (
            <Alert key={`warning-${index}`} className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-sm font-medium capitalize text-yellow-800">
                {issue.field.replace(/_/g, ' ')}
              </AlertTitle>
              <AlertDescription className="text-sm text-yellow-700">
                {issue.message}
              </AlertDescription>
            </Alert>
          ))}

          {infos.map((issue, index) => (
            <Alert key={`info-${index}`} className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-sm font-medium capitalize text-blue-800">
                {issue.field.replace(/_/g, ' ')}
              </AlertTitle>
              <AlertDescription className="text-sm text-blue-700">
                {issue.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
