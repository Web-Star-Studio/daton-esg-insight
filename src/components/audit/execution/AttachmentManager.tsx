import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Paperclip, X, Upload, FileText, Image, File, Loader2 } from "lucide-react";
import { useResponseAttachments, useAddAttachment, useDeleteAttachment } from "@/hooks/audit/useExecution";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AttachmentManagerProps {
  responseId: string;
  auditId: string;
  companyId: string;
}

export function AttachmentManager({ responseId, auditId, companyId }: AttachmentManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: attachments, isLoading } = useResponseAttachments(responseId);
  const addAttachment = useAddAttachment();
  const deleteAttachment = useDeleteAttachment();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    try {
      for (const file of Array.from(files)) {
        // Upload to storage
        const filePath = `audit-attachments/${auditId}/${responseId}/${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) {
          // If bucket doesn't exist, just store the reference
          console.warn('Storage upload failed, storing reference only:', uploadError);
        }

        // Add attachment record
        await addAttachment.mutateAsync({
          response_id: responseId,
          audit_id: auditId,
          company_id: companyId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          description: null,
          uploaded_by: user?.id || null,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Erro ao fazer upload dos arquivos');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (attachmentId: string) => {
    await deleteAttachment.mutateAsync({
      id: attachmentId,
      responseId,
      auditId,
    });
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Anexos / Evidências
        </Label>
        <label>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            asChild
          >
            <span className="cursor-pointer">
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Adicionar
            </span>
          </Button>
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30"
            >
              <div className="p-2 rounded bg-background">
                {getFileIcon(attachment.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                  {attachment.uploaded_at && (
                    <> • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}</>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(attachment.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum anexo adicionado
        </p>
      )}
    </div>
  );
}
