import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import { getBoardMembers, getCorporatePolicies, getWhistleblowerReports, getGovernanceMetrics } from "@/services/governance";
import { getESGRisks, getRiskMetrics } from "@/services/esgRisks";

export default function GovernancaESG() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: governanceMetrics } = useQuery({
    queryKey: ['governance-metrics'],
    queryFn: getGovernanceMetrics
  });

  const { data: riskMetrics } = useQuery({
    queryKey: ['risk-metrics'],
    queryFn: getRiskMetrics
  });

  const { data: boardMembers } = useQuery({
    queryKey: ['board-members'],
    queryFn: getBoardMembers
  });

  const { data: policies } = useQuery({
    queryKey: ['corporate-policies'],
    queryFn: getCorporatePolicies
  });

  const { data: reports } = useQuery({
    queryKey: ['whistleblower-reports'],
    queryFn: getWhistleblowerReports
  });

  const { data: risks } = useQuery({
    queryKey: ['esg-risks'],
    queryFn: getESGRisks
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ESG Governança</h1>
          <p className="text-muted-foreground">
            Gestão completa dos aspectos de governança corporativa
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="structure">Estrutura</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
          <TabsTrigger value="risks">Riscos ESG</TabsTrigger>
          <TabsTrigger value="ethics">Ética</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conselheiros</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{governanceMetrics?.board?.totalMembers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {governanceMetrics?.board?.independentMembers || 0} independentes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Políticas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{governanceMetrics?.policies?.totalPolicies || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {governanceMetrics?.policies?.activePolicies || 0} ativas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Riscos ESG</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{riskMetrics?.totalRisks || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {riskMetrics?.criticalRisks || 0} críticos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Canal Ético</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{governanceMetrics?.ethics?.totalReports || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {governanceMetrics?.ethics?.openReports || 0} em aberto
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Composição do Conselho</CardTitle>
                <CardDescription>Diversidade e independência</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Independência</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={governanceMetrics?.board?.independenceRate || 0} 
                      className="w-20" 
                    />
                    <span className="text-sm text-muted-foreground">
                      {governanceMetrics?.board?.independenceRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                
                {governanceMetrics?.board?.genderDiversity && Object.entries(governanceMetrics.board.genderDiversity).map(([gender, count]) => (
                  <div key={gender} className="flex items-center justify-between">
                    <span className="text-sm">{gender}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Políticas</CardTitle>
                <CardDescription>Conformidade e revisões</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Conformidade</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={governanceMetrics?.policies?.reviewComplianceRate || 0} 
                      className="w-20" 
                    />
                    <span className="text-sm text-muted-foreground">
                      {governanceMetrics?.policies?.reviewComplianceRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Políticas Ativas</span>
                  <Badge variant="secondary">
                    {governanceMetrics?.policies?.activePolicies || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Necessitam Revisão</span>
                  <Badge variant={governanceMetrics?.policies?.policiesNeedingReview ? "destructive" : "secondary"}>
                    {governanceMetrics?.policies?.policiesNeedingReview || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Riscos ESG</CardTitle>
                <CardDescription>Distribuição por categoria e nível</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskMetrics?.risksByCategory && Object.entries(riskMetrics.risksByCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Riscos Críticos</span>
                    <span className="font-medium text-destructive">{riskMetrics?.criticalRisks || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Riscos Altos</span>
                    <span className="font-medium text-orange-600">{riskMetrics?.highRisks || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canal de Denúncias</CardTitle>
                <CardDescription>Performance do sistema de ética</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Taxa de Resolução</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={governanceMetrics?.ethics?.resolutionRate || 0} 
                      className="w-20" 
                    />
                    <span className="text-sm text-muted-foreground">
                      {governanceMetrics?.ethics?.resolutionRate?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Relatórios Ano Atual</span>
                  <Badge variant="secondary">
                    {governanceMetrics?.ethics?.currentYearReports || 0}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Em Aberto</span>
                  <Badge variant={governanceMetrics?.ethics?.openReports ? "destructive" : "secondary"}>
                    {governanceMetrics?.ethics?.openReports || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Estrutura Corporativa</CardTitle>
                  <CardDescription>Conselho de administração e comitês</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Estrutura Corporativa</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão da estrutura de governança
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá conselho de administração, comitês, matriz de competências e avaliações
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Políticas Corporativas</CardTitle>
                  <CardDescription>Gestão de políticas e procedimentos</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Política
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Políticas</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão de políticas corporativas
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá criação, aprovação, versionamento e monitoramento de políticas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Gestão de Riscos ESG</CardTitle>
                  <CardDescription>Identificação e mitigação de riscos</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Risco
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Riscos ESG</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para gestão de riscos ESG
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá matriz de riscos, planos de mitigação, controles e monitoramento
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ethics" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Canal de Denúncias</CardTitle>
                  <CardDescription>Sistema de ética e compliance</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Denúncia
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Módulo de Ética</h3>
                <p className="text-muted-foreground mb-4">
                  Funcionalidade em desenvolvimento para canal de denúncias
                </p>
                <p className="text-sm text-muted-foreground">
                  Incluirá recebimento, triagem, investigação e resolução de denúncias
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}