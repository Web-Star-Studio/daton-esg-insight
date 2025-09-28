import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'recommendation' | 'alert';
}

const QUICK_PROMPTS = [
  {
    text: "Como está o desempenho ESG da empresa?",
    icon: TrendingUp,
    category: 'analysis'
  },
  {
    text: "Quais licenças estão próximas do vencimento?",
    icon: AlertTriangle,
    category: 'compliance'
  },
  {
    text: "Status das metas de sustentabilidade",
    icon: Target,
    category: 'goals'
  },
  {
    text: "Sugestões de melhoria ESG",
    icon: Lightbulb,
    category: 'recommendations'
  }
];

export function ChatIA() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const generateAIResponse = async (userMessage: string): Promise<AIMessage> => {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    let response = '';
    let type: AIMessage['type'] = 'text';

    if (userMessage.toLowerCase().includes('desempenho') || userMessage.toLowerCase().includes('esg')) {
      type = 'analysis';
      response = `📊 **Análise ESG Atual**

**Performance Geral:** 85.2/100 (+5.3% vs mês anterior)

**Destaques:**
• Redução de emissões: 12% este ano
• Taxa de reciclagem: 92% (meta: 85%)
• Score de diversidade: 78%

**Áreas de atenção:**
• 3 licenças vencem em 60 dias
• Meta de energia renovável: 68/75%

*Análise baseada em dados em tempo real*`;
    } else if (userMessage.toLowerCase().includes('licença') || userMessage.toLowerCase().includes('vencimento')) {
      type = 'alert';
      response = `⚠️ **Status de Licenças**

**🔴 Urgente (< 30 dias):**
• Licença Ambiental - 23 dias
• Autorização Emissões - 28 dias

**🟡 Atenção (30-90 dias):**
• Certificação ISO 14001 - 67 dias
• Autorização IBAMA - 82 dias

**Ação recomendada:** Iniciar renovação imediatamente`;
    } else if (userMessage.toLowerCase().includes('meta') || userMessage.toLowerCase().includes('sustentabilidade')) {
      type = 'recommendation';
      response = `🎯 **Metas de Sustentabilidade 2024**

**✅ No prazo:**
• CO₂: 68% concluído
• Reciclagem: 112% da meta
• Treinamentos: 89%

**⚠️ Requer atenção:**
• Energia renovável: 45/60%
• Diversidade: 32/40%

**Sugestões:**
1. Acelerar instalação solar
2. Programa diversidade
3. Auditoria ISO urgente`;
    } else {
      response = `🤖 **Assistente ESG**

Como posso ajudar hoje? Posso fornecer:

• **Análises em tempo real** de dados ESG
• **Status de compliance** e licenças
• **Acompanhamento de metas**
• **Alertas preditivos** de riscos
• **Relatórios personalizados**

Experimente perguntar sobre performance, licenças ou metas!`;
    }

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      type
    };
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
      const aiResponse = await generateAIResponse(messageText);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorResponse: AIMessage = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Erro ao processar sua solicitação. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Chat IA ESG</h3>
            <p className="text-xs text-muted-foreground">Assistente inteligente</p>
          </div>
        </div>
        
        <Button
          onClick={clearChat}
          variant="outline"
          size="sm"
          className="h-8"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Limpar
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center text-muted-foreground text-sm mb-4">
              Olá! Como posso ajudar você hoje?
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {QUICK_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  onClick={() => handleSendMessage(prompt.text)}
                  variant="outline"
                  size="sm"
                  className="justify-start text-left h-auto p-3"
                  disabled={isLoading}
                >
                  <prompt.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-xs">{prompt.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 mb-4",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            
            <div className={cn(
              "max-w-[80%] rounded-lg p-3 text-sm",
              message.role === 'user' 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted"
            )}>
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
              
              <div className={cn(
                "text-xs mt-2 opacity-70",
                message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {formatTime(message.timestamp)}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-3 h-3" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mb-4">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-3 h-3 text-primary animate-pulse" />
            </div>
            <div className="bg-muted rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-muted-foreground">Processando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite sua pergunta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}