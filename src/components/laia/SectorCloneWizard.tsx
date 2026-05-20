import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ChevronsUpDown,
  Check,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { LAIAAssessmentForm } from "./LAIAAssessmentForm";
import { useLAIASectorsForClone, useCloneLAIASector } from "@/hooks/useLAIA";
import * as laiaService from "@/services/laiaService";
import {
  calculateConsequenceScore,
  calculateFreqProbScore,
  calculateCategory,
  calculateSignificance,
  getCategoryColor,
  getSignificanceColor,
  mapAssessmentToFormData,
} from "@/types/laia";
import type { LAIAAssessmentFormData } from "@/types/laia";
import { useToast } from "@/hooks/use-toast";

interface DraftItem {
  key: string;
  data: LAIAAssessmentFormData;
}

type EditState = { type: "new" } | { type: "edit"; key: string } | null;

interface SectorCloneWizardProps {
  branchId: string;
  suggestedCode: string;
  onCancel: () => void;
  onCreated: (sectorId: string) => void;
}

function previewBadges(d: LAIAAssessmentFormData) {
  const consequence = calculateConsequenceScore(d.scope, d.severity);
  const freqProb = calculateFreqProbScore(d.frequency_probability);
  const category = calculateCategory(consequence + freqProb);
  const significance = calculateSignificance(
    category,
    d.has_legal_requirements,
    d.has_stakeholder_demand,
    d.has_strategic_options
  );
  return { category, significance };
}

const categoryLabels: Record<string, string> = {
  desprezivel: "Desprezível",
  moderado: "Moderado",
  critico: "Crítico",
};

export function SectorCloneWizard({
  branchId,
  suggestedCode,
  onCancel,
  onCreated,
}: SectorCloneWizardProps) {
  const { toast } = useToast();
  const { data: sourceSectors, isLoading: loadingSectors } = useLAIASectorsForClone();
  const cloneMutation = useCloneLAIASector();

  const [view, setView] = useState<"pick" | "review">("pick");
  const [editState, setEditState] = useState<EditState>(null);

  const [sourceSectorId, setSourceSectorId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [code, setCode] = useState(suggestedCode);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [drafts, setDrafts] = useState<DraftItem[]>([]);

  const selectedSource = useMemo(
    () => sourceSectors?.find((s) => s.id === sourceSectorId) ?? null,
    [sourceSectors, sourceSectorId]
  );

  const handlePickSource = async (sectorId: string) => {
    const sector = sourceSectors?.find((s) => s.id === sectorId);
    if (!sector) return;
    setSourceSectorId(sectorId);
    setPickerOpen(false);
    setName(sector.name);
    setDescription(sector.description ?? "");
    setLoadingAssessments(true);
    try {
      const assessments = await laiaService.getLAIAAssessments({ sector_id: sectorId });
      setDrafts(
        assessments.map((a) => ({
          key: crypto.randomUUID(),
          data: mapAssessmentToFormData(a, branchId),
        }))
      );
    } catch (error) {
      toast({
        title: "Erro ao carregar aspectos do setor",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
      setDrafts([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  const handleSubmitDraft = (data: LAIAAssessmentFormData) => {
    if (editState?.type === "edit") {
      setDrafts((prev) =>
        prev.map((d) => (d.key === editState.key ? { ...d, data } : d))
      );
    } else {
      setDrafts((prev) => [...prev, { key: crypto.randomUUID(), data }]);
    }
    setEditState(null);
  };

  const handleCreate = async () => {
    try {
      const sectorId = await cloneMutation.mutateAsync({
        branch_id: branchId,
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        assessments: drafts.map((d) => d.data),
      });
      onCreated(sectorId);
    } catch {
      // Toast exibido pelo hook; manter o wizard aberto para correção.
    }
  };

  // ---- Sub-view: editar/adicionar um aspecto ----
  if (editState) {
    const editing =
      editState.type === "edit"
        ? drafts.find((d) => d.key === editState.key)
        : undefined;
    return (
      <LAIAAssessmentForm
        branchId={branchId}
        initialFormData={editing?.data}
        onSubmitDraft={handleSubmitDraft}
        submitLabel="Salvar aspecto"
        onCancel={() => setEditState(null)}
      />
    );
  }

  // ---- Passo 1: escolher origem e dados do setor ----
  if (view === "pick") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Setor de origem *</Label>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={pickerOpen}
                className="w-full justify-between font-normal"
                disabled={loadingSectors}
              >
                {selectedSource
                  ? `${selectedSource.code} — ${selectedSource.name}`
                  : loadingSectors
                  ? "Carregando setores…"
                  : "Selecione um setor para reaproveitar"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar por código, atividade ou unidade…" />
                <CommandList>
                  <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                  <CommandGroup>
                    {(sourceSectors ?? []).map((s) => (
                      <CommandItem
                        key={s.id}
                        value={`${s.code} ${s.name} ${s.branch_name ?? ""}`}
                        onSelect={() => handlePickSource(s.id)}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            sourceSectorId === s.id ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <div className="flex flex-col">
                          <span>
                            <span className="font-mono">{s.code}</span> — {s.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {s.branch_name ?? "Setor global"} ·{" "}
                            {s.assessment_count} aspecto(s)
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Os aspectos e impactos do setor escolhido serão trazidos como
            sugestão para você revisar antes de criar.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clone-code">Código *</Label>
          <Input
            id="clone-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: PROD, ADM, LOG"
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clone-name">Atividade *</Label>
          <Input
            id="clone-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Fabricação de produtos químicos"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clone-description">Descrição</Label>
          <Textarea
            id="clone-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição opcional do setor…"
            rows={2}
          />
        </div>

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            onClick={() => setView("review")}
            disabled={!sourceSectorId || !code.trim() || !name.trim() || loadingAssessments}
          >
            {loadingAssessments ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando aspectos…
              </>
            ) : (
              "Avançar"
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ---- Passo 2: revisar aspectos e impactos ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {drafts.length === 0
            ? "Nenhum aspecto será criado. Adicione aspectos ou crie o setor vazio."
            : `${drafts.length} aspecto(s) serão criados em "${name}". Revise cada um.`}
        </p>
        <Button variant="outline" size="sm" onClick={() => setEditState({ type: "new" })}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar aspecto
        </Button>
      </div>

      {loadingAssessments ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ScrollArea className="max-h-[50vh] pr-3">
          <div className="space-y-2">
            {drafts.map((d, idx) => {
              const { category, significance } = previewBadges(d.data);
              return (
                <div
                  key={d.key}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {code}.{String(idx + 1).padStart(2, "0")}
                      </span>
                      <Badge className={getCategoryColor(category)}>
                        {categoryLabels[category] ?? category}
                      </Badge>
                      <Badge className={getSignificanceColor(significance)}>
                        {significance === "significativo"
                          ? "Significativo"
                          : "Não Significativo"}
                      </Badge>
                    </div>
                    <p className="truncate text-sm font-medium">
                      {d.data.environmental_aspect || "(sem aspecto)"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      Impacto: {d.data.environmental_impact || "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.data.activity_operation || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditState({ type: "edit", key: d.key })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDrafts((prev) => prev.filter((x) => x.key !== d.key))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setView("pick")}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={handleCreate} disabled={cloneMutation.isPending}>
          {cloneMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando…
            </>
          ) : (
            `Criar setor com ${drafts.length} aspecto(s)`
          )}
        </Button>
      </div>
    </div>
  );
}
