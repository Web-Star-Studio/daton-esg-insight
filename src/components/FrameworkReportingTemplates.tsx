import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Plus,
  Settings,
  TrendingUp
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  framework: string;
  category: 'environmental' | 'social' | 'governance' | 'integrated';
  description: string;
  version: string;
  compliance: number;
  status: 'ready' | 'in_development' | 'needs_data' | 'draft';
  lastUpdated: string;
  indicators: number;
  completedIndicators: number;
  sectors: string[];
  features: string[];
  requirements: string[];
  deliverables: string[];
}

interface FrameworkReportingTemplatesProps {
  selectedFrameworks?: string[];
}

export function FrameworkReportingTemplates({ selectedFrameworks = [] }: FrameworkReportingTemplatesProps) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const reportTemplates: ReportTemplate[] = [
    // GRI Templates
    {
      id: 'gri-universal',
      name: 'GRI Universal Standards',
      framework: 'GRI',
      category: 'integrated',
      description: 'Template completo baseado nos padrões GRI universais com indicadores obrigatórios',
      version: '2023',
      compliance: 85,
      status: 'ready',
      lastUpdated: '2024-01-15',
      indicators: 56,
      completedIndicators: 48,
      sectors: ['Todos os setores'],
      features: [
        'Indicadores universais GRI 2021',
        'Matriz de materialidade integrada',
        'Validação automática de dados',
        'Exportação em múltiplos formatos'
      ],
      requirements: [
        'Dados de governança organizacional',
        'Indicadores de desempenho econômico',
        'Métricas ambientais e sociais',
        'Análise de materialidade'
      ],
      deliverables: [
        'Relatório GRI Standards completo',
        'Índice de conteúdo GRI',
        'Declaração de uso dos padrões GRI',
        'Dados para verificação externa'
      ]
    },
    {
      id: 'gri-sectorial',
      name: 'GRI Sectorial Standards',
      framework: 'GRI',
      category: 'integrated',
      description: 'Templates específicos por setor com indicadores setoriais relevantes',
      version: '2023',
      compliance: 60,
      status: 'in_development',
      lastUpdated: '2024-01-10',
      indicators: 78,
      completedIndicators: 47,
      sectors: ['Mineração', 'Petróleo & Gás', 'Agricultura'],
      features: [
        'Indicadores setoriais específicos',
        'Benchmarking setorial',
        'Métricas de impacto especializadas'
      ],
      requirements: [
        'Dados operacionais específicos',
        'Métricas de impacto setorial',
        'Benchmarks da indústria'
      ],
      deliverables: [
        'Relatório setorial GRI',
        'Análise de benchmarking',
        'Métricas de desempenho comparativo'
      ]
    },

    // SASB Templates
    {
      id: 'sasb-materiality',
      name: 'SASB Materiality Map',
      framework: 'SASB',
      category: 'integrated',
      description: 'Template focado em materialidade financeira com métricas SASB por indústria',
      version: '2023',
      compliance: 40,
      status: 'needs_data',
      lastUpdated: '2024-01-05',
      indicators: 45,
      completedIndicators: 18,
      sectors: ['Tecnologia', 'Financeiro', 'Saúde', 'Energia'],
      features: [
        'Mapa de materialidade SASB',
        'Métricas financeiramente relevantes',
        'Análise setorial de riscos',
        'Integração com relatórios financeiros'
      ],
      requirements: [
        'Métricas SASB setoriais',
        'Dados financeiros integrados',
        'Análise de materialidade financeira'
      ],
      deliverables: [
        'Relatório SASB completo',
        'Mapa de materialidade',
        'Métricas de desempenho financeiro ESG'
      ]
    },

    // TCFD Templates
    {
      id: 'tcfd-climate',
      name: 'TCFD Climate Disclosures',
      framework: 'TCFD',
      category: 'environmental',
      description: 'Template para divulgações relacionadas ao clima seguindo recomendações TCFD',
      version: '2023',
      compliance: 20,
      status: 'draft',
      lastUpdated: '2024-01-01',
      indicators: 32,
      completedIndicators: 6,
      sectors: ['Todos os setores'],
      features: [
        'Análise de cenários climáticos',
        'Avaliação de riscos climáticos',
        'Métricas de transição',
        'Planejamento estratégico climático'
      ],
      requirements: [
        'Análise de cenários climáticos',
        'Identificação de riscos físicos e de transição',
        'Métricas climáticas quantitativas',
        'Estratégia de adaptação e mitigação'
      ],
      deliverables: [
        'Relatório TCFD completo',
        'Análise de cenários',
        'Plano de ação climática',
        'Dashboard de métricas climáticas'
      ]
    },

    // ISO 14001
    {
      id: 'iso14001-sga',
      name: 'ISO 14001 Environmental Management',
      framework: 'ISO 14001',
      category: 'environmental',
      description: 'Template para Sistema de Gestão Ambiental conforme ISO 14001',
      version: '2015',
      compliance: 70,
      status: 'ready',
      lastUpdated: '2024-01-12',
      indicators: 25,
      completedIndicators: 18,
      sectors: ['Industrial', 'Manufatura', 'Serviços'],
      features: [
        'Política ambiental estruturada',
        'Aspectos e impactos ambientais',
        'Objetivos e metas ambientais',
        'Programa de gestão ambiental'
      ],
      requirements: [
        'Política ambiental aprovada',
        'Identificação de aspectos ambientais',
        'Objetivos e metas quantificados',
        'Plano de monitoramento'
      ],
      deliverables: [
        'Manual do SGA',
        'Política ambiental',
        'Relatório de aspectos e impactos',
        'Plano de objetivos e metas'
      ]
    },

    // ISO 45001
    {
      id: 'iso45001-sso',
      name: 'ISO 45001 Occupational Health & Safety',
      framework: 'ISO 45001',
      category: 'social',
      description: 'Template para Sistema de Gestão de Saúde e Segurança Ocupacional',
      version: '2018',
      compliance: 45,
      status: 'in_development',
      lastUpdated: '2024-01-08',
      indicators: 35,
      completedIndicators: 16,
      sectors: ['Industrial', 'Construção', 'Mineração'],
      features: [
        'Política de SSO',
        'Identificação de perigos',
        'Avaliação de riscos ocupacionais',
        'Plano de emergência'
      ],
      requirements: [
        'Política de SSO definida',
        'Identificação sistemática de perigos',
        'Avaliação de riscos',
        'Programa de treinamentos'
      ],
      deliverables: [
        'Manual de SSO',
        'Política de segurança',
        'Matriz de riscos ocupacionais',
        'Plano de treinamentos'
      ]
    },

    // Integrated Reporting
    {
      id: 'integrated-report',
      name: 'Integrated Reporting Framework',
      framework: 'IIRC',
      category: 'integrated',
      description: 'Template para Relatório Integrado seguindo framework do IIRC',
      version: '2021',
      compliance: 55,
      status: 'ready',
      lastUpdated: '2024-01-14',
      indicators: 42,
      completedIndicators: 23,
      sectors: ['Corporativo', 'Listadas em bolsa'],
      features: [
        'Modelo de negócio integrado',
        'Capitais múltiplos',
        'Criação de valor',
        'Pensamento integrado'
      ],
      requirements: [
        'Modelo de negócio definido',
        'Estratégia clara',
        'Governança efetiva',
        'Riscos e oportunidades mapeados'
      ],
      deliverables: [
        'Relatório Integrado',
        'Modelo de negócio visual',
        'Mapa de criação de valor',
        'Dashboard executivo'
      ]
    },

    // ODS/SDGs
    {
      id: 'sdgs-impact',
      name: 'SDGs Impact Assessment',
      framework: 'UN SDGs',
      category: 'integrated',
      description: 'Template para avaliação e reporte de contribuição aos ODS',
      version: '2023',
      compliance: 65,
      status: 'ready',
      lastUpdated: '2024-01-13',
      indicators: 169,
      completedIndicators: 110,
      sectors: ['Todos os setores'],
      features: [
        'Mapeamento aos 17 ODS',
        'Métricas de impacto',
        'Análise de contribuição',
        'Storytelling de impacto'
      ],
      requirements: [
        'Mapeamento de atividades aos ODS',
        'Definição de metas específicas',
        'Indicadores de progresso',
        'Análise de impacto'
      ],
      deliverables: [
        'Relatório de contribuição ODS',
        'Mapa de impacto',
        'Dashboard de progresso',
        'Storytelling de casos'
      ]
    }
  ];

  const getStatusIcon = (status: ReportTemplate['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_development':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'needs_data':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'draft':
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ReportTemplate['status']) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'in_development':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_data':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getCategoryColor = (category: ReportTemplate['category']) => {
    switch (category) {
      case 'environmental':
        return 'bg-green-100 text-green-800';
      case 'social':
        return 'bg-blue-100 text-blue-800';
      case 'governance':
        return 'bg-purple-100 text-purple-800';
      case 'integrated':
        return 'bg-orange-100 text-orange-800';
    }
  };

  const filteredTemplates = selectedFrameworks.length > 0 
    ? reportTemplates.filter(template => 
        selectedFrameworks.some(fw => template.framework.toLowerCase().includes(fw.toLowerCase()))
      )
    : reportTemplates;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates de Relatórios por Framework
          </CardTitle>
          <CardDescription>
            Templates padronizados para conformidade com normas e frameworks internacionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="environmental">Ambiental</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="governance">Governança</TabsTrigger>
              <TabsTrigger value="integrated">Integrado</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            {getStatusIcon(template.status)}
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="outline" className="font-medium">
                              {template.framework}
                            </Badge>
                            <Badge className={getStatusColor(template.status)}>
                              {template.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">v{template.version}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(template.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <CardDescription>
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Conformidade</span>
                          <span className="text-sm text-muted-foreground">{template.compliance}%</span>
                        </div>
                        <Progress value={template.compliance} />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Indicadores: {template.completedIndicators}/{template.indicators}</span>
                          <span>
                            {Math.round((template.completedIndicators / template.indicators) * 100)}% completo
                          </span>
                        </div>
                      </div>

                      {/* Sectors */}
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Setores aplicáveis:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.sectors.slice(0, 3).map((sector, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {sector}
                            </Badge>
                          ))}
                          {template.sectors.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{template.sectors.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Principais recursos:</span>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          size="sm" 
                          disabled={template.status === 'draft'}
                          className="flex-1"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Visualizar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={template.status !== 'ready'}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Gerar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-1 h-3 w-3" />
                          Config
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum template encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecione frameworks específicos ou crie templates personalizados
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Template
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Category tabs would filter the templates */}
            <TabsContent value="environmental">
              <div className="text-center py-8 text-muted-foreground">
                Filtros por categoria serão implementados
              </div>
            </TabsContent>

            <TabsContent value="social">
              <div className="text-center py-8 text-muted-foreground">
                Filtros por categoria serão implementados
              </div>
            </TabsContent>

            <TabsContent value="governance">
              <div className="text-center py-8 text-muted-foreground">
                Filtros por categoria serão implementados
              </div>
            </TabsContent>

            <TabsContent value="integrated">
              <div className="text-center py-8 text-muted-foreground">
                Filtros por categoria serão implementados
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}