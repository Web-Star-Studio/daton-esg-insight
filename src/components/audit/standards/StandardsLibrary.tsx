import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Copy, MoreHorizontal, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStandards, useDeleteStandard } from "@/hooks/audit/useStandards";
import { AuditStandard } from "@/services/audit/standards";
import { StandardFormDialog } from "./StandardFormDialog";
import { DuplicateStandardDialog } from "./DuplicateStandardDialog";

interface StandardsLibraryProps {
  onSelectStandard?: (standard: AuditStandard) => void;
}

export function StandardsLibrary({ onSelectStandard }: StandardsLibraryProps) {
  const { data: standards, isLoading } = useStandards();
  const deleteStandard = useDeleteStandard();

  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<AuditStandard | null>(null);
  const [duplicatingStandard, setDuplicatingStandard] = useState<AuditStandard | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredStandards = standards?.filter((standard) =>
    standard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    standard.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (standard: AuditStandard) => {
    setEditingStandard(standard);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteStandard.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getCalculationMethodLabel = (method: string) => {
    return method === 'weight_based' ? 'Aderência Ponderada' : 'Porcentagem Simples';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar normas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setEditingStandard(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Norma
        </Button>
      </div>

      {filteredStandards?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Nenhuma norma encontrada" : "Nenhuma norma cadastrada"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Norma
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredStandards?.map((standard) => (
            <Card 
              key={standard.id} 
              className="group hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onSelectStandard?.(standard)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{standard.name}</CardTitle>
                      <Badge variant="outline">{standard.code}</Badge>
                      {standard.version && (
                        <Badge variant="secondary">v{standard.version}</Badge>
                      )}
                    </div>
                    {standard.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {standard.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(standard); }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDuplicatingStandard(standard); }}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); setDeleteId(standard.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {onSelectStandard && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="font-normal">
                    {getCalculationMethodLabel(standard.calculation_method)}
                  </Badge>
                  {standard.auto_numbering && (
                    <Badge variant="secondary" className="font-normal">
                      Numeração automática
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StandardFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        standard={editingStandard}
      />

      {duplicatingStandard && (
        <DuplicateStandardDialog
          open={!!duplicatingStandard}
          onOpenChange={(open) => !open && setDuplicatingStandard(null)}
          standard={duplicatingStandard}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Norma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta norma? Todos os itens associados também serão excluídos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
