import { useState, useMemo } from "react";
import { Trash2, Merge, AlertTriangle, CheckCircle, Search, ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Branch, useBranches, useDeleteBranch, useUpdateBranch } from "@/services/branches";
import { calculateSimilarity, normalizeForComparison } from "@/utils/dataReconciliation";
import { Skeleton } from "@/components/ui/skeleton";
import { unifiedToast } from "@/utils/unifiedToast";

interface DuplicateGroup {
  key: string;
  normalizedName: string;
  branches: Branch[];
  similarity: number;
}

const SIMILARITY_THRESHOLD = 0.85;

function normalizeBranchName(name: string): string {
  return normalizeForComparison(name)
    .replace(/\s+/g, ' ')
    .trim();
}

function findDuplicateGroups(branches: Branch[]): DuplicateGroup[] {
  const processed = new Set<string>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < branches.length; i++) {
    if (processed.has(branches[i].id)) continue;

    const normalizedName = normalizeBranchName(branches[i].name);
    const group: Branch[] = [branches[i]];
    processed.add(branches[i].id);

    for (let j = i + 1; j < branches.length; j++) {
      if (processed.has(branches[j].id)) continue;

      const otherNormalizedName = normalizeBranchName(branches[j].name);
      const similarity = calculateSimilarity(normalizedName, otherNormalizedName);

      if (similarity >= SIMILARITY_THRESHOLD) {
        group.push(branches[j]);
        processed.add(branches[j].id);
      }
    }

    if (group.length > 1) {
      groups.push({
        key: `group-${normalizedName}`,
        normalizedName,
        branches: group,
        similarity: group.length > 1 ? calculateSimilarity(
          normalizeBranchName(group[0].name),
          normalizeBranchName(group[1].name)
        ) : 1,
      });
    }
  }

  return groups.sort((a, b) => b.branches.length - a.branches.length);
}

