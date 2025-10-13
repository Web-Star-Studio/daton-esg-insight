import { Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

interface FileUploadButtonProps {
  onFileSelect: (files: File[]) => void;
  isUploading: boolean;
  disabled?: boolean;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export function FileUploadButton({ onFileSelect, isUploading, disabled }: FileUploadButtonProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Validar tipo de arquivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['.pdf', '.csv', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp'];
    
    if (!ALLOWED_TYPES.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Tipo não suportado: ${file.type || fileExtension}. Use PDF, CSV, Excel ou imagens.`
      };
    }

    // Validar tamanho
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Arquivo vazio.'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Tamanho ${(file.size / 1024 / 1024).toFixed(1)}MB excede o limite de 20MB.`
      };
    }

    // Validar nome do arquivo
    if (file.name.length > 255) {
      return {
        valid: false,
        error: 'Nome do arquivo muito longo (máx: 255 caracteres).'
      };
    }

    // Validar caracteres especiais problemáticos
    const problematicChars = /[<>:"|?*\x00-\x1F]/;
    if (problematicChars.test(file.name)) {
      return {
        valid: false,
        error: 'Nome do arquivo contém caracteres inválidos.'
      };
    }

    return { valid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    console.log(`Processing ${files.length} file(s) for upload`);

    // Validar e separar arquivos
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Mostrar erros consolidados
    if (errors.length > 0) {
      toast({
        title: `${errors.length} arquivo(s) inválido(s)`,
        description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? `\n...e mais ${errors.length - 3}` : ''),
        variant: "destructive",
        duration: 5000
      });
    }

    // Processar arquivos válidos
    if (validFiles.length > 0) {
      console.log(`Uploading ${validFiles.length} valid file(s):`, validFiles.map(f => f.name));
      
      toast({
        title: `Enviando ${validFiles.length} arquivo(s)`,
        description: validFiles.map(f => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join('\n'),
        duration: 3000
      });

      onFileSelect(validFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="shrink-0"
        title="Anexar arquivo"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </Button>
    </>
  );
}
