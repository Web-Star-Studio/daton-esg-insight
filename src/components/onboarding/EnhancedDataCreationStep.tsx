import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Lightbulb, 
  Leaf, Shield, Users, FileText, BarChart3, GraduationCap, 
  FolderOpen, Award, Target, Clock, Info, Zap
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EnhancedDataCreationStepProps {
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
  help?: string;
  example?: string;
}

interface ModuleConfig {
  title: string;
  shortTitle: string;
  icon: JSX.Element;
  color: string;
  explanation: string;
  benefit: string;
  table: string;
  fields: ModuleField[];
  estimatedTime: string;
}

const MODULE_DATA_CREATION: Record<string, ModuleConfig> = {
  inventario_gee: {
    title: 'Inventário GEE - Primeira Fonte de Emissão',
    shortTitle: 'Inventário GEE',
    icon: <Leaf className="h-5 w-5" />,
    color: 'text-green-600',
    explanation: 'Fontes de emissão são locais ou equipamentos que geram gases de efeito estufa. Esta será a base do seu inventário GEE.',
    benefit: 'Com isso você poderá calcular automaticamente suas emissões e gerar relatórios de sustentabilidade.',
    table: 'emission_sources',
    estimatedTime: '2 min',
    fields: [
      {
        key: 'name',
        label: 'Nome da Fonte de Emissão',
        type: 'input',
        placeholder: 'Ex: Frota de Caminhões - Matriz SP',
        required: true,
        help: 'Dê um nome claro e específico para identificar facilmente esta fonte',
        example: 'Frota de Caminhões - Matriz SP'
      },
      {
        key: 'category',
        label: 'Categoria da Fonte',
        type: 'select',
        options: [
          { value: 'mobile', label: '🚛 Móvel (veículos, equipamentos móveis)' },
          { value: 'stationary', label: '🏭 Fixa (caldeiras, geradores, fornos)' },
          { value: 'fugitive', label: '💨 Fugitiva (vazamentos, emissões de processo)' }
        ],
        required: true,
        help: 'Selecione a categoria que melhor descreve sua fonte de emissão'
      }
    ]
  },
  gestao_licencas: {
    title: 'Gestão de Licenças - Primeira Licença Ambiental',
    shortTitle: 'Licenças Ambientais',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-600',
    explanation: 'Licenças ambientais são documentos legais obrigatórios. O controle adequado evita multas e garante compliance.',
    benefit: 'O sistema enviará alertas automáticos antes do vencimento e organizará toda documentação.',
    table: 'environmental_licenses',
    estimatedTime: '1 min',
    fields: [
      {
        key: 'license_name',
        label: 'Nome da Licença',
        type: 'input',
        placeholder: 'Ex: Licença de Operação - CETESB',
        required: true,
        help: 'Nome completo conforme documento oficial',
        example: 'Licença de Operação - CETESB'
      },
      {
        key: 'expiration_date',
        label: 'Data de Vencimento',
        type: 'date',
        required: true,
        help: 'Data em que a licença expira (você receberá alertas automáticos)'
      }
    ]
  },
  sistema_qualidade: {
    title: 'Sistema de Qualidade - Primeira Não Conformidade',
    shortTitle: 'Sistema de Qualidade',
    icon: <Award className="h-5 w-5" />,
    color: 'text-purple-600',
    explanation: 'Não conformidades são desvios de procedimentos que precisam ser corrigidos para melhoria contínua.',
    benefit: 'Registrar e tratar adequadamente melhora seus processos e garante qualidade consistente.',
    table: 'non_conformities',
    estimatedTime: '2 min',
    fields: [
      {
        key: 'title',
        label: 'Título da Não Conformidade',
        type: 'input',
        placeholder: 'Ex: Procedimento de inspeção não seguido na linha 2',
        required: true,
        help: 'Título claro e específico do problema identificado',
        example: 'Procedimento de inspeção não seguido na linha 2'
      },
      {
        key: 'description',
        label: 'Descrição Detalhada',
        type: 'textarea',
        placeholder: 'Descreva o que aconteceu, onde foi identificado e qual o impacto...',
        required: false,
        help: 'Detalhe o problema para facilitar a análise e correção'
      }
    ]
  },
  treinamentos: {
    title: 'Treinamentos - Primeiro Programa de Capacitação',
    shortTitle: 'Treinamentos',
    icon: <GraduationCap className="h-5 w-5" />,
    color: 'text-orange-600',
    explanation: 'Programas de treinamento desenvolvem competências e garantem que sua equipe esteja sempre atualizada.',
    benefit: 'Equipes bem treinadas são mais produtivas, seguras e engajadas.',
    table: 'training_programs',
    estimatedTime: '2 min',
    fields: [
      {
        key: 'title',
        label: 'Nome do Treinamento',
        type: 'input',
        placeholder: 'Ex: Segurança do Trabalho - NR-35',
        required: true,
        help: 'Nome do programa de treinamento ou curso',
        example: 'Segurança do Trabalho - NR-35'
      },
      {
        key: 'duration_hours',
        label: 'Carga Horária (horas)',
        type: 'number',
        placeholder: '40',
        required: true,
        help: 'Quantidade total de horas do treinamento'
      }
    ]
  },
  documentos: {
    title: 'Documentos - Primeiro Documento Estratégico',
    shortTitle: 'Gestão Documental',
    icon: <FolderOpen className="h-5 w-5" />,
    color: 'text-indigo-600',
    explanation: 'A gestão documental organiza e controla documentos importantes como políticas, procedimentos e certificados.',
    benefit: 'Facilita acesso, garante versionamento correto e automatiza aprovações.',
    table: 'documents',
    estimatedTime: '1 min',
    fields: [
      {
        key: 'file_name',
        label: 'Nome do Documento',
        type: 'input',
        placeholder: 'Ex: Política de Sustentabilidade 2024',
        required: true,
        help: 'Nome descritivo do documento',
        example: 'Política de Sustentabilidade 2024'
      },
      {
        key: 'category',
        label: 'Categoria do Documento',
        type: 'select',
        options: [
          { value: 'policy', label: '📋 Política (diretrizes estratégicas)' },
          { value: 'procedure', label: '⚙️ Procedimento (passo a passo)' },
          { value: 'certificate', label: '🏆 Certificado (ISO, licenças)' },
          { value: 'report', label: '📊 Relatório (análises, resultados)' }
        ],
        required: true,
        help: 'Tipo de documento para melhor organização'
      }
    ]
  },
  gestao_desempenho: {
    title: 'Gestão de Desempenho - Primeira Competência',
    shortTitle: 'Gestão de Desempenho',
    icon: <Users className="h-5 w-5" />,
    color: 'text-purple-600',
    explanation: 'Competências definem habilidades necessárias para cada função e orientam desenvolvimento profissional.',
    benefit: 'Permite avaliações objetivas, desenvolvimento direcionado e crescimento estruturado da equipe.',
    table: 'competency_matrix',
    estimatedTime: '2 min',
    fields: [
      {
        key: 'competency_name',
        label: 'Nome da Competência',
        type: 'input',
        placeholder: 'Ex: Liderança e Gestão de Equipes',
        required: true,
        help: 'Nome claro da competência ou habilidade',
        example: 'Liderança e Gestão de Equipes'
      },
      {
        key: 'competency_category',
        label: 'Categoria',
        type: 'select',
        options: [
          { value: 'technical', label: '⚙️ Técnica (conhecimentos específicos)' },
          { value: 'behavioral', label: '🤝 Comportamental (soft skills)' },
          { value: 'leadership', label: '👑 Liderança (gestão e direção)' }
        ],
        required: true,
        help: 'Tipo de competência para organização adequada'
      }
    ]
  },
  metas_sustentabilidade: {
    title: 'Metas de Sustentabilidade - Primeira Meta ESG',
    shortTitle: 'Metas ESG',
    icon: <Target className="h-5 w-5" />,
    color: 'text-emerald-600',
    explanation: 'Metas ESG orientam sua estratégia de sustentabilidade e podem estar alinhadas aos Objetivos de Desenvolvimento Sustentável (ODS).',
    benefit: 'Permite acompanhar progresso, demonstrar compromisso e gerar relatórios de sustentabilidade.',
    table: 'sustainability_goals',
    estimatedTime: '2 min',
    fields: [
      {
        key: 'goal_name',
        label: 'Nome da Meta',
        type: 'input',
        placeholder: 'Ex: Reduzir emissões de CO2 em 30% até 2025',
        required: true,
        help: 'Meta clara e específica com prazo definido',
        example: 'Reduzir emissões de CO2 em 30% até 2025'
      },
      {
        key: 'target_date',
        label: 'Data Meta',
        type: 'date',
        required: true,
        help: 'Prazo para alcançar esta meta'
      }
    ]
  },
  gestao_riscos: {
    title: 'Gestão de Riscos - Primeiro Risco Identificado',
    shortTitle: 'Gestão de Riscos',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-red-600',
    explanation: 'Identificar riscos operacionais e estratégicos é essencial para prevenir problemas e proteger o negócio.',
    benefit: 'Antecipação de problemas, redução de impactos e tomada de decisão mais segura.',
    table: 'risk_assessments',
    estimatedTime: '3 min',
    fields: [
      {
        key: 'risk_description',
        label: 'Descrição do Risco',
        type: 'input',
        placeholder: 'Ex: Falha no sistema de backup de dados',
        required: true,
        help: 'Descreva o risco de forma clara e específica',
        example: 'Falha no sistema de backup de dados'
      },
      {
        key: 'impact_level',
        label: 'Nível de Impacto',
        type: 'select',
        options: [
          { value: 'low', label: '🟢 Baixo (impacto mínimo)' },
          { value: 'medium', label: '🟡 Médio (impacto moderado)' },
          { value: 'high', label: '🔴 Alto (impacto significativo)' }
        ],
        required: true,
        help: 'Qual seria o impacto se este risco se concretizasse?'
      }
    ]
  },
  relatorios_esg: {
    title: 'Relatórios ESG - Primeiro Indicador',
    shortTitle: 'Relatórios ESG',
    icon: <BarChart3 className="h-5 w-5" />,
    color: 'text-cyan-600',
    explanation: 'Indicadores ESG são métricas que demonstram performance em sustentabilidade, social e governança.',
    benefit: 'Facilita geração automática de relatórios GRI, SASB e outros padrões internacionais.',
    table: 'esg_indicators',
    estimatedTime: '2 min',
    fields: [
      {
        key: 'indicator_name',
        label: 'Nome do Indicador',
        type: 'input',
        placeholder: 'Ex: Consumo de Energia Elétrica (kWh/mês)',
        required: true,
        help: 'Nome claro do indicador com unidade de medida',
        example: 'Consumo de Energia Elétrica (kWh/mês)'
      },
      {
        key: 'category',
        label: 'Categoria ESG',
        type: 'select',
        options: [
          { value: 'environmental', label: '🌱 Environmental (meio ambiente)' },
          { value: 'social', label: '👥 Social (pessoas e comunidade)' },
          { value: 'governance', label: '⚖️ Governance (governança)' }
        ],
        required: true,
        help: 'Classificação ESG do indicador'
      }
    ]
  }
};

