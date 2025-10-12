import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type LicenseAlertRow = Database['public']['Tables']['license_alerts']['Row'];

export interface LicenseAlert extends LicenseAlertRow {}

// Buscar alertas de uma licença
export const getLicenseAlerts = async (licenseId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from("license_alerts")
    .select("*")
    .eq("license_id", licenseId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

// Resolver alerta
export const resolveAlert = async (alertId: string, notes?: string): Promise<void> => {
  const { error } = await supabase
    .from("license_alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  if (error) throw error;

  // Registrar no histórico se houver notas
  if (notes) {
    const { data: alert } = await supabase
      .from("license_alerts")
      .select("license_id, company_id")
      .eq("id", alertId)
      .single();

    if (alert) {
      const { data: userData } = await supabase.auth.getUser();
      
      await supabase.from("license_action_history").insert({
        company_id: alert.company_id,
        license_id: alert.license_id,
        action_type: "alert_resolved",
        action_target_type: "alert",
        action_target_id: alertId,
        user_id: userData.user?.id,
        description: `Alerta resolvido: ${notes}`,
      } as any);
    }
  }
};

// Adiar alerta
export const snoozeAlert = async (
  alertId: string,
  snoozeUntil: Date,
  reason?: string
): Promise<void> => {
  const { error } = await supabase
    .from("license_alerts")
    .update({
      snooze_until: snoozeUntil.toISOString(),
    })
    .eq("id", alertId);

  if (error) throw error;

  // Registrar no histórico
  const { data: alert } = await supabase
    .from("license_alerts")
    .select("license_id, company_id")
    .eq("id", alertId)
    .single();

  if (alert) {
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase.from("license_action_history").insert({
      company_id: alert.company_id,
      license_id: alert.license_id,
      action_type: "alert_snoozed",
      action_target_type: "alert",
      action_target_id: alertId,
      user_id: userData.user?.id,
      description: `Alerta adiado até ${snoozeUntil.toLocaleDateString("pt-BR")}${
        reason ? `: ${reason}` : ""
      }`,
    } as any);
  }
};

// Criar alerta de condicionante
export const createAlertFromCondition = async (
  conditionId: string,
  licenseId: string
): Promise<any> => {
  const { data: condition } = await supabase
    .from("license_conditions")
    .select("*")
    .eq("id", conditionId)
    .single();

  if (!condition) throw new Error("Condicionante não encontrada");

  const { data, error } = await supabase
    .from("license_alerts")
    .insert({
      company_id: condition.company_id,
      license_id: licenseId,
      alert_type: "condition_due",
      severity: condition.priority === "high" ? "critical" : "medium",
      title: "Condicionante vencendo",
      message: `A condicionante "${condition.condition_text}" está próxima do vencimento`,
      due_date: condition.due_date,
      action_required: true,
      source_condition_id: conditionId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Atribuir alerta a usuário
export const assignAlert = async (
  alertId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from("license_alerts")
    .update({
      // Assumindo que existe um campo assigned_to no futuro
      // Por enquanto, só registra no histórico
    })
    .eq("id", alertId);

  if (error) throw error;

  const { data: alert } = await supabase
    .from("license_alerts")
    .select("license_id, title, company_id")
    .eq("id", alertId)
    .single();

  if (alert) {
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase.from("license_action_history").insert({
      company_id: alert.company_id,
      license_id: alert.license_id,
      action_type: "alert_assigned",
      action_target_type: "alert",
      action_target_id: alertId,
      user_id: userData.user?.id,
      description: `Alerta "${alert.title}" atribuído`,
    } as any);
  }
};

// Buscar origem do alerta
export const getAlertSource = async (alertId: string) => {
  const { data: alert } = await supabase
    .from("license_alerts")
    .select("*")
    .eq("id", alertId)
    .single();

  if (!alert) return null;

  let sourceData = null;

  if (alert.source_condition_id) {
    const { data: condition } = await supabase
      .from("license_conditions")
      .select("*")
      .eq("id", alert.source_condition_id)
      .single();

    sourceData = {
      type: "condition" as const,
      sourceId: alert.source_condition_id,
      sourceData: condition,
    };
  } else if (alert.related_observation_id) {
    const { data: observation } = await supabase
      .from("license_observations")
      .select("*")
      .eq("id", alert.related_observation_id)
      .single();

    sourceData = {
      type: "observation" as const,
      sourceId: alert.related_observation_id,
      sourceData: observation,
    };
  } else {
    sourceData = {
      type: "automatic" as const,
      sourceId: alertId,
      sourceData: alert,
    };
  }

  return sourceData;
};
