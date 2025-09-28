import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, ArrowLeft, CheckCircle2, 
  Calendar, Building2, Target, Shield,
  Users, BarChart3, FileText, Settings
} from "lucide-react";

interface GuidedConfigurationStepProps {
  selectedModules: string[];
  moduleConfigurations: any;
  onConfigurationChange: (moduleId: string, config: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const MODULE_CONFIGS = {
  inventario_gee: {
    title: 'Inventário GEE',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'bg-green-50 text-green-700',
    fields: [
      {
        key: 'ano_base',
        label: 'Ano Base do Inventário',
        type: 'select',
        required: true,
        options: [
          { value: 2023, label: '2023' },
          { value: 2024, label: '2024' },
          { value: 2025, label: '2025' }
        ],
        description: 'Selecione o ano que será usado como base para o inventário de emissões'
      },
      {
        key: 'unidade_operacional',
        label: 'Unidade Operacional Principal',
        type: 'input',
        required: true,
        placeholder: 'Ex: Matriz São Paulo, Filial Rio de Janeiro',
        description: 'Nome da principal unidade que será inventariada'
      },
      {
        key: 'escopo',
        label: 'Escopos de Inventário',
        type: 'checkbox-group',
        required: true,
        options: [
          { value: 'escopo1', label: 'Escopo 1 - Emissões diretas' },
          { value: 'escopo2', label: 'Escopo 2 - Energia elétrica' },
          { value: 'escopo3', label: 'Escopo 3 - Outras emissões indiretas' }
        ],
        description: 'Selecione quais escopos serão incluídos no inventário'
      }
    ]
  },
  gestao_licencas: {
    title: 'Gestão de Licenças',
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-blue-50 text-blue-700',
    fields: [
      {
        key: 'orgaos_reguladores',
        label: 'Órgãos Reguladores',
        type: 'multi-input',
        required: true,
        placeholder: 'Ex: IBAMA, CETESB, INEA',
        description: 'Liste os principais órgãos que sua empresa acompanha',
        max: 10
      },
      {
        key: 'tipos_licencas',
        label: 'Tipos de Licenças',
        type: 'checkbox-group',
        required: true,
        options: [
          { value: 'lp', label: 'LP - Licença Prévia' },
          { value: 'li', label: 'LI - Licença de Instalação' },
          { value: 'lo', label: 'LO - Licença de Operação' },
          { value: 'outorga', label: 'Outorga de Uso da Água' },
          { value: 'outras', label: 'Outras Licenças' }
        ],
        description: 'Marque os tipos de licenças que sua empresa possui'
      },
      {
        key: 'alertas_vencimento',
        label: 'Alertas de Vencimento',
        type: 'select',
        required: true,
        options: [
          { value: 30, label: '30 dias antes' },
          { value: 60, label: '60 dias antes' },
          { value: 90, label: '90 dias antes' }
        ],
        description: 'Quando você deseja ser alertado sobre vencimentos'
      }
    ]
  },
  gestao_desempenho: {
    title: 'Gestão de Desempenho',
    icon: <Users className="h-5 w-5" />,
    color: 'bg-purple-50 text-purple-700',
    fields: [
      {
        key: 'ciclo_avaliacao',
        label: 'Ciclo de Avaliação',
        type: 'select',
        required: true,
        options: [
          { value: 'semestral', label: 'Semestral' },
          { value: 'anual', label: 'Anual' },
          { value: 'trimestral', label: 'Trimestral' }
        ],
        description: 'Com que frequência as avaliações serão realizadas'
      },
      {
        key: 'competencias_chave',
        label: 'Competências-Chave',
        type: 'multi-input',
        required: true,
        placeholder: 'Ex: Liderança, Comunicação, Inovação',
        description: 'Liste as principais competências avaliadas',
        max: 8
      },
      {
        key: 'metas_organizacionais',
        label: 'Tipos de Metas',
        type: 'checkbox-group',
        required: true,
        options: [
          { value: 'financeiras', label: 'Metas Financeiras' },
          { value: 'operacionais', label: 'Metas Operacionais' },
          { value: 'desenvolvimento', label: 'Desenvolvimento Pessoal' },
          { value: 'esg', label: 'Metas ESG' }
        ],
        description: 'Quais tipos de metas serão utilizados nas avaliações'
      }
    ]
  },
  sistema_qualidade: {
    title: 'Sistema de Qualidade',
    icon: <Target className="h-5 w-5" />,
    color: 'bg-orange-50 text-orange-700',
    fields: [
      {
        key: 'normas_aplicaveis',
        label: 'Normas Aplicáveis',
        type: 'checkbox-group',
        required: true,
        options: [
          { value: 'iso9001', label: 'ISO 9001 - Qualidade' },
          { value: 'iso14001', label: 'ISO 14001 - Meio Ambiente' },
          { value: 'iso45001', label: 'ISO 45001 - Segurança do Trabalho' },
          { value: 'iso27001', label: 'ISO 27001 - Segurança da Informação' }
        ],
        description: 'Selecione as normas que sua empresa segue ou pretende implementar'
      },
      {
        key: 'processos_criticos',
        label: 'Processos Críticos',
        type: 'multi-input',
        required: true,
        placeholder: 'Ex: Produção, Vendas, Atendimento ao Cliente',
        description: 'Liste os processos mais importantes da sua empresa',
        max: 10
      },
      {
        key: 'politica_qualidade',
        label: 'Política de Qualidade',
        type: 'textarea',
        required: false,
        placeholder: 'Descreva brevemente a política de qualidade da empresa...',
        description: 'Opcional: Insira sua política de qualidade atual (pode ser adicionada depois)'
      }
    ]
  }
};

export function GuidedConfigurationStep({ 
  selectedModules, 
  moduleConfigurations, 
  onConfigurationChange, 
  onNext, 
  onPrev 
}: GuidedConfigurationStepProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentConfig, setCurrentConfig] = useState<any>({});

  const currentModuleId = selectedModules[currentModuleIndex];
  const currentModuleConfig = currentModuleId ? MODULE_CONFIGS[currentModuleId as keyof typeof MODULE_CONFIGS] : null;
  const totalModules = selectedModules.length;

  useEffect(() => {
    if (currentModuleId && moduleConfigurations[currentModuleId]) {
      setCurrentConfig(moduleConfigurations[currentModuleId]);
    } else {
      setCurrentConfig({});
    }
  }, [currentModuleId, moduleConfigurations]);

  const updateFieldValue = (key: string, value: any) => {
    const newConfig = { ...currentConfig, [key]: value };
    setCurrentConfig(newConfig);
    onConfigurationChange(currentModuleId, newConfig);
  };

  const isCurrentModuleComplete = () => {
    if (!currentModuleConfig) return false;
    
    return currentModuleConfig.fields
      .filter(field => field.required)
      .every(field => {
        const value = currentConfig[field.key];
        if (field.type === 'checkbox-group' || field.type === 'multi-input') {
          return Array.isArray(value) && value.length > 0;
        }
        return value !== undefined && value !== '' && value !== null;
      });
  };

  const goToNextModule = () => {
    if (currentModuleIndex < totalModules - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    } else {
      onNext();
    }
  };

  const goToPrevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    } else {
      onPrev();
    }
  };

  const getCompletedModulesCount = () => {
    return selectedModules.filter(moduleId => {
      const config = MODULE_CONFIGS[moduleId as keyof typeof MODULE_CONFIGS];
      const values = moduleConfigurations[moduleId] || {};
      
      return config.fields
        .filter(field => field.required)
        .every(field => {
          const value = values[field.key];
          if (field.type === 'checkbox-group' || field.type === 'multi-input') {
            return Array.isArray(value) && value.length > 0;
          }
          return value !== undefined && value !== '' && value !== null;
        });
    }).length;
  };

  const renderField = (field: any) => {
    const value = currentConfig[field.key];

    switch (field.type) {
      case 'input':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.key} className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.key}
              value={value || ''}
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value?.toString()} onValueChange={(val) => updateFieldValue(field.key, val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: any) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'checkbox-group':
        return (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options.map((option: any) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.key}-${option.value}`}
                    checked={(value || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = value || [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      updateFieldValue(field.key, newValues);
                    }}
                  />
                  <Label 
                    htmlFor={`${field.key}-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'multi-input':
        const currentValues = value || [];
        return (
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="space-y-2">
              {currentValues.map((val: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={val}
                    onChange={(e) => {
                      const newValues = [...currentValues];
                      newValues[index] = e.target.value;
                      updateFieldValue(field.key, newValues);
                    }}
                    placeholder={field.placeholder}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newValues = currentValues.filter((_: any, i: number) => i !== index);
                      updateFieldValue(field.key, newValues);
                    }}
                  >
                    Remover
                  </Button>
                </div>
              ))}
              {currentValues.length < (field.max || 10) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newValues = [...currentValues, ''];
                    updateFieldValue(field.key, newValues);
                  }}
                >
                  Adicionar
                </Button>
              )}
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              value={value || ''}
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentModuleConfig) {
    return <div>Carregando...</div>;
  }

  const progressPercentage = ((currentModuleIndex + (isCurrentModuleComplete() ? 1 : 0)) / totalModules) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Progress */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Configuração dos Módulos
            </h1>
          </div>
          
          <div className="space-y-3">
            <p className="text-lg text-muted-foreground">
              Vamos configurar cada módulo selecionado para sua empresa
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                Módulo {currentModuleIndex + 1} de {totalModules}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {getCompletedModulesCount()} completos
              </Badge>
            </div>
            
            <div className="max-w-md mx-auto">
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round(progressPercentage)}% concluído
              </p>
            </div>
          </div>
        </div>

        {/* Current Module Configuration */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${currentModuleConfig.color}`}>
                {currentModuleConfig.icon}
              </div>
              <div>
                <CardTitle className="text-2xl">{currentModuleConfig.title}</CardTitle>
                <p className="text-muted-foreground">
                  Configure as informações básicas para começar a usar este módulo
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentModuleConfig.fields.map((field) => (
              <div key={field.key}>
                {renderField(field)}
              </div>
            ))}
            
            {isCurrentModuleComplete() && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-700 font-medium">
                  Configuração do módulo concluída!
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-border/50">
          <Button variant="outline" onClick={goToPrevModule}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentModuleIndex === 0 ? 'Voltar' : 'Módulo Anterior'}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {!isCurrentModuleComplete() && 'Complete os campos obrigatórios para continuar'}
            </p>
          </div>
          
          <Button 
            onClick={goToNextModule}
            disabled={!isCurrentModuleComplete()}
            className="min-w-32"
          >
            {currentModuleIndex === totalModules - 1 ? 'Finalizar' : 'Próximo Módulo'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}