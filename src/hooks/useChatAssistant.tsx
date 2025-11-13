// Chat assistant hook with AI action confirmation capabilities
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PendingAction } from '@/components/ai/AIActionConfirmation';
import { FileAttachmentData } from '@/types/attachment';
import { useAttachments } from '@/hooks/useAttachments';
import { useIntelligentAnalysis } from '@/hooks/useIntelligentAnalysis';
import { parseFileClientSide } from '@/utils/clientSideParsers';
import { setupAutomaticCleanup, cleanupStaleCache } from '@/utils/memoryCleanup';
import { ActionCardData } from '@/components/ai/ActionCard';
import { VisualizationData } from '@/components/ai/ContextualVisualization';
import { usePageContext } from '@/hooks/usePageContext';
import { Operation } from '@/components/ai/OperationCard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
  marketInfo?: string;
  companyName?: string;
  insights?: any[];
  visualizations?: VisualizationData[];
  actionCards?: ActionCardData[];
  dataQuality?: {
    score: number;
    issues: Array<{
      type: 'missing' | 'outlier' | 'format' | 'duplicate' | 'inconsistent';
      field: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  };
  suggestedActions?: Array<{
    type: 'navigate' | 'action';
    label: string;
    path?: string;
    action?: () => void;
  }>;
  pendingAction?: PendingAction;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    path: string;
  }>;
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
  clearSentAttachments: () => void;
  isUploading: boolean;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  listConversations: () => Promise<any[]>;
  openConversation: (convId: string) => Promise<void>;
  renameConversation: (convId: string, newTitle: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  conversationId: string | null;
  executeAction: (action: ActionCardData) => Promise<void>;
  pendingOperations: Operation[];
  showOperationsPreview: boolean;
  setShowOperationsPreview: (show: boolean) => void;
  executeOperations: (operations: Operation[]) => Promise<void>;
  operationsValidations: any[];
  operationsSummary: string;
  isProcessingAttachments: boolean;
  processingProgress: number;
}

/**
 * Map table to bulk import tool name
 */
function getToolFromTable(table: string): string | null {
  const mapping: Record<string, string> = {
    'emission_sources': 'bulk_import_emissions',
    'employees': 'bulk_import_employees',
    'goals': 'bulk_import_goals',
    'waste_logs': 'bulk_import_waste'
  };
  return mapping[table] || null;
}

/**
 * Prepare bulk import params based on tool name
 */
function getBulkImportParams(toolName: string, records: any[]): any {
  const paramKey = toolName.replace('bulk_import_', '');
  return {
    [paramKey]: records,
    skip_duplicates: true
  };
}

export function useChatAssistant(): UseChatAssistantReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou o assistente IA de ESG da sua empresa. Como posso ajudar você hoje?

Posso auxiliar com:

• 📊 Análise de dados e métricas ESG
• 🎯 Gerenciamento de metas e progresso
• 📋 Tarefas e coleta de dados
• 🔍 Licenciamento e conformidade
• ♻️ Inventário de emissões e resíduos
• 💡 Sugestões e insights proativos

