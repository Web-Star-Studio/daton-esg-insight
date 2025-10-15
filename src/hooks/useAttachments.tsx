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

  // Upload file with retry logic
  const uploadFile = useCallback(
    async (file: File, attachmentId: string): Promise<boolean> => {
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const sanitizedName = sanitizeFileName(file.name);
      const timestamp = Date.now();
      const filePath = `${userId}/${timestamp}_${sanitizedName}`;

      logger.info(`📤 Uploading ${file.name} (attempt 1/${MAX_RETRY_ATTEMPTS})`);

      for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Erro no upload: ${uploadError.message}`);
          }

          // Verify upload
          const { data: fileExists } = await supabase.storage
            .from('chat-attachments')
            .list(userId, {
              search: `${timestamp}_${sanitizedName}`
            });

          if (!fileExists || fileExists.length === 0) {
            throw new Error('Falha na verificação do upload');
          }

          logger.info(`✅ Upload verified: ${file.name}`);

          // Log to database
          if (companyId && conversationId) {
            await supabase.from('chat_file_uploads').insert({
              company_id: companyId,
              user_id: userId,
              conversation_id: conversationId,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_path: filePath,
              processing_status: 'uploaded'
            });
          }

          // Update attachment state
          transitionState(attachmentId, 'uploaded', { path: filePath });

          toast.success('Arquivo enviado', {
            description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`
          });

          return true;

        } catch (error) {
          logger.error(`Upload attempt ${attempt} failed:`, error);

          if (attempt < MAX_RETRY_ATTEMPTS) {
            const delay = Math.min(RETRY_DELAY_BASE * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            toast.info(`Tentando novamente (${attempt + 1}/${MAX_RETRY_ATTEMPTS})...`, {
              duration: 2000
            });
          } else {
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Erro desconhecido';
            
            transitionState(attachmentId, 'error', {
              error: `Upload falhou: ${errorMessage}`,
              retryCount: (attachments.find(a => a.id === attachmentId)?.retryCount || 0) + 1
            });

            toast.error('Falha no upload', {
              description: errorMessage
            });

            return false;
          }
        }
      }

      return false;
    },
    [userId, companyId, conversationId, transitionState, attachments]
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
