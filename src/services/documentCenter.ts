import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { processDocumentWithAI } from "@/services/documentAI";
import { downloadDocument, uploadDocument } from "@/services/documents";
import { getDocumentsBranchesMap, linkDocumentToBranches, updateDocumentBranches } from "@/services/documentBranches";
import { documentVersionsService } from "@/services/gedDocuments";

type LegacyDocumentRow = Database["public"]["Tables"]["documents"]["Row"] & {
  title?: string | null;
  document_kind?: "general" | "controlled" | null;
  document_domain?: string | null;
  status?: "draft" | "active" | "in_review" | "rejected" | "archived" | null;
  summary?: string | null;
};

export interface DocumentControlProfile {
  document_id: string;
  code: string | null;
  document_type_label: string;
  norm_reference: string | null;
  issuer_name: string | null;
  confidentiality_level: string;
  validity_start_date: string | null;
  validity_end_date: string | null;
  review_due_date: string | null;
  responsible_department: string | null;
  controlled_copy: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentVersionSummary {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  changes_summary: string | null;
  created_by_user_id: string;
  created_at: string;
  is_current: boolean;
  file_path?: string | null;
  file_size?: number | null;
}

export interface DocumentReadRecipient {
  id: string;
  campaign_id: string;
  user_id: string;
  user_name: string;
  status: "pending" | "viewed" | "confirmed" | "overdue" | "cancelled";
  sent_at: string;
  viewed_at: string | null;
  confirmed_at: string | null;
  due_at: string | null;
  last_reminder_at: string | null;
  confirmation_note: string | null;
}

export interface DocumentReadCampaign {
  id: string;
  company_id: string;
  document_id: string;
  title: string;
  message: string | null;
  due_at: string | null;
  status: "active" | "completed" | "cancelled";
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  recipients: DocumentReadRecipient[];
}

export interface DocumentRequest {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  request_type: "new_document" | "new_version" | "complement";
  requester_user_id: string;
  requester_name?: string;
  requested_from_user_id: string;
  requested_from_name?: string;
  target_document_id: string | null;
  due_at: string | null;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "fulfilled" | "cancelled" | "overdue";
  fulfilled_document_id: string | null;
  fulfilled_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRelation {
  id: string;
  company_id: string;
  source_document_id: string;
  target_document_id: string;
  relation_type: "references" | "complements" | "replaces" | "depends_on";
  notes: string | null;
  created_by_user_id: string | null;
  created_at: string;
  target_document?: Pick<DocumentRecord, "id" | "title" | "document_domain" | "document_kind" | "status">;
}

export interface DocumentTimelineEntry {
  id: string;
  timestamp: string;
  kind: "version" | "change" | "audit";
  title: string;
  description: string;
  actorId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DocumentRecord {
  id: string;
  company_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  upload_date: string;
  tags: string[];
  related_model: string;
  related_id: string;
  uploader_user_id: string;
  ai_processing_status: string | null;
  ai_confidence_score: number | null;
  ai_extracted_category: string | null;
  summary: string | null;
  document_kind: "general" | "controlled";
  document_domain: string;
  status: "draft" | "active" | "in_review" | "rejected" | "archived";
  branch_ids: string[];
  branches: Array<{ branch_id: string; name: string; code: string | null }>;
  current_version_number: number;
  latest_extraction?: {
    id: string;
    validation_status: string;
    target_table: string;
    created_at: string;
    extracted_fields: Record<string, unknown>;
  } | null;
  control_profile?: DocumentControlProfile | null;
  pending_read_count: number;
  open_request_count: number;
}

export interface DocumentDetail extends DocumentRecord {
  preview_url: string | null;
  versions: DocumentVersionSummary[];
  read_campaigns: DocumentReadCampaign[];
  requests: DocumentRequest[];
  relations_outgoing: DocumentRelation[];
  relations_incoming: DocumentRelation[];
  timeline: DocumentTimelineEntry[];
}

export interface DocumentListFilters {
  search?: string;
  documentKind?: "all" | "general" | "controlled";
  documentDomain?: string;
  status?: string;
  branchId?: string;
  validityState?: "active" | "expired" | "missing";
  reviewState?: "pending" | "ok";
  readState?: "pending";
  requestState?: "open";
}

export interface CreateDocumentPayload {
  file: File;
  title?: string;
  summary?: string;
  tags?: string[];
  documentKind: "general" | "controlled";
  documentDomain: string;
  branchIds?: string[];
  controlProfile?: Omit<DocumentControlProfile, "document_id">;
}

export interface UpdateDocumentMetadataPayload {
  title?: string;
  summary?: string | null;
  tags?: string[];
  documentDomain?: string;
  status?: DocumentRecord["status"];
  branchIds?: string[];
  controlProfile?: Partial<Omit<DocumentControlProfile, "document_id">>;
}

interface CompanyContext {
  userId: string;
  companyId: string;
}

const CONTROLLED_RELATED_MODELS = new Set(["quality_document"]);

const DEFAULT_KIND: DocumentRecord["document_kind"] = "general";
const DEFAULT_STATUS: DocumentRecord["status"] = "draft";

export function mergeDocumentTimelineEntries(
  versions: DocumentVersionSummary[],
  changeLogs: Array<Record<string, any>>,
  auditTrail: Array<Record<string, any>>,
): DocumentTimelineEntry[] {
  const versionEntries = versions.map<DocumentTimelineEntry>((version) => ({
    id: `version-${version.id}`,
    timestamp: version.created_at,
    kind: "version",
    title: `Revisão ${version.version_number}`,
    description: version.changes_summary || "Nova versão registrada.",
    actorId: version.created_by_user_id,
    metadata: {
      versionNumber: version.version_number,
      isCurrent: version.is_current,
    },
  }));

  const changeEntries = changeLogs.map<DocumentTimelineEntry>((entry) => ({
    id: `change-${entry.id}`,
    timestamp: entry.created_at,
    kind: "change",
    title: entry.summary || "Alteração registrada",
    description: typeof entry.change_type === "string" ? entry.change_type : "metadata_update",
    actorId: entry.created_by_user_id,
    metadata: entry.diff || {},
  }));

  const relevantAuditEntries = auditTrail
    .filter((entry) => ["CREATE", "DELETE", "READ_CONFIRMATION", "DISPOSITION_ARCHIVE", "DISPOSITION_DESTROY"].includes(entry.action))
    .map<DocumentTimelineEntry>((entry) => ({
      id: `audit-${entry.id}`,
      timestamp: entry.timestamp,
      kind: "audit",
      title: entry.action,
      description: entry.details || "Evento legado do documento.",
      actorId: entry.user_id,
      metadata: {
        oldValues: entry.old_values,
        newValues: entry.new_values,
      },
    }));

  return [...versionEntries, ...changeEntries, ...relevantAuditEntries].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );
}

export function applyDocumentCenterFilters(
  documents: DocumentRecord[],
  filters: DocumentListFilters,
): DocumentRecord[] {
  const searchTerm = filters.search?.trim().toLowerCase();
  const now = new Date();

  return documents.filter((document) => {
    if (filters.documentKind && filters.documentKind !== "all" && document.document_kind !== filters.documentKind) {
      return false;
    }

    if (filters.documentDomain && filters.documentDomain !== "all" && document.document_domain !== filters.documentDomain) {
      return false;
    }

    if (filters.status && filters.status !== "all" && document.status !== filters.status) {
      return false;
    }

    if (filters.branchId && filters.branchId !== "all" && !document.branch_ids.includes(filters.branchId)) {
      return false;
    }

    if (filters.readState === "pending" && document.pending_read_count === 0) {
      return false;
    }

    if (filters.requestState === "open" && document.open_request_count === 0) {
      return false;
    }

    if (filters.validityState && document.document_kind === "controlled") {
      const endDate = document.control_profile?.validity_end_date ? new Date(document.control_profile.validity_end_date) : null;
      if (filters.validityState === "missing" && endDate) {
        return false;
      }
      if (filters.validityState === "expired" && (!endDate || endDate >= now)) {
        return false;
      }
      if (filters.validityState === "active" && (!endDate || endDate < now)) {
        return false;
      }
    }

    if (filters.reviewState && document.document_kind === "controlled") {
      const reviewDate = document.control_profile?.review_due_date ? new Date(document.control_profile.review_due_date) : null;
      if (filters.reviewState === "pending" && (!reviewDate || reviewDate > now)) {
        return false;
      }
      if (filters.reviewState === "ok" && reviewDate && reviewDate <= now) {
        return false;
      }
    }

    if (!searchTerm) {
      return true;
    }

    const haystack = [
      document.title,
      document.file_name,
      document.document_domain,
      document.summary || "",
      document.control_profile?.code || "",
      document.control_profile?.document_type_label || "",
      ...document.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm);
  });
}

async function getCompanyContext(): Promise<CompanyContext> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile?.company_id) {
    throw new Error("Empresa do usuário não encontrada");
  }

