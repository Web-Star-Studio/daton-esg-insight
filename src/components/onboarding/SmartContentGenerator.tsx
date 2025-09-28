import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, Wand2, RefreshCw, CheckCircle2, Copy,
  FileText, MessageSquare, Lightbulb, Target, Zap,
  BarChart3, Users, Leaf, Award, Settings, Globe
} from 'lucide-react';

interface GeneratedContent {
  id: string;
  type: 'welcome_message' | 'module_description' | 'tips' | 'recommendations' | 'next_steps';
  content: string;
  personalization: {
    industry: string;
    companySize: string;
    goals: string[];
    tone: 'professional' | 'friendly' | 'technical';
  };
  metadata: {
    length: number;
    readingTime: number;
    keywords: string[];
    sentiment: 'positive' | 'neutral' | 'encouraging';
  };
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  type: GeneratedContent['type'];
  variables: string[];
  baseTemplate: string;
}

interface SmartContentGeneratorProps {
  currentStep: number;
  selectedModules: string[];
  companyProfile?: {
    name?: string;
    sector?: string;
    size?: string;
    goals?: string[];
    industry?: string;
  };
  userBehavior?: {
    preferredTone?: 'professional' | 'friendly' | 'technical';
    engagementLevel?: 'high' | 'medium' | 'low';
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
  onContentGenerated?: (content: GeneratedContent) => void;
  onContentApplied?: (contentId: string) => void;
}

const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'welcome_personalized',
    name: 'Boas-vindas Personalizadas',
    description: 'Mensagem de boas-vindas adaptada ao perfil da empresa',
    type: 'welcome_message',
    variables: ['company_name', 'industry', 'company_size', 'main_goals'],
    baseTemplate: `Bem-vindo ao Daton, {{company_name}}! 

Como empresa {{company_size}} do setor {{industry}}, você está no lugar certo para transformar sua gestão ESG. 

Nosso sistema foi especialmente desenhado para empresas como a sua, com foco em {{main_goals}}.

Vamos configurar sua plataforma de forma inteligente e eficiente!`
  },
  {
    id: 'module_recommendations',
    name: 'Recomendações de Módulos',
    description: 'Sugestões personalizadas baseadas no perfil da empresa',
    type: 'recommendations',
    variables: ['industry', 'company_size', 'compliance_needs', 'sustainability_goals'],
    baseTemplate: `Com base no perfil da sua empresa ({{industry}}, {{company_size}}), recomendamos especialmente:

🌱 **Inventário GEE**: Essencial para {{industry}}, permite monitoramento completo das emissões
📋 **Gestão de Licenças**: Fundamental para {{compliance_needs}} no seu setor
📊 **{{priority_module}}**: Altamente recomendado para {{sustainability_goals}}

Essas escolhas garantem compliance e maximizam o ROI inicial da plataforma.`
  },
  {
    id: 'next_steps_guide',
    name: 'Próximos Passos',
    description: 'Guia de próximos passos após completar o onboarding',
    type: 'next_steps',
    variables: ['selected_modules', 'company_goals', 'implementation_timeline'],
    baseTemplate: `Parabéns! Sua configuração inicial está completa. 

**Próximos passos recomendados:**

1. **Primeiros 7 dias**: Configure dados básicos em {{primary_module}}
2. **Semana 2-3**: Implemente workflows nos módulos {{selected_modules}}
3. **Mês 1**: Primeiro relatório ESG completo
4. **Mês 2-3**: Otimização e expansão baseada nos resultados

**Meta**: {{company_goals}} em {{implementation_timeline}}

Lembre-se: nossa equipe está disponível para suporte durante toda a jornada!`
  }
];

const INDUSTRY_CONTEXTS = {
  manufacturing: {
    priorities: ['compliance ambiental', 'emissões industriais', 'eficiência energética'],
    challenges: ['regulamentações rigorosas', 'complexidade operacional', 'múltiplas licenças'],
    opportunities: ['certificações ambientais', 'economia circular', 'inovação sustentável']
  },
  services: {
    priorities: ['capital humano', 'impacto social', 'governança corporativa'],
    challenges: ['diversidade e inclusão', 'retenção de talentos', 'transparência'],
    opportunities: ['cultura organizacional', 'responsabilidade social', 'stakeholder engagement']
  },
  retail: {
    priorities: ['cadeia de suprimentos', 'sustentabilidade de produtos', 'responsabilidade social'],
    challenges: ['rastreabilidade', 'fornecedores sustentáveis', 'consumo consciente'],
    opportunities: ['economia circular', 'produtos sustentáveis', 'engajamento do cliente']
  },
  technology: {
    priorities: ['inovação sustentável', 'governança de dados', 'impacto social'],
    challenges: ['consumo energético', 'obsolescência', 'inclusão digital'],
    opportunities: ['soluções verdes', 'transformação digital', 'acesso tecnológico']
  }
};

