import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Package, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getManagedSupplierById,
  getSupplierProductsServices,
  createSupplierProductService,
  updateSupplierProductService,
  deleteSupplierProductService,
  SupplierProductService,
} from "@/services/supplierManagementService";

export default function SupplierProductsServicesPage() {
  const { id: supplierId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierProductService | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    item_type: "produto" as "produto" | "servico",
    description: "",
    category: "",
    unit_of_measure: "",
  });

  const { data: supplier } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => getManagedSupplierById(supplierId!),
    enabled: !!supplierId,
  });

  const { data: items, isLoading, error, refetch } = useQuery({
    queryKey: ["supplier-products-services", supplierId],
    queryFn: () => getSupplierProductsServices(supplierId!),
    enabled: !!supplierId,
  });

  const createMutation = useMutation({
    mutationFn: createSupplierProductService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products-services", supplierId] });
      toast({ title: "Item cadastrado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierProductService> }) =>
      updateSupplierProductService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products-services", supplierId] });
      toast({ title: "Item atualizado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar item", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierProductService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products-services", supplierId] });
      toast({ title: "Item excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir item", variant: "destructive" });
    },
  });

  const openModal = (item?: SupplierProductService) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        item_type: item.item_type,
        description: item.description || "",
        category: item.category || "",
        unit_of_measure: item.unit_of_measure || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        item_type: "produto",
        description: "",
        category: "",
        unit_of_measure: "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, supplier_id: supplierId! });
    }
  };

  const supplierName = supplier?.person_type === "PJ" ? supplier.company_name : supplier?.full_name;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fornecedores/cadastro")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos e Serviços [ALX]</h1>
            <p className="text-muted-foreground mt-1">
              {supplierName ? `Fornecedor: ${supplierName}` : "Carregando..."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Itens Cadastrados ({items?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!items?.length}
              emptyMessage="Nenhum produto ou serviço cadastrado"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.item_type === "produto" ? (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span>Produto</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-green-500" />
                            <span>Serviço</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>{item.unit_of_measure || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Excluir este item?")) {
                                deleteMutation.mutate(item.id);
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
                {editingItem ? "Editar Item" : "Novo Produto/Serviço"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.item_type}
                  onValueChange={(v) => setFormData({ ...formData, item_type: v as "produto" | "servico" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Matéria-prima XYZ, Transporte Rodoviário"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Matéria-prima, Logística, Manutenção"
                />
              </div>

              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Input
                  value={formData.unit_of_measure}
                  onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  placeholder="Ex: kg, un, serviço, hora"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição detalhada do produto ou serviço"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