  return {
    userId: data.user.id,
    companyId: profile.company_id,
  };
}

async function getProfilesMap(userIds: string[]): Promise<Record<string, { id: string; full_name: string }>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueUserIds);

  if (error) {
    throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
  }

  return (data || []).reduce<Record<string, { id: string; full_name: string }>>((acc, profile) => {
    acc[profile.id] = profile;
    return acc;
  }, {});
}

function mapDocumentRow(
  row: LegacyDocumentRow,
  branchesMap: Record<string, Array<{ branch_id: string; name: string; code: string | null }>>,
  controlProfiles: Record<string, DocumentControlProfile>,
  versionsMap: Record<string, number>,
  extractionMap: Record<string, DocumentRecord["latest_extraction"]>,
  pendingReadMap: Record<string, number>,
  requestMap: Record<string, number>,
): DocumentRecord {
  const kind =
    (row.document_kind as DocumentRecord["document_kind"] | null) ||
    (row.controlled_copy || row.master_list_included || CONTROLLED_RELATED_MODELS.has(row.related_model) ? "controlled" : DEFAULT_KIND);

  const title = row.title && row.title.trim() ? row.title : row.file_name;
  const controlProfile = controlProfiles[row.id] || null;
  const branches = branchesMap[row.id] || [];

  return {
    id: row.id,
    company_id: row.company_id,
    title,
    file_name: row.file_name,
    file_path: row.file_path,
    file_type: row.file_type,
    file_size: row.file_size ?? null,
    upload_date: row.upload_date,
    tags: row.tags || [],
    related_model: row.related_model,
    related_id: row.related_id,
    uploader_user_id: row.uploader_user_id,
    ai_processing_status: row.ai_processing_status || null,
    ai_confidence_score: row.ai_confidence_score || null,
    ai_extracted_category: row.ai_extracted_category || null,
    summary: row.summary || null,
    document_kind: kind,
    document_domain: row.document_domain || row.related_model || "general",
    status: (row.status as DocumentRecord["status"]) || DEFAULT_STATUS,
    branch_ids: branches.map((branch) => branch.branch_id),
    branches,
    current_version_number: versionsMap[row.id] || 1,
    latest_extraction: extractionMap[row.id] || null,
    control_profile: kind === "controlled" ? controlProfile : null,
    pending_read_count: pendingReadMap[row.id] || 0,
    open_request_count: requestMap[row.id] || 0,
  };
}

