import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  MessageCircle, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Bot, 
  Brain, 
  TrendingUp, 
  Zap, 
  Target,
  FileText,
  AlertTriangle,
  CheckCircle,
  Settings,
  Mic,
  MicOff,
  Download,
  Share,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  Star,
  Lightbulb
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'recommendation' | 'alert' | 'insight';
  confidence?: number;
  sources?: string[];
  actions?: AIAction[];
  metadata?: {
    analysisTime?: number;
    dataPoints?: number;
    relevanceScore?: number;
    context?: string;
  };
  feedback?: {
    helpful: boolean;
    rating?: number;
  };
}

interface AIAction {
  id: string;
  label: string;
  type: 'navigate' | 'create' | 'analyze' | 'export' | 'schedule';
  url?: string;
  data?: any;
  icon?: any;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
}

const AI_CAPABILITIES: AICapability[] = [
  {
    id: 'data-analysis',
    name: 'Análise de Dados',
    description: 'Análise inteligente de métricas ESG e tendências',
    enabled: true,
    icon: TrendingUp
  },
  {
    id: 'compliance-check',
    name: 'Verificação de Compliance',
    description: 'Monitoramento automático de conformidade regulatória',
    enabled: true,
    icon: CheckCircle
  },
  {
    id: 'predictive-insights',
    name: 'Insights Preditivos',
    description: 'Previsões baseadas em padrões históricos',
    enabled: true,
    icon: Brain
  },
  {
    id: 'risk-assessment',
    name: 'Avaliação de Riscos',
    description: 'Identificação proativa de riscos ESG',
    enabled: true,
    icon: AlertTriangle
  },
  {
    id: 'goal-tracking',
    name: 'Acompanhamento de Metas',
    description: 'Monitoramento inteligente do progresso das metas',
    enabled: true,
    icon: Target
  },
  {
    id: 'report-generation',
    name: 'Geração de Relatórios',
    description: 'Criação automática de relatórios personalizados',
    enabled: true,
    icon: FileText
  }
];

const QUICK_PROMPTS = [
  {
    text: "Analise o desempenho ESG da empresa este mês",
    icon: TrendingUp,
    category: 'analysis'
  },
  {
    text: "Quais licenças estão próximas do vencimento?",
    icon: AlertTriangle,
    category: 'compliance'
  },
  {
    text: "Como estão as metas de redução de carbono?",
    icon: Target,
    category: 'goals'
  },
  {
    text: "Gere um resumo dos principais riscos identificados",
    icon: FileText,
    category: 'reports'
  },
  {
    text: "Sugira ações para melhorar nossa pontuação ESG",
    icon: Lightbulb,
    category: 'recommendations'
  },
  {
    text: "Identifique oportunidades de melhoria nos dados",
    icon: Zap,
    category: 'insights'
  }
];

