import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Edit, Database, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Operation {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: Record<string, any>;
  where_clause?: Record<string, any>;
  confidence: number;
  reasoning: string;
  reconciliation?: {
    duplicates_found?: number;
    conflicts_detected?: Array<{ field: string; old_value: any; new_value: any }>;
    resolution_strategy?: string;
    similarity_score?: number;
  };
}

interface OperationCardProps {
  operation: Operation;
  index: number;
  onApprove: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
}

export function OperationCard({ operation, index, onApprove, onReject, onEdit }: OperationCardProps) {
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />{confidence}%</Badge>;
    }
    if (confidence >= 50) {
      return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />{confidence}%</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{confidence}%</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      INSERT: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive'
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type}</Badge>;
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{operation.table}</h3>
            {getTypeBadge(operation.type)}
            {getConfidenceBadge(operation.confidence)}
          </div>
          <p className="text-sm text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            {operation.reasoning}
          </p>
        </div>
      </div>

      {/* Reconciliation Info */}
      {operation.reconciliation && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          {operation.reconciliation.duplicates_found && operation.reconciliation.duplicates_found > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-3 w-3 text-yellow-500" />
              <span>{operation.reconciliation.duplicates_found} duplicata(s) encontrada(s)</span>
              {operation.reconciliation.similarity_score && (
                <Badge variant="outline" className="text-xs">
                  {Math.round(operation.reconciliation.similarity_score * 100)}% similar
                </Badge>
              )}
            </div>
          )}
          
          {operation.reconciliation.conflicts_detected && operation.reconciliation.conflicts_detected.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Conflitos detectados:</p>
              {operation.reconciliation.conflicts_detected.map((conflict, idx) => (
                <div key={idx} className="text-xs bg-background rounded px-2 py-1">
                  <span className="font-medium">{conflict.field}:</span> 
                  <span className="text-muted-foreground ml-1">{String(conflict.old_value)}</span>
                  <span className="mx-1">→</span>
                  <span className="text-primary">{String(conflict.new_value)}</span>
                </div>
              ))}
            </div>
          )}

          {operation.reconciliation.resolution_strategy && (
            <p className="text-xs text-muted-foreground">
              Estratégia: {operation.reconciliation.resolution_strategy}
            </p>
          )}
        </div>
      )}

      {/* Data Preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Dados:</p>
        <div className="bg-muted rounded-lg p-3 max-h-40 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(operation.data, null, 2)}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onEdit(index)}
          className="flex-1"
        >
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onReject(index)}
          className="flex-1 text-destructive hover:bg-destructive/10"
        >
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitar
        </Button>
        <Button 
          size="sm" 
          onClick={() => onApprove(index)}
          className={cn(
            "flex-1",
            operation.confidence >= 80 && "bg-green-500 hover:bg-green-600"
          )}
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aprovar
        </Button>
      </div>
    </Card>
  );
}
