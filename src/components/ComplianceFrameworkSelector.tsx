import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";

interface ComplianceFramework {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance' | 'reporting';
  priority: 'high' | 'medium' | 'low';
  status: 'implemented' | 'partial' | 'planned' | 'not_implemented';
  description: string;
  scope: string[];
  requirements: string[];
  deadline?: string;
  progress: number;
}

interface ComplianceFrameworkSelectorProps {
  onFrameworksSelect: (frameworks: string[]) => void;
  selectedFrameworks?: string[];
}

export function ComplianceFrameworkSelector({ 
  onFrameworksSelect, 
  selectedFrameworks = [] 
}: ComplianceFrameworkSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedFrameworks);

  const frameworks: ComplianceFramework[] = [
    // Environmental (E)
    {
      id: 'ghg-protocol',
      name: 'GHG Protocol',
      category: 'environmental',
      priority: 'high',
      status: 'implemented',
      description: 'Protocolo mundial para cálculo de inventários de GEE',
      scope: ['Escopo 1', 'Escopo 2', 'Escopo 3'],
      requirements: ['Inventário GEE', 'Fatores de Emissão', 'Relatório Anual'],
      progress: 95
    },
    {
      id: 'iso-14001',
      name: 'ISO 14001',
      category: 'environmental',
      priority: 'high',
      status: 'partial',
      description: 'Sistema de Gestão Ambiental',
      scope: ['SGA', 'Política Ambiental', 'Objetivos e Metas'],
      requirements: ['Política Ambiental', 'Aspectos e Impactos', 'Monitoramento'],
      deadline: '2024-06-30',
      progress: 65
    },
    {
      id: 'iso-14064',
      name: 'ISO 14064',
      category: 'environmental',
      priority: 'medium',
      status: 'planned',
      description: 'Quantificação e verificação de GEE',
      scope: ['Quantificação', 'Monitoramento', 'Verificação'],
      requirements: ['Metodologia', 'Validação', 'Verificação Externa'],
      progress: 25
    },
    
    // Social (S)
    {
      id: 'iso-45001',
      name: 'ISO 45001',
      category: 'social',
      priority: 'high',
      status: 'partial',
      description: 'Sistema de Gestão de Saúde e Segurança Ocupacional',
      scope: ['SSO', 'Acidentes', 'Treinamentos'],
      requirements: ['Política SSO', 'Identificação de Riscos', 'Investigação de Acidentes'],
      deadline: '2024-09-30',
      progress: 45
    },
    {
      id: 'sa-8000',
      name: 'SA 8000',
      category: 'social',
      priority: 'medium',
      status: 'not_implemented',
      description: 'Responsabilidade Social',
      scope: ['Trabalho Infantil', 'Trabalho Forçado', 'Liberdade de Associação'],
      requirements: ['Auditoria Social', 'Gestão de Fornecedores', 'Treinamentos'],
      progress: 0
    },

    // Governance (G)
    {
      id: 'iso-31000',
      name: 'ISO 31000',
      category: 'governance',
      priority: 'high',
      status: 'implemented',
      description: 'Gestão de Riscos',
      scope: ['Identificação', 'Avaliação', 'Tratamento'],
      requirements: ['Matriz de Riscos', 'Planos de Ação', 'Monitoramento'],
      progress: 90
    },
    {
      id: 'iso-37001',
      name: 'ISO 37001',
      category: 'governance',
      priority: 'medium',
      status: 'partial',
      description: 'Sistema de Gestão Antissuborno',
      scope: ['Políticas', 'Due Diligence', 'Canal de Denúncias'],
      requirements: ['Política Antissuborno', 'Due Diligence', 'Treinamentos'],
      progress: 30
    },
    {
      id: 'iso-37301',
      name: 'ISO 37301',
      category: 'governance',
      priority: 'medium',
      status: 'planned',
      description: 'Sistema de Gestão de Compliance',
      scope: ['Compliance', 'Controles', 'Monitoramento'],
      requirements: ['Framework de Compliance', 'Controles Internos', 'Auditoria'],
      progress: 15
    },

    // Reporting
    {
      id: 'gri',
      name: 'GRI Standards',
      category: 'reporting',
      priority: 'high',
      status: 'implemented',
      description: 'Framework de relatórios de sustentabilidade',
      scope: ['Indicadores Universais', 'Indicadores Setoriais', 'Indicadores Específicos'],
      requirements: ['Relatório GRI', 'Indicadores Materiais', 'Verificação'],
      progress: 85
    },
    {
      id: 'sasb',
      name: 'SASB',
      category: 'reporting',
      priority: 'high',
      status: 'partial',
      description: 'Padrões contábeis de sustentabilidade',
      scope: ['Métricas Setoriais', 'Materialidade Financeira'],
      requirements: ['Métricas SASB', 'Divulgação Setorial', 'Materialidade'],
      deadline: '2024-12-31',
      progress: 40
    },
    {
      id: 'tcfd',
      name: 'TCFD',
      category: 'reporting',
      priority: 'high',
      status: 'planned',
      description: 'Divulgações relacionadas ao clima',
      scope: ['Governança', 'Estratégia', 'Gestão de Riscos', 'Métricas'],
      requirements: ['Cenários Climáticos', 'Riscos Climáticos', 'Métricas Climáticas'],
      deadline: '2024-11-30',
      progress: 20
    },
    {
      id: 'ods',
      name: 'ODS (SDGs)',
      category: 'reporting',
      priority: 'medium',
      status: 'partial',
      description: 'Objetivos de Desenvolvimento Sustentável',
      scope: ['17 ODS', 'Metas', 'Indicadores'],
      requirements: ['Mapeamento ODS', 'Contribuição às Metas', 'Relatório de Impacto'],
      progress: 55
    },
    {
      id: 'ifrs-s1-s2',
      name: 'IFRS S1 & S2',
      category: 'reporting',
      priority: 'medium',
      status: 'planned',
      description: 'Novos padrões globais de relatórios',
      scope: ['Divulgações Gerais', 'Divulgações Climáticas'],
      requirements: ['Conformidade ISSB', 'Relatórios Financeiros ESG'],
      deadline: '2025-01-01',
      progress: 0
    }
  ];

  const getStatusIcon = (status: ComplianceFramework['status']) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'planned':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'not_implemented':
        return <Zap className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ComplianceFramework['status']) => {
    switch (status) {
      case 'implemented':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'planned':
        return 'bg-orange-100 text-orange-800';
      case 'not_implemented':
        return 'bg-red-100 text-red-800';
    }
  };

  const getPriorityColor = (priority: ComplianceFramework['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryIcon = (category: ComplianceFramework['category']) => {
    switch (category) {
      case 'environmental':
        return <div className="h-2 w-2 bg-green-500 rounded-full" />;
      case 'social':
        return <div className="h-2 w-2 bg-blue-500 rounded-full" />;
      case 'governance':
        return <div className="h-2 w-2 bg-purple-500 rounded-full" />;
      case 'reporting':
        return <div className="h-2 w-2 bg-orange-500 rounded-full" />;
    }
  };

  const handleToggle = (frameworkId: string) => {
    const newSelected = selected.includes(frameworkId)
      ? selected.filter(id => id !== frameworkId)
      : [...selected, frameworkId];
    
    setSelected(newSelected);
    onFrameworksSelect(newSelected);
  };

  const categorizedFrameworks = frameworks.reduce((acc, framework) => {
    if (!acc[framework.category]) {
      acc[framework.category] = [];
    }
    acc[framework.category].push(framework);
    return acc;
  }, {} as Record<string, ComplianceFramework[]>);

  const categoryLabels = {
    environmental: 'Environmental (E)',
    social: 'Social (S)',
    governance: 'Governance (G)',
    reporting: 'Reporting & Frameworks'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Seleção de Frameworks de Conformidade
        </CardTitle>
        <CardDescription>
          Selecione os frameworks e normas para adequação do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(categorizedFrameworks).map(([category, frameworks]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category as ComplianceFramework['category'])}
                  <h3 className="font-semibold text-lg">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {frameworks.map((framework) => (
                    <Card key={framework.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={selected.includes(framework.id)}
                              onCheckedChange={() => handleToggle(framework.id)}
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{framework.name}</h4>
                                {getStatusIcon(framework.status)}
                                <Badge variant="outline" className={getStatusColor(framework.status)}>
                                  {framework.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(framework.priority)}>
                                  {framework.priority}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {framework.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    Progresso: {framework.progress}%
                                  </span>
                                </div>
                                {framework.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(framework.deadline).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-medium text-muted-foreground">Escopo:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {framework.scope.slice(0, 2).map((item, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs px-2 py-0">
                                        {item}
                                      </Badge>
                                    ))}
                                    {framework.scope.length > 2 && (
                                      <Badge variant="secondary" className="text-xs px-2 py-0">
                                        +{framework.scope.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-muted-foreground">Requisitos:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {framework.requirements.slice(0, 2).map((req, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs px-2 py-0">
                                        {req}
                                      </Badge>
                                    ))}
                                    {framework.requirements.length > 2 && (
                                      <Badge variant="outline" className="text-xs px-2 py-0">
                                        +{framework.requirements.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {category !== 'reporting' && <Separator />}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selected.length} frameworks selecionados
            </div>
            <Button 
              onClick={() => onFrameworksSelect(selected)}
              disabled={selected.length === 0}
            >
              <FileText className="mr-2 h-4 w-4" />
              Aplicar Seleção
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}