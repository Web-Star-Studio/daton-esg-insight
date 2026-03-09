import { supabase } from "@/integrations/supabase/client";
import { uploadDocument, type Document } from "@/services/documents";

// Reuse the same renewal status enum from regulatory
export type RenewalStatus = "nao_iniciado" | "em_andamento" | "protocolado" | "renovado" | "indeferido";

export type DocumentStatus = "Vigente" | "A Vencer" | "Vencido";

export const SGQ_DOCUMENT_IDENTIFIER_OPTIONS = [
  "Manual",
  "Procedimento",
  "Instrução de Trabalho",
  "Formulário",
  "MSG",
  "FPLAN",
  "Política",
  "Plano",
  "Relatório",
  "Certificado",
  "Outro",
] as const;

export type SgqDocumentIdentifierType = (typeof SGQ_DOCUMENT_IDENTIFIER_OPTIONS)[number];

export interface SgqDocumentSettings {
  company_id: string;
  default_expiring_days: number;
  updated_at: string;
}

export interface SgqDocumentVersion {
  id: string;
  file_name: string;
  file_path: string;
  upload_date: string;
  file_size: number | null;
  file_type: string;
  version_label: string;
  is_current: boolean;
}

export interface SgqDocumentItem {
  id: string;
  document_identifier_type: string | null;
  document_identifier_other: string | null;
  document_number: string | null;
  issuing_body: string;
  process_number: string | null;
  branch_id: string | null;
  branch_name: string | null;
  responsible_user_id: string | null;
  responsible_name: string | null;
  issue_date: string | null;
  expiration_date: string;
  days_remaining: number;
  status: DocumentStatus;
  renewal_required: boolean;
  renewal_start_date: string | null;
  renewal_protocol_number: string | null;
  renewal_status: RenewalStatus;
  renewed_expiration_date: string | null;
  versions_count: number;
  latest_update: string;
  notes: string | null;
  renewal_alert_days: number | null;
  external_source_provider: string | null;
  external_source_reference: string | null;
  external_source_url: string | null;
  external_last_sync_at: string | null;
}

export interface SgqDocumentFilters {
  search?: string;
  branch_id?: string;
  document_identifier_type?: string;
  status?: DocumentStatus;
  renewal_status?: RenewalStatus;
}

export interface CreateSgqDocumentPayload {
  document_identifier_type: string;
  document_identifier_other?: string;
  document_number?: string;
  issuing_body: string;
  process_number?: string;
  branch_id: string;
  responsible_user_id: string;
  issue_date?: string;
  expiration_date: string;
  renewal_required?: boolean;
  renewal_alert_days?: number | null;
  notes?: string;
  external_source_provider?: string | null;
  external_source_reference?: string | null;
  external_source_url?: string | null;
  initial_attachment?: File | null;
}

export interface UpdateSgqDocumentPayload {
  document_identifier_type?: string;
  document_identifier_other?: string;
  document_number?: string;
  issuing_body?: string;
  process_number?: string;
  branch_id?: string;
  responsible_user_id?: string;
  issue_date?: string | null;
  expiration_date?: string;
  renewal_required?: boolean;
  renewal_alert_days?: number | null;
  notes?: string | null;
  external_source_provider?: string | null;
  external_source_reference?: string | null;
  external_source_url?: string | null;
}

export interface UpsertSgqRenewalPayload {
  status: RenewalStatus;
  scheduled_start_date?: string | null;
  protocol_deadline?: string | null;
  protocol_number?: string | null;
  renewed_expiration_date?: string | null;
}

const RENEWAL_STATUS_LABELS: Record<RenewalStatus, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  protocolado: "Protocolado",
  renovado: "Renovado",
  indeferido: "Indeferido",
};

export const getSgqRenewalStatusLabel = (status: RenewalStatus): string =>
  RENEWAL_STATUS_LABELS[status] || "Não iniciado";

const ensureDateOnly = (value: string) => value.split("T")[0];

const getCurrentUserAndCompany = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Usuário não autenticado");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.company_id)
    throw new Error("Não foi possível identificar a empresa do usuário");

  return { user, companyId: profile.company_id };
};

const calculateDaysRemaining = (expirationDate: string): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exp = new Date(`${ensureDateOnly(expirationDate)}T00:00:00`);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const resolveDocumentStatus = (daysRemaining: number, threshold: number): DocumentStatus => {
  if (daysRemaining < 0) return "Vencido";
  if (daysRemaining <= threshold) return "A Vencer";
  return "Vigente";
};

// ── Settings ──

