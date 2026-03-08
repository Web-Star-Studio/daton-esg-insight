import { supabase } from "@/integrations/supabase/client";
import {
  calculateStakeholderRequirementKpis,
  getDaysUntilDate,
  getStakeholderAlertWindow,
  isRequirementOverdue,
  StakeholderRequirementStatus,
} from "@/utils/stakeholderRequirementsCompliance";

export interface StakeholderRequirementEvidence {
  id: string;
  company_id: string;
  stakeholder_requirement_id: string;
  document_id: string | null;
  evidence_url: string | null;
  evidence_note: string | null;
  evidence_date: string;
  added_by_user_id: string;
  created_at: string;
  document?: {
    id: string;
    file_name: string;
    file_path: string;
  } | null;
  added_by?: {
    id: string;
    full_name: string;
  } | null;
}

export interface StakeholderRequirement {
  id: string;
  company_id: string;
  stakeholder_id: string;
  iso_standard: string;
  iso_clause: string;
  requirement_title: string;
  requirement_description: string | null;
  monitoring_method: string | null;
  is_legal_requirement: boolean;
  is_relevant_to_sgq: boolean;
  status: StakeholderRequirementStatus;
  responsible_user_id: string | null;
  linked_compliance_task_id: string | null;
  last_checked_at: string | null;
  review_due_date: string | null;
  source_reference: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  stakeholder?: {
    id: string;
    name: string;
    category: string;
    organization: string | null;
  } | null;
  responsible?: {
    id: string;
    full_name: string;
  } | null;
  linked_task?: {
    id: string;
    title: string;
    status: string;
    due_date: string;
  } | null;
  created_by?: {
    id: string;
    full_name: string;
  } | null;
  evidence_count: number;
  is_overdue: boolean;
  days_until_review: number | null;
}