async function getControlProfiles(documentIds: string[]): Promise<Record<string, DocumentControlProfile>> {
  if (documentIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("document_control_profiles" as any)
    .select("*")
    .in("document_id", documentIds);

  if (error) {
    throw new Error(`Erro ao carregar perfis controlados: ${error.message}`);
  }

  return ((data || []) as any[]).reduce<Record<string, DocumentControlProfile>>((acc, row: DocumentControlProfile) => {
    acc[row.document_id] = row;
    return acc;
  }, {});
}

async function getCurrentVersionsMap(documentIds: string[]): Promise<Record<string, number>> {
  if (documentIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("document_versions")
    .select("document_id, version_number")
    .in("document_id", documentIds)
    .eq("is_current", true);

  if (error) {
    throw new Error(`Erro ao carregar revisões atuais: ${error.message}`);
  }

  return (data || []).reduce<Record<string, number>>((acc, row) => {
    acc[row.document_id] = row.version_number;
    return acc;
  }, {});
}

async function getLatestExtractions(documentIds: string[]): Promise<Record<string, DocumentRecord["latest_extraction"]>> {
  if (documentIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("document_extraction_jobs")
    .select("id, document_id")
    .in("document_id", documentIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar jobs de extração: ${error.message}`);
  }

  const latestJobIdsByDocument = (data || []).reduce<Record<string, string>>((acc, row) => {
    if (!acc[row.document_id]) {
      acc[row.document_id] = row.id;
    }
    return acc;
  }, {});

  const jobIds = Object.values(latestJobIdsByDocument);
  if (jobIds.length === 0) {
    return {};
  }

  const { data: previews, error: previewsError } = await supabase
    .from("extracted_data_preview")
    .select("id, job_id, validation_status, target_table, created_at, extracted_fields")
    .in("job_id", jobIds);

  if (previewsError) {
    throw new Error(`Erro ao buscar extrações: ${previewsError.message}`);
  }

  return Object.entries(latestJobIdsByDocument).reduce<Record<string, DocumentRecord["latest_extraction"]>>((acc, [documentId, jobId]) => {
    const preview = ((previews || []) as any[]).find((item) => item.job_id === jobId);
    if (preview) {
      acc[documentId] = {
        id: preview.id,
        validation_status: preview.validation_status,
        target_table: preview.target_table,
        created_at: preview.created_at,
        extracted_fields: (preview.extracted_fields as Record<string, unknown>) || {},
      };
    }
    return acc;
  }, {});
}

async function syncDerivedStatuses(documentIds?: string[]): Promise<void> {
  let readRecipientsQuery = supabase
    .from("document_read_recipients" as any)
    .update({ status: "overdue" })
    .lt("due_at", new Date().toISOString())
    .in("status", ["pending", "viewed"]);

  if (documentIds && documentIds.length > 0) {
    const { data: campaigns } = await supabase
      .from("document_read_campaigns" as any)
      .select("id")
      .in("document_id", documentIds);

    const campaignIds = ((campaigns || []) as any[]).map((campaign: { id: string }) => campaign.id);
    if (campaignIds.length > 0) {
      readRecipientsQuery = readRecipientsQuery.in("campaign_id", campaignIds);
    }
  }

  await readRecipientsQuery;

  let requestsQuery = supabase
    .from("document_requests" as any)
    .update({ status: "overdue" })
    .lt("due_at", new Date().toISOString())
    .in("status", ["open", "in_progress"]);

  if (documentIds && documentIds.length > 0) {
    requestsQuery = requestsQuery.in("target_document_id", documentIds);
  }

  await requestsQuery;
}

async function getPendingReadMap(documentIds: string[]): Promise<Record<string, number>> {
  if (documentIds.length === 0) {
    return {};
  }

  await syncDerivedStatuses(documentIds);

  const { data: campaigns, error: campaignError } = await supabase
    .from("document_read_campaigns" as any)
    .select("id, document_id")
    .in("document_id", documentIds)
    .eq("status", "active");

  if (campaignError) {
    throw new Error(`Erro ao buscar campanhas de leitura: ${campaignError.message}`);
  }

  const campaignIds = ((campaigns || []) as any[]).map((campaign: { id: string }) => campaign.id);
  if (campaignIds.length === 0) {
    return {};
  }

  const { data: recipients, error: recipientsError } = await supabase
    .from("document_read_recipients" as any)
    .select("campaign_id, status")
    .in("campaign_id", campaignIds)
    .in("status", ["pending", "viewed", "overdue"]);

  if (recipientsError) {
    throw new Error(`Erro ao buscar destinatários de leitura: ${recipientsError.message}`);
  }

  const documentIdByCampaign = ((campaigns || []) as any[]).reduce<Record<string, string>>((acc, campaign: { id: string; document_id: string }) => {
    acc[campaign.id] = campaign.document_id;
    return acc;
  }, {});

  return ((recipients || []) as any[]).reduce<Record<string, number>>((acc, recipient: { campaign_id: string }) => {
    const documentId = documentIdByCampaign[recipient.campaign_id];
    if (!documentId) {
      return acc;
    }
    acc[documentId] = (acc[documentId] || 0) + 1;
    return acc;
  }, {});
}

async function getOpenRequestMap(documentIds: string[]): Promise<Record<string, number>> {
  if (documentIds.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from("document_requests" as any)
    .select("target_document_id, status")
    .in("target_document_id", documentIds)
    .in("status", ["open", "in_progress", "overdue"]);

  if (error) {
    throw new Error(`Erro ao carregar solicitações: ${error.message}`);
  }

  return ((data || []) as any[]).reduce<Record<string, number>>((acc, row: { target_document_id: string | null }) => {
    if (!row.target_document_id) {
      return acc;
    }
    acc[row.target_document_id] = (acc[row.target_document_id] || 0) + 1;
    return acc;
  }, {});
}

async function createChangeLog(
  companyId: string,
  documentId: string,
  changeType: "metadata_update" | "status_change" | "relation_change" | "read_campaign_change" | "request_fulfilled",
  summary: string,
  diff: Record<string, unknown>,
): Promise<void> {
  const { userId } = await getCompanyContext();

  const { error } = await supabase
    .from("document_change_log" as any)
    .insert({
      company_id: companyId,
      document_id: documentId,
      change_type: changeType,
      summary,
      diff,
      created_by_user_id: userId,
    });

  if (error) {
    throw new Error(`Erro ao registrar histórico documental: ${error.message}`);
  }
}

async function fetchDocumentRelations(documentId: string): Promise<{
  outgoing: DocumentRelation[];
  incoming: DocumentRelation[];
}> {
  const { data, error } = await supabase
    .from("document_relations" as any)
    .select("*")
    .or(`source_document_id.eq.${documentId},target_document_id.eq.${documentId}`);

  if (error) {
    throw new Error(`Erro ao carregar relações documentais: ${error.message}`);
  }

  const relations = ((data || []) as unknown) as DocumentRelation[];
  const relatedIds = Array.from(
    new Set(
      relations.flatMap((relation) => [relation.source_document_id, relation.target_document_id]).filter((id) => id !== documentId),
    ),
  );
  const relatedDocuments = relatedIds.length
    ? await listDocumentRecords({}).then((items) => items.filter((item) => relatedIds.includes(item.id)))
    : [];
  const relatedMap = relatedDocuments.reduce<Record<string, DocumentRecord>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  return {
    outgoing: relations
      .filter((relation) => relation.source_document_id === documentId)
      .map((relation) => ({
        ...relation,
        target_document: relatedMap[relation.target_document_id],
      })),
    incoming: relations
      .filter((relation) => relation.target_document_id === documentId)
      .map((relation) => ({
        ...relation,
        target_document: relatedMap[relation.source_document_id],
      })),
  };
}

async function fetchReadCampaigns(documentId: string): Promise<DocumentReadCampaign[]> {
  await syncDerivedStatuses([documentId]);

  const { data: campaigns, error } = await supabase
    .from("document_read_campaigns" as any)
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar campanhas de leitura: ${error.message}`);
  }

  const campaignIds = ((campaigns || []) as any[]).map((campaign: { id: string }) => campaign.id);
  const { data: recipients, error: recipientsError } = campaignIds.length
    ? await supabase
        .from("document_read_recipients" as any)
        .select("*")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (recipientsError) {
    throw new Error(`Erro ao carregar destinatários das campanhas: ${recipientsError.message}`);
  }

  const userMap = await getProfilesMap(((recipients || []) as any[]).map((item: { user_id: string }) => item.user_id));

  return (campaigns || []).map((campaign: any) => ({
    ...campaign,
    recipients: (recipients || [])
      .filter((recipient: any) => recipient.campaign_id === campaign.id)
      .map((recipient: any) => ({
        ...recipient,
        user_name: userMap[recipient.user_id]?.full_name || "Colaborador",
      })),
  }));
}

async function fetchDocumentRequests(documentId: string): Promise<DocumentRequest[]> {
  await syncDerivedStatuses([documentId]);

  const { data, error } = await supabase
    .from("document_requests" as any)
    .select("*")
    .eq("target_document_id", documentId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar solicitações do documento: ${error.message}`);
  }

  const userMap = await getProfilesMap(
    ((data || []) as any[]).flatMap((row: DocumentRequest) => [row.requester_user_id, row.requested_from_user_id]),
  );

  return (data || []).map((row: DocumentRequest) => ({
    ...row,
    requester_name: userMap[row.requester_user_id]?.full_name || "Solicitante",
    requested_from_name: userMap[row.requested_from_user_id]?.full_name || "Responsável",
  }));
}

export async function listDocumentRecords(filters: DocumentListFilters): Promise<DocumentRecord[]> {
  const { companyId } = await getCompanyContext();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("upload_date", { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar documentos: ${error.message}`);
  }

  const rows = (data || []) as LegacyDocumentRow[];
  const documentIds = rows.map((row) => row.id);

  const [controlProfiles, branchesMap, versionsMap, extractionMap, pendingReadMap, requestMap] = await Promise.all([
    getControlProfiles(documentIds),
    getDocumentsBranchesMap(documentIds),
    getCurrentVersionsMap(documentIds),
    getLatestExtractions(documentIds),
    getPendingReadMap(documentIds),
    getOpenRequestMap(documentIds),
  ]);

  const documents = rows.map((row) =>
    mapDocumentRow(row, branchesMap, controlProfiles, versionsMap, extractionMap, pendingReadMap, requestMap),
  );

  return applyDocumentCenterFilters(documents, filters);
}

export async function getDocumentRecord(documentId: string): Promise<DocumentDetail> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Documento não encontrado.");
  }

  const row = data as LegacyDocumentRow;
  const [controlProfiles, branchesMap, versions, extractionMap, campaigns, requests, relations, auditTrail, changeLog, previewUrl] =
    await Promise.all([
      getControlProfiles([documentId]),
      getDocumentsBranchesMap([documentId]),
      documentVersionsService.getVersions(documentId) as Promise<DocumentVersionSummary[]>,
      getLatestExtractions([documentId]),
      fetchReadCampaigns(documentId),
      fetchDocumentRequests(documentId),
      fetchDocumentRelations(documentId),
      supabase.from("document_audit_trail").select("*").eq("document_id", documentId).order("timestamp", { ascending: false }).then(({ data: trailData, error: trailError }) => {
        if (trailError) {
          throw new Error(`Erro ao carregar trilha de auditoria: ${trailError.message}`);
        }
        return trailData || [];
      }),
      supabase.from("document_change_log" as any).select("*").eq("document_id", documentId).order("created_at", { ascending: false }).then(({ data: changeData, error: changeError }) => {
        if (changeError) {
          throw new Error(`Erro ao carregar timeline documental: ${changeError.message}`);
        }
        return changeData || [];
      }),
      supabase.storage.from("documents").createSignedUrl(row.file_path, 3600).then(({ data: signedData }) => signedData?.signedUrl || null),
    ]);

  const record = mapDocumentRow(
    row,
    branchesMap,
    controlProfiles,
    { [documentId]: versions.find((version) => version.is_current)?.version_number || 1 },
    extractionMap,
    {
      [documentId]: campaigns.reduce((acc, campaign) => {
        return acc + campaign.recipients.filter((recipient) => ["pending", "viewed", "overdue"].includes(recipient.status)).length;
      }, 0),
    },
    {
      [documentId]: requests.filter((request) => ["open", "in_progress", "overdue"].includes(request.status)).length,
    },
  );

  return {
    ...record,
    preview_url: previewUrl,
    versions,
    read_campaigns: campaigns,
    requests,
    relations_outgoing: relations.outgoing,
    relations_incoming: relations.incoming,
    timeline: mergeDocumentTimelineEntries(versions, changeLog, auditTrail),
  };
}

