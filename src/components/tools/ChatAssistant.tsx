import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useChatAssistant } from '@/hooks/useChatAssistant';
import { AIActionConfirmation } from '@/components/ai/AIActionConfirmation';
import { QuickActions } from '@/components/ai/QuickActions';
import { FileUploadButton } from '@/components/ai/FileUploadButton';
import { FileAttachment } from '@/components/ai/FileAttachment';
import { ChatHistory } from '@/components/ai/ChatHistory';
import { VirtualizedMessageList } from '@/components/ai/VirtualizedMessageList';
import { History, Plus, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

// Chat assistant component with AI action confirmation support
interface ChatAssistantProps {
  embedded?: boolean; // When true, always shows chat without floating button
}

export function ChatAssistant({ embedded = false }: ChatAssistantProps) {
  // Persist open state in localStorage (only for non-embedded)
  const [isOpen, setIsOpen] = useState(() => {
    if (embedded) return true;
    const stored = localStorage.getItem('ai_chat_open');
    // Default to open on first use if no value stored
    return stored === null ? true : stored === 'true';
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
    conversationId
  } = useChatAssistant();

  // Persist open state (non-embedded only)
  useEffect(() => {
    if (!embedded) {
      localStorage.setItem('ai_chat_open', isOpen.toString());
    }
  }, [isOpen, embedded]);

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
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-br from-primary to-primary/90 hover:from-primary hover:to-primary animate-glow-pulse"
              size="icon"
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
          >
            <Card className={embedded 
              ? "w-full h-full flex flex-col border-0 rounded-none shadow-none" 
              : "fixed bottom-6 right-6 w-[440px] h-[680px] flex flex-col shadow-2xl z-50 border-2 overflow-hidden"
            }>
          {/* Header - Simplified without animations */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <AvatarFallback className="bg-transparent text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  Assistente ESG IA
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analisando dados...</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-success" />
                      <span>Online e pronto</span>
                    </>
                  )}
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

          {/* Virtualized Messages - Optimized for performance */}
          <div className={embedded ? "flex-1 overflow-hidden" : "flex-1 overflow-hidden"}>
            <VirtualizedMessageList
              messages={messages}
              isLoading={isLoading}
              onQuickAction={handleQuickAction}
              containerHeight={embedded ? 500 : 420}
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

          {/* Input */}
          <div className="p-4 border-t space-y-3">
            {/* Auto-send prompt for attachments */}
            <AnimatePresence>
              {attachments.length > 0 && !inputMessage.trim() && !isLoading && !isUploading && (
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📎</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Anexos prontos!
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Deseja que eu analise agora?
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setInputMessage('Por favor, analise os anexos que enviei.');
                      setTimeout(handleSendMessage, 100);
                    }}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Analisar
                  </Button>
                </div>
              )}
            </AnimatePresence>
            
            {/* File attachments preview */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <span className="text-base">📎</span>
                      Anexos ({attachments.length})
                    </span>
                    <div className="flex gap-1">
                      {!isLoading && !isUploading && attachments.some(att => att.status === 'sent') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSentAttachments}
                          className="h-7 text-xs hover:text-primary transition-colors"
                        >
                          Limpar Enviados
                        </Button>
                      )}
                      {!isLoading && !isUploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => attachments.forEach(att => removeAttachment(att.id))}
                          className="h-7 text-xs hover:text-destructive transition-colors"
                        >
                          Limpar Todos
                        </Button>
                      )}
                    </div>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {attachments.map(att => (
                      <FileAttachment
                        key={att.id}
                        file={att}
                        onRemove={att.status === 'sent' ? undefined : removeAttachment}
                        canRemove={!isLoading && att.status !== 'sent'}
                      />
                    ))}
                  </AnimatePresence>
                  {isUploading && (
                    <div className="text-xs bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-4 space-y-2">
                      <p className="font-semibold text-warning flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando e analisando arquivos...
                      </p>
                      <p className="text-warning/80">
                        A IA está processando os anexos para extrair informações relevantes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
            
            <div className="flex gap-2 items-end">
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
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || isUploading}
                  className="min-h-[60px] max-h-[120px] resize-none pr-3 rounded-xl border-2 focus:border-primary/50 transition-colors"
                />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || isUploading || !inputMessage.trim()}
                size="icon"
                className="h-[60px] w-[60px] rounded-xl shadow-lg hover:shadow-xl bg-gradient-to-br from-primary to-primary/90 transition-all"
                title={isUploading ? 'Aguarde o upload dos anexos' : 'Enviar mensagem'}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            <p className="text-xs text-center mt-2 text-muted-foreground">
              {isUploading ? (
                <span className="text-warning font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguarde o upload dos anexos...
                </span>
              ) : (
                <span>
                  Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> para enviar, 
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono ml-1">Shift+Enter</kbd> para nova linha
                </span>
              )}
            </p>
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
