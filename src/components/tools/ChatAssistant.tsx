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
    return stored === 'true';
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
              : "fixed bottom-6 right-6 w-[420px] h-[600px] flex flex-col shadow-2xl z-50 border-2"
            }>
          {/* Header with gradient animation */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="flex items-center gap-3 relative z-10">
              <motion.div
                animate={isLoading ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                  <AvatarFallback className="bg-transparent text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div>
                <h3 className="font-semibold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Assistente ESG IA
                </h3>
                <motion.p 
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                  animate={isLoading ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Analisando dados...</span>
                    </>
                  ) : (
                    <>
                      <motion.span
                        className="h-2 w-2 rounded-full bg-success"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span>Online e pronto</span>
                    </>
                  )}
                </motion.p>
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

          {/* Virtualized Messages - Optimized for performance */}
          <VirtualizedMessageList
            messages={messages}
            isLoading={isLoading}
            onQuickAction={handleQuickAction}
            containerHeight={embedded ? 500 : 400}
          />

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
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      📎
                    </motion.span>
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
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* File attachments preview with animations */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <motion.span 
                      className="text-xs font-semibold text-foreground flex items-center gap-2"
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <span className="text-base">📎</span>
                      Anexos ({attachments.length})
                    </motion.span>
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-4 space-y-2"
                    >
                      <p className="font-semibold text-warning flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="h-4 w-4" />
                        </motion.div>
                        Enviando e analisando arquivos...
                      </p>
                      <p className="text-warning/80">
                        A IA está processando os anexos para extrair informações relevantes.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex gap-2 items-end">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileUploadButton
                  onFileSelect={handleFileSelect}
                  isUploading={isUploading}
                  disabled={isLoading || !conversationId}
                />
              </motion.div>
              
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
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
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
              </motion.div>
            </div>
            
            <motion.p 
              className="text-xs text-center mt-2"
              animate={isUploading ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {isUploading ? (
                <span className="text-warning font-semibold flex items-center justify-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Aguarde o upload dos anexos...
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Pressione <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> para enviar, 
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono ml-1">Shift+Enter</kbd> para nova linha
                </span>
              )}
            </motion.p>
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
