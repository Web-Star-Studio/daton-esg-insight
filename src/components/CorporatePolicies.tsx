import { useState } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Edit, 
  Search, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Archive,
  Plus
} from "lucide-react";
import { getCorporatePolicies } from "@/services/governance";

interface CorporatePoliciesProps {
  onEditPolicy: (policy: any) => void;
  onCreatePolicy: () => void;
}

export function CorporatePolicies({ onEditPolicy, onCreatePolicy }: CorporatePoliciesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: policies = [], isLoading } = useOptimizedQuery({
    queryKey: ['corporate-policies'],
    queryFn: getCorporatePolicies,
  });

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || policy.status === filterStatus;
    const matchesCategory = filterCategory === "all" || policy.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rascunho': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Arquivado': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Em Revisão': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ativo': return <CheckCircle className="w-3 h-3" />;
      case 'Rascunho': return <Edit className="w-3 h-3" />;
      case 'Arquivado': return <Archive className="w-3 h-3" />;
      case 'Em Revisão': return <Clock className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const needsReview = (reviewDate: string) => {
    if (!reviewDate) return false;
    return new Date(reviewDate) < new Date();
  };

  const categories = [...new Set(policies.map(p => p.category))];

  const stats = {
    total: policies.length,
    active: policies.filter(p => p.status === 'Ativo').length,
    needingReview: policies.filter(p => needsReview(p.review_date)).length,
    draft: policies.filter(p => p.status === 'Rascunho').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total de Políticas</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Políticas Ativas</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Precisam Revisão</p>
                <p className="text-2xl font-bold">{stats.needingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Em Rascunho</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Políticas Corporativas
              </CardTitle>
              <CardDescription>
                Gerencie todas as políticas e normas da organização
              </CardDescription>
            </div>
            <Button onClick={onCreatePolicy}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Política
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar políticas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
                <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Policies List */}
      <div className="grid gap-4">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{policy.title}</h3>
                    <Badge className={getStatusColor(policy.status)}>
                      {getStatusIcon(policy.status)}
                      <span className="ml-1">{policy.status}</span>
                    </Badge>
                    {needsReview(policy.review_date) && (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Revisão Vencida
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{policy.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Versão {policy.version}
                    </span>
                  </div>
                  
                  {policy.description && (
                    <p className="text-sm text-muted-foreground">
                      {policy.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Vigência: {new Date(policy.effective_date).toLocaleDateString('pt-BR')}
                    </div>
                    
                    {policy.review_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Próxima revisão: {new Date(policy.review_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                    
                    {policy.approval_date && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Aprovada em: {new Date(policy.approval_date).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPolicy(policy)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredPolicies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma política encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Crie sua primeira política corporativa"
                }
              </p>
              {!searchTerm && filterStatus === "all" && filterCategory === "all" && (
                <Button onClick={onCreatePolicy}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Política
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}