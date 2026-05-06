import { supabase } from "@/integrations/supabase/client";

export type ComplianceResponseValue = string | string[];
export type ComplianceResponses = Record<string, ComplianceResponseValue>;

export interface ComplianceProfile {
  id: string;
  branch_id: string | null;
  company_id: string;
  responses: ComplianceResponses;
  generated_tags: string[];
  completed_at: string | null;
  completed_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const normalizeProfile = (row: Record<string, unknown>): ComplianceProfile => ({
  id: row.id as string,
  branch_id: (row.branch_id as string | null) ?? null,
  company_id: row.company_id as string,
  responses: ((row.responses ?? {}) as ComplianceResponses),
  generated_tags: ((row.generated_tags ?? []) as string[]),
  completed_at: (row.completed_at as string | null) ?? null,
  completed_by: (row.completed_by as string | null) ?? null,
  created_at: (row.created_at as string | null) ?? null,
  updated_at: (row.updated_at as string | null) ?? null,
});

export const fetchComplianceProfile = async (
  branchId: string,
): Promise<ComplianceProfile | null> => {
  const { data, error } = await supabase
    .from("legislation_compliance_profiles")
    .select("*")
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeProfile(data as Record<string, unknown>) : null;
};

export const fetchAllComplianceProfiles = async (
  companyId: string,
): Promise<ComplianceProfile[]> => {
  const { data, error } = await supabase
    .from("legislation_compliance_profiles")
    .select("*")
    .eq("company_id", companyId);

  if (error) throw error;
  return (data ?? []).map((row) => normalizeProfile(row as Record<string, unknown>));
};

export type UpsertComplianceProfileInput = {
  branch_id: string;
  company_id: string;
  responses: ComplianceResponses;
} & (
  | { final: true; generated_tags: string[] }
  | { final?: false }
);

export const upsertComplianceProfile = async (
  input: UpsertComplianceProfileInput,
): Promise<ComplianceProfile> => {
  const payload: Record<string, unknown> = {
    branch_id: input.branch_id,
    company_id: input.company_id,
    responses: input.responses,
  };

  if (input.final) {
    const { data: userData } = await supabase.auth.getUser();
    payload.generated_tags = input.generated_tags;
    payload.completed_at = new Date().toISOString();
    payload.completed_by = userData?.user?.id ?? null;
  }

  const { data, error } = await supabase
    .from("legislation_compliance_profiles")
    .upsert(payload, { onConflict: "branch_id" })
    .select()
    .single();

  if (error) throw error;
  return normalizeProfile(data as Record<string, unknown>);
};

export const generateProfileTags = (
  profile: Pick<ComplianceProfile, "generated_tags"> | null | undefined,
): string[] => profile?.generated_tags ?? [];
