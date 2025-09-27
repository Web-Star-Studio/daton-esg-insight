import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Target, Calendar, User, MapPin, DollarSign, Settings, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { actionPlansService } from "@/services/actionPlans";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActionPlanDetailsModalProps {
  planId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ActionPlanDetailsModal({ planId, isOpen, onClose }: ActionPlanDetailsModalProps) {
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
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

  const { data: plan, isLoading } = useQuery({
    queryKey: ["action-plan", planId],
    queryFn: () => actionPlansService.getActionPlan(planId),
    enabled: isOpen && !!planId,
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

  const createItemMutation = useMutation({
    mutationFn: (itemData: any) => actionPlansService.createActionPlanItem(planId, itemData),
    onSuccess: () => {
      toast.success("Item adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["action-plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      setIsAddItemOpen(false);
      resetNewItemData();
    },
    onError: () => {
      toast.error("Erro ao adicionar item");
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ itemId, progress }: { itemId: string; progress: number }) =>
      actionPlansService.updateItemProgress(itemId, progress),
    onSuccess: () => {
      toast.success("Progresso atualizado!");
      queryClient.invalidateQueries({ queryKey: ["action-plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar progresso");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => actionPlansService.deleteActionPlanItem(itemId),
    onSuccess: () => {
      toast.success("Item removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["action-plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["action-plans"] });
    },
    onError: () => {
      toast.error("Erro ao remover item");
    },
  });

  const resetNewItemData = () => {
    setNewItemData({
      what_action: "",
      why_reason: "",
      where_location: "",
      when_deadline: "",
      how_method: "",
      how_much_cost: 0,
      who_responsible_user_id: ""
    });
  };

  const handleAddItem = () => {
    if (!newItemData.what_action || !newItemData.when_deadline) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createItemMutation.mutate(newItemData);
  };

  const handleProgressChange = (itemId: string, progress: number) => {
    updateProgressMutation.mutate({ itemId, progress });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pendente": return "bg-gray-100 text-gray-800";
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

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case "Concluído": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Em Andamento": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Pendente": return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === "Concluído") return false;
    const today = new Date().toISOString().split('T')[0];
    return deadline < today;
  };

  const calculatePlanProgress = () => {
    if (!plan?.items?.length) return 0;
    const totalProgress = plan.items.reduce((sum, item) => sum + (item.progress_percentage || 0), 0);
    return Math.round(totalProgress / plan.items.length);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!plan) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {plan.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="actions">Ações (5W2H)</TabsTrigger>
              <TabsTrigger value="analytics">Análise</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Progresso Geral</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{calculatePlanProgress()}%</div>
                    <Progress value={calculatePlanProgress()} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status}
                    </Badge>
                    <Badge className={`${getPlanTypeColor(plan.plan_type)} ml-2`}>
                      {plan.plan_type}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{plan.items?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">
                      {plan.items?.filter(item => item.status === 'Concluído').length || 0} concluídas
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Plano</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-semibold">Objetivo:</Label>
                    <p className="text-muted-foreground mt-1">{plan.objective}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Descrição:</Label>
                    <p className="text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Data de Criação:</Label>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(plan.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Ações do Plano</h3>
                <Button onClick={() => setIsAddItemOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ação
                </Button>
              </div>

              {plan.items && plan.items.length > 0 ? (
                <div className="space-y-4">
                  {plan.items.map((item) => (
                    <Card key={item.id} className={`${isOverdue(item.when_deadline, item.status) ? 'border-red-200 bg-red-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {getItemStatusIcon(item.status)}
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            {isOverdue(item.when_deadline, item.status) && (
                              <Badge variant="destructive">Em Atraso</Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              O que?
                            </Label>
                            <p className="text-sm text-muted-foreground">{item.what_action}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Por que?
                            </Label>
                            <p className="text-sm text-muted-foreground">{item.why_reason}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Onde?
                            </Label>
                            <p className="text-sm text-muted-foreground">{item.where_location}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Quando?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {item.when_deadline ? format(new Date(item.when_deadline), "dd/MM/yyyy", { locale: ptBR }) : 'Não definido'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <Settings className="h-3 w-3" />
                              Como?
                            </Label>
                            <p className="text-sm text-muted-foreground">{item.how_method}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Quanto?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {item.how_much_cost ? `R$ ${item.how_much_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não definido'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold">Progresso</Label>
                            <span className="text-sm text-muted-foreground">{item.progress_percentage || 0}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={item.progress_percentage || 0} className="flex-1" />
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={item.progress_percentage || 0}
                              onChange={(e) => handleProgressChange(item.id, parseInt(e.target.value) || 0)}
                              className="w-16 h-8"
                            />
                          </div>
                        </div>

                        {item.profiles && (
                          <div className="mt-3">
                            <Label className="text-sm font-semibold flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Responsável
                            </Label>
                            <p className="text-sm text-muted-foreground">{item.profiles.full_name}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma ação definida</h3>
                    <p className="text-muted-foreground mb-4">
                      Adicione ações utilizando a metodologia 5W2H
                    </p>
                    <Button onClick={() => setIsAddItemOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Primeira Ação
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['Pendente', 'Em Andamento', 'Concluído', 'Cancelado'].map(status => {
                        const count = plan.items?.filter(item => item.status === status).length || 0;
                        const percentage = plan.items && plan.items.length > 0 ? (count / plan.items.length) * 100 : 0;
                        
                        return (
                          <div key={status} className="flex justify-between items-center">
                            <Badge className={getStatusColor(status)}>{status}</Badge>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground w-8">{count}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ações em Atraso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.items?.filter(item => isOverdue(item.when_deadline, item.status)).map(item => (
                        <div key={item.id} className="p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm font-medium">{item.what_action}</p>
                          <p className="text-xs text-muted-foreground">
                            Prazo: {format(new Date(item.when_deadline), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      )) || <p className="text-muted-foreground">Nenhuma ação em atraso</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Ação (5W2H)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="responsible" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Quem? (Who) - Responsável
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
                  O que? (What) *
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
                  Quando? (When) *
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddItemOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddItem} className="flex-1">
                Adicionar Ação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}