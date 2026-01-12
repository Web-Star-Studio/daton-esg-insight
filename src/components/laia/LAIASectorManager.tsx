import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useLAIASectors, 
  useCreateLAIASector, 
  useUpdateLAIASector, 
  useDeleteLAIASector 
} from "@/hooks/useLAIA";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import type { LAIASector } from "@/types/laia";

export function LAIASectorManager() {
  const { data: sectors, isLoading } = useLAIASectors();
  const createMutation = useCreateLAIASector();
  const updateMutation = useUpdateLAIASector();
  const deleteMutation = useDeleteLAIASector();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<LAIASector | null>(null);
  const [deletingSector, setDeletingSector] = useState<LAIASector | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const handleOpenCreate = () => {
    setEditingSector(null);
    setFormData({ code: "", name: "", description: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (sector: LAIASector) => {
    setEditingSector(sector);
    setFormData({
      code: sector.code,
      name: sector.name,
      description: sector.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingSector) {
      await updateMutation.mutateAsync({ id: editingSector.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingSector) {
      await deleteMutation.mutateAsync(deletingSector.id);
      setIsDeleteDialogOpen(false);
      setDeletingSector(null);
    }
  };

  const handleToggleActive = async (sector: LAIASector) => {
    await updateMutation.mutateAsync({ 
      id: sector.id, 
      data: { is_active: !sector.is_active } 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerenciar Setores
          </CardTitle>
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Setor
          </Button>
        </CardHeader>
        <CardContent>
          {sectors && sectors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectors.map((sector) => (
                  <TableRow key={sector.id}>
                    <TableCell className="font-mono font-medium">{sector.code}</TableCell>
                    <TableCell>{sector.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sector.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={sector.is_active}
                        onCheckedChange={() => handleToggleActive(sector)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(sector)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setDeletingSector(sector);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum setor cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cadastre setores para organizar suas avaliações LAIA
              </p>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Setor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSector ? "Editar Setor" : "Novo Setor"}
            </DialogTitle>
            <DialogDescription>
              {editingSector 
                ? "Atualize as informações do setor." 
                : "Cadastre um novo setor para organizar as avaliações LAIA."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ex: PROD, ADM, LOG"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Código único do setor (máximo 10 caracteres)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Produção, Administrativo, Logística"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional do setor..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.code || !formData.name || createMutation.isPending || updateMutation.isPending}
            >
              {editingSector ? "Salvar Alterações" : "Criar Setor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Setor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o setor "{deletingSector?.name}"? 
              Esta ação não pode ser desfeita e pode afetar avaliações vinculadas.
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
