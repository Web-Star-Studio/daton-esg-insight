import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, FolderTree, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getSupplierCategories,
  createSupplierCategory,
  updateSupplierCategory,
  deleteSupplierCategory,
  SupplierCategory,
} from "@/services/supplierManagementService";

export default function SupplierCategoriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SupplierCategory | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-categories'],
    queryFn: getSupplierCategories,
  });

  const createMutation = useMutation({
    mutationFn: createSupplierCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-categories'] });
      toast({ title: "Categoria criada com sucesso!" });
      closeModal();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao criar categoria", 
        description: error.message.includes('duplicate') ? "Já existe uma categoria com este nome" : error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierCategory> }) =>
      updateSupplierCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-categories'] });
      toast({ title: "Categoria atualizada com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar categoria", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-categories'] });
      toast({ title: "Categoria excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir categoria", variant: "destructive" });
    },
  });

  const openModal = (category?: SupplierCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name });
    } else {
      setEditingCategory(null);
      setFormData({ name: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: "" });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Nomenclatura é obrigatória", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: { name: formData.name } });
    } else {
      createMutation.mutate({ name: formData.name });
    }
  };

  const toggleActive = (category: SupplierCategory) => {
    updateMutation.mutate({ 
      id: category.id, 
      data: { is_active: !category.is_active } 
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Categorias de Fornecedor</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre as categorias de atividade dos fornecedores (2º nível)
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Categorias</strong> funcionam como "guarda-chuvas" para agrupar os <strong>Tipos de Fornecedor</strong>. 
              Exemplos: Ambiental, Manutenção, N². Ao criar tipos, você poderá vinculá-los a uma categoria.
            </p>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Categorias Cadastradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!categories?.length}
              emptyMessage="Nenhuma categoria cadastrada"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomenclatura</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={category.is_active}
                            onCheckedChange={() => toggleActive(category)}
                          />
                          <Badge variant={category.is_active ? "default" : "secondary"}>
                            {category.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openModal(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Deseja excluir esta categoria?")) {
                                deleteMutation.mutate(category.id);
                              }
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
            </LoadingState>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria de Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomenclatura *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="Ex: Ambiental, Manutenção, N²..."
                />
                <p className="text-xs text-muted-foreground">
                  Informe o nome da categoria que agrupará os tipos de fornecedor
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
