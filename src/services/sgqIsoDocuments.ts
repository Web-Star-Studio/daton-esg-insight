import { supabase } from "@/integrations/supabase/client";
import { uploadDocument, type Document } from "@/services/documents";
import {
  notifyApprovalRequired,
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

export type DocumentStatus = "Vigente" | "A Vencer" | "Vencido" | "Em Aprovação";

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
  branch_ids: string[];
  branch_names: string[];
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
  norm_reference: string | null;
  notes: string | null;
  responsible_department: string | null;
  is_approved: boolean;
  created_by_user_id: string | null;
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
  branch_ids?: string[];
  elaborated_by_user_id: string;
  approved_by_user_id: string;
  expiration_date: string;
  norm_reference?: string | null;
  notes?: string;
  responsible_department?: string | null;
  initial_attachment: File;
  recipient_user_ids: string[];
  referenced_document_ids?: string[];
}

export interface UpdateSgqDocumentPayload {
  title: string;
  document_identifier_type: string;
  document_identifier_other?: string;
  branch_ids?: string[];
  elaborated_by_user_id: string;
  approved_by_user_id: string;
  expiration_date: string;
  norm_reference?: string | null;
  notes?: string;
  responsible_department?: string | null;
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

const resolveDocumentStatus = (daysRemaining: number, threshold: number, isApproved: boolean): DocumentStatus => {
  if (!isApproved) return "Em Aprovação";
  if (daysRemaining < 0) return "Vencido";
  if (daysRemaining <= threshold) return "A Vencer";
  return "Vigente";
};

const getSgqDocumentBranchesMap = async (
  documentIds: string[],
): Promise<Record<string, Array<{ branch_id: string; name: string | null }>>> => {
  if (documentIds.length === 0) return {};

  const { data, error } = await (supabase as any)
    .from("sgq_document_branches")
    .select("sgq_document_id, branch_id, branches:branch_id(name)")
    .in("sgq_document_id", documentIds);

  if (error) throw new Error(`Erro ao buscar filiais SGQ: ${error.message}`);

  return (data || []).reduce((acc: Record<string, Array<{ branch_id: string; name: string | null }>>, row: any) => {
    if (!acc[row.sgq_document_id]) acc[row.sgq_document_id] = [];
    acc[row.sgq_document_id].push({
      branch_id: row.branch_id,
      name: row.branches?.name || null,
    });
    return acc;
  }, {});
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

export const getSgqElaboratedByUsers = async (): Promise<Array<{ id: string; full_name: string }>> => {
  const { companyId } = await getCurrentUserAndCompany();

  const PAGE = 1000;
  const [p1, p2, p3] = await Promise.all([
    supabase.from("employees").select("id, full_name").eq("company_id", companyId).order("full_name").range(0, PAGE - 1),
    supabase.from("employees").select("id, full_name").eq("company_id", companyId).order("full_name").range(PAGE, PAGE * 2 - 1),
    supabase.from("employees").select("id, full_name").eq("company_id", companyId).order("full_name").range(PAGE * 2, PAGE * 3 - 1),
  ]);

  return [...(p1.data || []), ...(p2.data || []), ...(p3.data || [])]
    .filter((u) => u.full_name) as Array<{ id: string; full_name: string }>;
};

export const getSgqResponsibleUsers = async (): Promise<Array<{ id: string; full_name: string }>> => {
  const { companyId } = await getCurrentUserAndCompany();

  const PAGE = 1000;
  const [p1, p2] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("company_id", companyId).order("full_name").range(0, PAGE - 1),
    supabase.from("profiles").select("id, full_name").eq("company_id", companyId).order("full_name").range(PAGE, PAGE * 2 - 1),
  ]);

  return [...(p1.data || []), ...(p2.data || [])]
    .filter((u) => u.full_name) as Array<{ id: string; full_name: string }>;
};

// ── List Documents ──