export async function getDocumentDownload(documentId: string) {
  return downloadDocument(documentId);
}

export async function getCompanyUsers() {
  const { companyId } = await getCompanyContext();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", companyId)
    .order("full_name");

  if (error) {
    throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
  }

  return data || [];
}

export async function createDocumentRecord(payload: CreateDocumentPayload): Promise<DocumentDetail> {
  const { companyId } = await getCompanyContext();
  const trimmedTitle = payload.title?.trim();

  if (payload.documentKind === "controlled" && (!payload.branchIds || payload.branchIds.length === 0)) {
    throw new Error("Documentos controlados exigem ao menos uma filial.");
  }

  const created = await uploadDocument(payload.file, {
    tags: payload.tags,
    related_model: payload.documentKind === "controlled" ? "quality_document" : "document",
    // `documents` still carries a legacy uniqueness rule on
    // (related_model, related_id, file_name). The document center should allow
    // repeated filenames inside the same company/domain, so each central record
    // gets its own attachment scope.
    related_id: crypto.randomUUID(),
    skipAutoProcessing: true,
  });

  const documentUpdate: Record<string, unknown> = {
    title: trimmedTitle || payload.file.name,
    summary: payload.summary || null,
    document_kind: payload.documentKind,
    document_domain: payload.documentDomain,
    status: payload.documentKind === "controlled" ? "in_review" : "draft",
  };

  const { error: updateError } = await supabase
    .from("documents")
    .update(documentUpdate as any)
    .eq("id", created.id);

  if (updateError) {
    throw new Error(`Erro ao atualizar metadados do documento: ${updateError.message}`);
  }

  if (payload.branchIds?.length) {
    await linkDocumentToBranches(created.id, payload.branchIds);
  }

  if (payload.documentKind === "controlled" && payload.controlProfile) {
    const { error: profileError } = await supabase
      .from("document_control_profiles" as any)
      .upsert({
        document_id: created.id,
        ...payload.controlProfile,
        code: payload.controlProfile.code?.trim() || null,
        responsible_department: payload.controlProfile.responsible_department || null,
      });

    if (profileError) {
      throw new Error(`Erro ao salvar cabeçalho SGQ: ${profileError.message}`);
    }
  }

  processDocumentWithAI(created.id).catch(() => undefined);

  return getDocumentRecord(created.id);
}

