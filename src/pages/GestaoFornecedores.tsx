import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Plus, Building2, Phone, Mail, Star, TrendingUp, Eye, Edit, AlertCircle } from "lucide-react";
import { 
  getManagedSuppliers, 
  ManagedSupplierWithTypeCount
} from "@/services/supplierManagementService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierEvaluationModal } from "@/components/SupplierEvaluationModal";
import { SupplierContractsTab } from "@/components/SupplierContractsTab";

// Helper para obter nome do fornecedor baseado no tipo (PF/PJ)
function getSupplierDisplayName(supplier: ManagedSupplierWithTypeCount): string {
  return supplier.person_type === 'PJ' 
    ? supplier.company_name || 'Empresa sem nome' 
    : supplier.full_name || 'Pessoa sem nome';
}

// Helper para obter documento do fornecedor
function getSupplierDocument(supplier: ManagedSupplierWithTypeCount): string | null {
  return supplier.person_type === 'PJ' ? supplier.cnpj || null : supplier.cpf || null;
}

export default function GestaoFornecedores() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["managed-suppliers"],
    queryFn: getManagedSuppliers,
  });

  // Redirecionar para o cadastro unificado de fornecedores
  const handleNewSupplier = () => {
    navigate("/fornecedores/cadastro");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-100 text-green-800";
      case "Inativo": return "bg-red-100 text-red-800";
      case "Suspenso": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "text-green-600";
    if (score >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const filteredSuppliers = suppliers.filter((supplier: ManagedSupplierWithTypeCount) => {
    const displayName = getSupplierDisplayName(supplier);
    const matchesSearch = !searchTerm || 
      displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cpf?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s: ManagedSupplierWithTypeCount) => s.status === "Ativo").length;
  const qualifiedSuppliers = suppliers.filter((s: ManagedSupplierWithTypeCount) => (s.type_count || 0) > 0).length;
  const avgScore = 0; // Scores vêm do sistema novo de avaliações

  const handleSupplierView = (supplier: ManagedSupplierWithTypeCount) => {
    navigate(`/fornecedores/avaliacoes/${supplier.id}/desempenho`);
  };

  const handleSupplierEdit = (supplier: ManagedSupplierWithTypeCount) => {
    navigate(`/fornecedores/cadastro?id=${supplier.id}`);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["managed-suppliers"] });
  };

  const isSupplierIncomplete = (supplier: ManagedSupplierWithTypeCount) => {
    const hasDocument = supplier.person_type === 'PJ' ? supplier.cnpj : supplier.cpf;
    return !hasDocument || !supplier.email || (supplier.type_count || 0) === 0;
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

          <Button onClick={handleNewSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
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
            <CardTitle className="text-sm font-medium">Com Tipos Vinculados</CardTitle>
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
            <div className={`text-2xl font-bold ${avgScore > 0 ? getScoreColor(avgScore) : 'text-muted-foreground'}`}>
              {avgScore > 0 ? avgScore.toFixed(1) : "N/A"}
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipos Vinculados</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier: ManagedSupplierWithTypeCount) => {
                      const displayName = getSupplierDisplayName(supplier);
                      const document = getSupplierDocument(supplier);
                      
                      return (
                        <TableRow key={supplier.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{displayName}</span>
                                {isSupplierIncomplete(supplier) && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Incompleto
                                  </Badge>
                                )}
                              </div>
                              {document && (
                                <div className="text-sm text-muted-foreground">
                                  {supplier.person_type === 'PJ' ? 'CNPJ' : 'CPF'}: {document}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {supplier.person_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {supplier.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {supplier.email}
                                </div>
                              )}
                              {supplier.phone_1 && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {supplier.phone_1}
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
                            <Badge variant="secondary">
                              {supplier.type_count || 0} tipo(s)
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSupplierView(supplier)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSupplierEdit(supplier)}
                              >
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
                    <Button onClick={handleNewSupplier}>
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
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Para ver avaliações detalhadas, acesse a página de avaliações de fornecedores.
                </p>
                <Button 
                  variant="outline" 
                  asChild
                >
                  <Link to="/fornecedores/avaliacao">
                    <Star className="h-4 w-4 mr-2" />
                    Ver Avaliações
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <SupplierContractsTab />
        </TabsContent>
      </Tabs>

      {/* Evaluation Modal */}
      <SupplierEvaluationModal
        suppliers={suppliers}
        isOpen={isEvaluationOpen}
        onClose={() => setIsEvaluationOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
