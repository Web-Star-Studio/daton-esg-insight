import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Leaf, 
  Shield, 
  Users, 
  BarChart3, 
  FileCheck, 
  TrendingUp, 
  Award, 
  Building,
  ArrowLeft,
  ArrowRight,
  Star,
  Check
} from "lucide-react";

interface CleanModuleSelectionStepProps {
  selectedModules: string[];
  onModulesChange: (modules: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
  companyProfile?: any;
}

const MODULES = [
  {
    id: 'inventario_gee',
    name: 'Inventário GEE',
    icon: Leaf,
    description: 'Gestão de emissões e gases de efeito estufa',
    category: 'ESG',
    recommended: true,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'gestao_licencas',
    name: 'Licenças Ambientais',
    icon: Shield,
    description: 'Controle de licenças e compliance ambiental',
    category: 'ESG',
    recommended: true,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'gestao_pessoas',
    name: 'Gestão de Pessoas',
    icon: Users,
    description: 'RH, performance e desenvolvimento de equipes',
    category: 'Social',
    recommended: false,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'qualidade',
    name: 'Sistema de Qualidade',
    icon: Award,
    description: 'Processos, auditorias e gestão da qualidade',
    category: 'Governança',
    recommended: true,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'performance',
    name: 'Performance',
    icon: TrendingUp,
    description: 'KPIs, indicadores e monitoramento',
    category: 'Governança',
    recommended: true,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50'
  },
  {
    id: 'documentos',
    name: 'Documentos',
    icon: FileCheck,
    description: 'Gestão documental e versionamento',
    category: 'Governança',
    recommended: false,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  {
    id: 'analise_dados',
    name: 'Análise de Dados',
    icon: BarChart3,
    description: 'Dashboards avançados e relatórios',
    category: 'Análise',
    recommended: false,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: Building,
    description: 'Conformidade regulatória e auditoria',
    category: 'Governança',
    recommended: false,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  }
];

export function CleanModuleSelectionStep({ 
  selectedModules, 
  onModulesChange, 
  onNext, 
  onPrev,
  companyProfile 
}: CleanModuleSelectionStepProps) {
  const handleModuleToggle = (moduleId: string) => {
    const isSelected = selectedModules.includes(moduleId);
    if (isSelected) {
      onModulesChange(selectedModules.filter(id => id !== moduleId));
    } else {
      onModulesChange([...selectedModules, moduleId]);
    }
  };

  const handleSelectRecommended = () => {
    const recommendedIds = MODULES.filter(m => m.recommended).map(m => m.id);
    onModulesChange(recommendedIds);
  };

  const recommendedModules = MODULES.filter(m => m.recommended);
  const otherModules = MODULES.filter(m => !m.recommended);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Selecione seus Módulos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha os módulos que serão configurados na sua plataforma. 
            Você pode adicionar outros módulos a qualquer momento.
          </p>
          
          {recommendedModules.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleSelectRecommended}
              className="gap-2"
            >
              <Star className="w-4 h-4" />
              Selecionar Recomendados ({recommendedModules.length})
            </Button>
          )}
        </div>

        {/* Recommended Modules */}
        {recommendedModules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Módulos Recomendados
              </h3>
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Essenciais
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedModules.map((module) => {
                const Icon = module.icon;
                const isSelected = selectedModules.includes(module.id);
                
                return (
                  <Card 
                    key={module.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      isSelected 
                        ? 'border-primary shadow-sm' 
                        : 'border-border/50 hover:border-border'
                    }`}
                    onClick={() => handleModuleToggle(module.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${module.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${module.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-sm">
                                {module.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {module.description}
                              </p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {module.category}
                              </Badge>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <Checkbox 
                                checked={isSelected}
                                onChange={() => handleModuleToggle(module.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Modules */}
        {otherModules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Módulos Adicionais
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherModules.map((module) => {
                const Icon = module.icon;
                const isSelected = selectedModules.includes(module.id);
                
                return (
                  <Card 
                    key={module.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                      isSelected 
                        ? 'border-primary shadow-sm' 
                        : 'border-border/50 hover:border-border'
                    }`}
                    onClick={() => handleModuleToggle(module.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${module.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${module.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground text-sm">
                                {module.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                {module.description}
                              </p>
                            </div>
                            
                            <Checkbox 
                              checked={isSelected}
                              onChange={() => handleModuleToggle(module.id)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selectedModules.length > 0 && (
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="font-medium text-foreground">
                  {selectedModules.length} módulos selecionados
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onPrev}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={selectedModules.length === 0}
            className="gap-2"
          >
            Próximo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
