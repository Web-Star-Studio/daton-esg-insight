import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ClipboardCheck,
  Loader2,
  Users,
  MessageSquare,
  Search,
  UserPlus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";

import { DateInputWithCalendarForm } from "@/components/DateInputWithCalendarForm";
import {
  getTrainingProgramParticipants,
  type TrainingParticipant,
} from "@/services/trainingProgramParticipants";
import {
  getEfficacyEvaluations,
  createEfficacyEvaluation,
} from "@/services/trainingEfficacyEvaluations";
import { createEmployeeTraining } from "@/services/trainingPrograms";
import { getEvaluatorByTrainingId } from "@/services/efficacyEvaluationDashboard";

const EFFECTIVENESS_OPTIONS = [
  {
    value: "effective",
    label: "Eficaz",
    shortLabel: "Eficaz",
    description: "Treinamento atingiu os objetivos esperados.",
    icon: CheckCircle2,
    color: "text-green-600",
    activeClasses:
      "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40",
    score: 10,
    is_effective: true,
    defaultComment:
      "O treinamento atingiu os objetivos esperados. O colaborador demonstrou domínio do conteúdo e aplicação prática nas atividades.",
  },
  {
    value: "partial",
    label: "Parcialmente Eficaz",
    shortLabel: "Parcial",
    description: "Atingiu parte dos objetivos; há pontos de melhoria.",
    icon: AlertTriangle,
    color: "text-yellow-600",
    activeClasses:
      "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40",
    score: 6,
    is_effective: true,
    defaultComment:
      "O treinamento atingiu parcialmente os objetivos. Há pontos de melhoria identificados que devem ser trabalhados em próximas edições.",
  },
  {
    value: "not_effective",
    label: "Não Eficaz",
    shortLabel: "Não Eficaz",
    description: "Não atingiu os objetivos esperados.",
    icon: XCircle,
    color: "text-red-600",
    activeClasses:
      "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40",
    score: 3,
    is_effective: false,
    defaultComment:
      "O treinamento não atingiu os objetivos esperados. Recomenda-se revisão do conteúdo e/ou metodologia antes de nova aplicação.",
  },
] as const;

type EffectivenessValue = (typeof EFFECTIVENESS_OPTIONS)[number]["value"];

interface RowState {
  effectiveness: EffectivenessValue | null;
  comments: string;
  commentsTouched: boolean;
}

interface TrainingProgramEvaluationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainingProgramId: string | null;
  trainingProgramName: string;
}