function calculateCompleteness(branch: Branch): number {
  const fields = [
    branch.name,
    branch.code,
    branch.cnpj,
    branch.address,
    branch.city,
    branch.state,
    branch.cep,
    branch.phone,
    branch.neighborhood,
  ];
  const filled = fields.filter(f => f && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export function BranchDeduplication() {
  const { data: branches, isLoading, refetch } = useBranches();
  const deleteMutation = useDeleteBranch();
  const updateMutation = useUpdateBranch();

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedToKeep, setSelectedToKeep] = useState<Record<string, string>>({});
  const [mergeConfirmation, setMergeConfirmation] = useState<DuplicateGroup | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const duplicateGroups = useMemo(() => {
    if (!branches) return [];
    return findDuplicateGroups(branches);
  }, [branches]);

  const totalDuplicates = duplicateGroups.reduce(
    (acc, group) => acc + group.branches.length - 1,
    0
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectToKeep = (groupKey: string, branchId: string) => {
    setSelectedToKeep(prev => ({
      ...prev,
      [groupKey]: branchId,
    }));
  };

  const handleMergeGroup = async (group: DuplicateGroup) => {
    const keepId = selectedToKeep[group.key];
    if (!keepId) {
      unifiedToast.warning("Selecione qual filial manter antes de mesclar");
      return;
    }
    setMergeConfirmation(group);
  };

  const confirmMerge = async () => {
    if (!mergeConfirmation) return;

    const group = mergeConfirmation;
    const keepId = selectedToKeep[group.key];
    const toDelete = group.branches.filter(b => b.id !== keepId);

    setIsProcessing(true);
    try {
      // Delete duplicates
      for (const branch of toDelete) {
        await deleteMutation.mutateAsync(branch.id);
      }

      unifiedToast.success("Duplicatas removidas!", {
        description: `${toDelete.length} registro(s) removido(s). Mantido: "${group.branches.find(b => b.id === keepId)?.name}"`
      });

      setMergeConfirmation(null);
      setSelectedToKeep(prev => {
        const next = { ...prev };
        delete next[group.key];
        return next;
      });
      refetch();
    } catch (error) {
      console.error("Error merging branches:", error);
      unifiedToast.error("Erro ao remover duplicatas");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMergeAllAutomatic = async () => {
    if (duplicateGroups.length === 0) return;

    setIsProcessing(true);
    let deletedCount = 0;

    try {
      for (const group of duplicateGroups) {
        // Auto-select the most complete record
        const sorted = [...group.branches].sort((a, b) => {
          // Prefer headquarters
          if (a.is_headquarters && !b.is_headquarters) return -1;
          if (!a.is_headquarters && b.is_headquarters) return 1;
          // Then by completeness
          return calculateCompleteness(b) - calculateCompleteness(a);
        });

        const keep = sorted[0];
        const toDelete = sorted.slice(1);

        for (const branch of toDelete) {
          await deleteMutation.mutateAsync(branch.id);
          deletedCount++;
        }
      }

      unifiedToast.success("Limpeza automática concluída!", {
        description: `${deletedCount} duplicata(s) removida(s)`
      });

      refetch();
    } catch (error) {
      console.error("Error in automatic merge:", error);
      unifiedToast.error("Erro na limpeza automática");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detectando Duplicatas...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (duplicateGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Nenhuma Duplicata Encontrada
          </CardTitle>
          <CardDescription>
            Todas as {branches?.length || 0} filiais são únicas
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {duplicateGroups.length} Grupo(s) de Duplicatas
              </CardTitle>
              <CardDescription>
                {totalDuplicates} registro(s) duplicado(s) detectado(s) em {branches?.length || 0} filiais
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={handleMergeAllAutomatic}
              disabled={isProcessing}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Tudo Automaticamente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {duplicateGroups.map((group) => (
                <Collapsible
                  key={group.key}
                  open={expandedGroups.has(group.key)}
                  onOpenChange={() => toggleGroup(group.key)}
                >
                  <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 rounded-t-lg">
                        <div className="flex items-center gap-3">
                          {expandedGroups.has(group.key) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <span className="font-medium">
                              "{group.branches[0].name}"
                            </span>
                            <span className="text-muted-foreground"> e similares</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {group.branches.length} registros
                          </Badge>
                          <Badge variant="outline">
                            {Math.round(group.similarity * 100)}% similar
                          </Badge>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 pt-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">Manter</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>CNPJ</TableHead>
                              <TableHead>Cidade</TableHead>
                              <TableHead>Completude</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.branches.map((branch) => (
                              <TableRow
                                key={branch.id}
                                className={
                                  selectedToKeep[group.key] === branch.id
                                    ? "bg-green-50 dark:bg-green-950/20"
                                    : ""
                                }
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedToKeep[group.key] === branch.id}
                                    onCheckedChange={() =>
                                      handleSelectToKeep(group.key, branch.id)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    {branch.name}
                                    {branch.is_headquarters && (
                                      <Badge variant="secondary" className="text-xs">
                                        Matriz
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{branch.code || "-"}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {branch.cnpj || "-"}
                                </TableCell>
                                <TableCell>
                                  {branch.city && branch.state
                                    ? `${branch.city}/${branch.state}`
                                    : branch.city || "-"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary"
                                        style={{
                                          width: `${calculateCompleteness(branch)}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {calculateCompleteness(branch)}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex justify-end mt-4">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMergeGroup(group)}
                            disabled={!selectedToKeep[group.key] || isProcessing}
                            className="gap-2"
                          >
                            <Merge className="h-4 w-4" />
                            Mesclar e Remover Duplicatas
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Merge Confirmation Dialog */}
      <AlertDialog open={!!mergeConfirmation} onOpenChange={() => setMergeConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Mesclagem</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a remover{" "}
                <strong>
                  {mergeConfirmation
                    ? mergeConfirmation.branches.length - 1
                    : 0}
                </strong>{" "}
                registro(s) duplicado(s).
              </p>
              {mergeConfirmation && (
                <div className="bg-muted p-3 rounded-md mt-2">
                  <p className="text-sm font-medium">Será mantido:</p>
                  <p className="text-sm text-muted-foreground">
                    {mergeConfirmation.branches.find(
                      (b) => b.id === selectedToKeep[mergeConfirmation.key]
                    )?.name}
                  </p>
                </div>
              )}
              <p className="text-destructive font-medium">
                Esta ação não pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMerge}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Processando..." : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
