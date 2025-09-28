import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Bot, MessageSquare, Sparkles, Brain, Lightbulb, 
  Send, Minimize2, Maximize2, HelpCircle, Zap,
  TrendingUp, Target, Star, ArrowRight, CheckCircle2
} from 'lucide-react';

interface AIMessage {
  id: string;
  type: 'ai' | 'user' | 'suggestion';
  content: string;
  timestamp: Date;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'outline';
  }[];
}

interface IntelligentAIAssistantProps {
  currentStep: number;
  selectedModules: string[];
  companyProfile?: any;
  userBehavior: {
    hesitationPoints: number[];
    timeSpentPerStep: number[];
    questionsAsked: number;
  };
  onSuggestionAccepted?: (suggestionId: string) => void;
  onNavigateToStep?: (step: number) => void;
}

const AI_PERSONALITY = {
  name: 'Eva',
  role: 'Especialista ESG',
  avatar: '🤖',
  greeting: 'Olá! Eu sou a Eva, sua assistente ESG inteligente. Estou aqui para tornar sua configuração mais fácil e eficiente.'
};

const CONTEXTUAL_TIPS: Record<number, string[]> = {
  0: [
    'Dica: Responder ao questionário de perfil me permite dar sugestões mais precisas!',
    'Curiosidade: Empresas que fazem onboarding guiado têm 40% mais sucesso na implementação ESG.',
    'Sugestão: Mantenha seus documentos ambientais à mão - vamos precisar deles em breve.'
  ],
  1: [
    'Dica: Para iniciantes, recomendo começar com Inventário GEE e Gestão de Licenças.',
    'Insight: Empresas do seu setor costumam priorizar estes 3 módulos principais.',
    'Estratégia: Selecionar 3-4 módulos inicialmente garante melhor implementação.'
  ],
  2: [
    'Dica: Configurar atalhos agora economiza 30 minutos por semana depois.',
    'Insight: Os atalhos se adaptam ao seu fluxo de trabalho ao longo do tempo.',
    'Sugestão: Cada módulo tem exemplo de dados para você começar rapidamente.'
  ],
  3: [
    'Parabéns! Você está pronto para maximizar o valor da plataforma.',
    'Dica: O tour guiado é altamente recomendado para novos usuários.',
    'Insight: Empresas que fazem o tour têm 60% mais engajamento inicial.'
  ]
};

