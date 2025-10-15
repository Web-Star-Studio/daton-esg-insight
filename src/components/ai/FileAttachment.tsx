import { X, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileAttachmentData, AttachmentStatus } from "@/types/attachment";
import { motion, AnimatePresence } from 'framer-motion';

// Re-export for backwards compatibility
export type { FileAttachmentData };

interface FileAttachmentProps {
  file: FileAttachmentData;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText;
  if (type.includes('csv') || type.includes('excel') || type.includes('spreadsheet')) return FileSpreadsheet;
  if (type.includes('image')) return ImageIcon;
  return FileText;
}

function getStatusIcon(status: AttachmentStatus) {
  switch (status) {
    case 'pending':
    case 'uploading':
    case 'processing':
      return <Loader2 className="h-3 w-3 animate-spin text-warning" />;
    case 'uploaded':
      return <CheckCircle2 className="h-3 w-3 text-success" />;
    case 'sending':
      return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
    case 'sent':
      return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
  }
}

function getStatusText(status: AttachmentStatus) {
  switch (status) {
    case 'pending':
      return 'Aguardando...';
    case 'uploading':
      return 'Enviando...';
    case 'uploaded':
      return 'Enviado ✓';
    case 'processing':
      return 'Analisando com IA...';
    case 'sending':
      return 'Enviando à IA...';
    case 'sent':
      return 'Enviado à IA ✓';
    case 'error':
      return 'Erro';
  }
}

export function FileAttachment({ file, onRemove, canRemove = true }: FileAttachmentProps) {
  const Icon = getFileIcon(file.type);
  const isProcessing = ['pending', 'uploading', 'processing', 'sending'].includes(file.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border bg-card text-card-foreground transition-all duration-200",
        "hover:shadow-md",
        file.status === 'error' && "border-destructive/50 bg-destructive/5 hover:border-destructive/70",
        file.status === 'uploaded' && "border-success/30 bg-success/5 hover:border-success/50",
        file.status === 'sent' && "border-border/50 bg-muted/30 opacity-70",
        isProcessing && "border-warning/30 bg-warning/5 hover:border-warning/50"
      )}
    >
      <motion.div 
        className="shrink-0"
        animate={isProcessing ? { rotate: [0, 5, -5, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br transition-colors",
          file.status === 'error' && "from-destructive/10 to-destructive/20",
          file.status === 'uploaded' && "from-success/10 to-success/20",
          file.status === 'sent' && "from-muted/10 to-muted/20",
          isProcessing && "from-warning/10 to-warning/20"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            file.status === 'error' && "text-destructive",
            file.status === 'uploaded' && "text-success",
            file.status === 'sent' && "text-muted-foreground",
            isProcessing && "text-warning"
          )} />
        </div>
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold truncate">
            {file.name}
          </p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
          >
            {getStatusIcon(file.status)}
          </motion.div>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
          <span className="text-muted-foreground/50">•</span>
          <motion.span 
            className={cn(
              "font-medium",
              file.status === 'uploaded' && "text-success",
              file.status === 'sent' && "text-muted-foreground",
              isProcessing && "text-warning"
            )}
            animate={isProcessing ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {getStatusText(file.status)}
          </motion.span>
        </div>
        
        <AnimatePresence>
          {file.error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive mt-2 flex items-center gap-1.5 bg-destructive/5 p-2 rounded"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{file.error}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {canRemove && !isProcessing && onRemove && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => onRemove(file.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