Qual informação você precisa?`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Operation[]>([]);
  const [showOperationsPreview, setShowOperationsPreview] = useState(false);
  const [operationsValidations, setOperationsValidations] = useState<any[]>([]);
  const [operationsSummary, setOperationsSummary] = useState('');
  const { user } = useAuth();
  const hasInitializedRef = useRef(false);
  const isEnsuring = useRef(false);
  const pageContext = usePageContext();

  // Storage keys for localStorage caching
  const CACHE_PREFIX = 'chat_messages_';
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  const MAX_CACHED_MESSAGES = 100; // Limit cached messages

  // Setup automatic cleanup on mount
  useEffect(() => {
    setupAutomaticCleanup();
  }, []);

  // Use dedicated attachments hook
  const {
    attachments,
    isUploading,
    addAttachment,
    removeAttachment,
    clearSentAttachments,
    getReadyAttachments,
    markAsSending,
    markAsSent
  } = useAttachments({
    conversationId,
    companyId: user?.company.id,
    userId: user?.id
  });

  // Use intelligent analysis hook
  const { analyzeFile, isAnalyzing, analysisProgress } = useIntelligentAnalysis();

  // Processing states
  const [isProcessingAttachments, setIsProcessingAttachments] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Handle action card execution
  const handleExecuteAction = async (action: ActionCardData) => {
    console.log('🎯 Executing action:', action.title);
    
    try {
      // If action has direct execution function
      if (action.action.directAction) {
        await action.action.directAction();
        toast.success('Ação executada', {
          description: action.title
        });
        return;
      }
      
      // Otherwise, send action prompt to AI
      if (action.action.prompt) {
        await sendMessage(action.action.prompt);
      }
    } catch (error) {
      console.error('❌ Error executing action:', error);
      toast.error('Erro ao executar ação', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  // Helper: Ensure conversation exists before operations
  const ensureConversationId = async (): Promise<string> => {
    if (conversationId) return conversationId;
    
    // Prevent concurrent calls
    if (isEnsuring.current) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return conversationId || ensureConversationId();
    }
    
    isEnsuring.current = true;
    
    try {
      if (!user?.company.id || !user?.id) {
        throw new Error('User not authenticated');
      }
      
      logger.info('ensureConversationId: Creating conversation');
      
      const { data: newConv, error } = await supabase
        .from('ai_chat_conversations')
        .insert({
          company_id: user.company.id,
          user_id: user.id,
          title: 'Nova Conversa'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setConversationId(newConv.id);
      localStorage.setItem('active_conversation_id', newConv.id);
      logger.info('ensureConversationId: Created', newConv.id);
      
      return newConv.id;
    } finally {
      isEnsuring.current = false;
    }
  };

  // Removed - now handled by useAttachments hook

  // Debounced backup of messages to localStorage
  useEffect(() => {
    if (messages.length > 1 && conversationId) {
      const cacheData = {
        messages: messages.slice(-100).map(m => ({ // Only cache last 100 messages
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
          context: m.context,
          insights: m.insights,
          visualizations: m.visualizations
        })),
        lastUpdate: new Date().toISOString(),
        conversationId
      };
      
      // Use debounced persist instead of direct localStorage write
      import('@/utils/debouncedPersist').then(({ debouncedPersist }) => {
        debouncedPersist.save(`${CACHE_PREFIX}${conversationId}`, cacheData);
      });
    }
  }, [messages, conversationId]);

  // Removed - now handled by useAttachments hook

  // Initialize or load conversation (single-run with guard)
  useEffect(() => {
    const initConversation = async () => {
      if (!user?.company.id || !user?.id) return;
      if (hasInitializedRef.current) return; // prevent duplicate init
      hasInitializedRef.current = true;

      try {
        console.log('🔍 Looking for existing conversation...');

        // Try to restore active conversation from localStorage first
        const storedConvId = localStorage.getItem('active_conversation_id');
        if (storedConvId) {
          console.log('♻️ Restoring conversation from localStorage:', storedConvId);
          setConversationId(storedConvId);
          return;
        }
        
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
          localStorage.setItem('active_conversation_id', existingConv.id);
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
            
            logger.info('New conversation created', newConv.id);
            setConversationId(newConv.id);
            localStorage.setItem('active_conversation_id', newConv.id);
          localStorage.setItem('active_conversation_id', newConv.id);
          
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
            
            // Reconstruct attachments from metadata for history display
            let reconstructedAttachments: Array<{name: string; size: number; type: string; path: string}> | undefined;
            if (metadata.attachmentPaths && Array.isArray(metadata.attachmentPaths) && metadata.attachmentPaths.length > 0) {
              reconstructedAttachments = metadata.attachmentPaths.map((path: string, idx: number) => ({
                name: metadata.attachmentNames?.[idx] || `Anexo ${idx + 1}`,
                type: metadata.attachmentTypes?.[idx] || 'application/octet-stream',
                size: 0, // Size not stored in metadata, use 0 as placeholder
                path: path
              }));
            }
            
            return {
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: new Date(msg.created_at),
              context: metadata.dataAccessed ? 
                `Dados consultados: ${metadata.dataAccessed.join(', ')}` : 
                undefined,
              insights: metadata.insights || [],
              visualizations: metadata.visualizations || [],
              actionCards: metadata.actionCards || [],
              dataQuality: metadata.dataQuality,
              attachments: reconstructedAttachments
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

  // All attachment logic now handled by useAttachments hook

  const sendMessage = async (content: string, currentPage?: string, messageAttachments?: FileAttachmentData[]) => {
    if (!content.trim()) return;

    // Lock sending state to prevent race conditions
    setIsSending(true);
    console.log('🔒 Message sending started - attachments and state locked');

    try {
      // Get ready attachments from hook
      const readyAttachments = getReadyAttachments();
      
      console.log('📎 Ready attachments:', readyAttachments.length);
      
      if (readyAttachments.length > 0) {
        // Mark as sending to lock state
        markAsSending(readyAttachments.map(a => a.id));
      }

      const finalProcessedAttachments = readyAttachments.map(att => ({
        name: att.name,
        type: att.type,
        size: att.size,
        path: att.path!
      }));

      console.log('📎 Final processed attachments for message:', finalProcessedAttachments.length);

      // Add user message with attachment info
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        attachments: finalProcessedAttachments.length > 0 ? finalProcessedAttachments : undefined,
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
              hasAttachments: finalProcessedAttachments.length > 0,
              attachmentCount: finalProcessedAttachments.length,
              attachmentNames: finalProcessedAttachments.map(a => a.name),
              attachmentPaths: finalProcessedAttachments.map(a => a.path),
              attachmentTypes: finalProcessedAttachments.map(a => a.type)
            }
        });
      }

      // Prepare messages for API (only content and role)
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // ============================================
      // INTELLIGENT AI-POWERED DATA OPERATIONS
      // Use ai-chat-controller when attachments present
      // ============================================
      
      if (finalProcessedAttachments.length > 0) {
        console.log('🤖 Calling AI Chat Controller for intelligent data operations...');
        setIsProcessingAttachments(true);
        setProcessingProgress(10);
        
        try {
          // Process attachments locally
          const processedAttachments: any[] = [];
          for (let i = 0; i < finalProcessedAttachments.length; i++) {
            const attachment = finalProcessedAttachments[i];
            setProcessingProgress(10 + (i / finalProcessedAttachments.length) * 40);
            
            console.log(`📄 Parsing ${attachment.name} locally...`);
            if (attachment.file) {
              const parsed = await parseFileClientSide(attachment.file);
              if (parsed.success) {
                processedAttachments.push({
                  ...attachment,
                  parsedContent: parsed.content,
                  structured: parsed.structured
                });
              }
            }
          }
          
          setProcessingProgress(60);
          
          // Call Anthropic directly
          console.log('🧠 Calling Anthropic API...');
          const { sendToAnthropic, getApiKey, hasApiKey } = await import('@/utils/anthropicClient');
          
          if (!hasApiKey()) {
            throw new Error('Configure sua API key do Anthropic nas configurações');
          }
          
          const apiKey = getApiKey()!;
          const contextMessage = `${content}\n\nAnexos: ${processedAttachments.map(a => a.parsedContent).join('\n\n')}`;
          
          const response = await sendToAnthropic(
            [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: contextMessage }],
            apiKey
          );
          });
          
          setProcessingProgress(90);
          
          if (aiError) {
            console.error('❌ AI Controller error:', aiError);
            throw new Error(aiError.message || 'Erro ao processar com IA');
          }
          
          // Check if AI proposed operations
          if (aiResponse?.operations_proposed && aiResponse?.operations) {
            console.log('🎯 AI proposed operations:', aiResponse.operations.length);
            
            // Set operations for preview
            setPendingOperations(aiResponse.operations);
            setOperationsValidations(aiResponse.validations || []);
            setOperationsSummary(aiResponse.summary || '');
            setShowOperationsPreview(true);
            
            // Add AI response message
            const aiMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: aiResponse.response || 'Operações identificadas. Revise antes de executar.',
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, aiMessage]);
            
            // Save to database
            if (conversationId) {
              await supabase.from('ai_chat_messages').insert({
                conversation_id: conversationId,
                company_id: companyId,
                user_id: user.id,
                role: 'assistant',
                content: aiMessage.content,
                metadata: {
                  operations_proposed: true,
                  operations_count: aiResponse.operations.length
                }
              });
            }
            
            setProcessingProgress(100);
            toast.success('Análise concluída', {
              description: `${aiResponse.operations.length} operação(ões) identificada(s)`,
              duration: 5000
            });
            
            setIsLoading(false);
            setIsProcessingAttachments(false);
            
            // Mark attachments as sent
            if (readyAttachments.length > 0) {
              markAsSent(readyAttachments.map(a => a.id));
              clearSentAttachments();
            }
            
            return; // Exit early - user will review operations
          }
          
          // No operations - normal chat response
          const aiMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: aiResponse?.response || 'Entendi. Como posso ajudar?',
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          if (conversationId) {
            await supabase.from('ai_chat_messages').insert({
              conversation_id: conversationId,
              company_id: companyId,
              user_id: user.id,
              role: 'assistant',
              content: aiMessage.content
            });
          }
          
          setProcessingProgress(100);
          setIsLoading(false);
          setIsProcessingAttachments(false);
          
          // Mark attachments as sent
          if (readyAttachments.length > 0) {
            markAsSent(readyAttachments.map(a => a.id));
            clearSentAttachments();
          }
          
          return;
          
        } catch (error) {
          console.error('❌ AI Controller processing error:', error);
          setIsProcessingAttachments(false);
          throw error;
        }
      }

      // Add current user message
      apiMessages.push({
        role: 'user',
        content
      });

      console.log('📤 Sending chat request to Daton AI with streaming...', {
        hasAttachments: finalProcessedAttachments.length > 0,
        attachmentCount: finalProcessedAttachments.length,
        attachments: finalProcessedAttachments,
        messageLength: content.length,
        totalApiMessages: apiMessages.length
      });

      // Start placeholder assistant message for streaming
      const assistantMessageId = `assistant-${Date.now()}`;
      let accumulatedContent = '';
      let fullContentFromComplete = ''; // Store content from complete event
      
      const placeholderAssistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, placeholderAssistantMessage]);

      // Call Daton AI Chat edge function with streaming
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/daton-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            companyId,
            conversationId,
            currentPage: currentPage || 'dashboard',
            attachments: finalProcessedAttachments.length > 0 ? finalProcessedAttachments : undefined,
            userContext: {
              userName: user.full_name,
              companyName: user.company.name,
              userRole: user.role
            },
            stream: true
          })
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Stream error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to start stream');
      }

      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      let data: any = null;
      let error: any = null;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            
            // Token content delta
            if (parsed.delta) {
              accumulatedContent += parsed.delta;
              
              // Update message in real-time
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ));
            }
            
            // Final complete response with metadata
            if (parsed.complete) {
              fullContentFromComplete = parsed.message || accumulatedContent;
              data = parsed;
            }
          } catch {
            // Incomplete JSON, buffer it
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Flush remaining buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':')) continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.complete) {
              data = parsed;
            }
          } catch { /* ignore */ }
        }
      }

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

      // Combine analysis results from attachments - now handled by AI controller
      const combinedActionCards: ActionCardData[] = [];
      let combinedDataQuality: any = undefined;

      // Add regular assistant message - use accumulated content if data.message is empty
      const finalContent = data.message || fullContentFromComplete || accumulatedContent;
      
      const assistantMessage: ChatMessage = {
        id: assistantMessageId, // Use the same ID from streaming
        role: 'assistant',
        content: finalContent || (() => {
          // Only use fallback if we truly have no content
          if (!accumulatedContent || accumulatedContent.trim().length === 0) {
            console.warn('⚠️ Using fallback - no content accumulated during streaming');
            const pageContext = currentPage || window.location.pathname;
            const hasAttachments = finalProcessedAttachments.length > 0;
            
            if (hasAttachments) {
              return '📎 Recebi seus anexos mas não consegui gerar uma análise completa. Por favor, tente novamente.';
            }
            
            const pageMessages: Record<string, string> = {
              '/dashboard': 'Não consegui processar os dados do dashboard. Por favor, reformule sua pergunta.',
              '/inventario-gee': 'Não consegui analisar o inventário de emissões. Por favor, tente novamente.',
              '/metas': 'Não consegui verificar as metas. Por favor, reformule sua solicitação.',
              '/licenciamento': 'Não consegui analisar as licenças. Por favor, tente novamente.',
              '/gestao-tarefas': 'Não consegui consultar as tarefas. Por favor, tente novamente.',
              '/gestao-esg': 'Não consegui preparar a análise ESG. Por favor, reformule sua pergunta.'
            };
            
            return pageMessages[pageContext] || 'Desculpe, não consegui processar sua solicitação. Por favor, reformule sua pergunta ou tente novamente.';
          }
          return accumulatedContent;
        })(),
        timestamp: new Date(),
        context: data.dataAccessed ? `Dados consultados: ${data.dataAccessed.join(', ')}` : undefined,
        companyName: user?.company.name,
        insights: data.insights || [],
        visualizations: data.visualizations || [],
        actionCards: combinedActionCards.length > 0 ? combinedActionCards : undefined,
        dataQuality: combinedDataQuality
      };

      // Update the streaming message with final data (don't add duplicate)
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? assistantMessage 
          : msg
      ));

      // Save assistant message to database
      if (conversationId) {
        const insertData: any = {
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
            visualizations: data.visualizations || [],
            actionCards: combinedActionCards.length > 0 ? combinedActionCards : undefined,
            dataQuality: combinedDataQuality
          }
        };
        await supabase.from('ai_chat_messages').insert(insertData);
      }

      // Update conversation timestamp
      if (conversationId) {
        await supabase
          .from('ai_chat_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId);
      }
      
      // Mark attachments as sent using hook
      if (finalProcessedAttachments.length > 0) {
        const sentIds = readyAttachments.map(a => a.id);
        markAsSent(sentIds);
        console.log('💾 Attachments marked as sent - ready for next message');
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
      localStorage.setItem('active_conversation_id', newConv.id);
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
      // Attachments cleared automatically by useAttachments hook when conversation changes
      
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
      setConversationId(convId);
      localStorage.setItem('active_conversation_id', convId);
      
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Flush any pending persistence
      import('@/utils/debouncedPersist').then(({ debouncedPersist }) => {
        debouncedPersist.flush();
      });
      
      // Cleanup stale caches periodically
      cleanupStaleCache(CACHE_PREFIX, 7 * 24 * 60 * 60 * 1000);
      
      logger.info('🧹 Chat hook cleanup complete');
    };
  }, []);

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
    clearSentAttachments,
    isUploading,
    showHistory,
    setShowHistory,
    listConversations,
    openConversation,
    renameConversation,
    deleteConversation,
    conversationId,
    executeAction: handleExecuteAction,
    pendingOperations,
    showOperationsPreview,
    setShowOperationsPreview,
    executeOperations: async (operations: Operation[]) => {
      console.log('🎯 Executing operations:', operations.length);
      
      try {
        const companyId = user?.company.id;
        if (!companyId) throw new Error('Company ID not found');

        // Group operations by table to detect bulk imports
        const operationsByTable = operations.reduce((acc, op) => {
          if (!acc[op.table]) acc[op.table] = [];
          acc[op.table].push(op);
          return acc;
        }, {} as Record<string, Operation[]>);
        
        console.log('📦 Operations grouped by table:', Object.keys(operationsByTable));
        
        // Execute bulk imports
        for (const [table, ops] of Object.entries(operationsByTable)) {
          const bulkImportTool = getToolFromTable(table);
          
          if (bulkImportTool && ops.length > 1) {
            console.log(`📦 Bulk importing ${ops.length} records to ${table} using ${bulkImportTool}`);
            
            // Prepare records for bulk import
            const records = ops.map(o => o.data);
            
            // Call the bulk import function via write tools
            const { data, error } = await supabase.functions.invoke('daton-ai-chat', {
              body: {
                companyId,
                confirmed: true,
                action: {
                  toolName: bulkImportTool,
                  params: getBulkImportParams(bulkImportTool, records)
                }
              }
            });
            
            if (error) throw error;
            
            console.log('✅ Bulk import result:', data);
          } else {
            // Fallback to direct insert for single operations or non-bulk tables
            console.log(`💾 Direct insert for ${ops.length} operations on ${table}`);
            
            for (const op of ops) {
              try {
                if (op.type === 'INSERT') {
                  const { error } = await supabase
                    .from(op.table as any)
                    .insert({ ...op.data, company_id: companyId });
                  if (error) throw error;
                } else if (op.type === 'UPDATE') {
                  const { error } = await supabase
                    .from(op.table as any)
                    .update(op.data)
                    .match({ ...op.where_clause, company_id: companyId });
                  if (error) throw error;
                } else if (op.type === 'DELETE') {
                  const { error } = await supabase
                    .from(op.table as any)
                    .delete()
                    .match({ ...op.where_clause, company_id: companyId });
                  if (error) throw error;
                }
              } catch (error) {
                console.error(`Failed to execute ${op.type} on ${op.table}:`, error);
                throw error;
              }
            }
          }
        }
        
        // Clear operations after successful execution
        setPendingOperations([]);
        setShowOperationsPreview(false);
        
        toast.success(`✅ ${operations.length} registro(s) importado(s) com sucesso!`);
        
        // Add success message
        const successMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `✅ Executei ${operations.length} operação(ões) com sucesso! Os dados foram inseridos no sistema.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      } catch (error) {
        console.error('❌ Error executing operations:', error);
        toast.error('Erro ao executar operações', {
          description: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        throw error;
      }
    },
    operationsValidations,
    operationsSummary,
    isProcessingAttachments,
    processingProgress
  };
}
