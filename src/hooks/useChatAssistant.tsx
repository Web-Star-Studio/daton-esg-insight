import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
}

export function useChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Olá! Sou o **Assistente IA do Daton**, seu parceiro inteligente em gestão ESG.

Tenho acesso a todos os dados da sua empresa e posso ajudar com:

🌍 **Análise de Emissões** - Inventário GEE, fontes e tendências
📋 **Gestão de Licenças** - Status, vencimentos e renovações
🎯 **Acompanhamento de Metas** - Progresso ESG e KPIs
♻️ **Gestão de Resíduos** - Métricas e destinação
👥 **Dados Sociais** - Colaboradores e indicadores
⚖️ **Conformidade** - Status regulatório e auditorias

**Como posso ajudar você hoje?**`,
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
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

      // Add assistant message
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

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}
