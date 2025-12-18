import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package, Plus, Calendar, Truck, ClipboardCheck, 
  AlertCircle, CheckCircle, Clock, Search, Filter,
  Trash2, Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getDeliveries,
  createDelivery,
  deleteDelivery,
  getDeliveryStats,
  DeliveryFilters,
  SupplierDelivery,
} from "@/services/supplierDeliveriesService";
import { getManagedSuppliers, getSupplierTypes } from "@/services/supplierManagementService";

export default function SupplierDeliveriesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState<DeliveryFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_type_id: "",
    delivery_date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    reference_number: "",
  });

  // Queries
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["supplier-deliveries", filters],
    queryFn: () => getDeliveries(filters),
  });

  const { data: stats } = useQuery({
    queryKey: ["delivery-stats"],
    queryFn: getDeliveryStats,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["managed-suppliers"],
    queryFn: getManagedSuppliers,
  });

  const { data: supplierTypes = [] } = useQuery({
    queryKey: ["supplier-types"],
    queryFn: getSupplierTypes,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Fornecimento registrado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao registrar fornecimento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-stats"] });
      toast({ title: "Fornecimento excluído" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      supplier_type_id: "",
      delivery_date: format(new Date(), "yyyy-MM-dd"),
      description: "",
      reference_number: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.supplier_id || !formData.description) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      supplier_id: formData.supplier_id,
      supplier_type_id: formData.supplier_type_id || undefined,
      delivery_date: formData.delivery_date,
      description: formData.description,
      reference_number: formData.reference_number || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja excluir este fornecimento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEvaluate = (delivery: SupplierDelivery) => {
    navigate(`/fornecedores/avaliacoes/${delivery.supplier_id}/desempenho?delivery=${delivery.id}`);
  };

  const getSupplierName = (delivery: SupplierDelivery) => {
    if (delivery.supplier?.person_type === "PJ") {
      return delivery.supplier.company_name || "-";
    }
    return delivery.supplier?.full_name || "-";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pendente":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "Avaliado":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Avaliado</Badge>;
      case "Problema":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Problema</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredDeliveries = deliveries.filter(d => {
    if (!searchTerm) return true;
    const name = getSupplierName(d).toLowerCase();
    const desc = d.description.toLowerCase();
    const ref = d.reference_number?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return name.includes(term) || desc.includes(term) || ref.includes(term);
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8" />
              Registro de Fornecimentos [ALX]
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre cada fornecimento/entrega para avaliação individual
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecimento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avaliados</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.evaluated || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Problemas</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.problems || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por fornecedor, descrição, referência..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filters.supplier_id || "all"}
                onValueChange={(v) => setFilters(f => ({ ...f, supplier_id: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos fornecedores</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.person_type === "PJ" ? s.company_name : s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status || "all"}
                onValueChange={(v) => setFilters(f => ({ ...f, status: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Avaliado">Avaliado</SelectItem>
                  <SelectItem value="Problema">Problema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fornecimentos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              empty={filteredDeliveries.length === 0}
              emptyMessage="Nenhum fornecimento registrado"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(delivery.delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{getSupplierName(delivery)}</TableCell>
                      <TableCell>{delivery.supplier_type?.name || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{delivery.description}</TableCell>
                      <TableCell>{delivery.reference_number || "-"}</TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {delivery.status === "Pendente" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEvaluate(delivery)}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" />
                              Avaliar
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(delivery.id)}
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

        {/* Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Novo Fornecimento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Fornecedor *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(v) => setFormData(f => ({ ...f, supplier_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.person_type === "PJ" ? s.company_name : s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de Fornecedor</Label>
                <Select
                  value={formData.supplier_type_id}
                  onValueChange={(v) => setFormData(f => ({ ...f, supplier_type_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data do Fornecimento *</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData(f => ({ ...f, delivery_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Descrição *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva o fornecimento..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Referência (NF, OS...)</Label>
                <Input
                  value={formData.reference_number}
                  onChange={(e) => setFormData(f => ({ ...f, reference_number: e.target.value }))}
                  placeholder="Ex: NF-12345"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                Registrar Fornecimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
