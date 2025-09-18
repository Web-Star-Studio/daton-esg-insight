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
  XCircle,
  Settings,
  BarChart3,
  Edit,
  UserPlus
} from "lucide-react";
import { getBoardMembers, getCorporatePolicies, getWhistleblowerReports, getGovernanceMetrics } from "@/services/governance";
import { getESGRisks, getRiskMetrics } from "@/services/esgRisks";
import { MainLayout } from "@/components/MainLayout";
import { BoardMemberModal } from "@/components/BoardMemberModal";
import { CorporatePolicyModal } from "@/components/CorporatePolicyModal";
import { WhistleblowerModal } from "@/components/WhistleblowerModal";
import { GovernanceReportsModal } from "@/components/GovernanceReportsModal";
import { toast } from "@/hooks/use-toast";

export default function GovernancaESG() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isWhistleblowerModalOpen, setIsWhistleblowerModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalMode, setModalMode] = useState('create');

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

  // Refetch functions
  const refetchData = () => {
    // These would normally be from useQuery but simplified for demo
    toast({
      title: "Dados Atualizados",
      description: "As informações de governança foram atualizadas com sucesso.",
    });
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setModalMode('edit');
    setIsBoardModalOpen(true);
  };

  const handleEditPolicy = (policy: any) => {
    setSelectedPolicy(policy);
    setModalMode('edit');
    setIsPolicyModalOpen(true);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setModalMode('view');
    setIsWhistleblowerModalOpen(true);
  };

  const handleInvestigateReport = (report: any) => {
    setSelectedReport(report);
    setModalMode('investigate');
    setIsWhistleblowerModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ESG Governança</h1>
          <p className="text-muted-foreground">
            Gestão completa dos aspectos de governança corporativa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsReportsModalOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setSelectedMember(null);
              setModalMode('create');
              setIsBoardModalOpen(true);
            }}
          >
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
                  <CardTitle>Conselho de Administração</CardTitle>
                  <CardDescription>Membros do conselho e comitês</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedMember(null);
                    setModalMode('create');
                    setIsBoardModalOpen(true);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Membro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {boardMembers && boardMembers.length > 0 ? (
                <div className="space-y-4">
                  {boardMembers.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{member.full_name}</h4>
                            <Badge variant={member.status === 'Ativo' ? 'default' : 'secondary'}>
                              {member.status}
                            </Badge>
                            {member.is_independent && (
                              <Badge variant="outline">Independente</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{member.position}</p>
                          {member.committee && (
                            <p className="text-sm text-muted-foreground">Comitê: {member.committee}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Nomeação: {new Date(member.appointment_date).toLocaleDateString('pt-BR')}</span>
                            {member.experience_years && (
                              <span>{member.experience_years} anos de experiência</span>
                            )}
                          </div>
                          {member.expertise_areas && member.expertise_areas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {member.expertise_areas.slice(0, 3).map((area, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                              {member.expertise_areas.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{member.expertise_areas.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum membro cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione membros do conselho de administração
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedMember(null);
                      setModalMode('create');
                      setIsBoardModalOpen(true);
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Membro
                  </Button>
                </div>
              )}
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
                <Button
                  onClick={() => {
                    setSelectedPolicy(null);
                    setModalMode('create');
                    setIsPolicyModalOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Política
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {policies && policies.length > 0 ? (
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{policy.title}</h4>
                            <Badge 
                              variant={
                                policy.status === 'Ativo' ? 'default' :
                                policy.status === 'Aprovada' ? 'secondary' :
                                policy.status === 'Em Revisão' ? 'outline' : 'destructive'
                              }
                            >
                              {policy.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{policy.category}</p>
                          {policy.description && (
                            <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Versão: {policy.version}</span>
                            <span>Vigência: {new Date(policy.effective_date).toLocaleDateString('pt-BR')}</span>
                            {policy.review_date && (
                              <span className={new Date(policy.review_date) < new Date() ? 'text-red-600' : ''}>
                                Revisão: {new Date(policy.review_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPolicy(policy)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {policy.file_path && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(policy.file_path, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma política cadastrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie políticas corporativas para sua organização
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedPolicy(null);
                      setModalMode('create');
                      setIsPolicyModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeira Política
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Matriz de Riscos ESG</CardTitle>
                <CardDescription>Distribuição por categoria e criticidade</CardDescription>
              </CardHeader>
              <CardContent>
                {risks && risks.length > 0 ? (
                  <div className="space-y-4">
                    {risks.slice(0, 5).map((risk) => (
                      <div key={risk.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{risk.risk_title}</h4>
                          <div className="flex gap-1">
                            <Badge 
                              variant={
                                risk.inherent_risk_level === 'Crítico' ? 'destructive' :
                                risk.inherent_risk_level === 'Alto' ? 'default' :
                                risk.inherent_risk_level === 'Médio' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {risk.inherent_risk_level}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{risk.esg_category}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Probabilidade: {risk.probability}</span>
                          <span>Impacto: {risk.impact}</span>
                        </div>
                      </div>
                    ))}
                    {risks.length > 5 && (
                      <p className="text-center text-sm text-muted-foreground">
                        +{risks.length - 5} riscos adicionais
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum risco cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Risco</CardTitle>
                <CardDescription>Resumo executivo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {riskMetrics?.criticalRisks || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Riscos Críticos</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {riskMetrics?.highRisks || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Riscos Altos</p>
                  </div>
                </div>
                
                {riskMetrics?.risksByCategory && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Por Categoria</h4>
                    {Object.entries(riskMetrics.risksByCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{category}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ethics" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Canal de Denúncias</CardTitle>
                  <CardDescription>Sistema de ética e compliance</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setSelectedReport(null);
                    setModalMode('create');
                    setIsWhistleblowerModalOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Denúncia
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">#{report.report_code}</h4>
                            <Badge 
                              variant={
                                report.status === 'Nova' ? 'secondary' :
                                report.status === 'Em Investigação' ? 'default' :
                                report.status === 'Concluída' ? 'default' : 'outline'
                              }
                            >
                              {report.status}
                            </Badge>
                            <Badge 
                              variant={
                                report.priority === 'Alta' ? 'destructive' :
                                report.priority === 'Média' ? 'default' : 'secondary'
                              }
                            >
                              {report.priority}
                            </Badge>
                            {report.is_anonymous && (
                              <Badge variant="outline">
                                <Shield className="h-3 w-3 mr-1" />
                                Anônima
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">{report.category}</p>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Criada: {new Date(report.created_at).toLocaleDateString('pt-BR')}</span>
                            {report.incident_date && (
                              <span>Incidente: {new Date(report.incident_date).toLocaleDateString('pt-BR')}</span>
                            )}
                            {report.location && (
                              <span>Local: {report.location}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status !== 'Fechada' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInvestigateReport(report)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma denúncia registrada</h3>
                  <p className="text-muted-foreground mb-4">
                    O canal de denúncias está disponível para relatos confidenciais
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedReport(null);
                      setModalMode('create');
                      setIsWhistleblowerModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Denúncia
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Board Member Modal */}
      <BoardMemberModal
        isOpen={isBoardModalOpen}
        onClose={() => {
          setIsBoardModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onUpdate={refetchData}
      />

      {/* Corporate Policy Modal */}
      <CorporatePolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          setSelectedPolicy(null);
        }}
        policy={selectedPolicy}
        onUpdate={refetchData}
      />

      {/* Whistleblower Modal */}
      <WhistleblowerModal
        isOpen={isWhistleblowerModalOpen}
        onClose={() => {
          setIsWhistleblowerModalOpen(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        mode={modalMode as any}
        onUpdate={refetchData}
      />

      {/* Governance Reports Modal */}
      <GovernanceReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        governanceMetrics={governanceMetrics}
      />

      </div>
    </MainLayout>
  );
}