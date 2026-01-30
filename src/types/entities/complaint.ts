/**
 * Customer complaint related types
 */

export interface CommunicationLogEntry {
  date: string;
  type: 'creation' | 'communication' | 'resolution' | 'escalation';
  message: string;
  user_id?: string | null;
}

export interface AttachmentInfo {
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export type ComplaintAttachments = string[] | AttachmentInfo[];
