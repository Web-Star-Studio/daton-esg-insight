import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useLAIAAssessments, useLAIASectors, useDeleteLAIAAssessment } from "@/hooks/useLAIA";
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Pencil, 
  Trash2, 
  Copy,
  Filter,
  FileSpreadsheet 
} from "lucide-react";
import { getCategoryColor, getSignificanceColor } from "@/types/laia";
import type { LAIAAssessment } from "@/types/laia";

interface LAIAAssessmentTableProps {
  onView?: (assessment: LAIAAssessment) => void;
  onEdit?: (assessment: LAIAAssessment) => void;
}

export function LAIAAssessmentTable({ onView, onEdit }: LAIAAssessmentTableProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    sector_id?: string;
    category?: string;
    significance?: string;
    status?: string;
  }>({});
  const [deleteAssessment, setDeleteAssessment] = useState<LAIAAssessment | null>(null);

  const { data: sectors } = useLAIASectors();
  const { data: assessments, isLoading } = useLAIAAssessments(filters);
  const deleteMutation = useDeleteLAIAAssessment();

  const filteredAssessments = assessments?.filter((a) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      a.aspect_code.toLowerCase().includes(searchLower) ||
      a.activity_operation.toLowerCase().includes(searchLower) ||
      a.environmental_aspect.toLowerCase().includes(searchLower) ||
      a.environmental_impact.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = async () => {
    if (deleteAssessment) {
      await deleteMutation.mutateAsync(deleteAssessment.id);
      setDeleteAssessment(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearch("");
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "desprezivel": return "Desprezível";
      case "moderado": return "Moderado";
      case "critico": return "Crítico";
      default: return cat;
    }
  };

  const getSignificanceLabel = (sig: string) => {
    switch (sig) {
      case "significativo": return "Significativo";
      case "nao_significativo": return "Não Significativo";
      default: return sig;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Avaliações LAIA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, atividade, aspecto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.sector_id || "all"}
              onValueChange={(v) => setFilters({ ...filters, sector_id: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Setores</SelectItem>
                {sectors?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.category || "all"}
              onValueChange={(v) => setFilters({ ...filters, category: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="desprezivel">Desprezível</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.significance || "all"}
              onValueChange={(v) => setFilters({ ...filters, significance: v === "all" ? undefined : v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Significância" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="significativo">Significativo</SelectItem>
                <SelectItem value="nao_significativo">Não Significativo</SelectItem>
              </SelectContent>
            </Select>

            {(filters.sector_id || filters.category || filters.significance || search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Table */}
          {filteredAssessments && filteredAssessments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Código</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Aspecto Ambiental</TableHead>
                    <TableHead>Impacto</TableHead>
                    <TableHead className="text-center">Pontuação</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Significância</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-mono font-medium">
                        {assessment.aspect_code}
                      </TableCell>
                      <TableCell>
                        {assessment.sector?.code || "-"}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={assessment.activity_operation}>
                        {assessment.activity_operation}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={assessment.environmental_aspect}>
                        {assessment.environmental_aspect}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={assessment.environmental_impact}>
                        {assessment.environmental_impact}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {assessment.total_score}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(assessment.category)}>
                          {getCategoryLabel(assessment.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSignificanceColor(assessment.significance)}>
                          {getSignificanceLabel(assessment.significance)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView?.(assessment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(assessment)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteAssessment(assessment)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhuma avaliação encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {search || Object.keys(filters).length > 0
                  ? "Tente ajustar os filtros de busca"
                  : "Crie sua primeira avaliação LAIA"}
              </p>
            </div>
          )}

          {filteredAssessments && filteredAssessments.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredAssessments.length} avaliação(ões) encontrada(s)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAssessment} onOpenChange={(open) => !open && setDeleteAssessment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Avaliação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a avaliação "{deleteAssessment?.aspect_code}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
