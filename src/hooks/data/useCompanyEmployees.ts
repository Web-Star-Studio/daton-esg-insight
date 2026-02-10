import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface CompanyEmployee {
  id: string;
  full_name: string;
  position?: string;
}

const fetchCompanyEmployees = async (companyId: string): Promise<CompanyEmployee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, position')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('full_name')
    .range(0, 4999);

  if (error) throw error;
  return (data || []) as CompanyEmployee[];
};

export const useCompanyEmployees = () => {
  const { selectedCompany } = useCompany();

  return useQuery({
    queryKey: ['company-employees', selectedCompany?.id],
    queryFn: () => fetchCompanyEmployees(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
  });
};
