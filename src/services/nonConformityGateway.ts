import { ConvexHttpClient } from "convex/browser";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getUserAndCompany } from "@/utils/auth";
import type {
  QualityNonConformityContract,
  QualityNonConformitySyncInput,
} from "@ws/shared";

export interface NonConformityRecord {
  id: string;
  nc_number: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  source: string;
  detected_date: string;
  status: string;
  created_at: string;
  updated_at?: string;
  company_id: string;
  damage_level?: string;
  impact_analysis?: string;
  root_cause_analysis?: string;
  corrective_actions?: string;
  preventive_actions?: string;
  effectiveness_evaluation?: string;
  effectiveness_date?: string;
  responsible_user_id?: string;
  approved_by_user_id?: string;
  approval_date?: string;
  approval_notes?: string;
  due_date?: string;
  completion_date?: string;
  recurrence_count?: number;
  current_stage?: number;
  stage_1_completed_at?: string;
  stage_2_completed_at?: string;
  stage_3_completed_at?: string;
  stage_4_completed_at?: string;
  stage_5_completed_at?: string;
  stage_6_completed_at?: string;
  revision_number?: number;
  parent_nc_id?: string;
  organizational_unit_id?: string;
  process_id?: string;
  sector?: string;
  attachments?: Json;
  responsible?: { id: string; full_name: string };
  approved_by?: { id: string; full_name: string };
}

export interface CreateNonConformityInput {
  title: string;
  description: string;
  category?: string | null;
  severity: string;
  source: string;
  detected_date: string;
  damage_level?: string | null;
  responsible_user_id?: string | null;
  organizational_unit_id?: string | null;
  sector?: string | null;
  attachments?: Json | null;
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexEnabled =
  import.meta.env.VITE_USE_CONVEX_QUALITY === "true" && !!convexUrl;
const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

function generateNCNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = now.getTime().toString().slice(-4);
  return `NC-${year}${month}${day}-${timestamp}`;
}

async function getCurrentUserCompanyId(): Promise<string> {
  const userAndCompany = await getUserAndCompany();

  if (!userAndCompany?.company_id) {
    throw new Error("Company ID not found");
  }

  return userAndCompany.company_id;
}

async function convexQuery<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!convexClient) {
    throw new Error("Convex não configurado");
  }

  return (await convexClient.query(
    name as unknown as never,
    args as unknown as never,
  )) as T;
}

async function convexMutation<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  if (!convexClient) {
    throw new Error("Convex não configurado");
  }

  return (await convexClient.mutation(
    name as unknown as never,
    args as unknown as never,
  )) as T;
}

function mapConvexToRecord(
  nc: QualityNonConformityContract,
): NonConformityRecord {
  return {
    id: nc.sourceId || nc.id,
    nc_number: nc.ncNumber,
    title: nc.title,
    description: nc.description || "",
    category: nc.category || "",
    severity: nc.severity,
    source: nc.source || "",
    detected_date: nc.detectedDate || "",
    status: nc.status,
    created_at: nc.createdAt,
    updated_at: nc.updatedAt,
    company_id: nc.companyId,
    damage_level: nc.damageLevel,
    impact_analysis: nc.impactAnalysis,
    root_cause_analysis: nc.rootCauseAnalysis,
    corrective_actions: nc.correctiveActions,
    preventive_actions: nc.preventiveActions,
    effectiveness_evaluation: nc.effectivenessEvaluation,
    effectiveness_date: nc.effectivenessDate,
    responsible_user_id: nc.responsibleUserId,
    approved_by_user_id: nc.approvedByUserId,
    approval_date: nc.approvalDate,
    approval_notes: nc.approvalNotes,
    due_date: nc.dueDate,
    completion_date: nc.completedAt,
    recurrence_count: nc.recurrenceCount,
    current_stage: nc.currentStage,
    stage_1_completed_at: nc.stage1CompletedAt,
    stage_2_completed_at: nc.stage2CompletedAt,
    stage_3_completed_at: nc.stage3CompletedAt,
    stage_4_completed_at: nc.stage4CompletedAt,
    stage_5_completed_at: nc.stage5CompletedAt,
    stage_6_completed_at: nc.stage6CompletedAt,
    revision_number: nc.revisionNumber,
    parent_nc_id: nc.parentNcId,
    organizational_unit_id: nc.organizationalUnitId,
    process_id: nc.processId,
    sector: nc.sector,
  };
}

