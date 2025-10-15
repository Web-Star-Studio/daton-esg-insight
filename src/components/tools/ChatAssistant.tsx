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
            {/* Auto-send prompt for attachments without message */}
            {attachments.length > 0 && !inputMessage.trim() && !isLoading && !isUploading && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  📎 Anexos prontos. Deseja que eu analise agora?
                </span>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setInputMessage('Por favor, analise os anexos que enviei.');
                    setTimeout(handleSendMessage, 100);
                  }}
                  className="ml-2"
                >
                  Analisar
                </Button>
              </div>
            )}
            
            {/* File attachments preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    📎 Anexos ({attachments.length})
                  </span>
                  <div className="flex gap-1">
                    {!isLoading && !isUploading && attachments.some(att => att.status === 'sent') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSentAttachments}
                        className="h-6 text-xs hover:text-primary"
                      >
                        Limpar Enviados
                      </Button>
                    )}
                    {!isLoading && !isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => attachments.forEach(att => removeAttachment(att.id))}
                        className="h-6 text-xs hover:text-destructive"
                      >
                        Limpar Todos
                      </Button>
                    )}
                  </div>
                </div>
                {attachments.map(att => (
                  <FileAttachment
                    key={att.id}
                    file={att}
                    onRemove={att.status === 'sent' ? undefined : removeAttachment}
                    canRemove={!isLoading && att.status !== 'sent'}
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
                disabled={isLoading || !conversationId}
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
