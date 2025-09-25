import { supabase } from "@/integrations/supabase/client";

export interface InternalAgreement {
  id: string;
  company_id: string;
  client_company_id?: string;
  supplier_company_id?: string;
  agreement_number: string;
  title: string;
  description?: string;
  agreement_type: string;
  scope?: string;
  deliverables?: any;
  milestones?: any;
  start_date: string;
  end_date?: string;
  status: string;
  approval_workflow?: any;
  signatures?: any;
  version: string;
  parent_agreement_id?: string;
  responsible_user_id?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInternalAgreementData {
  client_company_id?: string;
  supplier_company_id?: string;
  agreement_number: string;
  title: string;
  description?: string;
  agreement_type: string;
  scope?: string;
  deliverables?: any;
  milestones?: any;
  start_date: string;
  end_date?: string;
  responsible_user_id?: string;
  file_path?: string;
}

export const getInternalAgreements = async (): Promise<InternalAgreement[]> => {
  try {
    const { data, error } = await supabase
      .from('internal_agreements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching internal agreements:', error);
    throw error;
  }
};

export const getInternalAgreementById = async (id: string): Promise<InternalAgreement | null> => {
  try {
    const { data, error } = await supabase
      .from('internal_agreements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching internal agreement:', error);
    throw error;
  }
};

export const createInternalAgreement = async (agreementData: CreateInternalAgreementData): Promise<InternalAgreement> => {
  try {
    const { data, error } = await supabase
      .from('internal_agreements')
      .insert({
        ...agreementData,
        version: '1.0'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating internal agreement:', error);
    throw error;
  }
};

export const updateInternalAgreement = async (id: string, updates: Partial<CreateInternalAgreementData>): Promise<InternalAgreement> => {
  try {
    const { data, error } = await supabase
      .from('internal_agreements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating internal agreement:', error);
    throw error;
  }
};

export const deleteInternalAgreement = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('internal_agreements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting internal agreement:', error);
    throw error;
  }
};

export const approveAgreement = async (id: string, approverUserId: string): Promise<InternalAgreement> => {
  try {
    const agreement = await getInternalAgreementById(id);
    if (!agreement) throw new Error('Agreement not found');

    const signatures = agreement.signatures || [];
    signatures.push({
      user_id: approverUserId,
      signed_at: new Date().toISOString(),
      signature_type: 'digital'
    });

    const { data, error } = await supabase
      .from('internal_agreements')
      .update({ 
        signatures,
        status: 'Aprovado'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error approving agreement:', error);
    throw error;
  }
};

export const getAgreementStats = async () => {
  try {
    const { data: agreements, error } = await supabase
      .from('internal_agreements')
      .select('*');

    if (error) throw error;

    const stats = {
      total: agreements?.length || 0,
      draft: agreements?.filter(a => a.status === 'Em Negociação').length || 0,
      approved: agreements?.filter(a => a.status === 'Aprovado').length || 0,
      active: agreements?.filter(a => a.status === 'Ativo').length || 0,
      pending_approval: agreements?.filter(a => a.status === 'Aguardando Aprovação').length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error calculating agreement stats:', error);
    throw error;
  }
};