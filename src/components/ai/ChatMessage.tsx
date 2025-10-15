import { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ActionCardsGrid } from '@/components/ai/ActionCard';
import { ContextualVisualization } from '@/components/ai/ContextualVisualization';
import { DataQualityBadge } from '@/components/ai/DataQualityBadge';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: string;
    insights?: any[];
    visualizations?: any[];
    actionCards?: any[];
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
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      path: string;
    }>;
  };
  onExecuteAction?: (action: any) => void;
}

export const ChatMessage = memo(function ChatMessage({ message, onExecuteAction }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <Avatar className={`h-8 w-8 shrink-0 ${isUser ? 'bg-muted' : 'bg-gradient-to-br from-primary to-primary/80'}`}>
        <AvatarFallback className={isUser ? 'bg-transparent' : 'bg-transparent text-primary-foreground'}>
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={`flex-1 space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Main Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 max-w-[85%] ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted/50 border border-border/50'
          }`}
        >
          {/* Attachments Preview (for user messages) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs opacity-90">
                  <FileText className="h-3 w-3" />
                  <span className="font-medium truncate">{att.name}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {(att.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Message Text */}
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
            <ReactMarkdown
              components={{
                // Custom rendering for better formatting
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="ml-4">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 rounded bg-background/20 text-xs font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Data Quality Badge (for assistant messages with analysis) */}
        {!isUser && message.dataQuality && (
          <div className="flex justify-start">
            <DataQualityBadge quality={message.dataQuality} size="sm" showDetails />
          </div>
        )}

        {/* Contextual Visualizations */}
        {!isUser && message.visualizations && message.visualizations.length > 0 && (
          <div className="grid grid-cols-1 gap-3 max-w-[85%]">
            {message.visualizations.map((viz, idx) => (
              <ContextualVisualization key={idx} visualization={viz} />
            ))}
          </div>
        )}

        {/* Action Cards */}
        {!isUser && message.actionCards && message.actionCards.length > 0 && (
          <div className="max-w-[85%]">
            <ActionCardsGrid
              actions={message.actionCards}
              onExecute={onExecuteAction}
            />
          </div>
        )}

        {/* Context Information */}
        {!isUser && message.context && (
          <Card className="max-w-[85%] p-3 bg-muted/30 border-primary/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">{message.context}</p>
            </div>
          </Card>
        )}

        {/* Timestamp */}
        <p className={`text-[10px] text-muted-foreground px-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
});
