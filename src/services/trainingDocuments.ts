import { supabase } from "@/integrations/supabase/client";

export interface TrainingDocument {
  id: string;
  training_program_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  uploaded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const getTrainingDocuments = async (trainingProgramId: string): Promise<TrainingDocument[]> => {
  const { data, error } = await supabase
    .from('training_documents')
    .select('*')
    .eq('training_program_id', trainingProgramId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const uploadTrainingDocument = async (
  trainingProgramId: string,
  file: File,
  description?: string
): Promise<TrainingDocument> => {
  // Get user and company info
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Usuário não autenticado');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.company_id) throw new Error('Perfil não encontrado');

  // Generate unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `training-documents/${profile.company_id}/${trainingProgramId}/${fileName}`;

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Create database record
  const { data, error } = await supabase
    .from('training_documents')
    .insert({
      training_program_id: trainingProgramId,
      company_id: profile.company_id,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      description,
      uploaded_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    // Rollback storage upload if database insert fails
    await supabase.storage.from('documents').remove([filePath]);
    throw error;
  }

  return data;
};

export const deleteTrainingDocument = async (document: TrainingDocument): Promise<void> => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([document.file_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
  }

  // Delete from database
  const { error } = await supabase
    .from('training_documents')
    .delete()
    .eq('id', document.id);

  if (error) throw error;
};

export const downloadTrainingDocument = async (document: TrainingDocument): Promise<void> => {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(document.file_path);

  if (error) throw error;

  // Create download link
  const url = URL.createObjectURL(data);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = document.file_name;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
