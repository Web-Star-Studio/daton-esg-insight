import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  Leaf, Shield, Users, FileText, BarChart3, Lightbulb
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GuidedDataCreationStepProps {
  selectedModules: string[];
  moduleConfigurations: any;
  onConfigurationChange: (moduleId: string, config: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface ModuleField {
  key: string;
  label: string;
  type: 'input' | 'number' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface ModuleConfig {
  title: string;
  icon: JSX.Element;
  color: string;
  explanation: string;
  table: string;
  fields: ModuleField[];
}

const MODULE_DATA_CREATION: Record<string, ModuleConfig> = {
  inventario_gee: {
    title: 'Inventário GEE - Primeira Fonte de Emissão',
    icon: <Leaf className="h-5 w-5" />,
    color: 'text-green-600',
    explanation: 'Fontes de emissão são locais ou equipamentos que geram gases de efeito estufa, como veículos da frota ou equipamentos industriais. Isso é a base do seu inventário GEE.',
    table: 'emission_sources',
    fields: [
      {
        key: 'name',
        label: 'Nome da Fonte',
        type: 'input',
        placeholder: 'Ex: Frota de Caminhões - SP',
        required: true
      },
      {
        key: 'category',
        label: 'Categoria',
        type: 'select',
        options: [
          { value: 'mobile', label: 'Móvel (veículos, equipamentos móveis)' },
          { value: 'stationary', label: 'Fixa (caldeiras, geradores)' },
          { value: 'fugitive', label: 'Fugitiva (vazamentos, emissões de processo)' }
        ],
        required: true
      }
    ]
  },
  gestao_licencas: {
    title: 'Gestão de Licenças - Primeira Licença Ambiental',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-600',
    explanation: 'Licenças ambientais são documentos obrigatórios que autorizam a operação da sua empresa. O controle adequado evita multas e garante compliance.',
    table: 'environmental_licenses',
    fields: [
      {
        key: 'license_name',
        label: 'Nome da Licença',
        type: 'input',
        placeholder: 'Ex: Licença de Operação - CETESB',
        required: true
      },
      {
        key: 'expiration_date',
        label: 'Data de Vencimento',
        type: 'date',
        required: true
      }
    ]
  },
  sistema_qualidade: {
    title: 'Sistema de Qualidade - Primeira Não Conformidade',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'text-purple-600',
    explanation: 'Não conformidades são desvios de procedimentos ou normas que precisam ser corrigidos. Registrar e tratar adequadamente melhora continuamente seus processos.',
    table: 'non_conformities',
    fields: [
      {
        key: 'title',
        label: 'Título da Não Conformidade',
        type: 'input',
        placeholder: 'Ex: Procedimento X não seguido na inspeção Y',
        required: true
      },
      {
        key: 'description',
        label: 'Descrição',
        type: 'textarea',
        placeholder: 'Descreva o que aconteceu e onde foi identificado',
        required: false
      }
    ]
  },
  treinamentos: {
    title: 'Treinamentos - Primeiro Programa de Capacitação',
    icon: <Users className="h-5 w-5" />,
    color: 'text-orange-600',
    explanation: 'Programas de treinamento desenvolvem sua equipe e garantem competências necessárias. Um time bem treinado é mais produtivo e seguro.',
    table: 'training_programs',
    fields: [
      {
        key: 'title',
        label: 'Nome do Treinamento',
        type: 'input',
        placeholder: 'Ex: Segurança do Trabalho - CIPA',
        required: true
      },
      {
        key: 'duration_hours',
        label: 'Carga Horária',
        type: 'number',
        placeholder: '40',
        required: true
      }
    ]
  },
  documentos: {
    title: 'Documentos - Primeiro Documento Importante',
    icon: <FileText className="h-5 w-5" />,
    color: 'text-indigo-600',
    explanation: 'A gestão documental organiza e controla documentos importantes como políticas, procedimentos e certificados.',
    table: 'documents',
    fields: [
      {
        key: 'file_name',
        label: 'Nome do Documento',
        type: 'input',
        placeholder: 'Ex: Política de Sustentabilidade',
        required: true
      },
      {
        key: 'category',
        label: 'Categoria',
        type: 'select',
        options: [
          { value: 'policy', label: 'Política' },
          { value: 'procedure', label: 'Procedimento' },
          { value: 'certificate', label: 'Certificado' },
          { value: 'report', label: 'Relatório' }
        ],
        required: true
      }
    ]
  }
};

export function GuidedDataCreationStep({ 
  selectedModules, 
  moduleConfigurations, 
  onConfigurationChange, 
  onNext, 
  onPrev 
}: GuidedDataCreationStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createdData, setCreatedData] = useState<Record<string, any>>({});

  const availableModules = selectedModules.filter(moduleId => 
    MODULE_DATA_CREATION[moduleId]
  );

  const currentModule = availableModules[currentModuleIndex];
  const moduleConfig = currentModule ? MODULE_DATA_CREATION[currentModule] : null;

  useEffect(() => {
    // Load existing form data
    if (currentModule && moduleConfigurations[currentModule]) {
      setFormData(moduleConfigurations[currentModule] || {});
    } else {
      setFormData({});
    }
  }, [currentModule, moduleConfigurations]);

  const updateFieldValue = (fieldKey: string, value: any) => {
    const updatedData = { ...formData, [fieldKey]: value };
    setFormData(updatedData);
    onConfigurationChange(currentModule, updatedData);
  };

  const isCurrentModuleComplete = () => {
    if (!moduleConfig) return false;
    
    return moduleConfig.fields
      .filter(field => field.required)
      .every(field => formData[field.key] && formData[field.key].toString().trim() !== '');
  };

  const createRealData = async () => {
    if (!moduleConfig || !isCurrentModuleComplete()) return;

    setIsCreating(true);
    try {
      let insertData = { ...formData };
      
      // Add required fields based on module type
      switch (currentModule) {
        case 'inventario_gee':
          insertData = {
            ...insertData,
            scope: 1,
            status: 'active'
          };
          break;
        case 'gestao_licencas':
          insertData = {
            ...insertData,
            status: 'Ativa',
            license_type: 'Operação'
          };
          break;
        case 'sistema_qualidade':
          insertData = {
            ...insertData,
            status: 'Aberta',
            severity: 'Média',
            source: 'Onboarding'
          };
          break;
        case 'treinamentos':
          insertData = {
            ...insertData,
            status: 'Planejado',
            target_audience: 'Geral'
          };
          break;
        case 'documentos':
          insertData = {
            ...insertData,
            status: 'active',
            file_path: '/placeholder-document.pdf',
            file_size: 1024
          };
          break;
      }

      const { data, error } = await supabase
        .from(moduleConfig.table as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setCreatedData(prev => ({ ...prev, [currentModule]: data }));
      
      toast({
        title: 'Dados Criados!',
        description: `${moduleConfig.title.split(' - ')[0]} configurado com sucesso.`
      });

    } catch (error) {
      console.error('Error creating data:', error);
      toast({
        title: 'Erro ao criar dados',
        description: 'Tente novamente ou pule esta etapa.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const goToNextModule = async () => {
    if (isCurrentModuleComplete()) {
      await createRealData();
    }
    
    if (currentModuleIndex < availableModules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    } else {
      onNext();
    }
  };

  const goToPrevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
    } else {
      onPrev();
    }
  };

  const getCompletedModulesCount = () => {
    return Object.keys(createdData).length;
  };

  const renderField = (field: ModuleField) => {
    const value = formData[field.key] || '';

    switch (field.type) {
      case 'input':
        return (
          <Input
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateFieldValue(field.key, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select 
            value={value || ''} 
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required={field.required}
          >
            <option value="">Selecione uma opção</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateFieldValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );
      
      default:
        return null;
    }
  };

  if (!moduleConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Módulos não encontrados</h3>
            <p className="text-muted-foreground mb-4">Nenhum módulo selecionado precisa de configuração.</p>
            <Button onClick={onNext}>Continuar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = ((currentModuleIndex + 1) / availableModules.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-primary/10 ${moduleConfig.color}`}>
                    {moduleConfig.icon}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">
                      Criação de Dados ({currentModuleIndex + 1}/{availableModules.length})
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {getCompletedModulesCount()} módulo(s) já configurado(s)
                    </p>
                  </div>
                </div>
                
                <Badge variant="outline" className="px-3 py-1">
                  {Math.round(progressPercentage)}% concluído
                </Badge>
              </div>
              
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Main Configuration */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-primary/10 ${moduleConfig.color} flex-shrink-0`}>
                {moduleConfig.icon}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl">
                  {moduleConfig.title}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <p className="text-muted-foreground leading-relaxed">
                    {moduleConfig.explanation}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-6 max-w-2xl">
              {moduleConfig.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Success Message if data created */}
            {createdData[currentModule] && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">
                    Dados criados com sucesso! Você pode continuar para o próximo módulo.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={goToPrevModule}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentModuleIndex === 0 ? 'Voltar' : 'Módulo Anterior'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {isCurrentModuleComplete() ? 
                'Pronto para continuar' : 
                'Preencha os campos obrigatórios'
              }
            </p>
          </div>

          <Button 
            onClick={goToNextModule}
            disabled={!isCurrentModuleComplete() || isCreating}
          >
            {isCreating ? 'Criando...' : (
              currentModuleIndex === availableModules.length - 1 ? 'Finalizar' : 'Próximo Módulo'
            )}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}