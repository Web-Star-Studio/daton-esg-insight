import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { documentExtractionService } from "@/services/documentExtraction";

interface DocumentUploadCardProps {
  onFileUploaded: (fileId: string) => void;
}

export const DocumentUploadCard = ({ onFileUploaded }: DocumentUploadCardProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Validate file type - expandido para máxima compatibilidade
    const allowedTypes = [
      'application/pdf',
      'text/csv', 
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/json',
      'application/xml',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 100MB.');
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    try {
      const fileRecord = await documentExtractionService.uploadFile(file);
      toast.success('Arquivo enviado com sucesso!');
      onFileUploaded(fileRecord.id);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro no upload do arquivo');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (uploadedFile && !isUploading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documento Carregado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{uploadedFile.name}</p>
                <p className="text-sm text-green-600">
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload do Documento</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
            isDragOver ? "border-primary bg-primary/5 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-primary/5",
            isUploading && "opacity-50 pointer-events-none"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4 transition-all duration-200",
            isDragOver ? "text-primary scale-110" : "text-muted-foreground",
            isUploading && "animate-bounce"
          )} />
          <h3 className="text-lg font-semibold mb-2">
            {isUploading ? "Enviando..." : isDragOver ? "Solte o arquivo aqui" : "Envie seu documento"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isUploading ? "Aguarde..." : "Arraste e solte ou clique para selecionar"}
          </p>
          <p className="text-sm text-muted-foreground">
            PDF, Excel, Word, PPT, CSV, JSON, XML, Imagens até 100MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.csv,.xlsx,.xls,.txt,.docx,.doc,.pptx,.json,.xml,.jpg,.jpeg,.png,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={isUploading}
          />
        </div>
      </CardContent>
    </Card>
  );
};