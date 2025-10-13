// Chat assistant hook with AI action confirmation capabilities
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PendingAction } from '@/components/ai/AIActionConfirmation';
import type { FileAttachmentData } from '@/components/ai/FileAttachment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
  marketInfo?: string;
  companyName?: string;
  insights?: any[];
  visualizations?: any[];
  suggestedActions?: Array<{
    type: 'navigate' | 'action';
    label: string;
    path?: string;
    action?: () => void;
  }>;
  pendingAction?: PendingAction;
}

export interface UseChatAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, currentPage?: string, attachments?: FileAttachmentData[]) => Promise<void>;
  clearMessages: () => void;
  pendingAction: PendingAction | null;
  confirmAction: (action: PendingAction) => Promise<void>;
  cancelAction: () => void;
  attachments: FileAttachmentData[];
  addAttachment: (file: File) => Promise<void>;
  removeAttachment: (id: string) => void;
  isUploading: boolean;
}

export function useChatAssistant(): UseChatAssistantReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Olá! Sou o Assistente IA do Daton**, seu parceiro inteligente em gestão ESG.

**📎 AGORA COM UPLOAD DE ARQUIVOS!**
Você pode anexar documentos (PDF, CSV, Excel, imagens) e eu posso:
• Extrair dados automaticamente
• Cadastrar licenças de PDFs
• Importar planilhas de emissões, metas, funcionários
• Ler medidores e formulários em fotos
• Processar relatórios e notas fiscais

Tenho acesso **completo e em tempo real** aos dados da sua empresa e posso ajudar de várias formas:

**📊 CONSULTAS E ANÁLISES**
Posso consultar instantaneamente:
• Emissões de GEE e inventário de carbono por escopo
• Licenças ambientais e alertas de vencimento
• Progresso de metas ESG e OKRs
• Métricas de resíduos e destinação
• Dados de colaboradores e indicadores sociais
• Status de conformidade e auditorias
• Tarefas pendentes e em atraso
• Riscos ESG por categoria e nível

**✏️ AÇÕES DE GERENCIAMENTO**
Com sua confirmação, posso criar e atualizar:
• Metas ESG, OKRs e projetos
• Tarefas de coleta de dados
• Licenças ambientais
• Registros de emissões e resíduos
• Não conformidades e riscos
• Indicadores e medições
• Funcionários, fornecedores e stakeholders
• Programas de treinamento e auditorias

**💡 COMO USAR**
Converse naturalmente! Exemplos:
• "Quais licenças vencem nos próximos 30 dias?"
• "Mostre o progresso das metas ambientais"
• "Crie uma tarefa de coleta de emissões para próximo mês"
• "Analise os riscos críticos da categoria ambiental"

*Todas as ações de escrita requerem sua confirmação antes da execução.*

