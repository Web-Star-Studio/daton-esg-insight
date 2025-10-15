// Atomic localStorage operations for attachments
import { AttachmentPersistData, FileAttachmentData } from '@/types/attachment';
import { logger } from './logger';

const STORAGE_PREFIX = 'chat_attachments_';

/**
 * Atomic save - all or nothing
 */
export const saveAttachments = (
  conversationId: string,
  attachments: FileAttachmentData[]
): boolean => {
  try {
    const key = `${STORAGE_PREFIX}${conversationId}`;
    
    // Serialize only persistable data (no File objects)
    const persistData: AttachmentPersistData[] = attachments.map(att => ({
      id: att.id,
      name: att.name,
      size: att.size,
      type: att.type,
      status: att.status,
      path: att.path,
      error: att.error,
      createdAt: att.createdAt
    }));
    
    const json = JSON.stringify(persistData);
    localStorage.setItem(key, json);
    
    logger.debug(`💾 Saved ${persistData.length} attachments for ${conversationId}`);
    return true;
  } catch (error) {
    logger.error('Failed to save attachments', error);
    return false;
  }
};

/**
 * Load attachments with validation
 */
export const loadAttachments = (
  conversationId: string
): FileAttachmentData[] => {
  try {
    const key = `${STORAGE_PREFIX}${conversationId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return [];
    }
    
    const parsed: AttachmentPersistData[] = JSON.parse(stored);
    
    // Validate and reconstruct
    const attachments: FileAttachmentData[] = parsed
      .filter(att => att.id && att.name && att.status)
      .map(att => ({
        ...att,
        // Reset transient states on load
        status: att.status === 'uploading' || att.status === 'sending' 
          ? 'error' 
          : att.status,
        error: att.status === 'uploading' 
          ? 'Upload interrompido. Tente novamente.' 
          : att.error,
        uploadProgress: undefined,
        retryCount: 0
      }));
    
    logger.debug(`📦 Loaded ${attachments.length} attachments for ${conversationId}`);
    return attachments;
  } catch (error) {
    logger.error('Failed to load attachments', error);
    return [];
  }
};

/**
 * Clear attachments for conversation
 */
export const clearAttachments = (conversationId: string): void => {
  try {
    const key = `${STORAGE_PREFIX}${conversationId}`;
    localStorage.removeItem(key);
    logger.debug(`🗑️ Cleared attachments for ${conversationId}`);
  } catch (error) {
    logger.error('Failed to clear attachments', error);
  }
};

/**
 * Update single attachment atomically
 */
export const updateAttachment = (
  conversationId: string,
  attachmentId: string,
  updates: Partial<FileAttachmentData>
): boolean => {
  try {
    const attachments = loadAttachments(conversationId);
    const index = attachments.findIndex(att => att.id === attachmentId);
    
    if (index === -1) {
      logger.warn(`Attachment ${attachmentId} not found for update`);
      return false;
    }
    
    attachments[index] = { ...attachments[index], ...updates };
    return saveAttachments(conversationId, attachments);
  } catch (error) {
    logger.error('Failed to update attachment', error);
    return false;
  }
};

/**
 * Remove attachment
 */
export const removeAttachment = (
  conversationId: string,
  attachmentId: string
): boolean => {
  try {
    const attachments = loadAttachments(conversationId);
    const filtered = attachments.filter(att => att.id !== attachmentId);
    return saveAttachments(conversationId, filtered);
  } catch (error) {
    logger.error('Failed to remove attachment', error);
    return false;
  }
};
