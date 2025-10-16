import { useRef, useEffect } from 'react';
import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Sparkles } from 'lucide-react';
import { ChatMessage as ChatMessageComponent } from '@/components/ai/ChatMessage';
import { ChatMessage } from '@/hooks/useChatAssistant';
import { useVirtualizedList } from '@/hooks/useVirtualizedList';
import { ActionCardData } from '@/components/ai/ActionCard';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onQuickAction?: (prompt: string) => void;
  onExecuteAction?: (action: ActionCardData) => void;
  containerHeight?: number; // If undefined, auto-measure available height
}

// MessageItem removed - now using ChatMessageComponent directly

export function VirtualizedMessageList({
  messages,
  isLoading,
  onQuickAction,
  onExecuteAction,
  containerHeight
}: VirtualizedMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Auto-calculate container height if not provided
  const [measuredHeight, setMeasuredHeight] = React.useState<number>(500);
  
  React.useEffect(() => {
    if (!containerHeight && containerRef.current) {
      const updateHeight = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setMeasuredHeight(rect.height);
        }
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, [containerHeight]);
  
  const effectiveHeight = containerHeight || measuredHeight;

  // Use virtualization for large message lists (>20 messages)
  const shouldVirtualize = messages.length > 20;
  
  const {
    virtualItems,
    totalHeight,
    offsetY,
    containerProps,
    itemProps
  } = useVirtualizedList({
    items: messages,
    itemHeight: 150, // Approximate message height (increased for dynamic content)
    containerHeight: effectiveHeight,
    overscan: 3,
    enabled: shouldVirtualize
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isLoading]);

  const displayMessages = shouldVirtualize ? virtualItems : messages;

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden scroll-smooth p-4"
      role="log"
      aria-live="polite"
      aria-label="Mensagens do chat"
      {...(shouldVirtualize ? containerProps : {})}
    >
      <div 
        className="space-y-4"
        style={shouldVirtualize ? { 
          height: `${totalHeight}px`,
          position: 'relative'
        } : undefined}
      >
        {displayMessages.map((message, index) => (
          <div
            key={message.id}
            className="min-h-[100px]"
            {...(shouldVirtualize ? itemProps(index) : {})}
          >
            <ChatMessageComponent 
              message={message} 
              onExecuteAction={onExecuteAction}
            />
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                <Sparkles className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Analisando dados...</span>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