export function EnhancedAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [capabilities, setCapabilities] = useState<AICapability[]>(AI_CAPABILITIES);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { getFromCache, setInCache } = useIntelligentCache();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Advanced AI response generation with context awareness
  const generateAIResponse = async (userMessage: string): Promise<AIMessage> => {
    const analysisStartTime = Date.now();
    
    // Simulate advanced AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const analysisTime = Date.now() - analysisStartTime;
    const contextInfo = getPageContext();
    
    // Generate contextual response based on user input
    let response = '';
    let type: AIMessage['type'] = 'text';
    let confidence = 0.8;
    let actions: AIAction[] = [];
    let sources: string[] = [];

    if (userMessage.toLowerCase().includes('análise') || userMessage.toLowerCase().includes('desempenho')) {
      type = 'analysis';
      confidence = 0.9;
      response = `📊 **Análise de Performance ESG**

Com base nos dados mais recentes da sua empresa, identifiquei os seguintes pontos:

**Destaques Positivos:**
• Score ESG atual: 85.2 (+5.3% vs mês anterior)
• Taxa de reciclagem: 92% (superando meta de 85%)
• Redução de emissões Escopo 1: 12% este ano

**Áreas de Atenção:**
• 3 licenças ambientais vencem nos próximos 60 dias
• Meta de energia renovável em 68% (objetivo: 75%)
• Diversidade na liderança precisa de atenção

**Recomendações Imediatas:**
1. Renovar licenças identificadas
2. Acelerar investimentos em energia solar
3. Implementar programa de diversidade executiva

*Análise baseada em 15.847 pontos de dados coletados em tempo real.*`;
      
      actions = [
        { id: '1', label: 'Ver Licenças', type: 'navigate', url: '/licenciamento', icon: FileText },
        { id: '2', label: 'Metas Energia', type: 'navigate', url: '/metas', icon: Target },
        { id: '3', label: 'Exportar Análise', type: 'export', icon: Download }
      ];
      
      sources = ['Dashboard ESG', 'Inventário GEE', 'Sistema de Licenças', 'Base de Metas'];
    }
    
    else if (userMessage.toLowerCase().includes('licença') || userMessage.toLowerCase().includes('vencimento')) {
      type = 'alert';
      confidence = 0.95;
      response = `⚠️ **Alertas de Licenças e Autorizações**

Identifiquei situações que requerem atenção imediata:

**🔴 Crítico (Próximos 30 dias):**
• Licença de Operação Ambiental - Vence em 23 dias
• Autorização para Emissões Atmosféricas - Vence em 28 dias

**🟡 Atenção (30-90 dias):**
• Licença de Transporte de Resíduos - Vence em 45 dias
• Certificação ISO 14001 - Vence em 67 dias
• Autorização IBAMA - Vence em 82 dias

**✅ Ações Sugeridas:**
1. Iniciar processo de renovação das licenças críticas hoje
2. Contatar consultoria ambiental para ISO 14001
3. Agendar vistoria prévia do IBAMA

*Sistema monitorando 24 licenças ativas automaticamente.*`;
      
      actions = [
        { id: '1', label: 'Abrir Licenças', type: 'navigate', url: '/licenciamento', icon: FileText },
        { id: '2', label: 'Agendar Renovação', type: 'schedule', icon: CheckCircle }
      ];
    }
    
    else if (userMessage.toLowerCase().includes('meta') || userMessage.toLowerCase().includes('objetivo')) {
      type = 'recommendation';
      confidence = 0.85;
      response = `🎯 **Status das Metas ESG 2024**

Análise inteligente do progresso das suas metas de sustentabilidade:

**🟢 No Prazo:**
• Redução CO₂: 68% concluído (meta: 15% até dez/2024)
• Taxa de Reciclagem: 112% da meta anual
• Treinamentos ESG: 89% dos funcionários capacitados

**🟡 Requer Atenção:**
• Energia Renovável: 45% (meta: 60% até dez/2024)
• Diversidade Liderança: 32% (meta: 40% até dez/2024)

**🔴 Crítica:**
• Auditoria ISO 45001: 23% concluída (prazo em 90 dias)

**🚀 Otimizações Sugeridas:**
1. Acelerar instalação de painéis solares (+15% energia renovável)
2. Programa de desenvolvimento de liderança feminina
3. Cronograma intensivo para auditoria ISO 45001

*IA analisou 847 indicadores para gerar estas recomendações.*`;
      
      actions = [
        { id: '1', label: 'Ver Todas as Metas', type: 'navigate', url: '/metas', icon: Target },
        { id: '2', label: 'Criar Nova Meta', type: 'navigate', url: '/metas/nova', icon: Zap }
      ];
    }
    
    else {
      // General AI assistant response
      response = `🤖 **Assistente ESG Inteligente**

Estou aqui para ajudar você com:

• **Análises em Tempo Real**: Dados ESG, tendências e insights
• **Compliance Automático**: Monitoramento de licenças e regulamentações  
• **Metas Inteligentes**: Acompanhamento e otimização de objetivos
• **Relatórios Dinâmicos**: Geração automática personalizada
• **Alertas Preditivos**: Identificação precoce de riscos

Como posso ajudar você hoje? Experimente perguntar sobre:
- "Como está nossa performance ESG?"
- "Quais riscos foram identificados?"
- "Preciso renovar alguma licença?"
- "Como criar um relatório de sustentabilidade?"

*Conectado a todos os dados da empresa em tempo real.*`;
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type,
      confidence,
      sources,
      actions,
      metadata: {
        analysisTime,
        dataPoints: Math.floor(Math.random() * 20000) + 5000,
        relevanceScore: confidence,
        context: contextInfo
      }
    };
  };

  const getPageContext = () => {
    const path = location.pathname;
    if (path.includes('licenciamento')) return 'Módulo de Licenciamento';
    if (path.includes('metas')) return 'Sistema de Metas ESG';
    if (path.includes('inventario')) return 'Inventário de Emissões GEE';
    if (path.includes('documentos')) return 'Gestão Documental';
    if (path.includes('auditoria')) return 'Sistema de Auditoria';
    if (path.includes('esg')) return 'Central ESG';
    return 'Dashboard Principal';
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check cache for similar questions
      const cacheKey = `ai-response:${messageText.toLowerCase()}`;
      let aiResponse = getFromCache(cacheKey);

      if (!aiResponse) {
        aiResponse = await generateAIResponse(messageText);
        setInCache(cacheKey, aiResponse, 'medium');
      }

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorResponse: AIMessage = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente em alguns instantes.',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (action: AIAction) => {
    switch (action.type) {
      case 'navigate':
        if (action.url) {
          navigate(action.url);
          setIsOpen(false);
        }
        break;
      case 'export':
        // Implement export functionality
        console.log('Export action:', action);
        break;
      case 'schedule':
        // Implement scheduling functionality
        console.log('Schedule action:', action);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedback: { helpful } }
        : msg
    ));
  };

  const toggleCapability = (capabilityId: string) => {
    setCapabilities(prev => prev.map(cap =>
      cap.id === capabilityId 
        ? { ...cap, enabled: !cap.enabled }
        : cap
    ));
  };

  const clearConversation = () => {
    setMessages([]);
  };

  // Floating AI button
  if (!isOpen) {
    return (
      <div className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 left-4 sm:left-auto">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:to-primary/70 group"
        >
          <div className="flex flex-col items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1 h-1 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs text-primary-foreground font-medium">IA</span>
            </div>
          </div>
        </Button>
      </div>
    );
  }

  // Enhanced AI Assistant Interface
  return (
    <div className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6 left-4 sm:left-auto">
        <Card 
          className={cn(
            "w-[480px] max-w-[calc(100vw-24px)] bg-background border shadow-2xl transition-all duration-300 overflow-hidden flex flex-col",
            isMinimized ? "h-20" : ""
          )}
          style={!isMinimized ? { maxHeight: 'calc(100vh - 3rem)' } : undefined}
        >
        {/* Enhanced Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">ESG Assistant Pro</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs px-2">
                  <Brain className="w-3 h-3 mr-1" />
                  IA Avançada
                </Badge>
                <Badge variant="outline" className="text-xs px-2">
                  Online
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="h-8 w-8 p-0"
              title="Limpar conversa"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
              title={isMinimized ? "Maximizar" : "Minimizar"}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Main Content - Hidden when minimized */}
        {!isMinimized && (
          <CardContent className="p-0 flex-1 flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-2 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chat" className="text-xs">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="capabilities" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Recursos
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Insights
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col mt-2 min-h-0">
                <div className="grid grid-rows-[1fr_auto] min-h-0 flex-1">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-4 pb-4">
                    {messages.length === 0 && (
                      <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Brain className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm mb-2">Assistente ESG Inteligente</h3>
                          <p className="text-xs text-muted-foreground mb-4">
                            Como posso ajudar você hoje? Experimente uma das sugestões abaixo:
                          </p>
                        </div>
                        
                        {/* Quick Prompts */}
                        <div className="grid grid-cols-1 gap-2">
                          {QUICK_PROMPTS.slice(0, 4).map((prompt, index) => {
                            const IconComponent = prompt.icon;
                            return (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendMessage(prompt.text)}
                                className="justify-start text-xs h-auto p-3 border-dashed"
                              >
                                <IconComponent className="w-3 h-3 mr-2 flex-shrink-0" />
                                <span className="text-left">{prompt.text}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === 'user' ? (
                          <div className="flex flex-col items-end max-w-[85%]">
                            <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2 text-sm">
                              {message.content}
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                              {message.timestamp.toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-3 max-w-[95%]">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Bot className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="bg-muted/50 rounded-2xl p-4 prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                              
                              {/* Message metadata */}
                              {message.metadata && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  {message.confidence && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3" />
                                      Confiança: {(message.confidence * 100).toFixed(0)}%
                                    </div>
                                  )}
                                  {message.metadata.analysisTime && (
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      {(message.metadata.analysisTime / 1000).toFixed(1)}s
                                    </div>
                                  )}
                                  {message.metadata.dataPoints && (
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      {message.metadata.dataPoints.toLocaleString()} dados
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Sources */}
                              {message.sources && message.sources.length > 0 && (
                                <div className="text-xs bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2 border-l-2 border-blue-500/30">
                                  <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                                    Fontes consultadas:
                                  </div>
                                  <div className="text-blue-600 dark:text-blue-400">
                                    {message.sources.join(' • ')}
                                  </div>
                                </div>
                              )}
                              
                              {/* Action buttons */}
                              {message.actions && message.actions.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Ações sugeridas:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {message.actions.map((action) => {
                                      const IconComponent = action.icon || Zap;
                                      return (
                                        <Button
                                          key={action.id}
                                          variant="outline"
                                          size="sm"
                                          className="h-8 text-xs"
                                          onClick={() => handleActionClick(action)}
                                        >
                                          <IconComponent className="w-3 h-3 mr-1" />
                                          {action.label}
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Feedback buttons */}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleFeedback(message.id, true)}
                                  >
                                    <ThumbsUp className={cn(
                                      "h-3 w-3",
                                      message.feedback?.helpful === true && "text-success fill-success"
                                    )} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleFeedback(message.id, false)}
                                  >
                                    <ThumbsDown className={cn(
                                      "h-3 w-3",
                                      message.feedback?.helpful === false && "text-destructive fill-destructive"
                                    )} />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-primary-foreground animate-pulse" />
                        </div>
                        <div className="bg-muted/50 rounded-2xl p-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <span className="text-muted-foreground text-xs">Analisando dados...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Enhanced Input */}
                <div className="p-4 border-t bg-muted/20 flex-shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Digite sua pergunta sobre ESG, compliance, metas..."
                        disabled={isLoading}
                        className="flex-1 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="px-3"
                        disabled={isLoading}
                        onClick={() => setIsListening(!isListening)}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button 
                        type="submit"
                        size="sm" 
                        disabled={isLoading || !inputValue.trim()}
                        className="px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        <span>IA conectada a todos os módulos ESG</span>
                      </div>
                      <span>Contexto: {getPageContext()}</span>
                    </div>
                  </form>
                </div>
                </div>
              </TabsContent>

              {/* Capabilities Tab */}
              <TabsContent value="capabilities" className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Recursos da IA</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Configure as capacidades do assistente de acordo com suas necessidades
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {capabilities.map((capability) => {
                      const IconComponent = capability.icon;
                      return (
                        <div key={capability.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <IconComponent className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <h4 className="text-sm font-medium">{capability.name}</h4>
                              <p className="text-xs text-muted-foreground">{capability.description}</p>
                            </div>
                          </div>
                          <Button
                            variant={capability.enabled ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCapability(capability.id)}
                            className="h-8"
                          >
                            {capability.enabled ? 'Ativo' : 'Inativo'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Insights Inteligentes</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Descobertas automáticas baseadas na análise contínua dos seus dados
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Card className="p-3 border-l-4 border-l-success">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Oportunidade Identificada</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Substituir 3 equipamentos antigos pode reduzir 18% do consumo energético
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 border-l-4 border-l-warning">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Tendência Detectada</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Aumento de 12% nas emissões nos últimos 30 dias - investigar causas
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-3 border-l-4 border-l-primary">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium">Sugestão de Melhoria</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Implementar dashboard para gestores aumentaria engajamento em 34%
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}