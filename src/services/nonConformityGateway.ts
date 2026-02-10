import { ConvexHttpClient } from "convex/browser";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getUserAndCompany } from "@/utils/auth";
import type {
  QualityCauseAnalysisContract,
  QualityCauseAnalysisSyncInput,
  QualityEffectivenessContract,
  QualityEffectivenessSyncInput,
  QualityImmediateActionContract,
  QualityImmediateActionSyncInput,
  QualityNcActionPlanContract,
  QualityNcActionPlanSyncInput,
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

export interface NCImmediateActionRecord {
  id: string;
  non_conformity_id: string;
  company_id: string;
  description: string;
  responsible_user_id?: string;
  due_date: string;
  completion_date?: string;
  evidence?: string;
  attachments: Array<unknown>;
  status: "Pendente" | "Em Andamento" | "Concluída" | "Cancelada";
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  responsible?: { id: string; full_name: string };
}

export interface NCCauseAnalysisRecord {
  id: string;
  non_conformity_id: string;
  company_id: string;
  analysis_method: "root_cause" | "ishikawa" | "5_whys" | "other";
  root_cause?: string;
  main_causes?: Array<string>;
  similar_nc_ids: Array<unknown>;
  attachments: Array<unknown>;
  ishikawa_data: unknown;
  five_whys_data: Array<unknown>;
  responsible_user_id?: string;
  due_date?: string;
  completed_at?: string;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NCActionPlanRecord {
  id: string;
  non_conformity_id: string;
  company_id: string;
  what_action: string;
  why_reason?: string;
  how_method?: string;
  where_location?: string;
  who_responsible_id?: string;
  when_deadline: string;
  how_much_cost?: string;
  status: "Planejada" | "Em Execução" | "Concluída" | "Cancelada";
  evidence?: string;
  attachments: Array<unknown>;
  evidence_attachments: Array<unknown>;
  completion_date?: string;
  completed_at?: string;
  order_index: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  responsible?: { id: string; full_name: string };
}

export interface NCEffectivenessRecord {
  id: string;
  non_conformity_id: string;
  company_id: string;
  is_effective?: boolean;
  evidence: string;
  attachments: Array<unknown>;
  requires_risk_update: boolean;
  risk_update_notes?: string;
  requires_sgq_change: boolean;
  sgq_change_notes?: string;
  evaluated_by_user_id?: string;
  evaluated_at?: string;
  postponed_to?: string;
  postponed_reason?: string;
  postponed_responsible_id?: string;
  revision_number: number;
  generated_revision_nc_id?: string;
  created_at: string;
  updated_at: string;
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

function asArray(value: unknown): Array<unknown> {
  return Array.isArray(value) ? value : [];
}

function asObject(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toIsoOrNow(value: string | undefined | null): string {
  return value || new Date().toISOString();
}

function normalizeMainCauses(value: unknown): Array<string> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function buildIshikawaDataWithMainCauses(
  ishikawaData: unknown,
  mainCauses: Array<string>,
): Record<string, unknown> {
  const merged = asObject(ishikawaData);
  merged.main_causes = mainCauses;
  return merged;
}

function extractMainCausesFromIshikawa(ishikawaData: unknown): Array<string> {
  const data = asObject(ishikawaData);
  return normalizeMainCauses(data.main_causes);
}

function mapConvexToImmediateActionRecord(
  action: QualityImmediateActionContract,
): NCImmediateActionRecord {
  return {
    id: action.sourceId || action.id,
    non_conformity_id: action.nonConformitySourceId,
    company_id: action.companyId,
    description: action.description,
    responsible_user_id: action.responsibleUserId,
    due_date: action.dueDate,
    completion_date: action.completionDate,
    evidence: action.evidence,
    attachments: asArray(action.attachments),
    status: (action.status as NCImmediateActionRecord["status"]) || "Pendente",
    created_by_user_id: action.createdByUserId,
    created_at: action.createdAt,
    updated_at: action.updatedAt,
  };
}

function mapImmediateActionToConvexInput(
  action: NCImmediateActionRecord,
): QualityImmediateActionSyncInput {
  return {
    sourceId: action.id,
    companyId: action.company_id,
    nonConformitySourceId: action.non_conformity_id,
    description: action.description,
    responsibleUserId: action.responsible_user_id,
    dueDate: action.due_date,
    completionDate: action.completion_date,
    evidence: action.evidence,
    attachments: asArray(action.attachments),
    status: action.status,
    createdByUserId: action.created_by_user_id,
    createdAt: action.created_at,
    updatedAt: action.updated_at,
  };
}

function mapConvexToCauseAnalysisRecord(
  analysis: QualityCauseAnalysisContract,
): NCCauseAnalysisRecord {
  const ishikawaData = analysis.ishikawaData || {};
  const mainCauses = analysis.mainCauses || extractMainCausesFromIshikawa(ishikawaData);

  return {
    id: analysis.sourceId || analysis.id,
    non_conformity_id: analysis.nonConformitySourceId,
    company_id: analysis.companyId,
    analysis_method: analysis.analysisMethod as NCCauseAnalysisRecord["analysis_method"],
    root_cause: analysis.rootCause,
    main_causes: mainCauses,
    similar_nc_ids: asArray(analysis.similarNcIds),
    attachments: asArray(analysis.attachments),
    ishikawa_data: ishikawaData,
    five_whys_data: asArray(analysis.fiveWhysData),
    responsible_user_id: analysis.responsibleUserId,
    due_date: analysis.dueDate,
    completed_at: analysis.completedAt,
    created_by_user_id: analysis.createdByUserId,
    created_at: analysis.createdAt,
    updated_at: analysis.updatedAt,
  };
}

function mapCauseAnalysisToConvexInput(
  analysis: NCCauseAnalysisRecord,
): QualityCauseAnalysisSyncInput {
  const mainCauses = normalizeMainCauses(analysis.main_causes);
  return {
    sourceId: analysis.id,
    companyId: analysis.company_id,
    nonConformitySourceId: analysis.non_conformity_id,
    analysisMethod: analysis.analysis_method,
    rootCause: analysis.root_cause,
    mainCauses,
    similarNcIds: asArray(analysis.similar_nc_ids),
    attachments: asArray(analysis.attachments),
    ishikawaData: buildIshikawaDataWithMainCauses(analysis.ishikawa_data, mainCauses),
    fiveWhysData: asArray(analysis.five_whys_data),
    responsibleUserId: analysis.responsible_user_id,
    dueDate: analysis.due_date,
    completedAt: analysis.completed_at,
    createdByUserId: analysis.created_by_user_id,
    createdAt: analysis.created_at,
    updatedAt: analysis.updated_at,
  };
}

function mapConvexToActionPlanRecord(
  plan: QualityNcActionPlanContract,
): NCActionPlanRecord {
  return {
    id: plan.sourceId || plan.id,
    non_conformity_id: plan.nonConformitySourceId,
    company_id: plan.companyId,
    what_action: plan.whatAction,
    why_reason: plan.whyReason,
    how_method: plan.howMethod,
    where_location: plan.whereLocation,
    who_responsible_id: plan.whoResponsibleId,
    when_deadline: plan.whenDeadline,
    how_much_cost: plan.howMuchCost,
    status: (plan.status as NCActionPlanRecord["status"]) || "Planejada",
    evidence: plan.evidence,
    attachments: asArray(plan.attachments),
    evidence_attachments: asArray(plan.evidenceAttachments),
    completion_date: plan.completionDate,
    completed_at: plan.completedAt,
    order_index: plan.orderIndex ?? 0,
    created_by_user_id: plan.createdByUserId,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

function mapActionPlanToConvexInput(
  plan: NCActionPlanRecord,
): QualityNcActionPlanSyncInput {
  return {
    sourceId: plan.id,
    companyId: plan.company_id,
    nonConformitySourceId: plan.non_conformity_id,
    whatAction: plan.what_action,
    whyReason: plan.why_reason,
    howMethod: plan.how_method,
    whereLocation: plan.where_location,
    whoResponsibleId: plan.who_responsible_id,
    whenDeadline: plan.when_deadline,
    howMuchCost: plan.how_much_cost,
    status: plan.status,
    evidence: plan.evidence,
    attachments: asArray(plan.attachments),
    evidenceAttachments: asArray(plan.evidence_attachments),
    completionDate: plan.completion_date,
    completedAt: plan.completed_at,
    orderIndex: plan.order_index,
    createdByUserId: plan.created_by_user_id,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
  };
}

function mapConvexToEffectivenessRecord(
  effectiveness: QualityEffectivenessContract,
): NCEffectivenessRecord {
  return {
    id: effectiveness.sourceId || effectiveness.id,
    non_conformity_id: effectiveness.nonConformitySourceId,
    company_id: effectiveness.companyId,
    is_effective: effectiveness.isEffective,
    evidence: effectiveness.evidence,
    attachments: asArray(effectiveness.attachments),
    requires_risk_update: effectiveness.requiresRiskUpdate ?? false,
    risk_update_notes: effectiveness.riskUpdateNotes,
    requires_sgq_change: effectiveness.requiresSgqChange ?? false,
    sgq_change_notes: effectiveness.sgqChangeNotes,
    evaluated_by_user_id: effectiveness.evaluatedByUserId,
    evaluated_at: effectiveness.evaluatedAt,
    postponed_to: effectiveness.postponedTo,
    postponed_reason: effectiveness.postponedReason,
    postponed_responsible_id: effectiveness.postponedResponsibleId,
    revision_number: effectiveness.revisionNumber ?? 1,
    generated_revision_nc_id: effectiveness.generatedRevisionNcId,
    created_at: effectiveness.createdAt,
    updated_at: effectiveness.updatedAt,
  };
}

function mapEffectivenessToConvexInput(
  effectiveness: NCEffectivenessRecord,
): QualityEffectivenessSyncInput {
  return {
    sourceId: effectiveness.id,
    companyId: effectiveness.company_id,
    nonConformitySourceId: effectiveness.non_conformity_id,
    isEffective: effectiveness.is_effective,
    evidence: effectiveness.evidence,
    attachments: asArray(effectiveness.attachments),
    requiresRiskUpdate: effectiveness.requires_risk_update,
    riskUpdateNotes: effectiveness.risk_update_notes,
    requiresSgqChange: effectiveness.requires_sgq_change,
    sgqChangeNotes: effectiveness.sgq_change_notes,
    evaluatedByUserId: effectiveness.evaluated_by_user_id,
    evaluatedAt: effectiveness.evaluated_at,
    postponedTo: effectiveness.postponed_to,
    postponedReason: effectiveness.postponed_reason,
    postponedResponsibleId: effectiveness.postponed_responsible_id,
    revisionNumber: effectiveness.revision_number,
    generatedRevisionNcId: effectiveness.generated_revision_nc_id,
    createdAt: effectiveness.created_at,
    updatedAt: effectiveness.updated_at,
  };
}

async function enrichRowsWithResponsible<T extends { responsible_user_id?: string }>(
  rows: Array<T>,
): Promise<Array<T & { responsible?: { id: string; full_name: string } }>> {
  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.responsible_user_id)
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
  }));
}

async function enrichPlansWithResponsible<T extends { who_responsible_id?: string }>(
  rows: Array<T>,
): Promise<Array<T & { responsible?: { id: string; full_name: string } }>> {
  const userIds = Array.from(
    new Set(
      rows
        .map((row) => row.who_responsible_id)
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
    responsible: profiles?.find((profile) => profile.id === row.who_responsible_id),
  }));
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

async function getImmediateActionsFromSupabase(
  ncId: string,
): Promise<Array<NCImmediateActionRecord>> {
  const { data, error } = await supabase
    .from("nc_immediate_actions")
    .select("*, responsible:profiles!nc_immediate_actions_responsible_user_id_fkey(id, full_name)")
    .eq("non_conformity_id", ncId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<NCImmediateActionRecord>).map((row) => ({
    ...row,
    attachments: asArray(row.attachments),
    status: row.status || "Pendente",
    created_at: toIsoOrNow(row.created_at),
    updated_at: toIsoOrNow(row.updated_at || row.created_at),
  }));
}

async function getCauseAnalysisFromSupabase(
  ncId: string,
): Promise<NCCauseAnalysisRecord | null> {
  const { data, error } = await supabase
    .from("nc_cause_analysis")
    .select("*")
    .eq("non_conformity_id", ncId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const ishikawaData = data.ishikawa_data || {};

  return {
    ...(data as NCCauseAnalysisRecord),
    main_causes: extractMainCausesFromIshikawa(ishikawaData),
    similar_nc_ids: asArray(data.similar_nc_ids),
    attachments: asArray(data.attachments),
    ishikawa_data: ishikawaData,
    five_whys_data: asArray(data.five_whys_data),
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };
}

async function getActionPlansFromSupabase(
  ncId: string,
): Promise<Array<NCActionPlanRecord>> {
  const { data, error } = await supabase
    .from("nc_action_plans")
    .select("*, responsible:profiles!nc_action_plans_who_responsible_id_fkey(id, full_name)")
    .eq("non_conformity_id", ncId)
    .order("order_index", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data || []) as Array<NCActionPlanRecord>).map((row) => ({
    ...row,
    status: row.status || "Planejada",
    attachments: asArray(row.attachments),
    evidence_attachments: asArray((row as unknown as { evidence_attachments?: unknown }).evidence_attachments),
    order_index: row.order_index ?? 0,
    created_at: toIsoOrNow(row.created_at),
    updated_at: toIsoOrNow(row.updated_at || row.created_at),
  }));
}

async function getLatestEffectivenessFromSupabase(
  ncId: string,
): Promise<NCEffectivenessRecord | null> {
  const { data, error } = await supabase
    .from("nc_effectiveness")
    .select("*")
    .eq("non_conformity_id", ncId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as NCEffectivenessRecord),
    attachments: asArray(data.attachments),
    requires_risk_update: data.requires_risk_update || false,
    requires_sgq_change: data.requires_sgq_change || false,
    revision_number: data.revision_number || 1,
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };
}

async function syncImmediateActionToConvex(
  action: NCImmediateActionRecord,
): Promise<void> {
  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<string>("quality:upsertImmediateActionBySourceId", {
      ...mapImmediateActionToConvexInput(action),
    });
  } catch (error) {
    console.warn("Failed to sync immediate action to Convex", error);
  }
}

