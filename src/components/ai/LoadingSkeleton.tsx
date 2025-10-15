// Loading skeleton components for chat interface
import { motion } from 'framer-motion';

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 justify-start animate-fade-in">
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export function AttachmentSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card"
    >
      <div className="h-4 w-4 rounded bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        <div className="h-2 bg-muted rounded animate-pulse w-1/3" />
      </div>
    </motion.div>
  );
}

export function ChatLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}
