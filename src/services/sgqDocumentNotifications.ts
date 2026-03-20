import { supabase } from "@/integrations/supabase/client";
import { AuditNotificationService } from "./auditNotifications";
import { logger } from "@/utils/logger";

const ACTION_URL = "/controle-documentos";
const sgqUrl = (docId?: string) =>
  docId ? `/controle-documentos?tab=sgq-iso&docId=${docId}` : "/controle-documentos?tab=sgq-iso";

/**
 * Resolve the company_id for a given user (needed by AuditNotificationService)
 */
const getCompanyId = async (userId: string): Promise<string | null> => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();
    return data?.company_id ?? null;
  } catch {
    return null;
  }
};

// ── Event-driven notifications ──

export const notifyApprovalRequired = async (
  approverUserId: string,
  docTitle: string,
  docId: string
): Promise<void> => {
  try {
    const companyId = await getCompanyId(approverUserId);
    if (!companyId) {
      logger.error("notifyApprovalRequired: could not resolve companyId for user", approverUserId, "notification");
      return;
    }

    logger.debug(`notifyApprovalRequired: creating notification for user=${approverUserId}, company=${companyId}, doc="${docTitle}"`, "notification");

    await AuditNotificationService.createNotification(approverUserId, companyId, {
      title: "📋 Aprovação Pendente",
      message: `O documento "${docTitle}" aguarda sua aprovação para ser publicado.`,
      notification_type: "sgq_approval_required",
      priority: "high",
      action_url: sgqUrl(docId),
    });

    logger.debug("notifyApprovalRequired: notification created successfully", "notification");
  } catch (error) {
    logger.error("Error notifying approval required", error, "notification");
  }
};

export const notifyReviewRequested = async (
  reviewerUserId: string,
  docTitle: string,
  docId: string
): Promise<void> => {
  try {
    const companyId = await getCompanyId(reviewerUserId);
    if (!companyId) return;

    await AuditNotificationService.createNotification(reviewerUserId, companyId, {
      title: "📋 Nova Revisão Solicitada",
      message: `O documento "${docTitle}" foi enviado para sua revisão e aprovação.`,
      notification_type: "sgq_review_requested",
      priority: "high",
      action_url: sgqUrl(docId),
    });
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
    const companyId = await getCompanyId(requesterUserId);
    if (!companyId) return;

    await AuditNotificationService.createNotification(requesterUserId, companyId, {
      title: "✅ Revisão Aprovada",
      message: `A revisão do documento "${docTitle}" foi aprovada. Nova versão v${newVersion} criada.`,
      notification_type: "sgq_review_approved",
      priority: "normal",
      action_url: sgqUrl(docId),
    });
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
    const companyId = await getCompanyId(requesterUserId);
    if (!companyId) return;

    await AuditNotificationService.createNotification(requesterUserId, companyId, {
      title: "❌ Revisão Rejeitada",
      message: `A revisão do documento "${docTitle}" foi rejeitada. Motivo: ${reason || "Não informado"}`,
      notification_type: "sgq_review_rejected",
      priority: "high",
      action_url: sgqUrl(docId),
    });
  } catch (error) {
    logger.error("Error notifying review rejected", error, "notification");
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
      const companyId = await getCompanyId(userId);
      if (!companyId) return;

      return AuditNotificationService.createNotification(userId, companyId, {
        title: "📖 Documento Pendente de Leitura",
        message: `O documento "${docTitle}" (v${version}) requer sua confirmação de recebimento.`,
        notification_type: "sgq_read_campaign",
        priority: "high",
        action_url: sgqUrl(docId),
      });
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

    const { data: docs } = await (supabase as any)
      .from("sgq_iso_documents")
      .select("id, title, expiration_date, elaborated_by_user_id")
      .eq("company_id", profile.company_id)
      .eq("is_approved", true)
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

      const title = isExpired ? "🔴 Documento SGQ Vencido" : "🟡 Documento SGQ a Vencer";
      const message = isExpired
        ? `O documento "${doc.title}" venceu em ${new Date(doc.expiration_date).toLocaleDateString("pt-BR")}.`
        : `O documento "${doc.title}" vence em ${daysRemaining} dia(s) (${new Date(doc.expiration_date).toLocaleDateString("pt-BR")}).`;

      await AuditNotificationService.createNotification(doc.elaborated_by_user_id, profile.company_id, {
        title,
        message,
        notification_type: isExpired ? "sgq_expired" : "sgq_expiring",
        priority: isExpired ? "critical" : "high",
        action_url: sgqUrl(doc.id),
      });
    }

    logger.debug(`SGQ expiration check complete: ${docs.length} documents checked`, "notification");
  } catch (error) {
    logger.error("Error in syncSgqExpirationAlerts", error, "notification");
  }
};
