import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Info, Zap, X, AlertTriangle } from 'lucide-react';
import { OperationCard, Operation } from './OperationCard';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface ValidationCheck {
  check_type: string;
  status: 'pass' | 'warning' | 'error';
  message: string;
  affected_fields?: string[];
}

interface AIOperationsPreviewProps {
  open: boolean;
  onClose: () => void;
  operations: Operation[];
  validations: ValidationCheck[];
  summary: string;
  onExecute: (approvedOperations: Operation[]) => Promise<void>;
}

export function AIOperationsPreview({
  open,
  onClose,
  operations: initialOperations,
  validations,
  summary,
  onExecute
}: AIOperationsPreviewProps) {
  const [operations, setOperations] = useState<Operation[]>(initialOperations);
  const [approvedIndices, setApprovedIndices] = useState<Set<number>>(new Set());
  const [rejectedIndices, setRejectedIndices] = useState<Set<number>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);

  // Group operations by table
  const groupedByTable = useMemo(() => {
    const groups: Record<string, Operation[]> = {};
    operations.forEach((op) => {
      if (!groups[op.table]) {
        groups[op.table] = [];
      }
      groups[op.table].push(op);
    });
    return groups;
  }, [operations]);

  const stats = useMemo(() => {
    const insertCount = operations.filter(op => op.type === 'INSERT').length;
    const updateCount = operations.filter(op => op.type === 'UPDATE').length;
    const deleteCount = operations.filter(op => op.type === 'DELETE').length;
    const highConfidenceCount = operations.filter(op => op.confidence >= 80).length;
    const duplicatesCount = operations.reduce((sum, op) => 
      sum + (op.reconciliation?.duplicates_found || 0), 0
    );
    
    return { insertCount, updateCount, deleteCount, highConfidenceCount, duplicatesCount };
  }, [operations]);

  const handleApprove = (index: number) => {
    setApprovedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setRejectedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleReject = (index: number) => {
    setRejectedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setApprovedIndices(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleEdit = (index: number) => {
    toast.info('Edição de operações', {
      description: 'Funcionalidade em desenvolvimento'
    });
  };

  const handleApproveHighConfidence = () => {
    const newApproved = new Set(approvedIndices);
    operations.forEach((op, idx) => {
      if (op.confidence >= 80 && !rejectedIndices.has(idx)) {
        newApproved.add(idx);
      }
    });
    setApprovedIndices(newApproved);
    toast.success(`${stats.highConfidenceCount} operações de alta confiança aprovadas`);
  };

  const handleApproveAll = () => {
    setApprovedIndices(new Set(operations.map((_, idx) => idx)));
    setRejectedIndices(new Set());
    toast.success(`Todas as ${operations.length} operações aprovadas`);
  };

  const handleRejectAll = () => {
    setRejectedIndices(new Set(operations.map((_, idx) => idx)));
    setApprovedIndices(new Set());
    toast.success('Todas as operações rejeitadas');
  };

  const handleExecute = async () => {
    const approvedOps = operations.filter((_, idx) => approvedIndices.has(idx));
    
    if (approvedOps.length === 0) {
      toast.error('Nenhuma operação aprovada', {
        description: 'Aprove pelo menos uma operação antes de executar'
      });
      return;
    }

    setIsExecuting(true);
    try {
      await onExecute(approvedOps);
      toast.success(`${approvedOps.length} operação(ões) executada(s) com sucesso`);
      onClose();
    } catch (error) {
      toast.error('Erro ao executar operações', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const errorValidations = validations.filter(v => v.status === 'error');
  const warningValidations = validations.filter(v => v.status === 'warning');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Preview de Operações - {operations.length} ações propostas
          </DialogTitle>
          <DialogDescription>
            Revise e aprove as operações identificadas pela IA antes de executar
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Summary Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Resumo</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{summary}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {stats.insertCount > 0 && (
                    <Badge variant="default">{stats.insertCount} INSERT</Badge>
                  )}
                  {stats.updateCount > 0 && (
                    <Badge variant="secondary">{stats.updateCount} UPDATE</Badge>
                  )}
                  {stats.deleteCount > 0 && (
                    <Badge variant="destructive">{stats.deleteCount} DELETE</Badge>
                  )}
                  {stats.highConfidenceCount > 0 && (
                    <Badge className="bg-green-500">{stats.highConfidenceCount} alta confiança</Badge>
                  )}
                  {stats.duplicatesCount > 0 && (
                    <Badge variant="outline">{stats.duplicatesCount} duplicatas</Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Validation Errors */}
            {errorValidations.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erros de Validação</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {errorValidations.map((v, idx) => (
                      <li key={idx}>{v.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Warnings */}
            {warningValidations.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Avisos</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {warningValidations.map((v, idx) => (
                      <li key={idx}>{v.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Operations by Table */}
            <Tabs defaultValue={Object.keys(groupedByTable)[0]} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {Object.entries(groupedByTable).map(([table, ops]) => (
                  <TabsTrigger key={table} value={table} className="flex items-center gap-2">
                    {table}
                    <Badge variant="outline" className="text-xs">{ops.length}</Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(groupedByTable).map(([table, tableOps]) => (
                <TabsContent key={table} value={table} className="space-y-3 mt-4">
                  {tableOps.map((op, localIdx) => {
                    const globalIdx = operations.indexOf(op);
                    return (
                      <div
                        key={globalIdx}
                        className={`transition-opacity ${
                          rejectedIndices.has(globalIdx) ? 'opacity-50' : ''
                        } ${
                          approvedIndices.has(globalIdx) ? 'ring-2 ring-green-500 rounded-lg' : ''
                        }`}
                      >
                        <OperationCard
                          operation={op}
                          index={globalIdx}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          onEdit={handleEdit}
                        />
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center gap-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {approvedIndices.size} aprovada(s) • {rejectedIndices.size} rejeitada(s)
          </div>
          <Button variant="outline" onClick={handleRejectAll}>
            <X className="h-4 w-4 mr-1" />
            Rejeitar Tudo
          </Button>
          <Button variant="secondary" onClick={handleApproveHighConfidence}>
            <Zap className="h-4 w-4 mr-1" />
            Aprovar Alta Confiança ({stats.highConfidenceCount})
          </Button>
          <Button onClick={handleApproveAll} variant="outline">
            Aprovar Tudo
          </Button>
          <Button 
            onClick={handleExecute} 
            disabled={approvedIndices.size === 0 || isExecuting}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            {isExecuting ? 'Executando...' : `Executar (${approvedIndices.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
