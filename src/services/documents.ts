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
  ai_processing_status?: string;
  ai_confidence_score?: number;
  ai_extracted_category?: string;
  created_at?: string;
  updated_at?: string;
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
  
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching folders:', error);
    throw new Error(`Failed to fetch folders: ${error.message}`);
  }

  // Build hierarchy
  return buildFolderHierarchy(data || []);
};

// Helper function to build folder hierarchy
const buildFolderHierarchy = (folders: DocumentFolder[]): DocumentFolder[] => {
  const folderMap = new Map<string, DocumentFolder>();
  const rootFolders: DocumentFolder[] = [];

  // First, create a map of all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Then, build the hierarchy
  folders.forEach(folder => {
    const folderWithChildren = folderMap.get(folder.id)!;
    
    if (folder.parent_folder_id) {
      const parent = folderMap.get(folder.parent_folder_id);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(folderWithChildren);
      }
    } else {
      rootFolders.push(folderWithChildren);
    }
  });

  return rootFolders;
};

export const createFolder = async (folderData: CreateFolderData): Promise<DocumentFolder> => {
  console.log('Creating folder:', folderData);

  // Get user company
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
  }
  
  if (!profile) {
    throw new Error('User profile not found');
  }

  const { data, error } = await supabase
    .from('document_folders')
    .insert({
      ...folderData,
      company_id: profile.company_id
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating folder:', error);
    throw new Error(`Failed to create folder: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Não foi possível criar a pasta');
  }

  return data;
};

// Document management with pagination
export const getDocuments = async (
  filters?: DocumentFilters & { 
    page?: number; 
    limit?: number; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc' 
  }
): Promise<{
  documents: Document[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  console.log('Fetching documents with filters:', filters);

  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('documents')
    .select(`
      *,
      document_folders (
        name
      )
    `, { count: 'exact' });

  // Apply filters
  if (filters?.search) {
    query = query.ilike('file_name', `%${filters.search}%`);
  }

  if (filters?.folder_id) {
    query = query.eq('folder_id', filters.folder_id);
  }

  if (filters?.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'upload_date';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    documents: data || [],
    total: count || 0,
    page,
    totalPages
  };
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

  // Get user info
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
  }
  
  if (!profile) {
    throw new Error('User profile not found');
  }

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  // Simulate progress callback
  if (options?.onProgress) {
    options.onProgress(100);
  }

  // Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      company_id: profile.company_id,
      uploader_user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      folder_id: options?.folder_id || null,
      tags: options?.tags || null,
      related_model: options?.related_model || 'document',
      related_id: options?.related_id || crypto.randomUUID(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error creating document record:', error);
    // Clean up uploaded file if record creation fails
    await supabase.storage.from('documents').remove([filePath]);
    throw new Error(`Failed to create document record: ${error.message}`);
  }
  
  if (!data) {
    await supabase.storage.from('documents').remove([filePath]);
    throw new Error('Não foi possível criar o registro do documento');
  }

  return data;
};

export const updateDocument = async (
  documentId: string,
  updates: UpdateDocumentData
): Promise<Document> => {
  console.log('Updating document:', documentId, updates);

  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating document:', error);
    throw new Error(`Failed to update document: ${error.message}`);
  }
  
  if (!data) {
    throw new Error('Documento não encontrado');
  }

  return data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  console.log('Deleting document:', documentId);

  // Get document info to delete from storage
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }
  
  if (!document) {
    throw new Error('Documento não encontrado');
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path]);

  if (storageError) {
    console.warn('Error deleting file from storage:', storageError);
  }

  // Delete document record
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(`Failed to delete document: ${error.message}`);
  }
};

export const downloadDocument = async (documentId: string): Promise<{ url: string; fileName: string }> => {
  console.log('Getting download URL for document:', documentId);

  // Get document info
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path, file_name')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }
  
  if (!document) {
    throw new Error('Documento não encontrado');
  }

  // Get signed URL for download
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 60); // 60 seconds expiry

  if (error) {
    console.error('Error creating signed URL:', error);
    throw new Error(`Failed to create download URL: ${error.message}`);
  }

  return {
    url: data.signedUrl,
    fileName: document.file_name
  };
};

// Bulk operations
export const bulkDeleteDocuments = async (documentIds: string[]): Promise<void> => {
  console.log('Bulk deleting documents:', documentIds);

  // Get all documents to delete files from storage
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .in('id', documentIds);

  if (fetchError) {
    console.error('Error fetching documents:', fetchError);
    throw new Error(`Failed to fetch documents: ${fetchError.message}`);
  }

  // Delete files from storage
  const filePaths = documents.map(doc => doc.file_path);
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove(filePaths);

  if (storageError) {
    console.warn('Error deleting files from storage:', storageError);
  }

  // Delete document records
  const { error } = await supabase
    .from('documents')
    .delete()
    .in('id', documentIds);

  if (error) {
    console.error('Error bulk deleting documents:', error);
    throw new Error(`Failed to bulk delete documents: ${error.message}`);
  }
};

export const bulkMoveDocuments = async (documentIds: string[], targetFolderId: string | null): Promise<void> => {
  console.log('Bulk moving documents:', documentIds, 'to folder:', targetFolderId);

  const { error } = await supabase
    .from('documents')
    .update({ folder_id: targetFolderId })
    .in('id', documentIds);

  if (error) {
    console.error('Error bulk moving documents:', error);
    throw new Error(`Failed to bulk move documents: ${error.message}`);
  }
};

export const bulkUpdateTags = async (documentIds: string[], tags: string[]): Promise<void> => {
  console.log('Bulk updating tags for documents:', documentIds, 'tags:', tags);

  const { error } = await supabase
    .from('documents')
    .update({ tags })
    .in('id', documentIds);

  if (error) {
    console.error('Error bulk updating tags:', error);
    throw new Error(`Failed to bulk update tags: ${error.message}`);
  }
};

// Document preview
export const getDocumentPreview = async (documentId: string): Promise<{ url: string; type: string }> => {
  console.log('Getting preview for document:', documentId);

  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('file_path, file_type')
    .eq('id', documentId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching document:', fetchError);
    throw new Error(`Failed to fetch document: ${fetchError.message}`);
  }
  
  if (!document) {
    throw new Error('Documento não encontrado');
  }

  // Get signed URL for preview
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 300); // 5 minutes expiry

  if (error) {
    console.error('Error creating preview URL:', error);
    throw new Error(`Failed to create preview URL: ${error.message}`);
  }

  return {
    url: data.signedUrl,
    type: document.file_type
  };
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