async function syncCauseAnalysisToConvex(
  analysis: NCCauseAnalysisRecord,
): Promise<void> {
  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<string>("quality:upsertCauseAnalysisBySourceId", {
      ...mapCauseAnalysisToConvexInput(analysis),
    });
  } catch (error) {
    console.warn("Failed to sync cause analysis to Convex", error);
  }
}

async function syncActionPlanToConvex(
  plan: NCActionPlanRecord,
): Promise<void> {
  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<string>("quality:upsertActionPlanBySourceId", {
      ...mapActionPlanToConvexInput(plan),
    });
  } catch (error) {
    console.warn("Failed to sync action plan to Convex", error);
  }
}

async function syncEffectivenessToConvex(
  effectiveness: NCEffectivenessRecord,
): Promise<void> {
  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<string>("quality:upsertEffectivenessBySourceId", {
      ...mapEffectivenessToConvexInput(effectiveness),
    });
  } catch (error) {
    console.warn("Failed to sync effectiveness to Convex", error);
  }
}

async function syncImmediateActionsBatchToConvex(
  rows: Array<NCImmediateActionRecord>,
): Promise<void> {
  if (!convexEnabled || rows.length === 0) {
    return;
  }

  await Promise.allSettled(rows.slice(0, 100).map((row) => syncImmediateActionToConvex(row)));
}