export function IntelligentAIAssistant({
  currentStep,
  selectedModules,
  companyProfile,
  userBehavior,
  onSuggestionAccepted,
  onNavigateToStep
}: IntelligentAIAssistantProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    const initialMessage: AIMessage = {
      id: 'greeting',
      type: 'ai',
      content: AI_PERSONALITY.greeting,
      timestamp: new Date(),
      actions: [
        {
          label: 'Ver dicas contextuais',
          action: () => showContextualTip(),
          variant: 'outline'
        }
      ]
    };
    setMessages([initialMessage]);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Provide contextual help based on step and behavior
  useEffect(() => {
    if (userBehavior.hesitationPoints.includes(currentStep)) {
      provideHesitationHelp();
    }
  }, [currentStep, userBehavior.hesitationPoints]);

  // Rotate tips periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isMinimized && currentStep < CONTEXTUAL_TIPS[currentStep]?.length) {
        setCurrentTipIndex(prev => 
          (prev + 1) % (CONTEXTUAL_TIPS[currentStep]?.length || 1)
        );
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentStep, isMinimized]);

  const addMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const showContextualTip = () => {
    const tips = CONTEXTUAL_TIPS[currentStep] || [];
    if (tips.length > 0) {
      addMessage({
        type: 'ai',
        content: tips[currentTipIndex]
      });
    }
  };

  const provideHesitationHelp = () => {
    let helpContent = '';
    let actions: AIMessage['actions'] = [];

    switch (currentStep) {
      case 1:
        helpContent = 'Vejo que você está hesitando na seleção de módulos. Posso ajudar com recomendações baseadas no seu perfil!';
        actions = [
          {
            label: 'Recomendar módulos',
            action: () => recommendModules()
          },
          {
            label: 'Explicar cada módulo',
            action: () => explainModules()
          }
        ];
        break;
      case 2:
        helpContent = 'Precisa de ajuda com a configuração dos atalhos? Posso explicar cada opção.';
        actions = [
          {
            label: 'Explicar atalhos',
            action: () => explainShortcuts()
          }
        ];
        break;
    }

    if (helpContent) {
      addMessage({
        type: 'ai',
        content: helpContent,
        actions
      });
    }
  };

  const recommendModules = () => {
    const recommendations = getSmartRecommendations();
    addMessage({
      type: 'ai',
      content: `Com base no perfil da sua empresa, recomendo focar nestes módulos: ${recommendations.join(', ')}. Quer que eu explique por quê?`,
      actions: [
        {
          label: 'Sim, explicar',
          action: () => explainRecommendations(recommendations)
        },
        {
          label: 'Aplicar sugestões',
          action: () => onSuggestionAccepted?.('auto_select_recommended')
        }
      ]
    });
  };

  const getSmartRecommendations = (): string[] => {
    const recommendations = ['Inventário GEE', 'Gestão de Licenças'];
    
    if (companyProfile?.sector === 'manufacturing') {
      recommendations.push('Sistema de Qualidade');
    }
    if (companyProfile?.size === 'large') {
      recommendations.push('Gestão de Desempenho');
    }
    if (companyProfile?.goals?.includes('sustainability')) {
      recommendations.push('Metas de Sustentabilidade');
    }
    
    return recommendations.slice(0, 4);
  };

  const explainModules = () => {
    addMessage({
      type: 'ai',
      content: 'Aqui está um resumo dos módulos principais:\n\n📊 **Inventário GEE**: Monitora emissões de carbono\n📋 **Gestão de Licenças**: Controla vencimentos e compliance\n🎯 **Sistema de Qualidade**: Melhoria contínua de processos\n👥 **Gestão de Desempenho**: Avaliação e desenvolvimento de equipes'
    });
  };

  const explainShortcuts = () => {
    addMessage({
      type: 'ai',
      content: 'Os atalhos guiados são caminhos diretos para as funcionalidades principais de cada módulo. Eles economizam tempo e garantem que você acesse rapidamente o que precisa. Cada atalho vem com dados de exemplo para você testar!'
    });
  };

  const explainRecommendations = (recommendations: string[]) => {
    let explanation = 'Baseei as recomendações em:\n\n';
    
    if (companyProfile?.sector) {
      explanation += `• **Setor ${companyProfile.sector}**: Módulos essenciais para compliance\n`;
    }
    if (companyProfile?.size) {
      explanation += `• **Porte ${companyProfile.size}**: Complexidade adequada\n`;
    }
    if (companyProfile?.goals) {
      explanation += `• **Objetivos ESG**: Alinhamento com suas metas\n`;
    }
    
    explanation += '\nEssas escolhas garantem máximo ROI inicial!';
    
    addMessage({
      type: 'ai',
      content: explanation
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addMessage({
      type: 'user',
      content: inputValue
    });

    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(inputValue);
      addMessage(response);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput: string): Omit<AIMessage, 'id' | 'timestamp'> => {
    const input = userInput.toLowerCase();
    
    if (input.includes('módulo') || input.includes('selecionar')) {
      return {
        type: 'ai',
        content: 'Para escolher módulos, considere: 1) Compliance obrigatório (Licenças), 2) Metas de sustentabilidade (GEE), 3) Processos internos (Qualidade). Que área é mais crítica para vocês?',
        actions: [
          { label: 'Compliance', action: () => recommendModules() },
          { label: 'Sustentabilidade', action: () => recommendModules() },
          { label: 'Processos', action: () => recommendModules() }
        ]
      };
    }
    
    if (input.includes('tempo') || input.includes('demorar')) {
      return {
        type: 'ai',
        content: 'O onboarding leva 3-5 minutos. Depois disso, cada módulo tem configuração inicial de 1-2 minutos. O investimento de tempo inicial economiza horas semanalmente!'
      };
    }
    
    if (input.includes('ajuda') || input.includes('help')) {
      return {
        type: 'ai',
        content: 'Estou aqui para ajudar! Posso explicar módulos, recomendar configurações ou esclarecer dúvidas sobre ESG. O que você gostaria de saber?',
        actions: [
          { label: 'Explicar módulos', action: () => explainModules() },
          { label: 'Dar recomendações', action: () => recommendModules() },
          { label: 'Mostrar dicas', action: () => showContextualTip() }
        ]
      };
    }
    
    return {
      type: 'ai',
      content: 'Interessante pergunta! Baseado no seu contexto atual, sugiro focar no que vai gerar mais valor imediato. Quer que eu analise sua situação específica?',
      actions: [
        { label: 'Sim, analisar', action: () => recommendModules() }
      ]
    };
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-64 border-primary/20 bg-gradient-to-r from-primary/5 to-blue/5 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200"
            onClick={() => setIsMinimized(false)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-primary/10 rounded-full">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-foreground">{AI_PERSONALITY.name}</h4>
              <p className="text-xs text-muted-foreground">Assistente ativa</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {messages.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-blue/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-primary/20 rounded-full">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{AI_PERSONALITY.name}</h3>
              <p className="text-xs text-muted-foreground">{AI_PERSONALITY.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-2">
              <Brain className="h-3 w-3 mr-1" />
              IA Ativa
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg space-y-2 ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-4'
                    : message.type === 'suggestion'
                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800 mr-4'
                    : 'bg-muted text-foreground mr-4'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {message.content}
                </p>
                
                {message.actions && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {message.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.action}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground p-3 rounded-lg mr-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua pergunta..."
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={showContextualTip}
                className="text-xs h-7"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Dica
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={recommendModules}
                className="text-xs h-7"
              >
                <Star className="h-3 w-3 mr-1" />
                Sugerir
              </Button>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>IA ESG</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}