export function SmartContentGenerator({
  currentStep,
  selectedModules,
  companyProfile,
  userBehavior,
  onContentGenerated,
  onContentApplied
}: SmartContentGeneratorProps) {
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generationHistory, setGenerationHistory] = useState<string[]>([]);

  useEffect(() => {
    if (companyProfile && selectedModules.length > 0) {
      generateContextualContent();
    }
  }, [currentStep, selectedModules, companyProfile]);

  const generateContextualContent = async () => {
    setIsGenerating(true);
    
    // Simulate AI content generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const contents: GeneratedContent[] = [];
    
    // Generate step-specific content
    switch (currentStep) {
      case 0: // Welcome step
        contents.push(await generateWelcomeContent());
        break;
      case 1: // Module selection
        contents.push(await generateModuleRecommendations());
        break;
      case 2: // Configuration
        contents.push(await generateConfigurationTips());
        break;
      case 3: // Completion
        contents.push(await generateNextStepsGuide());
        break;
    }
    
    setGeneratedContents(contents);
    setIsGenerating(false);
    
    // Notify parent component
    contents.forEach(content => onContentGenerated?.(content));
  };

  const generateWelcomeContent = async (): Promise<GeneratedContent> => {
    const template = CONTENT_TEMPLATES.find(t => t.id === 'welcome_personalized')!;
    const industryContext = INDUSTRY_CONTEXTS[companyProfile?.industry as keyof typeof INDUSTRY_CONTEXTS] || INDUSTRY_CONTEXTS.services;
    
    let content = template.baseTemplate;
    
    // Replace template variables
    content = content.replace('{{company_name}}', companyProfile?.name || 'sua empresa');
    content = content.replace('{{industry}}', getIndustryName(companyProfile?.industry || ''));
    content = content.replace('{{company_size}}', getCompanySizeDescription(companyProfile?.size || ''));
    content = content.replace('{{main_goals}}', industryContext.priorities.slice(0, 2).join(' e '));
    
    // Add personalized touch based on user behavior
    if (userBehavior?.experienceLevel === 'beginner') {
      content += '\n\n💡 **Dica**: Como você está começando com ESG, preparamos um processo simplificado especialmente para você!';
    } else if (userBehavior?.experienceLevel === 'advanced') {
      content += '\n\n⚡ **Modo Avançado**: Detectamos experiência prévia. Você pode usar configurações avançadas para acelerar o processo!';
    }
    
    return {
      id: `welcome_${Date.now()}`,
      type: 'welcome_message',
      content,
      personalization: {
        industry: companyProfile?.industry || '',
        companySize: companyProfile?.size || '',
        goals: companyProfile?.goals || [],
        tone: userBehavior?.preferredTone || 'friendly'
      },
      metadata: {
        length: content.length,
        readingTime: Math.ceil(content.length / 200), // 200 chars per minute
        keywords: industryContext.priorities,
        sentiment: 'encouraging'
      }
    };
  };

  const generateModuleRecommendations = async (): Promise<GeneratedContent> => {
    const template = CONTENT_TEMPLATES.find(t => t.id === 'module_recommendations')!;
    const industryContext = INDUSTRY_CONTEXTS[companyProfile?.industry as keyof typeof INDUSTRY_CONTEXTS] || INDUSTRY_CONTEXTS.services;
    
    let content = template.baseTemplate;
    
    // Smart module recommendations based on industry
    const recommendedModules = getIndustryRecommendedModules(companyProfile?.industry || '');
    const priorityModule = recommendedModules[0];
    
    content = content.replace('{{industry}}', getIndustryName(companyProfile?.industry || ''));
    content = content.replace('{{company_size}}', getCompanySizeDescription(companyProfile?.size || ''));
    content = content.replace('{{compliance_needs}}', industryContext.challenges[0]);
    content = content.replace('{{sustainability_goals}}', industryContext.opportunities[0]);
    content = content.replace('{{priority_module}}', priorityModule.name);
    
    // Add specific benefits
    content += `\n\n**Benefícios esperados:**\n`;
    content += `• Redução de 30-50% no tempo de relatórios ESG\n`;
    content += `• Maior conformidade com ${industryContext.challenges[0]}\n`;
    content += `• Aumento da visibilidade em ${industryContext.opportunities[0]}`;
    
    return {
      id: `recommendations_${Date.now()}`,
      type: 'recommendations',
      content,
      personalization: {
        industry: companyProfile?.industry || '',
        companySize: companyProfile?.size || '',
        goals: companyProfile?.goals || [],
        tone: 'professional'
      },
      metadata: {
        length: content.length,
        readingTime: Math.ceil(content.length / 200),
        keywords: [...industryContext.priorities, 'módulos', 'recomendações'],
        sentiment: 'positive'
      }
    };
  };

  const generateConfigurationTips = async (): Promise<GeneratedContent> => {
    const tips = [
      '🚀 **Atalho Rápido**: Configure dados de exemplo para testar imediatamente cada funcionalidade',
      '⚙️ **Personalização**: Cada atalho pode ser customizado para sua rotina específica',
      '📊 **Dados Inteligentes**: O sistema aprende com seu uso e otimiza sugestões',
      '🔄 **Integração**: Atalhos se conectam automaticamente entre módulos relacionados',
      '📱 **Acesso Mobile**: Todos os atalhos funcionam perfeitamente em dispositivos móveis'
    ];
    
    // Filter tips based on selected modules
    const contextualTips = tips.slice(0, Math.min(3, selectedModules.length + 1));
    
    const content = `**Dicas para Configuração Eficiente:**\n\n${contextualTips.join('\n\n')}\n\n**Próximo passo**: Teste cada atalho configurado para garantir que atende suas necessidades!`;
    
    return {
      id: `tips_${Date.now()}`,
      type: 'tips',
      content,
      personalization: {
        industry: companyProfile?.industry || '',
        companySize: companyProfile?.size || '',
        goals: selectedModules,
        tone: userBehavior?.preferredTone || 'friendly'
      },
      metadata: {
        length: content.length,
        readingTime: Math.ceil(content.length / 200),
        keywords: ['atalhos', 'configuração', 'otimização'],
        sentiment: 'encouraging'
      }
    };
  };

  const generateNextStepsGuide = async (): Promise<GeneratedContent> => {
    const template = CONTENT_TEMPLATES.find(t => t.id === 'next_steps_guide')!;
    let content = template.baseTemplate;
    
    const primaryModule = getModuleName(selectedModules[0] || '');
    const modulesList = selectedModules.slice(1, 3).map(getModuleName).join(', ');
    
    content = content.replace('{{primary_module}}', primaryModule);
    content = content.replace('{{selected_modules}}', modulesList);
    content = content.replace('{{company_goals}}', companyProfile?.goals?.join(', ') || 'objetivos ESG');
    content = content.replace('{{implementation_timeline}}', '3-6 meses');
    
    // Add success metrics
    content += `\n\n**Métricas de Sucesso Esperadas:**\n`;
    content += `• ✅ Primeiro relatório ESG em 30 dias\n`;
    content += `• ✅ ROI positivo em 90 dias\n`;
    content += `• ✅ Compliance total em 180 dias\n`;
    content += `• ✅ Certificação ESG em 12 meses`;
    
    return {
      id: `next_steps_${Date.now()}`,
      type: 'next_steps',
      content,
      personalization: {
        industry: companyProfile?.industry || '',
        companySize: companyProfile?.size || '',
        goals: selectedModules,
        tone: 'professional'
      },
      metadata: {
        length: content.length,
        readingTime: Math.ceil(content.length / 200),
        keywords: ['próximos passos', 'implementação', 'sucesso'],
        sentiment: 'encouraging'
      }
    };
  };

  const generateCustomContent = async () => {
    if (!customPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate custom AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const content = `**Conteúdo Personalizado:**\n\n${customPrompt}\n\n*Este conteúdo foi gerado com base na sua solicitação específica e no contexto da sua empresa.*`;
    
    const customContent: GeneratedContent = {
      id: `custom_${Date.now()}`,
      type: 'tips',
      content,
      personalization: {
        industry: companyProfile?.industry || '',
        companySize: companyProfile?.size || '',
        goals: companyProfile?.goals || [],
        tone: userBehavior?.preferredTone || 'professional'
      },
      metadata: {
        length: content.length,
        readingTime: Math.ceil(content.length / 200),
        keywords: ['personalizado'],
        sentiment: 'neutral'
      }
    };
    
    setGeneratedContents(prev => [...prev, customContent]);
    setGenerationHistory(prev => [...prev, customPrompt]);
    setCustomPrompt('');
    setIsGenerating(false);
    
    onContentGenerated?.(customContent);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const applyContent = (contentId: string) => {
    onContentApplied?.(contentId);
  };

  // Helper functions
  const getIndustryName = (industry: string): string => {
    const names = {
      manufacturing: 'Industrial/Manufatura',
      services: 'Serviços',
      retail: 'Varejo',
      technology: 'Tecnologia'
    };
    return names[industry as keyof typeof names] || 'Geral';
  };

  const getCompanySizeDescription = (size: string): string => {
    const descriptions = {
      small: 'pequena',
      medium: 'média',
      large: 'grande'
    };
    return descriptions[size as keyof typeof descriptions] || 'média';
  };

  const getIndustryRecommendedModules = (industry: string) => {
    const modules = {
      manufacturing: [
        { id: 'inventario_gee', name: 'Inventário GEE' },
        { id: 'gestao_licencas', name: 'Gestão de Licenças' },
        { id: 'sistema_qualidade', name: 'Sistema de Qualidade' }
      ],
      services: [
        { id: 'gestao_desempenho', name: 'Gestão de Desempenho' },
        { id: 'treinamentos', name: 'Treinamentos' },
        { id: 'documentos', name: 'Gestão Documental' }
      ],
      retail: [
        { id: 'gestao_licencas', name: 'Gestão de Licenças' },
        { id: 'inventario_gee', name: 'Inventário GEE' },
        { id: 'relatorios_esg', name: 'Relatórios ESG' }
      ],
      technology: [
        { id: 'relatorios_esg', name: 'Relatórios ESG' },
        { id: 'gestao_desempenho', name: 'Gestão de Desempenho' },
        { id: 'documentos', name: 'Gestão Documental' }
      ]
    };
    
    return modules[industry as keyof typeof modules] || modules.services;
  };

  const getModuleName = (moduleId: string): string => {
    const names = {
      inventario_gee: 'Inventário GEE',
      gestao_licencas: 'Gestão de Licenças',
      sistema_qualidade: 'Sistema de Qualidade',
      gestao_desempenho: 'Gestão de Desempenho',
      treinamentos: 'Treinamentos',
      documentos: 'Gestão Documental',
      relatorios_esg: 'Relatórios ESG'
    };
    return names[moduleId as keyof typeof names] || moduleId;
  };

  const getContentIcon = (type: GeneratedContent['type']) => {
    switch (type) {
      case 'welcome_message': return <MessageSquare className="h-4 w-4" />;
      case 'recommendations': return <Target className="h-4 w-4" />;
      case 'tips': return <Lightbulb className="h-4 w-4" />;
      case 'next_steps': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Generator Controls */}
      <Card className="border-primary/20 bg-gradient-to-r from-purple/5 to-pink/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerador de Conteúdo Inteligente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Conteúdo personalizado baseado no perfil da sua empresa e contexto atual
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={generateContextualContent}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Gerar Conteúdo Contextual
                </>
              )}
            </Button>
          </div>
          
          {/* Custom Content Generation */}
          <div className="space-y-3">
            <Textarea
              placeholder="Solicite conteúdo específico (ex: 'Crie dicas para implementação rápida de inventário GEE')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-20"
            />
            <Button
              onClick={generateCustomContent}
              disabled={isGenerating || !customPrompt.trim()}
              variant="outline"
              size="sm"
            >
              <Zap className="h-3 w-3 mr-1" />
              Gerar Conteúdo Personalizado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Conteúdo Gerado
              <Badge variant="outline" className="ml-auto">
                {generatedContents.length} itens
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {generatedContents.map((content) => (
                <div
                  key={content.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border/50"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                          {getContentIcon(content.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground capitalize">
                            {content.type.replace('_', ' ')}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {content.metadata.readingTime} min leitura
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {content.personalization.tone}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {content.metadata.sentiment}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => copyToClipboard(content.content)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => applyContent(content.id)}
                          size="sm"
                          className="h-8"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <div className="p-3 bg-background rounded border border-border/30 text-sm text-foreground whitespace-pre-line">
                        {content.content}
                      </div>
                    </div>
                    
                    {content.metadata.keywords.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Palavras-chave:</span>
                        {content.metadata.keywords.slice(0, 5).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation History */}
      {generationHistory.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-800 text-sm">Histórico de Gerações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generationHistory.slice(-3).map((prompt, index) => (
                <div key={index} className="text-xs text-indigo-700 p-2 bg-white rounded border border-indigo-100">
                  "{prompt}"
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}