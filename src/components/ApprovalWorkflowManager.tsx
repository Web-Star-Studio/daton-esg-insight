import { useState, useMemo, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { errorHandler } from "@/utils/errorHandler";
import { useOptimizedList, useStableAsyncCallback } from "@/hooks/useOptimizedMemo";
import { LoadingFallback, FormLoadingSkeleton } from "@/components/LoadingFallback";
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
  steps: any;
  created_at: string;
}

export function ApprovalWorkflowManager({ open, onOpenChange }: ApprovalWorkflowManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowType, setWorkflowType] = useState("non_conformity");
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Memoize workflow query options
  const workflowsQueryOptions = useMemo(() => ({
    queryKey: ['approval-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ApprovalWorkflow[];
    },
    staleTime: 1000 * 60 * 5,
    enabled: open,
  }), [open]);

  const usersQueryOptions = useMemo(() => ({
    queryKey: ['company-users'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not found');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user.id)
        .single();

      if (!profileData) throw new Error('Profile not found');

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('company_id', profileData.company_id);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
    enabled: open,
  }), [open]);

  const { data: workflows = [], isLoading: workflowsLoading } = useQuery(workflowsQueryOptions);
  const { data: users = [], isLoading: usersLoading } = useQuery(usersQueryOptions);

  // Memoized callbacks
  const addStep = useCallback(() => {
    const newStep: WorkflowStep = {
      approver_user_id: "",
      step_number: workflowSteps.length + 1
    };
    setWorkflowSteps(prev => [...prev, newStep]);
  }, [workflowSteps.length]);

  const removeStep = useCallback((index: number) => {
    setWorkflowSteps(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateStep = useCallback((index: number, field: keyof WorkflowStep, value: string | number) => {
    setWorkflowSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, [field]: value } : step
    ));
  }, []);

  // Memoized optimized user selection
  const userOptions = useOptimizedList(
    users, 
    (user) => user.id,
    [users]
  );

  // Stable async callbacks
  const createWorkflow = useStableAsyncCallback(async () => {
    if (!workflowName.trim() || workflowSteps.length === 0) {
      toast({
        title: "Erro",
        description: "Nome e pelo menos um passo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Get user's company_id
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not found');

    const { data: profileData } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', userData.user.id)
      .single();

    if (!profileData) throw new Error('Profile not found');

    const { error } = await supabase
      .from('approval_workflows')
      .insert([{
        workflow_name: workflowName,
        workflow_type: workflowType,
        steps: workflowSteps as any,
        is_active: true,
        company_id: profileData.company_id
      }]);

    if (error) throw error;

    toast({
      title: "Sucesso",
      description: "Workflow de aprovação criado com sucesso!",
    });

    queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    resetForm();
    setIsCreating(false);
  }, [workflowName, workflowType, workflowSteps], {
    component: 'ApprovalWorkflowManager',
    function: 'createWorkflow'
  });

  const updateWorkflow = useStableAsyncCallback(async () => {
    if (!editingWorkflow || !workflowName.trim() || workflowSteps.length === 0) {
      return;
    }

    const { error } = await supabase
      .from('approval_workflows')
      .update({
        workflow_name: workflowName,
        workflow_type: workflowType,
        steps: workflowSteps as any
      })
      .eq('id', editingWorkflow.id);

    if (error) throw error;

    toast({
      title: "Sucesso",
      description: "Workflow atualizado com sucesso!",
    });

    queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
    resetForm();
    setEditingWorkflow(null);
  }, [editingWorkflow, workflowName, workflowType, workflowSteps], {
    component: 'ApprovalWorkflowManager',
    function: 'updateWorkflow'
  });

  const deleteWorkflow = useStableAsyncCallback(async (id: string) => {
    const { error } = await supabase
      .from('approval_workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast({
      title: "Sucesso",
      description: "Workflow excluído com sucesso!",
    });

    queryClient.invalidateQueries({ queryKey: ['approval-workflows'] });
  }, [], {
    component: 'ApprovalWorkflowManager',
    function: 'deleteWorkflow'
  });

  const resetForm = useCallback(() => {
    setWorkflowName("");
    setWorkflowType("non_conformity");
    setWorkflowSteps([]);
    setEditingWorkflow(null);
  }, []);

  const startEditing = useCallback((workflow: ApprovalWorkflow) => {
    setWorkflowName(workflow.workflow_name);
    setWorkflowType(workflow.workflow_type);
    setWorkflowSteps(Array.isArray(workflow.steps) ? workflow.steps : []);
    setEditingWorkflow(workflow);
    setIsCreating(true);
  }, []);

  if (workflowsLoading || usersLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Workflows de Aprovação</DialogTitle>
          </DialogHeader>
          <LoadingFallback message="Carregando workflows..." />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Workflows de Aprovação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Workflows Existentes</h3>
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Workflow
            </Button>
          </div>

          {workflows.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Nenhum workflow configurado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure workflows para automatizar processos de aprovação
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{workflow.workflow_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                          {workflow.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">{workflow.workflow_type}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(workflow)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWorkflow?.(workflow.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(workflow.steps) ? workflow.steps.length : 0} passos configurados
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingWorkflow ? "Editar Workflow" : "Novo Workflow de Aprovação"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {usersLoading ? (
                  <FormLoadingSkeleton />
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="workflow-name">Nome do Workflow</Label>
                        <Input
                          id="workflow-name"
                          value={workflowName}
                          onChange={(e) => setWorkflowName(e.target.value)}
                          placeholder="Ex: Aprovação de Não Conformidade"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="workflow-type">Tipo</Label>
                        <Select value={workflowType} onValueChange={setWorkflowType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="non_conformity">Não Conformidade</SelectItem>
                            <SelectItem value="action_plan">Plano de Ação</SelectItem>
                            <SelectItem value="document">Documento</SelectItem>
                            <SelectItem value="general">Geral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Passos de Aprovação</Label>
                        <Button variant="outline" size="sm" onClick={addStep}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Passo
                        </Button>
                      </div>

                      {workflowSteps.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Adicione pelo menos um passo de aprovação
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {workflowSteps.map((step, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-center gap-4">
                                <Badge variant="outline">Passo {index + 1}</Badge>
                                
                                <div className="flex-1">
                                  <Select
                                    value={step.approver_user_id}
                                    onValueChange={(value) => updateStep(index, 'approver_user_id', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar aprovador" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {userOptions.map(({ item: user, key }) => (
                                        <SelectItem key={key} value={user.id}>
                                          {user.full_name || 'Usuário sem nome'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeStep(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        resetForm();
                        setIsCreating(false);
                      }}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={editingWorkflow ? updateWorkflow : createWorkflow}
                        disabled={!workflowName.trim() || workflowSteps.length === 0}
                      >
                        {editingWorkflow ? "Atualizar" : "Criar"} Workflow
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}