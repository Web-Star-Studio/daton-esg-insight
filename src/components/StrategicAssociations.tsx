import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Link2, Target, AlertTriangle, Zap, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BSCObjective {
  id: string;
  name: string;
  description?: string;
  perspective_id: string;
  progress_percentage: number;
  perspectives: {
    name: string;
  };
}

interface Association {
  id: string;
  bsc_objective_id: string;
  associated_type: 'okr' | 'initiative' | 'risk' | 'indicator';
  associated_id: string;
  relationship_type: 'supports' | 'depends_on' | 'conflicts_with' | 'measures';
  weight: number;
  notes?: string;
}

interface AssociationItem {
  id: string;
  title: string;
  type: 'okr' | 'initiative' | 'risk' | 'indicator';
  status?: string;
  progress_percentage?: number;
}

export default function StrategicAssociations() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [relationshipType, setRelationshipType] = useState<string>('supports');
  const [weight, setWeight] = useState<number>(1.0);
  const [notes, setNotes] = useState<string>('');

  const queryClient = useQueryClient();

  // Fetch BSC Objectives
  const { data: objectives } = useQuery({
    queryKey: ["bsc-objectives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bsc_objectives")
        .select(`
          id,
          name,
          description,
          perspective_id,
          progress_percentage
        `)
        .order("name");
      
      if (error) throw error;
      return data as any;
    },
  });

  // Fetch existing associations
  const { data: associations } = useQuery({
    queryKey: ["strategic-associations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategic_associations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Association[];
    },
  });

  // Fetch available items to associate based on type
  const { data: availableItems } = useQuery({
    queryKey: ["available-items", selectedType],
    queryFn: async () => {
      if (!selectedType) return [];

      let items: AssociationItem[] = [];

      switch (selectedType) {
        case 'okr':
          const { data: okrs } = await supabase
            .from("okrs")
            .select("id, title, status, progress_percentage");
          items = okrs?.map(okr => ({ 
            id: okr.id,
            title: okr.title,
            type: 'okr' as const,
            status: okr.status,
            progress_percentage: okr.progress_percentage
          })) || [];
          break;

        case 'initiative':
          const { data: initiatives } = await supabase
            .from("strategic_initiatives")
            .select("id, title, status, progress_percentage");
          items = initiatives?.map(init => ({ 
            id: init.id,
            title: init.title,
            type: 'initiative' as const,
            status: init.status,
            progress_percentage: init.progress_percentage
          })) || [];
          break;

        case 'risk':
          const { data: risks } = await supabase
            .from("esg_risks")
            .select("id, risk_title, status")
            .limit(20);
          items = (risks || []).map(r => ({
            id: r.id,
            title: r.risk_title || 'Risco sem título',
            type: 'risk' as const,
            status: r.status || 'active'
          }));
          break;

        case 'indicator':
          const { data: indicators } = await supabase
            .from("gri_indicator_data")
            .select("id, indicator_id")
            .limit(20);
          items = (indicators || []).map(ind => ({
            id: ind.id,
            title: `Indicador ${ind.indicator_id}`,
            type: 'indicator' as const,
            status: 'active'
          }));
          break;
      }

      return items;
    },
    enabled: !!selectedType,
  });

  const createAssociationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) throw new Error("Company ID não encontrado");

      const { error } = await supabase
        .from("strategic_associations")
        .insert([{
          company_id: profile.company_id,
          bsc_objective_id: selectedObjective,
          associated_type: selectedType,
          associated_id: selectedItem,
          relationship_type: relationshipType,
          weight,
          notes: notes || null
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-associations"] });
      toast.success("Associação criada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao criar associação");
    },
  });

  const deleteAssociationMutation = useMutation({
    mutationFn: async (associationId: string) => {
      const { error } = await supabase
        .from("strategic_associations")
        .delete()
        .eq("id", associationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategic-associations"] });
      toast.success("Associação removida com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover associação");
    },
  });

  const resetForm = () => {
    setSelectedObjective('');
    setSelectedType('');
    setSelectedItem('');
    setRelationshipType('supports');
    setWeight(1.0);
    setNotes('');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'okr': return Target;
      case 'initiative': return Zap;
      case 'risk': return AlertTriangle;
      case 'indicator': return TrendingUp;
      default: return Link2;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'okr': return 'OKR';
      case 'initiative': return 'Iniciativa';
      case 'risk': return 'Risco';
      case 'indicator': return 'Indicador';
      default: return type;
    }
  };

  const getRelationshipLabel = (relationship: string) => {
    switch (relationship) {
      case 'supports': return 'Suporta';
      case 'depends_on': return 'Depende de';
      case 'conflicts_with': return 'Conflita com';
      case 'measures': return 'Mede';
      default: return relationship;
    }
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'supports': return 'default';
      case 'measures': return 'secondary';
      case 'depends_on': return 'outline';
      case 'conflicts_with': return 'destructive';
      default: return 'outline';
    }
  };

  const groupedAssociations = associations?.reduce((acc, assoc) => {
    if (!acc[assoc.bsc_objective_id]) {
      acc[assoc.bsc_objective_id] = [];
    }
    acc[assoc.bsc_objective_id].push(assoc);
    return acc;
  }, {} as Record<string, Association[]>) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Associações Estratégicas</h3>
          <p className="text-sm text-muted-foreground">
            Conecte objetivos BSC com OKRs, iniciativas, riscos e indicadores
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Associação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Associação Estratégica</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Objetivo BSC</Label>
                <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                  {objectives?.map((obj) => (
                      <SelectItem key={obj.id} value={obj.id}>
                        {obj.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Associação</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="okr">OKR</SelectItem>
                    <SelectItem value="initiative">Iniciativa Estratégica</SelectItem>
                    <SelectItem value="risk">Risco</SelectItem>
                    <SelectItem value="indicator">Indicador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedType && (
                <div>
                  <Label>Item</Label>
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Tipo de Relacionamento</Label>
                <Select value={relationshipType} onValueChange={setRelationshipType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supports">Suporta</SelectItem>
                    <SelectItem value="measures">Mede</SelectItem>
                    <SelectItem value="depends_on">Depende de</SelectItem>
                    <SelectItem value="conflicts_with">Conflita com</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weight">Peso (0.0 - 1.0)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre a associação"
                />
              </div>

              <Button 
                onClick={() => createAssociationMutation.mutate()} 
                className="w-full"
                disabled={!selectedObjective || !selectedType || !selectedItem || createAssociationMutation.isPending}
              >
                Criar Associação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Associações por Objetivo */}
      <div className="space-y-4">
        {objectives?.map((objective) => {
          const objectiveAssociations = groupedAssociations[objective.id] || [];
          
          if (objectiveAssociations.length === 0) return null;

          return (
            <Card key={objective.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {objective.name}
                </CardTitle>
                <CardDescription>
                  {objective.perspectives.name} • {objectiveAssociations.length} associações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {objectiveAssociations.map((association) => {
                    const Icon = getTypeIcon(association.associated_type);
                    
                    return (
                      <div 
                        key={association.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">
                              {getTypeLabel(association.associated_type)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Peso: {association.weight}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={getRelationshipColor(association.relationship_type) as any}>
                            {getRelationshipLabel(association.relationship_type)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAssociationMutation.mutate(association.id)}
                            className="h-8 w-8 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!objectives?.length && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum objetivo BSC encontrado</h3>
            <p className="text-muted-foreground">
              Crie objetivos no Balanced Scorecard para poder fazer associações
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}