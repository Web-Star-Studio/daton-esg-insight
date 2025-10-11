import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export interface PendingAction {
  id: string;
  toolName: string;
  displayName: string;
  description: string;
  params: Record<string, any>;
  impact: 'low' | 'medium' | 'high';
  category: string;
}

interface AIActionConfirmationProps {
  action: PendingAction | null;
  onConfirm: (action: PendingAction) => void;
  onCancel: () => void;
}

export function AIActionConfirmation({ action, onConfirm, onCancel }: AIActionConfirmationProps) {
  if (!action) return null;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getImpactIcon = (impact: string) => {
    return impact === 'high' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />;
  };

  return (
    <AlertDialog open={!!action}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            🤖 Confirmação de Ação da IA
            <Badge variant={getImpactColor(action.impact)} className="ml-auto">
              {getImpactIcon(action.impact)}
              <span className="ml-1">Impacto {action.impact === 'high' ? 'Alto' : action.impact === 'medium' ? 'Médio' : 'Baixo'}</span>
            </Badge>
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p className="text-base font-medium text-foreground mb-2">
                A assistente deseja realizar a seguinte ação:
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-semibold text-foreground">Ação:</span>
                  <p className="text-sm mt-1">{action.displayName}</p>
                </div>
                
                <div>
                  <span className="text-sm font-semibold text-foreground">Descrição:</span>
                  <p className="text-sm mt-1 text-muted-foreground">{action.description}</p>
                </div>

                <div>
                  <span className="text-sm font-semibold text-foreground">Categoria:</span>
                  <Badge variant="outline" className="ml-2">{action.category}</Badge>
                </div>

                {Object.keys(action.params).length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-foreground">Detalhes:</span>
                    <div className="mt-2 space-y-1">
                      {Object.entries(action.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium text-foreground">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Nota:</strong> Esta ação será registrada no histórico de auditoria e poderá ser revertida se necessário.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(action)}
            className="bg-primary hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar e Executar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
