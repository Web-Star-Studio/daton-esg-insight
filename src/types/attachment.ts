// Centralized attachment types and state machine

export type AttachmentStatus = 
  | 'pending'      // Initial state, waiting to start upload
  | 'uploading'    // Upload in progress
  | 'uploaded'     // Successfully uploaded, ready to send
  | 'sending'      // Being sent with message
  | 'sent'         // Successfully sent with message
  | 'error'        // Upload or send failed
  | 'processing';  // Optional: being processed by AI

export interface FileAttachmentData {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: AttachmentStatus;
  path?: string;
  error?: string;
  uploadProgress?: number;
  retryCount?: number;
  createdAt: number;
}

export interface AttachmentPersistData {
  id: string;
  name: string;
  size: number;
  type: string;
  status: AttachmentStatus;
  path?: string;
  error?: string;
  createdAt: number;
}

// State machine transitions
export const canTransition = (
  from: AttachmentStatus,
  to: AttachmentStatus
): boolean => {
  const transitions: Record<AttachmentStatus, AttachmentStatus[]> = {
    pending: ['uploading', 'error'],
    uploading: ['uploaded', 'error'],
    uploaded: ['sending', 'error'],
    sending: ['sent', 'error'],
    sent: [],
    error: ['pending', 'uploading'], // Can retry
    processing: ['uploaded', 'error']
  };

  return transitions[from]?.includes(to) ?? false;
};

// Validation constants
export const ALLOWED_TYPES = [
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export const ALLOWED_EXTENSIONS = [
  '.pdf', '.csv', '.xls', '.xlsx', 
  '.jpg', '.jpeg', '.png', '.webp'
];

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILENAME_LENGTH = 255;
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000; // exponential backoff base