export async function updateDocumentMetadata(documentId: string, payload: UpdateDocumentMetadataPayload): Promise<void> {
  const { data: currentData, error: currentError } = await supabase
    .from("documents")
    .select("company_id")
    .eq("id", documentId)
    .maybeSingle();

  if (currentError || !currentData) {
    throw new Error("Documento não encontrado.");
  }

  const documentUpdate: Record<string, unknown> = {};

  if (payload.title !== undefined) documentUpdate.title = payload.title.trim();
  if (payload.summary !== undefined) documentUpdate.summary = payload.summary;
  if (payload.tags !== undefined) documentUpdate.tags = payload.tags;
  if (payload.documentDomain !== undefined) documentUpdate.document_domain = payload.documentDomain;
  if (payload.status !== undefined) documentUpdate.status = payload.status;

  if (Object.keys(documentUpdate).length > 0) {
    const { error } = await supabase
      .from("documents")
      .update(documentUpdate as any)
      .eq("id", documentId);

    if (error) {
      throw new Error(`Erro ao atualizar documento: ${error.message}`);
    }
  }

  if (payload.controlProfile) {
    const { error } = await supabase
      .from("document_control_profiles" as any)
      .upsert({
        document_id: documentId,
        ...payload.controlProfile,
      });

    if (error) {
      throw new Error(`Erro ao atualizar cabeçalho SGQ: ${error.message}`);
    }
  }

  if (payload.branchIds) {
    await updateDocumentBranches(documentId, payload.branchIds);
  }
}

