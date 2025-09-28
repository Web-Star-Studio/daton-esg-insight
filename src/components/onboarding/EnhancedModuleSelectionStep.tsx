import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, Leaf, Award, Users, 
  BarChart3, Shield, GraduationCap, FolderOpen, Lightbulb, Star, Target
} from "lucide-react";

interface EnhancedModuleSelectionStepProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  features: string[];
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
  estimatedTime: string;
  recommended: boolean;
  popular: boolean;
}

const MODULE_CATEGORIES = [
  {
    id: 'esg_sustentabilidade',
    title: 'ESG & Sustentabilidade',
    description: 'Módulos essenciais para gestão ESG completa e relatórios de sustentabilidade',
    icon: <Leaf className="h-6 w-6" />,
    color: 'text-green-600 bg-green-50 border-green-200',
    modules: [
        {
          id: 'inventario_gee',
          name: 'Inventário GEE',
          description: 'Gestão completa de emissões de gases de efeito estufa com cálculos automáticos',
          icon: <BarChart3 className="h-5 w-5" />,
          color: 'text-green-600',
          features: ['Cálculo automático de emissões', 'Escopos 1, 2 e 3', 'Relatórios GRI', 'Dashboard executivo'],
          difficulty: 'Intermediário' as const,
          estimatedTime: '2-3 min',
          recommended: true,
          popular: false
        },
        {
          id: 'gestao_licencas',
          name: 'Gestão de Licenças',
          description: 'Controle de licenças ambientais e compliance regulatório automático',
          icon: <Shield className="h-5 w-5" />,
          color: 'text-blue-600',
          features: ['Alertas de vencimento', 'Documentação digital', 'Histórico completo', 'Compliance automático'],
          difficulty: 'Básico' as const,
          estimatedTime: '1-2 min',
          recommended: true,
          popular: false
        },
        {
          id: 'metas_sustentabilidade',
          name: 'Metas de Sustentabilidade',
          description: 'Definição e acompanhamento de metas ESG alinhadas aos ODS',
          icon: <Target className="h-5 w-5" />,
          color: 'text-emerald-600',
          features: ['ODS alignment', 'KPIs customizados', 'Dashboard executivo', 'Relatórios automáticos'],
          difficulty: 'Intermediário' as const,
          estimatedTime: '2-3 min',
          recommended: false,
          popular: false
        }
    ]
  },
  {
    id: 'qualidade_processos',
    title: 'Qualidade & Processos',
    description: 'Gestão da qualidade e melhoria contínua com metodologias ISO',
    icon: <Award className="h-6 w-6" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    modules: [
        {
          id: 'sistema_qualidade',
          name: 'Sistema de Qualidade',
          description: 'SGQ completo com ISO 9001 e outras normas de qualidade',
          icon: <Award className="h-5 w-5" />,
          color: 'text-blue-600',
          features: ['Documentação ISO', 'Auditorias', 'Não conformidades', 'Melhoria contínua'],
          difficulty: 'Intermediário' as const,
          estimatedTime: '2-3 min',
          recommended: true,
          popular: false
        },
        {
          id: 'gestao_riscos',
          name: 'Gestão de Riscos',
          description: 'Identificação e tratamento de riscos operacionais e estratégicos',
          icon: <Shield className="h-5 w-5" />,
          color: 'text-red-600',
          features: ['Matriz de riscos', 'Planos de ação', 'Monitoramento', 'Análise de impacto'],
          difficulty: 'Avançado' as const,
          estimatedTime: '3-4 min',
          recommended: false,
          popular: false
        }
    ]
  },
  {
    id: 'pessoas_rh',
    title: 'Pessoas & RH',
    description: 'Gestão de pessoas e desenvolvimento organizacional estratégico',
    icon: <Users className="h-6 w-6" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    modules: [
        {
          id: 'gestao_desempenho',
          name: 'Gestão de Desempenho',
          description: 'Avaliações e desenvolvimento de colaboradores com metodologias modernas',
          icon: <Users className="h-5 w-5" />,
          color: 'text-purple-600',
          features: ['Ciclos de avaliação', 'Competências', 'PDI personalizado', 'Feedback 360°'],
          difficulty: 'Intermediário' as const,
          estimatedTime: '2-3 min',
          recommended: false,
          popular: true
        },
        {
          id: 'treinamentos',
          name: 'Treinamentos',
          description: 'Capacitação e desenvolvimento de equipes com trilhas personalizadas',
          icon: <GraduationCap className="h-5 w-5" />,
          color: 'text-indigo-600',
          features: ['Trilhas de aprendizado', 'Certificações', 'ROI de treinamentos', 'Gamificação'],
          difficulty: 'Básico' as const,
          estimatedTime: '1-2 min',
          recommended: false,
          popular: false
        }
    ]
  },
  {
    id: 'dados_relatorios',
    title: 'Dados & Relatórios',
    description: 'Gestão de informações e relatórios corporativos automatizados',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    modules: [
        {
          id: 'documentos',
          name: 'Gestão Documental',
          description: 'Organização e controle de documentos com versionamento inteligente',
          icon: <FolderOpen className="h-5 w-5" />,
          color: 'text-orange-600',
          features: ['Versionamento', 'Aprovações', 'Pesquisa avançada', 'OCR integrado'],
          difficulty: 'Básico' as const,
          estimatedTime: '1-2 min',
          recommended: false,
          popular: false
        },
        {
          id: 'relatorios_esg',
          name: 'Relatórios ESG',
          description: 'Geração automatizada de relatórios corporativos e de sustentabilidade',
          icon: <BarChart3 className="h-5 w-5" />,
          color: 'text-cyan-600',
          features: ['GRI Standards', 'SASB', 'Relatórios customizados', 'Automação completa'],
          difficulty: 'Avançado' as const,
          estimatedTime: '3-4 min',
          recommended: false,
          popular: false
        }
    ]
  }
];