export const getSgqSettings = async (): Promise<SgqDocumentSettings> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await (supabase as any)
    .from("sgq_iso_document_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) throw new Error(`Erro ao buscar configurações SGQ: ${error.message}`);
  if (data) return data;

  const { data: inserted, error: insertError } = await (supabase as any)
    .from("sgq_iso_document_settings")
    .insert({ company_id: companyId, default_expiring_days: 30 })
    .select("*")
    .maybeSingle();

  if (insertError || !inserted) throw new Error("Erro ao inicializar configurações SGQ");
  return inserted;
};

export const updateSgqSettings = async (defaultExpiringDays: number): Promise<SgqDocumentSettings> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await (supabase as any)
    .from("sgq_iso_document_settings")
    .upsert({
      company_id: companyId,
      default_expiring_days: Math.max(0, Math.round(defaultExpiringDays)),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (error || !data) throw new Error(`Erro ao atualizar configuração SGQ: ${error?.message || "resposta vazia"}`);
  return data;
};

// ── Responsible users ──

export const getSgqResponsibleUsers = async (): Promise<Array<{ id: string; full_name: string }>> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) throw new Error(`Erro ao carregar responsáveis: ${error.message}`);
  return (data || []).map((p) => ({ id: p.id, full_name: p.full_name || "Sem nome" }));
};

// ── List documents ──

export const getSgqDocuments = async (filters?: SgqDocumentFilters): Promise<SgqDocumentItem[]> => {
  const { companyId } = await getCurrentUserAndCompany();
  const settings = await getSgqSettings();

  let query = (supabase as any)
    .from("sgq_iso_documents")
    .select(`
      id,
      issuing_body,
      process_number,
      document_number,
      document_identifier_type,
      document_identifier_other,
      branch_id,
      responsible_user_id,
      issue_date,
      expiration_date,
      renewal_required,
      renewal_alert_days,
      notes,
      external_source_provider,
      external_source_reference,
      external_source_url,
      external_last_sync_at,
      updated_at,
      branches:branch_id ( name ),
      responsible:responsible_user_id ( full_name )
    `)
    .eq("company_id", companyId)
    .order("expiration_date", { ascending: true });

  if (filters?.branch_id && filters.branch_id !== "all") {
    query = query.eq("branch_id", filters.branch_id);
  }
  if (filters?.document_identifier_type && filters.document_identifier_type !== "all") {
    query = query.eq("document_identifier_type", filters.document_identifier_type);
  }

  const { data: docs, error: docsError } = await query;
  if (docsError) throw new Error(`Erro ao buscar documentos SGQ: ${docsError.message}`);

  const documents = (docs || []) as any[];
  if (documents.length === 0) return [];

  const docIds = documents.map((d: any) => d.id);

  // Renewal schedules
  const { data: schedulesData } = await (supabase as any)
    .from("sgq_renewal_schedules")
    .select("id, sgq_document_id, status, scheduled_start_date, protocol_number, renewed_expiration_date, updated_at, created_at")
    .in("sgq_document_id", docIds)
    .order("created_at", { ascending: false });

  // Attachments (documents table with related_model = 'sgq_iso_document')
  const { data: attachments } = await supabase
    .from("documents")
    .select("id, related_id, upload_date")
    .eq("related_model", "sgq_iso_document")
    .in("related_id", docIds)
    .order("upload_date", { ascending: false });

  const latestSchedule = new Map<string, any>();
  for (const s of schedulesData || []) {
    if (!latestSchedule.has(s.sgq_document_id)) latestSchedule.set(s.sgq_document_id, s);
  }

  const versionsCount = new Map<string, number>();
  const latestUpload = new Map<string, string>();
  for (const a of attachments || []) {
    versionsCount.set(a.related_id, (versionsCount.get(a.related_id) || 0) + 1);
    if (!latestUpload.has(a.related_id)) latestUpload.set(a.related_id, a.upload_date);
  }

  const mapped = documents.map<SgqDocumentItem>((doc: any) => {
    const renewal = latestSchedule.get(doc.id);
    const renewalStatus: RenewalStatus = renewal?.status || "nao_iniciado";
    const threshold = doc.renewal_alert_days ?? settings.default_expiring_days ?? 30;
    const daysRemaining = calculateDaysRemaining(doc.expiration_date);
    const documentStatus = resolveDocumentStatus(daysRemaining, threshold);

    const updateCandidates = [doc.updated_at, renewal?.updated_at, latestUpload.get(doc.id)].filter(Boolean) as string[];
    const latestUpdate = updateCandidates.sort((a, b) => b.localeCompare(a))[0] || doc.updated_at;

    return {
      id: doc.id,
      document_identifier_type: doc.document_identifier_type,
      document_identifier_other: doc.document_identifier_other,
      document_number: doc.document_number,
      issuing_body: doc.issuing_body,
      process_number: doc.process_number,
      branch_id: doc.branch_id,
      branch_name: doc.branches?.name || null,
      responsible_user_id: doc.responsible_user_id,
      responsible_name: doc.responsible?.full_name || null,
      issue_date: doc.issue_date,
      expiration_date: doc.expiration_date,
      days_remaining: daysRemaining,
      status: documentStatus,
      renewal_required: doc.renewal_required ?? true,
      renewal_start_date: renewal?.scheduled_start_date || null,
      renewal_protocol_number: renewal?.protocol_number || null,
      renewal_status: renewalStatus,
      renewed_expiration_date: renewal?.renewed_expiration_date || null,
      versions_count: versionsCount.get(doc.id) || 0,
      latest_update: latestUpdate,
      notes: doc.notes,
      renewal_alert_days: doc.renewal_alert_days,
      external_source_provider: doc.external_source_provider,
      external_source_reference: doc.external_source_reference,
      external_source_url: doc.external_source_url,
      external_last_sync_at: doc.external_last_sync_at,
    };
  });

  const normalizedSearch = filters?.search?.trim().toLowerCase();

  return mapped.filter((item) => {
    if (filters?.status && filters.status !== item.status) return false;
    if (filters?.renewal_status && filters.renewal_status !== item.renewal_status) return false;
    if (!normalizedSearch) return true;

    return [
      item.document_identifier_type, item.document_identifier_other,
      item.document_number, item.issuing_body, item.process_number,
      item.branch_name, item.responsible_name, item.notes,
      item.external_source_provider, item.external_source_reference,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(normalizedSearch));
  });
};