export async function replaceDocumentFile(documentId: string, file: File): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Usuário não autenticado.");
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileExt = sanitizedName.split(".").pop() || "bin";
  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Erro ao enviar nova versão: ${uploadError.message}`);
  }

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    } as any)
    .eq("id", documentId);

  if (updateError) {
    throw new Error(`Erro ao atualizar arquivo do documento: ${updateError.message}`);
  }

  processDocumentWithAI(documentId).catch(() => undefined);
}

export async function createReadCampaign(input: {
  documentId: string;
  title: string;
  message?: string;
  dueAt?: string | null;
  recipientIds: string[];
}): Promise<void> {
  const { userId, companyId } = await getCompanyContext();

  const { data: campaign, error } = await supabase
    .from("document_read_campaigns" as any)
    .insert({
      company_id: companyId,
      document_id: input.documentId,
      title: input.title.trim(),
      message: input.message || null,
      due_at: input.dueAt || null,
      created_by_user_id: userId,
    })
    .select()
    .maybeSingle();

  if (error || !campaign) {
    throw new Error(`Erro ao criar campanha de leitura: ${error?.message || "Falha desconhecida"}`);
  }

  const { error: recipientsError } = await supabase
    .from("document_read_recipients" as any)
    .insert(
      input.recipientIds.map((recipientId) => ({
        campaign_id: campaign.id,
        user_id: recipientId,
        due_at: input.dueAt || null,
      })),
    );

  if (recipientsError) {
    throw new Error(`Erro ao vincular destinatários: ${recipientsError.message}`);
  }

  await createChangeLog(companyId, input.documentId, "read_campaign_change", "Campanha de leitura criada", {
    title: input.title,
    recipientCount: input.recipientIds.length,
    dueAt: input.dueAt || null,
  });
}

export async function markDocumentViewed(documentId: string): Promise<void> {
  const { userId } = await getCompanyContext();
  const campaigns = await fetchReadCampaigns(documentId);
  const openRecipientIds = campaigns.flatMap((campaign) =>
    campaign.recipients
      .filter((recipient) => recipient.user_id === userId && ["pending", "overdue"].includes(recipient.status))
      .map((recipient) => recipient.id),
  );

  if (openRecipientIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("document_read_recipients" as any)
    .update({
      status: "viewed",
      viewed_at: new Date().toISOString(),
    })
    .in("id", openRecipientIds);

  if (error) {
    throw new Error(`Erro ao registrar visualização: ${error.message}`);
  }
}

export async function confirmReadRecipient(recipientId: string, note?: string): Promise<void> {
  const { userId } = await getCompanyContext();
  const { error } = await supabase
    .from("document_read_recipients" as any)
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmation_note: note || null,
    })
    .eq("id", recipientId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Erro ao confirmar leitura: ${error.message}`);
  }
}