function mapSupabaseToConvexInput(
  nc: NonConformityRecord,
): QualityNonConformitySyncInput {
  return {
    sourceId: nc.id,
    companyId: nc.company_id,
    ncNumber: nc.nc_number,
    title: nc.title,
    description: nc.description || undefined,
    category: nc.category || undefined,
    severity: nc.severity,
    status: nc.status,
    source: nc.source || undefined,
    detectedDate: nc.detected_date || undefined,
    dueDate: nc.due_date || undefined,
    resolvedAt: undefined,
    completedAt: nc.completion_date || undefined,
    currentStage: nc.current_stage,
    stage1CompletedAt: nc.stage_1_completed_at,
    stage2CompletedAt: nc.stage_2_completed_at,
    stage3CompletedAt: nc.stage_3_completed_at,
    stage4CompletedAt: nc.stage_4_completed_at,
    stage5CompletedAt: nc.stage_5_completed_at,
    stage6CompletedAt: nc.stage_6_completed_at,
    revisionNumber: nc.revision_number,
    parentNcId: nc.parent_nc_id,
    organizationalUnitId: nc.organizational_unit_id,
    processId: nc.process_id,
    sector: nc.sector,
    damageLevel: nc.damage_level,
    impactAnalysis: nc.impact_analysis,
    rootCauseAnalysis: nc.root_cause_analysis,
    correctiveActions: nc.corrective_actions,
    preventiveActions: nc.preventive_actions,
    effectivenessEvaluation: nc.effectiveness_evaluation,
    effectivenessDate: nc.effectiveness_date,
    responsibleUserId: nc.responsible_user_id,
    approvedByUserId: nc.approved_by_user_id,
    approvalDate: nc.approval_date,
    approvalNotes: nc.approval_notes,
    recurrenceCount: nc.recurrence_count,
    createdAt: nc.created_at,
    updatedAt: nc.updated_at || nc.created_at,
  };
}

async function enrichWithProfiles<T extends NonConformityRecord>(
  rows: Array<T>,
): Promise<Array<T>> {
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.responsible_user_id, row.approved_by_user_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (userIds.length === 0) {
    return rows;
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  if (error) {
    return rows;
  }

  return rows.map((row) => ({
    ...row,
    responsible: profiles?.find((profile) => profile.id === row.responsible_user_id),
    approved_by: profiles?.find((profile) => profile.id === row.approved_by_user_id),
  }));
}

async function getNonConformitiesFromSupabase(
  companyId: string,
): Promise<Array<NonConformityRecord>> {
  const { data, error } = await supabase
    .from("non_conformities")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (await enrichWithProfiles(
    ((data || []) as Array<NonConformityRecord>).map((row) => ({
      ...row,
      description: row.description || "",
      category: row.category || "",
      source: row.source || "",
      detected_date: row.detected_date || "",
      updated_at: row.updated_at || row.created_at,
    })),
  )) as Array<NonConformityRecord>;
}

async function getNonConformityFromSupabase(
  id: string,
): Promise<NonConformityRecord> {
  const { data, error } = await supabase
    .from("non_conformities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  const [enriched] = await enrichWithProfiles([
    {
      ...(data as NonConformityRecord),
      description: data.description || "",
      category: data.category || "",
      source: data.source || "",
      detected_date: data.detected_date || "",
      updated_at: data.updated_at || data.created_at,
    },
  ]);

  return enriched;
}

async function syncNonConformityToConvex(
  nc: NonConformityRecord,
): Promise<void> {
  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<string>("quality:upsertNonConformityBySourceId", {
      ...mapSupabaseToConvexInput(nc),
    });
  } catch (error) {
    console.warn("Failed to sync non-conformity to Convex", error);
  }
}

