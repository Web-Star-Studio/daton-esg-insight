import { supabase } from '@/integrations/supabase/client';

export interface UserWithCompany {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
  role: string;
  company?: {
    id: string;
    name: string;
    cnpj: string;
    sector?: string;
    headquarters_address?: string;
  };
}

export const getUserAndCompany = async (): Promise<UserWithCompany | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        companies (*)
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return null;

    return {
      id: profile.id,
      email: user.email || '',
      full_name: profile.full_name || '',
      company_id: profile.company_id,
      role: profile.role || 'User',
      company: profile.companies ? {
        id: profile.companies.id,
        name: profile.companies.name,
        cnpj: profile.companies.cnpj,
        sector: profile.companies.sector,
        headquarters_address: profile.companies.headquarters_address,
      } : undefined
    };
  } catch (error) {
    console.error('Error getting user and company:', error);
    return null;
  }
};

export const withCompanyId = <T extends Record<string, any>>(data: T, companyId: string): T & { company_id: string } => {
  return { ...data, company_id: companyId };
};