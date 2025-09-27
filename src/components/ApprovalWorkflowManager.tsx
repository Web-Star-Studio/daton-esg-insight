import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Settings, 
  User, 
  ArrowUp, 
  ArrowDown, 
  Trash2,
  Edit
} from "lucide-react";

interface ApprovalWorkflowManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WorkflowStep {
  approver_user_id: string;
  step_number: number;
  approver_name?: string;
}

interface ApprovalWorkflow {
  id: string;
  workflow_name: string;
  workflow_type: string;
  is_active: boolean;
  steps: any; // Changed from WorkflowStep[] to any to handle Json type
  created_at: string;
}

export function ApprovalWorkflowManager({ open, onOpenChange }: ApprovalWorkflowManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowType, setWorkflowType] = useState("non_conformity");
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["approval-workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_workflows")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: users } = useQuery({
    queryKey: ["users-for-approval"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleCreateWorkflow = async () => {
    try {
      if (!workflowName.trim()) {
        toast.error("Nome do workflow é obrigatório");
        return;
      }

      if (workflowSteps.length === 0) {
        toast.error("Adicione pelo menos um aprovador");
        return;
      }

      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Empresa não encontrada");

      const { error } = await supabase
        .from("approval_workflows")
        .insert({
          workflow_name: workflowName,
          workflow_type: workflowType,
          steps: workflowSteps as any,
          is_active: true,
          company_id: profile.company_id
        });

      if (error) throw error;

      toast.success("Workflow criado com sucesso!");
      setIsCreating(false);
      setWorkflowName("");
      setWorkflowSteps([]);
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
    } catch (error) {
      toast.error("Erro ao criar workflow");
      console.error(error);
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow) return;

    try {
      const { error } = await supabase
        .from("approval_workflows")
        .update({
          workflow_name: workflowName,
          steps: workflowSteps as any,
        })
        .eq("id", editingWorkflow.id);

      if (error) throw error;

      toast.success("Workflow atualizado com sucesso!");
      setEditingWorkflow(null);
      setWorkflowName("");
      setWorkflowSteps([]);
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
    } catch (error) {
      toast.error("Erro ao atualizar workflow");
      console.error(error);
    }
  };

  const handleToggleActive = async (workflow: ApprovalWorkflow) => {
    try {
      const { error } = await supabase
        .from("approval_workflows")
        .update({ is_active: !workflow.is_active })
        .eq("id", workflow.id);

      if (error) throw error;

      toast.success(`Workflow ${workflow.is_active ? 'desativado' : 'ativado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
    } catch (error) {
      toast.error("Erro ao alterar status do workflow");
      console.error(error);
    }
  };

  const addApprover = () => {
    setWorkflowSteps([...workflowSteps, {
      approver_user_id: "none",
      step_number: workflowSteps.length + 1
    }]);
  };

  const removeApprover = (index: number) => {
    const newSteps = workflowSteps.filter((_, i) => i !== index);
    // Renumber steps
    const renumberedSteps = newSteps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    setWorkflowSteps(renumberedSteps);
  };

  const updateApprover = (index: number, userId: string) => {
    const newSteps = [...workflowSteps];
    newSteps[index].approver_user_id = userId;
    setWorkflowSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...workflowSteps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    
    // Renumber steps
    const renumberedSteps = newSteps.map((step, i) => ({
      ...step,
      step_number: i + 1
    }));
    setWorkflowSteps(renumberedSteps);
  };

  const startEdit = (workflow: ApprovalWorkflow) => {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.workflow_name);
    setWorkflowType(workflow.workflow_type);
    setWorkflowSteps(Array.isArray(workflow.steps) ? workflow.steps as WorkflowStep[] : []);
    setIsCreating(false);
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingWorkflow(null);
    setWorkflowName("");
    setWorkflowType("non_conformity");
    setWorkflowSteps([]);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Fluxos de Aprovação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!isCreating && !editingWorkflow && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Workflows Existentes</h3>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Workflow
                </Button>
              </div>

              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">Carregando workflows...</div>
                ) : workflows && workflows.length > 0 ? (
                  workflows.map((workflow) => (
                    <Card key={workflow.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{workflow.workflow_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Tipo: {workflow.workflow_type} • {Array.isArray(workflow.steps) ? workflow.steps.length : 0} etapas
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={workflow.is_active ? "default" : "secondary"}>
                              {workflow.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(workflow)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={workflow.is_active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => handleToggleActive(workflow)}
                            >
                              {workflow.is_active ? "Desativar" : "Ativar"}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum workflow encontrado
                  </div>
                )}
              </div>
            </>
          )}

          {(isCreating || editingWorkflow) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {editingWorkflow ? "Editar Workflow" : "Criar Novo Workflow"}
                </h3>
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="workflow-name">Nome do Workflow</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Ex: Aprovação de Não Conformidades"
                  />
                </div>

                <div>
                  <Label htmlFor="workflow-type">Tipo</Label>
                  <Select value={workflowType} onValueChange={setWorkflowType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="non_conformity">Não Conformidade</SelectItem>
                      <SelectItem value="document">Documento</SelectItem>
                      <SelectItem value="audit">Auditoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Etapas de Aprovação</Label>
                    <Button variant="outline" size="sm" onClick={addApprover}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Aprovador
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {workflowSteps.map((step, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveStep(index, 'up')}
                                disabled={index === 0}
                              >
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveStep(index, 'down')}
                                disabled={index === workflowSteps.length - 1}
                              >
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">{step.step_number}</span>
                            </div>

                            <div className="flex-1">
                              <Select
                                value={step.approver_user_id || "none"}
                                onValueChange={(value) => updateApprover(index, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecionar aprovador" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Selecionar aprovador</SelectItem>
                                  {users?.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        {user.full_name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeApprover(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {workflowSteps.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        Nenhum aprovador adicionado
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={editingWorkflow ? handleUpdateWorkflow : handleCreateWorkflow}
                    disabled={!workflowName.trim() || workflowSteps.length === 0}
                  >
                    {editingWorkflow ? "Atualizar" : "Criar"} Workflow
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}