// ── Create ──

export const createSgqDocument = async (payload: CreateSgqDocumentPayload): Promise<{ id: string }> => {
  const { companyId } = await getCurrentUserAndCompany();

  if (!payload.branch_id) throw new Error("Filial é obrigatória");
  if (!payload.responsible_user_id) throw new Error("Responsável é obrigatório");

  const { data, error } = await (supabase as any)
    .from("sgq_iso_documents")
    .insert({
      company_id: companyId,
      document_identifier_type: payload.document_identifier_type,
      document_identifier_other: payload.document_identifier_other || null,
      document_number: payload.document_number || null,
      issuing_body: payload.issuing_body,
      process_number: payload.process_number || null,
      branch_id: payload.branch_id,
      responsible_user_id: payload.responsible_user_id,
      issue_date: payload.issue_date ? ensureDateOnly(payload.issue_date) : null,
      expiration_date: ensureDateOnly(payload.expiration_date),
      renewal_required: payload.renewal_required ?? true,
      renewal_alert_days: payload.renewal_alert_days ?? null,
      notes: payload.notes || null,
      external_source_provider: payload.external_source_provider || null,
      external_source_reference: payload.external_source_reference || null,
      external_source_url: payload.external_source_url || null,
      external_last_sync_at: payload.external_source_provider ? new Date().toISOString() : null,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error(`Erro ao criar documento SGQ: ${error?.message || "desconhecido"}`);

  if (payload.initial_attachment) {
    try {
      await uploadSgqAttachment(data.id, payload.initial_attachment);
    } catch (uploadError: any) {
      await (supabase as any).from("sgq_iso_documents").delete().eq("id", data.id);
      throw new Error(`Erro ao anexar documento inicial: ${uploadError?.message || "desconhecido"}. Cadastro desfeito.`);
    }
  }

  return data;
};

// ── Update ──

export const updateSgqDocument = async (id: string, payload: UpdateSgqDocumentPayload): Promise<void> => {
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (payload.document_identifier_type !== undefined) updatePayload.document_identifier_type = payload.document_identifier_type;
  if (payload.document_identifier_other !== undefined) updatePayload.document_identifier_other = payload.document_identifier_other;
  if (payload.document_number !== undefined) updatePayload.document_number = payload.document_number;
  if (payload.issuing_body !== undefined) updatePayload.issuing_body = payload.issuing_body;
  if (payload.process_number !== undefined) updatePayload.process_number = payload.process_number;
  if (payload.branch_id !== undefined) updatePayload.branch_id = payload.branch_id;
  if (payload.responsible_user_id !== undefined) updatePayload.responsible_user_id = payload.responsible_user_id;
  if (payload.issue_date !== undefined) updatePayload.issue_date = payload.issue_date ? ensureDateOnly(payload.issue_date) : null;
  if (payload.expiration_date !== undefined) updatePayload.expiration_date = ensureDateOnly(payload.expiration_date);
  if (payload.renewal_required !== undefined) updatePayload.renewal_required = payload.renewal_required;
  if (payload.renewal_alert_days !== undefined) updatePayload.renewal_alert_days = payload.renewal_alert_days;
  if (payload.notes !== undefined) updatePayload.notes = payload.notes;
  if (payload.external_source_provider !== undefined) {
    updatePayload.external_source_provider = payload.external_source_provider;
    updatePayload.external_last_sync_at = payload.external_source_provider ? new Date().toISOString() : null;
  }
  if (payload.external_source_reference !== undefined) updatePayload.external_source_reference = payload.external_source_reference;
  if (payload.external_source_url !== undefined) updatePayload.external_source_url = payload.external_source_url;

  const { error } = await (supabase as any).from("sgq_iso_documents").update(updatePayload).eq("id", id);
  if (error) throw new Error(`Erro ao atualizar documento SGQ: ${error.message}`);
};

// ── Renewal ──

export const upsertSgqRenewalData = async (docId: string, payload: UpsertSgqRenewalPayload): Promise<void> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  if (payload.status === "renovado" && !payload.renewed_expiration_date) {
    throw new Error("Nova data de validade é obrigatória quando status da renovação é Renovado");
  }

  const { data: doc, error: docError } = await (supabase as any)
    .from("sgq_iso_documents")
    .select("id, expiration_date")
    .eq("id", docId)
    .maybeSingle();

  if (docError || !doc) throw new Error("Documento SGQ não encontrado");

  const defaultProtocolDeadline = new Date(`${doc.expiration_date}T00:00:00`);
  defaultProtocolDeadline.setDate(defaultProtocolDeadline.getDate() - 45);

  const { data: existing } = await (supabase as any)
    .from("sgq_renewal_schedules")
    .select("id")
    .eq("sgq_document_id", docId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const schedulePayload = {
    sgq_document_id: docId,
    company_id: companyId,
    created_by_user_id: user.id,
    scheduled_start_date: payload.scheduled_start_date ? ensureDateOnly(payload.scheduled_start_date) : new Date().toISOString().split("T")[0],
    protocol_deadline: payload.protocol_deadline ? ensureDateOnly(payload.protocol_deadline) : defaultProtocolDeadline.toISOString().split("T")[0],
    status: payload.status,
    protocol_number: payload.protocol_number || null,
    renewed_expiration_date: payload.renewed_expiration_date ? ensureDateOnly(payload.renewed_expiration_date) : null,
  };

  if (existing?.id) {
    const { error } = await (supabase as any)
      .from("sgq_renewal_schedules")
      .update({
        scheduled_start_date: schedulePayload.scheduled_start_date,
        protocol_deadline: schedulePayload.protocol_deadline,
        status: schedulePayload.status,
        protocol_number: schedulePayload.protocol_number,
        renewed_expiration_date: schedulePayload.renewed_expiration_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw new Error(`Erro ao atualizar renovação SGQ: ${error.message}`);
  } else {
    const { error } = await (supabase as any)
      .from("sgq_renewal_schedules")
      .insert(schedulePayload);
    if (error) throw new Error(`Erro ao registrar renovação SGQ: ${error.message}`);
  }

  // Update expiration date if renewed
  if (payload.status === "renovado" && payload.renewed_expiration_date) {
    await (supabase as any)
      .from("sgq_iso_documents")
      .update({
        expiration_date: ensureDateOnly(payload.renewed_expiration_date),
        updated_at: new Date().toISOString(),
      })
      .eq("id", docId);
  }
};

// ── Attachments ──

export const uploadSgqAttachment = async (docId: string, file: File): Promise<Document> => {
  return uploadDocument(file, {
    related_model: "sgq_iso_document",
    related_id: docId,
    tags: ["sgq-document"],
  });
};

export const getSgqDocumentVersions = async (docId: string): Promise<SgqDocumentVersion[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_path, upload_date, file_size, file_type")
    .eq("related_model", "sgq_iso_document")
    .eq("related_id", docId)
    .order("upload_date", { ascending: false });

  if (error) throw new Error(`Erro ao buscar histórico de versões: ${error.message}`);

  const docs = data || [];
  const total = docs.length;

  return docs.map((doc, index) => ({
    ...doc,
    version_label: `v${Math.max(1, total - index)}`,
    is_current: index === 0,
  }));
};
