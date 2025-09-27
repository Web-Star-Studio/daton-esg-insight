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
  return {
    overall_esg_score: 0,
    environmental: {
      score: 0,
      kpis: []
    },
    social: {
      score: 0,
      kpis: []
    },
    governance: {
      score: 0,
      kpis: []
    }
  };
};