import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Phone, Mail, MapPin, Star, TrendingUp, AlertCircle, Eye, Edit } from "lucide-react";
import { 
  getSuppliers, 
  createSupplier, 
  Supplier as SupplierType
} from "@/services/supplierService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SupplierDetailsModal } from "@/components/SupplierDetailsModal";
import { SupplierEvaluationModal } from "@/components/SupplierEvaluationModal";
import { SupplierQualificationModal } from "@/components/SupplierQualificationModal";
import { SupplierContractsTab } from "@/components/SupplierContractsTab";

const SUPPLIER_CATEGORIES = [
  "Materiais",
  "Serviços",
  "Equipamentos",
  "Tecnologia",
  "Logística",
  "Manutenção",
  "Consultoria",
  "Outros"
];

const QUALIFICATION_STATUS = [
  "Não Qualificado",
  "Em Qualificação",
  "Qualificado",
  "Re-qualificação",
  "Desqualificado"
];

export default function GestaoFornecedores() {
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isQualificationOpen, setIsQualificationOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [newSupplierData, setNewSupplierData] = useState({
    name: "",
    cnpj: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    category: ""
  });


  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: getSuppliers,
  });

  const createSupplierMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Fornecedor cadastrado com sucesso!");
      setIsCreateSupplierOpen(false);
      resetSupplierForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar fornecedor: " + error.message);
    },
  });

  const resetSupplierForm = () => {
    setNewSupplierData({
      name: "",
      cnpj: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      category: ""
    });
  };


  const handleCreateSupplier = () => {
    if (!newSupplierData.name) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }

    createSupplierMutation.mutate(newSupplierData);
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-100 text-green-800";
      case "Inativo": return "bg-red-100 text-red-800";
      case "Suspenso": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getQualificationColor = (status: string) => {
    switch (status) {
      case "Qualificado": return "bg-green-100 text-green-800";
      case "Em Qualificação": return "bg-blue-100 text-blue-800";
      case "Re-qualificação": return "bg-yellow-100 text-yellow-800";
      case "Desqualificado": return "bg-red-100 text-red-800";
      case "Não Qualificado": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredSuppliers = suppliers.filter((supplier: SupplierType) => {
    const matchesSearch = !searchTerm || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s: SupplierType) => s.status === "Ativo").length;
  const qualifiedSuppliers = suppliers.filter((s: SupplierType) => s.qualification_status === "Qualificado").length;
  const avgScore = suppliers.length > 0 
    ? suppliers.reduce((sum: number, supplier: SupplierType) => sum + (supplier.rating || 0), 0) / suppliers.length
    : 0;

  const handleSupplierView = (supplier: SupplierType) => {
    setSelectedSupplier(supplier);
    setIsDetailsOpen(true);
  };

  const handleSupplierQualify = (supplier: SupplierType) => {
    setSelectedSupplier(supplier);
    setIsQualificationOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["suppliers"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Fornecedores</h1>
          <p className="text-muted-foreground mt-2">
            Qualifique, avalie e gerencie fornecedores e partes interessadas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            disabled={!suppliers.length}
            onClick={() => setIsEvaluationOpen(true)}
          >
            <Star className="h-4 w-4 mr-2" />
            Avaliar
          </Button>

          <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Empresa *</Label>
                    <Input
                      id="name"
                      value={newSupplierData.name}
                      onChange={(e) => setNewSupplierData({...newSupplierData, name: e.target.value})}
                      placeholder="Razão social do fornecedor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={newSupplierData.cnpj}
                      onChange={(e) => setNewSupplierData({...newSupplierData, cnpj: e.target.value})}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplierData.contact_email}
                      onChange={(e) => setNewSupplierData({...newSupplierData, contact_email: e.target.value})}
                      placeholder="contato@fornecedor.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={newSupplierData.contact_phone}
                      onChange={(e) => setNewSupplierData({...newSupplierData, contact_phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newSupplierData.category}
                    onValueChange={(value) => setNewSupplierData({...newSupplierData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPLIER_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Textarea
                    id="address"
                    value={newSupplierData.address}
                    onChange={(e) => setNewSupplierData({...newSupplierData, address: e.target.value})}
                    placeholder="Endereço completo"
                  />
                </div>

                <Button 
                  onClick={handleCreateSupplier} 
                  className="w-full"
                  disabled={createSupplierMutation.isPending}
                >
                  {createSupplierMutation.isPending ? "Cadastrando..." : "Cadastrar Fornecedor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              cadastrados no sistema
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualificados</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{qualifiedSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              prontos para fornecimento
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore ? avgScore.toFixed(1) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              escala de 0 a 5
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <Input
              placeholder="Pesquisar fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suppliers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Fornecedores</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os fornecedores cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSuppliers.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qualificação</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier: SupplierType) => {
                      const latestEval = Array.isArray(supplier.supplier_evaluations) && supplier.supplier_evaluations.length > 0 
                        ? supplier.supplier_evaluations[0] 
                        : null;
                      return (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.cnpj && (
                                <div className="text-sm text-muted-foreground">
                                  CNPJ: {supplier.cnpj}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {supplier.category && (
                              <Badge variant="outline">
                                {supplier.category}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {supplier.contact_email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {supplier.contact_email}
                                </div>
                              )}
                              {supplier.contact_phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {supplier.contact_phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(supplier.status)}>
                              {supplier.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getQualificationColor(supplier.qualification_status)}>
                              {supplier.qualification_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {latestEval ? (
                              <div className="flex items-center gap-1">
                                <Star className={`h-4 w-4 ${getScoreColor(latestEval.overall_score)}`} />
                                <span className={getScoreColor(latestEval.overall_score)}>
                                  {latestEval.overall_score?.toFixed(1) || "0.0"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Não avaliado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all" 
                      ? "Tente alterar os filtros de busca"
                      : "Cadastre o primeiro fornecedor"
                    }
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button onClick={() => setIsCreateSupplierOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Primeiro Fornecedor
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Avaliações</CardTitle>
              <CardDescription>
                Acompanhe o desempenho dos fornecedores ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suppliers.length > 0 && suppliers.some(s => s.supplier_evaluations && s.supplier_evaluations.length > 0) ? (
                <div className="space-y-4">
                  {suppliers
                    .filter(s => s.supplier_evaluations && s.supplier_evaluations.length > 0)
                    .map((supplier) => (
                      <Card key={supplier.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{supplier.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Qualidade</TableHead>
                                <TableHead>Entrega</TableHead>
                                <TableHead>Atendimento</TableHead>
                                <TableHead>Score Geral</TableHead>
                                <TableHead>Comentários</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplier.supplier_evaluations?.map((evaluation) => (
                                <TableRow key={evaluation.id}>
                                  <TableCell>
                                    {format(new Date(evaluation.evaluation_date), "dd/MM/yyyy", { locale: ptBR })}
                                  </TableCell>
                                  <TableCell>{evaluation.quality_score.toFixed(1)}</TableCell>
                                  <TableCell>{evaluation.delivery_score.toFixed(1)}</TableCell>
                                  <TableCell>{evaluation.service_score.toFixed(1)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium ${getScoreColor(evaluation.overall_score)}`}>
                                        {evaluation.overall_score.toFixed(1)}
                                      </span>
                                      <div className="flex">
                                        {Array.from({ length: 5 }, (_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3 w-3 ${
                                              i < Math.floor(evaluation.overall_score) 
                                                ? "fill-yellow-400 text-yellow-400" 
                                                : "text-gray-300"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="max-w-xs truncate">
                                    {evaluation.comments || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma avaliação registrada ainda
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsEvaluationOpen(true)}
                    disabled={!suppliers.length}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Registrar Primeira Avaliação
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <SupplierContractsTab />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <SupplierEvaluationModal
        suppliers={suppliers}
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <SupplierDetailsModal
        supplier={selectedSupplier}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onSupplierUpdate={handleModalSuccess}
      />

      <SupplierQualificationModal
        supplier={selectedSupplier}
        isOpen={isQualificationOpen}
        onClose={() => setIsQualificationOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}