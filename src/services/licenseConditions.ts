import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type LicenseConditionRow = Database['public']['Tables']['license_conditions']['Row'];

export interface LicenseCondition extends LicenseConditionRow {}

export interface CreateConditionInput {
  license_id: string;
  condition_text: string;
  condition_category: string;
  frequency: string;
  due_date?: string;
  priority?: string;
  responsible_user_id?: string;
  compliance_impact?: string;
  tags?: string[];
  requires_approval?: boolean;
}

export interface UpdateConditionInput {
  condition_text?: string;
  condition_category?: string;
  frequency?: string;
  status?: string;
  due_date?: string;
  priority?: string;
  responsible_user_id?: string;
  completion_notes?: string;
  completion_date?: string;
  compliance_impact?: string;
  tags?: string[];
}

// Buscar condicionante por ID
export const getConditionById = async (id: string): Promise<any | null> => {
  const { data, error } = await supabase
    .from("license_conditions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Buscar condicionantes de uma licença
export const getConditionsByLicense = async (licenseId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from("license_conditions")
    .select("*")
    .eq("license_id", licenseId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
};

// Criar condicionante
export const createCondition = async (input: CreateConditionInput): Promise<any> => {
  const { data, error } = await supabase
    .from("license_conditions")
    .insert([input] as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Atualizar condicionante
export const updateCondition = async (
  id: string,
  updates: any
): Promise<void> => {
  const { error } = await supabase
    .from("license_conditions")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
};

// Marcar condicionante como concluída
export const completeCondition = async (
  id: string,
  notes: string
): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  const updates: any = {
    status: "completed",
    completion_date: new Date().toISOString(),
    completion_notes: notes,
  };

  // Buscar condicionante para verificar se requer aprovação
  const condition = await getConditionById(id);
  if (condition?.requires_approval) {
    updates.approved_by_user_id = userId;
    updates.approval_date = new Date().toISOString();
  }

  await updateCondition(id, updates);

  // Se houver alerta relacionado, resolve-lo
  if (condition?.related_alert_id) {
    await supabase
      .from("license_alerts")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", condition.related_alert_id);
  }
};

// Deletar condicionante
export const deleteCondition = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("license_conditions")
    .delete()
    .eq("id", id);

  if (error) throw error;
};

// Vincular condicionante a alerta
export const linkConditionToAlert = async (
  conditionId: string,
  alertId: string
): Promise<void> => {
  await updateCondition(conditionId, { related_alert_id: alertId });
  
  // Atualizar alerta também
  await supabase
    .from("license_alerts")
    .update({ source_condition_id: conditionId })
    .eq("id", alertId);
};

// Vincular condicionante a observação
export const linkConditionToObservation = async (
  conditionId: string,
  observationId: string
): Promise<void> => {
  const condition = await getConditionById(conditionId);
  if (!condition) return;

  const updatedObservations = [
    ...(condition.related_observation_ids || []),
    observationId,
  ];

  await supabase
    .from("license_conditions")
    .update({ related_observation_ids: updatedObservations })
    .eq("id", conditionId);
};

// Buscar relacionamentos da condicionante
export const getConditionRelationships = async (conditionId: string) => {
  const condition = await getConditionById(conditionId);
  if (!condition) return { alert: null, observations: [] };

  // Buscar alerta relacionado
  let alert = null;
  if (condition.related_alert_id) {
    const { data } = await supabase
      .from("license_alerts")
      .select("*")
      .eq("id", condition.related_alert_id)
      .single();
    alert = data;
  }

  // Buscar observações relacionadas
  let observations: any[] = [];
  if (condition.related_observation_ids?.length > 0) {
    const { data } = await supabase
      .from("license_observations")
      .select("*")
      .in("id", condition.related_observation_ids);
    observations = data || [];
  }

  return { alert, observations };
};

// Adicionar anexo
export const addConditionAttachment = async (
  conditionId: string,
  fileUrl: string
): Promise<void> => {
  const condition = await getConditionById(conditionId);
  if (!condition) return;

  const updatedAttachments = [...(condition.attachment_urls || []), fileUrl];

  await supabase
    .from("license_conditions")
    .update({ attachment_urls: updatedAttachments })
    .eq("id", conditionId);
};

// Remover anexo
export const removeConditionAttachment = async (
  conditionId: string,
  fileUrl: string
): Promise<void> => {
  const condition = await getConditionById(conditionId);
  if (!condition) return;

  const updatedAttachments = (condition.attachment_urls || []).filter(
    (url) => url !== fileUrl
  );

  await supabase
    .from("license_conditions")
    .update({ attachment_urls: updatedAttachments })
    .eq("id", conditionId);
};

// Buscar condicionantes que requerem aprovação
export const getConditionsRequiringApproval = async (
  companyId: string
): Promise<any[]> => {
  const { data, error } = await supabase
    .from("license_conditions")
    .select("*")
    .eq("company_id", companyId)
    .eq("requires_approval", true)
    .eq("status", "completed")
    .is("approved_by_user_id", null)
    .order("completion_date", { ascending: false });

  if (error) throw error;
  return data || [];
};
