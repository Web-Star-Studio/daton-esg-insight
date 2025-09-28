import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Leaf, Shield, Users, FileText, 
  BarChart3, CheckCircle2, Award, 
  Building2, ArrowRight, ArrowLeft 
} from "lucide-react";

interface ModuleSelectionStepProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const MODULE_CATEGORIES = [
  {
    id: 'esg_sustentabilidade',
    title: 'ESG & Sustentabilidade',
    description: 'Módulos essenciais para gestão ESG completa',
    icon: <Leaf className="h-6 w-6" />,
    color: 'text-green-600 bg-green-50',
    modules: [
      {
        id: 'inventario_gee',
        name: 'Inventário GEE',
        description: 'Gestão completa de emissões de gases de efeito estufa',
        features: ['Cálculo automático de emissões', 'Escopos 1, 2 e 3', 'Relatórios GRI']
      },
      {
        id: 'gestao_licencas',
        name: 'Gestão de Licenças',
        description: 'Controle de licenças ambientais e compliance regulatório',
        features: ['Alertas de vencimento', 'Documentação digital', 'Histórico completo']
      },
      {
        id: 'metas_sustentabilidade',
        name: 'Metas de Sustentabilidade',
        description: 'Definição e acompanhamento de metas ESG',
        features: ['ODS alignment', 'KPIs customizados', 'Dashboard executivo']
      }
    ]
  },
  {
    id: 'qualidade_processos',
    title: 'Qualidade & Processos',
    description: 'Gestão da qualidade e melhoria contínua',
    icon: <Award className="h-6 w-6" />,
    color: 'text-blue-600 bg-blue-50',
    modules: [
      {
        id: 'sistema_qualidade',
        name: 'Sistema de Qualidade',
        description: 'SGQ completo com ISO 9001 e outras normas',
        features: ['Documentação ISO', 'Auditorias', 'Não conformidades']
      },
      {
        id: 'gestao_riscos',
        name: 'Gestão de Riscos',
        description: 'Identificação e tratamento de riscos operacionais',
        features: ['Matriz de riscos', 'Planos de ação', 'Monitoramento']
      }
    ]
  },
  {
    id: 'pessoas_rh',
    title: 'Pessoas & RH',
    description: 'Gestão de pessoas e desenvolvimento organizacional',
    icon: <Users className="h-6 w-6" />,
    color: 'text-purple-600 bg-purple-50',
    modules: [
      {
        id: 'gestao_desempenho',
        name: 'Gestão de Desempenho',
        description: 'Avaliações e desenvolvimento de colaboradores',
        features: ['Ciclos de avaliação', 'Competências', 'PDI personalizado']
      },
      {
        id: 'treinamentos',
        name: 'Treinamentos',
        description: 'Capacitação e desenvolvimento de equipes',
        features: ['Trilhas de aprendizado', 'Certificações', 'ROI de treinamentos']
      }
    ]
  },
  {
    id: 'dados_relatorios',
    title: 'Dados & Relatórios',
    description: 'Gestão de informações e relatórios corporativos',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'text-orange-600 bg-orange-50',
    modules: [
      {
        id: 'documentos',
        name: 'Gestão Documental',
        description: 'Organização e controle de documentos',
        features: ['Versionamento', 'Aprovações', 'Pesquisa avançada']
      },
      {
        id: 'relatorios_esg',
        name: 'Relatórios ESG',
        description: 'Geração automatizada de relatórios corporativos',
        features: ['GRI Standards', 'SASB', 'Relatórios customizados']
      }
    ]
  }
];

export function ModuleSelectionStep({ selectedModules, onModulesChange, onNext, onPrev }: ModuleSelectionStepProps) {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedModules);

  useEffect(() => {
    onModulesChange(localSelection);
  }, [localSelection]);

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
      // Remove todos os módulos da categoria
      setLocalSelection(prev => prev.filter(id => !categoryModuleIds.includes(id)));
    } else {
      // Adiciona todos os módulos da categoria
      setLocalSelection(prev => [...new Set([...prev, ...categoryModuleIds])]);
    }
  };

  const getSelectedCount = () => localSelection.length;
  const getTotalModules = () => MODULE_CATEGORIES.reduce((acc, cat) => acc + cat.modules.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Selecione os Módulos
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione as áreas que você deseja utilizar agora. Vamos configurar cada uma criando seus primeiros dados reais.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Badge variant="outline" className="px-3 py-1">
              {getSelectedCount()} de {getTotalModules()} módulos selecionados
            </Badge>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {MODULE_CATEGORIES.map((category) => {
            const selectedInCategory = category.modules.filter(m => localSelection.includes(m.id)).length;
            const allSelected = selectedInCategory === category.modules.length;
            const someSelected = selectedInCategory > 0 && selectedInCategory < category.modules.length;

            return (
              <Card key={category.id} className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <p className="text-muted-foreground text-sm">{category.description}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectAllInCategory(category)}
                      className="flex items-center gap-2"
                    >
                      {allSelected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Desmarcar Todos
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          {someSelected ? 'Marcar Todos' : 'Selecionar Todos'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {category.modules.map((module) => {
                      const isSelected = localSelection.includes(module.id);
                      
                      return (
                        <div
                          key={module.id}
                          className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border/50 hover:border-border bg-card'
                          }`}
                          onClick={() => toggleModule(module.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleModule(module.id)}
                              className="mt-1"
                            />
                            
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-foreground">{module.name}</h3>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                              
                              <div className="space-y-1">
                                {module.features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-border/50">
          <Button variant="outline" onClick={onPrev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {getSelectedCount() === 0 
                ? 'Selecione pelo menos um módulo para continuar'
                : `${getSelectedCount()} módulo(s) selecionado(s)`
              }
            </p>
          </div>
          
          <Button 
            onClick={onNext}
            disabled={getSelectedCount() === 0}
            className="min-w-32"
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}