export interface StakeholderMatrixReview {
  id: string;
  company_id: string;
  review_date: string;
  review_summary: string;
  management_review_reference: string;
  reviewed_by_user_id: string;
  next_review_due_date: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CreateStakeholderRequirementInput {
  stakeholder_id: string;
  requirement_title: string;
  requirement_description?: string;
  monitoring_method?: string;
  is_legal_requirement?: boolean;
  is_relevant_to_sgq?: boolean;
  status?: StakeholderRequirementStatus;
  responsible_user_id?: string;
  linked_compliance_task_id?: string;
  last_checked_at?: string;
  review_due_date?: string;
  source_reference?: string;
}

export interface UpdateStakeholderRequirementInput {
  requirement_title?: string;
  requirement_description?: string;
  monitoring_method?: string;
  is_legal_requirement?: boolean;
  is_relevant_to_sgq?: boolean;
  status?: StakeholderRequirementStatus;
  responsible_user_id?: string;
  linked_compliance_task_id?: string;
  last_checked_at?: string;
  review_due_date?: string;
  source_reference?: string;
}

export interface StakeholderRequirementFilters {
  status?: StakeholderRequirementStatus | "all";
  responsible_user_id?: string | "all";
  stakeholder_id?: string | "all";
  legal_requirement?: "all" | "yes" | "no";
  relevant_to_sgq?: "all" | "yes" | "no";
  overdue_only?: boolean;
  due_within_days?: number;
}

export interface CreateStakeholderEvidenceInput {
  stakeholder_requirement_id: string;
  document_id?: string | null;
  evidence_url?: string;
  evidence_note?: string;
  evidence_date?: string;
}

export interface CreateStakeholderMatrixReviewInput {
  review_date: string;
  review_summary: string;
  management_review_reference: string;
  next_review_due_date?: string;
}

interface UserContext {
  userId: string;
  companyId: string;
}

const resolveUserContext = async (): Promise<UserContext> => {
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
    .single();

  if (profileError || !profile?.company_id) {
    throw new Error("Empresa do usuário não encontrada");
  }

  return {
    userId: user.id,
    companyId: profile.company_id,
  };
};

const withRequirementMetadata = (
  requirements: any[],
  evidences: { stakeholder_requirement_id: string }[],
): StakeholderRequirement[] => {
  const evidenceCount = evidences.reduce<Record<string, number>>((acc, item) => {
    acc[item.stakeholder_requirement_id] = (acc[item.stakeholder_requirement_id] || 0) + 1;
    return acc;
  }, {});

  return requirements.map((requirement) => {
    const dueDate = requirement.review_due_date;

    return {
      ...requirement,
      evidence_count: evidenceCount[requirement.id] || 0,
      is_overdue: isRequirementOverdue(requirement),
      days_until_review: dueDate ? getDaysUntilDate(dueDate) : null,
    } as StakeholderRequirement;
  });
};

class StakeholderRequirementsService {
  async getStakeholderRequirements(
    filters: StakeholderRequirementFilters = {},
  ): Promise<StakeholderRequirement[]> {
    const { companyId } = await resolveUserContext();

    let query = (supabase
      .from("stakeholder_requirements" as any)
      .select(
        `
          *,
          stakeholder:stakeholders(id, name, category, organization),
          responsible:profiles!stakeholder_requirements_responsible_user_id_fkey(id, full_name),
          linked_task:compliance_tasks(id, title, status, due_date),
          created_by:profiles!stakeholder_requirements_created_by_user_id_fkey(id, full_name)
        `,
      )
      .eq("company_id", companyId)
      .order("review_due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.responsible_user_id && filters.responsible_user_id !== "all") {
      query = query.eq("responsible_user_id", filters.responsible_user_id);
    }

    if (filters.stakeholder_id && filters.stakeholder_id !== "all") {
      query = query.eq("stakeholder_id", filters.stakeholder_id);
    }

    if (filters.legal_requirement === "yes") {
      query = query.eq("is_legal_requirement", true);
    } else if (filters.legal_requirement === "no") {
      query = query.eq("is_legal_requirement", false);
    }

    if (filters.relevant_to_sgq === "yes") {
      query = query.eq("is_relevant_to_sgq", true);
    } else if (filters.relevant_to_sgq === "no") {
      query = query.eq("is_relevant_to_sgq", false);
    }

    if (filters.overdue_only) {
      const today = new Date().toISOString().slice(0, 10);
      query = query.lt("review_due_date", today).neq("status", "atendido");
    } else if (filters.due_within_days && filters.due_within_days > 0) {
      const target = new Date();
      target.setDate(target.getDate() + filters.due_within_days);
      query = query
        .lte("review_due_date", target.toISOString().slice(0, 10))
        .neq("status", "atendido");
    }

    const { data: requirements, error } = await query;

    if (error) {
      throw new Error(`Erro ao carregar requisitos de partes interessadas: ${error.message}`);
    }

    const requirementIds = (requirements || []).map((item) => item.id);

    if (requirementIds.length === 0) {
      return [];
    }

    const { data: evidences, error: evidenceError } = await supabase
      .from("stakeholder_requirement_evidences")
      .select("stakeholder_requirement_id")
      .in("stakeholder_requirement_id", requirementIds)
      .eq("company_id", companyId);

    if (evidenceError) {
      throw new Error(`Erro ao carregar evidências dos requisitos: ${evidenceError.message}`);
    }

    return withRequirementMetadata(requirements || [], evidences || []);
  }

  async getStakeholderRequirementById(requirementId: string): Promise<StakeholderRequirement> {
    const { companyId } = await resolveUserContext();

    const { data: requirement, error } = await supabase
      .from("stakeholder_requirements")
      .select(
        `
          *,
          stakeholder:stakeholders(id, name, category, organization),
          responsible:profiles!stakeholder_requirements_responsible_user_id_fkey(id, full_name),
          linked_task:compliance_tasks(id, title, status, due_date),
          created_by:profiles!stakeholder_requirements_created_by_user_id_fkey(id, full_name)
        `,
      )
      .eq("id", requirementId)
      .eq("company_id", companyId)
      .single();

    if (error || !requirement) {
      throw new Error(error?.message || "Requisito não encontrado");
    }

    const { data: evidences, error: evidenceError } = await supabase
      .from("stakeholder_requirement_evidences")
      .select("stakeholder_requirement_id")
      .eq("stakeholder_requirement_id", requirementId)
      .eq("company_id", companyId);

    if (evidenceError) {
      throw new Error(`Erro ao carregar evidências: ${evidenceError.message}`);
    }

    return withRequirementMetadata([requirement], evidences || [])[0];
  }

  async createStakeholderRequirement(
    input: CreateStakeholderRequirementInput,
  ): Promise<StakeholderRequirement> {
    const { companyId, userId } = await resolveUserContext();

    const payload = {
      ...input,
      iso_standard: "ISO_9001",
      iso_clause: "4.2",
      company_id: companyId,
      created_by_user_id: userId,
      status: input.status || "nao_iniciado",
      requirement_description: input.requirement_description || null,
      monitoring_method: input.monitoring_method || null,
      responsible_user_id: input.responsible_user_id || null,
      linked_compliance_task_id: input.linked_compliance_task_id || null,
      source_reference: input.source_reference || null,
      is_legal_requirement: input.is_legal_requirement ?? false,
      is_relevant_to_sgq: input.is_relevant_to_sgq ?? true,
      last_checked_at: input.last_checked_at || null,
      review_due_date: input.review_due_date || null,
    };

    const { data, error } = await supabase
      .from("stakeholder_requirements")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Erro ao criar requisito");
    }

    return {
      ...data,
      evidence_count: 0,
      is_overdue: isRequirementOverdue(data),
      days_until_review: data.review_due_date ? getDaysUntilDate(data.review_due_date) : null,
    } as StakeholderRequirement;
  }

