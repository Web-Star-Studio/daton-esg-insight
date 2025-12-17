import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useResponseTypes, useDeleteResponseType } from "@/hooks/audit/useResponseTypes";
import { ResponseType } from "@/services/audit/responseTypes";
import { ResponseTypeFormDialog } from "./ResponseTypeFormDialog";
import { ResponseOptionBuilder } from "./ResponseOptionBuilder";

export function ResponseTypeManager() {
  const { data: responseTypes, isLoading } = useResponseTypes();
  const deleteResponseType = useDeleteResponseType();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ResponseType | null>(null);
  const [viewingType, setViewingType] = useState<ResponseType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (type: ResponseType) => {
    setEditingType(type);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteResponseType.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Resposta</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os tipos de resposta disponíveis para as auditorias
          </p>
        </div>
        <Button onClick={() => { setEditingType(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {responseTypes?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum tipo de resposta cadastrado</p>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Tipo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {responseTypes?.map((type) => (
            <Card key={type.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{type.name}</CardTitle>
                    {type.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {type.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingType(type)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar Opções
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(type)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {!type.is_system && (
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(type.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {type.is_system && (
                    <Badge variant="secondary">Sistema</Badge>
                  )}
                  <Badge variant="outline">
                    {type.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResponseTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        responseType={editingType}
      />

      {viewingType && (
        <ResponseOptionBuilder
          open={!!viewingType}
          onOpenChange={(open) => !open && setViewingType(null)}
          responseType={viewingType}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tipo de Resposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de resposta? Esta ação não pode ser desfeita.
              Tipos vinculados a normas não podem ser excluídos.
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
