import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, RotateCcw, ExternalLink, Bot, TrendingUp, Building, Database } from 'lucide-react';
import { useChatAssistant, ChatMessage } from '@/hooks/useChatAssistant';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatAssistantProps {
  className?: string;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { messages, isLoading, sendMessage, clearMessages } = useChatAssistant();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Get current page context for better AI responses
  const getCurrentPageContext = () => {
    const path = location.pathname;
    if (path.includes('licenciamento')) return 'licenciamento';
    if (path.includes('metas')) return 'metas';
    if (path.includes('inventario')) return 'inventario-gee';
    if (path.includes('documentos')) return 'documentos';
    if (path.includes('auditoria')) return 'auditoria';
    if (path.includes('esg')) return 'gestao-esg';
    return 'dashboard';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const currentPage = getCurrentPageContext();
    await sendMessage(inputValue, currentPage);
    setInputValue('');
  };

  const handleSuggestedAction = (action: ChatMessage['suggestedActions'][0]) => {
    if (action.type === 'navigate' && action.path) {
      navigate(action.path);
      setIsOpen(false);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'navigate':
        return <ExternalLink className="w-3 h-3 mr-1" />;
      case 'action':
        return <TrendingUp className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Floating chat button
  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <div className="flex flex-col items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
            <span className="text-xs text-primary-foreground">ESG</span>
          </div>
        </Button>
      </div>
    );
  }

  // Chat interface
  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card 
        className={cn(
          "w-96 bg-background border shadow-2xl transition-all duration-200",
          isMinimized ? "h-16" : "h-[600px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-semibold text-sm">Assistente ESG IA</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">Daton</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
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
        </div>

        {/* Messages - Hidden when minimized */}
        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 p-4 h-[480px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === 'user' && (
                      <div className="flex flex-col items-end max-w-[80%]">
                        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">
                          {message.content}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {message.role === 'assistant' && (
                      <div className="flex gap-3 max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="bg-muted rounded-lg p-3 prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                          
                          {/* Context Information */}
                          {message.context && (
                            <div className="text-xs bg-blue-50 dark:bg-blue-950/20 rounded-md p-2 border-l-2 border-blue-500/30">
                              <div className="flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300 mb-1">
                                <Database className="w-3 h-3" />
                                Dados analisados:
                              </div>
                              <div className="text-blue-600 dark:text-blue-400">{message.context}</div>
                            </div>
                          )}
                          
                          {/* Market Information */}
                          {message.marketInfo && (
                            <div className="text-xs bg-green-50 dark:bg-green-950/20 rounded-md p-2 border-l-2 border-green-500/30">
                              <div className="flex items-center gap-1 font-medium text-green-700 dark:text-green-300 mb-1">
                                <TrendingUp className="w-3 h-3" />
                                Contexto de Mercado:
                              </div>
                              <div className="text-green-600 dark:text-green-400">{message.marketInfo}</div>
                            </div>
                          )}
                          
                          {/* Company Context */}
                          {message.companyName && (
                            <div className="text-xs bg-purple-50 dark:bg-purple-950/20 rounded-md p-2 border-l-2 border-purple-500/30">
                              <div className="flex items-center gap-1 font-medium text-purple-700 dark:text-purple-300">
                                <Building className="w-3 h-3" />
                                {message.companyName}
                              </div>
                            </div>
                          )}
                          
                          {/* Suggested Actions */}
                          {message.suggestedActions && message.suggestedActions.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">Ações sugeridas:</p>
                              <div className="flex flex-wrap gap-2">
                                {message.suggestedActions.map((action, actionIndex) => (
                                  <Button
                                    key={actionIndex}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => handleSuggestedAction(action)}
                                  >
                                    {getActionIcon(action.type)}
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-muted-foreground text-xs">Analisando dados...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Form */}
            <div className="p-4 border-t bg-muted/50">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Pergunte sobre emissões, licenças, metas..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isLoading || !inputValue.trim()}
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {/* Enhanced context indicator */}
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  <span>Conectado a todos os dados da empresa</span>
                </div>
                <span>Página: {getCurrentPageContext().replace('-', ' ')}</span>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};