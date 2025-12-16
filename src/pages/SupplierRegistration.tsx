import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, Building2, User, ArrowLeft, Pencil, Trash2, 
  Eye, Copy, Search, Filter 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getManagedSuppliers,
  createManagedSupplier,
  updateManagedSupplier,
  deleteManagedSupplier,
  getSupplierTypes,
  ManagedSupplier,
} from "@/services/supplierManagementService";

export default function SupplierRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<ManagedSupplier | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<ManagedSupplier | null>(null);
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PJ');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    // PF
    full_name: "",
    cpf: "",
    // PJ
    company_name: "",
    cnpj: "",
    responsible_name: "",
    // Common
    nickname: "",
    full_address: "",
    phone_1: "",
    phone_2: "",
    email: "",
  });

  const { data: suppliers, isLoading, error, refetch } = useQuery({
    queryKey: ['managed-suppliers'],
    queryFn: getManagedSuppliers,
  });

  const { data: supplierTypes } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: getSupplierTypes,
  });

  const createMutation = useMutation({
    mutationFn: createManagedSupplier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['managed-suppliers'] });
      toast({ 
        title: "Fornecedor cadastrado com sucesso!",
        description: `Senha temporária: ${data.temporary_password}`
      });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar fornecedor", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ManagedSupplier> }) =>
      updateManagedSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-suppliers'] });
      toast({ title: "Fornecedor atualizado com sucesso!" });
      closeModal();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar fornecedor", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManagedSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-suppliers'] });
      toast({ title: "Fornecedor excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir fornecedor", variant: "destructive" });
    },
  });

  const openModal = (supplier?: ManagedSupplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setPersonType(supplier.person_type);
      setFormData({
        full_name: supplier.full_name || "",
        cpf: supplier.cpf || "",
        company_name: supplier.company_name || "",
        cnpj: supplier.cnpj || "",
        responsible_name: supplier.responsible_name || "",
        nickname: supplier.nickname || "",
        full_address: supplier.full_address,
        phone_1: supplier.phone_1,
        phone_2: supplier.phone_2 || "",
        email: supplier.email || "",
      });
    } else {
      setEditingSupplier(null);
      setPersonType('PJ');
      setFormData({
        full_name: "", cpf: "", company_name: "", cnpj: "",
        responsible_name: "", nickname: "", full_address: "",
        phone_1: "", phone_2: "", email: "",
      });
      setSelectedTypes([]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setViewingSupplier(null);
    setSelectedTypes([]);
  };

  const handleSubmit = () => {
    // Validations
    if (personType === 'PF') {
      if (!formData.full_name || !formData.cpf || !formData.full_address || !formData.phone_1) {
        toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
        return;
      }
    } else {
      if (!formData.company_name || !formData.cnpj || !formData.responsible_name || 
          !formData.full_address || !formData.phone_1 || !formData.email) {
        toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
        return;
      }
    }

    const submitData = {
      person_type: personType,
      ...(personType === 'PF' ? {
        full_name: formData.full_name,
        cpf: formData.cpf,
      } : {
        company_name: formData.company_name,
        cnpj: formData.cnpj,
        responsible_name: formData.responsible_name,
      }),
      nickname: formData.nickname || undefined,
      full_address: formData.full_address,
      phone_1: formData.phone_1,
      phone_2: formData.phone_2 || undefined,
      email: formData.email || undefined,
      type_ids: selectedTypes,
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredSuppliers = suppliers?.filter((s) => {
    const matchesSearch = 
      (s.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.full_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.nickname?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.cnpj?.includes(searchTerm)) ||
      (s.cpf?.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo': return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'Inativo': return <Badge variant="secondary">Inativo</Badge>;
      case 'Suspenso': return <Badge className="bg-red-100 text-red-800">Suspenso</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
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
              <h1 className="text-3xl font-bold tracking-tight">Cadastro de Fornecedores</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie fornecedores Pessoa Física e Pessoa Jurídica
              </p>
            </div>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, apelido, CNPJ ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Ativo">Ativos</SelectItem>
                  <SelectItem value="Inativo">Inativos</SelectItem>
                  <SelectItem value="Suspenso">Suspensos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Cadastrados ({filteredSuppliers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState
              loading={isLoading}
              error={error?.message}
              retry={refetch}
              empty={!filteredSuppliers?.length}
              emptyMessage="Nenhum fornecedor encontrado"
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Nome/Razão Social</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        {supplier.person_type === 'PJ' ? (
                          <Building2 className="h-4 w-4 text-blue-500" />
                        ) : (
                          <User className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          {supplier.person_type === 'PJ' ? supplier.company_name : supplier.full_name}
                          {supplier.nickname && (
                            <span className="text-muted-foreground text-sm ml-2">
                              ({supplier.nickname})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.person_type === 'PJ' ? supplier.cnpj : supplier.cpf}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {supplier.phone_1}
                          {supplier.email && <div className="text-muted-foreground">{supplier.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(supplier.registration_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingSupplier(supplier)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(supplier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Deseja excluir este fornecedor?")) {
                                deleteMutation.mutate(supplier.id);
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

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={personType} onValueChange={(v) => setPersonType(v as 'PF' | 'PJ')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="PJ" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Pessoa Jurídica
                </TabsTrigger>
                <TabsTrigger value="PF" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Pessoa Física
                </TabsTrigger>
              </TabsList>

              <TabsContent value="PJ" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Razão Social *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ *</Label>
                    <Input
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsável *</Label>
                    <Input
                      value={formData.responsible_name}
                      onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="PF" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Common Fields */}
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Endereço Completo *</Label>
                <Input
                  value={formData.full_address}
                  onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone 1 *</Label>
                  <Input
                    value={formData.phone_1}
                    onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone 2</Label>
                  <Input
                    value={formData.phone_2}
                    onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Apelido (opcional)</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Para facilitar localização"
                />
              </div>

              {/* Types Selection */}
              {supplierTypes && supplierTypes.length > 0 && (
                <div className="space-y-2">
                  <Label>Tipos de Fornecedor</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                    {supplierTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.id}
                          checked={selectedTypes.includes(type.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTypes([...selectedTypes, type.id]);
                            } else {
                              setSelectedTypes(selectedTypes.filter((id) => id !== type.id));
                            }
                          }}
                        />
                        <label htmlFor={type.id} className="text-sm cursor-pointer">
                          {type.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingSupplier ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={!!viewingSupplier} onOpenChange={() => setViewingSupplier(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            </DialogHeader>
            {viewingSupplier && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {viewingSupplier.person_type === 'PJ' ? (
                    <Building2 className="h-5 w-5 text-blue-500" />
                  ) : (
                    <User className="h-5 w-5 text-green-500" />
                  )}
                  <span className="font-medium">
                    {viewingSupplier.person_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </span>
                  {getStatusBadge(viewingSupplier.status)}
                </div>

                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome/Razão Social:</span>
                    <p className="font-medium">
                      {viewingSupplier.person_type === 'PJ' 
                        ? viewingSupplier.company_name 
                        : viewingSupplier.full_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {viewingSupplier.person_type === 'PJ' ? 'CNPJ:' : 'CPF:'}
                    </span>
                    <p className="font-medium">
                      {viewingSupplier.person_type === 'PJ' 
                        ? viewingSupplier.cnpj 
                        : viewingSupplier.cpf}
                    </p>
                  </div>
                  {viewingSupplier.responsible_name && (
                    <div>
                      <span className="text-muted-foreground">Responsável:</span>
                      <p className="font-medium">{viewingSupplier.responsible_name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="font-medium">{viewingSupplier.full_address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contato:</span>
                    <p className="font-medium">{viewingSupplier.phone_1}</p>
                    {viewingSupplier.phone_2 && <p>{viewingSupplier.phone_2}</p>}
                  </div>
                  {viewingSupplier.email && (
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <p className="font-medium">{viewingSupplier.email}</p>
                    </div>
                  )}
                  {viewingSupplier.access_code && (
                    <div className="p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">Código de Acesso:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{viewingSupplier.access_code}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(viewingSupplier.access_code!, "Código")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
