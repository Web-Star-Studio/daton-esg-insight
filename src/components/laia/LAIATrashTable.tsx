import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  useDeletedLAIAAssessments,
  useRestoreLAIAAssessment,
  useBulkRestoreLAIAAssessments,
} from "@/hooks/useLAIA";
import { Trash2, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LAIATrashTableProps {
  branchId?: string;
}

export function LAIATrashTable({ branchId }: LAIATrashTableProps) {
  const { data: deleted, isLoading } = useDeletedLAIAAssessments(branchId);
  const restoreMutation = useRestoreLAIAAssessment();
  const bulkRestoreMutation = useBulkRestoreLAIAAssessments();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const items = useMemo(() => deleted ?? [], [deleted]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((a) => a.id)));
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    await bulkRestoreMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lixeira</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Lixeira</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Avaliações excluídas. Restaure para devolvê-las à listagem.
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRestore}
            disabled={bulkRestoreMutation.isPending}
            data-track="laia:lixeira:bulk-restore"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Restaurar {selectedIds.size}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Trash2 className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">A Lixeira está vazia.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === items.length && items.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Atividade</TableHead>
                <TableHead>Aspecto</TableHead>
                <TableHead>Excluída em</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(a.id)}
                      onCheckedChange={() => toggleSelect(a.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">{a.aspect_code}</TableCell>
                  <TableCell>{a.sector?.code ?? "-"}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={a.activity_operation}>
                    {a.activity_operation}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate" title={a.environmental_aspect}>
                    {a.environmental_aspect}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {a.deleted_at
                      ? format(new Date(a.deleted_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreMutation.mutate(a.id)}
                      disabled={restoreMutation.isPending}
                      data-track="laia:lixeira:restore"
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Restaurar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