async function syncBatchToConvex(rows: Array<NonConformityRecord>): Promise<void> {
  if (!convexEnabled || rows.length === 0) {
    return;
  }

  const maxBackfill = 100;
  const slice = rows.slice(0, maxBackfill);
  await Promise.allSettled(
    slice.map((row) => syncNonConformityToConvex(row)),
  );
}

export async function getNonConformities(): Promise<Array<NonConformityRecord>> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const convexRows = await convexQuery<Array<QualityNonConformityContract>>(
        "quality:getNonConformities",
        { companyId },
      );

      const mappedRows = convexRows
        .filter((row) => Boolean(row.sourceId))
        .map((row) => mapConvexToRecord(row));

      if (mappedRows.length > 0) {
        return await enrichWithProfiles(mappedRows);
      }
    } catch (error) {
      console.warn("Convex getNonConformities failed, falling back to Supabase", error);
    }
  }

  const rows = await getNonConformitiesFromSupabase(companyId);
  await syncBatchToConvex(rows);
  return rows;
}

export async function getNonConformity(
  id: string,
): Promise<NonConformityRecord> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const data = await convexQuery<QualityNonConformityContract | null>(
        "quality:getNonConformityBySourceId",
        { companyId, sourceId: id },
      );

      if (data) {
        const [enriched] = await enrichWithProfiles([mapConvexToRecord(data)]);
        return enriched;
      }
    } catch (error) {
      console.warn("Convex getNonConformity failed, falling back to Supabase", error);
    }
  }

  const row = await getNonConformityFromSupabase(id);
  await syncNonConformityToConvex(row);
  return row;
}

export async function createNonConformity(
  input: CreateNonConformityInput,
): Promise<NonConformityRecord> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("Company ID não encontrado");
  }

  const cleanData = {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category?.trim() || null,
    severity: input.severity,
    source: input.source,
    detected_date: input.detected_date,
    damage_level: input.damage_level || null,
    responsible_user_id: input.responsible_user_id || null,
    organizational_unit_id: input.organizational_unit_id || null,
    sector: input.sector || null,
    attachments: input.attachments || null,
    nc_number: generateNCNumber(),
    company_id: profile.company_id,
  };

  const { data, error } = await supabase
    .from("non_conformities")
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row = {
    ...(data as NonConformityRecord),
    description: data.description || "",
    category: data.category || "",
    source: data.source || "",
    detected_date: data.detected_date || "",
    updated_at: data.updated_at || data.created_at,
  };

  await syncNonConformityToConvex(row);

  const [enriched] = await enrichWithProfiles([row]);
  return enriched;
}

export async function updateNonConformity(
  id: string,
  updates: Partial<NonConformityRecord>,
): Promise<NonConformityRecord> {
  const { data, error } = await supabase
    .from("non_conformities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row = {
    ...(data as NonConformityRecord),
    description: data.description || "",
    category: data.category || "",
    source: data.source || "",
    detected_date: data.detected_date || "",
    updated_at: data.updated_at || data.created_at,
  };

  await syncNonConformityToConvex(row);

  const [enriched] = await enrichWithProfiles([row]);
  return enriched;
}

export async function deleteNonConformity(id: string): Promise<void> {
  const companyId = await getCurrentUserCompanyId();

  const { error } = await supabase
    .from("non_conformities")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<null>("quality:deleteNonConformityBySourceId", {
      companyId,
      sourceId: id,
    });
  } catch (convexError) {
    console.warn("Failed to delete non-conformity from Convex", convexError);
  }
}

export async function approveNonConformity(
  id: string,
  userId: string,
): Promise<NonConformityRecord> {
  return await updateNonConformity(id, {
    approved_by_user_id: userId,
    approval_date: new Date().toISOString(),
    status: "Aprovada",
  });
}

export async function closeNonConformity(
  id: string,
): Promise<NonConformityRecord> {
  return await updateNonConformity(id, {
    status: "closed",
    completion_date: new Date().toISOString(),
  });
}
