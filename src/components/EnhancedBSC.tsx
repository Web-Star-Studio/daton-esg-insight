import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, TrendingUp, Users, DollarSign, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formErrorHandler } from "@/utils/formErrorHandler";
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

interface BSCPerspective {
  id: string;
  name: string;
  description: string;
  order_index: number;
  strategic_map_id: string;
}

interface BSCObjective {
  id: string;
  perspective_id: string;
  name: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  weight: number;
  progress_percentage: number;
  status: 'active' | 'inactive' | 'completed';
}

interface EnhancedBSCProps {
  strategicMapId?: string;
}

export default function EnhancedBSC({ strategicMapId }: EnhancedBSCProps) {
  const [isCreatePerspectiveOpen, setIsCreatePerspectiveOpen] = useState(false);
  const [isCreateObjectiveOpen, setIsCreateObjectiveOpen] = useState(false);
  const [selectedPerspective, setSelectedPerspective] = useState<string>('');
  const [newPerspective, setNewPerspective] = useState({
    name: "",
    description: ""
  });
  const [newObjective, setNewObjective] = useState({
    name: "",
    description: "",
    target_value: 0,
    unit: "",
    weight: 1.0
  });

  const queryClient = useQueryClient();

  // Fetch available strategic maps if no strategicMapId is provided
  const { data: strategicMaps } = useQuery({
    queryKey: ["strategic-maps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_maps")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !strategicMapId // Only fetch if no strategicMapId is provided
  });

  // Use the first available strategic map if none is provided
  const activeStrategicMapId = strategicMapId || strategicMaps?.[0]?.id;

  // Fetch perspectives
  const { data: perspectives } = useQuery({
    queryKey: ["bsc-perspectives", activeStrategicMapId],
    queryFn: async () => {
      if (!activeStrategicMapId) return [];
      
      const { data, error } = await supabase
        .from("bsc_perspectives")
        .select("*")
        .eq("strategic_map_id", activeStrategicMapId)
        .order("order_index");

      if (error) throw error;
      return data as BSCPerspective[];
    },
    enabled: !!activeStrategicMapId
  });

  // Fetch objectives
  const { data: objectives } = useQuery({
    queryKey: ["bsc-objectives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bsc_objectives")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as BSCObjective[];
    },
  });

  const createPerspectiveMutation = useMutation({
    mutationFn: async (perspectiveData: typeof newPerspective) => {
      if (!activeStrategicMapId) {
        throw new Error("Nenhum mapa estratégico disponível. Crie um mapa estratégico primeiro.");
      }

      return formErrorHandler.createRecord(async () => {
        // Get next order index
        const maxOrder = perspectives?.reduce((max, p) => Math.max(max, p.order_index), 0) || 0;

        const { data, error } = await supabase
          .from("bsc_perspectives")
          .insert([{
            ...perspectiveData,
            strategic_map_id: activeStrategicMapId,
            order_index: maxOrder + 1
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }, { 
        formType: 'Perspectiva BSC',
        successMessage: 'Perspectiva criada com sucesso!'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bsc-perspectives"] });
      queryClient.invalidateQueries({ queryKey: ["strategic-maps"] });
      setIsCreatePerspectiveOpen(false);
      setNewPerspective({ name: "", description: "" });
    },
    onError: (error: any) => {
      formErrorHandler.handleError(error, { formType: 'Perspectiva BSC', operation: 'create' });
    },
  });

  const createObjectiveMutation = useMutation({
    mutationFn: async (objectiveData: typeof newObjective) => {
      if (!selectedPerspective) throw new Error("Nenhuma perspectiva selecionada");

      return formErrorHandler.createRecord(async () => {
        const { data, error } = await supabase
          .from("bsc_objectives")
          .insert([{
            ...objectiveData,
            perspective_id: selectedPerspective,
            current_value: 0,
            progress_percentage: 0,
            status: 'active'
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }, { 
        formType: 'Objetivo BSC',
        successMessage: 'Objetivo criado com sucesso!'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bsc-objectives"] });
      setIsCreateObjectiveOpen(false);
      setNewObjective({ name: "", description: "", target_value: 0, unit: "", weight: 1.0 });
      setSelectedPerspective('');
    },
    onError: (error: any) => {
      formErrorHandler.handleError(error, { formType: 'Objetivo BSC', operation: 'create' });
    },
  });

  const deleteObjectiveMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      return formErrorHandler.handleFormSubmission(async () => {
        const { error } = await supabase
          .from("bsc_objectives")
          .delete()
          .eq("id", objectiveId);

        if (error) throw error;
      }, { formType: 'Objetivo BSC', operation: 'delete' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bsc-objectives"] });
    },
    onError: (error: any) => {
      formErrorHandler.handleError(error, { formType: 'Objetivo BSC', operation: 'delete' });
    },
  });

  const updateObjectiveProgressMutation = useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      const objective = objectives?.find(obj => obj.id === id);
      if (!objective) throw new Error("Objetivo não encontrado");

      const progressPercentage = objective.target_value && objective.target_value > 0 
        ? Math.min((currentValue / objective.target_value) * 100, 100) 
        : 0;

      const { error } = await supabase
        .from("bsc_objectives")
        .update({ 
          current_value: currentValue,
          progress_percentage: progressPercentage,
          status: progressPercentage >= 100 ? 'completed' : 'active'
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bsc-objectives"] });
      toast.success("Progresso atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar progresso");
    },
  });

  const getPerspectiveIcon = (name: string) => {
    if (name.toLowerCase().includes('financeira') || name.toLowerCase().includes('financial')) {
      return DollarSign;
    }
    if (name.toLowerCase().includes('cliente') || name.toLowerCase().includes('customer')) {
      return Users;
    }
    if (name.toLowerCase().includes('processo') || name.toLowerCase().includes('process')) {
      return TrendingUp;
    }
    return Target;
  };

  const getPerspectiveColor = (name: string) => {
    if (name.toLowerCase().includes('financeira')) return 'text-green-600';
    if (name.toLowerCase().includes('cliente')) return 'text-blue-600';
    if (name.toLowerCase().includes('processo')) return 'text-orange-600';
    return 'text-purple-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'active': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  const groupedObjectives = objectives?.reduce((acc, obj) => {
    if (!acc[obj.perspective_id]) acc[obj.perspective_id] = [];
    acc[obj.perspective_id].push(obj);
    return acc;
  }, {} as Record<string, BSCObjective[]>) || {};

  return (
    <div className="space-y-6">
      {/* Show message if no strategic maps available */}
      {!activeStrategicMapId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Nenhum Mapa Estratégico Disponível</p>
              <p className="text-sm text-amber-700">
                Para criar perspectivas BSC, você precisa primeiro criar um Mapa Estratégico na aba "Mapas".
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Balanced Scorecard</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie perspectivas e objetivos estratégicos
            {activeStrategicMapId && strategicMaps?.[0] && (
              <span className="block mt-1">
                Mapa atual: <span className="font-medium">{strategicMaps.find(m => m.id === activeStrategicMapId)?.name || "Mapa Padrão"}</span>
              </span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isCreatePerspectiveOpen} onOpenChange={setIsCreatePerspectiveOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!activeStrategicMapId}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Perspectiva
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Perspectiva BSC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newPerspective.name}
                    onChange={(e) => setNewPerspective({...newPerspective, name: e.target.value})}
                    placeholder="Ex: Perspectiva Financeira"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newPerspective.description}
                    onChange={(e) => setNewPerspective({...newPerspective, description: e.target.value})}
                    placeholder="Descrição da perspectiva"
                  />
                </div>
                <Button 
                  onClick={() => createPerspectiveMutation.mutate(newPerspective)} 
                  className="w-full"
                  disabled={createPerspectiveMutation.isPending}
                >
                  Criar Perspectiva
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateObjectiveOpen} onOpenChange={setIsCreateObjectiveOpen}>
            <DialogTrigger asChild>
              <Button disabled={!activeStrategicMapId || !perspectives?.length}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Objetivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Objetivo BSC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Perspectiva</Label>
                  <Select value={selectedPerspective} onValueChange={setSelectedPerspective}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma perspectiva" />
                    </SelectTrigger>
                    <SelectContent>
                      {perspectives?.map((perspective) => (
                        <SelectItem key={perspective.id} value={perspective.id}>
                          {perspective.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="obj_name">Nome do Objetivo</Label>
                  <Input
                    id="obj_name"
                    value={newObjective.name}
                    onChange={(e) => setNewObjective({...newObjective, name: e.target.value})}
                    placeholder="Ex: Aumentar receita em 15%"
                  />
                </div>
                <div>
                  <Label htmlFor="obj_description">Descrição</Label>
                  <Textarea
                    id="obj_description"
                    value={newObjective.description}
                    onChange={(e) => setNewObjective({...newObjective, description: e.target.value})}
                    placeholder="Como este objetivo será alcançado"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_value">Meta</Label>
                    <Input
                      id="target_value"
                      type="number"
                      value={newObjective.target_value}
                      onChange={(e) => setNewObjective({...newObjective, target_value: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unidade</Label>
                    <Input
                      id="unit"
                      value={newObjective.unit}
                      onChange={(e) => setNewObjective({...newObjective, unit: e.target.value})}
                      placeholder="%, R$, unidades"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="weight">Peso (0.0 - 1.0)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newObjective.weight}
                    onChange={(e) => setNewObjective({...newObjective, weight: parseFloat(e.target.value)})}
                  />
                </div>
                <Button 
                  onClick={() => createObjectiveMutation.mutate(newObjective)} 
                  className="w-full"
                  disabled={createObjectiveMutation.isPending || !selectedPerspective}
                >
                  Criar Objetivo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BSC Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {perspectives?.map((perspective) => {
          const Icon = getPerspectiveIcon(perspective.name);
          const perspectiveObjectives = groupedObjectives[perspective.id] || [];
          const averageProgress = perspectiveObjectives.length > 0
            ? perspectiveObjectives.reduce((sum, obj) => sum + obj.progress_percentage, 0) / perspectiveObjectives.length
            : 0;

          return (
            <Card key={perspective.id} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className={`flex items-center gap-2 ${getPerspectiveColor(perspective.name)}`}>
                  <Icon className="h-5 w-5" />
                  {perspective.name}
                </CardTitle>
                <CardDescription>
                  {perspective.description}
                </CardDescription>
                <div className="pt-2">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span>Progresso Médio</span>
                    <span>{Math.round(averageProgress)}%</span>
                  </div>
                  <Progress value={averageProgress} className="h-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {perspectiveObjectives.map((objective) => (
                  <div key={objective.id} className="p-3 border rounded-lg bg-background">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{objective.name}</h5>
                        {objective.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {objective.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={getStatusColor(objective.status) as any} className="text-xs">
                          {objective.status === 'completed' ? 'Completo' : 
                           objective.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteObjectiveMutation.mutate(objective.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {objective.target_value && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span>
                            Atual: {objective.current_value || 0} / {objective.target_value} {objective.unit}
                          </span>
                          <span>{Math.round(objective.progress_percentage)}%</span>
                        </div>
                        <Progress value={objective.progress_percentage} className="h-1" />
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-20 h-6 text-xs"
                            placeholder="Atual"
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value)) {
                                updateObjectiveProgressMutation.mutate({ 
                                  id: objective.id, 
                                  currentValue: value 
                                });
                              }
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            Peso: {objective.weight}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {perspectiveObjectives.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    Nenhum objetivo definido
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!perspectives?.length && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma perspectiva criada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando perspectivas do BSC (Financeira, Cliente, Processos, Aprendizado)
            </p>
            <Button onClick={() => setIsCreatePerspectiveOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Perspectiva
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}