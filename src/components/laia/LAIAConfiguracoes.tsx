import { useBranches } from "@/services/branches";
import { useCompany } from "@/contexts/CompanyContext";
import { useLAIABranchConfigs, useUpsertLAIABranchConfig } from "@/hooks/useLAIA";
import { getBranchDisplayLabel } from "@/utils/branchDisplay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { LAIABranchConfig } from "@/services/laiaBranchConfigService";

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
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
                  <TableHead>Unidade</TableHead>
                  <TableHead className="w-48">Status Atual</TableHead>
                  <TableHead className="w-56">Alterar Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeBranches.map((branch) => {
                  const currentStatus = getStatus(branch.id);
                  return (
                    <TableRow key={branch.id}>
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
  );
}
