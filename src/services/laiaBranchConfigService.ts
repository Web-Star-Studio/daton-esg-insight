import { supabase } from "@/integrations/supabase/client";

export interface LAIABranchConfig {
  id: string;
  company_id: string;
  branch_id: string;
  survey_status: "nao_levantado" | "em_levantamento" | "levantado";
  created_at: string;
  updated_at: string;
}

export async function getLAIABranchConfigs(): Promise<LAIABranchConfig[]> {
  const { data, error } = await supabase
    .from("laia_branch_config" as any)
    .select("*");

  if (error) throw new Error(error.message);
  return (data as any) || [];
}

export async function upsertLAIABranchConfig(
  branchId: string,
  surveyStatus: LAIABranchConfig["survey_status"],
  companyId: string
): Promise<LAIABranchConfig> {
  const { data, error } = await supabase
    .from("laia_branch_config" as any)
    .upsert(
      {
        branch_id: branchId,
        survey_status: surveyStatus,
        company_id: companyId,
      } as any,
      { onConflict: "branch_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}
