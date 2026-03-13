import { supabase } from "@/integrations/supabase/client";
import { uploadDocument, type Document } from "@/services/documents";
import {
  notifyDocumentCreated,
  notifyReadCampaignCreated,
  notifyReviewRequested,
  notifyReviewApproved,
  notifyReviewRejected,
} from "@/services/sgqDocumentNotifications";

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

export type DocumentStatus = "Vigente" | "A Vencer" | "Vencido";

// ── Interfaces ──

export interface SgqDocumentSettings {
  company_id: string;
  default_expiring_days: number;
  updated_at: string;
}

export interface SgqDocumentItem {
  id: string;
  title: string;
  document_identifier_type: string | null;
  document_identifier_other: string | null;
  branch_id: string | null;
  branch_name: string | null;
  elaborated_by_user_id: string | null;
  elaborated_by_name: string | null;
  approved_by_user_id: string | null;
  approved_by_name: string | null;
  expiration_date: string;
  days_remaining: number;
  status: DocumentStatus;
  current_version_number: number;
  pending_recipients: number;
  pending_reviews: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SgqVersionItem {
  id: string;
  version_number: number;
  changes_summary: string | null;
  elaborated_by_name: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  attachment_document_id: string | null;
  attachment_file_name: string | null;
  created_at: string;
}

export interface SgqReadRecipientItem {
  id: string;
  user_id: string;
  user_name: string;
  status: string;
  sent_at: string;
  viewed_at: string | null;
  confirmed_at: string | null;
  confirmation_note: string | null;
}

export interface SgqReadCampaignItem {
  id: string;
  version_number: number | null;
  title: string;
  status: string;
  created_at: string;
  recipients: SgqReadRecipientItem[];
}

export interface SgqReviewRequestItem {
  id: string;
  sgq_document_id: string;
  document_title: string | null;
  requested_by_user_id: string;
  requested_by_name: string | null;
  reviewer_user_id: string;
  reviewer_name: string | null;
  status: string;
  changes_summary: string;
  attachment_document_id: string | null;
  attachment_file_name: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateSgqDocumentPayload {
  title: string;
  document_identifier_type: string;
  document_identifier_other?: string;
  branch_id?: string;
  elaborated_by_user_id: string;
  approved_by_user_id: string;
  expiration_date: string;
  notes?: string;
  initial_attachment: File;
  recipient_user_ids: string[];
  referenced_document_ids?: string[];
}

export interface CreateSgqVersionPayload {
  sgq_document_id: string;
  changes_summary: string;
  elaborated_by_user_id: string;
  approved_by_user_id: string;
  attachment: File;
  recipient_user_ids?: string[];
}

export interface CreateReviewRequestPayload {
  sgq_document_id: string;
  reviewer_user_id: string;
  changes_summary: string;
  attachment: File;
}

// ── Helpers ──

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

// ── Users ──

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

// ── List Documents ──

export const getSgqDocuments = async (filters?: { search?: string; branch_id?: string; document_identifier_type?: string; status?: DocumentStatus }): Promise<SgqDocumentItem[]> => {
  const { companyId } = await getCurrentUserAndCompany();
  const settings = await getSgqSettings();

  let query = (supabase as any)
    .from("sgq_iso_documents")
    .select(`
      id, title, document_identifier_type, document_identifier_other,
      branch_id, elaborated_by_user_id, approved_by_user_id,
      expiration_date, current_version_number, notes,
      created_at, updated_at,
      branches:branch_id ( name ),
      elaborator:elaborated_by_user_id ( full_name ),
      approver:approved_by_user_id ( full_name )
    `)
    .eq("company_id", companyId)
    .order("expiration_date", { ascending: true });

  if (filters?.branch_id) query = query.eq("branch_id", filters.branch_id);
  if (filters?.document_identifier_type) query = query.eq("document_identifier_type", filters.document_identifier_type);

  const { data: docs, error } = await query;
  if (error) throw new Error(`Erro ao buscar documentos SGQ: ${error.message}`);

  const documents = (docs || []) as any[];
  if (documents.length === 0) return [];

  const docIds = documents.map((d: any) => d.id);

  // Count pending recipients per document
  const { data: campaignsData } = await (supabase as any)
    .from("sgq_read_campaigns")
    .select("id, sgq_document_id")
    .in("sgq_document_id", docIds)
    .eq("status", "active");

  const campaignIds = (campaignsData || []).map((c: any) => c.id);
  let pendingByDoc = new Map<string, number>();

  if (campaignIds.length > 0) {
    const { data: recipientsData } = await (supabase as any)
      .from("sgq_read_recipients")
      .select("campaign_id, status")
      .in("campaign_id", campaignIds)
      .eq("status", "pending");

    const campaignToDoc = new Map<string, string>();
    for (const c of campaignsData || []) campaignToDoc.set(c.id, c.sgq_document_id);

    for (const r of recipientsData || []) {
      const docId = campaignToDoc.get(r.campaign_id);
      if (docId) pendingByDoc.set(docId, (pendingByDoc.get(docId) || 0) + 1);
    }
  }

  // Count pending reviews per document
  const { data: reviewsData } = await (supabase as any)
    .from("sgq_review_requests")
    .select("sgq_document_id")
    .in("sgq_document_id", docIds)
    .eq("status", "pending");

  const pendingReviewsByDoc = new Map<string, number>();
  for (const r of reviewsData || []) {
    pendingReviewsByDoc.set(r.sgq_document_id, (pendingReviewsByDoc.get(r.sgq_document_id) || 0) + 1);
  }

  const threshold = settings.default_expiring_days ?? 30;

  const mapped = documents.map<SgqDocumentItem>((doc: any) => {
    const daysRemaining = calculateDaysRemaining(doc.expiration_date);
    return {
      id: doc.id,
      title: doc.title || "",
      document_identifier_type: doc.document_identifier_type,
      document_identifier_other: doc.document_identifier_other,
      branch_id: doc.branch_id,
      branch_name: doc.branches?.name || null,
      elaborated_by_user_id: doc.elaborated_by_user_id,
      elaborated_by_name: doc.elaborator?.full_name || null,
      approved_by_user_id: doc.approved_by_user_id,
      approved_by_name: doc.approver?.full_name || null,
      expiration_date: doc.expiration_date,
      days_remaining: daysRemaining,
      status: resolveDocumentStatus(daysRemaining, threshold),
      current_version_number: doc.current_version_number || 1,
      pending_recipients: pendingByDoc.get(doc.id) || 0,
      pending_reviews: pendingReviewsByDoc.get(doc.id) || 0,
      notes: doc.notes,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  });

  const normalizedSearch = filters?.search?.trim().toLowerCase();

  return mapped.filter((item) => {
    if (filters?.status && filters.status !== item.status) return false;
    if (!normalizedSearch) return true;
    return [item.title, item.document_identifier_type, item.document_identifier_other, item.branch_name, item.elaborated_by_name, item.approved_by_name, item.notes]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(normalizedSearch));
  });
};

// ── Create Document ──

export const createSgqDocument = async (payload: CreateSgqDocumentPayload): Promise<{ id: string }> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  if (!payload.title.trim()) throw new Error("Título é obrigatório");
  if (!payload.initial_attachment) throw new Error("Anexo inicial é obrigatório");
  if (payload.recipient_user_ids.length === 0) throw new Error("Pelo menos um destinatário é obrigatório");