async function syncActionPlansBatchToConvex(
  rows: Array<NCActionPlanRecord>,
): Promise<void> {
  if (!convexEnabled || rows.length === 0) {
    return;
  }

  await Promise.allSettled(rows.slice(0, 100).map((row) => syncActionPlanToConvex(row)));
}

export async function getImmediateActions(
  ncId: string,
): Promise<Array<NCImmediateActionRecord>> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const convexRows = await convexQuery<Array<QualityImmediateActionContract>>(
        "quality:getImmediateActionsBySourceId",
        { companyId, nonConformitySourceId: ncId },
      );

      const mappedRows = convexRows
        .filter((row) => Boolean(row.sourceId))
        .map((row) => mapConvexToImmediateActionRecord(row));

      if (mappedRows.length > 0) {
        return await enrichRowsWithResponsible(mappedRows);
      }
    } catch (error) {
      console.warn("Convex getImmediateActions failed, falling back to Supabase", error);
    }
  }

  const rows = await getImmediateActionsFromSupabase(ncId);
  await syncImmediateActionsBatchToConvex(rows);
  return rows;
}

export async function createImmediateAction(
  action: Omit<NCImmediateActionRecord, "id" | "created_at" | "updated_at">,
): Promise<NCImmediateActionRecord> {
  const companyId = await getCurrentUserCompanyId();
  const { data: userData } = await supabase.auth.getUser();
  const { responsible: _responsible, ...actionPayload } = action as any;

  const { data, error } = await supabase
    .from("nc_immediate_actions")
    .insert({
      ...actionPayload,
      attachments: asArray(action.attachments) as Json,
      company_id: companyId,
      created_by_user_id: userData.user?.id,
    } as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCImmediateActionRecord = {
    ...(data as NCImmediateActionRecord),
    attachments: asArray(data.attachments),
    status: (data.status as NCImmediateActionRecord["status"]) || "Pendente",
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncImmediateActionToConvex(row);
  const [enriched] = await enrichRowsWithResponsible([row]);
  return enriched;
}

export async function updateImmediateAction(
  id: string,
  updates: Partial<NCImmediateActionRecord>,
): Promise<NCImmediateActionRecord> {
  const patch: Record<string, unknown> = { ...updates };
  delete (patch as any).responsible;
  if (patch.attachments !== undefined) {
    patch.attachments = asArray(patch.attachments) as Json;
  }

  const { data, error } = await supabase
    .from("nc_immediate_actions")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCImmediateActionRecord = {
    ...(data as NCImmediateActionRecord),
    attachments: asArray(data.attachments),
    status: (data.status as NCImmediateActionRecord["status"]) || "Pendente",
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncImmediateActionToConvex(row);
  const [enriched] = await enrichRowsWithResponsible([row]);
  return enriched;
}

export async function deleteImmediateAction(id: string): Promise<void> {
  const companyId = await getCurrentUserCompanyId();

  const { error } = await supabase
    .from("nc_immediate_actions")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<null>("quality:deleteImmediateActionBySourceId", {
      companyId,
      sourceId: id,
    });
  } catch (convexError) {
    console.warn("Failed to delete immediate action from Convex", convexError);
  }
}

export async function getCauseAnalysis(
  ncId: string,
): Promise<NCCauseAnalysisRecord | null> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const data = await convexQuery<QualityCauseAnalysisContract | null>(
        "quality:getCauseAnalysisBySourceId",
        { companyId, nonConformitySourceId: ncId },
      );

      if (data) {
        return mapConvexToCauseAnalysisRecord(data);
      }
    } catch (error) {
      console.warn("Convex getCauseAnalysis failed, falling back to Supabase", error);
    }
  }

  const row = await getCauseAnalysisFromSupabase(ncId);
  if (row) {
    await syncCauseAnalysisToConvex(row);
  }
  return row;
}

