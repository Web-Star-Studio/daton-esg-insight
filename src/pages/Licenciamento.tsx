import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Award, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Pencil,
  Paperclip,
  Brain,
  RefreshCw,
  BarChart3,
  Bell
} from "lucide-react";
import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getLicenses, getLicenseStats, type LicenseListItem, type LicenseStats } from "@/services/licenses"
import { ComplianceDashboard } from "@/components/ComplianceDashboard";
import { IntelligentAlertsSystem } from "@/components/IntelligentAlertsSystem";
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"


const Licenciamento = () => {
  const navigate = useNavigate()

  // Fetch licenses data
  const { data: licenses, isLoading: licensesLoading, error: licensesError } = useQuery({
    queryKey: ['licenses'],
    queryFn: () => getLicenses(),
  })

  // Fetch license statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['license-stats'],
    queryFn: () => getLicenseStats(),
  })

  const handleAddLicenca = () => {
    navigate("/licenciamento/novo")
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return dateString
    }
  }

  const isLoading = licensesLoading || statsLoading
  const getStatusBadge = (status: string) => {
    const statusMap = {
      "Ativa": { variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
      "Vencida": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "Em Renovação": { variant: "secondary" as const, className: "bg-accent/10 text-accent border-accent/20" },
      "Suspensa": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" }
    }

    const config = statusMap[status as keyof typeof statusMap] || statusMap["Ativa"]
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  if (licensesError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Erro ao carregar licenças</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Licenciamento Ambiental</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as licenças ambientais da empresa
            </p>
          </div>
          <Button className="sm:ml-auto" onClick={handleAddLicenca}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Licença
          </Button>
        </div>

        {/* Cards de Resumo (KPIs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Licenças</CardTitle>
              <Award className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.total || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.active || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas do Vencimento (90d)</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.upcoming || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <XCircle className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{stats?.expired || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Licenças */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Licenças Ambientais</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Licença</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Órgão Emissor</TableHead>
                  <TableHead>Nº do Processo</TableHead>
                  <TableHead>Data de Emissão</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IA</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton rows
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : licenses && licenses.length > 0 ? (
                  licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.name}</TableCell>
                      <TableCell>{license.type}</TableCell>
                      <TableCell>{license.issuing_body}</TableCell>
                      <TableCell className="font-mono text-sm">{license.process_number || '-'}</TableCell>
                      <TableCell>{license.issue_date ? formatDate(license.issue_date) : '-'}</TableCell>
                      <TableCell>{formatDate(license.expiration_date)}</TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell>
                        {license.ai_processing_status === 'completed' ? (
                          <Badge variant="default" className="gap-1">
                            <Brain className="h-3 w-3" />
                            {license.compliance_score}%
                          </Badge>
                        ) : license.ai_processing_status === 'processing' ? (
                          <Badge variant="secondary" className="gap-1">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Processando
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Não analisada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Análise IA"
                            onClick={() => navigate(`/licenciamento/${license.id}/analise`)}
                          >
                            <Brain className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Ver Detalhes"
                            onClick={() => navigate(`/licenciamento/${license.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Editar"
                            onClick={() => navigate(`/licenciamento/${license.id}/editar`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-accent"
                            title="Anexar Arquivo"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <p>Nenhuma licença encontrada</p>
                        <Button onClick={handleAddLicenca} className="mt-4">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar primeira licença
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

export default Licenciamento