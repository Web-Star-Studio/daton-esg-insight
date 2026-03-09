import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Target,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Calendar,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  createSWOTAnalysis,
  createSWOTItem,
  deleteSWOTItem,
  getSWOTAnalyses,
  getSWOTItems,
  getSWOTReviewHistory,
  registerSWOTReview,
  SWOTAnalysis,
  SWOTItem,
  SWOTReviewFrequency,
  SWOTTreatmentDecision,
  updateSWOTAnalysisReviewCadence,
  updateSWOTItem,
} from "@/services/strategic";
import {
  calculateSWOTTraceabilityMetrics,
  getSWOTReviewStatus,
  hasTraceabilityEvidence,
} from "@/utils/swotCompliance";
import { isDemoMode } from "@/utils/demoMode";

interface SWOTMatrixProps {
  strategicMapId?: string;
}

interface ActionPlanItemOption {
  id: string;
  what_action: string;
  action_plan_id: string;
  action_plans?: {
    title: string;
  } | null;
}

const REVIEW_FREQUENCY_OPTIONS: { value: SWOTReviewFrequency; label: string }[] = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "bienal", label: "Bienal" },
];

const TREATMENT_OPTIONS: { value: SWOTTreatmentDecision; label: string }[] = [
  { value: "nao_classificado", label: "Não classificado" },
  { value: "irrelevante", label: "Irrelevante" },
  { value: "relevante_requer_acoes", label: "Relevante: requer ações" },
];

const CATEGORY_ORDER: SWOTItem["category"][] = ["strengths", "weaknesses", "opportunities", "threats"];

