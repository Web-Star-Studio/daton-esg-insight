import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, File, X, Loader2, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";

const EVIDENCE_TYPES = [
  { value: 'documento', label: 'Documento' },
  { value: 'laudo', label: 'Laudo Técnico' },
  { value: 'procedimento', label: 'Procedimento' },
  { value: 'registro', label: 'Registro' },
  { value: 'licenca', label: 'Licença/Alvará' },
  { value: 'relatorio', label: 'Relatório' },
  { value: 'foto', label: 'Foto/Imagem' },
  { value: 'link', label: 'Link Externo' },
  { value: 'outro', label: 'Outro' },
];

interface EvidenceUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legislationId: string;
  unitComplianceId?: string;
  onSave: (data: {
    title: string;
    description?: string;
    evidence_type: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
  }) => void;
  isSaving?: boolean;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  open,
  onOpenChange,
  legislationId,
  unitComplianceId,
  onSave,
  isSaving,
}) => {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceType, setEvidenceType] = useState('documento');
  const [externalUrl, setExternalUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    file: File;
    url?: string;
    uploading: boolean;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile({ file, uploading: false });
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadFile = async (): Promise<{ url: string; name: string; size: number } | null> => {
    if (!uploadedFile?.file || !selectedCompany) return null;

    setUploadedFile(prev => prev ? { ...prev, uploading: true } : null);

    try {
      const fileExt = uploadedFile.file.name.split('.').pop();
      const fileName = `${selectedCompany.id}/${legislationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('legislation-evidences')
        .upload(fileName, uploadedFile.file);

      if (uploadError) {
        // If bucket doesn't exist, try creating without storage
        console.warn('Storage upload failed, saving reference only:', uploadError);
        return {
          url: `local://${uploadedFile.file.name}`,
          name: uploadedFile.file.name,
          size: uploadedFile.file.size,
        };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('legislation-evidences')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        name: uploadedFile.file.name,
        size: uploadedFile.file.size,
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    } finally {
      setUploadedFile(prev => prev ? { ...prev, uploading: false } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    let fileData = null;
    if (uploadedFile?.file) {
      fileData = await uploadFile();
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      evidence_type: evidenceType,
      file_url: fileData?.url || externalUrl || undefined,
      file_name: fileData?.name || undefined,
      file_size: fileData?.size || undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setEvidenceType('documento');
    setExternalUrl('');
    setUploadedFile(null);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const isLink = evidenceType === 'link';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Evidência</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da evidência"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Evidência</Label>
            <Select value={evidenceType} onValueChange={setEvidenceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional da evidência..."
              className="min-h-[60px]"
            />
          </div>

          {isLink ? (
            <div className="space-y-2">
              <Label htmlFor="url">URL do Link</Label>
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Arquivo</Label>
              {uploadedFile ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? 'Solte o arquivo aqui...'
                      : 'Arraste um arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo: 10MB
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || uploadedFile?.uploading}
            >
              {isSaving || uploadedFile?.uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadedFile?.uploading ? 'Enviando...' : 'Salvando...'}
                </>
              ) : (
                'Adicionar Evidência'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
