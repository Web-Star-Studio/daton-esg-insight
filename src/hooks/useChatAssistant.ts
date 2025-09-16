import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestedActions?: Array<{
    type: 'navigate' | 'action';
    label: string;
    path?: string;
    action?: string;
  }>;
  context?: string;
  marketInfo?: string;
  companyName?: string;
  dataFound?: boolean;
}

export const useChatAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a **Assistente ESG IA da Daton**, sua especialista em sustentabilidade empresarial. Tenho acesso completo aos dados da sua empresa e posso ajudar com:\n\n🏢 **Análises da sua empresa**: licenças, emissões, metas, auditorias, documentos\n📊 **Insights de mercado**: benchmarks, tendências, regulamentações\n🎯 **Recomendações práticas**: ações específicas e oportunidades\n\nComo posso ajudar você hoje?',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string, currentPage: string = 'dashboard') => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('ai-chat-assistant', {
        body: {
          message: content,
          currentPage,
          userId: user.id,
        },
      });

      if (error) {
        throw error;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestedActions: data.suggestedActions,
        context: data.context,
        marketInfo: data.marketInfo,
        companyName: data.companyName,
        dataFound: data.dataFound,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erro no Assistente",
        description: "Não foi possível processar sua mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const clearMessages = useCallback(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Olá! Sou a **Assistente ESG IA da Daton**, sua especialista em sustentabilidade empresarial. Tenho acesso completo aos dados da sua empresa e posso ajudar com:\n\n🏢 **Análises da sua empresa**: licenças, emissões, metas, auditorias, documentos\n📊 **Insights de mercado**: benchmarks, tendências, regulamentações\n🎯 **Recomendações práticas**: ações específicas e oportunidades\n\nComo posso ajudar você hoje?',
      timestamp: new Date(),
    }]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};