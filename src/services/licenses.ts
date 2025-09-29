import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface ExtractedLicenseFormData {
  nome: string;
  tipo: string;
  orgaoEmissor: string;
  numeroProcesso: string;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  condicionantes: string;
  confidence_scores: {
    nome: number;
    tipo: number;
    orgaoEmissor: number;
    numeroProcesso: number;
    dataEmissao: number;
    dataVencimento: number;
    status: number;
    condicionantes: number;
  };
}

export interface DocumentAnalysisResult {
  success: boolean;
  extracted_data?: ExtractedLicenseFormData;
  overall_confidence?: number;
  analysis_timestamp?: string;
  file_type?: string;
  analysis_type?: string;
  analysis_attempted?: boolean;
  partial_data?: any;
  confidence?: number;
  error?: string;
}

export interface LicenseData {
  id: string;
  name: string;
  type: string;
  status: string;
  issue_date?: string;
  expiration_date: string;
  issuing_body: string;
  process_number?: string;
  conditions?: string;
  responsible_user_id?: string;
  asset_id?: string;
  company_id: string;
  ai_processing_status?: string;
  ai_confidence_score?: number;
  ai_extracted_data?: any;
  ai_last_analysis_at?: string;
  compliance_score?: number;
  created_at: string;
  updated_at: string;
}

export interface LicenseListItem {
  id: string;
  name: string;
  type: string;
  issuing_body: string;
  expiration_date: string;
  status: string;
  process_number?: string;
  issue_date?: string;
  ai_processing_status?: string;
  ai_confidence_score?: number;
  compliance_score?: number;
}

export interface CreateLicenseData {
  name: string
  type: string
  issuing_body: string
  process_number?: string
  issue_date?: Date
  expiration_date: Date
  status: string
  conditions?: string
  responsible_user_id?: string
}

export interface UpdateLicenseData {
  name?: string
  type?: string
  issuing_body?: string
  process_number?: string
  issue_date?: Date
  expiration_date?: Date
  status?: string
  conditions?: string
  responsible_user_id?: string
}

export interface LicenseDocument {
  id: string
  file_name: string
  file_path: string
  upload_date: string
}

export interface LicenseDetail {
  id: string;
  name: string;
  type: string;
  status: string;
  issue_date?: string;
  expiration_date: string;
  issuing_body: string;
  process_number?: string;
  conditions?: string;
  responsible_user_id?: string;
  asset_id?: string;
  ai_processing_status?: string;
  ai_confidence_score?: number;
  ai_extracted_data?: any;
  ai_last_analysis_at?: string;
  compliance_score?: number;
  created_at: string;
  updated_at: string;
  documents: LicenseDocument[];
}

export interface LicenseFilters {
  status?: string
  expires_in_days?: number
}

export interface LicenseStats {
  total: number
  active: number
  upcoming: number
  expired: number
}

// GET /api/v1/licenses
export async function getLicenses(filters?: LicenseFilters): Promise<LicenseListItem[]> {
  try {
    let query = supabase
      .from('licenses')
      .select(`
        id,
        name,
        type,
        issuing_body,
        process_number,
        issue_date,
        expiration_date,
        status,
        ai_processing_status,
        ai_confidence_score,
        compliance_score
      `)
      .order('expiration_date', { ascending: true })

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status as any)
    }

    // Apply expires_in_days filter
    if (filters?.expires_in_days) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.expires_in_days)
      query = query.lte('expiration_date', futureDate.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching licenses:', error)
      toast.error('Erro ao carregar licenças')
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getLicenses:', error)
    throw error
  }
}

// GET /api/v1/licenses/{licenseId}
export async function getLicenseById(id: string): Promise<LicenseDetail> {
  try {
    // Get license data
    const { data: licenseData, error: licenseError } = await supabase
      .from('licenses')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (licenseError || !licenseData) {
      console.error('Error fetching license:', licenseError)
      toast.error('Licença não encontrada')
      throw new Error('Licença não encontrada')
    }

    // Get associated documents
    const { data: documentsData, error: documentsError } = await supabase
      .from('documents')
      .select(`
        id,
        file_name,
        file_path,
        upload_date
      `)
      .in('related_model', ['license', 'licenses'])
      .eq('related_id', id)

    if (documentsError) {
      console.error('Error fetching documents:', documentsError)
      // Don't throw error for documents, just log it
    }

    return {
      ...licenseData,
      documents: documentsData || []
    }
  } catch (error) {
    console.error('Error in getLicenseById:', error)
    throw error
  }
}

// POST /api/v1/licenses
export async function createLicense(licenseData: CreateLicenseData): Promise<LicenseData> {
  try {
    // Get current user and company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user's company ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile?.company_id) {
      throw new Error('Empresa do usuário não encontrada')
    }

    const { data, error } = await supabase
      .from('licenses')
      .insert({
        name: licenseData.name,
        type: licenseData.type as any,
        issuing_body: licenseData.issuing_body,
        process_number: licenseData.process_number,
        issue_date: licenseData.issue_date?.toISOString().split('T')[0],
        expiration_date: licenseData.expiration_date.toISOString().split('T')[0],
        status: licenseData.status as any,
        conditions: licenseData.conditions,
        responsible_user_id: licenseData.responsible_user_id,
        company_id: profile.company_id
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error creating license:', error)
      toast.error('Erro ao criar licença')
      throw error
    }

    if (!data) {
      throw new Error('Erro ao criar licença')
    }

    toast.success('Licença criada com sucesso!')
    return data
  } catch (error) {
    console.error('Error in createLicense:', error)
    throw error
  }
}

