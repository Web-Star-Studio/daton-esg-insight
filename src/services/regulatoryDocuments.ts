import { supabase } from "@/integrations/supabase/client";
import { uploadDocument, type Document } from "@/services/documents";
import type { Database } from "@/integrations/supabase/types";

export type RenewalStatus = Database["public"]["Enums"]["license_renewal_status_enum"];

export type DocumentStatus = "Vigente" | "A Vencer" | "Vencido";

export const REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS = [
  "Licença Ambiental",
  "AVCB",
  "Alvará",
  "Outorga",
  "Certidão",
  "Outro",
] as const;

export type RegulatoryDocumentIdentifierType =
  (typeof REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS)[number];

export interface RegulatoryDocumentSettings {
  company_id: string;
  default_expiring_days: number;
  updated_at: string;
}

export interface RegulatoryDocumentVersion {
  id: string;
  file_name: string;
  file_path: string;
  upload_date: string;
  file_size: number | null;
  file_type: string;
  version_label: string;
  is_current: boolean;
}

export interface RegulatoryDocumentItem {
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
}

export interface RegulatoryDocumentFilters {
  search?: string;
  branch_id?: string;
  document_identifier_type?: string;
  status?: DocumentStatus;
  renewal_status?: RenewalStatus;
}

export interface CreateRegulatoryDocumentPayload {
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
  license_type?: Database["public"]["Enums"]["license_type_enum"];
  initial_attachment?: File | null;
}

export interface UpdateRegulatoryDocumentPayload {
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
}

export interface UpsertRenewalPayload {
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

export const getRenewalStatusLabel = (status: RenewalStatus): string => {
  return RENEWAL_STATUS_LABELS[status] || "Não iniciado";
};

const ensureDateOnly = (value: string) => value.split("T")[0];

const getCurrentUserAndCompany = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.company_id) {
    throw new Error("Não foi possível identificar a empresa do usuário");
  }

  return { user, companyId: profile.company_id };
};

const calculateDaysRemaining = (expirationDate: string): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const exp = new Date(`${ensureDateOnly(expirationDate)}T00:00:00`);
  const diff = exp.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const resolveDocumentStatus = (daysRemaining: number, threshold: number): DocumentStatus => {
  if (daysRemaining < 0) return "Vencido";
  if (daysRemaining <= threshold) return "A Vencer";
  return "Vigente";
};

const resolveLicenseStatus = (expirationDate: string, renewalStatus?: RenewalStatus) => {
  if (renewalStatus === "em_andamento" || renewalStatus === "protocolado") {
    return "Em Renovação" as const;
  }

  const daysRemaining = calculateDaysRemaining(expirationDate);
  if (daysRemaining < 0) return "Vencida" as const;
  return "Ativa" as const;
};

export const getRegulatorySettings = async (): Promise<RegulatoryDocumentSettings> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("regulatory_document_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao buscar configurações: ${error.message}`);
  }

  if (data) return data;

  const { data: inserted, error: insertError } = await supabase
    .from("regulatory_document_settings")
    .insert({ company_id: companyId, default_expiring_days: 30 })
    .select("*")
    .maybeSingle();

  if (insertError || !inserted) {
    throw new Error("Erro ao inicializar configurações de documentos regulatórios");
  }

  return inserted;
};

export const updateRegulatorySettings = async (
  defaultExpiringDays: number,
): Promise<RegulatoryDocumentSettings> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("regulatory_document_settings")
    .upsert({
      company_id: companyId,
      default_expiring_days: Math.max(0, Math.round(defaultExpiringDays)),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Erro ao atualizar configuração de prazo padrão: ${error?.message || "resposta vazia do banco"}`,
    );
  }

  return data;
};

export const getResponsibleUsers = async (): Promise<Array<{ id: string; full_name: string }>> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Erro ao carregar responsáveis: ${error.message}`);
  }

  return (data || []).map((profile) => ({
    id: profile.id,
    full_name: profile.full_name || "Sem nome",
  }));
};