// Tela em massa: lista todos os colaboradores pendentes em uma única view com
// os botões de avaliação (Eficaz / Parcial / Não Eficaz) ao lado de cada nome,
// permitindo registrar tudo de uma vez sem navegar individualmente.
export function TrainingProgramEvaluationFlow({
  open,
  onOpenChange,
  trainingProgramId,
  trainingProgramName,
}: TrainingProgramEvaluationFlowProps) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [evaluationDate, setEvaluationDate] = useState<Date>(new Date());
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do painel de inscrição (aparece quando o programa não tem
  // participantes ainda). Permite buscar colaboradores da empresa inteira
  // e inscrevê-los antes de avaliar — sem isso, programas sem participantes
  // não tinham caminho de saída do wizard e ficavam "Atrasado 0/0" pra sempre.
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollDept, setEnrollDept] = useState<string>("all");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set(),
  );
  const [isEnrolling, setIsEnrolling] = useState(false);

  const { data: participants = [], isLoading: loadingParticipants } = useQuery({
    queryKey: ["program-efficacy-participants", trainingProgramId],
    queryFn: () => getTrainingProgramParticipants(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  // Avaliador cadastrado no programa (efficacy_evaluator_employee_id) —
  // exibido no header do modal. Sem isso a UI mostrava o usuário logado,
  // confundindo admin/matriz com o avaliador real da filial.
  const { data: assignedEvaluator } = useQuery({
    queryKey: ["program-efficacy-assigned-evaluator", trainingProgramId],
    queryFn: () => getEvaluatorByTrainingId(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  // Lista de employees ativos da empresa — pattern espelhado do
  // TrainingProgramModal (sem filtro por branch_id, pra manter consistência
  // com o fluxo de criação de treinamento, onde colaboradores de qualquer
  // unidade podem ser inscritos).
  const { data: companyEmployees = [], isLoading: loadingEmployees } = useQuery(
    {
      queryKey: [
        "employees-for-evaluation-enroll",
        selectedCompany?.id,
      ],
      queryFn: async () => {
        const PAGE_SIZE = 1000;
        let all: Array<{
          id: string;
          full_name: string;
          employee_code: string | null;
          department: string | null;
          status: string | null;
        }> = [];
        let from = 0;
        let hasMore = true;
        while (hasMore) {
          const { data, error } = await supabase
            .from("employees")
            .select("id, full_name, employee_code, department, status")
            .eq("company_id", selectedCompany!.id)
            .order("full_name")
            .range(from, from + PAGE_SIZE - 1);
          if (error) throw error;
          all = all.concat(data || []);
          hasMore = (data?.length || 0) === PAGE_SIZE;
          from += PAGE_SIZE;
        }
        const activeStatuses = [
          "ativo",
          "férias",
          "ferias",
          "licença",
          "licenca",
        ];
        return all.filter(
          (e) => e.status && activeStatuses.includes(e.status.toLowerCase()),
        );
      },
      enabled: open && !!selectedCompany?.id,
      staleTime: 1000 * 60 * 5,
    },
  );

  const { data: evaluations = [], isLoading: loadingEvaluations } = useQuery({
    queryKey: ["program-efficacy-evaluations", trainingProgramId],
    queryFn: () => getEfficacyEvaluations(trainingProgramId!),
    enabled: !!trainingProgramId && open,
  });

  const evaluatedSet = useMemo(() => {
    const s = new Set<string>();
    for (const ev of evaluations) {
      if (ev.employee_training_id && ev.status === "Concluída") {
        s.add(ev.employee_training_id);
      }
    }
    return s;
  }, [evaluations]);

  const pending: TrainingParticipant[] = useMemo(
    () => participants.filter((p) => !evaluatedSet.has(p.id)),
    [participants, evaluatedSet],
  );

  // Resetar estado ao abrir/fechar.
  useEffect(() => {
    if (!open) {
      setRows({});
      setEvaluationDate(new Date());
      setEnrollSearch("");
      setEnrollDept("all");
      setSelectedEmployeeIds(new Set());
    }
  }, [open]);

  // Departamentos pro filtro do painel de inscrição.
  const enrollDepartments = useMemo(() => {
    const depts = new Set(
      companyEmployees.map((e) => e.department).filter(Boolean) as string[],
    );
    return Array.from(depts).sort();
  }, [companyEmployees]);

  // Employees já inscritos no programa (para excluir do painel — evita
  // duplicar inscrição quando o programa não está vazio mas o usuário
  // ainda quer adicionar mais participantes no futuro).
  const alreadyEnrolledIds = useMemo(
    () => new Set(participants.map((p) => p.employee_id)),
    [participants],
  );

  const enrollableEmployees = useMemo(() => {
    const q = enrollSearch.trim().toLowerCase();
    return companyEmployees.filter((e) => {
      if (alreadyEnrolledIds.has(e.id)) return false;
      if (enrollDept !== "all" && e.department !== enrollDept) return false;
      if (!q) return true;
      return (
        e.full_name?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q)
      );
    });
  }, [companyEmployees, alreadyEnrolledIds, enrollSearch, enrollDept]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!trainingProgramId) return;
    if (selectedEmployeeIds.size === 0) {
      toast({
        title: "Nenhum colaborador selecionado",
        description: "Selecione pelo menos um colaborador para inscrever.",
        variant: "destructive",
      });
      return;
    }

    setIsEnrolling(true);
    const ids = Array.from(selectedEmployeeIds);
    const results = await Promise.allSettled(
      ids.map((employeeId) =>
        createEmployeeTraining({
          // company_id é resolvido server-side via RPC get_user_company_id —
          // o argumento é exigido pelo tipo mas o service ignora.
          company_id: "",
          employee_id: employeeId,
          training_program_id: trainingProgramId,
          status: "Concluído",
          // Marca o término efetivo no dia da avaliação — a UI calcula
          // status derivado a partir disso e o programa não fica "Inscrito".
          completion_date: format(evaluationDate, "yyyy-MM-dd"),
        }),
      ),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failureCount = results.length - successCount;
    setIsEnrolling(false);

    if (successCount > 0) {
      toast({
        title: "Colaboradores inscritos",
        description: `${successCount} colaborador(es) inscrito(s)${
          failureCount > 0 ? `, ${failureCount} falha(s)` : ""
        }. Agora você pode avaliá-los.`,
      });
      setSelectedEmployeeIds(new Set());
      // Re-fetch participants — o wizard automaticamente sai do estado
      // "vazio" e mostra a lista de avaliação.
      queryClient.invalidateQueries({
        queryKey: ["program-efficacy-participants", trainingProgramId],
      });
      queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
    } else {
      const firstError =
        results.find((r) => r.status === "rejected") as
          | PromiseRejectedResult
          | undefined;
      toast({
        title: "Erro ao inscrever",
        description:
          (firstError?.reason as Error)?.message ||
          "Nenhuma inscrição foi concluída.",
        variant: "destructive",
      });
    }
  };

  const setRow = (id: string, patch: Partial<RowState>) => {
    setRows((prev) => {
      const current: RowState =
        prev[id] || { effectiveness: null, comments: "", commentsTouched: false };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const handleSelect = (id: string, value: EffectivenessValue) => {
    setRows((prev) => {
      const current: RowState =
        prev[id] || { effectiveness: null, comments: "", commentsTouched: false };
      const opt = EFFECTIVENESS_OPTIONS.find((o) => o.value === value)!;
      // Se o usuário não editou manualmente, preenche o comentário padrão.
      const comments = current.commentsTouched
        ? current.comments
        : opt.defaultComment;
      return {
        ...prev,
        [id]: { ...current, effectiveness: value, comments },
      };
    });
  };

  const totalParticipants = participants.length;
  const alreadyEvaluated = totalParticipants - pending.length;
  const selectedCount = Object.values(rows).filter((r) => r.effectiveness).length;
  const completedAfterSave = alreadyEvaluated + selectedCount;
  const progressPct =
    totalParticipants > 0 ? (completedAfterSave / totalParticipants) * 100 : 0;

  const isLoading = loadingParticipants || loadingEvaluations;
  const noPending = !isLoading && pending.length === 0;

  const finishFlow = () => {
    queryClient.invalidateQueries({ queryKey: ["my-efficacy-evaluations"] });
    queryClient.invalidateQueries({
      queryKey: ["program-efficacy-evaluations", trainingProgramId],
    });
    queryClient.invalidateQueries({ queryKey: ["employee-trainings"] });
    queryClient.invalidateQueries({ queryKey: ["training-metrics"] });
    onOpenChange(false);
  };

  const handleSaveAll = async () => {
    if (!trainingProgramId) return;
    const toSave = pending.filter((p) => rows[p.id]?.effectiveness);
    if (toSave.length === 0) {
      toast({
        title: "Nenhuma avaliação selecionada",
        description: "Selecione o resultado para pelo menos um colaborador.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let savedCount = 0;
    const failures: string[] = [];

    for (const p of toSave) {
      const row = rows[p.id];
      const opt = EFFECTIVENESS_OPTIONS.find(
        (o) => o.value === row.effectiveness,
      );
      if (!opt) continue;
      try {
        await createEfficacyEvaluation({
          company_id: "",
          employee_training_id: p.id,
          training_program_id: trainingProgramId,
          evaluation_date: format(evaluationDate, "yyyy-MM-dd"),
          score: opt.score,
          is_effective: opt.is_effective,
          evaluator_name: user?.full_name || undefined,
          comments: row.comments?.trim() || undefined,
          status: "Concluída",
        });
        savedCount++;
      } catch (error: unknown) {
        const msg = (error as Error)?.message || "Erro desconhecido";
        failures.push(`${p.employee_name}: ${msg}`);
      }
    }

    setIsSubmitting(false);

    if (savedCount > 0) {
      toast({
        title: "Avaliações registradas",
        description: `${savedCount} colaborador(es) avaliado(s) com sucesso.${
          failures.length ? ` ${failures.length} falha(s).` : ""
        }`,
      });
    }
    if (failures.length > 0 && savedCount === 0) {
      toast({
        title: "Erro ao salvar",
        description: failures[0],
        variant: "destructive",
      });
      return;
    }
    finishFlow();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Avaliação de Eficácia
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {trainingProgramName}
            </span>
            {(assignedEvaluator?.full_name || user?.full_name) && (
              <>
                <br />
                <span className="text-xs">
                  Avaliador:{" "}
                  <span className="font-medium text-foreground">
                    {assignedEvaluator?.full_name || user?.full_name}
                  </span>
                  {assignedEvaluator?.full_name &&
                    user?.full_name &&
                    assignedEvaluator.full_name !== user.full_name && (
                      <span className="ml-1 text-muted-foreground">
                        (registrando como {user.full_name})
                      </span>
                    )}
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : totalParticipants === 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 bg-muted/30 space-y-1">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <UserPlus className="h-4 w-4" />
                Programa sem colaboradores inscritos
              </div>
              <p className="text-sm text-muted-foreground">
                Selecione abaixo quem participou do treinamento para inscrevê-los
                e avaliá-los na sequência.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={enrollDept} onValueChange={setEnrollDept}>
                <SelectTrigger className="sm:w-56">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {enrollDepartments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {enrollableEmployees.length} colaborador(es) encontrado(s)
              </span>
              <span>{selectedEmployeeIds.size} selecionado(s)</span>
            </div>

            <div className="rounded-lg border max-h-72 overflow-y-auto divide-y">
              {loadingEmployees ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : enrollableEmployees.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  Nenhum colaborador encontrado com esses filtros.
                </div>
              ) : (
                enrollableEmployees.map((e) => {
                  const checked = selectedEmployeeIds.has(e.id);
                  return (
                    <label
                      key={e.id}
                      className={cn(
                        "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50",
                        checked && "bg-muted/40",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleEmployee(e.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {e.full_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {e.employee_code || "Sem código"}
                          {e.department && ` · ${e.department}`}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isEnrolling}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleEnroll}
                disabled={isEnrolling || selectedEmployeeIds.size === 0}
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Inscrevendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Inscrever {selectedEmployeeIds.size > 0
                      ? `(${selectedEmployeeIds.size})`
                      : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : noPending ? (
          <div className="text-center py-10 text-muted-foreground space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <p className="font-medium text-foreground">Tudo avaliado!</p>
            <p className="text-sm">
              Todos os {totalParticipants} colaborador(es) deste treinamento já
              foram avaliados.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-2">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {pending.length} pendente{pending.length > 1 ? "s" : ""} ·{" "}
                  {selectedCount} selecionado{selectedCount === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {completedAfterSave} de {totalParticipants}
                </span>
              </div>
              <Progress value={progressPct} />
            </div>

            <div className="rounded-lg border p-3 bg-muted/20">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Data da Avaliação (aplicada a todos)
              </Label>
              <div className="mt-1 max-w-xs">
                <DateInputWithCalendarForm
                  value={evaluationDate}
                  onChange={(d) => setEvaluationDate(d || new Date())}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>

            <div className="rounded-lg border divide-y">
              {pending.map((p) => {
                const row = rows[p.id];
                const selected = row?.effectiveness ?? null;
                return (
                  <div
                    key={p.id}
                    className="p-3 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {p.employee_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.department || "—"}
                        {p.completion_date && (
                          <>
                            {" · Concluiu em "}
                            {format(new Date(p.completion_date), "dd/MM/yyyy")}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {EFFECTIVENESS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = selected === opt.value;
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelect(p.id, opt.value)}
                            className={cn(
                              "gap-1.5",
                              isActive && opt.activeClasses,
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {opt.shortLabel}
                          </Button>
                        );
                      })}

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={!selected}
                            title="Editar observações"
                          >
                            <MessageSquare
                              className={cn(
                                "h-4 w-4",
                                row?.commentsTouched && "text-primary",
                              )}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                          <div className="space-y-2">
                            <Label className="text-xs">Observações</Label>
                            <Textarea
                              rows={4}
                              value={row?.comments || ""}
                              onChange={(e) =>
                                setRow(p.id, {
                                  comments: e.target.value,
                                  commentsTouched: true,
                                })
                              }
                              placeholder="Observações sobre a avaliação..."
                              className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                              A mensagem padrão é preenchida automaticamente ao
                              selecionar o resultado.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveAll}
                disabled={isSubmitting || selectedCount === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Salvar {selectedCount > 0 ? `(${selectedCount})` : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