// PUT /api/v1/licenses/{licenseId}
export async function updateLicense(id: string, updates: UpdateLicenseData): Promise<LicenseData> {
  try {
    const updateData: any = { ...updates }
    
    // Convert dates to strings if they exist
    if (updateData.issue_date) {
      updateData.issue_date = updateData.issue_date.toISOString().split('T')[0]
    }
    if (updateData.expiration_date) {
      updateData.expiration_date = updateData.expiration_date.toISOString().split('T')[0]
    }

    const { data, error } = await supabase
      .from('licenses')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating license:', error)
      toast.error('Erro ao atualizar licença')
      throw error
    }

    if (!data) {
      throw new Error('Licença não encontrada')
    }

    toast.success('Licença atualizada com sucesso!')
    return data
  } catch (error) {
    console.error('Error in updateLicense:', error)
    throw error
  }
}

// DELETE /api/v1/licenses/{licenseId}
export async function deleteLicense(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting license:', error)
      toast.error('Erro ao excluir licença')
      throw error
    }

    toast.success('Licença excluída com sucesso!')
  } catch (error) {
    console.error('Error in deleteLicense:', error)
    throw error
  }
}

// POST /api/v1/licenses/{licenseId}/documents
export async function uploadLicenseDocument(licenseId: string, file: File): Promise<LicenseDocument> {
  try {
    // Generate unique file name to prevent duplicates
    const fileExt = file.name.split('.').pop()
    const baseName = file.name.replace(`.${fileExt}`, '')
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `licenses/${licenseId}/${fileName}`

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      toast.error('Erro ao fazer upload do arquivo')
      throw uploadError
    }

    // Get current user and company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get user's company ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile?.company_id) {
      throw new Error('Empresa do usuário não encontrada')
    }

    // Check for existing document with same name and generate unique name if needed
    let finalFileName = file.name
    let counter = 1
    
    while (true) {
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id')
        .eq('file_name', finalFileName)
        .eq('related_model', 'licenses')
        .eq('related_id', licenseId)
        .maybeSingle()
      
      if (!existingDoc) break
      
      counter++
      const nameWithoutExt = baseName
      finalFileName = `${nameWithoutExt} (${counter}).${fileExt}`
    }

    // Save document record with unique name
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        file_name: finalFileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        related_model: 'licenses',
        related_id: licenseId,
        uploader_user_id: user.id,
        company_id: profile.company_id
      })
      .select()
      .maybeSingle()

    if (documentError || !documentData) {
      console.error('Error saving document record:', documentError)
      // Try to clean up the uploaded file
      await supabase.storage.from('documents').remove([filePath])
      toast.error('Erro ao salvar registro do documento')
      throw documentError || new Error('Erro ao salvar documento')
    }

    const successMessage = finalFileName !== file.name 
      ? `Documento salvo como "${finalFileName}" (nome ajustado para evitar duplicata)`
      : 'Documento anexado com sucesso!'
    
    toast.success(successMessage)
    return {
      id: documentData.id,
      file_name: documentData.file_name,
      file_path: documentData.file_path,
      upload_date: documentData.upload_date
    }
  } catch (error) {
    console.error('Error in uploadLicenseDocument:', error)
    throw error
  }
}

// Get license statistics for dashboard
export async function getLicenseStats(): Promise<LicenseStats> {
  try {
    const { data: licenses, error } = await supabase
      .from('licenses')
      .select('status, expiration_date')

    if (error) {
      console.error('Error fetching license stats:', error)
      throw error
    }

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + 90) // 90 days from now

    const stats: LicenseStats = {
      total: licenses?.length || 0,
      active: 0,
      upcoming: 0,
      expired: 0
    }

    licenses?.forEach(license => {
      const expirationDate = new Date(license.expiration_date)
      
      if (license.status === 'Ativa') {
        stats.active++
      }
      
      if (expirationDate < today) {
        stats.expired++
      } else if (expirationDate <= futureDate) {
        stats.upcoming++
      }
    })

    return stats
  } catch (error) {
    console.error('Error in getLicenseStats:', error)
    throw error
  }
}

// Get document URL for download
export async function getDocumentUrl(filePath: string): Promise<string> {
  try {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (!data?.signedUrl) {
      throw new Error('Failed to generate document URL')
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error getting document URL:', error)
    throw error
  }
}

// Analyze license document with AI for form auto-fill
export async function analyzeLicenseDocument(file: File): Promise<DocumentAnalysisResult> {
  try {
    // First upload the file temporarily for analysis
    const fileExt = file.name.split('.').pop()
    const tempFileName = `temp-analysis-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const tempFilePath = `temp/${tempFileName}`

    // Upload file to temporary location
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(tempFilePath, file, {
        cacheControl: '300',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading temp file:', uploadError)
      throw new Error('Erro ao fazer upload temporário do arquivo')
    }

    try {
      // Call the document analyzer edge function
      const { data, error } = await supabase.functions.invoke('license-document-analyzer', {
        body: { filePath: tempFilePath }
      })

      if (error) {
        console.error('Edge function error:', error)
        throw new Error(`Erro na análise: ${error.message || 'Erro desconhecido'}`)
      }

      if (!data?.success) {
        console.error('Analysis failed:', data)
        const errorMsg = data?.error || 'Falha na análise do documento'
        const details = data?.details ? ` - Detalhes: ${data.details}` : ''
        throw new Error(`${errorMsg}${details}`)
      }

      return data as DocumentAnalysisResult
    } finally {
      // Clean up temporary file
      await supabase.storage.from('documents').remove([tempFilePath])
    }
  } catch (error) {
    console.error('Error in analyzeLicenseDocument:', error)
    // Re-throw with original message to preserve details
    throw error
  }
}