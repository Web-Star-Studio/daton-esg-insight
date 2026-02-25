import { useState } from "react";
import { useBranches } from "@/services/branches";
import { useCompany } from "@/contexts/CompanyContext";
import { useLAIABranchConfigs, useUpsertLAIABranchConfig, useBulkUpsertLAIABranchConfig } from "@/hooks/useLAIA";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { LAIABranchConfig } from "@/services/laiaBranchConfigService";
import { X } from "lucide-react";

const STATUS_OPTIONS: { value: LAIABranchConfig["survey_status"]; label: string }[] = [
  { value: "nao_levantado", label: "Não Levantado" },
  { value: "em_levantamento", label: "Em Levantamento" },
  { value: "levantado", label: "Levantado" },
];

function getStatusBadge(status: LAIABranchConfig["survey_status"]) {
  switch (status) {
    case "levantado":
      return <Badge variant="success-subtle">Levantado</Badge>;
    case "em_levantamento":
      return <Badge variant="warning-subtle">Em Levantamento</Badge>;
    default:
      return <Badge variant="secondary">Não Levantado</Badge>;
  }
}

export function LAIAConfiguracoes() {
  const { selectedCompany } = useCompany();
  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: configs, isLoading: configsLoading } = useLAIABranchConfigs();
  const upsertMutation = useUpsertLAIABranchConfig();
  const bulkUpsertMutation = useBulkUpsertLAIABranchConfig();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<LAIABranchConfig["survey_status"] | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const activeBranches = branches?.filter(b => ["Ativo", "Ativa"].includes(b.status)) || [];
  const isLoading = branchesLoading || configsLoading;

  const getStatus = (branchId: string): LAIABranchConfig["survey_status"] => {
    const configList = configs as LAIABranchConfig[] | undefined;
    return configList?.find(c => c.branch_id === branchId)?.survey_status || "nao_levantado";
  };

  const handleStatusChange = (branchId: string, newStatus: string) => {
    if (!selectedCompany?.id) return;
    upsertMutation.mutate({
      branchId,
      surveyStatus: newStatus as LAIABranchConfig["survey_status"],
      companyId: selectedCompany.id,
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === activeBranches.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeBranches.map(b => b.id)));
    }
  };

  const handleBulkApply = (status: LAIABranchConfig["survey_status"]) => {
    setBulkStatus(status);
    setShowConfirmDialog(true);
  };

  const confirmBulkApply = () => {
    if (!selectedCompany?.id || !bulkStatus) return;
    bulkUpsertMutation.mutate(
      { branchIds: Array.from(selectedIds), surveyStatus: bulkStatus, companyId: selectedCompany.id },
      { onSuccess: () => { setSelectedIds(new Set()); setBulkStatus(null); } }
    );
    setShowConfirmDialog(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const allSelected = activeBranches.length > 0 && selectedIds.size === activeBranches.length;
  const someSelected = selectedIds.size > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Status de Levantamento por Unidade</CardTitle>
          <CardDescription>
            Defina o status do levantamento de aspectos ambientais para cada unidade.
            Unidades com status "Não Levantado" não aparecem na aba Unidades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeBranches.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma unidade ativa encontrada.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Selecionar todas"
                      />
                    </TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="w-48">Status Atual</TableHead>
                    <TableHead className="w-56">Alterar Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeBranches.map((branch) => {
                    const currentStatus = getStatus(branch.id);
                    return (
                      <TableRow key={branch.id} data-state={selectedIds.has(branch.id) ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(branch.id)}
                            onCheckedChange={() => toggleSelect(branch.id)}
                            aria-label={`Selecionar ${branch.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {getBranchDisplayLabel(branch)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(currentStatus)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={currentStatus}
                            onValueChange={(val) => handleStatusChange(branch.id, val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedIds.size} unidade(s) selecionada(s)
          </span>
          <div className="flex items-center gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant="outline"
                onClick={() => handleBulkApply(opt.value)}
                disabled={bulkUpsertMutation.isPending}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração em lote</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja alterar o status de {selectedIds.size} unidade(s) para "{STATUS_OPTIONS.find(o => o.value === bulkStatus)?.label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkApply}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
