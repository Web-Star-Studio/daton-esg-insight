import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Calendar, User, MapPin, DollarSign, Settings, Eye, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { actionPlansService, type ActionPlan } from "@/services/actionPlans";
import { ActionPlanDetailsModal } from "@/components/ActionPlanDetailsModal";

// Remove interfaces - using from service

export default function PlanoAcao5W2H() {
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newPlanData, setNewPlanData] = useState({
    title: "",
    description: "",
    objective: "",
    plan_type: "Melhoria"
  });
  const [newItemData, setNewItemData] = useState({
    what_action: "",
    why_reason: "",
    where_location: "",
    when_deadline: "",
    how_method: "",
    how_much_cost: 0,
    who_responsible_user_id: ""
  });

  const queryClient = useQueryClient();

  const { data: actionPlans, isLoading } = useQuery({
    queryKey: ["action-plans"],
    queryFn: () => actionPlansService.getActionPlans(),
  });

  const { data: stats } = useQuery({
    queryKey: ["action-plans-stats"],
    queryFn: () => actionPlansService.getActionPlanStats(),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("status", "Ativo");
      
      if (error) throw error;
      return data;
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (planData: any) => actionPlansService.createActionPlan(planData),
    onSuccess: () => {
      toast.success("Plano de ação criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      queryClient.invalidateQueries({ queryKey: ["action-plans-stats"] });
      setIsCreatePlanOpen(false);
      setNewPlanData({
        title: "",
        description: "",
        objective: "",
        plan_type: "Melhoria"
      });
    },
    onError: () => {
      toast.error("Erro ao criar plano de ação");
    },
  });

  const createItemMutation = useMutation({
    mutationFn: ({ planId, itemData }: { planId: string; itemData: any }) => 
      actionPlansService.createActionPlanItem(planId, itemData),
    onSuccess: () => {
      toast.success("Item do plano adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      queryClient.invalidateQueries({ queryKey: ["action-plans-stats"] });
      setIsCreateItemOpen(false);
      setNewItemData({
        what_action: "",
        why_reason: "",
        where_location: "",
        when_deadline: "",
        how_method: "",
        how_much_cost: 0,
        who_responsible_user_id: ""
      });
    },
    onError: () => {
      toast.error("Erro ao adicionar item do plano");
    },
  });

  const handleCreatePlan = () => {
    if (!newPlanData.title || !newPlanData.objective) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createPlanMutation.mutate(newPlanData);
  };

  const handleCreateItem = () => {
    if (!newItemData.what_action || !newItemData.when_deadline || !selectedPlanId) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createItemMutation.mutate({ 
      planId: selectedPlanId, 
      itemData: newItemData 
    });
  };

  const handleViewPlan = (plan: ActionPlan) => {
    setSelectedPlan(plan);
    setIsDetailsOpen(true);
  };

  const calculatePlanProgress = (plan: ActionPlan) => {
    if (!plan.items?.length) return 0;
    const totalProgress = plan.items.reduce((sum, item) => sum + (item.progress_percentage || 0), 0);
    return Math.round(totalProgress / plan.items.length);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Planejado": return "bg-blue-100 text-blue-800";
      case "Em Andamento": return "bg-yellow-100 text-yellow-800";
      case "Concluído": return "bg-green-100 text-green-800";
      case "Cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case "Melhoria": return "bg-green-100 text-green-800";
      case "Corretiva": return "bg-red-100 text-red-800";
      case "Preventiva": return "bg-blue-100 text-blue-800";
      case "Projeto": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planos de Ação 5W2H</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie planos de ação estruturados com a metodologia 5W2H
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreateItemOpen} onOpenChange={setIsCreateItemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!actionPlans?.length}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Adicionar Ação (5W2H)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                  <div>
                    <Label htmlFor="plan-select">Plano de Ação</Label>
                    <Select
                      value={selectedPlanId}
                      onValueChange={setSelectedPlanId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionPlans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="responsible" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Quem? (Who)
                    </Label>
                    <Select
                      value={newItemData.who_responsible_user_id}
                      onValueChange={(value) => setNewItemData({...newItemData, who_responsible_user_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="what" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      O que? (What)
                    </Label>
                    <Textarea
                      id="what"
                      value={newItemData.what_action}
                      onChange={(e) => setNewItemData({...newItemData, what_action: e.target.value})}
                      placeholder="Descreva a ação que será executada"
                    />
                  </div>
                  <div>
                    <Label htmlFor="why" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Por que? (Why)
                    </Label>
                    <Textarea
                      id="why"
                      value={newItemData.why_reason}
                      onChange={(e) => setNewItemData({...newItemData, why_reason: e.target.value})}
                      placeholder="Justifique a necessidade da ação"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="where" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Onde? (Where)
                    </Label>
                    <Input
                      id="where"
                      value={newItemData.where_location}
                      onChange={(e) => setNewItemData({...newItemData, where_location: e.target.value})}
                      placeholder="Local onde será executada"
                    />
                  </div>
                  <div>
                    <Label htmlFor="when" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Quando? (When)
                    </Label>
                    <Input
                      id="when"
                      type="date"
                      value={newItemData.when_deadline}
                      onChange={(e) => setNewItemData({...newItemData, when_deadline: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="how" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Como? (How)
                    </Label>
                    <Textarea
                      id="how"
                      value={newItemData.how_method}
                      onChange={(e) => setNewItemData({...newItemData, how_method: e.target.value})}
                      placeholder="Método ou procedimento para execução"
                    />
                  </div>
                  <div>
                    <Label htmlFor="how-much" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Quanto? (How Much)
                    </Label>
                    <Input
                      id="how-much"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newItemData.how_much_cost}
                      onChange={(e) => setNewItemData({...newItemData, how_much_cost: parseFloat(e.target.value) || 0})}
                      placeholder="Custo estimado"
                    />
                  </div>
                </div>

                <Button onClick={handleCreateItem} className="w-full" disabled={!selectedPlanId}>
                  Adicionar Ação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Plano de Ação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Plano</Label>
                  <Input
                    id="title"
                    value={newPlanData.title}
                    onChange={(e) => setNewPlanData({...newPlanData, title: e.target.value})}
                    placeholder="Ex: Melhoria da Qualidade do Produto"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo do Plano</Label>
                  <Select
                    value={newPlanData.plan_type}
                    onValueChange={(value) => setNewPlanData({...newPlanData, plan_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Melhoria">Melhoria</SelectItem>
                      <SelectItem value="Corretiva">Corretiva</SelectItem>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                      <SelectItem value="Projeto">Projeto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="objective">Objetivo</Label>
                  <Textarea
                    id="objective"
                    value={newPlanData.objective}
                    onChange={(e) => setNewPlanData({...newPlanData, objective: e.target.value})}
                    placeholder="Objetivo do plano de ação"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newPlanData.description}
                    onChange={(e) => setNewPlanData({...newPlanData, description: e.target.value})}
                    placeholder="Descrição detalhada do plano"
                  />
                </div>
                <Button onClick={handleCreatePlan} className="w-full">
                  Criar Plano
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activePlans}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Ações</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedActions} concluídas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações em Atraso</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueActions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avgProgress}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {actionPlans?.map((plan) => (
          <Card key={plan.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {plan.title}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Badge className={getPlanTypeColor(plan.plan_type)}>
                  {plan.plan_type}
                </Badge>
                <Badge className={getStatusColor(plan.status)}>
                  {plan.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{calculatePlanProgress(plan)}%</span>
                </div>
                <Progress value={calculatePlanProgress(plan)} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-muted-foreground">
                <div>Total: {plan.items?.length || 0} ações</div>
                <div>Concluídas: {plan.items?.filter(item => item.status === 'Concluído').length || 0}</div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewPlan(plan)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setIsCreateItemOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Ação
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!actionPlans?.length && (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum plano de ação</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro plano de ação 5W2H
              </p>
              <Button onClick={() => setIsCreatePlanOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Action Plan Details Modal */}
        {selectedPlan && (
          <ActionPlanDetailsModal
            planId={selectedPlan.id}
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedPlan(null);
            }}
          />
        )}
    </>
  );
}