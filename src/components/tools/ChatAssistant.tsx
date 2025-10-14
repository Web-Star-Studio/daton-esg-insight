import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useChatAssistant } from '@/hooks/useChatAssistant';
import { AIActionConfirmation } from '@/components/ai/AIActionConfirmation';
import { QuickActions } from '@/components/ai/QuickActions';
import { FileUploadButton } from '@/components/ai/FileUploadButton';
import { FileAttachment } from '@/components/ai/FileAttachment';
import { ProactiveInsights, ProactiveInsight } from '@/components/ai/ProactiveInsights';
import { DataVisualization } from '@/components/ai/DataVisualization';
import { ChatHistory } from '@/components/ai/ChatHistory';
import ReactMarkdown from 'react-markdown';
import { History, Plus } from 'lucide-react';

// Chat assistant component with AI action confirmation support
interface ChatAssistantProps {
  embedded?: boolean; // When true, always shows chat without floating button
}

export function ChatAssistant({ embedded = false }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(embedded); // Start open if embedded
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    startNewConversation,
    attachments,
    addAttachment,
    removeAttachment,
    isUploading,
    pendingAction,
    confirmAction,
    cancelAction,
    showHistory,
    setShowHistory
  } = useChatAssistant();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Hide quick actions after first user message
  useEffect(() => {
    if (messages.length > 1) {
      setShowQuickActions(false);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage;
    setInputMessage('');
    setShowQuickActions(false);
    const currentPage = window.location.pathname.split('/')[1];
    await sendMessage(message, currentPage, attachments);
  };

  const handleFileSelect = async (files: File[]) => {
    console.log(`ChatAssistant: Processing ${files.length} files`);
    
    for (const file of files) {
      try {
        console.log(`Adding attachment: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        await addAttachment(file);
      } catch (error) {
        console.error(`Failed to add attachment ${file.name}:`, error);
      }
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickActions(false);
    // Auto-send if it's an insight action
    setTimeout(() => {
      if (prompt) {
        handleSendMessage();
      }
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Get current page for context-aware quick actions
  const currentPage = window.location.pathname.split('/')[1] || 'dashboard';

  return (
    <>
      {/* Floating Chat Button - Only show when not embedded */}
      {!embedded && !isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={embedded 
          ? "w-full h-full flex flex-col border-0 rounded-none shadow-none" 
          : "fixed bottom-6 right-6 w-[420px] h-[600px] flex flex-col shadow-2xl z-50 border-2"
        }>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">Assistente ESG IA</h3>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Analisando dados...' : 'Online e pronto'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
                title="Histórico de conversas"
                disabled={isLoading}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={startNewConversation}
                title="Nova conversa"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {/* Close button - Only show when not embedded */}
              {!embedded && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Render proactive insights if present */}
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-3">
                        <ProactiveInsights 
                          insights={message.insights as ProactiveInsight[]} 
                          onActionClick={handleQuickAction}
                        />
                      </div>
                    )}
                    
                    {/* Render data visualizations if present */}
                    {message.visualizations && message.visualizations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.visualizations.map((viz: any, idx: number) => (
                          <DataVisualization key={idx} data={viz} />
                        ))}
                      </div>
                    )}
                    
                    {message.context && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {message.context}
                      </p>
                    )}
                    
                    {message.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 bg-secondary">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        EU
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Sparkles className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analisando dados...</span>
                  </div>
                </div>
              )}

              {/* Quick Actions - Show only on first message */}
              {showQuickActions && messages.length === 1 && !isLoading && (
                <div className="mt-6 px-2">
                  <QuickActions 
                    onSelectAction={handleQuickAction} 
                    currentPage={currentPage}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t space-y-3">
            {/* File attachments preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    📎 Anexos ({attachments.length})
                  </span>
                  {!isLoading && !isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => attachments.forEach(att => removeAttachment(att.id))}
                      className="h-6 text-xs hover:text-destructive"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                {attachments.map(att => (
                  <FileAttachment
                    key={att.id}
                    file={att}
                    onRemove={removeAttachment}
                    canRemove={!isLoading}
                  />
                ))}
                {isUploading && (
                  <div className="text-xs bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 space-y-1">
                    <p className="font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Enviando e analisando arquivos...
                    </p>
                    <p className="text-orange-600/80 dark:text-orange-400/80">
                      A IA está processando os anexos para extrair informações relevantes.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <FileUploadButton
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                disabled={isLoading}
              />
              
              <Textarea
                placeholder="Digite sua mensagem..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isUploading}
                className="min-h-[60px] max-h-[120px] resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || isUploading || !inputMessage.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
                title={isUploading ? 'Aguarde o upload dos anexos' : 'Enviar mensagem'}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {isUploading ? (
                <span className="text-orange-500 font-medium">⏳ Aguarde o upload dos anexos...</span>
              ) : (
                'Pressione Enter para enviar, Shift+Enter para nova linha'
              )}
            </p>
          </div>
        </Card>
      )}

      {/* Action Confirmation Dialog */}
      <AIActionConfirmation
        action={pendingAction}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
      
      {/* Chat History Drawer */}
      <ChatHistory 
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
}