  // 1. Create main document
  const { data: doc, error: docError } = await (supabase as any)
    .from("sgq_iso_documents")
    .insert({
      company_id: companyId,
      title: payload.title.trim(),
      document_identifier_type: payload.document_identifier_type,
      document_identifier_other: payload.document_identifier_type === "Outro" ? payload.document_identifier_other : null,
      branch_id: payload.branch_id || null,
      elaborated_by_user_id: payload.elaborated_by_user_id,
      approved_by_user_id: payload.approved_by_user_id,
      approved_at: new Date().toISOString(),
      expiration_date: ensureDateOnly(payload.expiration_date),
      current_version_number: 1,
      notes: payload.notes || null,
      issuing_body: "",
    })
    .select("id")
    .maybeSingle();

  if (docError || !doc) throw new Error(`Erro ao criar documento SGQ: ${docError?.message || "desconhecido"}`);

  try {
    // 2. Upload attachment
    const attachment = await uploadDocument(payload.initial_attachment, {
      related_model: "sgq_iso_document",
      related_id: doc.id,
      tags: ["sgq-document"],
    });

    // 3. Create version 1
    await (supabase as any)
      .from("sgq_document_versions")
      .insert({
        sgq_document_id: doc.id,
        company_id: companyId,
        version_number: 1,
        changes_summary: "Versão inicial",
        elaborated_by_user_id: payload.elaborated_by_user_id,
        approved_by_user_id: payload.approved_by_user_id,
        approved_at: new Date().toISOString(),
        attachment_document_id: attachment.id,
      });

    // 4. Create read campaign
    const { data: campaign } = await (supabase as any)
      .from("sgq_read_campaigns")
      .insert({
        sgq_document_id: doc.id,
        company_id: companyId,
        version_number: 1,
        title: `Recebimento: ${payload.title.trim()} - v1`,
        created_by_user_id: user.id,
        status: "active",
      })
      .select("id")
      .maybeSingle();

    if (campaign) {
      const recipients = payload.recipient_user_ids.map((uid) => ({
        campaign_id: campaign.id,
        user_id: uid,
        status: "pending",
      }));
      await (supabase as any).from("sgq_read_recipients").insert(recipients);
    }

    // 5. Create references
    if (payload.referenced_document_ids && payload.referenced_document_ids.length > 0) {
      const refs = payload.referenced_document_ids.map((refId) => ({
        sgq_document_id: doc.id,
        referenced_document_id: refId,
        company_id: companyId,
      }));
      await (supabase as any).from("sgq_document_references").insert(refs);
    }
  } catch (err: any) {
    await (supabase as any).from("sgq_iso_documents").delete().eq("id", doc.id);
    throw new Error(`Erro ao finalizar criação do documento: ${err?.message || "desconhecido"}. Cadastro desfeito.`);
  }

