import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck,
  FilePlus2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { QualityMetricsCard } from "@/components/QualityMetricsCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { triggerSmartNotifications } from "@/services/notifications";
import {
  stakeholderRequirementsService,
  type CreateStakeholderEvidenceInput,
  type CreateStakeholderMatrixReviewInput,
  type CreateStakeholderRequirementInput,
  type StakeholderMatrixReview,
  type StakeholderRequirement,
  type StakeholderRequirementFilters,
  type UpdateStakeholderRequirementInput,
} from "@/services/stakeholderRequirements";

type DueFilter = "all" | "overdue" | "7" | "30";

interface RequirementFormState {
  stakeholder_id: string;
  requirement_title: string;
  requirement_description: string;
  monitoring_method: string;
  is_legal_requirement: boolean;
  is_relevant_to_sgq: boolean;
  status: StakeholderRequirement["status"];
  responsible_user_id: string;
  linked_compliance_task_id: string;
  review_due_date: string;
  source_reference: string;
}

interface EvidenceFormState {
  document_id: string;
  evidence_url: string;
  evidence_note: string;
  evidence_date: string;
}

interface ReviewFormState {
  review_date: string;
  review_summary: string;
  management_review_reference: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const oneYearFromTodayISO = () => {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear.toISOString().slice(0, 10);
};

const defaultRequirementFormState = (): RequirementFormState => ({
  stakeholder_id: "",
  requirement_title: "",
  requirement_description: "",
  monitoring_method: "",
  is_legal_requirement: false,
  is_relevant_to_sgq: true,
  status: "nao_iniciado",
  responsible_user_id: "",
  linked_compliance_task_id: "none",
  review_due_date: oneYearFromTodayISO(),
  source_reference: "",
});

const defaultEvidenceFormState = (): EvidenceFormState => ({
  document_id: "none",
  evidence_url: "",
  evidence_note: "",
  evidence_date: todayISO(),
});

const defaultReviewFormState = (): ReviewFormState => ({
  review_date: todayISO(),
  review_summary: "",
  management_review_reference: "",
});

const invalidateStakeholderMatrixQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["stakeholder-requirements"] }),
    queryClient.invalidateQueries({ queryKey: ["stakeholder-requirement-kpis"] }),
    queryClient.invalidateQueries({ queryKey: ["stakeholder-requirement-alerts"] }),
    queryClient.invalidateQueries({ queryKey: ["stakeholder-matrix-reviews"] }),
  ]);
};

