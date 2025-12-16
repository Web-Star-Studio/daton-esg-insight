import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings, Plus, Pencil, Trash2, Save, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getEvaluationCriteria,
  getEvaluationConfig,
  createEvaluationCriteria,
  updateEvaluationCriteria,
  deleteEvaluationCriteria,
  upsertEvaluationConfig,
  initializeDefaultCriteria,
  SupplierEvaluationCriteria,
  DEFAULT_CRITERIA,
} from "@/services/supplierCriteriaService";

export default function SupplierEvaluationCriteriaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<SupplierEvaluationCriteria | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", weight: 1 });
  const [minimumPoints, setMinimumPoints] = useState(0);

  const { data: criteria, isLoading } = useQuery({
    queryKey: ["evaluation-criteria"],
    queryFn: getEvaluationCriteria,
  });

  const { data: config } = useQuery({
    queryKey: ["evaluation-config"],
    queryFn: getEvaluationConfig,
  });

  // Update minimum points when config loads
  useEffect(() => {
    if (config) setMinimumPoints(config.minimum_approval_points);
  }, [config]);

  const totalWeight = criteria?.filter(c => c.is_active).reduce((sum, c) => sum + c.weight, 0) || 0;

  const createMutation = useMutation({
    mutationFn: createEvaluationCriteria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      toast({ title: "Critério criado com sucesso!" });
      handleCloseDialog();
    },
    onError: () => toast({ title: "Erro ao criar critério", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SupplierEvaluationCriteria> }) =>
      updateEvaluationCriteria(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      toast({ title: "Critério atualizado!" });
      handleCloseDialog();
    },
    onError: () => toast({ title: "Erro ao atualizar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvaluationCriteria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      toast({ title: "Critério excluído!" });
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  const configMutation = useMutation({
    mutationFn: upsertEvaluationConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-config"] });
      toast({ title: "Configuração salva!" });
    },
    onError: () => toast({ title: "Erro ao salvar configuração", variant: "destructive" }),
  });

  const initMutation = useMutation({
    mutationFn: initializeDefaultCriteria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria"] });
      toast({ title: "Critérios padrão criados!" });
    },
    onError: () => toast({ title: "Erro ao criar critérios padrão", variant: "destructive" }),
  });

  const handleOpenDialog = (criteria?: SupplierEvaluationCriteria) => {
    if (criteria) {
      setEditingCriteria(criteria);
      setFormData({ name: criteria.name, description: criteria.description || "", weight: criteria.weight });
    } else {
      setEditingCriteria(null);
      setFormData({ name: "", description: "", weight: 1 });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCriteria(null);
    setFormData({ name: "", description: "", weight: 1 });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    
    if (editingCriteria) {
      updateMutation.mutate({ id: editingCriteria.id, updates: formData });
    } else {
      createMutation.mutate({ ...formData, display_order: (criteria?.length || 0) + 1 });
    }
  };

  const handleToggleActive = (criteria: SupplierEvaluationCriteria) => {
    updateMutation.mutate({ id: criteria.id, updates: { is_active: !criteria.is_active } });
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Configuração de Critérios [AVA2]
            </h1>
            <p className="text-muted-foreground mt-1">
              Defina os critérios e pesos para avaliação de fornecedores
            </p>
          </div>
          <div className="flex gap-2">
            {(!criteria || criteria.length === 0) && (
              <Button variant="outline" onClick={() => initMutation.mutate()}>
                <Wand2 className="h-4 w-4 mr-2" />
                Criar Critérios Padrão
              </Button>
            )}
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Critério
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{criteria?.filter(c => c.is_active).length || 0}</div>
              <p className="text-sm text-muted-foreground">Critérios Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{totalWeight}</div>
              <p className="text-sm text-muted-foreground">Peso Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={minimumPoints}
                  onChange={(e) => setMinimumPoints(parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                  min={0}
                  max={totalWeight}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => configMutation.mutate({ minimum_approval_points: minimumPoints })}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Mínimo para Aprovação</p>
            </CardContent>
          </Card>
        </div>

        {/* Criteria Table */}
        <Card>
          <CardHeader>
            <CardTitle>Critérios de Avaliação</CardTitle>
            <CardDescription>
              Configure os critérios que serão usados na avaliação AVA2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              empty={!criteria?.length}
              emptyMessage="Nenhum critério cadastrado. Clique em 'Criar Critérios Padrão' para iniciar."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Critério</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-24 text-center">Peso</TableHead>
                    <TableHead className="w-24 text-center">Ativo</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criteria?.map((c) => (
                    <TableRow key={c.id} className={!c.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.description || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">{c.weight}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={c.is_active}
                          onCheckedChange={() => handleToggleActive(c)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(c.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCriteria ? "Editar Critério" : "Novo Critério"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Critério *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Qualidade do produto/serviço"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do critério..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Peso (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
              <Button onClick={handleSubmit}>
                {editingCriteria ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