  // Fire notifications (non-blocking)
  if (payload.approved_by_user_id) {
    notifyDocumentCreated(payload.approved_by_user_id, payload.title.trim(), doc.id).catch(() => {});
  }
  if (payload.recipient_user_ids?.length > 0) {
    notifyReadCampaignCreated(payload.recipient_user_ids, payload.title.trim(), doc.id, 1).catch(() => {});
  }

  return doc;
};

// ── Create New Version (called internally by approve) ──

export const createSgqDocumentVersion = async (payload: CreateSgqVersionPayload): Promise<void> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  const { data: doc } = await (supabase as any)
    .from("sgq_iso_documents")
    .select("current_version_number, title")
    .eq("id", payload.sgq_document_id)
    .maybeSingle();

  if (!doc) throw new Error("Documento não encontrado");

  const newVersion = (doc.current_version_number || 1) + 1;

  const attachment = await uploadDocument(payload.attachment, {
    related_model: "sgq_iso_document",
    related_id: payload.sgq_document_id,
    tags: ["sgq-document"],
  });

  await (supabase as any)
    .from("sgq_document_versions")
    .insert({
      sgq_document_id: payload.sgq_document_id,
      company_id: companyId,
      version_number: newVersion,
      changes_summary: payload.changes_summary,
      elaborated_by_user_id: payload.elaborated_by_user_id,
      approved_by_user_id: payload.approved_by_user_id,
      approved_at: new Date().toISOString(),
      attachment_document_id: attachment.id,
    });

