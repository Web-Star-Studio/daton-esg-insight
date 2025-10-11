// Chat assistant hook with AI action confirmation capabilities
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PendingAction } from '@/components/ai/AIActionConfirmation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
  marketInfo?: string;
  companyName?: string;
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
  sendMessage: (content: string, currentPage?: string) => Promise<void>;
  clearMessages: () => void;
  pendingAction: PendingAction | null;
  confirmAction: (action: PendingAction) => Promise<void>;
  cancelAction: () => void;
}

export function useChatAssistant(): UseChatAssistantReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 **Olá! Sou o Assistente IA do Daton**, seu parceiro inteligente em gestão ESG.

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
  const { profile } = useAuth();

  const sendMessage = async (content: string, currentPage?: string) => {
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
      const companyId = profile?.company_id;
      if (!companyId) {
        throw new Error('Company ID not found');
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

      // Call Daton AI Chat edge function
      const { data, error } = await supabase.functions.invoke('daton-ai-chat', {
        body: {
          messages: apiMessages,
          companyId,
          currentPage: currentPage || 'dashboard'
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
          companyName: profile?.company_id ? 'Dados da empresa' : undefined,
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
        companyName: profile?.company_id ? 'Dados da empresa' : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);

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
      const companyId = profile?.company_id;
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
  };
}
