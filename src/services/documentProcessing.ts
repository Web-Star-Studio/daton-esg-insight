import { supabase } from '@/integrations/supabase/client';

export interface ProcessedDocument {
  success: boolean;
  content?: string;
  structured?: any;
  type?: string;
  error?: string;
  processedAt?: string;
}

export interface DocumentProcessingOptions {
  useVision?: boolean;
  maxRetries?: number;
  timeout?: number;
}

/**
 * Processa um documento anexado ao chat usando a edge function
 */
export async function processDocument(
  filePath: string,
  fileType: string,
  options: DocumentProcessingOptions = {}
): Promise<ProcessedDocument> {
  const {
    useVision = false,
    maxRetries = 3,
    timeout = 60000 // 60 segundos
  } = options;

  console.log('Processing document:', { filePath, fileType, options });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Processing attempt ${attempt}/${maxRetries}`);

      // Criar promise com timeout
      const processingPromise = supabase.functions.invoke('parse-chat-document', {
        body: { filePath, fileType, useVision }
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: processamento excedeu o tempo limite')), timeout);
      });

      const { data, error } = await Promise.race([processingPromise, timeoutPromise]);

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Resposta vazia da função de processamento');
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha no processamento do documento');
      }

      console.log('Document processed successfully:', {
        type: data.type,
        contentLength: data.content?.length || 0,
        hasStructured: !!data.structured
      });

      return {
        success: true,
        content: data.content,
        structured: data.structured,
        type: data.type,
        processedAt: data.processedAt || new Date().toISOString()
      };

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Erro desconhecido');
      
      console.error(`Processing attempt ${attempt} failed:`, {
        error: lastError.message,
        filePath
      });

      // Não fazer retry se for erro de timeout ou cancelamento
      if (lastError.message.includes('aborted') || lastError.message.includes('timeout')) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Falha ao processar documento após múltiplas tentativas'
  };
}

/**
 * Verifica se um tipo de arquivo é suportado
 */
export function isSupportedFileType(fileType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  return supportedTypes.some(type => fileType.includes(type.split('/')[1]));
}

/**
 * Formata o tamanho do arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Obtém uma descrição amigável do tipo de arquivo
 */
export function getFileTypeDescription(fileType: string): string {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('csv')) return 'CSV';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'Excel';
  if (fileType.includes('image')) return 'Imagem';
  return 'Documento';
}

/**
 * Valida se o conteúdo processado é válido
 */
export function validateProcessedContent(processed: ProcessedDocument): boolean {
  if (!processed.success) return false;
  if (!processed.content || processed.content.trim().length === 0) return false;
  if (processed.content.length < 10) return false; // Conteúdo muito curto é suspeito
  return true;
}