export async function createDocumentRequest(input: {
  documentId?: string | null;
  title: string;
  description?: string;
  requestType: DocumentRequest["request_type"];
  requestedFromUserId: string;
  dueAt?: string | null;
  priority?: DocumentRequest["priority"];
}): Promise<void> {
  const { userId, companyId } = await getCompanyContext();

  const { error } = await supabase
    .from("document_requests" as any)
    .insert({
      company_id: companyId,
      title: input.title.trim(),
      description: input.description || null,
      request_type: input.requestType,
      requester_user_id: userId,
      requested_from_user_id: input.requestedFromUserId,
      target_document_id: input.documentId || null,
      due_at: input.dueAt || null,
      priority: input.priority || "medium",
      status: "open",
    });

  if (error) {
    throw new Error(`Erro ao criar solicitação: ${error.message}`);
  }
}

export async function fulfillDocumentRequest(input: {
  requestId: string;
  fulfilledDocumentId?: string | null;
  fulfilledVersionId?: string | null;
}): Promise<void> {
  const { data: request, error: requestError } = await supabase
    .from("document_requests" as any)
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error("Solicitação não encontrada.");
  }

  const { error } = await supabase
    .from("document_requests" as any)
    .update({
      status: "fulfilled",
      fulfilled_document_id: input.fulfilledDocumentId || null,
      fulfilled_version_id: input.fulfilledVersionId || null,
    })
    .eq("id", input.requestId);

  if (error) {
    throw new Error(`Erro ao concluir solicitação: ${error.message}`);
  }

  if (request.target_document_id) {
    await createChangeLog(request.company_id, request.target_document_id, "request_fulfilled", "Solicitação concluída", {
      requestId: request.id,
      fulfilledDocumentId: input.fulfilledDocumentId || null,
      fulfilledVersionId: input.fulfilledVersionId || null,
    });
  }
}

