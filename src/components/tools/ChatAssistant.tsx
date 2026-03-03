import { useState, useEffect } from 'react';
import { X, Send, Loader2, Maximize2, Minimize2, History, Plus, Paperclip } from 'lucide-react';
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
import { DocumentPromptTemplates } from '@/components/ai/DocumentPromptTemplates';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Chat assistant component with AI action confirmation support
interface ChatAssistantProps {
  embedded?: boolean; // When true, always shows chat without floating button
  isOpen?: boolean; // External control of open state
  onClose?: () => void; // Callback when chat is closed
}

export function ChatAssistant({ embedded = false, isOpen: externalIsOpen, onClose }: ChatAssistantProps) {
  const isControlled = externalIsOpen !== undefined;
  const isHeaderPopover = isControlled && !embedded;
  
  // Persist open state in localStorage (only for non-embedded, non-controlled)
  const [internalIsOpen, setInternalIsOpen] = useState(() => {
    if (embedded) return true;
    if (isControlled) return false;
    const stored = localStorage.getItem('ai_chat_open');
    return stored === 'true';
  });
  
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isOpen) : value;
    if (isControlled) {
      if (!newValue && onClose) onClose();
    } else {
      setInternalIsOpen(newValue);
    }
  };
  
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
    console.warn(`ChatAssistant: Processing ${files.length} files`);
    
    for (const file of files) {
      try {
        console.warn(`Adding attachment: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
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
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isHeaderPopover ? -8 : 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isHeaderPopover ? -8 : 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "flex flex-col bg-background",
              embedded 
                ? "w-full h-full border-0 rounded-none shadow-none" 
                : isHeaderPopover
                  ? "absolute right-0 top-[calc(100%+0.5rem)] z-[220] h-[min(72vh,640px)] w-[min(420px,calc(100vw-1.5rem))] rounded-2xl border border-border/60 shadow-xl"
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
              <div className="flex-shrink-0 border-b bg-background">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">Assistente IA</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {isLoading
                        ? isProcessingAttachments
                          ? `Processando arquivos... ${Math.round(processingProgress)}%`
                          : "Consultando dados..."
                        : "Pronto para ajudar"}
                    </p>
                  </div>
                  
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
                    {!embedded && !isHeaderPopover && (
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
                      </>
                    )}
                    {!embedded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsOpen(false)}
                        aria-label="Fechar"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
              <div className="flex-shrink-0 border-t bg-background">
                {/* Document Prompt Templates - Show when files are attached */}
                {attachments.length > 0 && !isLoading && !isUploading && (
                  <div className="px-4 pt-4 pb-3 border-b">
                    <DocumentPromptTemplates 
                      onSelectPrompt={(prompt) => {
                        setInputMessage(prompt);
                        // Scroll to input
                        setTimeout(() => {
                          const textarea = document.querySelector('textarea');
                          textarea?.focus();
                        }, 100);
                      }}
                      disabled={isLoading || isUploading}
                    />
                  </div>
                )}
                
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
                        className="min-h-[52px] max-h-[180px] resize-none rounded-xl border pr-12 text-sm transition-colors"
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
                      className="h-[52px] w-[52px] flex-shrink-0 rounded-xl"
                      aria-label="Enviar mensagem"
                    >
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
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
