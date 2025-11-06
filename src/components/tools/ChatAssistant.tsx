import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Maximize2, Minimize2, User, Sparkles, History, Plus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useChatAssistant } from '@/hooks/useChatAssistant';
import { AIActionConfirmation } from '@/components/ai/AIActionConfirmation';
import { AIOperationsPreview } from '@/components/ai/AIOperationsPreview';
import { QuickActions } from '@/components/ai/QuickActions';
import { FileUploadButton } from '@/components/ai/FileUploadButton';
import { FileAttachmentCompact } from '@/components/ai/FileAttachmentCompact';
import { ChatHistory } from '@/components/ai/ChatHistory';
import { VirtualizedMessageList } from '@/components/ai/VirtualizedMessageList';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Chat assistant component with AI action confirmation support
interface ChatAssistantProps {
  embedded?: boolean; // When true, always shows chat without floating button
}

export function ChatAssistant({ embedded = false }: ChatAssistantProps) {
  // Persist open state in localStorage (only for non-embedded)
  const [isOpen, setIsOpen] = useState(() => {
    if (embedded) return true;
    const stored = localStorage.getItem('ai_chat_open');
    // Default to CLOSED on first use
    return stored === 'true';
  });
  
  // Persist fullscreen state
  const [isExpanded, setIsExpanded] = useState(() => {
    if (embedded) return false;
    return localStorage.getItem('ai_chat_fullscreen') === 'true';
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    startNewConversation,
    attachments,
    addAttachment,
    removeAttachment,
    clearSentAttachments,
    isUploading,
    pendingAction,
    confirmAction,
    cancelAction,
    showHistory,
    setShowHistory,
    listConversations,
    openConversation,
    renameConversation,
    deleteConversation,
    conversationId,
    executeAction,
    pendingOperations,
    showOperationsPreview,
    setShowOperationsPreview,
    executeOperations,
    operationsValidations,
    operationsSummary,
    isProcessingAttachments,
    processingProgress
  } = useChatAssistant();

  // Persist open state (non-embedded only)
  useEffect(() => {
    if (!embedded) {
      localStorage.setItem('ai_chat_open', isOpen.toString());
    }
  }, [isOpen, embedded]);
  
  // Persist fullscreen state
  useEffect(() => {
    if (!embedded) {
      localStorage.setItem('ai_chat_fullscreen', String(isExpanded));
    }
  }, [isExpanded, embedded]);
  
  // Block body scroll when fullscreen
  useEffect(() => {
    if (!embedded && isExpanded) {
      const original = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      
      // Failsafe: garante restauração após 100ms se algo der errado
      const failsafe = setTimeout(() => {
        if (!isExpanded) {
          document.body.style.overflow = original;
        }
      }, 100);
      
      return () => {
        clearTimeout(failsafe);
        document.body.style.overflow = original;
      };
    } else {
      // Garante que overflow está limpo quando não expandido
      document.body.style.overflow = '';
    }
  }, [isExpanded, embedded]);
  
  // Esc key to exit fullscreen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded && !embedded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded, embedded]);

  // Hide quick actions after first user message
  useEffect(() => {
    if (messages.length > 1) {
      setShowQuickActions(false);
    }
  }, [messages]);

  // Clear corrupted localStorage state on mount
  useEffect(() => {
    if (!embedded) {
      const stored = localStorage.getItem('ai_chat_open');
      const fullscreen = localStorage.getItem('ai_chat_fullscreen');
      
      // Reset corrupted states
      if (stored !== 'true' && stored !== 'false') {
        localStorage.removeItem('ai_chat_open');
        setIsOpen(false);
      }
      if (fullscreen !== 'true' && fullscreen !== 'false') {
        localStorage.removeItem('ai_chat_fullscreen');
        setIsExpanded(false);
      }
    }
  }, [embedded]);

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
      <AnimatePresence>
        {!embedded && !isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-[100] bg-gradient-to-br from-primary to-primary/90"
              size="icon"
              aria-label="Abrir chat"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "flex flex-col bg-background",
              embedded 
                ? "w-full h-full border-0 rounded-none shadow-none" 
                : cn(
                    "ai-chat-container shadow-2xl border transition-all duration-300",
                    isExpanded ? "fullscreen" : "fixed"
                  )
            )}
          >
            <Card className={cn(
              "w-full h-full flex flex-col overflow-hidden",
              embedded ? "border-0 shadow-none" : "border"
            )}>
              {/* Header - Professional Design */}
              <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="flex items-center justify-between px-4 py-3">
                  {/* Left: Avatar + Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 bg-gradient-to-br from-primary to-primary/80">
                        <AvatarFallback className="bg-transparent text-primary-foreground">
                          <Sparkles className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      {isLoading && (
                        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary animate-pulse ring-2 ring-background" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">
                        Assistente ESG IA
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {isLoading ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="animate-pulse">
                            {isProcessingAttachments ? (
                              <>Processando arquivos... {Math.round(processingProgress)}%</>
                            ) : (
                              <>Consultando dados da empresa...</>
                            )}
                          </span>
                        </>
                      ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Online</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => setShowHistory(true)}
                      aria-label="Histórico"
                      disabled={isLoading}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={startNewConversation}
                      aria-label="Nova conversa"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    {!embedded && (
                      <>
                        <div className="h-4 w-px bg-border mx-1" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => setIsExpanded(v => !v)}
                          aria-label={isExpanded ? "Restaurar" : "Tela cheia"}
                        >
                          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => setIsOpen(false)}
                          aria-label="Fechar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

          {/* Processing Indicator */}
          {isProcessingAttachments && (
            <div className="px-6 py-4 border-b bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Processando anexos com IA...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {processingProgress < 50 
                        ? 'Extraindo dados dos arquivos' 
                        : processingProgress < 90 
                        ? 'Analisando conteúdo e identificando operações' 
                        : 'Finalizando análise'}
                    </p>
                  </div>
                </div>
                <Progress value={processingProgress} className="h-1.5" />
              </div>
            </div>
          )}

          {/* Virtualized Messages - Optimized for performance */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <VirtualizedMessageList
              messages={messages}
              isLoading={isLoading}
              onQuickAction={handleQuickAction}
              onExecuteAction={executeAction}
              containerHeight={undefined}
            />
          </div>

          {/* Quick Actions - Show only on first message */}
          {showQuickActions && messages.length === 1 && !isLoading && (
            <div className="px-6 py-4 border-t">
              <QuickActions 
                onSelectAction={handleQuickAction} 
                currentPage={currentPage}
              />
            </div>
          )}

              {/* Input Area - Redesigned */}
              <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur">
                {/* Attachments Preview - Compact */}
                {attachments.length > 0 && (
                  <div className="px-4 pt-3 pb-2 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{attachments.length} arquivo(s)</span>
                      {!isLoading && !isUploading && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto h-6 text-xs"
                          onClick={() => attachments.forEach(att => removeAttachment(att.id))}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      <AnimatePresence mode="popLayout">
                        {attachments.map(att => (
                          <FileAttachmentCompact 
                            key={att.id} 
                            file={att} 
                            onRemove={att.status !== 'sent' && !isLoading ? removeAttachment : undefined} 
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                    {isUploading && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processando arquivos...
                      </p>
                    )}
                  </div>
                )}
                
                {/* Input Principal */}
                <div className="p-4">
                  <div className="flex items-end gap-2">
                    <FileUploadButton
                      onFileSelect={handleFileSelect}
                      isUploading={isUploading}
                      disabled={isLoading || !conversationId}
                    />
                    
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Digite sua mensagem..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="min-h-[56px] max-h-[200px] resize-none rounded-xl border-2 pr-12 text-sm focus:border-primary/50 transition-colors"
                        disabled={isLoading || isUploading}
                        aria-label="Campo de mensagem"
                      />
                      <div className="absolute right-2 bottom-2 flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {inputMessage.length}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      size="icon"
                      className="h-[56px] w-[56px] flex-shrink-0 rounded-xl"
                      aria-label="Enviar mensagem"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⏎</kbd> enviar
                    <span className="mx-1">·</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">⇧⏎</kbd> nova linha
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Confirmation Dialog */}
      <AIActionConfirmation
        action={pendingAction}
        onConfirm={confirmAction}
        onCancel={cancelAction}
      />
      
      {/* AI Operations Preview */}
      <AIOperationsPreview
        open={showOperationsPreview}
        onClose={() => setShowOperationsPreview(false)}
        operations={pendingOperations}
        validations={operationsValidations}
        summary={operationsSummary}
        onExecute={executeOperations}
      />
      
      {/* Chat History Drawer */}
      <ChatHistory 
        open={showHistory}
        onOpenChange={setShowHistory}
        listConversations={listConversations}
        openConversation={openConversation}
        renameConversation={renameConversation}
        deleteConversation={deleteConversation}
        startNewConversation={startNewConversation}
        conversationId={conversationId}
      />
    </>
  );
}
