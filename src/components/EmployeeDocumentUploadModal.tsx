import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MultiFileUploadZone } from './intelligence/MultiFileUploadZone';
import { uploadEmployeeDocument } from '@/services/employeeDocuments';
import { unifiedToast } from '@/utils/unifiedToast';
import { Loader2 } from 'lucide-react';

interface EmployeeDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  employeeName: string;
}

const DOCUMENT_CATEGORIES = [
  'Contrato',
  'RG',
  'CPF',
  'Comprovante de Residência',
  'Diploma',
  'Certificado',
  'Atestado Médico',
  'Exame Admissional',
  'Carteira de Trabalho',
  'Outro'
];

export function EmployeeDocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName
}: EmployeeDocumentUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [category, setCategory] = useState<string>('Outro');
  const [isUploading, setIsUploading] = useState(false);

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([]);
      setCategory('Outro');
      onClose();
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      unifiedToast.warning('Nenhum arquivo selecionado');
      return;
    }

    setIsUploading(true);
    console.log('=== BATCH UPLOAD START ===');
    console.log('Files:', selectedFiles.length);
    console.log('Category:', category);

    let successCount = 0;
    let errorCount = 0;

    for (const uploadedFile of selectedFiles) {
      try {
        await uploadEmployeeDocument(employeeId, uploadedFile.file, category);
        successCount++;
        
        // Atualizar status visual do arquivo
        setSelectedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'success' as const, progress: 100 }
              : f
          )
        );
      } catch (error) {
        console.error(`Error uploading ${uploadedFile.file.name}:`, error);
        errorCount++;
        
        // Atualizar status visual do arquivo
        setSelectedFiles(prev => 
          prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'error' as const, error: 'Falha no upload' }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      unifiedToast.success(
        `${successCount} documento${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso!`
      );
      onSuccess();
      handleClose();
    }

    if (errorCount > 0) {
      unifiedToast.error(
        `${errorCount} documento${errorCount > 1 ? 's falharam' : ' falhou'}`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Adicionar Documentos</DialogTitle>
          <DialogDescription>
            Enviar documentos para {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-4">
          <div className="space-y-4 pr-2">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria do Documento</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Upload Zone */}
            <MultiFileUploadZone
              onFilesSelected={setSelectedFiles}
              maxFiles={5}
              acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp', '.xlsx', '.xls', '.csv']}
              showPreview={true}
            />

            {selectedFiles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''} selecionado{selectedFiles.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              `Enviar ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