export async function createCauseAnalysis(
  analysis: Omit<NCCauseAnalysisRecord, "id" | "created_at" | "updated_at">,
): Promise<NCCauseAnalysisRecord> {
  const companyId = await getCurrentUserCompanyId();
  const { data: userData } = await supabase.auth.getUser();
  const mainCauses = normalizeMainCauses(analysis.main_causes);
  const analysisPayload: Record<string, unknown> = { ...analysis };
  delete analysisPayload.main_causes;

  const { data, error } = await supabase
    .from("nc_cause_analysis")
    .insert({
      ...analysisPayload,
      company_id: companyId,
      created_by_user_id: userData.user?.id,
      similar_nc_ids: asArray(analysis.similar_nc_ids) as Json,
      attachments: asArray(analysis.attachments) as Json,
      ishikawa_data: buildIshikawaDataWithMainCauses(analysis.ishikawa_data, mainCauses) as Json,
      five_whys_data: asArray(analysis.five_whys_data) as Json,
    } as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCCauseAnalysisRecord = {
    ...(data as NCCauseAnalysisRecord),
    main_causes: extractMainCausesFromIshikawa(data.ishikawa_data),
    similar_nc_ids: asArray(data.similar_nc_ids),
    attachments: asArray(data.attachments),
    ishikawa_data: data.ishikawa_data || {},
    five_whys_data: asArray(data.five_whys_data),
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncCauseAnalysisToConvex(row);
  return row;
}

export async function updateCauseAnalysis(
  id: string,
  updates: Partial<NCCauseAnalysisRecord>,
): Promise<NCCauseAnalysisRecord> {
  const patch: Record<string, unknown> = { ...updates };
  if (updates.main_causes !== undefined || updates.ishikawa_data !== undefined) {
    const mainCauses = normalizeMainCauses(updates.main_causes);
    patch.ishikawa_data = buildIshikawaDataWithMainCauses(
      updates.ishikawa_data,
      mainCauses,
    );
  }
  delete patch.main_causes;
  if (patch.similar_nc_ids !== undefined) {
    patch.similar_nc_ids = asArray(patch.similar_nc_ids) as Json;
  }
  if (patch.attachments !== undefined) {
    patch.attachments = asArray(patch.attachments) as Json;
  }
  if (patch.five_whys_data !== undefined) {
    patch.five_whys_data = asArray(patch.five_whys_data) as Json;
  }
  if (patch.ishikawa_data !== undefined) {
    patch.ishikawa_data = asObject(patch.ishikawa_data) as Json;
  }

  const { data, error } = await supabase
    .from("nc_cause_analysis")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCCauseAnalysisRecord = {
    ...(data as NCCauseAnalysisRecord),
    main_causes: extractMainCausesFromIshikawa(data.ishikawa_data),
    similar_nc_ids: asArray(data.similar_nc_ids),
    attachments: asArray(data.attachments),
    ishikawa_data: data.ishikawa_data || {},
    five_whys_data: asArray(data.five_whys_data),
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncCauseAnalysisToConvex(row);
  return row;
}

export async function getActionPlans(
  ncId: string,
): Promise<Array<NCActionPlanRecord>> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const convexRows = await convexQuery<Array<QualityNcActionPlanContract>>(
        "quality:getActionPlansBySourceId",
        { companyId, nonConformitySourceId: ncId },
      );

      const mappedRows = convexRows
        .filter((row) => Boolean(row.sourceId))
        .map((row) => mapConvexToActionPlanRecord(row));

      if (mappedRows.length > 0) {
        return await enrichPlansWithResponsible(mappedRows);
      }
    } catch (error) {
      console.warn("Convex getActionPlans failed, falling back to Supabase", error);
    }
  }

  const rows = await getActionPlansFromSupabase(ncId);
  await syncActionPlansBatchToConvex(rows);
  return rows;
}

