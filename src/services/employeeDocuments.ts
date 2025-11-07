import { supabase } from '@/integrations/supabase/client';
import { formErrorHandler } from '@/utils/formErrorHandler';
import { unifiedToast } from '@/utils/unifiedToast';

export interface EmployeeDocument {
  id: string;
  related_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  tags?: string[];
  uploader_user_id: string;
  upload_date: string;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadEmployeeDocument(
  employeeId: string,
  file: File,
  category?: string
): Promise<EmployeeDocument> {
  console.log('=== EMPLOYEE DOCUMENT UPLOAD ===');
  console.log('Employee ID:', employeeId);
  console.log('File:', file.name, file.type, file.size);
  console.log('Category:', category);

  // Validar tipo de arquivo
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG, PNG, XLSX ou CSV.');
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
  }

  return formErrorHandler.createRecord(
    async () => {
      // Obter autenticação e company_id
      const { user, profile } = await formErrorHandler.checkAuth();

      // Sanitizar nome do arquivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${profile.company_id}/employees/${employeeId}/${timestamp}-${randomStr}.${fileExt}`;

      // Upload para storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (storageError) {
        console.error('Storage error:', storageError);
        throw storageError;
      }

      // Criar registro no banco
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          company_id: profile.company_id,
          related_model: 'employee',
          related_id: employeeId,
          file_name: sanitizedName,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          tags: category ? [category] : ['Geral'],
          uploader_user_id: user.id
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: remover arquivo do storage
        await supabase.storage.from('documents').remove([filePath]);
        throw dbError;
      }

      console.log('Document uploaded successfully:', document);
      return document;
    },
    {
      formType: 'Documento do Funcionário',
      successMessage: `${file.name} enviado com sucesso!`
    }
  );
}

export async function getEmployeeDocuments(employeeId: string): Promise<EmployeeDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('related_model', 'employee')
    .eq('related_id', employeeId)
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }

  return data;
}

export async function downloadEmployeeDocument(documentId: string): Promise<string> {
  // Buscar documento
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('file_path, file_name')
    .eq('id', documentId)
    .single();

  if (docError || !document) {
    throw new Error('Documento não encontrado');
  }

  // Gerar URL assinada (válida por 1 hora)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('documents')
    .createSignedUrl(document.file_path, 3600);

  if (urlError || !urlData) {
    throw new Error('Erro ao gerar link de download');
  }

  return urlData.signedUrl;
}

export async function deleteEmployeeDocument(documentId: string): Promise<void> {
  return formErrorHandler.updateRecord(
    async () => {
      // Buscar documento
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Documento não encontrado');
      }

      // Remover do storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Remover do banco
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        throw dbError;
      }
    },
    {
      formType: 'Documento do Funcionário',
      successMessage: 'Documento removido com sucesso!'
    }
  );
}

export async function getDocumentStats(employeeId: string) {
  const documents = await getEmployeeDocuments(employeeId);
  
  const totalSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
  const types = new Set(documents.map(doc => doc.file_type));

  return {
    total: documents.length,
    totalSize,
    totalSizeFormatted: formatFileSize(totalSize),
    types: Array.from(types)
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('word') || fileType.includes('document')) return 'FileText';
  if (fileType.includes('image')) return 'Image';
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('csv')) return 'Sheet';
  return 'File';
}