const formatDateLabel = (value: string | null | undefined) => {
  if (!value) return "Sem data";
  return format(new Date(`${value}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
};

const getStatusBadge = (status: StakeholderRequirement["status"]) => {
  switch (status) {
    case "atendido":
      return { label: "Atendido", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "em_atendimento":
      return { label: "Em atendimento", className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "bloqueado":
      return { label: "Bloqueado", className: "bg-rose-100 text-rose-700 border-rose-200" };
    default:
      return { label: "Não iniciado", className: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

const getAlertWindowBadge = (window: "30_days" | "7_days" | "due_or_overdue") => {
  switch (window) {
    case "due_or_overdue":
      return { label: "0 / atrasado", className: "bg-rose-100 text-rose-700 border-rose-200" };
    case "7_days":
      return { label: "7 dias", className: "bg-amber-100 text-amber-700 border-amber-200" };
    default:
      return { label: "30 dias", className: "bg-sky-100 text-sky-700 border-sky-200" };
  }
};

const formatDaysContext = (requirement: StakeholderRequirement) => {
  if (requirement.days_until_review === null || requirement.review_due_date === null) {
    return "Prazo não definido";
  }

  if (requirement.days_until_review < 0) {
    return `${Math.abs(requirement.days_until_review)} dia(s) em atraso`;
  }

  if (requirement.days_until_review === 0) {
    return "Vence hoje";
  }

  return `Vence em ${requirement.days_until_review} dia(s)`;
};

export default function MatrizPartesInteressadas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StakeholderRequirementFilters["status"]>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [stakeholderFilter, setStakeholderFilter] = useState<string>("all");
  const [legalFilter, setLegalFilter] = useState<StakeholderRequirementFilters["legal_requirement"]>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");

  const [requirementDialogOpen, setRequirementDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [concludeTarget, setConcludeTarget] = useState<StakeholderRequirement | null>(null);

  const [selectedRequirement, setSelectedRequirement] = useState<StakeholderRequirement | null>(null);
  const [requirementForm, setRequirementForm] = useState<RequirementFormState>(defaultRequirementFormState);
  const [evidenceForm, setEvidenceForm] = useState<EvidenceFormState>(defaultEvidenceFormState);
  const [reviewForm, setReviewForm] = useState<ReviewFormState>(defaultReviewFormState);

  const filters = useMemo<StakeholderRequirementFilters>(() => {
    const nextFilters: StakeholderRequirementFilters = {
      status: statusFilter,
      responsible_user_id: responsibleFilter === "all" ? "all" : responsibleFilter,
      stakeholder_id: stakeholderFilter === "all" ? "all" : stakeholderFilter,
      legal_requirement: legalFilter,
    };

    if (dueFilter === "overdue") {
      nextFilters.overdue_only = true;
    }

    if (dueFilter === "7") {
      nextFilters.due_within_days = 7;
    }

    if (dueFilter === "30") {
      nextFilters.due_within_days = 30;
    }

    return nextFilters;
  }, [dueFilter, legalFilter, responsibleFilter, stakeholderFilter, statusFilter]);

  const { data: requirements = [], isLoading: isLoadingRequirements } = useQuery({
    queryKey: ["stakeholder-requirements", filters],
    queryFn: () => stakeholderRequirementsService.getStakeholderRequirements(filters),
  });

  const { data: kpis, isLoading: isLoadingKpis } = useQuery({
    queryKey: ["stakeholder-requirement-kpis", filters],
    queryFn: () => stakeholderRequirementsService.getStakeholderRequirementKpis(filters),
  });

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ["stakeholder-matrix-reviews"],
    queryFn: () => stakeholderRequirementsService.getStakeholderMatrixReviews(),
  });

  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["stakeholder-requirement-alerts"],
    queryFn: () => stakeholderRequirementsService.getStakeholderRequirementAlerts(),
  });

  const { data: stakeholders = [] } = useQuery({
    queryKey: ["stakeholder-matrix-stakeholders"],
    queryFn: () => stakeholderRequirementsService.getStakeholdersForSelection(),
  });

  const { data: responsibleUsers = [] } = useQuery({
    queryKey: ["stakeholder-matrix-responsibles"],
    queryFn: () => stakeholderRequirementsService.getResponsibleUsers(),
  });

  const { data: complianceTasks = [] } = useQuery({
    queryKey: ["stakeholder-matrix-compliance-tasks"],
    queryFn: () => stakeholderRequirementsService.getComplianceTasksForSelection(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["stakeholder-matrix-documents"],
    queryFn: () => stakeholderRequirementsService.getDocumentsForEvidenceSelection(),
    enabled: evidenceDialogOpen,
  });

  const { data: evidences = [], isLoading: isLoadingEvidences } = useQuery({
    queryKey: ["stakeholder-requirement-evidences", selectedRequirement?.id],
    queryFn: () => stakeholderRequirementsService.getRequirementEvidences(selectedRequirement!.id),
    enabled: evidenceDialogOpen && !!selectedRequirement?.id,
  });

  const latestReview = reviews[0] ?? null;

  const requirementMutation = useMutation({
    mutationFn: async (payload: CreateStakeholderRequirementInput | UpdateStakeholderRequirementInput) => {
      if (selectedRequirement) {
        return stakeholderRequirementsService.updateStakeholderRequirement(
          selectedRequirement.id,
          payload as UpdateStakeholderRequirementInput,
        );
      }

      return stakeholderRequirementsService.createStakeholderRequirement(
        payload as CreateStakeholderRequirementInput,
      );
    },
    onSuccess: async () => {
      await invalidateStakeholderMatrixQueries(queryClient);
      setRequirementDialogOpen(false);
      setSelectedRequirement(null);
      setRequirementForm(defaultRequirementFormState());
      toast({
        title: "Matriz atualizada",
        description: selectedRequirement
          ? "O requisito foi atualizado com sucesso."
          : "O requisito foi cadastrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao salvar requisito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const evidenceMutation = useMutation({
    mutationFn: (payload: CreateStakeholderEvidenceInput) =>
      stakeholderRequirementsService.addRequirementEvidence(payload),
    onSuccess: async () => {
      await invalidateStakeholderMatrixQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: ["stakeholder-requirement-evidences", selectedRequirement?.id],
      });
      setEvidenceForm(defaultEvidenceFormState());
      toast({
        title: "Evidência registrada",
        description: "A evidência foi vinculada ao requisito.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao anexar evidência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeEvidenceMutation = useMutation({
    mutationFn: (evidenceId: string) => stakeholderRequirementsService.removeRequirementEvidence(evidenceId),
    onSuccess: async () => {
      await invalidateStakeholderMatrixQueries(queryClient);
      await queryClient.invalidateQueries({
        queryKey: ["stakeholder-requirement-evidences", selectedRequirement?.id],
      });
      toast({
        title: "Evidência removida",
        description: "A evidência foi removida da matriz.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao remover evidência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerCheckMutation = useMutation({
    mutationFn: (requirementId: string) =>
      stakeholderRequirementsService.registerRequirementCheck(requirementId),
    onSuccess: async () => {
      await invalidateStakeholderMatrixQueries(queryClient);
      toast({
        title: "Verificação registrada",
        description: "A data de verificação foi atualizada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao registrar verificação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const concludeRequirementMutation = useMutation({
    mutationFn: (requirementId: string) =>
      stakeholderRequirementsService.markRequirementAsAttended(requirementId),
    onSuccess: async () => {
      await invalidateStakeholderMatrixQueries(queryClient);
      setConcludeTarget(null);
      toast({
        title: "Requisito concluído",
        description: "O atendimento foi finalizado com evidência documental validada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao concluir atendimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: CreateStakeholderMatrixReviewInput) =>
      stakeholderRequirementsService.registerStakeholderMatrixReview(payload),
    onSuccess: async () => {
      await invalidateStakeholderMatrixQueries(queryClient);
      setReviewDialogOpen(false);
      setReviewForm(defaultReviewFormState());
      toast({
        title: "Revisão anual registrada",
        description: "A próxima revisão anual foi recalculada automaticamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao registrar revisão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshAlertsMutation = useMutation({
    mutationFn: () => triggerSmartNotifications("check_stakeholder_requirement_reviews"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["stakeholder-requirement-alerts"] });
      toast({
        title: "Alertas processados",
        description: "A rotina 30/7/0 foi disparada manualmente com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao processar alertas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openCreateRequirement = () => {
    setSelectedRequirement(null);
    setRequirementForm(defaultRequirementFormState());
    setRequirementDialogOpen(true);
  };

  const openEditRequirement = (requirement: StakeholderRequirement) => {
    setSelectedRequirement(requirement);
    setRequirementForm({
      stakeholder_id: requirement.stakeholder_id,
      requirement_title: requirement.requirement_title,
      requirement_description: requirement.requirement_description ?? "",
      monitoring_method: requirement.monitoring_method ?? "",
      is_legal_requirement: requirement.is_legal_requirement,
      is_relevant_to_sgq: requirement.is_relevant_to_sgq,
      status: requirement.status,
      responsible_user_id: requirement.responsible_user_id ?? "none",
      linked_compliance_task_id: requirement.linked_compliance_task_id ?? "none",
      review_due_date: requirement.review_due_date ?? oneYearFromTodayISO(),
      source_reference: requirement.source_reference ?? "",
    });
    setRequirementDialogOpen(true);
  };

  const openEvidenceDialog = (requirement: StakeholderRequirement) => {
    setSelectedRequirement(requirement);
    setEvidenceForm(defaultEvidenceFormState());
    setEvidenceDialogOpen(true);
  };

  const submitRequirement = async () => {
    if (!requirementForm.stakeholder_id) {
      toast({
        title: "Parte interessada obrigatória",
        description: "Selecione a parte interessada antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    if (!requirementForm.requirement_title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Informe o título do requisito.",
        variant: "destructive",
      });
      return;
    }

    if (!requirementForm.review_due_date) {
      toast({
        title: "Prazo de revisão obrigatório",
        description: "Defina a data de revisão para habilitar o ciclo anual e os alertas.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      stakeholder_id: requirementForm.stakeholder_id,
      requirement_title: requirementForm.requirement_title.trim(),
      requirement_description: requirementForm.requirement_description.trim(),
      monitoring_method: requirementForm.monitoring_method.trim(),
      is_legal_requirement: requirementForm.is_legal_requirement,
      is_relevant_to_sgq: requirementForm.is_relevant_to_sgq,
      status: requirementForm.status,
      responsible_user_id:
        requirementForm.responsible_user_id === "none" ? undefined : requirementForm.responsible_user_id,
      linked_compliance_task_id:
        requirementForm.linked_compliance_task_id === "none"
          ? undefined
          : requirementForm.linked_compliance_task_id,
      review_due_date: requirementForm.review_due_date,
      source_reference: requirementForm.source_reference.trim(),
    };

    await requirementMutation.mutateAsync(payload);
  };

  const submitEvidence = async () => {
    if (!selectedRequirement) return;

    if (
      evidenceForm.document_id === "none" &&
      !evidenceForm.evidence_url.trim() &&
      !evidenceForm.evidence_note.trim()
    ) {
      toast({
        title: "Informe a evidência",
        description: "Selecione um documento ou preencha uma URL/anotação.",
        variant: "destructive",
      });
      return;
    }

    await evidenceMutation.mutateAsync({
      stakeholder_requirement_id: selectedRequirement.id,
      document_id: evidenceForm.document_id === "none" ? null : evidenceForm.document_id,
      evidence_url: evidenceForm.evidence_url.trim() || undefined,
      evidence_note: evidenceForm.evidence_note.trim() || undefined,
      evidence_date: evidenceForm.evidence_date,
    });
  };

  const submitReview = async () => {
    if (!reviewForm.review_date || !reviewForm.review_summary.trim() || !reviewForm.management_review_reference.trim()) {
      toast({
        title: "Campos obrigatórios pendentes",
        description: "Preencha data, resumo e referência da análise crítica.",
        variant: "destructive",
      });
      return;
    }

    await reviewMutation.mutateAsync({
      review_date: reviewForm.review_date,
      review_summary: reviewForm.review_summary.trim(),
      management_review_reference: reviewForm.management_review_reference.trim(),
    });
  };

  const validateAndPrepareConclusion = async (requirement: StakeholderRequirement) => {
    try {
      const requirementEvidences = await stakeholderRequirementsService.getRequirementEvidences(requirement.id);
      const hasDocumentEvidence = requirementEvidences.some((item) => Boolean(item.document_id));

      if (!hasDocumentEvidence) {
        toast({
          title: "Evidência documental obrigatória",
          description:
            "Para concluir o atendimento é necessário anexar ao menos uma evidência com documento vinculado.",
          variant: "destructive",
        });
        openEvidenceDialog(requirement);
        return;
      }

      setConcludeTarget(requirement);
    } catch (error) {
      toast({
        title: "Falha ao validar evidências",
        description: error instanceof Error ? error.message : "Não foi possível validar as evidências do requisito.",
        variant: "destructive",
      });
    }
  };

  const qualityMetrics = [
    {
      title: "Total de requisitos",
      value: kpis?.total ?? 0,
      icon: <Users2 className="h-4 w-4 text-sky-600" />,
      description: "Itens mapeados na matriz 4.2",
    },
    {
      title: "Atendidos",
      value: kpis?.atendidos ?? 0,
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      variant: "success" as const,
      description: "Requisitos concluídos com evidência",
    },
    {
      title: "Pendentes",
      value: kpis?.pendentes ?? 0,
      icon: <Clock3 className="h-4 w-4 text-amber-600" />,
      variant: "warning" as const,
      description: "Itens não concluídos",
    },
    {
      title: "Vencidos",
      value: kpis?.vencidos ?? 0,
      icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
      variant: "destructive" as const,
      description: "Revisões fora do prazo",
    },
    {
      title: "Taxa de atendimento",
      value: kpis?.taxaAtendimento ?? 0,
      icon: <ShieldCheck className="h-4 w-4 text-indigo-600" />,
      unit: "%",
      description: "Percentual atendido no recorte filtrado",
    },
  ];

  if (isLoadingRequirements && requirements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-[520px]" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              ISO 9001:2015 • Cláusula 4.2
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Matriz de Partes Interessadas</h1>
              <p className="text-muted-foreground">
                Controle operacional de requisitos por parte interessada, com evidência documental,
                revisão anual mandatória e alertas automáticos 30/7/0.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => refreshAlertsMutation.mutate()}
              disabled={refreshAlertsMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshAlertsMutation.isPending ? "animate-spin" : ""}`} />
              Processar alertas
            </Button>
            <Button variant="outline" onClick={() => setReviewDialogOpen(true)}>
              <Clock3 className="mr-2 h-4 w-4" />
              Registrar revisão anual
            </Button>
            <Button onClick={openCreateRequirement}>
              <Plus className="mr-2 h-4 w-4" />
              Novo requisito
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {qualityMetrics.map((metric) => (
            <QualityMetricsCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              description={metric.description}
              unit={metric.unit}
              variant={metric.variant}
              isLoading={isLoadingKpis}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros operacionais</CardTitle>
            <CardDescription>
              Ajuste a visualização da matriz por status, responsável, requisito legal, prazo e parte interessada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StakeholderRequirement["status"] | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="nao_iniciado">Não iniciado</SelectItem>
                    <SelectItem value="em_atendimento">Em atendimento</SelectItem>
                    <SelectItem value="atendido">Atendido</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {responsibleUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Requisito legal</Label>
                <Select value={legalFilter} onValueChange={(value) => setLegalFilter(value as StakeholderRequirementFilters["legal_requirement"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Somente legais</SelectItem>
                    <SelectItem value="no">Somente não legais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Select value={dueFilter} onValueChange={(value) => setDueFilter(value as DueFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="overdue">Somente vencidos</SelectItem>
                    <SelectItem value="7">Até 7 dias</SelectItem>
                    <SelectItem value="30">Até 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Parte interessada</Label>
                <Select value={stakeholderFilter} onValueChange={setStakeholderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {stakeholders.map((stakeholder) => (
                      <SelectItem key={stakeholder.id} value={stakeholder.id}>
                        {stakeholder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matriz operacional</CardTitle>
            <CardDescription>
              {requirements.length} requisito(s) no recorte atual. O fechamento só é permitido com evidência documental vinculada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stakeholders.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cadastre partes interessadas primeiro</AlertTitle>
                <AlertDescription>
                  A matriz depende do cadastro prévio em Gestão de Stakeholders para selecionar a parte interessada em cada requisito.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Parte interessada</TableHead>
                    <TableHead className="min-w-[260px]">Requisito</TableHead>
                    <TableHead>SGQ</TableHead>
                    <TableHead>Legal</TableHead>
                    <TableHead className="min-w-[180px]">Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última verificação</TableHead>
                    <TableHead>Revisão</TableHead>
                    <TableHead>Evidências</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                        Nenhum requisito encontrado para os filtros informados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requirements.map((requirement) => {
                      const statusBadge = getStatusBadge(requirement.status);

                      return (
                        <TableRow key={requirement.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{requirement.stakeholder?.name ?? "Sem vínculo"}</div>
                              <div className="text-xs text-muted-foreground">
                                {requirement.stakeholder?.category ?? "Categoria não informada"}
                                {requirement.stakeholder?.organization
                                  ? ` • ${requirement.stakeholder.organization}`
                                  : ""}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{requirement.requirement_title}</div>
                              <div className="line-clamp-2 text-xs text-muted-foreground">
                                {requirement.requirement_description || requirement.monitoring_method || "Sem descrição adicional"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={requirement.is_relevant_to_sgq ? "default" : "outline"}>
                              {requirement.is_relevant_to_sgq ? "Relevante" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={requirement.is_legal_requirement ? "destructive" : "outline"}>
                              {requirement.is_legal_requirement ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell>{requirement.responsible?.full_name ?? "Não atribuído"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusBadge.className}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {requirement.last_checked_at
                              ? format(new Date(requirement.last_checked_at), "dd/MM/yyyy HH:mm")
                              : "Nunca verificado"}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className={requirement.is_overdue ? "font-medium text-rose-600" : ""}>
                                {formatDateLabel(requirement.review_due_date)}
                              </div>
                              <div className="text-xs text-muted-foreground">{formatDaysContext(requirement)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
                              <FileCheck className="h-3.5 w-3.5" />
                              {requirement.evidence_count}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditRequirement(requirement)}>
                                  Editar requisito
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEvidenceDialog(requirement)}>
                                  Anexar evidência
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => registerCheckMutation.mutate(requirement.id)}
                                  disabled={registerCheckMutation.isPending}
                                >
                                  Registrar verificação
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => validateAndPrepareConclusion(requirement)}
                                  disabled={requirement.status === "atendido"}
                                >
                                  Concluir atendimento
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Revisões anuais da matriz</CardTitle>
                <CardDescription>
                  Cada registro formaliza a análise crítica e recalcula o próximo prazo anual.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setReviewDialogOpen(true)}>
                <Clock3 className="mr-2 h-4 w-4" />
                Nova revisão
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestReview ? (
                <Alert>
                  <Clock3 className="h-4 w-4" />
                  <AlertTitle>Próxima revisão mandatória</AlertTitle>
                  <AlertDescription>
                    Última revisão em {formatDateLabel(latestReview.review_date)}.
                    Próximo vencimento em {formatDateLabel(latestReview.next_review_due_date)}.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Nenhuma revisão anual registrada</AlertTitle>
                  <AlertDescription>
                    Registre a primeira revisão formal para estabelecer o ciclo anual da matriz.
                  </AlertDescription>
                </Alert>
              )}

              {isLoadingReviews ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Sem revisões registradas até o momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: StakeholderMatrixReview) => (
                    <div key={review.id} className="rounded-xl border bg-card px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            Revisão de {formatDateLabel(review.review_date)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Próxima revisão: {formatDateLabel(review.next_review_due_date)}
                          </div>
                        </div>
                        <Badge variant="outline">{review.reviewed_by?.full_name ?? "Responsável não identificado"}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{review.review_summary}</p>
                      <div className="mt-3 text-xs font-medium text-sky-700">
                        Referência: {review.management_review_reference}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-sky-100">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Painel de alertas 30/7/0</CardTitle>
                <CardDescription>
                  Requisitos não atendidos com revisão próxima, urgente ou vencida.
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit">
                {alerts.length} alerta(s)
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAlerts ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full" />
                  ))}
                </div>
              ) : alerts.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum alerta ativo no momento.
                </div>
              ) : (
                alerts.map(({ requirement, alert_window }) => {
                  const windowBadge = getAlertWindowBadge(alert_window);
                  const statusBadge = getStatusBadge(requirement.status);

                  return (
                    <Alert key={`${requirement.id}-${alert_window}`} className="border-l-4 border-l-sky-300">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex flex-wrap items-center gap-2">
                        <span>{requirement.requirement_title}</span>
                        <Badge variant="outline" className={windowBadge.className}>
                          {windowBadge.label}
                        </Badge>
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <div className="text-sm">
                          <div className="font-medium">{requirement.stakeholder?.name ?? "Sem parte interessada"}</div>
                          <div className="text-muted-foreground">
                            Responsável: {requirement.responsible?.full_name ?? "Não atribuído"}
                          </div>
                          <div className="text-muted-foreground">
                            Revisão: {formatDateLabel(requirement.review_due_date)} • {formatDaysContext(requirement)}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openEditRequirement(requirement)}>
                          Abrir requisito
                        </Button>
                      </AlertDescription>
                    </Alert>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={requirementDialogOpen} onOpenChange={setRequirementDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRequirement ? "Editar requisito da matriz" : "Novo requisito da matriz"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Escopo do requisito</CardTitle>
                <CardDescription>Mapeie a parte interessada, o requisito e a fonte associada.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Parte interessada</Label>
                  <Select
                    value={requirementForm.stakeholder_id}
                    onValueChange={(value) => setRequirementForm((current) => ({ ...current, stakeholder_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a parte interessada" />
                    </SelectTrigger>
                    <SelectContent>
                      {stakeholders.map((stakeholder) => (
                        <SelectItem key={stakeholder.id} value={stakeholder.id}>
                          {stakeholder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Título do requisito</Label>
                  <Input
                    value={requirementForm.requirement_title}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        requirement_title: event.target.value,
                      }))
                    }
                    placeholder="Ex.: Evidenciar comunicação periódica com clientes"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição detalhada</Label>
                  <Textarea
                    rows={4}
                    value={requirementForm.requirement_description}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        requirement_description: event.target.value,
                      }))
                    }
                    placeholder="Descreva o requisito da parte interessada e a expectativa associada."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fonte / referência</Label>
                  <Input
                    value={requirementForm.source_reference}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        source_reference: event.target.value,
                      }))
                    }
                    placeholder="Contrato, ata, requisito legal, survey, política, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoramento e governança</CardTitle>
                <CardDescription>Defina responsável, prazo, status e vínculo com compliance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Método de monitoramento</Label>
                  <Textarea
                    rows={3}
                    value={requirementForm.monitoring_method}
                    onChange={(event) =>
                      setRequirementForm((current) => ({
                        ...current,
                        monitoring_method: event.target.value,
                      }))
                    }
                    placeholder="Como a organização monitora ou atende este requisito."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select
                      value={requirementForm.responsible_user_id}
                      onValueChange={(value) =>
                        setRequirementForm((current) => ({ ...current, responsible_user_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não atribuído</SelectItem>
                        {responsibleUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={requirementForm.status}
                      onValueChange={(value) =>
                        setRequirementForm((current) => ({
                          ...current,
                          status: value as StakeholderRequirement["status"],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_iniciado">Não iniciado</SelectItem>
                        <SelectItem value="em_atendimento">Em atendimento</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                        <SelectItem value="atendido">Atendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vencimento da revisão</Label>
                    <Input
                      type="date"
                      value={requirementForm.review_due_date}
                      onChange={(event) =>
                        setRequirementForm((current) => ({
                          ...current,
                          review_due_date: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tarefa de compliance vinculada</Label>
                    <Select
                      value={requirementForm.linked_compliance_task_id}
                      onValueChange={(value) =>
                        setRequirementForm((current) => ({
                          ...current,
                          linked_compliance_task_id: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem vínculo</SelectItem>
                        {complianceTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      checked={requirementForm.is_relevant_to_sgq}
                      onCheckedChange={(checked) =>
                        setRequirementForm((current) => ({
                          ...current,
                          is_relevant_to_sgq: checked === true,
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label>Relevante para o SGQ</Label>
                      <p className="text-xs text-muted-foreground">
                        Mantenha ativo quando o requisito fizer parte do escopo da cláusula 4.2.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Checkbox
                      checked={requirementForm.is_legal_requirement}
                      onCheckedChange={(checked) =>
                        setRequirementForm((current) => ({
                          ...current,
                          is_legal_requirement: checked === true,
                        }))
                      }
                    />
                    <div className="space-y-1">
                      <Label>Possui requisito legal</Label>
                      <p className="text-xs text-muted-foreground">
                        Marque quando houver obrigação normativa, regulatória ou contratual formal.
                      </p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <FileCheck className="h-4 w-4" />
                  <AlertTitle>Regra crítica de fechamento</AlertTitle>
                  <AlertDescription>
                    A conclusão do requisito será bloqueada sem pelo menos uma evidência com documento vinculado.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRequirementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitRequirement} disabled={requirementMutation.isPending}>
              {requirementMutation.isPending ? "Salvando..." : selectedRequirement ? "Salvar alterações" : "Criar requisito"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Evidências do requisito
              {selectedRequirement ? ` • ${selectedRequirement.requirement_title}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle>Anexar nova evidência</CardTitle>
                <CardDescription>
                  Selecione preferencialmente um documento do GED para habilitar o fechamento do requisito.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Documento vinculado</Label>
                  <Select
                    value={evidenceForm.document_id}
                    onValueChange={(value) =>
                      setEvidenceForm((current) => ({ ...current, document_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem documento</SelectItem>
                      {documents.map((document) => (
                        <SelectItem key={document.id} value={document.id}>
                          {document.file_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>URL da evidência</Label>
                  <Input
                    value={evidenceForm.evidence_url}
                    onChange={(event) =>
                      setEvidenceForm((current) => ({
                        ...current,
                        evidence_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data da evidência</Label>
                  <Input
                    type="date"
                    value={evidenceForm.evidence_date}
                    onChange={(event) =>
                      setEvidenceForm((current) => ({
                        ...current,
                        evidence_date: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea
                    rows={4}
                    value={evidenceForm.evidence_note}
                    onChange={(event) =>
                      setEvidenceForm((current) => ({
                        ...current,
                        evidence_note: event.target.value,
                      }))
                    }
                    placeholder="Contextualize o documento, a inspeção ou a comprovação anexada."
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={submitEvidence}
                  disabled={evidenceMutation.isPending || !selectedRequirement}
                >
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  {evidenceMutation.isPending ? "Salvando..." : "Adicionar evidência"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de evidências</CardTitle>
                <CardDescription>
                  Evidências já vinculadas ao requisito selecionado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingEvidences ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))
                ) : evidences.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhuma evidência vinculada.
                  </div>
                ) : (
                  evidences.map((evidence) => (
                    <div key={evidence.id} className="rounded-xl border px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {evidence.document?.file_name ?? evidence.evidence_url ?? "Evidência sem documento"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Data: {formatDateLabel(evidence.evidence_date)} • Adicionado por{" "}
                            {evidence.added_by?.full_name ?? "usuário não identificado"}
                          </div>
                          {evidence.evidence_note ? (
                            <p className="text-sm text-muted-foreground">{evidence.evidence_note}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {evidence.document_id ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              Documento válido
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sem documento</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm("Remover esta evidência da matriz?")) {
                                removeEvidenceMutation.mutate(evidence.id);
                              }
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar revisão anual da matriz</DialogTitle>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle>Análise crítica da matriz</CardTitle>
              <CardDescription>
                O próximo vencimento anual será calculado automaticamente a partir da data desta revisão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data da revisão</Label>
                <Input
                  type="date"
                  value={reviewForm.review_date}
                  onChange={(event) =>
                    setReviewForm((current) => ({ ...current, review_date: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Resumo da revisão</Label>
                <Textarea
                  rows={4}
                  value={reviewForm.review_summary}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      review_summary: event.target.value,
                    }))
                  }
                  placeholder="Sintetize as conclusões da revisão anual da matriz."
                />
              </div>

              <div className="space-y-2">
                <Label>Referência da análise crítica</Label>
                <Input
                  value={reviewForm.management_review_reference}
                  onChange={(event) =>
                    setReviewForm((current) => ({
                      ...current,
                      management_review_reference: event.target.value,
                    }))
                  }
                  placeholder="Ata, protocolo, registro SOGI, número de reunião, etc."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReview} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? "Registrando..." : "Registrar revisão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!concludeTarget} onOpenChange={(open) => !open && setConcludeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir atendimento do requisito?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marca o requisito como atendido. A validação documental já confirmou pelo menos uma evidência com documento vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => concludeTarget && concludeRequirementMutation.mutate(concludeTarget.id)}
            >
              Confirmar conclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