export const getRegulatoryDocuments = async (
  filters?: RegulatoryDocumentFilters,
): Promise<RegulatoryDocumentItem[]> => {
  const { companyId } = await getCurrentUserAndCompany();
  const settings = await getRegulatorySettings();

  let licensesQuery = supabase
    .from("licenses")
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
      updated_at,
      branches:branch_id (
        name
      ),
      responsible:responsible_user_id (
        full_name
      )
    `)
    .eq("company_id", companyId)
    .order("expiration_date", { ascending: true });

  if (filters?.branch_id && filters.branch_id !== "all") {
    licensesQuery = licensesQuery.eq("branch_id", filters.branch_id);
  }

  if (filters?.document_identifier_type && filters.document_identifier_type !== "all") {
    licensesQuery = licensesQuery.eq("document_identifier_type", filters.document_identifier_type);
  }

  const { data: licensesData, error: licensesError } = await licensesQuery;

  if (licensesError) {
    throw new Error(`Erro ao buscar documentos regulatórios: ${licensesError.message}`);
  }

  const licenses = licensesData || [];
  if (licenses.length === 0) return [];

  const licenseIds = licenses.map((item) => item.id);

  const { data: schedulesData, error: schedulesError } = await supabase
    .from("license_renewal_schedules")
    .select(
      "id, license_id, status, scheduled_start_date, protocol_number, renewed_expiration_date, updated_at, created_at",
    )
    .in("license_id", licenseIds)
    .order("created_at", { ascending: false });

  if (schedulesError) {
    throw new Error(`Erro ao buscar dados de renovação: ${schedulesError.message}`);
  }

  const { data: docsData, error: docsError } = await supabase
    .from("documents")
    .select("id, related_id, upload_date")
    .in("related_model", ["licenses", "license"])
    .in("related_id", licenseIds)
    .order("upload_date", { ascending: false });

  if (docsError) {
    throw new Error(`Erro ao buscar anexos dos documentos regulatórios: ${docsError.message}`);
  }

  const latestScheduleByLicense = new Map<string, (typeof schedulesData)[number]>();
  for (const schedule of schedulesData || []) {
    if (!latestScheduleByLicense.has(schedule.license_id)) {
      latestScheduleByLicense.set(schedule.license_id, schedule);
    }
  }

  const versionsCountByLicense = new Map<string, number>();
  const latestUploadByLicense = new Map<string, string>();
  for (const doc of docsData || []) {
    const currentCount = versionsCountByLicense.get(doc.related_id) || 0;
    versionsCountByLicense.set(doc.related_id, currentCount + 1);

    if (!latestUploadByLicense.has(doc.related_id)) {
      latestUploadByLicense.set(doc.related_id, doc.upload_date);
    }
  }

  const mapped = licenses.map<RegulatoryDocumentItem>((license) => {
    const renewal = latestScheduleByLicense.get(license.id);
    const renewalStatus: RenewalStatus = renewal?.status || "nao_iniciado";
    const threshold = license.renewal_alert_days ?? settings.default_expiring_days ?? 30;
    const daysRemaining = calculateDaysRemaining(license.expiration_date);
    const documentStatus = resolveDocumentStatus(daysRemaining, threshold);

    const latestUpdateCandidates = [
      license.updated_at,
      renewal?.updated_at,
      latestUploadByLicense.get(license.id),
    ].filter(Boolean) as string[];

    const latestUpdate = latestUpdateCandidates.sort((a, b) => b.localeCompare(a))[0] || license.updated_at;

    return {
      id: license.id,
      document_identifier_type: license.document_identifier_type,
      document_identifier_other: license.document_identifier_other,
      document_number: license.document_number,
      issuing_body: license.issuing_body,
      process_number: license.process_number,
      branch_id: license.branch_id,
      branch_name: (license.branches as { name?: string } | null)?.name || null,
      responsible_user_id: license.responsible_user_id,
      responsible_name: (license.responsible as { full_name?: string } | null)?.full_name || null,
      issue_date: license.issue_date,
      expiration_date: license.expiration_date,
      days_remaining: daysRemaining,
      status: documentStatus,
      renewal_required: license.renewal_required ?? true,
      renewal_start_date: renewal?.scheduled_start_date || null,
      renewal_protocol_number: renewal?.protocol_number || null,
      renewal_status: renewalStatus,
      renewed_expiration_date: renewal?.renewed_expiration_date || null,
      versions_count: versionsCountByLicense.get(license.id) || 0,
      latest_update: latestUpdate,
      notes: license.notes,
      renewal_alert_days: license.renewal_alert_days,
    };
  });

  const normalizedSearch = filters?.search?.trim().toLowerCase();

  return mapped.filter((item) => {
    if (filters?.status && filters.status !== item.status) return false;
    if (filters?.renewal_status && filters.renewal_status !== item.renewal_status) return false;

    if (!normalizedSearch) return true;

    return [
      item.document_identifier_type,
      item.document_identifier_other,
      item.document_number,
      item.issuing_body,
      item.process_number,
      item.branch_name,
      item.responsible_name,
      item.notes,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });
};

export const createRegulatoryDocument = async (
  payload: CreateRegulatoryDocumentPayload,
): Promise<{ id: string }> => {
  const { companyId } = await getCurrentUserAndCompany();

  if (!payload.branch_id) {
    throw new Error("Filial é obrigatória para cadastro de documento regulatório");
  }

  if (!payload.responsible_user_id) {
    throw new Error("Responsável é obrigatório para cadastro de documento regulatório");
  }

  const expirationDate = ensureDateOnly(payload.expiration_date);

  const { data, error } = await supabase
    .from("licenses")
    .insert({
      name: `${payload.document_identifier_type}${payload.document_number ? ` - ${payload.document_number}` : ""}`,
      type: payload.license_type || "Outra",
      issuing_body: payload.issuing_body,
      process_number: payload.process_number || null,
      document_number: payload.document_number || null,
      document_identifier_type: payload.document_identifier_type,
      document_identifier_other: payload.document_identifier_other || null,
      branch_id: payload.branch_id,
      responsible_user_id: payload.responsible_user_id,
      issue_date: payload.issue_date ? ensureDateOnly(payload.issue_date) : null,
      expiration_date: expirationDate,
      status: resolveLicenseStatus(expirationDate),
      renewal_required: payload.renewal_required ?? true,
      renewal_alert_days: payload.renewal_alert_days ?? null,
      notes: payload.notes || null,
      company_id: companyId,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Erro ao criar documento regulatório: ${error?.message || "desconhecido"}`);
  }

  if (payload.initial_attachment) {
    try {
      await uploadRegulatoryDocumentAttachment(data.id, payload.initial_attachment);
    } catch (uploadError: any) {
      const { error: rollbackError } = await supabase.from("licenses").delete().eq("id", data.id);

      if (rollbackError) {
        throw new Error(
          `Erro ao anexar documento inicial (${uploadError?.message || "desconhecido"}) e falha ao desfazer cadastro (${rollbackError.message}).`,
        );
      }

      throw new Error(
        `Erro ao anexar documento inicial: ${uploadError?.message || "desconhecido"}. O cadastro foi desfeito.`,
      );
    }
  }

  return data;
};