  async updateStakeholderRequirement(
    requirementId: string,
    input: UpdateStakeholderRequirementInput,
  ): Promise<StakeholderRequirement> {
    const { companyId } = await resolveUserContext();

    const payload = {
      ...input,
      requirement_description:
        input.requirement_description !== undefined
          ? input.requirement_description || null
          : undefined,
      monitoring_method:
        input.monitoring_method !== undefined ? input.monitoring_method || null : undefined,
      responsible_user_id:
        input.responsible_user_id !== undefined ? input.responsible_user_id || null : undefined,
      linked_compliance_task_id:
        input.linked_compliance_task_id !== undefined
          ? input.linked_compliance_task_id || null
          : undefined,
      source_reference:
        input.source_reference !== undefined ? input.source_reference || null : undefined,
      review_due_date:
        input.review_due_date !== undefined ? input.review_due_date || null : undefined,
    };

    const { data, error } = await supabase
      .from("stakeholder_requirements")
      .update(payload)
      .eq("id", requirementId)
      .eq("company_id", companyId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Erro ao atualizar requisito");
    }

    const { data: evidenceRows, error: evidenceError } = await supabase
      .from("stakeholder_requirement_evidences")
      .select("id")
      .eq("stakeholder_requirement_id", requirementId)
      .eq("company_id", companyId);

    if (evidenceError) {
      throw new Error(`Erro ao carregar evidências após atualização: ${evidenceError.message}`);
    }

    return {
      ...data,
      evidence_count: (evidenceRows || []).length,
      is_overdue: isRequirementOverdue(data),
      days_until_review: data.review_due_date ? getDaysUntilDate(data.review_due_date) : null,
    } as StakeholderRequirement;
  }

  async registerRequirementCheck(requirementId: string, checkedAt?: string): Promise<void> {
    const requirement = await this.getStakeholderRequirementById(requirementId);

    const nextStatus: StakeholderRequirementStatus =
      requirement.status === "nao_iniciado" ? "em_atendimento" : requirement.status;

    await this.updateStakeholderRequirement(requirementId, {
      status: nextStatus,
      last_checked_at: checkedAt || new Date().toISOString(),
    });
  }

  async markRequirementAsAttended(requirementId: string): Promise<StakeholderRequirement> {
    return this.updateStakeholderRequirement(requirementId, {
      status: "atendido",
      last_checked_at: new Date().toISOString(),
    });
  }

