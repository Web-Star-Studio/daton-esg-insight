import { supabase } from "@/integrations/supabase/client";

// Interfaces
export interface DocumentFolder {
  id: string;
  company_id: string;
  name: string;
  parent_folder_id?: string;
  created_at: string;
  updated_at: string;
  children?: DocumentFolder[];
}

export interface Document {
  id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  folder_id?: string;
  tags?: string[];
  related_model: string;
  related_id: string;
  uploader_user_id: string;
  upload_date: string;
  document_folders?: {
    name: string;
  };
}

export interface DocumentFilters {
  search?: string;
  folder_id?: string;
  tag?: string;
}

export interface CreateFolderData {
  name: string;
  parent_folder_id?: string;
}

export interface UpdateDocumentData {
  folder_id?: string;
  tags?: string[];
}

// Folder management
export const getFolders = async (): Promise<DocumentFolder[]> => {
  console.log('Fetching folder hierarchy...');
  
  const { data, error } = await supabase.functions.invoke('documents-management', {
    body: {},
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error fetching folders:', error);
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }

  return data || [];
};

export const createFolder = async (folderData: CreateFolderData): Promise<DocumentFolder> => {
  console.log('Creating folder:', folderData);

  const { data, error } = await supabase.functions.invoke('documents-management/folders', {
    body: folderData,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error creating folder:', error);
    throw new Error(`Failed to create folder: ${error.message}`);
  }

  return data;
};

// Document management
export const getDocuments = async (filters?: DocumentFilters): Promise<Document[]> => {
  console.log('Fetching documents with filters:', filters);

  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.folder_id) params.append('folder_id', filters.folder_id);
  if (filters?.tag) params.append('tag', filters.tag);

  const { data, error } = await supabase.functions.invoke('documents-management/documents', {
    body: {},
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data || [];
};

export const uploadDocument = async (
  file: File,
  options?: {
    folder_id?: string;
    tags?: string[];
    related_model?: string;
    related_id?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<Document> => {
  console.log('Uploading document:', file.name, options);

  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.folder_id) {
    formData.append('folder_id', options.folder_id);
  }
  
  if (options?.tags?.length) {
    formData.append('tags', options.tags.join(','));
  }
  
  if (options?.related_model) {
    formData.append('related_model', options.related_model);
  }
  
  if (options?.related_id) {
    formData.append('related_id', options.related_id);
  }

  const { data, error } = await supabase.functions.invoke('documents-management/upload', {
    body: formData
  });

  if (error) {
    console.error('Error uploading document:', error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  return data;
};

export const updateDocument = async (
  documentId: string,
  updates: UpdateDocumentData
): Promise<Document> => {
  console.log('Updating document:', documentId, updates);

  const { data, error } = await supabase.functions.invoke(`documents-management/documents?id=${documentId}`, {
    body: updates,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error updating document:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  console.log('Deleting document:', documentId);

  const { error } = await supabase.functions.invoke(`documents-management/documents?id=${documentId}`, {
    body: {},
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

export const downloadDocument = async (documentId: string): Promise<{ url: string; fileName: string }> => {
  console.log('Getting download URL for document:', documentId);

  const { data, error } = await supabase.functions.invoke(`documents-management/download?id=${documentId}`, {
    body: {},
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (error) {
    console.error('Error getting download URL:', error);
    throw new Error(`Failed to get download URL: ${error.message}`);
  }

  return data;
};

// Utility functions
export const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('video')) return '🎥';
  if (fileType.includes('audio')) return '🎵';
  if (fileType.includes('text') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📈';
  return '📎';
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};