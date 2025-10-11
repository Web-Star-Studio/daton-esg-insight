import { X, FileText, FileSpreadsheet, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileAttachmentData {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'processed' | 'error';
  path?: string;
  error?: string;
}

interface FileAttachmentProps {
  attachment: FileAttachmentData;
  onRemove: (id: string) => void;
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
      return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
    case 'uploaded':
    case 'processed':
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-destructive" />;
  }
}

function getStatusText(status: FileAttachmentData['status']) {
  switch (status) {
    case 'uploading':
      return 'Enviando...';
    case 'uploaded':
      return 'Enviado';
    case 'processing':
      return 'Processando...';
    case 'processed':
      return 'Processado';
    case 'error':
      return 'Erro';
  }
}

export function FileAttachment({ attachment, onRemove, canRemove = true }: FileAttachmentProps) {
  const Icon = getFileIcon(attachment.type);
  const isProcessing = attachment.status === 'uploading' || attachment.status === 'processing';

  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg border bg-card text-card-foreground",
      attachment.status === 'error' && "border-destructive/50 bg-destructive/5"
    )}>
      <div className="shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">
            {attachment.name}
          </p>
          {getStatusIcon(attachment.status)}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(attachment.size)}</span>
          <span>•</span>
          <span>{getStatusText(attachment.status)}</span>
        </div>
        
        {attachment.error && (
          <p className="text-xs text-destructive mt-1">{attachment.error}</p>
        )}
      </div>
      
      {canRemove && !isProcessing && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onRemove(attachment.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
