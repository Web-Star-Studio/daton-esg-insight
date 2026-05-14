import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  ClipboardList,
  Filter,
  ScanLine,
  Tag,
} from "lucide-react";
import { useBranches } from "@/services/branches";
import { useAllComplianceProfiles } from "@/hooks/useComplianceProfiles";
import { ComplianceQuestionnaireModal } from "./compliance-questionnaire/ComplianceQuestionnaireModal";
import { PreComplianceModal } from "./compliance-questionnaire/PreComplianceModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasBetaAccess } from "@/lib/betaFeatures";
import { cn } from "@/lib/utils";
import type { ComplianceProfile } from "@/services/complianceProfiles";

interface ComplianceProfilesManagerProps {
  onFilterChange?: (tags: string[]) => void;
  selectedTags?: string[];
}

type ProfileStatus = "pre_pending" | "compliance_pending" | "configured";

const deriveStatus = (profile: ComplianceProfile | undefined): ProfileStatus => {
  if (!profile) return "pre_pending";
  const hasPreResponses = Object.keys(profile.pre_responses ?? {}).length > 0;
  if (!hasPreResponses) return "pre_pending";
  if (profile.completed_at) return "configured";
  return "compliance_pending";
};

type SelectedBranch = { id: string; name: string };
type ModalKind = "pre" | "main";

export const ComplianceProfilesManager: React.FC<ComplianceProfilesManagerProps> = ({
  onFilterChange,
  selectedTags = [],
}) => {
  const navigate = useNavigate();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: profiles, isLoading: profilesLoading } = useAllComplianceProfiles();
  const [selectedBranch, setSelectedBranch] = useState<SelectedBranch | null>(null);
  const [activeModal, setActiveModal] = useState<ModalKind | null>(null);
  // Capturado no momento em que o pré-modal abre — evita depender do estado
  // refetched de profilesByBranch, que é assíncrono após o upsert.
  const [preChainsToMain, setPreChainsToMain] = useState(false);
  const hasBetaAccess = useHasBetaAccess();

  const isLoading = branchesLoading || profilesLoading;

  const profilesByBranch = useMemo(() => {
    const map = new Map<string, ComplianceProfile>();
    profiles?.forEach((p) => {
      if (p.branch_id) map.set(p.branch_id, p);
    });
    return map;
  }, [profiles]);

  const configuredCount = profiles?.filter((p) => p.completed_at)?.length || 0;
  const totalBranches = branches?.length || 0;
  const completionPercentage = totalBranches > 0 ? (configuredCount / totalBranches) * 100 : 0;

  const allTags = useMemo(() => {
    if (!profiles) return [];
    const tagSet = new Set<string>();
    profiles.forEach((profile) => {
      profile.generated_tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [profiles]);

  const handleTagClick = (tag: string) => {
    if (!onFilterChange) return;
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onFilterChange(newTags);
  };

  const openPre = (branch: SelectedBranch) => {
    const profile = profilesByBranch.get(branch.id);
    const isFirstRun = !profile || Object.keys(profile.pre_responses ?? {}).length === 0;
    setPreChainsToMain(isFirstRun);
    setSelectedBranch(branch);
    setActiveModal("pre");
  };

  const openMain = (branch: SelectedBranch) => {
    setPreChainsToMain(false);
    setSelectedBranch(branch);
    setActiveModal("main");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedBranch(null);
    setPreChainsToMain(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Perfis de Compliance
              </CardTitle>
              <CardDescription>
                Etapa 1: defina o escopo da unidade no Pré-Compliance. Etapa 2:
                preencha o questionário principal. Apenas temas dentro do escopo
                contam para tags e legislações sugeridas.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {configuredCount}/{totalBranches}
              </div>
              <div className="text-sm text-muted-foreground">perfis configurados</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progresso de configuração</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Units Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches?.map((branch) => {
              const profile = profilesByBranch.get(branch.id);
              const status = deriveStatus(profile);
              const tags = profile?.generated_tags ?? [];
              const suppressedCount = (profile?.suppressed_keys ?? []).filter((k) =>
                k.startsWith("theme:"),
              ).length;
              const branchLabel = branch.code ? `${branch.code} - ${branch.name}` : branch.name;
              const branchPayload: SelectedBranch = { id: branch.id, name: branchLabel };

              return (
                <Card
                  key={branch.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    status === "configured" && "border-green-500/30",
                    status === "compliance_pending" && "border-amber-500/30",
                    status === "pre_pending" && "border-orange-500/30",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{branchLabel}</span>
                      </div>
                      {status === "configured" ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      ) : status === "compliance_pending" ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Questionário pendente
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Escopo pendente
                        </Badge>
                      )}
                    </div>

                    {suppressedCount > 0 && (
                      <div className="mb-2 text-xs text-muted-foreground">
                        {suppressedCount} tema{suppressedCount === 1 ? "" : "s"} fora do escopo
                      </div>
                    )}

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{tags.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      {status === "pre_pending" ? (
                        <Button
                          size="sm"
                          variant="default"
                          className="w-full"
                          onClick={() => openPre(branchPayload)}
                        >
                          <ScanLine className="h-3 w-3 mr-1" />
                          Definir escopo
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant={status === "configured" ? "outline" : "default"}
                            className="w-full"
                            onClick={() => openMain(branchPayload)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            {status === "configured" ? "Editar questionário" : "Continuar questionário"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-xs h-7"
                            onClick={() => openPre(branchPayload)}
                          >
                            <ScanLine className="h-3 w-3 mr-1" />
                            Editar escopo
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tag Filter Section */}
          {allTags.length > 0 && onFilterChange && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Filtrar por Tags</span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange([])}
                    className="text-xs h-6"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => handleTagClick(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedBranch && activeModal === "pre" && (
        <PreComplianceModal
          open
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          onApplyComplete={() => {
            // Chain: em primeiro preenchimento (capturado em openPre),
            // abre o questionário principal automaticamente após aplicar.
            // Em edições posteriores, fecha o modal e devolve o usuário ao grid.
            if (preChainsToMain) {
              setPreChainsToMain(false);
              setActiveModal("main");
            } else {
              closeModal();
            }
          }}
        />
      )}

      {selectedBranch && activeModal === "main" && (
        <ComplianceQuestionnaireModal
          open
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          branchId={selectedBranch.id}
          branchName={selectedBranch.name}
          onEditScope={() => setActiveModal("pre")}
          onSubmitComplete={(branchId, generatedTags) => {
            // CTA para "Sugestões" (feature em beta) só aparece para
            // beta-testers; demais users recebem confirmação genérica.
            if (hasBetaAccess) {
              if (generatedTags.length === 0) return;
              toast.success("Questionário concluído", {
                description: `${generatedTags.length} tags geradas. Veja agora as legislações sugeridas para esta unidade.`,
                duration: 12000,
                action: {
                  label: "Revisar sugestões",
                  onClick: () =>
                    navigate(`/licenciamento/legislacoes/sugestoes?branch=${branchId}`),
                },
              });
            } else {
              toast.success("Questionário enviado com sucesso", {
                description:
                  generatedTags.length > 0
                    ? `${generatedTags.length} tag${generatedTags.length === 1 ? "" : "s"} de compliance ${generatedTags.length === 1 ? "gerada" : "geradas"} para esta unidade.`
                    : undefined,
                duration: 6000,
              });
            }
          }}
        />
      )}
    </>
  );
};
