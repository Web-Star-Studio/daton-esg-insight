import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  FileText,
  Target,
  Calendar,
  Users,
  Zap
} from "lucide-react";

interface ComplianceRequirement {
  id: string;
  title: string;
  framework: string;
  category: 'environmental' | 'social' | 'governance' | 'reporting';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'compliant' | 'partial' | 'non_compliant' | 'in_progress';
  progress: number;
  dueDate?: string;
  responsible?: string;
  description: string;
  actions: string[];
  evidence: string[];
  gaps: string[];
}

interface NormsComplianceTrackerProps {
  selectedFrameworks?: string[];
}

export function NormsComplianceTracker({ selectedFrameworks = [] }: NormsComplianceTrackerProps) {
  
  const complianceRequirements: ComplianceRequirement[] = [
    // GHG Protocol
    {
      id: 'ghg-1',
      title: 'Inventário de GEE Escopo 1',
      framework: 'GHG Protocol',
      category: 'environmental',
      priority: 'critical',
      status: 'compliant',
      progress: 100,
      responsible: 'Equipe Ambiental',
      description: 'Inventário completo de emissões diretas de GEE',
      actions: ['Coleta de dados mensais', 'Cálculo de emissões', 'Relatório anual'],
      evidence: ['Inventário 2023', 'Fatores de emissão atualizados'],
      gaps: []
    },
    {
      id: 'ghg-2',
      title: 'Inventário de GEE Escopo 2',
      framework: 'GHG Protocol',
      category: 'environmental',
      priority: 'critical',
      status: 'compliant',
      progress: 95,
      responsible: 'Equipe Ambiental',
      description: 'Inventário de emissões indiretas de energia',
      actions: ['Coleta de faturas energia', 'Cálculo emissões'],
      evidence: ['Faturas consolidadas', 'Relatório Escopo 2'],
      gaps: ['Verificação externa pendente']
    },
    {
      id: 'ghg-3',
      title: 'Inventário de GEE Escopo 3',
      framework: 'GHG Protocol',
      category: 'environmental',
      priority: 'high',
      status: 'partial',
      progress: 60,
      dueDate: '2024-06-30',
      responsible: 'Equipe Sustentabilidade',
      description: 'Inventário de outras emissões indiretas',
      actions: ['Mapeamento cadeia valor', 'Coleta dados fornecedores'],
      evidence: ['15 categorias mapeadas'],
      gaps: ['Dados de viagens', 'Logística upstream', 'Uso dos produtos']
    },

    // ISO 14001
    {
      id: 'iso14001-1',
      title: 'Política Ambiental',
      framework: 'ISO 14001',
      category: 'environmental',
      priority: 'critical',
      status: 'compliant',
      progress: 100,
      responsible: 'Diretoria',
      description: 'Política ambiental aprovada e comunicada',
      actions: ['Aprovação diretoria', 'Comunicação interna'],
      evidence: ['Política publicada', 'Treinamentos realizados'],
      gaps: []
    },
    {
      id: 'iso14001-2',
      title: 'Aspectos e Impactos Ambientais',
      framework: 'ISO 14001',
      category: 'environmental',
      priority: 'high',
      status: 'partial',
      progress: 70,
      dueDate: '2024-05-15',
      responsible: 'Coordenador Ambiental',
      description: 'Identificação e avaliação de aspectos ambientais',
      actions: ['Matriz aspectos/impactos', 'Avaliação significância'],
      evidence: ['Matriz preliminar'],
      gaps: ['Validação processos terceirizados', 'Ciclo de vida produtos']
    },

    // ISO 45001
    {
      id: 'iso45001-1',
      title: 'Política de SSO',
      framework: 'ISO 45001',
      category: 'social',
      priority: 'critical',
      status: 'in_progress',
      progress: 80,
      dueDate: '2024-04-30',
      responsible: 'SESMT',
      description: 'Política de Saúde e Segurança Ocupacional',
      actions: ['Desenvolvimento política', 'Consulta trabalhadores'],
      evidence: ['Minuta política'],
      gaps: ['Aprovação alta direção', 'Comunicação formal']
    },
    {
      id: 'iso45001-2',
      title: 'Identificação de Perigos',
      framework: 'ISO 45001',
      category: 'social',
      priority: 'high',
      status: 'partial',
      progress: 45,
      responsible: 'Equipe SSO',
      description: 'Identificação sistemática de perigos e riscos',
      actions: ['Inspeções de campo', 'APR por processo'],
      evidence: ['10 APRs elaboradas'],
      gaps: ['Perigos psicossociais', 'Análise ergonômica', 'Riscos terceirizados']
    },

    // ISO 31000
    {
      id: 'iso31000-1',
      title: 'Framework de Gestão de Riscos',
      framework: 'ISO 31000',
      category: 'governance',
      priority: 'high',
      status: 'compliant',
      progress: 90,
      responsible: 'Comitê de Riscos',
      description: 'Estrutura organizacional para gestão de riscos',
      actions: ['Política de riscos', 'Comitê estruturado'],
      evidence: ['Matriz de riscos ESG', 'Atas de reuniões'],
      gaps: ['Integração riscos operacionais']
    },

    // GRI
    {
      id: 'gri-1',
      title: 'Indicadores GRI Universais',
      framework: 'GRI',
      category: 'reporting',
      priority: 'high',
      status: 'compliant',
      progress: 85,
      responsible: 'Equipe Sustentabilidade',
      description: 'Coleta e relato de indicadores universais GRI',
      actions: ['Coleta dados', 'Validação indicadores'],
      evidence: ['Sistema GRI implementado'],
      gaps: ['Verificação externa', 'Indicadores setoriais']
    },

    // SASB
    {
      id: 'sasb-1',
      title: 'Métricas SASB Setoriais',
      framework: 'SASB',
      category: 'reporting',
      priority: 'medium',
      status: 'in_progress',
      progress: 40,
      dueDate: '2024-12-31',
      responsible: 'RI e Sustentabilidade',
      description: 'Implementação de métricas SASB específicas do setor',
      actions: ['Mapeamento métricas aplicáveis', 'Coleta dados baseline'],
      evidence: ['Métricas identificadas'],
      gaps: ['Sistemas de coleta', 'Processo de verificação', 'Relato padronizado']
    },

    // TCFD
    {
      id: 'tcfd-1',
      title: 'Análise de Cenários Climáticos',
      framework: 'TCFD',
      category: 'reporting',
      priority: 'high',
      status: 'non_compliant',
      progress: 0,
      dueDate: '2024-11-30',
      responsible: 'Equipe Estratégica',
      description: 'Análise de cenários climáticos e impactos financeiros',
      actions: [],
      evidence: [],
      gaps: ['Metodologia de cenários', 'Análise financeira', 'Integração estratégica']
    }
  ];

  const getStatusIcon = (status: ComplianceRequirement['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'non_compliant':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ComplianceRequirement['status']) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
    }
  };

  const getPriorityColor = (priority: ComplianceRequirement['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
    }
  };

  const filteredRequirements = selectedFrameworks.length > 0 
    ? complianceRequirements.filter(req => 
        selectedFrameworks.some(fw => req.framework.toLowerCase().includes(fw.toLowerCase()))
      )
    : complianceRequirements;

  const getOverallProgress = () => {
    if (filteredRequirements.length === 0) return 0;
    return Math.round(
      filteredRequirements.reduce((sum, req) => sum + req.progress, 0) / filteredRequirements.length
    );
  };

  const getComplianceStats = () => {
    const total = filteredRequirements.length;
    const compliant = filteredRequirements.filter(req => req.status === 'compliant').length;
    const partial = filteredRequirements.filter(req => req.status === 'partial').length;
    const inProgress = filteredRequirements.filter(req => req.status === 'in_progress').length;
    const nonCompliant = filteredRequirements.filter(req => req.status === 'non_compliant').length;
    
    return { total, compliant, partial, inProgress, nonCompliant };
  };

  const stats = getComplianceStats();
  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conforme</p>
                <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parcial</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Não Conforme</p>
                <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rastreamento de Conformidade por Norma
          </CardTitle>
          <CardDescription>
            Status detalhado dos requisitos de conformidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="critical">Críticos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="overdue">Em Atraso</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredRequirements.map((requirement) => (
                <Card key={requirement.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{requirement.title}</h4>
                            {getStatusIcon(requirement.status)}
                            <Badge className={getStatusColor(requirement.status)}>
                              {requirement.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(requirement.priority)}>
                              {requirement.priority}
                            </Badge>
                            <Badge variant="outline">
                              {requirement.framework}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {requirement.description}
                          </p>

                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Progresso: {requirement.progress}%</span>
                              <Progress value={requirement.progress} className="w-20" />
                            </div>
                            
                            {requirement.responsible && (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{requirement.responsible}</span>
                              </div>
                            )}
                            
                            {requirement.dueDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {new Date(requirement.dueDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {requirement.actions.length > 0 && (
                              <div>
                                <span className="font-medium text-muted-foreground">Ações:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {requirement.actions.map((action, idx) => (
                                    <li key={idx} className="text-muted-foreground">{action}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {requirement.evidence.length > 0 && (
                              <div>
                                <span className="font-medium text-muted-foreground">Evidências:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {requirement.evidence.map((evidence, idx) => (
                                    <li key={idx} className="text-muted-foreground">{evidence}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {requirement.gaps.length > 0 && (
                              <div>
                                <span className="font-medium text-muted-foreground">Lacunas:</span>
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                  {requirement.gaps.map((gap, idx) => (
                                    <li key={idx} className="text-red-600">{gap}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="mr-1 h-3 w-3" />
                            Detalhes
                          </Button>
                          <Button variant="outline" size="sm">
                            <Target className="mr-1 h-3 w-3" />
                            Ações
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="critical">
              <div className="text-center py-8 text-muted-foreground">
                Filtros específicos serão implementados
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <div className="text-center py-8 text-muted-foreground">
                Filtros específicos serão implementados
              </div>
            </TabsContent>

            <TabsContent value="overdue">
              <div className="text-center py-8 text-muted-foreground">
                Filtros específicos serão implementados
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}