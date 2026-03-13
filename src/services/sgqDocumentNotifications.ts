import { supabase } from "@/integrations/supabase/client";
import { createNotificationForUser } from "./notifications";
import { logger } from "@/utils/logger";

const ACTION_URL = "/controle-documentos";
const CATEGORY = "sistema";

/**
 * Check if a notification with a given alert_key already exists (deduplication)
 */
const alertExists = async (alertKey: string): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from("notifications")
      .select("id")
      .contains("metadata", { alert_key: alertKey } as any)
      .limit(1);
    return (data && data.length > 0) || false;
  } catch {
    return false;
  }
};

// ── Event-driven notifications ──

export const notifyReviewRequested = async (
  reviewerUserId: string,
  docTitle: string,
  docId: string
): Promise<void> => {
  try {
    const alertKey = `review_requested_${docId}_${reviewerUserId}`;
    if (await alertExists(alertKey)) return;

    await createNotificationForUser(
      reviewerUserId,
      "📋 Nova Revisão Solicitada",
      `O documento "${docTitle}" foi enviado para sua revisão e aprovação.`,
      "warning",
      ACTION_URL,
      "Ver Documento",
      CATEGORY,
      "high",
      { alert_key: alertKey, docId, type: "review_requested" }
    );
  } catch (error) {
    logger.error("Error notifying review requested", error, "notification");
  }
};

export const notifyReviewApproved = async (
  requesterUserId: string,
  docTitle: string,
  docId: string,
  newVersion: number
): Promise<void> => {
  try {
    await createNotificationForUser(
      requesterUserId,
      "✅ Revisão Aprovada",
      `A revisão do documento "${docTitle}" foi aprovada. Nova versão v${newVersion} criada.`,
      "success",
      ACTION_URL,
      "Ver Documento",
      CATEGORY,
      "info",
      { docId, type: "review_approved", version: newVersion }
    );
  } catch (error) {
    logger.error("Error notifying review approved", error, "notification");
  }
};

export const notifyReviewRejected = async (
  requesterUserId: string,
  docTitle: string,
  docId: string,
  reason: string
): Promise<void> => {
  try {
    await createNotificationForUser(
      requesterUserId,
      "❌ Revisão Rejeitada",
      `A revisão do documento "${docTitle}" foi rejeitada. Motivo: ${reason || "Não informado"}`,
      "error",
      ACTION_URL,
      "Ver Documento",
      CATEGORY,
      "high",
      { docId, type: "review_rejected" }
    );
  } catch (error) {
    logger.error("Error notifying review rejected", error, "notification");
  }
};

export const notifyDocumentCreated = async (
  approverUserId: string,
  docTitle: string,
  docId: string
): Promise<void> => {
  try {
    await createNotificationForUser(
      approverUserId,
      "📄 Novo Documento SGQ Criado",
      `Você foi designado como aprovador do documento "${docTitle}".`,
      "info",
      ACTION_URL,
      "Ver Documento",
      CATEGORY,
      "info",
      { docId, type: "document_created" }
    );
  } catch (error) {
    logger.error("Error notifying document created", error, "notification");
  }
};

export const notifyApprovalRequired = async (
  approverUserId: string,
  docTitle: string,
  docId: string
): Promise<void> => {
  try {
    const alertKey = `approval_required_${docId}_${approverUserId}`;
    if (await alertExists(alertKey)) return;

    await createNotificationForUser(
      approverUserId,
      "📋 Aprovação Pendente",
      `O documento "${docTitle}" aguarda sua aprovação para ser publicado.`,
      "warning",
      ACTION_URL,
      "Aprovar Documento",
      CATEGORY,
      "high",
      { alert_key: alertKey, docId, type: "approval_required" }
    );
  } catch (error) {
    logger.error("Error notifying approval required", error, "notification");
  }
};

export const notifyReadCampaignCreated = async (
  recipientUserIds: string[],
  docTitle: string,
  docId: string,
  version: number
): Promise<void> => {
  try {
    const promises = recipientUserIds.map(async (userId) => {
      const alertKey = `read_campaign_${docId}_v${version}_${userId}`;
      if (await alertExists(alertKey)) return;

      return createNotificationForUser(
        userId,
        "📖 Documento Pendente de Leitura",
        `O documento "${docTitle}" (v${version}) requer sua confirmação de recebimento.`,
        "warning",
        ACTION_URL,
        "Confirmar Leitura",
        CATEGORY,
        "high",
        { alert_key: alertKey, docId, type: "read_campaign", version }
      );
    });
    await Promise.allSettled(promises);
  } catch (error) {
    logger.error("Error notifying read campaign", error, "notification");
  }
};

// ── Periodic expiration check ──

export const syncSgqExpirationAlerts = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get company settings for alert threshold
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    const { data: settings } = await (supabase as any)
      .from("sgq_document_settings")
      .select("default_expiring_days")
      .eq("company_id", profile.company_id)
      .maybeSingle();

    const alertDays = settings?.default_expiring_days || 30;

    // Get SGQ documents expiring within threshold or already expired
    const { data: docs } = await (supabase as any)
      .from("sgq_iso_documents")
      .select("id, title, expiration_date, elaborated_by_user_id")
      .eq("company_id", profile.company_id)
      .lte("expiration_date", new Date(Date.now() + alertDays * 86400000).toISOString().split("T")[0]);

    if (!docs || docs.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    for (const doc of docs) {
      if (!doc.elaborated_by_user_id) continue;

      const expDate = new Date(doc.expiration_date);
      const daysRemaining = Math.ceil((expDate.getTime() - today.getTime()) / 86400000);
      const isExpired = doc.expiration_date < todayStr;

      const alertKey = `sgq_expiration_${doc.id}_${doc.expiration_date}`;
      if (await alertExists(alertKey)) continue;

      const title = isExpired ? "🔴 Documento SGQ Vencido" : "🟡 Documento SGQ a Vencer";
      const message = isExpired
        ? `O documento "${doc.title}" venceu em ${new Date(doc.expiration_date).toLocaleDateString("pt-BR")}.`
        : `O documento "${doc.title}" vence em ${daysRemaining} dia(s) (${new Date(doc.expiration_date).toLocaleDateString("pt-BR")}).`;

      await createNotificationForUser(
        doc.elaborated_by_user_id,
        title,
        message,
        isExpired ? "error" : "warning",
        ACTION_URL,
        "Ver Documento",
        CATEGORY,
        isExpired ? "critical" : "high",
        { alert_key: alertKey, docId: doc.id, type: "sgq_expiration", daysRemaining }
      );
    }

    logger.debug(`SGQ expiration check complete: ${docs.length} documents checked`, "notification");
  } catch (error) {
    logger.error("Error in syncSgqExpirationAlerts", error, "notification");
  }
};
