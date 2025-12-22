import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Building2, User, ArrowLeft, Pencil, Trash2, 
  Eye, Copy, Search, Filter, Link2, Loader2, CheckCircle, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/ui/loading-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  getManagedSuppliers,
  createManagedSupplier,
  updateManagedSupplier,
  deleteManagedSupplier,
  getSupplierTypes,
  getSupplierCategories,
  checkCnpjCpfExists,
  ManagedSupplier,
  ManagedSupplierWithTypeCount,
  SupplierType,
  SupplierCategory,
} from "@/services/supplierManagementService";
import { formatCNPJ, formatCPF, validateCNPJ, validateCPF, cleanDocument } from "@/utils/formValidation";

// Interface para resposta do ViaCEP
interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Função para buscar CEP via ViaCEP
async function fetchAddressByCep(cep: string): Promise<ViaCepResponse | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data: ViaCepResponse = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export default function SupplierRegistration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<ManagedSupplierWithTypeCount | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<ManagedSupplierWithTypeCount | null>(null);
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PJ');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

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
    // Endereço separado
    cep: "",
    street: "",
    street_number: "",
    neighborhood: "",
    city: "",
    state: "",
    phone_1: "",
    phone_2: "",
    email: "",
    // Status (apenas para edição)
    status: "Ativo" as 'Ativo' | 'Inativo' | 'Suspenso',
    inactivation_reason: "",
  });

  const { data: suppliers, isLoading, error, refetch } = useQuery({
    queryKey: ['managed-suppliers'],
    queryFn: getManagedSuppliers,
  });

  const { data: supplierTypes } = useQuery({
    queryKey: ['supplier-types'],
    queryFn: getSupplierTypes,
  });

  const { data: supplierCategories } = useQuery({
    queryKey: ['supplier-categories'],
    queryFn: getSupplierCategories,
  });

  // Agrupar tipos por categoria
  const getTypesGroupedByCategory = useCallback(() => {
    if (!supplierTypes || !supplierCategories) return [];
    
    return supplierCategories.map(category => ({
      category,
      types: supplierTypes.filter(type => type.category_id === category.id)
    })).filter(group => group.types.length > 0);
  }, [supplierTypes, supplierCategories]);

  const createMutation = useMutation({
    mutationFn: createManagedSupplier,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['managed-suppliers'] });
      toast.success("Fornecedor cadastrado com sucesso!", {
        description: `Senha temporária: ${data.temporary_password}`
      });
      closeModal();
    },
    onError: (err: Error) => {
      toast.error("Erro ao cadastrar fornecedor", {
        description: err.message
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ManagedSupplier> }) =>
      updateManagedSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-suppliers'] });
      toast.success("Fornecedor atualizado com sucesso!");
      closeModal();
    },
    onError: (err: Error) => {
      toast.error("Erro ao atualizar fornecedor", {
        description: err.message
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteManagedSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managed-suppliers'] });
      toast.success("Fornecedor excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir fornecedor");
    },
  });

  // Handler para buscar CEP
  const handleCepChange = async (cep: string) => {
    setFormData(prev => ({ ...prev, cep }));
    
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      const address = await fetchAddressByCep(cleanCep);
      setIsLoadingCep(false);
      
      if (address) {
        setFormData(prev => ({
          ...prev,
          street: address.logradouro,
          neighborhood: address.bairro,
          city: address.localidade,
          state: address.uf,
        }));
        toast.success("Endereço encontrado!");
      } else {
        toast.error("CEP não encontrado");
      }
    }
  };

  const openModal = async (supplier?: ManagedSupplierWithTypeCount) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setPersonType(supplier.person_type);
      setFormData({
        full_name: supplier.full_name || "",
        cpf: supplier.cpf ? formatCPF(supplier.cpf) : "",
        company_name: supplier.company_name || "",
        cnpj: supplier.cnpj ? formatCNPJ(supplier.cnpj) : "",
        responsible_name: supplier.responsible_name || "",
        nickname: supplier.nickname || "",
        cep: supplier.cep || "",
        street: supplier.street || "",
        street_number: supplier.street_number || "",
        neighborhood: supplier.neighborhood || "",
        city: supplier.city || "",
        state: supplier.state || "",
        phone_1: supplier.phone_1 || "",
        phone_2: supplier.phone_2 || "",
        email: supplier.email || "",
        status: supplier.status || "Ativo",
        inactivation_reason: supplier.inactivation_reason || "",
      });
      
      // Carregar tipos associados ao fornecedor
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: assignments } = await supabase
          .from('supplier_type_assignments')
          .select('supplier_type_id')
          .eq('supplier_id', supplier.id);
        
        if (assignments) {
          setSelectedTypes(assignments.map(a => a.supplier_type_id));
        }
      } catch (error) {
        console.error('Erro ao carregar tipos do fornecedor:', error);
        setSelectedTypes([]);
      }
    } else {
      setEditingSupplier(null);
      setPersonType('PJ');
      setFormData({
        full_name: "", cpf: "", company_name: "", cnpj: "",
        responsible_name: "", nickname: "", 
        cep: "", street: "", street_number: "", neighborhood: "", city: "", state: "",
        phone_1: "", phone_2: "", email: "",
        status: "Ativo",
        inactivation_reason: "",
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

  const handleSubmit = async () => {
    // Validações básicas
    if (personType === 'PF') {
      if (!formData.full_name || !formData.cpf) {
        toast.error("Preencha todos os campos obrigatórios", {
          description: "Nome completo e CPF são obrigatórios"
        });
        return;
      }
      // Validar formato do CPF
      if (!validateCPF(formData.cpf)) {
        toast.error("CPF inválido", {
          description: "Verifique os dígitos informados"
        });
        return;
      }
    } else {
      if (!formData.company_name || !formData.cnpj || !formData.responsible_name || !formData.email) {
        toast.error("Preencha todos os campos obrigatórios", {
          description: "Razão social, CNPJ, responsável e e-mail são obrigatórios"
        });
        return;
      }
      // Validar formato do CNPJ
      if (!validateCNPJ(formData.cnpj)) {
        toast.error("CNPJ inválido", {
          description: "Verifique os dígitos informados"
        });
        return;
      }
    }

    // Validar endereço obrigatório
    if (!formData.cep || !formData.street || !formData.street_number || 
        !formData.neighborhood || !formData.city || !formData.state) {
      toast.error("Preencha todos os campos de endereço", {
        description: "CEP, rua, número, bairro, cidade e estado são obrigatórios"
      });
      return;
    }

    if (!formData.phone_1) {
      toast.error("Telefone é obrigatório");
      return;
    }

    // Validar se pelo menos um tipo está selecionado
    if (selectedTypes.length === 0 && !editingSupplier) {
      toast.error("Selecione pelo menos um tipo de fornecedor");
      return;
    }

    // Verificar duplicidade de CNPJ/CPF (usando valor limpo)
    setIsValidating(true);
    const checkResult = await checkCnpjCpfExists(
      personType === 'PJ' ? cleanDocument(formData.cnpj) : undefined,
      personType === 'PF' ? cleanDocument(formData.cpf) : undefined,
      editingSupplier?.id
    );
    setIsValidating(false);

    if (checkResult.exists) {
      toast.error(`Este ${checkResult.field?.toUpperCase()} já está cadastrado`, {
        description: "Não é possível cadastrar fornecedores com CNPJ/CPF duplicado"
      });
      return;
    }

    // Montar endereço completo para compatibilidade
    const fullAddress = `${formData.street}, ${formData.street_number} - ${formData.neighborhood}, ${formData.city} - ${formData.state}, CEP: ${formData.cep}`;

    const submitData = {
      person_type: personType,
      ...(personType === 'PF' ? {
        full_name: formData.full_name,
        cpf: cleanDocument(formData.cpf),
      } : {
        company_name: formData.company_name,
        cnpj: cleanDocument(formData.cnpj),
        responsible_name: formData.responsible_name,
      }),
      nickname: formData.nickname || undefined,
      full_address: fullAddress,
      cep: formData.cep,
      street: formData.street,
      street_number: formData.street_number,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      phone_1: formData.phone_1,
      phone_2: formData.phone_2 || undefined,
      email: formData.email || undefined,
      type_ids: selectedTypes,
      // Campos de status (apenas para edição)
      ...(editingSupplier && {
        status: formData.status,
        inactivation_reason: (formData.status === 'Inativo' || formData.status === 'Suspenso') 
          ? formData.inactivation_reason || null 
          : null,
        status_changed_at: editingSupplier.status !== formData.status 
          ? new Date().toISOString() 
          : undefined,
      }),
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
    toast.success(`${label} copiado!`);
  };

  const typesGrouped = getTypesGroupedByCategory();

  return (
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
                    <TableHead>Vinculação</TableHead>
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
                        {supplier.person_type === 'PJ' 
                          ? formatCNPJ(supplier.cnpj || '') 
                          : formatCPF(supplier.cpf || '')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {supplier.phone_1}
                          {supplier.email && <div className="text-muted-foreground">{supplier.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(supplier as ManagedSupplierWithTypeCount).type_count && (supplier as ManagedSupplierWithTypeCount).type_count! > 0 ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Vinculado ({(supplier as ManagedSupplierWithTypeCount).type_count})
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1 w-fit">
                            <AlertCircle className="h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
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
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/fornecedores/vinculacao/${supplier.id}`)}
                            title="Vincular"
                          >
                            <Link2 className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openModal(supplier)}
                            title="Editar"
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
                            title="Excluir"
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
                      onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
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
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
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

            {/* Campos de Endereço - Separados */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-medium text-sm">Endereço *</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP *</Label>
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Rua/Logradouro *</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Preenchido automaticamente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    value={formData.street_number}
                    onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro *</Label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Preenchido automaticamente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Preenchido automaticamente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado *</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
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

              {/* Aviso para endereços antigos */}
              {editingSupplier && !formData.cep && editingSupplier.full_address && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <strong className="text-yellow-800">Endereço atual:</strong> 
                  <span className="text-yellow-700 ml-1">{editingSupplier.full_address}</span>
                  <p className="text-xs text-yellow-700 mt-1">
                    Este fornecedor foi cadastrado antes da separação dos campos de endereço. 
                    Por favor, preencha os campos acima para atualizar.
                  </p>
                </div>
              )}
            </div>

            {/* Types Selection - Agrupados por Categoria */}
            {typesGrouped.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Tipos de Fornecedor {!editingSupplier && '*'}</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione pelo menos um tipo. A categoria é inferida automaticamente do tipo selecionado.
                </p>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-4">
                  {typesGrouped.map(({ category, types }) => (
                    <div key={category.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {types.map((type) => (
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
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Status - Apenas para Edição */}
            {editingSupplier && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-sm">Status do Fornecedor</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v: 'Ativo' | 'Inativo' | 'Suspenso') => 
                        setFormData({ ...formData, status: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            Ativo
                          </span>
                        </SelectItem>
                        <SelectItem value="Inativo">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                            Inativo
                          </span>
                        </SelectItem>
                        <SelectItem value="Suspenso">
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-500"></span>
                            Suspenso
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.status === 'Inativo' || formData.status === 'Suspenso') && (
                  <div className="space-y-2">
                    <Label>Motivo da {formData.status === 'Inativo' ? 'Inativação' : 'Suspensão'}</Label>
                    <Textarea
                      value={formData.inactivation_reason}
                      onChange={(e) => setFormData({ ...formData, inactivation_reason: e.target.value })}
                      placeholder={`Descreva o motivo da ${formData.status === 'Inativo' ? 'inativação' : 'suspensão'} do fornecedor...`}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: Problemas documentais, questões de fornecimento, valores, encerramento de atividades, etc.
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || isValidating}
              >
                {(createMutation.isPending || updateMutation.isPending || isValidating) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
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
                    <p className="font-medium">
                      {viewingSupplier.street && viewingSupplier.street_number ? (
                        <>
                          {viewingSupplier.street}, {viewingSupplier.street_number}
                          {viewingSupplier.neighborhood && ` - ${viewingSupplier.neighborhood}`}
                          <br />
                          {viewingSupplier.city} - {viewingSupplier.state}, CEP: {viewingSupplier.cep}
                        </>
                      ) : (
                        viewingSupplier.full_address
                      )}
                    </p>
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
                  {viewingSupplier.inactivation_reason && (viewingSupplier.status === 'Inativo' || viewingSupplier.status === 'Suspenso') && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-yellow-700 text-xs font-medium">
                        Motivo da {viewingSupplier.status === 'Inativo' ? 'Inativação' : 'Suspensão'}:
                      </span>
                      <p className="text-yellow-800 mt-1">{viewingSupplier.inactivation_reason}</p>
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
  );
}
