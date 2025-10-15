// Virtualized message list for optimized rendering of large chat histories
import { useRef, useEffect, memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FileAttachment } from '@/components/ai/FileAttachment';
import { ProactiveInsights, ProactiveInsight } from '@/components/ai/ProactiveInsights';
import { DataVisualization } from '@/components/ai/DataVisualization';
import { ChatMessage } from '@/hooks/useChatAssistant';
import { useVirtualizedList } from '@/hooks/useVirtualizedList';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onQuickAction?: (prompt: string) => void;
  containerHeight?: number;
}

// Memoized message component for performance
const MessageItem = memo(({ 
  message, 
  onQuickAction 
}: { 
  message: ChatMessage; 
  onQuickAction?: (prompt: string) => void;
}) => {
  return (
    <div
      className={`flex gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8 bg-primary shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            AI
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`rounded-lg px-4 py-2 max-w-[80%] ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-background/50 px-1 py-0.5 rounded text-xs">{children}</code>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        {/* Attachments */}
        {message.role === 'user' && message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.attachments.map((att, idx) => (
              <FileAttachment
                key={idx}
                file={{
                  id: `msg-${message.id}-att-${idx}`,
                  name: att.name,
                  size: att.size,
                  type: att.type || '',
                  status: 'sent',
                  path: att.path,
                  createdAt: Date.now()
                }}
                canRemove={false}
              />
            ))}
          </div>
        )}
        
        {/* Insights */}
        {message.insights && message.insights.length > 0 && (
          <div className="mt-3">
            <ProactiveInsights 
              insights={message.insights as ProactiveInsight[]} 
              onActionClick={onQuickAction}
            />
          </div>
        )}
        
        {/* Visualizations */}
        {message.visualizations && message.visualizations.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.visualizations.map((viz: any, idx: number) => (
              <DataVisualization key={idx} data={viz} />
            ))}
          </div>
        )}
        
        {message.context && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            {message.context}
          </p>
        )}
        
        {message.timestamp && (
          <p className="text-xs text-muted-foreground mt-1">
            {message.timestamp.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        )}
      </div>

      {message.role === 'user' && (
        <Avatar className="h-8 w-8 bg-secondary shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
            EU
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison for memo optimization
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.attachments?.length === next.message.attachments?.length
  );
});

MessageItem.displayName = 'MessageItem';

export function VirtualizedMessageList({
  messages,
  isLoading,
  onQuickAction,
  containerHeight = 500
}: VirtualizedMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
    containerHeight,
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
      className="flex-1 overflow-y-auto p-4"
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
            <MessageItem message={message} onQuickAction={onQuickAction} />
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
