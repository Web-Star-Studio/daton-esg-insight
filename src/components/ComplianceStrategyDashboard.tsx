import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Globe, 
  Building2, 
  Leaf, 
  Users, 
  Scale,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  Zap,
  Target,
  Award,
  FileText,
  BarChart3
} from 'lucide-react';

interface FrameworkStatus {
  id: string;
  name: string;
  category: 'reporting' | 'management' | 'security' | 'avantgarde';
  phase: 1 | 2 | 3;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'planning' | 'implementing' | 'operational' | 'maintaining';
  compliance_score: number;
  timeline: {
    start_date: string;
    target_date: string;
    current_milestone: string;
  };
  resources_required: string[];
  dependencies: string[];
  risks: string[];
  benefits: string[];
}

const ComplianceStrategyDashboard: React.FC = () => {
  const [activePhase, setActivePhase] = useState<number>(1);
  
  // Mock data baseado no plano estratégico
  const frameworks: FrameworkStatus[] = [
    // FASE 1 - FUNDAÇÕES (0-6 meses)
    {
      id: 'iso27001',
      name: 'ISO 27001 - Segurança da Informação',
      category: 'security',
      phase: 1,
      priority: 'critical',
      status: 'implementing',
      compliance_score: 65,
      timeline: {
        start_date: '2024-01-01',
        target_date: '2024-06-30',
        current_milestone: 'Implementação de controles de segurança'
      },
      resources_required: ['Security Officer', 'IT Team', 'External Auditor'],
      dependencies: ['Infrastructure upgrade', 'Staff training'],
      risks: ['Complexity of implementation', 'Resource constraints'],
      benefits: ['Enhanced data security', 'Customer trust', 'Regulatory compliance']
    },
    {
      id: 'ifrs_s1_s2',
      name: 'IFRS S1 & S2 - Sustentabilidade',
      category: 'reporting',
      phase: 1,
      priority: 'critical',
      status: 'planning',
      compliance_score: 25,
      timeline: {
        start_date: '2024-02-01',
        target_date: '2024-07-31',
        current_milestone: 'Mapeamento de requisitos'
      },
      resources_required: ['ESG Specialist', 'Finance Team', 'Data Analysts'],
      dependencies: ['Data collection systems', 'Governance structure'],
      risks: ['Changing standards', 'Data availability'],
      benefits: ['Global compliance', 'Investor confidence', 'Market access']
    },
    {
      id: 'soc2',
      name: 'SOC 2 Type II - Controles Organizacionais',
      category: 'security',
      phase: 1,
      priority: 'critical',
      status: 'planning',
      compliance_score: 35,
      timeline: {
        start_date: '2024-03-01',
        target_date: '2024-08-31',
        current_milestone: 'Gap analysis'
      },
      resources_required: ['Compliance Manager', 'Operations Team', 'External Auditor'],
      dependencies: ['Process documentation', 'Control implementation'],
      risks: ['Audit findings', 'Process gaps'],
      benefits: ['Customer assurance', 'Competitive advantage', 'Risk mitigation']
    },
    // FASE 2 - EXPANSÃO REGULATÓRIA (6-12 meses)
    {
      id: 'csrd_esrs',
      name: 'CSRD/ESRS - Regulamentação Europeia',
      category: 'reporting',
      phase: 2,
      priority: 'high',
      status: 'not_started',
      compliance_score: 10,
      timeline: {
        start_date: '2024-07-01',
        target_date: '2025-02-28',
        current_milestone: 'Não iniciado'
      },
      resources_required: ['CSRD Specialist', 'Legal Team', 'Data Team'],
      dependencies: ['IFRS S1/S2 completion', 'EU operations'],
      risks: ['Complex requirements', 'Resource intensive'],
      benefits: ['EU market access', 'Regulatory compliance', 'Stakeholder trust']
    },
    {
      id: 'iso14001',
      name: 'ISO 14001 - Gestão Ambiental',
      category: 'management',
      phase: 2,
      priority: 'high',
      status: 'not_started',
      compliance_score: 20,
      timeline: {
        start_date: '2024-08-01',
        target_date: '2025-01-31',
        current_milestone: 'Não iniciado'
      },
      resources_required: ['Environmental Manager', 'Operations Team', 'External Consultant'],
      dependencies: ['Environmental policy', 'Monitoring systems'],
      risks: ['Operational changes required', 'Cost implications'],
      benefits: ['Environmental performance', 'Cost savings', 'Brand reputation']
    },
    // FASE 3 - VANGUARDA E INOVAÇÃO (12-18 meses)
    {
      id: 'sbti',
      name: 'SBTi - Metas Baseadas na Ciência',
      category: 'avantgarde',
      phase: 3,
      priority: 'medium',
      status: 'not_started',
      compliance_score: 5,
      timeline: {
        start_date: '2025-01-01',
        target_date: '2025-06-30',
        current_milestone: 'Não iniciado'
      },
      resources_required: ['Climate Scientist', 'Strategy Team', 'Operations'],
      dependencies: ['GHG inventory', 'Decarbonization plan'],
      risks: ['Ambitious targets', 'Technology availability'],
      benefits: ['Climate leadership', 'Innovation driver', 'Future-proofing']
    },
    {
      id: 'tnfd',
      name: 'TNFD - Riscos Relacionados à Natureza',
      category: 'avantgarde',
      phase: 3,
      priority: 'medium',
      status: 'not_started',
      compliance_score: 0,
      timeline: {
        start_date: '2025-03-01',
        target_date: '2025-09-30',
        current_milestone: 'Não iniciado'
      },
      resources_required: ['Biodiversity Expert', 'Risk Team', 'Data Scientists'],
      dependencies: ['Location analysis', 'Nature assessment'],
      risks: ['Emerging framework', 'Data complexity'],
      benefits: ['Nature leadership', 'Risk management', 'Innovation']
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reporting': return Globe;
      case 'management': return Building2;
      case 'security': return Shield;
      case 'avantgarde': return Star;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reporting': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'management': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'security': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'avantgarde': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'implementing': return TrendingUp;
      case 'planning': return Clock;
      case 'not_started': return AlertTriangle;
      default: return Clock;
    }
  };

  const phaseFrameworks = frameworks.filter(f => f.phase === activePhase);
  const phaseStats = {
    total: phaseFrameworks.length,
    critical: phaseFrameworks.filter(f => f.priority === 'critical').length,
    high: phaseFrameworks.filter(f => f.priority === 'high').length,
    implementing: phaseFrameworks.filter(f => f.status === 'implementing').length,
    avgScore: Math.round(phaseFrameworks.reduce((sum, f) => sum + f.compliance_score, 0) / phaseFrameworks.length)
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Plano Estratégico de Adequação</h1>
            <p className="text-muted-foreground mt-2">
              Implementação completa das normas e protocolos por camadas de atuação
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Exportar Plano
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard Executivo
            </Button>
          </div>
        </div>

        {/* Phase Selection Tabs */}
        <Tabs value={activePhase.toString()} onValueChange={(value) => setActivePhase(parseInt(value))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Fase 1: Fundações (0-6m)
            </TabsTrigger>
            <TabsTrigger value="2" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Fase 2: Expansão (6-12m)
            </TabsTrigger>
            <TabsTrigger value="3" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Fase 3: Vanguarda (12-18m)
            </TabsTrigger>
          </TabsList>

          {/* Phase Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Frameworks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{phaseStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {phaseStats.critical} críticos, {phaseStats.high} alta prioridade
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Em Implementação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{phaseStats.implementing}</div>
                <p className="text-xs text-muted-foreground">
                  de {phaseStats.total} frameworks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conformidade Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{phaseStats.avgScore}%</div>
                <Progress value={phaseStats.avgScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status da Fase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {activePhase === 1 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      <span className="text-sm font-medium">Em Progresso</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">Planejado</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phase Content */}
          <TabsContent value="1" className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Fase 1 - Fundações (0-6 meses):</strong> Prioridade CRÍTICA para estabelecer 
                segurança e conformidade com padrões globais emergentes.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="2" className="space-y-6">
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>Fase 2 - Expansão Regulatória (6-12 meses):</strong> Expansão para mercados 
                regionais e completar normas de gestão interna.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="3" className="space-y-6">
            <Alert>
              <Star className="h-4 w-4" />
              <AlertDescription>
                <strong>Fase 3 - Vanguarda e Inovação (12-18 meses):</strong> Posicionar a Daton 
                como líder em sustentabilidade e inovação.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Frameworks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {phaseFrameworks.map((framework) => {
            const CategoryIcon = getCategoryIcon(framework.category);
            const StatusIcon = getStatusIcon(framework.status);
            
            return (
              <Card key={framework.id} className="h-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(framework.category)}`}>
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{framework.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityColor(framework.priority)}>
                            {framework.priority}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {framework.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{framework.compliance_score}%</div>
                      <div className="text-xs text-muted-foreground">conformidade</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Progress value={framework.compliance_score} className="h-2" />
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Timeline</h4>
                      <p className="text-xs text-muted-foreground">
                        {framework.timeline.start_date} → {framework.timeline.target_date}
                      </p>
                      <p className="text-xs">{framework.timeline.current_milestone}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Recursos Necessários</h4>
                      <div className="flex flex-wrap gap-1">
                        {framework.resources_required.map((resource, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {resource}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Principais Benefícios</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {framework.benefits.slice(0, 2).map((benefit, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {framework.risks.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Principais Riscos</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {framework.risks.slice(0, 2).map((risk, index) => (
                            <li key={index} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Target className="h-3 w-3 mr-1" />
                      Detalhes
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Zap className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Strategic Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Métricas Estratégicas do Plano
            </CardTitle>
            <CardDescription>
              Objetivos e resultados esperados por fase de implementação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fase 1 - Fundações</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Certificações de segurança obtidas</li>
                  <li>• Conformidade IFRS/TCFD/SASB completa</li>
                  <li>• Base confiável e segura estabelecida</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fase 2 - Expansão</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Conformidade com 3+ regiões</li>
                  <li>• 80% das normas ISO implementadas</li>
                  <li>• Gestão interna completamente integrada</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Fase 3 - Vanguarda</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Primeiro sistema com TNFD completo</li>
                  <li>• SBTi integrado e operacional</li>
                  <li>• Liderança em economia circular</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComplianceStrategyDashboard;