import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Zap, Calendar, User, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface StrategicInitiative {
  id: string;
  title: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  budget?: number;
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  created_at: string;
}

interface StrategicInitiativesProps {
  strategicMapId?: string;
}

export default function StrategicInitiatives({ strategicMapId }: StrategicInitiativesProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newInitiative, setNewInitiative] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    budget: number;
    start_date: string;
    end_date: string;
  }>({
    title: "",
    description: "",
    priority: "medium",
    budget: 0,
    start_date: "",
    end_date: ""
  });

  const queryClient = useQueryClient();

  const { data: initiatives } = useQuery({
    queryKey: ["strategic-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_initiatives")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StrategicInitiative[];
    },
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async (initiativeData: typeof newInitiative) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const { error } = await supabase
        .from("strategic_initiatives")
        .insert([{ 
          ...initiativeData, 
          company_id: profile.company_id,
          strategic_map_id: strategicMapId,
          created_by_user_id: user.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-initiatives"] });
      toast.success("Iniciativa criada com sucesso!");
      setIsCreateOpen(false);
      setNewInitiative({
        title: "",
        description: "",
        priority: "medium",
        budget: 0,
        start_date: "",
        end_date: ""
      });
    },
    onError: () => {
      toast.error("Erro ao criar iniciativa");
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { error } = await supabase
        .from("strategic_initiatives")
        .update({ 
          progress_percentage: progress,
          status: progress >= 100 ? 'completed' : 'in_progress'
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-initiatives"] });
      toast.success("Progresso atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar progresso");
    },
  });

  const deleteInitiativeMutation = useMutation({
    mutationFn: async (initiativeId: string) => {
      const { error } = await supabase
        .from("strategic_initiatives")
        .delete()
        .eq("id", initiativeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-initiatives"] });
      toast.success("Iniciativa removida com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover iniciativa");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'planning': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída';
      case 'in_progress': return 'Em Andamento';
      case 'planning': return 'Planejamento';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return null;
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Vencida';
    if (diffDays === 0) return 'Vence hoje';
    if (diffDays === 1) return 'Vence amanhã';
    return `${diffDays} dias restantes`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Iniciativas Estratégicas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie projetos e iniciativas que suportam os objetivos estratégicos
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Iniciativa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Iniciativa Estratégica</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newInitiative.title}
                  onChange={(e) => setNewInitiative({...newInitiative, title: e.target.value})}
                  placeholder="Nome da iniciativa"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newInitiative.description}
                  onChange={(e) => setNewInitiative({...newInitiative, description: e.target.value})}
                  placeholder="Descreva a iniciativa e seus objetivos"
                />
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select 
                  value={newInitiative.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNewInitiative({...newInitiative, priority: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newInitiative.budget}
                  onChange={(e) => setNewInitiative({...newInitiative, budget: parseFloat(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newInitiative.start_date}
                    onChange={(e) => setNewInitiative({...newInitiative, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">Data de Término</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newInitiative.end_date}
                    onChange={(e) => setNewInitiative({...newInitiative, end_date: e.target.value})}
                  />
                </div>
              </div>
              <Button 
                onClick={() => createInitiativeMutation.mutate(newInitiative)} 
                className="w-full"
                disabled={createInitiativeMutation.isPending}
              >
                Criar Iniciativa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Iniciativas */}
      <div className="grid gap-4">
        {initiatives?.map((initiative) => (
          <Card key={initiative.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {initiative.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {initiative.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(initiative.priority) as any}>
                    {getPriorityLabel(initiative.priority)}
                  </Badge>
                  <Badge variant={getStatusColor(initiative.status) as any}>
                    {getStatusLabel(initiative.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progresso */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(initiative.progress_percentage)}%
                    </span>
                  </div>
                  <Progress value={initiative.progress_percentage} className="h-2" />
                  <div className="mt-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-24 h-8 text-xs"
                      placeholder="% progresso"
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 100) {
                          updateProgressMutation.mutate({ 
                            id: initiative.id, 
                            progress: value 
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {initiative.budget && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>R$ {initiative.budget.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {initiative.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Início: {new Date(initiative.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {initiative.end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={
                        getTimeRemaining(initiative.end_date) === 'Vencida' ? 'text-destructive' :
                        getTimeRemaining(initiative.end_date)?.includes('hoje') || 
                        getTimeRemaining(initiative.end_date)?.includes('amanhã') ? 'text-orange-600' :
                        'text-muted-foreground'
                      }>
                        {getTimeRemaining(initiative.end_date)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteInitiativeMutation.mutate(initiative.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!initiatives?.length && (
        <Card>
          <CardContent className="text-center py-8">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma iniciativa criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie iniciativas estratégicas para executar seus objetivos
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Iniciativa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}