  await (supabase as any)
    .from("sgq_iso_documents")
    .update({
      current_version_number: newVersion,
      elaborated_by_user_id: payload.elaborated_by_user_id,
      approved_by_user_id: payload.approved_by_user_id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.sgq_document_id);

  if (payload.recipient_user_ids && payload.recipient_user_ids.length > 0) {
    const { data: campaign } = await (supabase as any)
      .from("sgq_read_campaigns")
      .insert({
        sgq_document_id: payload.sgq_document_id,
        company_id: companyId,
        version_number: newVersion,
        title: `Recebimento: ${doc.title} - v${newVersion}`,
        created_by_user_id: user.id,
        status: "active",
      })
      .select("id")
      .maybeSingle();

    if (campaign) {
      const recipients = payload.recipient_user_ids.map((uid) => ({
        campaign_id: campaign.id,
        user_id: uid,
        status: "pending",
      }));
      await (supabase as any).from("sgq_read_recipients").insert(recipients);
    }
  }
};

// ── Review Requests ──

export const createReviewRequest = async (payload: CreateReviewRequestPayload): Promise<void> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  // Upload attachment
  const attachment = await uploadDocument(payload.attachment, {
    related_model: "sgq_iso_document",
    related_id: payload.sgq_document_id,
    tags: ["sgq-review"],
  });

  const { error } = await (supabase as any)
    .from("sgq_review_requests")
    .insert({
      sgq_document_id: payload.sgq_document_id,
      company_id: companyId,
      requested_by_user_id: user.id,
      reviewer_user_id: payload.reviewer_user_id,
      status: "pending",
      changes_summary: payload.changes_summary,
      attachment_document_id: attachment.id,
    });

  if (error) throw new Error(`Erro ao enviar para revisão: ${error.message}`);

  // Get doc title for notification
  const { data: docData } = await (supabase as any)
    .from("sgq_iso_documents")
    .select("title")
    .eq("id", payload.sgq_document_id)
    .maybeSingle();

  notifyReviewRequested(
    payload.reviewer_user_id,
    docData?.title || "Documento SGQ",
    payload.sgq_document_id
  ).catch(() => {});
};