export async function createActionPlan(
  plan: Omit<NCActionPlanRecord, "id" | "created_at" | "updated_at">,
): Promise<NCActionPlanRecord> {
  const companyId = await getCurrentUserCompanyId();
  const { data: userData } = await supabase.auth.getUser();
  const { responsible: _responsible, ...planPayload } = plan as any;

  const { data, error } = await supabase
    .from("nc_action_plans")
    .insert({
      ...planPayload,
      attachments: asArray(plan.attachments) as Json,
      evidence_attachments: asArray(plan.evidence_attachments) as Json,
      company_id: companyId,
      created_by_user_id: userData.user?.id,
    } as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCActionPlanRecord = {
    ...(data as NCActionPlanRecord),
    status: (data.status as NCActionPlanRecord["status"]) || "Planejada",
    attachments: asArray(data.attachments),
    evidence_attachments: asArray(data.evidence_attachments),
    order_index: data.order_index ?? 0,
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncActionPlanToConvex(row);
  const [enriched] = await enrichPlansWithResponsible([row]);
  return enriched;
}

export async function updateActionPlan(
  id: string,
  updates: Partial<NCActionPlanRecord>,
): Promise<NCActionPlanRecord> {
  const patch: Record<string, unknown> = { ...updates };
  delete (patch as any).responsible;
  if (patch.attachments !== undefined) {
    patch.attachments = asArray(patch.attachments) as Json;
  }
  if ((patch as any).evidence_attachments !== undefined) {
    (patch as any).evidence_attachments = asArray((patch as any).evidence_attachments) as Json;
  }

  const { data, error } = await supabase
    .from("nc_action_plans")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCActionPlanRecord = {
    ...(data as NCActionPlanRecord),
    status: (data.status as NCActionPlanRecord["status"]) || "Planejada",
    attachments: asArray(data.attachments),
    evidence_attachments: asArray(data.evidence_attachments),
    order_index: data.order_index ?? 0,
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncActionPlanToConvex(row);
  const [enriched] = await enrichPlansWithResponsible([row]);
  return enriched;
}

export async function deleteActionPlan(id: string): Promise<void> {
  const companyId = await getCurrentUserCompanyId();

  const { error } = await supabase
    .from("nc_action_plans")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  if (!convexEnabled) {
    return;
  }

  try {
    await convexMutation<null>("quality:deleteActionPlanBySourceId", {
      companyId,
      sourceId: id,
    });
  } catch (convexError) {
    console.warn("Failed to delete action plan from Convex", convexError);
  }
}

export async function getEffectiveness(
  ncId: string,
): Promise<NCEffectivenessRecord | null> {
  const companyId = await getCurrentUserCompanyId();

  if (convexEnabled) {
    try {
      const data = await convexQuery<QualityEffectivenessContract | null>(
        "quality:getLatestEffectivenessBySourceId",
        { companyId, nonConformitySourceId: ncId },
      );

      if (data) {
        return mapConvexToEffectivenessRecord(data);
      }
    } catch (error) {
      console.warn("Convex getEffectiveness failed, falling back to Supabase", error);
    }
  }

  const row = await getLatestEffectivenessFromSupabase(ncId);
  if (row) {
    await syncEffectivenessToConvex(row);
  }
  return row;
}

export async function createEffectiveness(
  effectiveness: Omit<NCEffectivenessRecord, "id" | "created_at" | "updated_at">,
): Promise<NCEffectivenessRecord> {
  const companyId = await getCurrentUserCompanyId();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("nc_effectiveness")
    .insert({
      ...effectiveness,
      attachments: asArray(effectiveness.attachments) as Json,
      company_id: companyId,
      evaluated_by_user_id: userData.user?.id,
      evaluated_at: new Date().toISOString(),
    } as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCEffectivenessRecord = {
    ...(data as NCEffectivenessRecord),
    attachments: asArray(data.attachments),
    requires_risk_update: data.requires_risk_update || false,
    requires_sgq_change: data.requires_sgq_change || false,
    revision_number: data.revision_number || 1,
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncEffectivenessToConvex(row);
  return row;
}

export async function updateEffectiveness(
  id: string,
  updates: Partial<NCEffectivenessRecord>,
): Promise<NCEffectivenessRecord> {
  const patch: Record<string, unknown> = { ...updates };
  if (patch.attachments !== undefined) {
    patch.attachments = asArray(patch.attachments) as Json;
  }

  const { data, error } = await supabase
    .from("nc_effectiveness")
    .update(patch as any)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const row: NCEffectivenessRecord = {
    ...(data as NCEffectivenessRecord),
    attachments: asArray(data.attachments),
    requires_risk_update: data.requires_risk_update || false,
    requires_sgq_change: data.requires_sgq_change || false,
    revision_number: data.revision_number || 1,
    created_at: toIsoOrNow(data.created_at),
    updated_at: toIsoOrNow(data.updated_at || data.created_at),
  };

  await syncEffectivenessToConvex(row);
  return row;
}
