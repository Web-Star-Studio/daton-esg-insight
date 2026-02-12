import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";

export interface CompanyEmployee {
  id: string;
  full_name: string;
  position?: string;
}

const BATCH_SIZE = 1000;

const fetchCompanyEmployees = async (companyId: string): Promise<CompanyEmployee[]> => {
  let allData: CompanyEmployee[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, position')
      .eq('company_id', companyId)
      .eq('status', 'Ativo')
      .order('full_name')
      .range(from, from + BATCH_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allData = allData.concat(data as CompanyEmployee[]);

    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  return allData;
};

export const useCompanyEmployees = () => {
  const { selectedCompany } = useCompany();

  return useQuery({
    queryKey: ['company-employees', selectedCompany?.id],
    queryFn: () => fetchCompanyEmployees(selectedCompany!.id),
    enabled: !!selectedCompany?.id,
  });
};