export async function createDocumentRelation(input: {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationType: DocumentRelation["relation_type"];
  notes?: string;
}): Promise<void> {
  const { userId, companyId } = await getCompanyContext();

  const { error } = await supabase
    .from("document_relations" as any)
    .insert({
      company_id: companyId,
      source_document_id: input.sourceDocumentId,
      target_document_id: input.targetDocumentId,
      relation_type: input.relationType,
      notes: input.notes || null,
      created_by_user_id: userId,
    });

  if (error) {
    if (error.message.includes("duplicate")) {
      throw new Error("Essa relação já existe para o documento.");
    }
    throw new Error(`Erro ao criar relação documental: ${error.message}`);
  }

  await createChangeLog(companyId, input.sourceDocumentId, "relation_change", "Relação documental criada", {
    targetDocumentId: input.targetDocumentId,
    relationType: input.relationType,
  });
}

export async function deleteDocumentRelation(relationId: string): Promise<void> {
  const { data, error } = await supabase
    .from("document_relations" as any)
    .select("*")
    .eq("id", relationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Relação documental não encontrada.");
  }

  const { error: deleteError } = await supabase
    .from("document_relations" as any)
    .delete()
    .eq("id", relationId);

  if (deleteError) {
    throw new Error(`Erro ao remover relação documental: ${deleteError.message}`);
  }

  await createChangeLog(data.company_id, data.source_document_id, "relation_change", "Relação documental removida", {
    targetDocumentId: data.target_document_id,
    relationType: data.relation_type,
  });
}