export function EnhancedDataCreationStep({ 
  selectedModules, 
  moduleConfigurations, 
  onConfigurationChange, 
  onNext, 
  onPrev 
}: EnhancedDataCreationStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createdData, setCreatedData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableModules = selectedModules.filter(moduleId => 
    MODULE_DATA_CREATION[moduleId]
  );

  const currentModule = availableModules[currentModuleIndex];
  const moduleConfig = currentModule ? MODULE_DATA_CREATION[currentModule] : null;

  useEffect(() => {
    if (currentModule && moduleConfigurations[currentModule]) {
      setFormData(moduleConfigurations[currentModule] || {});
    } else {
      setFormData({});
    }
    setErrors({});
  }, [currentModule, moduleConfigurations]);

  const updateFieldValue = (fieldKey: string, value: any) => {
    const updatedData = { ...formData, [fieldKey]: value };
    setFormData(updatedData);
    onConfigurationChange(currentModule, updatedData);
    
    // Clear field error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  const validateForm = () => {
    if (!moduleConfig) return false;
    
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    moduleConfig.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.key];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.key] = `${field.label} é obrigatório`;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const isCurrentModuleComplete = () => {
    if (!moduleConfig) return false;
    return validateForm();
  };

  const createRealData = async () => {
    if (!moduleConfig || !validateForm()) return;

    setIsCreating(true);
    try {
      let insertData = { ...formData };
      
      // Add required fields based on module type
      switch (currentModule) {
        case 'inventario_gee':
          insertData = {
            ...insertData,
            scope: 1,
            status: 'active',
            // company_id will be set by RLS policy
          };
          break;
        case 'gestao_licencas':
          insertData = {
            ...insertData,
            status: 'Ativa',
            license_type: 'Operação',
            // company_id will be set by RLS policy
          };
          break;
        case 'sistema_qualidade':
          insertData = {
            ...insertData,
            status: 'Aberta',
            severity: 'Média',
            source: 'Onboarding',
            // company_id will be set by RLS policy
          };
          break;
        case 'treinamentos':
          insertData = {
            ...insertData,
            status: 'Planejado',
            target_audience: 'Geral',
            // company_id will be set by RLS policy
          };
          break;
        case 'documentos':
          insertData = {
            ...insertData,
            status: 'active',
            file_path: '/placeholder-document.pdf',
            file_size: 1024,
            // company_id will be set by RLS policy
          };
          break;
        case 'gestao_desempenho':
          insertData = {
            ...insertData,
            description: `Competência criada durante onboarding - ${formData.competency_name}`,
            levels: [
              { level: 1, description: 'Básico' },
              { level: 2, description: 'Intermediário' },
              { level: 3, description: 'Avançado' }
            ],
            is_active: true,
            company_id: user?.user_metadata?.company_id
          };
          break;
        case 'metas_sustentabilidade':
          insertData = {
            ...insertData,
            status: 'active',
            progress_percentage: 0,
            company_id: user?.user_metadata?.company_id
          };
          break;
        case 'gestao_riscos':
          insertData = {
            ...insertData,
            probability: 'medium',
            status: 'identified',
            company_id: user?.user_metadata?.company_id
          };
          break;
        case 'relatorios_esg':
          insertData = {
            ...insertData,
            current_value: 0,
            unit: 'unit',
            reporting_period: 'monthly',
            company_id: user?.user_metadata?.company_id
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
        title: '✅ Dados Criados com Sucesso!',
        description: `${moduleConfig.shortTitle} configurado e pronto para uso.`
      });

    } catch (error: any) {
      console.error('Error creating data:', error);
      toast({
        title: 'Erro ao criar dados',
        description: error?.message || 'Tente novamente ou pule esta etapa.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const goToNextModule = async () => {
    if (validateForm()) {
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

  const skipCurrentModule = () => {
    if (currentModuleIndex < availableModules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    } else {
      onNext();
    }
  };

  const getCompletedModulesCount = () => {
    return Object.keys(createdData).length;
  };

  const renderField = (field: ModuleField) => {
    const value = formData[field.key] || '';
    const hasError = !!errors[field.key];

    switch (field.type) {
      case 'input':
        return (
          <div className="space-y-2">
            <Input
              value={value}
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => updateFieldValue(field.key, parseInt(e.target.value) || 0)}
              placeholder={field.placeholder}
              required={field.required}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      
      case 'date':
        return (
          <div className="space-y-2">
            <Input
              type="date"
              value={value}
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              required={field.required}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-2">
            <select 
              value={value || ''} 
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                hasError ? 'border-destructive' : 'border-input'
              }`}
              required={field.required}
            >
              <option value="">Selecione uma opção</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      
      case 'textarea':
        return (
          <div className="space-y-2">
            <Textarea
              value={value}
              onChange={(e) => updateFieldValue(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && (
              <p className="text-sm text-destructive">{errors[field.key]}</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!moduleConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold">Todos os módulos configurados!</h3>
            <p className="text-muted-foreground">Não há módulos adicionais para configurar.</p>
            <Button onClick={onNext}>Finalizar Setup</Button>
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
                
                <div className="text-right space-y-1">
                  <Badge variant="outline" className="px-3 py-1">
                    {Math.round(progressPercentage)}% concluído
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>~{moduleConfig.estimatedTime}</span>
                  </div>
                </div>
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
              <div className="space-y-3 flex-1">
                <CardTitle className="text-2xl">
                  {moduleConfig.title}
                </CardTitle>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <p className="mb-2">{moduleConfig.explanation}</p>
                    <p className="font-medium text-blue-900">💡 {moduleConfig.benefit}</p>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-6 max-w-2xl">
              {moduleConfig.fields.map((field) => (
                <div key={field.key} className="space-y-3">
                  <Label htmlFor={field.key} className="flex items-center gap-2 text-base font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  
                  {field.help && (
                    <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
                      <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{field.help}</p>
                        {field.example && (
                          <p className="text-xs text-amber-700 font-medium">
                            Exemplo: {field.example}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {renderField(field)}
                </div>
              ))}
            </div>

            {/* Success Message if data created */}
            {createdData[currentModule] && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      ✅ Dados criados com sucesso! Você pode continuar para o próximo módulo.
                    </span>
                    <Badge className="bg-green-600 hover:bg-green-700">
                      <Zap className="w-3 h-3 mr-1" />
                      Pronto
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {Object.keys(errors).length > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Por favor, preencha todos os campos obrigatórios antes de continuar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={goToPrevModule} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentModuleIndex === 0 ? 'Voltar' : 'Módulo Anterior'}
          </Button>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={skipCurrentModule}
              className="text-muted-foreground hover:text-foreground"
            >
              Pular este módulo
            </Button>
            
            <Button 
              onClick={goToNextModule}
              disabled={isCreating}
              size="lg"
              className="min-w-48"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Criando dados...
                </>
              ) : (
                <>
                  {currentModuleIndex === availableModules.length - 1 ? 'Finalizar Setup' : 'Próximo Módulo'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}