export const updateRegulatoryDocument = async (
  id: string,
  payload: UpdateRegulatoryDocumentPayload,
): Promise<void> => {
  const updatePayload: Database["public"]["Tables"]["licenses"]["Update"] = {};

  if (payload.document_identifier_type !== undefined) updatePayload.document_identifier_type = payload.document_identifier_type;
  if (payload.document_identifier_other !== undefined) updatePayload.document_identifier_other = payload.document_identifier_other;
  if (payload.document_number !== undefined) updatePayload.document_number = payload.document_number;
  if (payload.issuing_body !== undefined) updatePayload.issuing_body = payload.issuing_body;
  if (payload.process_number !== undefined) updatePayload.process_number = payload.process_number;
  if (payload.branch_id !== undefined) updatePayload.branch_id = payload.branch_id;
  if (payload.responsible_user_id !== undefined) updatePayload.responsible_user_id = payload.responsible_user_id;
  if (payload.issue_date !== undefined) updatePayload.issue_date = payload.issue_date ? ensureDateOnly(payload.issue_date) : null;
  if (payload.expiration_date !== undefined) {
    const expDate = ensureDateOnly(payload.expiration_date);
    updatePayload.expiration_date = expDate;
    updatePayload.status = resolveLicenseStatus(expDate);
  }
  if (payload.renewal_required !== undefined) updatePayload.renewal_required = payload.renewal_required;
  if (payload.renewal_alert_days !== undefined) updatePayload.renewal_alert_days = payload.renewal_alert_days;
  if (payload.notes !== undefined) updatePayload.notes = payload.notes;

  const { error } = await supabase.from("licenses").update(updatePayload).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar documento regulatório: ${error.message}`);
  }
};

export const upsertRenewalData = async (
  licenseId: string,
  payload: UpsertRenewalPayload,
): Promise<void> => {
  const { user, companyId } = await getCurrentUserAndCompany();

  if (payload.status === "renovado" && !payload.renewed_expiration_date) {
    throw new Error("Nova data de validade é obrigatória quando status da renovação é Renovado");
  }

  const { data: license, error: licenseError } = await supabase
    .from("licenses")
    .select("id, expiration_date")
    .eq("id", licenseId)
    .maybeSingle();

  if (licenseError || !license) {
    throw new Error("Documento regulatório não encontrado");
  }

  const defaultProtocolDeadline = new Date(`${license.expiration_date}T00:00:00`);
  defaultProtocolDeadline.setDate(defaultProtocolDeadline.getDate() - 45);

  const { data: existingSchedule } = await supabase
    .from("license_renewal_schedules")
    .select("id")
    .eq("license_id", licenseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const schedulePayload: Database["public"]["Tables"]["license_renewal_schedules"]["Insert"] = {
    license_id: licenseId,
    company_id: companyId,
    created_by_user_id: user.id,
    scheduled_start_date: payload.scheduled_start_date
      ? ensureDateOnly(payload.scheduled_start_date)
      : new Date().toISOString().split("T")[0],
    protocol_deadline: payload.protocol_deadline
      ? ensureDateOnly(payload.protocol_deadline)
      : defaultProtocolDeadline.toISOString().split("T")[0],
    status: payload.status,
    protocol_number: payload.protocol_number || null,
    renewed_expiration_date: payload.renewed_expiration_date
      ? ensureDateOnly(payload.renewed_expiration_date)
      : null,
  };

  if (existingSchedule?.id) {
    const { error: updateScheduleError } = await supabase
      .from("license_renewal_schedules")
      .update({
        ...schedulePayload,
        company_id: undefined,
        created_by_user_id: undefined,
        license_id: undefined,
      })
      .eq("id", existingSchedule.id);

    if (updateScheduleError) {
      throw new Error(`Erro ao atualizar renovação: ${updateScheduleError.message}`);
    }
  } else {
    const { error: insertScheduleError } = await supabase
      .from("license_renewal_schedules")
      .insert(schedulePayload);

    if (insertScheduleError) {
      throw new Error(`Erro ao registrar renovação: ${insertScheduleError.message}`);
    }
  }

  const licenseUpdate: Database["public"]["Tables"]["licenses"]["Update"] = {
    status:
      payload.status === "renovado"
        ? "Ativa"
        : resolveLicenseStatus(
            payload.renewed_expiration_date || license.expiration_date,
            payload.status,
          ),
  };

  if (payload.status === "renovado" && payload.renewed_expiration_date) {
    licenseUpdate.expiration_date = ensureDateOnly(payload.renewed_expiration_date);
  }

  const { error: updateLicenseError } = await supabase
    .from("licenses")
    .update(licenseUpdate)
    .eq("id", licenseId);

  if (updateLicenseError) {
    throw new Error(`Erro ao atualizar validade da licença: ${updateLicenseError.message}`);
  }
};

export const uploadRegulatoryDocumentAttachment = async (
  licenseId: string,
  file: File,
): Promise<Document> => {
  return uploadDocument(file, {
    related_model: "licenses",
    related_id: licenseId,
    tags: ["regulatory-document"],
  });
};

export const getRegulatoryDocumentVersions = async (
  licenseId: string,
): Promise<RegulatoryDocumentVersion[]> => {
  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, file_path, upload_date, file_size, file_type")
    .in("related_model", ["licenses", "license"])
    .eq("related_id", licenseId)
    .order("upload_date", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar histórico de versões: ${error.message}`);
  }

  const docs = data || [];
  const total = docs.length;

  return docs.map((doc, index) => ({
    ...doc,
    version_label: `v${Math.max(1, total - index)}`,
    is_current: index === 0,
  }));
};
