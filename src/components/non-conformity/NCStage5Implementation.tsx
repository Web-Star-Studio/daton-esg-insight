import { useState } from "react";
import { Check, Play, Clock, AlertTriangle, User, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  useActionPlans, 
  useUpdateActionPlan,
} from "@/hooks/useNonConformity";
import { NCActionPlan } from "@/services/nonConformityService";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface NCStage5ImplementationProps {
  ncId: string;
  onComplete?: () => void;
}

export function NCStage5Implementation({ ncId, onComplete }: NCStage5ImplementationProps) {
  const [selectedPlan, setSelectedPlan] = useState<NCActionPlan | null>(null);
  const [evidence, setEvidence] = useState("");

  const { data: plans, isLoading } = useActionPlans(ncId);
  const updateMutation = useUpdateActionPlan();

  const handleStartExecution = (plan: NCActionPlan) => {
    updateMutation.mutate({
      id: plan.id,
      updates: { status: "Em Execução" },
    });
  };

  const handleOpenComplete = (plan: NCActionPlan) => {
    setSelectedPlan(plan);
    setEvidence(plan.evidence || "");
  };

  const handleCompleteAction = () => {
    if (!selectedPlan) return;
    
    if (!evidence.trim()) {
      toast.error("Descreva a evidência de conclusão");
      return;
    }

    updateMutation.mutate({
      id: selectedPlan.id,
      updates: {
        status: "Concluída",
        evidence,
        completion_date: format(new Date(), "yyyy-MM-dd"),
        completed_at: new Date().toISOString(),
      },
    }, {
      onSuccess: () => {
        setSelectedPlan(null);
        setEvidence("");
      },
    });
  };

  const getStatusInfo = (plan: NCActionPlan) => {
    const dueDate = new Date(plan.when_deadline);
    
    if (plan.status === "Concluída") {
      return {
        badge: <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Concluída</Badge>,
        canStart: false,
        canComplete: false,
      };
    }
    if (plan.status === "Cancelada") {
      return {
        badge: <Badge variant="secondary">Cancelada</Badge>,
        canStart: false,
        canComplete: false,
      };
    }
    if (isPast(dueDate) && !isToday(dueDate) && (plan.status as string) !== "Concluída") {
      return {
        badge: <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Atrasada</Badge>,
        canStart: plan.status === "Planejada",
        canComplete: plan.status === "Em Execução",
      };
    }
    if (plan.status === "Em Execução") {
      return {
        badge: <Badge className="bg-blue-100 text-blue-800"><Play className="h-3 w-3 mr-1" /> Em Execução</Badge>,
        canStart: false,
        canComplete: true,
      };
    }
    return {
      badge: <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Planejada</Badge>,
      canStart: true,
      canComplete: false,
    };
  };

  // Calculate progress
  const completedCount = plans?.filter(p => p.status === "Concluída").length || 0;
  const totalCount = plans?.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = completedCount === totalCount && totalCount > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">5</span>
                Implementação das Ações
              </CardTitle>
              <CardDescription>
                Execute as ações planejadas e registre as evidências de conclusão
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progresso</p>
              <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent>
          {plans && plans.length > 0 ? (
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const statusInfo = getStatusInfo(plan);
                
                return (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg ${
                      plan.status === "Concluída" 
                        ? "bg-green-50/50 border-green-200" 
                        : plan.status === "Em Execução"
                        ? "bg-blue-50/50 border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-sm bg-muted px-2 py-0.5 rounded">
                            Ação {index + 1}
                          </span>
                          {statusInfo.badge}
                        </div>
                        
                        <h4 className="font-medium">{plan.what_action}</h4>
                        
                        {plan.how_method && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Como:</strong> {plan.how_method}
                          </p>
                        )}

                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {plan.responsible?.full_name || "Não definido"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(plan.when_deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        {plan.evidence && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground mb-1">
                              <FileText className="h-3 w-3" />
                              Evidência:
                            </div>
                            <p>{plan.evidence}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {statusInfo.canStart && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartExecution(plan)}
                            disabled={updateMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        )}
                        {statusInfo.canComplete && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenComplete(plan)}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma ação para implementar.</p>
              <p className="text-sm">Volte à etapa de Planejamento para adicionar ações.</p>
            </div>
          )}

          {allCompleted && onComplete && (
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button onClick={onComplete}>
                <Check className="h-4 w-4 mr-2" />
                Concluir Implementação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Action Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{selectedPlan?.what_action}</p>
            </div>

            <div>
              <Label htmlFor="evidence">Evidência de Conclusão *</Label>
              <Textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Descreva como a ação foi executada e qual foi o resultado..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedPlan(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCompleteAction}
                disabled={updateMutation.isPending}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirmar Conclusão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