export const getSgqDocuments = async (filters?: { search?: string; branch_id?: string; document_identifier_type?: string; status?: DocumentStatus }): Promise<SgqDocumentItem[]> => {
  const { user, companyId } = await getCurrentUserAndCompany();
  const settings = await getSgqSettings();

  let query = (supabase as any)
    .from("sgq_iso_documents")
    .select(`
      id, title, document_identifier_type, document_identifier_other,
      branch_id, elaborated_by_user_id, approved_by_user_id, created_by_user_id,
      expiration_date, current_version_number, notes, norm_reference, responsible_department,
      is_approved, created_at, updated_at,
      branches:branch_id ( name )
    `)
    .eq("company_id", companyId)
    .order("expiration_date", { ascending: true });

  if (filters?.document_identifier_type) query = query.eq("document_identifier_type", filters.document_identifier_type);

  const { data: docs, error } = await query;
  if (error) throw new Error(`Erro ao buscar documentos SGQ: ${error.message}`);

  const documents = (docs || []) as any[];
  if (documents.length === 0) return [];

  const docIds = documents.map((d: any) => d.id);
  const branchesMap = await getSgqDocumentBranchesMap(docIds);

  // Fetch employee names for elaborated_by and approved_by
  const userIds = [
    ...new Set([
      ...documents.map((d: any) => d.elaborated_by_user_id),
      ...documents.map((d: any) => d.approved_by_user_id),
    ].filter(Boolean) as string[]),
  ];
  const employeeNameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const [{ data: empData }, { data: profileData }] = await Promise.all([
      supabase.from("employees").select("id, full_name").in("id", userIds),
      supabase.from("profiles").select("id, full_name").in("id", userIds),
    ]);
    for (const emp of empData || []) {
      employeeNameMap.set(emp.id, emp.full_name || "Sem nome");
    }
    for (const p of profileData || []) {
      if (!employeeNameMap.has(p.id)) employeeNameMap.set(p.id, p.full_name || "Sem nome");
    }
  }

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
    const linkedBranches = branchesMap[doc.id] || [];
    const branchIds = linkedBranches.map((branch) => branch.branch_id);
    const branchNames = linkedBranches.map((branch) => branch.name).filter(Boolean);

    return {
      id: doc.id,
      title: doc.title || "",
      document_identifier_type: doc.document_identifier_type,
      document_identifier_other: doc.document_identifier_other,
      branch_id: doc.branch_id || branchIds[0] || null,
      branch_name: doc.branches?.name || branchNames[0] || null,
      branch_ids: branchIds,
      branch_names: branchNames,
      elaborated_by_user_id: doc.elaborated_by_user_id,
      elaborated_by_name: doc.elaborated_by_user_id ? (employeeNameMap.get(doc.elaborated_by_user_id) || null) : null,
      approved_by_user_id: doc.approved_by_user_id,
      approved_by_name: doc.approved_by_user_id ? (employeeNameMap.get(doc.approved_by_user_id) || null) : null,
      expiration_date: doc.expiration_date,
      days_remaining: daysRemaining,
      status: resolveDocumentStatus(daysRemaining, threshold, !!doc.is_approved),
      current_version_number: doc.current_version_number || 1,
      pending_recipients: pendingByDoc.get(doc.id) || 0,
      pending_reviews: pendingReviewsByDoc.get(doc.id) || 0,
      norm_reference: doc.norm_reference || null,
      notes: doc.notes,
      responsible_department: doc.responsible_department || null,
      is_approved: !!doc.is_approved,
      created_by_user_id: doc.created_by_user_id || null,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    };
  });

  const normalizedSearch = filters?.search?.trim().toLowerCase();

  return mapped.filter((item) => {
    if (!item.is_approved && item.created_by_user_id !== null) {
      if (item.created_by_user_id !== user.id && item.approved_by_user_id !== user.id) return false;
    }
    if (filters?.status && filters.status !== item.status) return false;
    if (filters?.branch_id && !item.branch_ids.includes(filters.branch_id)) return false;
    if (!normalizedSearch) return true;
    return [
      item.title,
      item.document_identifier_type,
      item.document_identifier_other,
      item.branch_name,
      ...item.branch_names,
      item.elaborated_by_name,
      item.approved_by_name,
      item.norm_reference,
      item.responsible_department,
      item.notes,
    ]
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
      branch_id: payload.branch_ids?.[0] || null,
      elaborated_by_user_id: payload.elaborated_by_user_id,
      approved_by_user_id: payload.approved_by_user_id,
      created_by_user_id: user.id,
      is_approved: false,
      expiration_date: ensureDateOnly(payload.expiration_date),
      current_version_number: 1,
      norm_reference: payload.norm_reference || null,
      notes: payload.notes || null,
      issuing_body: "",
      responsible_department: payload.responsible_department || null,
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

    if (payload.branch_ids && payload.branch_ids.length > 0) {
      await (supabase as any).from("sgq_document_branches").insert(
        payload.branch_ids.map((branchId) => ({
          sgq_document_id: doc.id,
          branch_id: branchId,
        })),
      );
    }

    // 3. Create version 1
    const { error: versionError } = await (supabase as any)
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
    if (versionError) throw new Error(`Erro ao criar versão inicial: ${versionError.message}`);

    // 4. Create read campaign (inactive until approver explicitly approves)
    const { data: campaign } = await (supabase as any)
      .from("sgq_read_campaigns")
      .insert({
        sgq_document_id: doc.id,
        company_id: companyId,
        version_number: 1,
        title: `Recebimento: ${payload.title.trim()} - v1`,
        created_by_user_id: user.id,
        status: "inactive",
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

  // Notify approver that the document needs their approval (non-blocking)
  if (payload.approved_by_user_id) {
    notifyApprovalRequired(payload.approved_by_user_id, payload.title.trim(), doc.id).catch((err) => {
      console.error("[SGQ] Failed to notify approver:", err);
    });
  }
  // Recipients are NOT notified yet — only after approver approves

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
      notifyReadCampaignCreated(payload.recipient_user_ids, doc.title, payload.sgq_document_id, newVersion).catch(() => {});
    }
  }
};

// ── Initial Approval ──

export const approveInitialDocument = async (docId: string): Promise<void> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  const { data: doc, error: fetchErr } = await (supabase as any)
    .from("sgq_iso_documents")
    .select("id, title, approved_by_user_id, is_approved")
    .eq("id", docId)
    .maybeSingle();

  if (fetchErr || !doc) throw new Error("Documento não encontrado");
  if (doc.is_approved) throw new Error("Este documento já foi aprovado");
  if (doc.approved_by_user_id !== user.id) throw new Error("Apenas o aprovador designado pode aprovar este documento");

  // 1. Mark document as approved
  const { error: updateErr } = await (supabase as any)
    .from("sgq_iso_documents")
    .update({ is_approved: true, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", docId);

  if (updateErr) throw new Error(`Erro ao aprovar documento: ${updateErr.message}`);

  // 2. Activate the pending read campaign
  const { data: campaigns } = await (supabase as any)
    .from("sgq_read_campaigns")
    .update({ status: "active" })
    .eq("sgq_document_id", docId)
    .eq("status", "inactive")
    .select("id");

  // 3. Notify recipients
  if (campaigns && campaigns.length > 0) {
    const campaignIds = campaigns.map((c: any) => c.id);
    const { data: recipientsData } = await (supabase as any)
      .from("sgq_read_recipients")
      .select("user_id")
      .in("campaign_id", campaignIds);

    const recipientIds = (recipientsData || []).map((r: any) => r.user_id);
    if (recipientIds.length > 0) {
      notifyReadCampaignCreated(recipientIds, doc.title, docId, 1).catch(() => {});
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
      elaborated_by_user_id, approved_by_user_id,
      approved_at, attachment_document_id, created_at,
      attachment:attachment_document_id ( file_name )
    `)
    .eq("sgq_document_id", docId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(`Erro ao buscar versões: ${error.message}`);

  const versions = data || [];

  // Collect user IDs to look up names from both employees and profiles
  const userIds = [...new Set(versions.flatMap((v: any) => [v.elaborated_by_user_id, v.approved_by_user_id].filter(Boolean)))] as string[];

  const nameMap = new Map<string, string>();
  if (userIds.length > 0) {
    const [{ data: emps }, { data: profs }] = await Promise.all([
      supabase.from("employees").select("id, full_name").in("id", userIds),
      supabase.from("profiles").select("id, full_name").in("id", userIds),
    ]);
    for (const u of [...(emps || []), ...(profs || [])]) {
      if (u.full_name) nameMap.set(u.id, u.full_name);
    }
  }

  return versions.map((v: any) => ({
    id: v.id,
    version_number: v.version_number,
    changes_summary: v.changes_summary,
    elaborated_by_name: v.elaborated_by_user_id ? (nameMap.get(v.elaborated_by_user_id) || null) : null,
    approved_by_name: v.approved_by_user_id ? (nameMap.get(v.approved_by_user_id) || null) : null,
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

// ── Sub-documents ──

export interface SgqSubDocument {
  id: string;
  file_name: string;
  file_path: string;
  upload_date: string;
  file_size: number | null;
}

export const getSgqSubDocuments = async (docId: string): Promise<SgqSubDocument[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_path, upload_date, file_size")
    .eq("related_model", "sgq_subdocument")
    .eq("related_id", docId)
    .order("upload_date", { ascending: false });

  if (error) throw new Error(`Erro ao buscar sub-documentos: ${error.message}`);
  return (data || []) as SgqSubDocument[];
};

export const uploadSgqSubDocument = async (docId: string, file: File): Promise<void> => {
  await uploadDocument(file, {
    related_model: "sgq_subdocument",
    related_id: docId,
  });
};

export const updateSgqDocument = async (id: string, payload: UpdateSgqDocumentPayload): Promise<void> => {
  const { error } = await (supabase as any)
    .from("sgq_iso_documents")
    .update({
      title: payload.title.trim(),
      document_identifier_type: payload.document_identifier_type,
      document_identifier_other: payload.document_identifier_type === "Outro" ? payload.document_identifier_other : null,
      elaborated_by_user_id: payload.elaborated_by_user_id,
      approved_by_user_id: payload.approved_by_user_id,
      expiration_date: ensureDateOnly(payload.expiration_date),
      norm_reference: payload.norm_reference || null,
      notes: payload.notes || null,
      responsible_department: payload.responsible_department || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(`Erro ao atualizar documento: ${error.message}`);

  // Update branches: delete existing and reinsert
  await (supabase as any).from("sgq_document_branches").delete().eq("sgq_document_id", id);
  if (payload.branch_ids && payload.branch_ids.length > 0) {
    await (supabase as any).from("sgq_document_branches").insert(
      payload.branch_ids.map((branchId) => ({ sgq_document_id: id, branch_id: branchId })),
    );
  }
};

export const deleteSgqDocument = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("sgq_iso_documents")
    .delete()
    .eq("id", id);

  if (error) throw new Error("Erro ao excluir documento");
};
