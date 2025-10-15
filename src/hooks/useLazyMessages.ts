// Lazy loading hook for chat messages with pagination
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from './useChatAssistant';
import { logger } from '@/utils/logger';

interface UseLazyMessagesOptions {
  conversationId: string | null;
  companyId?: string;
  pageSize?: number;
}

export function useLazyMessages({
  conversationId,
  companyId,
  pageSize = 50
}: UseLazyMessagesOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const loadingRef = useRef(false);

  /**
   * Load initial messages (most recent)
   */
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId || !companyId || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(pageSize);

      if (error) throw error;

      if (!data || data.length === 0) {
        setMessages([]);
        setHasMore(false);
        return;
      }

      const parsedMessages: ChatMessage[] = data.reverse().map(msg => {
        const metadata = msg.metadata as any;
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          context: metadata?.context,
          insights: metadata?.insights,
          visualizations: metadata?.visualizations,
          attachments: metadata?.attachments || []
        };
      });

      setMessages(parsedMessages);
      setHasMore(data.length === pageSize);
      setCurrentPage(1);

      logger.info(`📥 Loaded ${parsedMessages.length} initial messages`);
    } catch (error) {
      logger.error('Failed to load initial messages:', error);
      setMessages([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [conversationId, companyId, pageSize]);

  /**
   * Load more older messages (pagination)
   */
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !companyId || !hasMore || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const offset = currentPage * pageSize;

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      const parsedMessages: ChatMessage[] = data.reverse().map(msg => {
        const metadata = msg.metadata as any;
        return {
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          context: metadata?.context,
          insights: metadata?.insights,
          visualizations: metadata?.visualizations,
          attachments: metadata?.attachments || []
        };
      });

      // Prepend older messages
      setMessages(prev => [...parsedMessages, ...prev]);
      setHasMore(data.length === pageSize);
      setCurrentPage(prev => prev + 1);

      logger.info(`📥 Loaded ${parsedMessages.length} more messages (page ${currentPage + 1})`);
    } catch (error) {
      logger.error('Failed to load more messages:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [conversationId, companyId, hasMore, currentPage, pageSize]);

  /**
   * Add a new message to the list
   */
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentPage(0);
    setHasMore(true);
  }, []);

  /**
   * Replace all messages (useful for switching conversations)
   */
  const setMessagesDirectly = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages);
  }, []);

  return {
    messages,
    isLoading,
    hasMore,
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    clearMessages,
    setMessagesDirectly
  };
}
