import { X, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileAttachmentData {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'processed' | 'sent' | 'error';
  path?: string;
  error?: string;
}

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

function getStatusIcon(status: FileAttachmentData['status']) {
  switch (status) {
    case 'uploading':
    case 'processing':
      return <Loader2 className="h-3 w-3 animate-spin text-orange-500" />;
    case 'uploaded':
    case 'processed':
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    case 'sent':
      return <CheckCircle2 className="h-3 w-3 text-muted-foreground" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
  }
}

function getStatusText(status: FileAttachmentData['status']) {
  switch (status) {
    case 'uploading':
      return 'Enviando...';
    case 'uploaded':
      return 'Enviado ✓';
    case 'processing':
      return 'Analisando com IA...';
    case 'processed':
      return 'Pronto ✓';
    case 'sent':
      return 'Enviado à IA ✓';
    case 'error':
      return 'Erro';
  }
}

export function FileAttachment({ file, onRemove, canRemove = true }: FileAttachmentProps) {
  const Icon = getFileIcon(file.type);
  const isProcessing = file.status === 'uploading' || file.status === 'processing';

  return (
    <div className={cn(
      "flex items-center gap-2 p-2.5 rounded-lg border bg-card text-card-foreground transition-all",
      file.status === 'error' && "border-destructive/50 bg-destructive/5",
      file.status === 'processed' && "border-green-500/30 bg-green-500/5",
      file.status === 'sent' && "border-border/50 bg-muted/30 opacity-70",
      isProcessing && "border-orange-500/30 bg-orange-500/5"
    )}>
      <div className="shrink-0">
        <Icon className={cn(
          "h-4 w-4",
          file.status === 'error' && "text-destructive",
          file.status === 'processed' && "text-green-600",
          file.status === 'sent' && "text-muted-foreground",
          isProcessing && "text-orange-500"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {file.name}
          </p>
          {getStatusIcon(file.status)}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span className={cn(
            file.status === 'processed' && "text-green-600 font-medium",
            file.status === 'sent' && "text-muted-foreground font-medium",
            isProcessing && "text-orange-600 font-medium"
          )}>{getStatusText(file.status)}</span>
        </div>
        
        {file.error && (
          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {file.error}
          </p>
        )}
      </div>
      
      {canRemove && !isProcessing && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onRemove(file.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
