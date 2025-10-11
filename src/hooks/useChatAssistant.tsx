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
      content: `👋 Olá! Sou o **Assistente IA do Daton**, seu parceiro inteligente em gestão ESG.

Tenho acesso **completo** aos dados da sua empresa e posso:

**📊 ANALISAR:**
🌍 Emissões de GEE e inventário de carbono
📋 Licenças ambientais e vencimentos
🎯 Progresso de metas e KPIs ESG
♻️ Métricas de resíduos e destinação
👥 Dados de colaboradores e indicadores sociais
⚖️ Status de conformidade e auditorias

**✏️ CRIAR E GERENCIAR:**
✨ Criar novas metas ESG
📝 Adicionar registros de emissões
🗓️ Criar e atribuir tarefas
📄 Registrar licenças ambientais
📊 Adicionar logs de resíduos

*Todas as ações de escrita requerem sua confirmação antes de serem executadas.*

**Como posso ajudar você hoje?**`,
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
          content: data.message || 'Desculpe, não consegui gerar uma resposta adequada.',
          timestamp: new Date(),
          context: data.dataAccessed ? `Dados consultados: ${data.dataAccessed.join(', ')}` : undefined,
          companyName: profile?.company_id ? 'Dados da empresa' : undefined,
          pendingAction: action,
        };

        setMessages(prev => [...prev, assistantMessage]);
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
        content: `👋 Olá! Sou o **Assistente IA do Daton**.

**Como posso ajudar você hoje?**`,
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

      console.log('Action executed:', data);

      // Add success message
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: data.message || '✅ Ação executada com sucesso!',
        timestamp: new Date(),
        context: 'Ação executada',
      };

      setMessages(prev => [...prev, successMessage]);

      toast.success('Ação executada com sucesso', {
        description: action.displayName
      });

    } catch (error) {
      console.error('Error executing action:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Erro ao executar a ação. Por favor, tente novamente.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Erro ao executar ação', {
        description: 'Não foi possível completar a operação'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    
    const cancelMessage: ChatMessage = {
      id: `cancel-${Date.now()}`,
      role: 'assistant',
      content: '🚫 Ação cancelada. Como posso ajudar de outra forma?',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, cancelMessage]);
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