  async getRequirementEvidences(requirementId: string): Promise<StakeholderRequirementEvidence[]> {
    const { companyId } = await resolveUserContext();

    const { data, error } = await supabase
      .from("stakeholder_requirement_evidences")
      .select(
        `
          *,
          document:documents(id, file_name, file_path),
          added_by:profiles!stakeholder_requirement_evidences_added_by_user_id_fkey(id, full_name)
        `,
      )
      .eq("stakeholder_requirement_id", requirementId)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Erro ao carregar evidências: ${error.message}`);
    }

    return (data || []) as StakeholderRequirementEvidence[];
  }

  async addRequirementEvidence(
    input: CreateStakeholderEvidenceInput,
  ): Promise<StakeholderRequirementEvidence> {
    const { companyId, userId } = await resolveUserContext();

    const payload = {
      company_id: companyId,
      stakeholder_requirement_id: input.stakeholder_requirement_id,
      document_id: input.document_id || null,
      evidence_url: input.evidence_url || null,
      evidence_note: input.evidence_note || null,
      evidence_date: input.evidence_date || new Date().toISOString().slice(0, 10),
      added_by_user_id: userId,
    };

    const { data, error } = await supabase
      .from("stakeholder_requirement_evidences")
      .insert(payload)
      .select(
        `
          *,
          document:documents(id, file_name, file_path),
          added_by:profiles!stakeholder_requirement_evidences_added_by_user_id_fkey(id, full_name)
        `,
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Erro ao adicionar evidência");
    }

    return data as StakeholderRequirementEvidence;
  }

  async removeRequirementEvidence(evidenceId: string): Promise<void> {
    const { companyId } = await resolveUserContext();

    const { error } = await supabase
      .from("stakeholder_requirement_evidences")
      .delete()
      .eq("id", evidenceId)
      .eq("company_id", companyId);

    if (error) {
      throw new Error(`Erro ao remover evidência: ${error.message}`);
    }
  }

  async getStakeholderMatrixReviews(): Promise<StakeholderMatrixReview[]> {
    const { companyId } = await resolveUserContext();

    const { data, error } = await supabase
      .from("stakeholder_matrix_reviews")
      .select(
        `
          *,
          reviewed_by:profiles!stakeholder_matrix_reviews_reviewed_by_user_id_fkey(id, full_name)
        `,
      )
      .eq("company_id", companyId)
      .order("review_date", { ascending: false });

    if (error) {
      throw new Error(`Erro ao carregar revisões da matriz: ${error.message}`);
    }

    return (data || []) as StakeholderMatrixReview[];
  }

  async registerStakeholderMatrixReview(
    input: CreateStakeholderMatrixReviewInput,
  ): Promise<StakeholderMatrixReview> {
    const { companyId, userId } = await resolveUserContext();

    const payload = {
      company_id: companyId,
      review_date: input.review_date,
      review_summary: input.review_summary,
      management_review_reference: input.management_review_reference,
      reviewed_by_user_id: userId,
      next_review_due_date: input.next_review_due_date || null,
    };

    const { data, error } = await supabase
      .from("stakeholder_matrix_reviews")
      .insert(payload)
      .select(
        `
          *,
          reviewed_by:profiles!stakeholder_matrix_reviews_reviewed_by_user_id_fkey(id, full_name)
        `,
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Erro ao registrar revisão da matriz");
    }

    return data as StakeholderMatrixReview;
  }

  async getStakeholderRequirementKpis(filters: StakeholderRequirementFilters = {}) {
    const requirements = await this.getStakeholderRequirements(filters);
    return calculateStakeholderRequirementKpis(requirements);
  }

  async getStakeholderRequirementAlerts(): Promise<
    Array<{
      requirement: StakeholderRequirement;
      alert_window: "30_days" | "7_days" | "due_or_overdue";
    }>
  > {
    const requirements = await this.getStakeholderRequirements({ status: "all" });

    return requirements
      .map((requirement) => {
        const alertWindow = getStakeholderAlertWindow(
          requirement.review_due_date,
          requirement.status,
        );

        if (!alertWindow) return null;

        return {
          requirement,
          alert_window: alertWindow,
        };
      })
      .filter((item): item is {
        requirement: StakeholderRequirement;
        alert_window: "30_days" | "7_days" | "due_or_overdue";
      } => Boolean(item))
      .sort((a, b) => {
        const rank: Record<string, number> = {
          due_or_overdue: 0,
          "7_days": 1,
          "30_days": 2,
        };

        const aRank = rank[a.alert_window];
        const bRank = rank[b.alert_window];

        if (aRank !== bRank) return aRank - bRank;

        if (!a.requirement.review_due_date || !b.requirement.review_due_date) return 0;

        return a.requirement.review_due_date.localeCompare(b.requirement.review_due_date);
      });
  }

  async getStakeholdersForSelection() {
    const { companyId } = await resolveUserContext();

    const { data, error } = await supabase
      .from("stakeholders")
      .select("id, name, category, organization")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      throw new Error(`Erro ao carregar partes interessadas: ${error.message}`);
    }

    return data || [];
  }

  async getResponsibleUsers() {
    const { companyId } = await resolveUserContext();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("company_id", companyId)
      .order("full_name");

    if (error) {
      throw new Error(`Erro ao carregar responsáveis: ${error.message}`);
    }

    return data || [];
  }

  async getComplianceTasksForSelection() {
    const { companyId } = await resolveUserContext();

    const { data, error } = await supabase
      .from("compliance_tasks")
      .select("id, title, status, due_date")
      .eq("company_id", companyId)
      .order("due_date", { ascending: true });

    if (error) {
      throw new Error(`Erro ao carregar tarefas de compliance: ${error.message}`);
    }

    return data || [];
  }

  async getDocumentsForEvidenceSelection() {
    const { companyId } = await resolveUserContext();

    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, file_path")
      .eq("company_id", companyId)
      .order("upload_date", { ascending: false })
      .limit(200);

    if (error) {
      throw new Error(`Erro ao carregar documentos: ${error.message}`);
    }

    return data || [];
  }
}

export const stakeholderRequirementsService = new StakeholderRequirementsService();