export function EnhancedModuleSelectionStep({ 
  selectedModules, 
  onModulesChange, 
  onNext, 
  onPrev 
}: EnhancedModuleSelectionStepProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedModules);

  // Sync local selection with parent only when local selection changes
  useEffect(() => {
    // Only update if the arrays are actually different
    if (JSON.stringify(localSelection) !== JSON.stringify(selectedModules)) {
      onModulesChange(localSelection);
    }
  }, [localSelection]); // Remove onModulesChange from dependencies

  // Initialize local selection from props if empty
  useEffect(() => {
    if (localSelection.length === 0 && selectedModules.length > 0) {
      setLocalSelection(selectedModules);
    }
  }, [selectedModules]);

  const toggleModule = (moduleId: string) => {
    setLocalSelection(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectAllInCategory = (category: any) => {
    const categoryModuleIds = category.modules.map((m: any) => m.id);
    const allSelected = categoryModuleIds.every((id: string) => localSelection.includes(id));
    
    if (allSelected) {
      setLocalSelection(prev => prev.filter(id => !categoryModuleIds.includes(id)));
    } else {
      setLocalSelection(prev => [...new Set([...prev, ...categoryModuleIds])]);
    }
  };

  const selectRecommended = () => {
    const recommendedModules: string[] = [];
    MODULE_CATEGORIES.forEach(cat => {
      cat.modules.forEach((module: any) => {
        if (module.recommended) {
          recommendedModules.push(module.id);
        }
      });
    });
    setLocalSelection(recommendedModules);
  };

  const getTotalEstimatedTime = () => {
    let totalTime = 0;
    MODULE_CATEGORIES.forEach(cat => {
      cat.modules.forEach((module: any) => {
        if (localSelection.includes(module.id)) {
          totalTime += 2; // Média de 2 min por módulo
        }
      });
    });
    return totalTime;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return 'text-green-600 bg-green-50 border-green-200';
      case 'Intermediário': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Avançado': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Selecione seus Módulos
                </CardTitle>
                <p className="text-muted-foreground">
                  Escolha os módulos que sua empresa utilizará. Você pode adicionar mais módulos depois.
                </p>
              </div>
              
              <div className="text-right space-y-2">
                <Badge variant="outline" className="px-3 py-1">
                  {localSelection.length} módulos selecionados
                </Badge>
                {localSelection.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Tempo estimado: ~{getTotalEstimatedTime()} minutos
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button 
            variant="outline" 
            onClick={selectRecommended}
            className="hover:bg-green-50 hover:border-green-200"
          >
            <Star className="mr-2 h-4 w-4 text-green-600" />
            Selecionar Recomendados
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocalSelection([])}
            disabled={localSelection.length === 0}
          >
            Limpar Seleção
          </Button>
        </div>

        {/* Module Categories */}
        <div className="space-y-8">
          {MODULE_CATEGORIES.map((category) => {
            const categoryModuleIds = category.modules.map(m => m.id);
            const selectedInCategory = categoryModuleIds.filter(id => localSelection.includes(id)).length;
            const allSelectedInCategory = selectedInCategory === categoryModuleIds.length;
            
            return (
              <Card key={category.id} className="shadow-md border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${category.color}`}>
                        {category.icon}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="px-3 py-1">
                        {selectedInCategory}/{categoryModuleIds.length} selecionados
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectAllInCategory(category)}
                      >
                        {allSelectedInCategory ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.modules.map((module: any) => {
                      const isSelected = localSelection.includes(module.id);
                      
                      return (
                        <div
                          key={module.id}
                          className={`
                            relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                            ${isSelected 
                              ? 'border-primary bg-primary/5 shadow-md' 
                              : 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                            }
                          `}
                          onClick={() => toggleModule(module.id)}
                        >
                          {/* Selection Indicator */}
                          <div className="absolute top-3 right-3">
                            <Checkbox 
                              checked={isSelected}
                              onChange={() => toggleModule(module.id)}
                            />
                          </div>

                          {/* Module Badges */}
                          <div className="absolute top-3 left-3 flex gap-1">
                            {module.recommended && (
                              <Badge className="text-xs px-2 py-0.5 bg-green-100 text-green-700 border-green-200">
                                <Star className="w-3 h-3 mr-1" />
                                Recomendado
                              </Badge>
                            )}
                            {module.popular && (
                              <Badge className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 border-orange-200">
                                Popular
                              </Badge>
                            )}
                          </div>

                          <div className="mt-8 space-y-3">
                            {/* Module Header */}
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg bg-background shadow-sm ${module.color}`}>
                                {module.icon}
                              </div>
                              <div className="flex-1 space-y-1">
                                <h4 className="font-semibold text-foreground">{module.name}</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {module.description}
                                </p>
                              </div>
                            </div>

                            {/* Module Features */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Principais recursos:
                              </p>
                              <div className="grid grid-cols-2 gap-1">
                                {module.features.slice(0, 4).map((feature: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                                    <span className="truncate">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Module Info */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/30">
                              <Badge variant="outline" className={`text-xs ${getDifficultyColor(module.difficulty)}`}>
                                {module.difficulty}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {module.estimatedTime}
                              </span>
                            </div>
                          </div>

                          {/* Selected Overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/5 rounded-lg border-2 border-primary/20 pointer-events-none">
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        {localSelection.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Pronto para configurar seus módulos!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Você selecionou <strong>{localSelection.length} módulos</strong> que levarão aproximadamente <strong>{getTotalEstimatedTime()} minutos</strong> para configurar. Na próxima etapa, criaremos dados reais para cada módulo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" onClick={onPrev} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button 
            onClick={onNext}
            disabled={localSelection.length === 0}
            size="lg"
            className="min-w-48"
          >
            Continuar para Configuração
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}