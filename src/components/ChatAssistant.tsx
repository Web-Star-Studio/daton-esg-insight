import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, RotateCcw, ExternalLink } from 'lucide-react';
import { useChatAssistant, ChatMessage } from '@/hooks/useChatAssistant';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
        >
          <MessageCircle className="h-6 w-6" />
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
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Assistente ESG</span>
            <Badge variant="secondary" className="text-xs">
              IA
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
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
                      "flex flex-col gap-2",
                      message.role === 'user' ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] p-3 rounded-lg text-sm",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {message.content}
                    </div>
                    
                    {/* Suggested Actions */}
                    {message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-w-[85%]">
                        {message.suggestedActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestedAction(action)}
                            className="text-xs h-7"
                          >
                            {action.label}
                            {action.type === 'navigate' && <ExternalLink className="ml-1 h-3 w-3" />}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-muted-foreground text-xs">Pensando...</span>
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
                  placeholder="Digite sua pergunta..."
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
              
              {/* Context indicator */}
              <div className="mt-2 text-xs text-muted-foreground">
                Contexto: {getCurrentPageContext().replace('-', ' ')}
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};