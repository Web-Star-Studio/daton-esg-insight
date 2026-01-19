import { useState } from "react";
import { Plus, Trash2, Check, Clock, User, Calendar, Lightbulb, Loader2, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  useActionPlans, 
  useCreateActionPlan, 
  useUpdateActionPlan, 
  useDeleteActionPlan,
  useCompanyUsers,
  useCauseAnalysis,
  useNonConformity
} from "@/hooks/useNonConformity";
import { NCActionPlan } from "@/services/nonConformityService";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NCStage4PlanningProps {
  ncId: string;
  onComplete?: () => void;
}

interface ActionSuggestion {
  what_action: string;
  why_reason: string;
  how_method: string;
}

export function NCStage4Planning({ ncId, onComplete }: NCStage4PlanningProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NCActionPlan | null>(null);
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    what_action: "",
    why_reason: "",
    how_method: "",
    where_location: "",
    who_responsible_id: "",
    when_deadline: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    how_much_cost: "",
  });

  const { data: plans, isLoading } = useActionPlans(ncId);
  const { data: users } = useCompanyUsers();
  const { data: causeAnalysis } = useCauseAnalysis(ncId);
  const { data: nc } = useNonConformity(ncId);
  const createMutation = useCreateActionPlan();
  const updateMutation = useUpdateActionPlan();
  const deleteMutation = useDeleteActionPlan();

  const fetchSuggestions = async () => {
    if (!causeAnalysis?.root_cause) {
      toast.error("É necessário ter uma causa raiz identificada para gerar sugestões");
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('nc-action-suggestions', {
        body: {
          ncTitle: nc?.title || '',
          ncDescription: nc?.description || '',
          rootCause: causeAnalysis.root_cause,
          analysisMethod: causeAnalysis.analysis_method,
          contributingFactors: causeAnalysis.ishikawa_data || causeAnalysis.five_whys_data || ''
        }
      });

      if (error) throw error;
      
      if (data?.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        toast.success("Sugestões geradas com sucesso!");
      } else {
        toast.info("Não foi possível gerar sugestões no momento");
      }
    } catch (error: any) {
      console.error("Error fetching suggestions:", error);
      if (error.message?.includes("429")) {
        toast.error("Limite de requisições atingido. Tente novamente em alguns minutos.");
      } else if (error.message?.includes("402")) {
        toast.error("Créditos de IA esgotados. Entre em contato com o administrador.");
      } else {
        toast.error("Erro ao gerar sugestões de ações");
      }
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const applySuggestion = (suggestion: ActionSuggestion) => {
    setFormData({
      ...formData,
      what_action: suggestion.what_action,
      why_reason: suggestion.why_reason,
      how_method: suggestion.how_method,
    });
    setIsAddDialogOpen(true);
    toast.success("Sugestão aplicada! Complete os demais campos.");
  };

  const resetForm = () => {
    setFormData({
      what_action: "",
      why_reason: "",
      how_method: "",
      where_location: "",
      who_responsible_id: "",
      when_deadline: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      how_much_cost: "",
    });
    setEditingPlan(null);
  };

  const handleSubmit = () => {
    if (!formData.what_action.trim()) {
      toast.error("Descreva o que deve ser feito");
      return;
    }
    if (!formData.when_deadline) {
      toast.error("Defina um prazo");
      return;
    }

    if (editingPlan) {
      updateMutation.mutate({
        id: editingPlan.id,
        updates: {
          what_action: formData.what_action,
          why_reason: formData.why_reason,
          how_method: formData.how_method,
          where_location: formData.where_location,
          who_responsible_id: formData.who_responsible_id || undefined,
          when_deadline: formData.when_deadline,
          how_much_cost: formData.how_much_cost,
        },
      }, {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      });
    } else {
      createMutation.mutate({
        non_conformity_id: ncId,
        what_action: formData.what_action,
        why_reason: formData.why_reason,
        how_method: formData.how_method,
        where_location: formData.where_location,
        who_responsible_id: formData.who_responsible_id || undefined,
        when_deadline: formData.when_deadline,
        how_much_cost: formData.how_much_cost,
        status: "Planejada",
        attachments: [],
        order_index: plans?.length || 0,
      } as any, {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleEdit = (plan: NCActionPlan) => {
    setEditingPlan(plan);
    setFormData({
      what_action: plan.what_action,
      why_reason: plan.why_reason || "",
      how_method: plan.how_method || "",
      where_location: plan.where_location || "",
      who_responsible_id: plan.who_responsible_id || "",
      when_deadline: plan.when_deadline,
      how_much_cost: plan.how_much_cost || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ação?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Concluída":
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case "Em Execução":
        return <Badge className="bg-blue-100 text-blue-800">Em Execução</Badge>;
      case "Cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Planejada</Badge>;
    }
  };

  const hasPlans = plans && plans.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</span>
            Planejamento de Ações (5W2H)
          </CardTitle>
          <CardDescription>
            Defina as ações corretivas e preventivas para eliminar a causa raiz
          </CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Ação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Ação" : "Nova Ação (5W2H)"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
              {/* What */}
              <div className="p-4 border rounded-lg bg-blue-50/50">
                <Label htmlFor="what" className="text-blue-800 font-medium">
                  O QUÊ? (What) *
                </Label>
                <Textarea
                  id="what"
                  value={formData.what_action}
                  onChange={(e) => setFormData({ ...formData, what_action: e.target.value })}
                  placeholder="O que deve ser feito para corrigir o problema?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* Why */}
              <div className="p-4 border rounded-lg bg-green-50/50">
                <Label htmlFor="why" className="text-green-800 font-medium">
                  POR QUÊ? (Why)
                </Label>
                <Textarea
                  id="why"
                  value={formData.why_reason}
                  onChange={(e) => setFormData({ ...formData, why_reason: e.target.value })}
                  placeholder="Por que esta ação é necessária?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              {/* How */}
              <div className="p-4 border rounded-lg bg-yellow-50/50">
                <Label htmlFor="how" className="text-yellow-800 font-medium">
                  COMO? (How)
                </Label>
                <Textarea
                  id="how"
                  value={formData.how_method}
                  onChange={(e) => setFormData({ ...formData, how_method: e.target.value })}
                  placeholder="Como a ação será executada?"
                  rows={2}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Where */}
                <div className="p-4 border rounded-lg bg-purple-50/50">
                  <Label htmlFor="where" className="text-purple-800 font-medium">
                    ONDE? (Where)
                  </Label>
                  <Input
                    id="where"
                    value={formData.where_location}
                    onChange={(e) => setFormData({ ...formData, where_location: e.target.value })}
                    placeholder="Local da execução"
                    className="mt-2"
                  />
                </div>

                {/* Who */}
                <div className="p-4 border rounded-lg bg-orange-50/50">
                  <Label htmlFor="who" className="text-orange-800 font-medium">
                    QUEM? (Who)
                  </Label>
                  <Select
                    value={formData.who_responsible_id}
                    onValueChange={(value) => setFormData({ ...formData, who_responsible_id: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Responsável..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* When */}
                <div className="p-4 border rounded-lg bg-red-50/50">
                  <Label htmlFor="when" className="text-red-800 font-medium">
                    QUANDO? (When) *
                  </Label>
                  <Input
                    id="when"
                    type="date"
                    value={formData.when_deadline}
                    onChange={(e) => setFormData({ ...formData, when_deadline: e.target.value })}
                    className="mt-2"
                  />
                </div>

                {/* How Much */}
                <div className="p-4 border rounded-lg bg-teal-50/50">
                  <Label htmlFor="howmuch" className="text-teal-800 font-medium">
                    QUANTO? (How Much)
                  </Label>
                  <Input
                    id="howmuch"
                    value={formData.how_much_cost}
                    onChange={(e) => setFormData({ ...formData, how_much_cost: e.target.value })}
                    placeholder="Custo estimado"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPlan ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lembrete da Causa Raiz */}
        {causeAnalysis?.root_cause && (
          <Alert className="bg-amber-50 border-amber-200">
            <Search className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-medium">
              Causa Raiz Identificada (Etapa Anterior)
            </AlertTitle>
            <AlertDescription className="text-amber-700 mt-2">
              <p className="font-medium">{causeAnalysis.root_cause}</p>
              {causeAnalysis.analysis_method && (
                <p className="text-xs mt-1 opacity-75">
                  Método: {causeAnalysis.analysis_method === '5_whys' ? '5 Porquês' : 
                           causeAnalysis.analysis_method === 'ishikawa' ? 'Diagrama de Ishikawa' : 
                           causeAnalysis.analysis_method === 'root_cause' ? 'Análise de Causa Raiz' : 'Outro'}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Sugestões de IA */}
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              <h4 className="font-medium text-amber-800">Sugestões de Ações (IA)</h4>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchSuggestions}
              disabled={isLoadingSuggestions || !causeAnalysis?.root_cause}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              {isLoadingSuggestions ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Gerar Sugestões
                </>
              )}
            </Button>
          </div>
          
          {!causeAnalysis?.root_cause && (
            <p className="text-sm text-muted-foreground">
              Complete a análise de causa (Etapa 3) para gerar sugestões de ações.
            </p>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3 mt-3">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{suggestion.what_action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Por quê:</span> {suggestion.why_reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Como:</span> {suggestion.how_method}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="shrink-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Usar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabela de Ações */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : hasPlans ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>O que fazer</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan, index) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="max-w-[250px]">
                    <p className="truncate font-medium">{plan.what_action}</p>
                    {plan.why_reason && (
                      <p className="text-xs text-muted-foreground truncate">
                        Por quê: {plan.why_reason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {plan.responsible?.full_name || "Não definido"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(plan.when_deadline), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(plan)}
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma ação planejada.</p>
            <p className="text-sm">Adicione ações corretivas e preventivas usando a metodologia 5W2H.</p>
          </div>
        )}

        {hasPlans && onComplete && (
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button onClick={onComplete}>
              <Check className="h-4 w-4 mr-2" />
              Concluir Planejamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
