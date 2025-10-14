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
  isLoadingMessages: boolean;
  sendMessage: (content: string, currentPage?: string, attachments?: FileAttachmentData[]) => Promise<void>;
  clearMessages: () => void;
  startNewConversation: () => Promise<void>;
  pendingAction: PendingAction | null;
  confirmAction: (action: PendingAction) => Promise<void>;
  cancelAction: () => void;
  attachments: FileAttachmentData[];
  addAttachment: (file: File) => Promise<void>;
  removeAttachment: (id: string) => void;
  isUploading: boolean;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  listConversations: () => Promise<any[]>;
  openConversation: (convId: string) => Promise<void>;
  renameConversation: (convId: string, newTitle: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  conversationId: string | null;
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
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [attachments, setAttachments] = useState<FileAttachmentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();

  // Storage keys for localStorage caching
  const CACHE_PREFIX = 'chat_messages_';
  const ATTACHMENTS_PREFIX = 'chat_attachments_';
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  // Persist attachments to localStorage
  const persistAttachments = (convId: string, atts: FileAttachmentData[]) => {
    const storageKey = `${ATTACHMENTS_PREFIX}${convId}`;
    const serializable = atts.map(({ id, name, size, type, status, path, error }) => ({
      id, name, size, type, status, path, error
    }));
    localStorage.setItem(storageKey, JSON.stringify(serializable));
    console.log(`💾 Persisted ${serializable.length} attachments to localStorage`);
  };

  // Backup de mensagens em localStorage para recuperação rápida
  useEffect(() => {
    if (messages.length > 1 && conversationId) { // Mais que apenas boas-vindas
      const cacheData = {
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          context: m.context,
          insights: m.insights,
          visualizations: m.visualizations
        })),
        lastUpdate: new Date().toISOString(),
        conversationId // Incluir conversationId para validação
      };
      localStorage.setItem(`${CACHE_PREFIX}${conversationId}`, JSON.stringify(cacheData));
      console.log(`💾 Saved ${messages.length} messages to cache`);
    }
  }, [messages, conversationId]);

  // Restore attachments from localStorage when conversationId changes
  useEffect(() => {
    if (!conversationId) return;
    
    const storageKey = `${ATTACHMENTS_PREFIX}${conversationId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const restoredAttachments: FileAttachmentData[] = JSON.parse(stored);
        console.log(`📦 Restored ${restoredAttachments.length} attachments from localStorage for conversation ${conversationId}`);
        
        // Mark any "uploading" attachments as error (no File ref to resume)
        const validatedAttachments = restoredAttachments.map(att => {
          if (att.status === 'uploading' || att.status === 'processing') {
            return {
              ...att,
              status: 'error' as const,
              error: 'Upload interrompido. Por favor, reanexe o arquivo.'
            };
          }
          return att;
        });
        
        setAttachments(validatedAttachments);
      } catch (error) {
        console.error('Failed to restore attachments:', error);
      }
    }
  }, [conversationId]);

  // Initialize or load conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!user?.company.id) return;

      try {
        console.log('🔍 Looking for existing conversation...');
        
        // Buscar conversação mais recente (últimas 24h)
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        
        const { data: existingConv, error: fetchError } = await supabase
          .from('ai_chat_conversations')
          .select('*')
          .eq('company_id', user.company.id)
          .eq('user_id', user.id)
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (existingConv) {
          console.log('♻️ Reusing existing conversation:', existingConv.id);
          setConversationId(existingConv.id);
        } else {
          console.log('🆕 Creating new conversation');
          
          // Criar nova conversação
          const { data: newConv, error: createError } = await supabase
            .from('ai_chat_conversations')
            .insert({
              company_id: user.company.id,
              user_id: user.id,
              title: 'Nova Conversa'
            })
            .select()
            .single();

          if (createError) throw createError;
          
          console.log('✅ New conversation created:', newConv.id);
          setConversationId(newConv.id);
          
          // Salvar mensagem de boas-vindas no banco
          const welcomeMessage = messages[0];
          await supabase.from('ai_chat_messages').insert({
            conversation_id: newConv.id,
            company_id: user.company.id,
            user_id: user.id,
            role: 'assistant',
            content: welcomeMessage.content,
            metadata: {
              isWelcomeMessage: true
            }
          });
          console.log('✅ Welcome message saved to database');
        }
      } catch (error) {
        console.error('❌ Error initializing conversation:', error);
        toast.error('Erro ao inicializar chat', {
          description: 'Não foi possível conectar ao assistente'
        });
      }
    };

    initConversation();
  }, [user?.company.id, user?.id]);

  // Carregar de localStorage na inicialização (recuperação rápida)
  useEffect(() => {
    if (conversationId) {
      const cached = localStorage.getItem(`chat_messages_${conversationId}`);
      if (cached) {
        try {
          const { messages: cachedMessages, lastUpdate, conversationId: cachedConvId } = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(lastUpdate).getTime();
          
          // Usar cache se tiver menos de 24 horas e corresponder à conversação atual
          if (cacheAge < 24 * 60 * 60 * 1000 && cachedConvId === conversationId) {
            console.log('⚡ Using cached messages');
            
            // Verificar se tem mensagem de boas-vindas
            const hasWelcome = cachedMessages.some((m: any) => 
              m.id === 'welcome' || 
              m.content.includes('Olá! Sou o Assistente IA do Daton')
            );
            
            const loadedMessages = cachedMessages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));
            
            // Se não tem boas-vindas, adicionar
            if (!hasWelcome) {
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: messages[0].content, // Usar a mensagem inicial do estado
                  timestamp: new Date(),
                },
                ...loadedMessages
              ]);
            } else {
              setMessages(loadedMessages);
            }
            setIsLoadingMessages(false);
          }
        } catch (e) {
          console.warn('Failed to parse cached messages:', e);
        }
      }
    }
  }, [conversationId]);

  // Carregar mensagens da conversação do banco de dados
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) return;
      
      setIsLoadingMessages(true);
      
      try {
        console.log('📥 Loading messages for conversation:', conversationId);
        
        const { data: savedMessages, error } = await supabase
          .from('ai_chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (savedMessages && savedMessages.length > 0) {
          const loadedMessages: ChatMessage[] = savedMessages.map(msg => {
            const metadata = msg.metadata as any || {};
            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              context: metadata.dataAccessed ? 
                `Dados consultados: ${metadata.dataAccessed.join(', ')}` : 
                undefined,
              insights: metadata.insights || [],
              visualizations: metadata.visualizations || []
            };
          });
          
          // Verificar se já tem mensagem de boas-vindas
          const hasWelcomeMessage = loadedMessages.some(msg => 
            msg.id === 'welcome' || 
            msg.content.includes('Olá! Sou o Assistente IA do Daton')
          );
          
          // Se não tem boas-vindas, adicionar no início
          if (!hasWelcomeMessage) {
            const welcomeMessage: ChatMessage = {
              id: 'welcome',
              role: 'assistant',
              content: messages[0].content, // Usar a mensagem inicial do estado
              timestamp: new Date(savedMessages[0].created_at),
            };
            setMessages([welcomeMessage, ...loadedMessages]);
            console.log(`✅ Loaded ${loadedMessages.length} messages (+ welcome message)`);
          } else {
            setMessages(loadedMessages);
            console.log(`✅ Loaded ${loadedMessages.length} messages`);
          }
        }
      } catch (error) {
        console.error('❌ Error loading messages:', error);
        toast.error('Erro ao carregar histórico', {
          description: 'Não foi possível carregar o histórico da conversa'
        });
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    loadMessages();
  }, [conversationId]);

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
    // Prevent race condition: lock uploading state immediately
    setIsUploading(true);
    
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

        console.log('✅ Upload verified successfully');

        // Log upload to database
        const companyId = user?.company.id;
        if (companyId) {
          const { error: logError } = await supabase.from('chat_file_uploads').insert({
            company_id: companyId,
            user_id: authUser.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_path: filePath,
            processing_status: 'uploaded'
          });

          if (logError) {
            console.error('⚠️ Error logging upload:', logError);
            // Non-critical error, continue
          } else {
            console.log('✅ Upload logged to database');
          }
        }

        // Update status to uploaded (skip processing status)
        setAttachments(prev => {
          const updated = prev.map(att => 
            att.id === id ? { ...att, status: 'uploaded' as const, path: filePath } : att
          );
          // Persist to localStorage after upload completes
          if (conversationId) {
            persistAttachments(conversationId, updated);
          }
          return updated;
        });

        toast.success('Arquivo enviado com sucesso', {
          description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
        });

        console.log('✅ File ready to send:', { name: file.name, path: filePath });

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
  };

  const removeAttachment = (id: string) => {
    if (isSending) {
      console.warn('⚠️ Cannot remove attachments while sending - operation blocked');
      toast.warning('Aguarde o envio da mensagem');
      return;
    }
    
    setAttachments(prev => {
      const filtered = prev.filter(att => att.id !== id);
      console.log('🗑️ Attachment removed:', id, '- Remaining:', filtered.length);
      // Se não há mais anexos em upload, desabilitar isUploading
      const anyUploading = filtered.some(att => att.status === 'uploading' || att.status === 'processing');
      if (!anyUploading && isUploading) {
        setIsUploading(false);
      }
      return filtered;
    });
  };

  // Monitor attachment status changes to update isUploading
  useEffect(() => {
    // Don't update isUploading state during message sending
    if (isSending) {
      console.log('🔒 Upload status check skipped - message is being sent');
      return;
    }
    
    const anyUploading = attachments.some(att => 
      att.status === 'uploading' || att.status === 'processing'
    );
    
    if (anyUploading !== isUploading) {
      setIsUploading(anyUploading);
      console.log('🔄 Upload status changed:', anyUploading ? 'uploading' : 'ready');
    }
  }, [attachments, isSending, isUploading]);

  const sendMessage = async (content: string, currentPage?: string, messageAttachments?: FileAttachmentData[]) => {
    if (!content.trim()) return;

    // Lock sending state to prevent race conditions
    setIsSending(true);
    console.log('🔒 Message sending started - attachments and state locked');

    try {
      // Create snapshot of attachments to prevent race conditions
      const attachmentsSnapshot = [...(messageAttachments || attachments)];
      console.log('📸 Attachments snapshot created:', {
        snapshotCount: attachmentsSnapshot.length,
        files: attachmentsSnapshot.map(a => ({ name: a.name, status: a.status, hasPath: !!a.path }))
      });
      
      // Check if any attachments are still uploading
      const stillUploading = attachmentsSnapshot.some(att => 
        att.status === 'uploading' || att.status === 'processing'
      );
      
      if (stillUploading) {
        toast.warning('Aguarde o upload dos anexos', {
          description: 'Aguarde enquanto os arquivos são enviados antes de enviar a mensagem.'
        });
        return;
      }

      // Process attachments FIRST before adding user message
      console.log('📎 Attachments to send:', attachmentsSnapshot.length);
      if (attachmentsSnapshot.length > 0) {
        console.log('📎 Attachment details:', attachmentsSnapshot.map(a => ({ 
          name: a.name, 
          status: a.status, 
          hasPath: !!a.path,
          path: a.path
        })));
      }

      const processedAttachments = attachmentsSnapshot
        .filter(att => att.status === 'uploaded' && att.path)
        .map(att => ({
          name: att.name,
          type: att.type,
          size: att.size,
          path: att.path!
        }));

      console.log('✅ Processed attachments ready to send:', processedAttachments.length);
      if (processedAttachments.length > 0) {
        console.log('✅ Attachments being sent:', processedAttachments.map(a => ({ name: a.name, path: a.path })));
      }

      if (attachmentsSnapshot.length > 0 && processedAttachments.length === 0) {
        toast.error('Erro nos anexos', {
          description: 'Nenhum arquivo foi enviado com sucesso. Por favor, tente novamente.'
        });
        return;
      }

      // Add user message with attachment info
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

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
            hasAttachments: processedAttachments.length > 0,
            attachmentCount: processedAttachments.length,
            attachmentNames: processedAttachments.map(a => a.name)
          }
        });
      }

      // Prepare messages for API (only content and role)
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // ============================================
      // CLIENT-SIDE ATTACHMENT FALLBACK
      // Parse attachments and inject content into conversation
      // ============================================
      if (processedAttachments.length > 0) {
        console.log('🔍 Pre-processing attachments on client side for guaranteed context...');
        
        const attachmentSummaries: string[] = [];
        let successCount = 0;
        
        for (const attachment of processedAttachments) {
          try {
            console.log(`📄 Parsing ${attachment.name} via parse-chat-document...`);
            
            const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-chat-document', {
              body: {
                filePath: attachment.path,
                fileType: attachment.type,
                useVision: attachment.type.startsWith('image/')
              }
            });

            if (parseError) {
              console.error(`❌ Parse error for ${attachment.name}:`, parseError);
              attachmentSummaries.push(
                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📎 **${attachment.name}** (${(attachment.size / 1024).toFixed(1)} KB)\n` +
                `❌ Falha ao processar: ${parseError.message || 'Erro desconhecido'}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
              );
              continue;
            }

            if (!parseResult?.success || !parseResult?.content) {
              console.warn(`⚠️ No content extracted from ${attachment.name}`);
              attachmentSummaries.push(
                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📎 **${attachment.name}** (${(attachment.size / 1024).toFixed(1)} KB)\n` +
                `⚠️ Nenhum conteúdo foi extraído do arquivo\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
              );
              continue;
            }

            // Build summary
            let summary = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            summary += `📎 **ARQUIVO: ${attachment.name}**\n`;
            summary += `📏 Tamanho: ${(attachment.size / 1024).toFixed(1)} KB\n`;
            summary += `📋 Tipo: ${attachment.type}\n`;

            // Structured data (CSV/Excel)
            if (parseResult.structured?.headers && parseResult.structured?.rows) {
              const headers = parseResult.structured.headers;
              const rowCount = parseResult.structured.rows.length;
              
              summary += `\n📊 **Dados Estruturados:**\n`;
              summary += `   • Colunas (${headers.length}): ${headers.slice(0, 15).join(', ')}${headers.length > 15 ? '...' : ''}\n`;
              summary += `   • Total de linhas: ${rowCount}\n`;
              
              if (rowCount > 0) {
                summary += `\n📝 **Amostra (primeiras 3 linhas):**\n`;
                parseResult.structured.rows.slice(0, 3).forEach((row: any, idx: number) => {
                  summary += `   ${idx + 1}. ${JSON.stringify(row).substring(0, 200)}${JSON.stringify(row).length > 200 ? '...' : ''}\n`;
                });
              }
            }

            // Text content
            const contentLength = parseResult.content.length;
            const contentPreview = parseResult.content.substring(0, 2500);
            summary += `\n📄 **Conteúdo Extraído (${contentLength} caracteres):**\n`;
            summary += `\`\`\`\n${contentPreview}${contentLength > 2500 ? '\n\n... (conteúdo truncado para exibição)' : ''}\n\`\`\`\n`;
            summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            attachmentSummaries.push(summary);
            successCount++;
            console.log(`✅ Successfully parsed ${attachment.name}`);

          } catch (err) {
            console.error(`❌ Critical error parsing ${attachment.name}:`, err);
            attachmentSummaries.push(
              `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `📎 **${attachment.name}** (${(attachment.size / 1024).toFixed(1)} KB)\n` +
              `❌ Erro crítico: ${err instanceof Error ? err.message : 'Erro desconhecido'}\n` +
              `Por favor, tente enviar novamente ou use outro formato.\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            );
          }
        }

        // Inject summaries as context message before user's message
        if (attachmentSummaries.length > 0) {
          const contextContent = 
            `\n${'='.repeat(60)}\n` +
            `🔍 **CONTEXTO DOS ARQUIVOS ANEXADOS**\n` +
            `${'='.repeat(60)}\n` +
            `${attachmentSummaries.join('\n\n')}\n\n` +
            `⚡ **Instruções:**\n` +
            `• Os dados acima foram extraídos dos arquivos anexados pelo usuário\n` +
            `• Use essas informações para responder perguntas e executar análises\n` +
            `• ${successCount} de ${processedAttachments.length} arquivo(s) processado(s) com sucesso\n` +
            `${'='.repeat(60)}\n`;

          apiMessages.push({
            role: 'user',
            content: contextContent
          });

          console.log(`✅ Injected ${attachmentSummaries.length} attachment summaries into conversation context`);
          
          toast.success('Conteúdo dos anexos incluído na análise', {
            description: `${successCount} de ${processedAttachments.length} arquivo(s) processado(s)`,
            duration: 4000
          });
        }
      }

      // Add current user message
      apiMessages.push({
        role: 'user',
        content
      });

      console.log('📤 Sending chat request to Daton AI...', {
        hasAttachments: processedAttachments.length > 0,
        attachmentCount: processedAttachments.length,
        attachments: processedAttachments,
        messageLength: content.length,
        totalApiMessages: apiMessages.length
      });

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

      console.log('📨 Edge function response received:', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [] 
      });

      if (error) {
        console.error('❌ Chat AI error:', error);
        
        // Check for specific error codes
        if (error.message?.includes('429') || data?.error === 'Rate limits exceeded') {
          toast.error('Limite de requisições atingido', {
            description: '⏳ Por favor, aguarde alguns instantes e tente novamente.'
          });
          throw new Error('Rate limit exceeded');
        }
        
        if (error.message?.includes('402') || data?.error === 'Payment required') {
          toast.error('Créditos de IA esgotados', {
            description: '💳 Adicione créditos na sua workspace Lovable para continuar.'
          });
          throw new Error('Payment required');
        }
        
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
      if (processedAttachments.length > 0) {
        console.log('🧹 Clearing attachments after successful send');
        setAttachments([]);
        
        if (conversationId) {
          localStorage.removeItem(`chat_attachments_${conversationId}`);
          
          await supabase
            .from('ai_chat_conversations')
            .update({ 
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId);
        }
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
      setIsSending(false);
      console.log('🔓 Message sending completed - state unlocked');
    }
  };

  // Start a completely new conversation
  const startNewConversation = async () => {
    if (isSending) {
      toast.warning('Aguarde o envio da mensagem atual');
      return;
    }
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not authenticated');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', authUser.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Company not found');
      
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('ai_chat_conversations')
        .insert({
          company_id: profile.company_id,
          user_id: authUser.id,
          title: 'Nova Conversa',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✨ Created new conversation:', newConv.id);
      
      // Clear old conversation cache
      if (conversationId) {
        localStorage.removeItem(`chat_messages_${conversationId}`);
        localStorage.removeItem(`chat_attachments_${conversationId}`);
      }
      
      // Set new conversation
      setConversationId(newConv.id);
      setMessages([{
        id: 'welcome',
        role: 'assistant' as const,
        content: `Olá! Sou o assistente IA de ESG da sua empresa. Como posso ajudar você hoje?

Posso auxiliar com:
- 📊 Análise de dados e métricas ESG
- 🎯 Gerenciamento de metas e progresso
- 📋 Tarefas e coleta de dados
- 📄 Licenciamento e conformidade
- ♻️ Inventário de emissões e resíduos
- 💡 Sugestões e insights proativos

Qual informação você precisa?`,
        timestamp: new Date()
      }]);
      setAttachments([]);
      
      toast.success('Nova conversa iniciada');
    } catch (error) {
      console.error('Failed to start new conversation:', error);
      toast.error('Erro ao criar nova conversa');
    }
  };

  const clearMessages = startNewConversation; // Alias for backwards compatibility
  
  // List all conversations for current user
  const listConversations = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return [];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', authUser.id)
        .single();
      
      if (!profile?.company_id) return [];
      
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('user_id', authUser.id)
        .order('last_message_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to list conversations:', error);
      return [];
    }
  };
  
  // Open existing conversation
  const openConversation = async (convId: string) => {
    try {
      console.log('🔄 Opening conversation:', convId);
      
      // Load messages for this conversation
      const { data: msgs, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const formattedMessages = (msgs || []).map(msg => {
        const metadata = msg.metadata as any;
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          insights: metadata?.insights || [],
          visualizations: metadata?.visualizations || []
        };
      });
      
      // Add welcome if no messages
      if (formattedMessages.length === 0) {
        formattedMessages.unshift({
          id: 'welcome',
          role: 'assistant' as const,
          content: `Olá! Sou o assistente IA de ESG da sua empresa. Como posso ajudar você hoje?

Posso auxiliar com:
- 📊 Análise de dados e métricas ESG
- 🎯 Gerenciamento de metas e progresso
- 📋 Tarefas e coleta de dados
- 📄 Licenciamento e conformidade
- ♻️ Inventário de emissões e resíduos
- 💡 Sugestões e insights proativos

Qual informação você precisa?`,
          timestamp: new Date(),
          insights: [],
          visualizations: []
        });
      }
      
      setConversationId(convId);
      setMessages(formattedMessages);
      
      console.log(`✅ Opened conversation with ${formattedMessages.length} messages`);
      toast.success('Conversa carregada');
    } catch (error) {
      console.error('Failed to open conversation:', error);
      toast.error('Erro ao abrir conversa');
    }
  };
  
  // Rename conversation
  const renameConversation = async (convId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('ai_chat_conversations')
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq('id', convId);
      
      if (error) throw error;
      toast.success('Conversa renomeada');
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      toast.error('Erro ao renomear conversa');
    }
  };
  
  // Delete conversation
  const deleteConversation = async (convId: string) => {
    try {
      // Delete messages first
      await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('conversation_id', convId);
      
      // Delete conversation
      const { error } = await supabase
        .from('ai_chat_conversations')
        .delete()
        .eq('id', convId);
      
      if (error) throw error;
      
      // Clear localStorage
      localStorage.removeItem(`chat_messages_${convId}`);
      localStorage.removeItem(`chat_attachments_${convId}`);
      
      // If deleting current conversation, start new one
      if (convId === conversationId) {
        await startNewConversation();
      }
      
      toast.success('Conversa excluída');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Erro ao excluir conversa');
    }
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
        
        // Check for specific error codes
        if (error.message?.includes('429') || data?.error === 'Rate limits exceeded') {
          toast.error('Limite de requisições atingido', {
            description: '⏳ Por favor, aguarde alguns instantes e tente novamente.'
          });
          throw new Error('Rate limit exceeded');
        }
        
        if (error.message?.includes('402') || data?.error === 'Payment required') {
          toast.error('Créditos de IA esgotados', {
            description: '💳 Adicione créditos na sua workspace Lovable para continuar.'
          });
          throw new Error('Payment required');
        }
        
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
    isLoadingMessages,
    sendMessage,
    clearMessages,
    startNewConversation,
    pendingAction,
    confirmAction,
    cancelAction,
    attachments,
    addAttachment,
    removeAttachment,
    isUploading,
    showHistory,
    setShowHistory,
    listConversations,
    openConversation,
    renameConversation,
    deleteConversation,
    conversationId
  };
}
