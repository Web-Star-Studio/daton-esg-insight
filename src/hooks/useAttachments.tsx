// Dedicated hook for attachment management with robust state machine
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  FileAttachmentData,
  AttachmentStatus,
  canTransition,
  ALLOWED_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILENAME_LENGTH,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_BASE
} from '@/types/attachment';
import {
  saveAttachments,
  loadAttachments,
  clearAttachments as clearStoredAttachments,
  updateAttachment as updateStoredAttachment
} from '@/utils/attachmentStorage';
import { logger } from '@/utils/logger';

interface UseAttachmentsOptions {
  conversationId: string | null;
  companyId?: string;
  userId?: string;
  onUploadComplete?: (attachment: FileAttachmentData) => void;
}

export function useAttachments({
  conversationId,
  companyId,
  userId,
  onUploadComplete
}: UseAttachmentsOptions) {
  const [attachments, setAttachments] = useState<FileAttachmentData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Load attachments from storage when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setAttachments([]);
      return;
    }

    const loaded = loadAttachments(conversationId);
    setAttachments(loaded);
    logger.info(`📦 Restored ${loaded.length} attachments for conversation ${conversationId}`);
  }, [conversationId]);

  // Persist attachments whenever they change
  useEffect(() => {
    if (conversationId && attachments.length > 0) {
      saveAttachments(conversationId, attachments);
    }
  }, [conversationId, attachments]);

  // Update isUploading state based on attachment statuses
  useEffect(() => {
    const uploading = attachments.some(
      att => att.status === 'uploading' || att.status === 'pending'
    );
    setIsUploading(uploading);
  }, [attachments]);

  // Sanitize filename
  const sanitizeFileName = (fileName: string): string => {
    const normalized = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sanitized = normalized.replace(/[^a-zA-Z0-9._-]/g, '_');
    return sanitized.replace(/_+/g, '_');
  };

  // Validate file
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Type validation
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return {
        valid: false,
        error: `Tipo não suportado: ${file.type || fileExtension}. Use PDF, CSV, Excel ou imagens.`
      };
    }

    // Size validation
    if (file.size === 0) {
      return { valid: false, error: 'Arquivo vazio.' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Tamanho ${(file.size / 1024 / 1024).toFixed(1)}MB excede 20MB.`
      };
    }

    // Filename validation
    if (file.name.length > MAX_FILENAME_LENGTH) {
      return {
        valid: false,
        error: 'Nome do arquivo muito longo (máx: 255 caracteres).'
      };
    }

    const problematicChars = /[<>:"|?*\x00-\x1F]/;
    if (problematicChars.test(file.name)) {
      return {
        valid: false,
        error: 'Nome do arquivo contém caracteres inválidos.'
      };
    }

    return { valid: true };
  };

  // Transition attachment state safely
  const transitionState = useCallback(
    (attachmentId: string, newStatus: AttachmentStatus, updates?: Partial<FileAttachmentData>) => {
      setAttachments(prev => {
        const updated = prev.map(att => {
          if (att.id !== attachmentId) return att;

          if (!canTransition(att.status, newStatus)) {
            logger.warn(`Invalid transition: ${att.status} -> ${newStatus} for ${attachmentId}`);
            return att;
          }

          return {
            ...att,
            status: newStatus,
            ...updates
          };
        });

        if (conversationId) {
          saveAttachments(conversationId, updated);
        }

        return updated;
      });
    },
    [conversationId]
  );

  // Upload file locally with parsing
  const uploadFile = useCallback(
    async (file: File, attachmentId: string): Promise<boolean> => {
      logger.info(`📤 Processing ${file.name} locally`);

      try {
        // Parse file client-side
        const { parseFileClientSide } = await import('@/utils/clientSideParsers');
        const { saveAttachmentFile } = await import('@/utils/localStorageDB');
        
        const parsed = await parseFileClientSide(file);
        
        if (!parsed.success) {
          throw new Error(parsed.error || 'Erro ao processar arquivo');
        }

        // Save to localStorage (for small files) or memory (for large files)
        const localPath = conversationId 
          ? await saveAttachmentFile(conversationId, attachmentId, file)
          : `memory:${attachmentId}`;

        logger.info(`✅ File processed locally: ${file.name}`);

        // Update attachment state with parsed data
        transitionState(attachmentId, 'uploaded', { 
          path: localPath,
          // Store parsed content in attachment for later use
        });

        toast.success('Arquivo processado', {
          description: `${file.name} - ${parsed.content?.substring(0, 50) || 'Processado com sucesso'}`
        });

        return true;

      } catch (error) {
        logger.error(`Processing failed:`, error);
        
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Erro desconhecido';
        
        transitionState(attachmentId, 'error', {
          error: `Processamento falhou: ${errorMessage}`,
        });

        toast.error('Falha no processamento', {
          description: errorMessage
        });

        return false;
      }
    },
    [conversationId, transitionState]
  );

  // Add attachment
  const addAttachment = useCallback(
    async (file: File) => {
      if (!conversationId) {
        toast.error('Erro', {
          description: 'Inicie uma conversa antes de adicionar anexos.'
        });
        return;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error('Arquivo inválido', {
          description: validation.error
        });
        return;
      }

      // Create attachment
      const attachment: FileAttachmentData = {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        createdAt: Date.now(),
        retryCount: 0
      };

      // Add to state
      setAttachments(prev => {
        const updated = [...prev, attachment];
        if (conversationId) {
          saveAttachments(conversationId, updated);
        }
        return updated;
      });

      logger.info(`📎 Added attachment: ${file.name}`);

      // Start upload
      transitionState(attachment.id, 'uploading');
      const success = await uploadFile(file, attachment.id);

      if (success && onUploadComplete) {
        const uploaded = attachments.find(a => a.id === attachment.id);
        if (uploaded) {
          onUploadComplete(uploaded);
        }
      }
    },
    [conversationId, uploadFile, transitionState, onUploadComplete, attachments]
  );

  // Remove attachment
  const removeAttachment = useCallback(
    (attachmentId: string) => {
      setAttachments(prev => {
        const filtered = prev.filter(att => att.id !== attachmentId);
        if (conversationId) {
          saveAttachments(conversationId, filtered);
        }
        logger.info(`🗑️ Removed attachment: ${attachmentId}`);
        return filtered;
      });
    },
    [conversationId]
  );

  // Clear all attachments
  const clearAllAttachments = useCallback(() => {
    setAttachments([]);
    if (conversationId) {
      clearStoredAttachments(conversationId);
    }
    logger.info('🗑️ Cleared all attachments');
  }, [conversationId]);

  // Clear sent attachments
  const clearSentAttachments = useCallback(() => {
    setAttachments(prev => {
      const filtered = prev.filter(att => att.status !== 'sent');
      if (conversationId) {
        saveAttachments(conversationId, filtered);
      }
      return filtered;
    });
    toast.success('Anexos enviados removidos');
  }, [conversationId]);

  // Mark attachments as sending
  const markAsSending = useCallback((attachmentIds: string[]) => {
    attachmentIds.forEach(id => transitionState(id, 'sending'));
  }, [transitionState]);

  // Mark attachments as sent
  const markAsSent = useCallback((attachmentIds: string[]) => {
    attachmentIds.forEach(id => transitionState(id, 'sent'));
  }, [transitionState]);

  // Get attachments ready to send
  const getReadyAttachments = useCallback(() => {
    return attachments.filter(att => att.status === 'uploaded' && att.path);
  }, [attachments]);

  return {
    attachments,
    isUploading,
    addAttachment,
    removeAttachment,
    clearAllAttachments,
    clearSentAttachments,
    markAsSending,
    markAsSent,
    getReadyAttachments,
    transitionState
  };
}
