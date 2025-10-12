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
import { CheckCircle2, AlertTriangle, Info, Zap } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    if (impact === 'high') return <AlertTriangle className="h-4 w-4" />;
    if (impact === 'medium') return <Info className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'high': return 'Impacto Alto';
      case 'medium': return 'Impacto Médio';
      case 'low': return 'Impacto Baixo';
      default: return 'Impacto Desconhecido';
    }
  };

  const formatParamKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatParamValue = (value: any) => {
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    if (value === null || value === undefined) return 'N/A';
    return String(value);
  };

  return (
    <AlertDialog open={!!action}>
      <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start gap-3 text-xl">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                Confirmação de Ação da IA
                <Badge variant={getImpactColor(action.impact)} className="ml-auto">
                  {getImpactIcon(action.impact)}
                  <span className="ml-1.5">{getImpactText(action.impact)}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                Revise os detalhes antes de confirmar
              </p>
            </div>
          </AlertDialogTitle>
          
          <Separator className="my-4" />
          
          <AlertDialogDescription className="space-y-4">
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Ação Proposta</h3>
                    <p className="text-base text-foreground">{action.displayName}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Descrição
            </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {action.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-muted/30 rounded-lg p-3 border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Categoria</span>
                  <p className="text-sm font-medium text-foreground mt-1">{action.category}</p>
                </div>
                <div className="flex-1 bg-muted/30 rounded-lg p-3 border">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</span>
                  <p className="text-sm font-medium text-foreground mt-1">{action.toolName.replace(/_/g, ' ')}</p>
                </div>
              </div>

              {Object.keys(action.params).length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Parâmetros da Ação</h4>
                  <div className="space-y-2.5">
                    {Object.entries(action.params).map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-1 p-2 bg-background rounded border">
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatParamKey(key)}
                        </span>
                        <span className="text-sm text-foreground font-mono">
                          {formatParamValue(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Importante</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Esta ação será registrada no histórico de auditoria do sistema. 
                    Certifique-se de que os dados estão corretos antes de confirmar.
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={onCancel} className="min-w-[120px]">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => onConfirm(action)}
            className="bg-primary hover:bg-primary/90 min-w-[160px]"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar e Executar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
