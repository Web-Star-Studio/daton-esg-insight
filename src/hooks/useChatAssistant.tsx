// Chat assistant hook with AI action confirmation capabilities
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PendingAction } from '@/components/ai/AIActionConfirmation';
import { FileAttachmentData } from '@/types/attachment';
import { useAttachments } from '@/hooks/useAttachments';
import { logger } from '@/utils/logger';

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
}

export function useChatAssistant(): UseChatAssistantReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Olá! Sou o Assistente IA Elite do Daton**, seu consultor ESG com inteligência avançada.

**🎯 ACESSO TOTAL AO SISTEMA**
Tenho acesso **completo e em tempo real** a TODOS os dados e módulos da sua empresa. Posso consultar, analisar e gerar insights sobre qualquer informação do sistema instantaneamente!

**📎 ANÁLISE INTELIGENTE DE ARQUIVOS**
Você pode anexar documentos (PDF, CSV, Excel, imagens, Word) e eu posso:
✅ Extrair e classificar dados automaticamente com IA
✅ Sugerir ações inteligentes baseadas no conteúdo
✅ Cadastrar licenças, emissões, metas de PDFs/planilhas
✅ Ler medidores, formulários e documentos em fotos
✅ Processar relatórios, notas fiscais e certificados
✅ Importar dados em massa com validação

**🔍 BUSCA E CONSULTA GLOBAL**
Posso buscar e analisar instantaneamente:
🌍 **Ambiental:** Emissões GEE, resíduos, licenças, água, energia
👥 **Social:** Colaboradores, treinamentos, diversidade, segurança
🏛️ **Governança:** Auditorias, compliance, políticas, certificações
🎯 **Estratégia:** Metas ESG, OKRs, projetos, indicadores KPI
📊 **Operacional:** Tarefas, fornecedores, documentos, relatórios GRI
⚠️ **Riscos:** Riscos ESG, oportunidades, não conformidades

**🧠 ANÁLISES AVANÇADAS**
Capacidades de inteligência preditiva:
📈 Análise de tendências e padrões temporais
🔮 Previsão de métricas futuras com IA
🔗 Descoberta de correlações entre indicadores
⚖️ Comparação de períodos e benchmarking
📋 Relatórios executivos com insights acionáveis

**✏️ AÇÕES DE GERENCIAMENTO**
Com sua confirmação, posso criar/atualizar:
• Metas, OKRs, projetos e iniciativas estratégicas
• Tarefas, cronogramas e agendamentos
• Licenças, certificações e renovações
• Emissões, resíduos, água e energia
• Riscos, NCs, ações corretivas
• Colaboradores, fornecedores, stakeholders
• Indicadores, medições e relatórios
• Auditorias, treinamentos e programas

**💡 EXEMPLOS DE USO**
Fale naturalmente comigo:
🔍 "Busque tudo relacionado a 'carbono neutralidade'"
📊 "Mostre o resumo executivo de todas as áreas ESG"
📈 "Analise a tendência de emissões dos últimos 12 meses"
⚠️ "Quais são os riscos críticos e o que recomendar?"
🎯 "Como está o progresso das metas ambientais?"
📋 "Liste os documentos de certificação ISO vencidos"
👥 "Quantos colaboradores temos por departamento?"
🔮 "Preveja nossas emissões para os próximos 6 meses"

*💡 Dica: Anexe arquivos para análise automática com IA!*
*✅ Todas as ações de escrita requerem sua confirmação.*

**Como posso ajudar você hoje?** 🚀`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const hasInitializedRef = useRef(false);
  const isEnsuring = useRef(false);

  // Storage keys for localStorage caching
  const CACHE_PREFIX = 'chat_messages_';
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

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
      // CLIENT-SIDE ATTACHMENT FALLBACK
      // Parse attachments and inject content into conversation
      // ============================================
      if (finalProcessedAttachments.length > 0) {
        console.log('🔍 Pre-processing attachments on client side for guaranteed context...');
        
        const attachmentSummaries: string[] = [];
        let successCount = 0;
        
        for (const attachment of finalProcessedAttachments) {
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
            `\n🤖 INSTRUÇÃO PARA IA: O usuário anexou arquivos. O conteúdo extraído está abaixo. VOCÊ DEVE ANALISAR E USAR ESSES DADOS.\n\n` +
            `${'='.repeat(60)}\n` +
            `🔍 CONTEXTO DOS ARQUIVOS ANEXADOS\n` +
            `${'='.repeat(60)}\n` +
            `${attachmentSummaries.join('\n\n')}\n\n` +
            `${'='.repeat(60)}\n` +
            `⚡ INSTRUÇÕES CRÍTICAS:\n` +
            `• Os dados acima foram extraídos dos ${successCount} arquivo(s) anexado(s)\n` +
            `• VOCÊ TEM ACESSO a esse conteúdo - use-o para responder perguntas\n` +
            `• RESPONDA perguntas diretas sobre os dados (quantas linhas, totais, etc.)\n` +
            `• NUNCA diga que não consegue ler arquivos - o conteúdo está AQUI\n` +
            `• Se solicitado importar dados, use as ferramentas apropriadas\n` +
            `${'='.repeat(60)}\n`;

          apiMessages.push({
            role: 'user',
            content: contextContent
          });

          console.log(`✅ Injected ${attachmentSummaries.length} attachment summaries into conversation context`);
          console.log(`📄 Context preview:`, contextContent.substring(0, 300) + '...');
          
          toast.success('Conteúdo dos anexos incluído na análise', {
            description: `${successCount} de ${finalProcessedAttachments.length} arquivo(s) processado(s)`,
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
        hasAttachments: finalProcessedAttachments.length > 0,
        attachmentCount: finalProcessedAttachments.length,
        attachments: finalProcessedAttachments,
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
          attachments: finalProcessedAttachments.length > 0 ? finalProcessedAttachments : undefined,
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

  // clearSentAttachments now provided by useAttachments hook

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
    conversationId
  };
}
