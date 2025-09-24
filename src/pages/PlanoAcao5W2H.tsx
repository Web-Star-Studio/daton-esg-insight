import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Target, Calendar, User, MapPin, DollarSign, Settings, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActionPlan {
  id: string;
  title: string;
  description: string;
  objective: string;
  plan_type: string;
  status: string;
  created_at: string;
}

interface ActionPlanItem {
  id: string;
  what_action: string;
  why_reason: string;
  where_location: string;
  when_deadline: string;
  how_method: string;
  how_much_cost: number;
  status: string;
  progress_percentage: number;
}

export default function PlanoAcao5W2H() {
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
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
    how_much_cost: 0
  });

  const { data: actionPlans, isLoading } = useQuery({
    queryKey: ["action-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_plans")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ActionPlan[];
    },
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

  const handleCreatePlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const { error } = await supabase
        .from("action_plans")
        .insert([{ 
          ...newPlanData, 
          company_id: profile.company_id,
          created_by_user_id: user.id 
        }]);

      if (error) throw error;

      toast.success("Plano de ação criado com sucesso!");
      setIsCreatePlanOpen(false);
      setNewPlanData({
        title: "",
        description: "",
        objective: "",
        plan_type: "Melhoria"
      });
    } catch (error) {
      toast.error("Erro ao criar plano de ação");
      console.error(error);
    }
  };

  const handleCreateItem = async () => {
    try {
      const { error } = await supabase
        .from("action_plan_items")
        .insert([{
          ...newItemData,
          action_plan_id: selectedPlan
        }]);

      if (error) throw error;

      toast.success("Item do plano adicionado com sucesso!");
      setIsCreateItemOpen(false);
      setNewItemData({
        what_action: "",
        why_reason: "",
        where_location: "",
        when_deadline: "",
        how_method: "",
        how_much_cost: 0
      });
    } catch (error) {
      toast.error("Erro ao adicionar item do plano");
      console.error(error);
    }
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
                    value={selectedPlan}
                    onValueChange={setSelectedPlan}
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

                <Button onClick={handleCreateItem} className="w-full" disabled={!selectedPlan}>
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
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Plus className="h-4 w-4 mr-1" />
                  Ação
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
    </>
  );
}