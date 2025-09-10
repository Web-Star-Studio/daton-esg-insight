import { supabase } from "@/integrations/supabase/client";

export interface KPI {
  key: string;
  label: string;
  value: string;
  trend: number;
  unit: string;
}

export interface PillarData {
  score: number;
  kpis: KPI[];
}

export interface ESGDashboardResponse {
  overall_esg_score: number;
  environmental: PillarData;
  social: PillarData;
  governance: PillarData;
}

// Get ESG Dashboard data
export const getESGDashboard = async (): Promise<ESGDashboardResponse> => {
  const { data, error } = await supabase.functions.invoke('esg-dashboard', {
    method: 'GET',
  });

  if (error) {
    console.error('Error fetching ESG dashboard data:', error);
    throw error;
  }

  return data;
};