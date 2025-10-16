import { motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import type { FileAttachmentData } from '@/types/attachment';

interface FileAttachmentCompactProps {
  file: FileAttachmentData;
  onRemove?: (id: string) => void;
}

export function FileAttachmentCompact({ file, onRemove }: FileAttachmentCompactProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="relative group"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg border min-w-[120px]">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{file.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {(file.size / 1024).toFixed(0)}KB
          </p>
        </div>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(file.id)}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
          aria-label="Remover arquivo"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}
