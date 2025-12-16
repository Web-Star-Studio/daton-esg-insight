import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Users2, FileText, Tag, Link2, Building2, User, 
  Plus, ArrowRight, TrendingUp, AlertCircle 
} from "lucide-react";
import { getSupplierStats } from "@/services/supplierManagementService";
import { LoadingState } from "@/components/ui/loading-state";

export default function SupplierManagementDashboard() {
  const navigate = useNavigate();
  
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['supplier-management-stats'],
    queryFn: getSupplierStats
  });

  const quickActions = [
    { label: "Novo Fornecedor", icon: Plus, path: "/fornecedores/cadastro", color: "bg-primary" },
    { label: "Documentação", icon: FileText, path: "/fornecedores/documentacao", color: "bg-blue-500" },
    { label: "Tipos", icon: Tag, path: "/fornecedores/tipos", color: "bg-purple-500" },
    { label: "Conexões", icon: Link2, path: "/fornecedores/conexoes", color: "bg-orange-500" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Fornecedores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie fornecedores, documentação obrigatória e conexões
            </p>
          </div>
          <Button onClick={() => navigate('/fornecedores/cadastro')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        <LoadingState 
          loading={isLoading} 
          error={error?.message}
          retry={refetch}
        >
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fornecedores/cadastro')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Fornecedores
                </CardTitle>
                <Users2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {stats?.pjCount || 0} PJ
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {stats?.pfCount || 0} PF
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fornecedores/cadastro')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fornecedores Ativos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.activeSuppliers || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats?.totalSuppliers ? Math.round((stats.activeSuppliers / stats.totalSuppliers) * 100) : 0}% do total
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fornecedores/documentacao')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Documentos Obrigatórios
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Documentos cadastrados
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/fornecedores/conexoes')}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conexões Ativas
                </CardTitle>
                <Link2 className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalConnections || 0}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Logística reversa e outros
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.path}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50"
                    onClick={() => navigate(action.path)}
                  >
                    <div className={`p-2 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Tipos de Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stats?.totalTypes || 0}</p>
                    <p className="text-sm text-muted-foreground">Tipos cadastrados</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/fornecedores/tipos')}>
                    Gerenciar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Documentação Pendente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-amber-500">-</p>
                    <p className="text-sm text-muted-foreground">Aguardando análise</p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/fornecedores/avaliacoes')}>
                    Ver Avaliações
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </LoadingState>
      </div>
    </MainLayout>
  );
}
