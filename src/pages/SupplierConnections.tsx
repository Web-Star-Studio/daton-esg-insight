import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
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
  Plus, Link2, ArrowLeft, ArrowRight, Trash2, 
  Building2, User, Recycle, AlertTriangle, HelpCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import {
  getSupplierConnections,
  createSupplierConnection,
  deleteSupplierConnection,
  getManagedSuppliers,
  connectionTypeLabels,
  SupplierConnection,
} from "@/services/supplierManagementService";

export default function SupplierConnections() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    primary_supplier_id: "",
    connected_supplier_id: "",
    connection_type: "logistica_reversa" as 'logistica_reversa' | 'material_perigoso' | 'outro',
    description: "",
  });

  const { data: connections, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-connections'],
    queryFn: getSupplierConnections,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['managed-suppliers'],
    queryFn: getManagedSuppliers,
  });

  const createMutation = useMutation({
    mutationFn: createSupplierConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
      toast({ title: "Conexão criada com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao criar conexão", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-connections'] });
      toast({ title: "Conexão excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir conexão", variant: "destructive" });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      primary_supplier_id: "",
      connected_supplier_id: "",
      connection_type: "logistica_reversa",
      description: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.primary_supplier_id || !formData.connected_supplier_id) {
      toast({ title: "Selecione os dois fornecedores", variant: "destructive" });
      return;
    }

    if (formData.primary_supplier_id === formData.connected_supplier_id) {
      toast({ title: "Os fornecedores devem ser diferentes", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      primary_supplier_id: formData.primary_supplier_id,
      connected_supplier_id: formData.connected_supplier_id,
      connection_type: formData.connection_type,
      description: formData.description || undefined,
    });
  };

  const getSupplierName = (supplier: any) => {
    if (!supplier) return "Desconhecido";
    return supplier.person_type === 'PJ' 
      ? supplier.company_name 
      : supplier.full_name;
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'logistica_reversa': return <Recycle className="h-4 w-4 text-green-500" />;
      case 'material_perigoso': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionBadge = (type: string) => {
    switch (type) {
      case 'logistica_reversa': 
        return <Badge className="bg-green-100 text-green-800">{connectionTypeLabels[type]}</Badge>;
      case 'material_perigoso': 
        return <Badge className="bg-orange-100 text-orange-800">{connectionTypeLabels[type]}</Badge>;
      default: 
        return <Badge variant="secondary">{connectionTypeLabels[type] || type}</Badge>;
    }
  };

  // Group connections by primary supplier
  const groupedConnections = connections?.reduce((acc, conn) => {
    const primaryId = conn.primary_supplier_id;
    if (!acc[primaryId]) {
      acc[primaryId] = {
        primary: conn.primary_supplier,
        connections: []
      };
    }
    acc[primaryId].connections.push(conn);
    return acc;
  }, {} as Record<string, { primary: any; connections: SupplierConnection[] }>);

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
              <h1 className="text-3xl font-bold tracking-tight">Conexões de Fornecedores</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie conexões para logística reversa e material perigoso
              </p>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conexão
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">O que são conexões?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Conexões permitem vincular fornecedores em razão de logística reversa ou entrega de material perigoso.
                  Por exemplo: A Empresa A fornece Bateria, mas as empresas B, C, D podem transportar as baterias da Empresa A.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections List */}
        <LoadingState
          loading={isLoading}
          error={error?.message}
          retry={refetch}
          empty={!connections?.length}
          emptyMessage="Nenhuma conexão cadastrada"
        >
          {groupedConnections && Object.values(groupedConnections).map((group) => (
            <Card key={group.primary?.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {group.primary?.person_type === 'PJ' ? (
                    <Building2 className="h-5 w-5 text-blue-500" />
                  ) : (
                    <User className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{getSupplierName(group.primary)}</CardTitle>
                    <CardDescription>Fornecedor principal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Fornecedor Conectado</TableHead>
                      <TableHead>Tipo de Conexão</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.connections.map((conn) => (
                      <TableRow key={conn.id}>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {conn.connected_supplier?.person_type === 'PJ' ? (
                              <Building2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-green-500" />
                            )}
                            {getSupplierName(conn.connected_supplier)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getConnectionIcon(conn.connection_type)}
                            {getConnectionBadge(conn.connection_type)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {conn.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Deseja excluir esta conexão?")) {
                                deleteMutation.mutate(conn.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </LoadingState>

        {/* Create Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conexão de Fornecedores</DialogTitle>
              <DialogDescription>
                Vincule fornecedores para logística reversa ou transporte de material perigoso.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fornecedor Principal *</Label>
                <Select
                  value={formData.primary_supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, primary_supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.filter(s => s.status === 'Ativo').map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center gap-2">
                          {supplier.person_type === 'PJ' ? (
                            <Building2 className="h-4 w-4 text-blue-500" />
                          ) : (
                            <User className="h-4 w-4 text-green-500" />
                          )}
                          {getSupplierName(supplier)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <div className="p-2 rounded-full bg-muted">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fornecedor Conectado (Transportador) *</Label>
                <Select
                  value={formData.connected_supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, connected_supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor conectado" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers
                      ?.filter(s => s.status === 'Ativo' && s.id !== formData.primary_supplier_id)
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center gap-2">
                            {supplier.person_type === 'PJ' ? (
                              <Building2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <User className="h-4 w-4 text-green-500" />
                            )}
                            {getSupplierName(supplier)}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conexão *</Label>
                <Select
                  value={formData.connection_type}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    connection_type: value as typeof formData.connection_type 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logistica_reversa">
                      <div className="flex items-center gap-2">
                        <Recycle className="h-4 w-4 text-green-500" />
                        Logística Reversa
                      </div>
                    </SelectItem>
                    <SelectItem value="material_perigoso">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Material Perigoso
                      </div>
                    </SelectItem>
                    <SelectItem value="outro">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-gray-500" />
                        Outro
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Transporta baterias automotivas da Empresa A"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                Criar Conexão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