export default function SWOTMatrix({ strategicMapId }: SWOTMatrixProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SWOTItem | null>(null);

  const [newAnalysis, setNewAnalysis] = useState({
    title: "",
    description: "",
    review_frequency: "anual" as SWOTReviewFrequency,
  });

  const [itemForm, setItemForm] = useState({
    category: "strengths" as SWOTItem["category"],
    item_text: "",
    description: "",
    impact_level: "medium" as SWOTItem["impact_level"],
    treatment_decision: "nao_classificado" as SWOTTreatmentDecision,
    linked_action_plan_item_id: "none",
    external_action_reference: "",
  });

  const [reviewForm, setReviewForm] = useState({
    review_date: "",
    review_summary: "",
    management_review_reference: "",
  });

  const queryClient = useQueryClient();

  const { data: analyses } = useQuery({
    queryKey: ["swot-analyses", strategicMapId],
    queryFn: () => getSWOTAnalyses(strategicMapId),
  });

  const { data: items } = useQuery({
    queryKey: ["swot-items", selectedAnalysis],
    queryFn: () => getSWOTItems(selectedAnalysis as string),
    enabled: Boolean(selectedAnalysis),
  });

  const { data: reviewHistory } = useQuery({
    queryKey: ["swot-review-history", selectedAnalysis],
    queryFn: () => getSWOTReviewHistory(selectedAnalysis as string),
    enabled: Boolean(selectedAnalysis),
  });

  const { data: actionPlanItems } = useQuery({
    queryKey: ["swot-action-plan-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_plan_items")
        .select("id, what_action, action_plan_id, action_plans(title)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data || []) as ActionPlanItemOption[];
    },
  });

  useEffect(() => {
    if (analyses?.length && !selectedAnalysis) {
      setSelectedAnalysis(analyses[0].id);
    }
  }, [analyses, selectedAnalysis]);

  const selectedAnalysisData = useMemo(
    () => analyses?.find((analysis) => analysis.id === selectedAnalysis) || null,
    [analyses, selectedAnalysis],
  );

  const traceabilityMetrics = useMemo(
    () => calculateSWOTTraceabilityMetrics(items || []),
    [items],
  );

  const reviewStatus = useMemo(() => {
    if (!selectedAnalysisData) return null;
    return getSWOTReviewStatus(selectedAnalysisData);
  }, [selectedAnalysisData]);

  const groupedItems = useMemo(() => {
    return (items || []).reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<SWOTItem["category"], SWOTItem[]>,
    );
  }, [items]);

  const isDemo = isDemoMode();

  const createAnalysisMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (isDemo) {
        toast.success("Análise SWOT criada com sucesso!");
        setIsCreateOpen(false);
        setNewAnalysis({ title: "", description: "", review_frequency: "anual" });
        queryClient.invalidateQueries({ queryKey: ["swot-analyses"] });
        return;
      }
      await createSWOTAnalysis({ ...newAnalysis, strategic_map_id: strategicMapId });
    },
    onSuccess: () => {
      if (!isDemo) {
        queryClient.invalidateQueries({ queryKey: ["swot-analyses", strategicMapId] });
        toast.success("Análise SWOT criada com sucesso!");
        setIsCreateOpen(false);
        setNewAnalysis({ title: "", description: "", review_frequency: "anual" });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar análise SWOT");
    },
  });

  const updateCadenceMutation = useMutation({
    mutationFn: ({ analysisId, frequency }: { analysisId: string; frequency: SWOTReviewFrequency }) =>
      updateSWOTAnalysisReviewCadence(analysisId, frequency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-analyses", strategicMapId] });
      toast.success("Periodicidade da revisão atualizada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar periodicidade");
    },
  });

  const saveItemMutation = useMutation({
<<<<<<< Updated upstream
    mutationFn: async () => {
      if (!selectedAnalysis) throw new Error("Nenhuma análise selecionada.");
=======
    mutationFn: async (analysisId: string) => {
      if (!analysisId) throw new Error("Nenhuma análise selecionada.");
      if (isDemo) {
        queryClient.invalidateQueries({ queryKey: ["swot-items"] });
        toast.success("Item SWOT salvo.");
        return;
      }
>>>>>>> Stashed changes

      if (
        itemForm.treatment_decision === "relevante_requer_acoes" &&
        itemForm.linked_action_plan_item_id === "none" &&
        !itemForm.external_action_reference.trim()
      ) {
        throw new Error("Itens relevantes exigem vínculo com ação (interna ou externa).");
      }

      const payload = {
        category: itemForm.category,
        item_text: itemForm.item_text,
        description: itemForm.description || null,
        impact_level: itemForm.impact_level,
        treatment_decision: itemForm.treatment_decision,
        linked_action_plan_item_id:
          itemForm.linked_action_plan_item_id === "none" ? null : itemForm.linked_action_plan_item_id,
        external_action_reference: itemForm.external_action_reference || null,
      };

      if (editingItem) {
        return updateSWOTItem(editingItem.id, payload);
      }

      return createSWOTItem({
        swot_analysis_id: selectedAnalysis,
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-items", selectedAnalysis] });
      toast.success(editingItem ? "Item SWOT atualizado com sucesso!" : "Item SWOT adicionado com sucesso!");
      handleCloseItemDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar item SWOT");
    },
  });

  const registerReviewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnalysis) throw new Error("Nenhuma análise selecionada.");
      if (!reviewForm.review_date || !reviewForm.review_summary.trim() || !reviewForm.management_review_reference.trim()) {
        throw new Error("Preencha todos os campos obrigatórios da revisão.");
      }

      return registerSWOTReview(selectedAnalysis, {
        review_date: reviewForm.review_date,
        review_summary: reviewForm.review_summary,
        management_review_reference: reviewForm.management_review_reference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-review-history", selectedAnalysis] });
      queryClient.invalidateQueries({ queryKey: ["swot-analyses", strategicMapId] });
      toast.success("Revisão registrada com sucesso!");
      setIsReviewOpen(false);
      setReviewForm({ review_date: "", review_summary: "", management_review_reference: "" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar revisão");
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deleteSWOTItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swot-items", selectedAnalysis] });
      toast.success("Item removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover item");
    },
  });

  const getCategoryInfo = (category: SWOTItem["category"]) => {
    switch (category) {
      case "strengths":
        return { label: "Forças", icon: Shield, color: "text-green-600", bg: "bg-green-50 border-green-200" };
      case "weaknesses":
        return { label: "Fraquezas", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200" };
      case "opportunities":
        return { label: "Oportunidades", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
      case "threats":
      default:
        return { label: "Ameaças", icon: Target, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
    }
  };

  const getTreatmentBadge = (decision: SWOTTreatmentDecision) => {
    switch (decision) {
      case "relevante_requer_acoes":
        return <Badge variant="destructive">Relevante: requer ações</Badge>;
      case "irrelevante":
        return <Badge variant="secondary">Irrelevante</Badge>;
      default:
        return <Badge variant="outline">Não classificado</Badge>;
    }
  };

  const getTraceabilityBadge = (item: SWOTItem) => {
    if (item.treatment_decision === "nao_classificado") {
      return <Badge variant="outline">Não classificado</Badge>;
    }

    if (item.treatment_decision === "irrelevante") {
      return <Badge variant="outline">Não aplicável</Badge>;
    }

    return hasTraceabilityEvidence(item) ? (
      <Badge className="bg-green-100 text-green-800">Rastreado</Badge>
    ) : (
      <Badge variant="destructive">Pendente</Badge>
    );
  };

  const handleOpenEditItem = (item: SWOTItem) => {
    setEditingItem(item);
    setItemForm({
      category: item.category,
      item_text: item.item_text,
      description: item.description || "",
      impact_level: item.impact_level,
      treatment_decision: item.treatment_decision,
      linked_action_plan_item_id: item.linked_action_plan_item_id || "none",
      external_action_reference: item.external_action_reference || "",
    });
    setIsItemOpen(true);
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setItemForm({
      category: "strengths",
      item_text: "",
      description: "",
      impact_level: "medium",
      treatment_decision: "nao_classificado",
      linked_action_plan_item_id: "none",
      external_action_reference: "",
    });
    setIsItemOpen(true);
  };

  const handleCloseItemDialog = () => {
    setIsItemOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Análise SWOT</h3>
          <p className="text-sm text-muted-foreground">
            Controle de contexto organizacional com periodicidade formal, revisões e rastreabilidade de ações.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Análise
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Análise SWOT</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="analysis-title">Título</Label>
                <Input
                  id="analysis-title"
                  value={newAnalysis.title}
                  onChange={(event) => setNewAnalysis((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Nome da análise SWOT"
                />
              </div>
              <div>
                <Label htmlFor="analysis-description">Descrição</Label>
                <Textarea
                  id="analysis-description"
                  value={newAnalysis.description}
                  onChange={(event) => setNewAnalysis((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Descrição da análise"
                />
              </div>
              <div>
                <Label>Periodicidade de Revisão</Label>
                <Select
                  value={newAnalysis.review_frequency}
                  onValueChange={(value: SWOTReviewFrequency) =>
                    setNewAnalysis((prev) => ({ ...prev, review_frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_FREQUENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!newAnalysis.title.trim()) {
                    toast.error("Informe o título da análise SWOT.");
                    return;
                  }
                  createAnalysisMutation.mutate();
                }}
                disabled={createAnalysisMutation.isPending}
              >
                {createAnalysisMutation.isPending ? "Criando..." : "Criar Análise"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {analyses && analyses.length > 0 && (
        <Select value={selectedAnalysis || undefined} onValueChange={(value) => setSelectedAnalysis(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma análise SWOT" />
          </SelectTrigger>
          <SelectContent>
            {analyses.map((analysis) => (
              <SelectItem key={analysis.id} value={analysis.id}>
                {analysis.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedAnalysisData && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Governança da Revisão</CardTitle>
              <CardDescription>
                Defina a periodicidade e registre evidências formais das revisões de contexto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <Label>Periodicidade</Label>
                  <Select
                    value={selectedAnalysisData.review_frequency}
                    onValueChange={(value: SWOTReviewFrequency) =>
                      updateCadenceMutation.mutate({
                        analysisId: selectedAnalysisData.id,
                        frequency: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Última Revisão</Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedAnalysisData.last_review_date || "Não registrada"}
                  </p>
                </div>
                <div>
                  <Label>Próxima Revisão</Label>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedAnalysisData.next_review_date || "Não calculada"}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-2">
                    {reviewStatus?.status === "on_time" && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        {reviewStatus.label}
                      </Badge>
                    )}
                    {reviewStatus?.status === "overdue" && (
                      <Badge variant="destructive">
                        <Clock3 className="mr-1 h-3 w-3" />
                        {reviewStatus.label}
                      </Badge>
                    )}
                    {reviewStatus?.status === "no_review" && (
                      <Badge variant="outline">
                        <FileText className="mr-1 h-3 w-3" />
                        {reviewStatus.label}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Registrar Revisão
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registrar Revisão SWOT</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="review-date">Data da Revisão</Label>
                        <Input
                          id="review-date"
                          type="date"
                          value={reviewForm.review_date}
                          onChange={(event) =>
                            setReviewForm((prev) => ({ ...prev, review_date: event.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-summary">Resumo da Revisão</Label>
                        <Textarea
                          id="review-summary"
                          value={reviewForm.review_summary}
                          onChange={(event) =>
                            setReviewForm((prev) => ({ ...prev, review_summary: event.target.value }))
                          }
                          placeholder="Principais mudanças e conclusões da revisão"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-reference">Referência da Análise Crítica (ata/SOGI)</Label>
                        <Input
                          id="review-reference"
                          value={reviewForm.management_review_reference}
                          onChange={(event) =>
                            setReviewForm((prev) => ({
                              ...prev,
                              management_review_reference: event.target.value,
                            }))
                          }
                          placeholder="Ex.: ATA-AC-2026-03 / SOGI#5678"
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => registerReviewMutation.mutate()}
                        disabled={registerReviewMutation.isPending}
                      >
                        {registerReviewMutation.isPending ? "Registrando..." : "Registrar Revisão"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Itens Relevantes</p>
                <p className="text-2xl font-semibold">{traceabilityMetrics.totalRelevant}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Relevantes Rastreado(s)</p>
                <p className="text-2xl font-semibold text-green-700">{traceabilityMetrics.tracedRelevant}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Relevantes Pendentes</p>
                <p className="text-2xl font-semibold text-red-700">{traceabilityMetrics.pendingRelevant}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Taxa de Rastreabilidade</p>
                <p className="text-2xl font-semibold">{traceabilityMetrics.traceabilityRate}%</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleOpenNewItem}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>

          <Dialog open={isItemOpen} onOpenChange={(open) => (open ? setIsItemOpen(true) : handleCloseItemDialog())}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item SWOT" : "Adicionar Item SWOT"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={itemForm.category}
                    onValueChange={(value: SWOTItem["category"]) =>
                      setItemForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strengths">Forças</SelectItem>
                      <SelectItem value="weaknesses">Fraquezas</SelectItem>
                      <SelectItem value="opportunities">Oportunidades</SelectItem>
                      <SelectItem value="threats">Ameaças</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item-text">Item</Label>
                  <Input
                    id="item-text"
                    value={itemForm.item_text}
                    onChange={(event) => setItemForm((prev) => ({ ...prev, item_text: event.target.value }))}
                    placeholder="Descreva o item"
                  />
                </div>
                <div>
                  <Label htmlFor="item-description">Descrição</Label>
                  <Textarea
                    id="item-description"
                    value={itemForm.description}
                    onChange={(event) => setItemForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Descrição detalhada"
                  />
                </div>
                <div>
                  <Label>Nível de Impacto</Label>
                  <Select
                    value={itemForm.impact_level}
                    onValueChange={(value: SWOTItem["impact_level"]) =>
                      setItemForm((prev) => ({ ...prev, impact_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Decisão de Tratamento</Label>
                  <Select
                    value={itemForm.treatment_decision}
                    onValueChange={(value: SWOTTreatmentDecision) =>
                      setItemForm((prev) => ({ ...prev, treatment_decision: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TREATMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {itemForm.treatment_decision === "relevante_requer_acoes" && (
                  <>
                    <div>
                      <Label>Vincular item interno de Plano de Ação (5W2H)</Label>
                      <Select
                        value={itemForm.linked_action_plan_item_id}
                        onValueChange={(value) =>
                          setItemForm((prev) => ({ ...prev, linked_action_plan_item_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item de ação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem vínculo interno</SelectItem>
                          {(actionPlanItems || []).map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {(option.action_plans?.title || "Plano") + " • " + option.what_action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="external-reference">Referência externa (FPLAN 020/FPLAN 007)</Label>
                      <Input
                        id="external-reference"
                        value={itemForm.external_action_reference}
                        onChange={(event) =>
                          setItemForm((prev) => ({
                            ...prev,
                            external_action_reference: event.target.value,
                          }))
                        }
                        placeholder="Ex.: FPLAN 020 - Ação AC-33"
                      />
                    </div>
                  </>
                )}

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!itemForm.item_text.trim()) {
                      toast.error("Informe o item SWOT.");
                      return;
                    }
                    saveItemMutation.mutate();
                  }}
                  disabled={saveItemMutation.isPending}
                >
                  {saveItemMutation.isPending
                    ? "Salvando..."
                    : editingItem
                      ? "Atualizar Item"
                      : "Adicionar Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CATEGORY_ORDER.map((category) => {
              const categoryInfo = getCategoryInfo(category);
              const categoryItems = groupedItems[category] || [];
              const Icon = categoryInfo.icon;

              return (
                <Card key={category} className={categoryInfo.bg}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`flex items-center gap-2 ${categoryInfo.color}`}>
                      <Icon className="h-5 w-5" />
                      {categoryInfo.label}
                    </CardTitle>
                    <CardDescription>{categoryItems.length} item(ns) identificado(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.item_text}</p>
                            {item.description && (
                              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              aria-label={`Editar item SWOT: ${item.item_text}`}
                              onClick={() => handleOpenEditItem(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              aria-label={`Remover item SWOT: ${item.item_text}`}
                              onClick={() => deleteItemMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant={item.impact_level === "high" ? "destructive" : item.impact_level === "medium" ? "secondary" : "outline"}>
                            Impacto: {item.impact_level === "high" ? "Alto" : item.impact_level === "medium" ? "Médio" : "Baixo"}
                          </Badge>
                          {getTreatmentBadge(item.treatment_decision)}
                          {getTraceabilityBadge(item)}
                        </div>
                      </div>
                    ))}

                    {categoryItems.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">Nenhum item cadastrado</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Revisões</CardTitle>
              <CardDescription>
                Registros imutáveis das revisões de contexto organizacional para evidência de auditoria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviewHistory && reviewHistory.length > 0 ? (
                <div className="space-y-2">
                  {reviewHistory.map((review) => (
                    <div
                      key={review.id}
                      className="flex flex-col gap-2 rounded-md border p-3 text-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium">Revisão #{review.revision_number} - {review.review_date}</p>
                        <p className="text-muted-foreground">{review.review_summary}</p>
                      </div>
                      <Badge variant="outline">{review.management_review_reference}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma revisão registrada.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!analyses?.length && (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Nenhuma análise SWOT</h3>
            <p className="mb-4 text-muted-foreground">
              Crie sua primeira análise SWOT para identificar forças, fraquezas, oportunidades e ameaças.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Análise
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