export const getPendingReviewRequests = async (docId?: string): Promise<SgqReviewRequestItem[]> => {
  let query = (supabase as any)
    .from("sgq_review_requests")
    .select(`
      id, sgq_document_id, requested_by_user_id, reviewer_user_id,
      status, changes_summary, attachment_document_id,
      reviewer_notes, reviewed_at, created_at,
      requester:requested_by_user_id ( full_name ),
      reviewer:reviewer_user_id ( full_name ),
      document:sgq_document_id ( title ),
      attachment:attachment_document_id ( file_name )
    `)
    .order("created_at", { ascending: false });

  if (docId) {
    query = query.eq("sgq_document_id", docId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Erro ao buscar revisões: ${error.message}`);

  return (data || []).map((r: any) => ({
    id: r.id,
    sgq_document_id: r.sgq_document_id,
    document_title: r.document?.title || null,
    requested_by_user_id: r.requested_by_user_id,
    requested_by_name: r.requester?.full_name || null,
    reviewer_user_id: r.reviewer_user_id,
    reviewer_name: r.reviewer?.full_name || null,
    status: r.status,
    changes_summary: r.changes_summary,
    attachment_document_id: r.attachment_document_id,
    attachment_file_name: r.attachment?.file_name || null,
    reviewer_notes: r.reviewer_notes,
    reviewed_at: r.reviewed_at,
    created_at: r.created_at,
  }));
};

export const approveReviewRequest = async (requestId: string, reviewerNotes?: string): Promise<void> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  // Get the review request
  const { data: request, error: fetchErr } = await (supabase as any)
    .from("sgq_review_requests")
    .select("*, document:sgq_document_id ( current_version_number, title )")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchErr || !request) throw new Error("Solicitação de revisão não encontrada");
  if (request.status !== "pending") throw new Error("Esta solicitação já foi processada");
  if (request.reviewer_user_id !== user.id) throw new Error("Apenas o revisor designado pode aprovar");

  // 1. Mark as approved
  const { error: updateErr } = await (supabase as any)
    .from("sgq_review_requests")
    .update({
      status: "approved",
      reviewer_notes: reviewerNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateErr) throw new Error(`Erro ao aprovar: ${updateErr.message}`);

  // 2. Create new version automatically
  const doc = request.document;
  const newVersion = (doc?.current_version_number || 1) + 1;

  await (supabase as any)
    .from("sgq_document_versions")
    .insert({
      sgq_document_id: request.sgq_document_id,
      company_id: companyId,
      version_number: newVersion,
      changes_summary: request.changes_summary,
      elaborated_by_user_id: request.requested_by_user_id,
      approved_by_user_id: user.id,
      approved_at: new Date().toISOString(),
      attachment_document_id: request.attachment_document_id,
    });

  // 3. Update main document
  await (supabase as any)
    .from("sgq_iso_documents")
    .update({
      current_version_number: newVersion,
      elaborated_by_user_id: request.requested_by_user_id,
      approved_by_user_id: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.sgq_document_id);

  // 4. Create read campaign for existing active campaign recipients
  let campaignRecipientIds: string[] = [];

  const { data: existingCampaigns } = await (supabase as any)
    .from("sgq_read_campaigns")
    .select("id")
    .eq("sgq_document_id", request.sgq_document_id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingCampaigns && existingCampaigns.length > 0) {
    const { data: existingRecipients } = await (supabase as any)
      .from("sgq_read_recipients")
      .select("user_id")
      .eq("campaign_id", existingCampaigns[0].id);

    campaignRecipientIds = (existingRecipients || []).map((r: any) => r.user_id);

    if (campaignRecipientIds.length > 0) {
      const { data: campaign } = await (supabase as any)
        .from("sgq_read_campaigns")
        .insert({
          sgq_document_id: request.sgq_document_id,
          company_id: companyId,
          version_number: newVersion,
          title: `Recebimento: ${doc?.title || "Documento"} - v${newVersion}`,
          created_by_user_id: user.id,
          status: "active",
        })
        .select("id")
        .maybeSingle();

      if (campaign) {
        const recipients = campaignRecipientIds.map((uid: string) => ({
          campaign_id: campaign.id,
          user_id: uid,
          status: "pending",
        }));
        await (supabase as any).from("sgq_read_recipients").insert(recipients);
      }
    }
  }

  // Notify requester of approval and recipients of read campaign
  const docTitle = request.document?.title || "Documento SGQ";
  notifyReviewApproved(request.requested_by_user_id, docTitle, request.sgq_document_id, newVersion).catch(() => {});
  if (campaignRecipientIds.length > 0) {
    notifyReadCampaignCreated(campaignRecipientIds, docTitle, request.sgq_document_id, newVersion).catch(() => {});
  }
};

export const rejectReviewRequest = async (requestId: string, reviewerNotes: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Get request details for notification
  const { data: request } = await (supabase as any)
    .from("sgq_review_requests")
    .select("requested_by_user_id, sgq_document_id, document:sgq_document_id ( title )")
    .eq("id", requestId)
    .maybeSingle();

  const { error } = await (supabase as any)
    .from("sgq_review_requests")
    .update({
      status: "rejected",
      reviewer_notes: reviewerNotes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) throw new Error(`Erro ao rejeitar: ${error.message}`);

  // Notify requester
  if (request?.requested_by_user_id) {
    notifyReviewRejected(
      request.requested_by_user_id,
      request.document?.title || "Documento SGQ",
      request.sgq_document_id,
      reviewerNotes
    ).catch(() => {});
  }
};

// ── Versions ──

export const getSgqDocumentVersions = async (docId: string): Promise<SgqVersionItem[]> => {
  const { data, error } = await (supabase as any)
    .from("sgq_document_versions")
    .select(`
      id, version_number, changes_summary,
      approved_at, attachment_document_id, created_at,
      elaborator:elaborated_by_user_id ( full_name ),
      approver:approved_by_user_id ( full_name ),
      attachment:attachment_document_id ( file_name )
    `)
    .eq("sgq_document_id", docId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(`Erro ao buscar versões: ${error.message}`);

  return (data || []).map((v: any) => ({
    id: v.id,
    version_number: v.version_number,
    changes_summary: v.changes_summary,
    elaborated_by_name: v.elaborator?.full_name || null,
    approved_by_name: v.approver?.full_name || null,
    approved_at: v.approved_at,
    attachment_document_id: v.attachment_document_id,
    attachment_file_name: v.attachment?.file_name || null,
    created_at: v.created_at,
  }));
};

// ── Read Campaigns ──

export const getSgqReadCampaigns = async (docId: string): Promise<SgqReadCampaignItem[]> => {
  const { data: campaigns, error } = await (supabase as any)
    .from("sgq_read_campaigns")
    .select("id, version_number, title, status, created_at")
    .eq("sgq_document_id", docId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar campanhas: ${error.message}`);
  if (!campaigns || campaigns.length === 0) return [];

  const campaignIds = campaigns.map((c: any) => c.id);

  const { data: recipientsData } = await (supabase as any)
    .from("sgq_read_recipients")
    .select(`
      id, campaign_id, user_id, status, sent_at, viewed_at, confirmed_at, confirmation_note,
      user:user_id ( full_name )
    `)
    .in("campaign_id", campaignIds)
    .order("sent_at", { ascending: true });

  const recipientsByCampaign = new Map<string, SgqReadRecipientItem[]>();
  for (const r of recipientsData || []) {
    const list = recipientsByCampaign.get(r.campaign_id) || [];
    list.push({
      id: r.id,
      user_id: r.user_id,
      user_name: r.user?.full_name || "Sem nome",
      status: r.status,
      sent_at: r.sent_at,
      viewed_at: r.viewed_at,
      confirmed_at: r.confirmed_at,
      confirmation_note: r.confirmation_note,
    });
    recipientsByCampaign.set(r.campaign_id, list);
  }

  return campaigns.map((c: any) => ({
    id: c.id,
    version_number: c.version_number,
    title: c.title,
    status: c.status,
    created_at: c.created_at,
    recipients: recipientsByCampaign.get(c.id) || [],
  }));
};

export const confirmSgqRead = async (recipientId: string, note?: string): Promise<void> => {
  const { error } = await (supabase as any)
    .from("sgq_read_recipients")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmation_note: note || null,
    })
    .eq("id", recipientId);

  if (error) throw new Error(`Erro ao confirmar leitura: ${error.message}`);
};

// ── References ──

export const getSgqDocumentReferences = async (docId: string): Promise<Array<{ id: string; referenced_document_id: string; file_name: string; notes: string | null }>> => {
  const { data, error } = await (supabase as any)
    .from("sgq_document_references")
    .select(`
      id, referenced_document_id, notes,
      document:referenced_document_id ( file_name )
    `)
    .eq("sgq_document_id", docId);

  if (error) throw new Error(`Erro ao buscar referências: ${error.message}`);

  return (data || []).map((r: any) => ({
    id: r.id,
    referenced_document_id: r.referenced_document_id,
    file_name: r.document?.file_name || "Documento",
    notes: r.notes,
  }));
};

// ── System Documents (for references picker) ──

export const getSystemDocumentsForReference = async (): Promise<Array<{ id: string; file_name: string }>> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name")
    .eq("company_id", companyId)
    .order("file_name", { ascending: true })
    .limit(500);

  if (error) throw new Error(`Erro ao buscar documentos: ${error.message}`);
  return data || [];
};

// ── Get current user id ──
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};