**Como posso ajudar você hoje?** 🚀`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [attachments, setAttachments] = useState<FileAttachmentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  // Initialize or load conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!user?.company.id) return;

      try {
        // Create new conversation
        const { data: conv, error } = await supabase
          .from('ai_chat_conversations')
          .insert({
            company_id: user.company.id,
            user_id: user.id,
            title: 'Nova Conversa'
          })
          .select()
          .single();

        if (error) throw error;
        setConversationId(conv.id);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    };

    initConversation();
  }, [user]);

  // Sanitize file names to prevent storage errors with special characters
  const sanitizeFileName = (fileName: string): string => {
    // Normalize Unicode characters (remove accents)
    const normalized = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Replace spaces and special characters with underscore
    const sanitized = normalized.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Remove duplicate underscores
    return sanitized.replace(/_+/g, '_');
  };

  const addAttachment = async (file: File) => {
    // Validação de tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    const allowedExtensions = ['.pdf', '.csv', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Tipo de arquivo não suportado', {
        description: 'Apenas PDF, CSV, Excel e imagens (JPG, PNG, WEBP) são permitidos.'
      });
      return;
    }

    // Validação de tamanho (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande', {
        description: 'O tamanho máximo permitido é 20MB.'
      });
      return;
    }

    // Validação de nome do arquivo
    if (file.name.length > 255) {
      toast.error('Nome do arquivo muito longo', {
        description: 'O nome do arquivo deve ter no máximo 255 caracteres.'
      });
      return;
    }

    const id = crypto.randomUUID();
    const newAttachment: FileAttachmentData = {
      id,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading'
    };

    setAttachments(prev => [...prev, newAttachment]);
    setIsUploading(true);

    // Retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Usuário não autenticado');

        // Upload to storage with sanitized filename
        const sanitizedName = sanitizeFileName(file.name);
        const timestamp = Date.now();
        const filePath = `${authUser.id}/${timestamp}_${sanitizedName}`;

        console.log(`Upload attempt ${attempt}/${maxRetries}:`, { filePath, size: file.size });

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Erro no upload: ${uploadError.message}`);
        }

        // Verify upload
        const { data: fileExists } = await supabase.storage
          .from('chat-attachments')
          .list(authUser.id, {
            search: `${timestamp}_${sanitizedName}`
          });

        if (!fileExists || fileExists.length === 0) {
          throw new Error('Falha na verificação do upload');
        }

        // Update status to processing
        setAttachments(prev =>
          prev.map(att => att.id === id ? { ...att, status: 'processing' } : att)
        );

        // Log upload
        const { error: logError } = await supabase.from('chat_file_uploads').insert({
          company_id: user?.company.id,
          user_id: authUser.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          processing_status: 'uploaded'
        });

        if (logError) {
          console.error('Error logging upload:', logError);
          // Non-critical error, continue
        }

        // Update status to uploaded
        setAttachments(prev =>
          prev.map(att => att.id === id ? { ...att, status: 'uploaded', path: filePath } : att)
        );

        toast.success('Arquivo enviado com sucesso', {
          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        });

        return; // Success, exit retry loop

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido');
        console.error(`Upload attempt ${attempt} failed:`, lastError);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          toast.info(`Tentando novamente (${attempt + 1}/${maxRetries})...`, {
            duration: 2000
          });
        }
      }
    }

    // All retries failed
    setAttachments(prev =>
      prev.map(att => att.id === id ? { 
        ...att, 
        status: 'error', 
        error: lastError?.message || 'Erro ao enviar arquivo após múltiplas tentativas' 
      } : att)
    );
    
    toast.error('Falha no upload', {
      description: lastError?.message || 'Não foi possível enviar o arquivo. Tente novamente.'
    });

    setIsUploading(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const sendMessage = async (content: string, currentPage?: string, messageAttachments?: FileAttachmentData[]) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const companyId = user?.company.id;
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      // Save user message to database
      if (conversationId) {
        await supabase.from('ai_chat_messages').insert({
          conversation_id: conversationId,
          company_id: companyId,
          user_id: user.id,
          role: 'user',
          content,
          metadata: {
            currentPage,
            hasAttachments: (messageAttachments || attachments).length > 0
          }
        });
      }

      // Prepare messages for API (only content and role)
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add current user message
      apiMessages.push({
        role: 'user',
        content
      });

      console.log('Sending chat request to Daton AI...');

      // Process attachments
      const attachmentsToSend = messageAttachments || attachments;
      const processedAttachments = attachmentsToSend
        .filter(att => att.status === 'uploaded' && att.path)
        .map(att => ({
          name: att.name,
          type: att.type,
          size: att.size,
          path: att.path!
        }));

      // Call Daton AI Chat edge function
      const { data, error } = await supabase.functions.invoke('daton-ai-chat', {
        body: {
          messages: apiMessages,
          companyId,
          conversationId,
          currentPage: currentPage || 'dashboard',
          attachments: processedAttachments.length > 0 ? processedAttachments : undefined,
          userContext: {
            userName: user.full_name,
            companyName: user.company.name,
            userRole: user.role
          }
        }
      });

      if (error) {
        console.error('Chat AI error:', error);
        throw error;
      }

      console.log('AI response received:', data);

      // Check if AI is requesting a write action
      if (data.pendingAction) {
        const action: PendingAction = {
          id: `action-${Date.now()}`,
          ...data.pendingAction
        };
        
        setPendingAction(action);
        
        // Add assistant message with pending action
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.message || '📋 **Ação preparada para confirmação**\n\nPor favor, revise os detalhes da ação e confirme se deseja executá-la.',
          timestamp: new Date(),
          context: data.dataAccessed ? `Dados consultados: ${data.dataAccessed.join(', ')}` : undefined,
          companyName: user?.company.name,
          pendingAction: action,
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // Show toast notification
        toast.info('Ação aguardando confirmação', {
          description: action.displayName
        });
        
        return;
      }

      // Add regular assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Desculpe, não consegui gerar uma resposta adequada.',
        timestamp: new Date(),
        context: data.dataAccessed ? `Dados consultados: ${data.dataAccessed.join(', ')}` : undefined,
        companyName: user?.company.name,
        insights: data.insights || [],
        visualizations: data.visualizations || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      if (conversationId) {
        await supabase.from('ai_chat_messages').insert({
          conversation_id: conversationId,
          company_id: companyId,
          user_id: user.id,
          role: 'assistant',
          content: data.message,
          metadata: {
            dataAccessed: data.dataAccessed,
            tokensUsed: data.tokensUsed,
            hasInsights: (data.insights?.length || 0) > 0,
            hasVisualizations: (data.visualizations?.length || 0) > 0,
            insights: data.insights || [],
            visualizations: data.visualizations || []
          }
        });
      }

      // Clear attachments after successful send
      if (attachmentsToSend.length > 0) {
        setAttachments([]);
      }

    } catch (error) {
      console.error('Error in chat assistant:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Erro ao enviar mensagem', {
        description: 'Não foi possível processar sua solicitação'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 **Olá novamente!**

Estou pronto para ajudar. Posso:
• Consultar e analisar seus dados ESG
• Criar e gerenciar registros (com sua confirmação)
• Responder perguntas sobre o sistema

**O que você gostaria de fazer?**`,
        timestamp: new Date(),
      }
    ]);
  };

  const confirmAction = async (action: PendingAction) => {
    setIsLoading(true);
    setPendingAction(null);

    try {
      const companyId = user?.company.id;
      if (!companyId) {
        throw new Error('Company ID not found');
      }

      console.log('Confirming action:', action);

      // Add message showing action is being executed
      const executingMessage: ChatMessage = {
        id: `executing-${Date.now()}`,
        role: 'assistant',
        content: `⏳ Executando: **${action.displayName}**...\n\nPor favor, aguarde enquanto processo sua solicitação.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, executingMessage]);

      // Call edge function with confirmation
      const { data, error } = await supabase.functions.invoke('daton-ai-chat', {
        body: {
          messages: [],
          companyId,
          confirmed: true,
          action: action
        }
      });

      if (error) {
        console.error('Action execution error:', error);
        throw error;
      }

      console.log('Action executed successfully:', data);

      // Add success message
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: data.message || `✅ **Ação executada com sucesso!**\n\n${action.displayName} foi concluída.`,
        timestamp: new Date(),
        context: 'Ação executada com sucesso',
      };

      setMessages(prev => [...prev, successMessage]);

      toast.success('Ação executada com sucesso', {
        description: action.displayName,
        duration: 5000
      });

    } catch (error) {
      console.error('Error executing action:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Erro ao executar ação**\n\nDesculpe, ocorreu um erro ao executar "${action.displayName}". Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Erro ao executar ação', {
        description: 'Não foi possível completar a operação',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAction = () => {
    const canceledAction = pendingAction;
    setPendingAction(null);
    
    const cancelMessage: ChatMessage = {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      content: `🚫 **Ação cancelada**\n\nA ação "${canceledAction?.displayName}" foi cancelada conforme solicitado.\n\n**Como posso ajudar de outra forma?**`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, cancelMessage]);
    
    toast.info('Ação cancelada', {
      description: 'A operação foi cancelada pelo usuário'
    });
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    pendingAction,
    confirmAction,
    cancelAction,
    attachments,
    addAttachment,
    removeAttachment,
    isUploading
  };
}
