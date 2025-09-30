import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AssetOwnershipRecord {
  id: string;
  company_id: string;
  asset_id: string;
  ownership_type: string;
  owner_company_name?: string;
  owner_contact_info: any;
  ownership_start_date: string;
  ownership_end_date?: string;
  contract_number?: string;
  contract_file_path?: string;
  insurance_policy_number?: string;
  insurance_coverage_amount?: number;
  maintenance_responsibility: string;
  usage_restrictions?: string;
  return_conditions?: string;
  responsible_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanAgreement {
  id: string;
  company_id: string;
  asset_id: string;
  agreement_type: string;
  lender_company_name: string;
  borrower_company_name: string;
  loan_start_date: string;
  loan_end_date?: string;
  renewal_terms?: string;
  return_condition_requirements?: string;
  insurance_requirements?: string;
  usage_limitations?: string;
  penalty_conditions?: string;
  responsible_user_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOwnershipRecordData {
  asset_id: string;
  ownership_type: string;
  owner_company_name?: string;
  owner_contact_info?: any;
  ownership_start_date: string;
  ownership_end_date?: string;
  contract_number?: string;
  contract_file_path?: string;
  insurance_policy_number?: string;
  insurance_coverage_amount?: number;
  maintenance_responsibility?: string;
  usage_restrictions?: string;
  return_conditions?: string;
  responsible_user_id?: string;
}

export interface CreateLoanAgreementData {
  asset_id: string;
  agreement_type?: string;
  lender_company_name: string;
  borrower_company_name: string;
  loan_start_date: string;
  loan_end_date?: string;
  renewal_terms?: string;
  return_condition_requirements?: string;
  insurance_requirements?: string;
  usage_limitations?: string;
  penalty_conditions?: string;
  responsible_user_id?: string;
}

// Asset Ownership Records
export const useAssetOwnershipRecords = () => {
  return useQuery({
    queryKey: ['asset-ownership-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_ownership_records')
        .select(`
          *,
          assets(name, asset_type, location)
        `)
        .order('ownership_start_date', { ascending: false });

      if (error) throw error;
      return data as (AssetOwnershipRecord & { assets: any })[];
    }
  });
};

export const useCreateOwnershipRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateOwnershipRecordData) => {
      // Get user's company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      if (!profile?.company_id) throw new Error('ID da empresa não encontrado');

      const { data: record, error } = await supabase
        .from('asset_ownership_records')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .maybeSingle();

      if (error) throw new Error(`Erro ao criar registro de propriedade: ${error.message}`);
      if (!record) throw new Error('Não foi possível criar o registro de propriedade');
      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-ownership-records'] });
    }
  });
};

// Loan Agreements
export const useLoanAgreements = () => {
  return useQuery({
    queryKey: ['loan-agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_agreements')
        .select(`
          *,
          assets(name, asset_type, location)
        `)
        .order('loan_start_date', { ascending: false });

      if (error) throw error;
      return data as (LoanAgreement & { assets: any })[];
    }
  });
};

export const useCreateLoanAgreement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateLoanAgreementData) => {
      // Get user's company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (profileError) throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
      if (!profile?.company_id) throw new Error('ID da empresa não encontrado');

      const { data: agreement, error } = await supabase
        .from('loan_agreements')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .maybeSingle();

      if (error) throw new Error(`Erro ao criar contrato de empréstimo: ${error.message}`);
      if (!agreement) throw new Error('Não foi possível criar o contrato de empréstimo');
      return agreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-agreements'] });
    }
  });
};

export const useUpdateLoanAgreement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LoanAgreement> }) => {
      const { data, error } = await supabase
        .from('loan_agreements')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw new Error(`Erro ao atualizar contrato de empréstimo: ${error.message}`);
      if (!data) throw new Error('Contrato de empréstimo não encontrado para atualização');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-agreements'] });
    }
  });
};

export const useOwnershipStats = () => {
  return useQuery({
    queryKey: ['ownership-stats'],
    queryFn: async () => {
      const { data: ownership } = await supabase
        .from('asset_ownership_records')
        .select('ownership_type, ownership_end_date, insurance_coverage_amount');

      const { data: loans } = await supabase
        .from('loan_agreements')
        .select('status, loan_end_date, agreement_type');

      const ownedAssets = ownership?.filter(o => o.ownership_type === 'proprio').length || 0;
      const leasedAssets = ownership?.filter(o => o.ownership_type === 'locado').length || 0;
      const comodatoAssets = ownership?.filter(o => o.ownership_type === 'comodato').length || 0;
      
      const activeLoans = loans?.filter(l => l.status === 'ativo').length || 0;
      const expiringSoon = loans?.filter(l => {
        if (!l.loan_end_date) return false;
        const endDate = new Date(l.loan_end_date);
        const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return endDate <= monthFromNow && endDate >= new Date();
      }).length || 0;

      const totalInsuranceValue = ownership?.reduce((sum, o) => sum + (o.insurance_coverage_amount || 0), 0) || 0;

      return {
        ownedAssets,
        leasedAssets,
        comodatoAssets,
        activeLoans,
        expiringSoon,
        totalInsuranceValue,
        totalAssets: ownership?.length || 0
      };
    }
  });
};