import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface CompanyUser {
  id: string;
  full_name: string;
  role?: string;
}

const fetchCompanyUsers = async (companyId: string): Promise<CompanyUser[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('company_id', companyId)
    .order('full_name');

  if (error) throw error;
  return (data || []) as CompanyUser[];
};

export const useCompanyUsers = () => {
  const { selectedCompany } = useCompany();

  return useQuery({
    queryKey: ['company-users', selectedCompany?.id],
    queryFn: () => fetchCompanyUsers(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
  });
};
