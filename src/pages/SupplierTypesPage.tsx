import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Tag, ArrowLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getSupplierTypes,
  createSupplierType,
  updateSupplierType,
  deleteSupplierType,
  buildTypeTree,
  SupplierType,
} from "@/services/supplierManagementService";
import { cn } from "@/lib/utils";

interface TreeNodeProps {
  type: SupplierType;
  level: number;
  onEdit: (type: SupplierType) => void;
  onDelete: (id: string) => void;
}

function TreeNode({ type, level, onEdit, onDelete }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = type.children && type.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 group",
          level > 0 && "ml-6"
        )}
        style={{ marginLeft: level * 24 }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-6" />
        )}
        
        <Tag className="h-4 w-4 text-primary" />
        <span className="font-medium flex-1">{type.name}</span>
        
        <Badge variant={type.is_active ? "default" : "secondary"} className="text-xs">
          {type.is_active ? "Ativo" : "Inativo"}
        </Badge>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(type)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (confirm("Deseja excluir este tipo?")) {
                onDelete(type.id);
              }
            }}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {type.children!.map((child) => (
            <TreeNode
              key={child.id}
              type={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SupplierTypesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<SupplierType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    parent_type_id: "",
    description: "",
  });

  const { data: types, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: getSupplierTypes,
  });

  const typeTree = types ? buildTypeTree(types) : [];

  const createMutation = useMutation({
    mutationFn: createSupplierType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-types'] });
      toast({ title: "Tipo criado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao criar tipo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierType> }) =>
      updateSupplierType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-types'] });
      toast({ title: "Tipo atualizado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar tipo", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-types'] });
      toast({ title: "Tipo excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir tipo", variant: "destructive" });
    },
  });

  const openModal = (type?: SupplierType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        parent_type_id: type.parent_type_id || "",
        description: type.description || "",
      });
    } else {
      setEditingType(null);
      setFormData({ name: "", parent_type_id: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingType(null);
    setFormData({ name: "", parent_type_id: "", description: "" });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    const submitData = {
      name: formData.name,
      parent_type_id: formData.parent_type_id || undefined,
      description: formData.description || undefined,
    };

    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
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
              <h1 className="text-3xl font-bold tracking-tight">Tipos de Fornecedor</h1>
              <p className="text-muted-foreground mt-1">
                Cadastre os tipos de fornecedores em estrutura hierárquica
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>

        {/* Types Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Estrutura de Tipos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!typeTree?.length}
              emptyMessage="Nenhum tipo cadastrado"
            >
              <div className="space-y-1">
                {typeTree.map((type) => (
                  <TreeNode
                    key={type.id}
                    type={type}
                    level={0}
                    onEdit={openModal}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </LoadingState>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Editar Tipo" : "Novo Tipo de Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nomenclatura *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Resid., Comb., N1, N2..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Tipo Pai (opcional)</Label>
                <Select
                  value={formData.parent_type_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_type_id: value === "none" ? "" : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um tipo pai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (raiz)</SelectItem>
                    {types
                      ?.filter((t) => t.id !== editingType?.id)
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do tipo..."
                />
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
                {editingType ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
