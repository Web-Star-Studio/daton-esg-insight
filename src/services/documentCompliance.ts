import { supabase } from "@/integrations/supabase/client";
import { createNotificationForUser } from "@/services/notifications";
import { getRegulatoryDocuments } from "@/services/regulatoryDocuments";

export type DispositionAction = "arquivar" | "destruir";

export interface BackupHealthCheckResult {
  executedAt: string;
  overallStatus: "healthy" | "warning" | "critical";
  checks: Array<{
    key: string;
    label: string;
    status: "ok" | "warning" | "error";
    details: string;
  }>;
}

export interface PendingDispositionDocument {
  id: string;
  file_name: string;
  upload_date: string;
  retention_period: string;
  due_date: string;
  days_overdue: number;
  approval_status: string | null;
}

export const NAMED_DOCUMENT_GROUPS = [
  {
    name: "Administradores SGQ",
    description: "Controle total de documentos e permissões",
    defaultPermissionLevel: "admin",
  },
  {
    name: "Auditores",
    description: "Leitura e aprovação para auditorias internas/externas",
    defaultPermissionLevel: "aprovacao",
  },
  {
    name: "Gestores de Processo",
    description: "Edição e manutenção documental",
    defaultPermissionLevel: "escrita",
  },
  {
    name: "Colaboradores",
    description: "Acesso de leitura para distribuição controlada",
    defaultPermissionLevel: "leitura",
  },
] as const;

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
    throw new Error("Empresa do usuário não encontrada");
  }

  return {
    user,
    companyId: profile.company_id,
  };
};

const parseIntervalToDays = (interval: string | null): number | null => {
  if (!interval) return null;

  const unitToDays: Record<string, number> = {
    year: 365,
    years: 365,
    mon: 30,
    mons: 30,
    month: 30,
    months: 30,
    day: 1,
    days: 1,
    hour: 1 / 24,
    hours: 1 / 24,
  };

  const regex = /(-?\d+)\s*(year|years|mon|mons|month|months|day|days|hour|hours)/gi;
  let match: RegExpExecArray | null;
  let totalDays = 0;

  while ((match = regex.exec(interval)) !== null) {
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    totalDays += amount * (unitToDays[unit] || 0);
  }

  if (!Number.isFinite(totalDays) || totalDays <= 0) {
    return null;
  }

  return Math.ceil(totalDays);
};

const toDateOnly = (date: Date) => date.toISOString().split("T")[0];

export const getNamedDocumentGroups = () => NAMED_DOCUMENT_GROUPS;

export const getCurrentUserReadConfirmationMap = async (
  documentIds: string[],
): Promise<Record<string, boolean>> => {
  if (!documentIds.length) return {};

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {};
  }

  const { data, error } = await supabase
    .from("document_audit_trail")
    .select("document_id")
    .in("document_id", documentIds)
    .eq("action", "READ_CONFIRMATION")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Erro ao carregar confirmações de leitura: ${error.message}`);
  }

  return (data || []).reduce<Record<string, boolean>>((acc, row) => {
    acc[row.document_id] = true;
    return acc;
  }, {});
};

export const confirmDocumentRead = async (
  documentId: string,
  declaration: string = "Leitura confirmada",
): Promise<void> => {
  const { user } = await getCurrentUserAndCompany();

  const { data: existing, error: existingError } = await supabase
    .from("document_audit_trail")
    .select("id")
    .eq("document_id", documentId)
    .eq("action", "READ_CONFIRMATION")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Erro ao verificar confirmação de leitura: ${existingError.message}`);
  }

  if (existing?.id) return;

  const { error } = await supabase.from("document_audit_trail").insert({
    document_id: documentId,
    action: "READ_CONFIRMATION",
    user_id: user.id,
    details: declaration,
    new_values: {
      confirmed_at: new Date().toISOString(),
      declaration,
    },
  });

  if (error) {
    throw new Error(`Erro ao registrar confirmação de leitura: ${error.message}`);
  }
};

export const runBackupHealthCheck = async (): Promise<BackupHealthCheckResult> => {
  const { user, companyId } = await getCurrentUserAndCompany();
  const executedAt = new Date().toISOString();

  const checks: BackupHealthCheckResult["checks"] = [];

  const docsCheck = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (docsCheck.error) {
    checks.push({
      key: "db_documents",
      label: "Banco de dados (documentos)",
      status: "error",
      details: docsCheck.error.message,
    });
  } else {
    checks.push({
      key: "db_documents",
      label: "Banco de dados (documentos)",
      status: "ok",
      details: `Conectado. Total de documentos visíveis: ${docsCheck.count ?? 0}.`,
    });
  }

  const versionsCheck = await supabase
    .from("document_versions")
    .select("id, documents!inner(company_id)", { count: "exact", head: true })
    .eq("documents.company_id", companyId);

  if (versionsCheck.error) {
    checks.push({
      key: "db_versions",
      label: "Banco de dados (versionamento)",
      status: "error",
      details: versionsCheck.error.message,
    });
  } else {
    checks.push({
      key: "db_versions",
      label: "Banco de dados (versionamento)",
      status: "ok",
      details: `Conectado. Total de versões: ${versionsCheck.count ?? 0}.`,
    });
  }

  const storageCheck = await supabase.storage.from("documents").list("", { limit: 1 });

  if (storageCheck.error) {
    checks.push({
      key: "storage_documents",
      label: "Storage (bucket documents)",
      status: "error",
      details: storageCheck.error.message,
    });
  } else {
    checks.push({
      key: "storage_documents",
      label: "Storage (bucket documents)",
      status: "ok",
      details: "Bucket acessível para leitura.",
    });
  }

  const failedChecks = checks.filter((check) => check.status === "error");
  const warningChecks = checks.filter((check) => check.status === "warning");

  const overallStatus: BackupHealthCheckResult["overallStatus"] = failedChecks.length
    ? "critical"
    : warningChecks.length
      ? "warning"
      : "healthy";

  if (overallStatus !== "healthy") {
    const alertKey = `backup-health-${toDateOnly(new Date(executedAt))}`;

    const { data: existingNotification } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("category", "document_backup")
      .contains("metadata", { alert_key: alertKey })
      .limit(1)
      .maybeSingle();

    if (!existingNotification?.id) {
      await createNotificationForUser(
        user.id,
        "Alerta de saúde do GED",
        `Foram detectadas ${failedChecks.length} falha(s) no check de backup/saúde documental.`,
        "warning",
        "/controle-documentos",
        "Abrir Controle de Documentos",
        "document_backup",
        "high",
        {
          alert_key: alertKey,
          executed_at: executedAt,
          checks,
        },
      );
    }
  }

  return {
    executedAt,
    overallStatus,
    checks,
  };
};

export const getPendingDocumentDispositions = async (): Promise<PendingDispositionDocument[]> => {
  const { companyId } = await getCurrentUserAndCompany();

  const { data, error } = await supabase
    .from("documents")
    .select("id, file_name, upload_date, retention_period, approval_status")
    .eq("company_id", companyId)
    .not("retention_period", "is", null);

  if (error) {
    throw new Error(`Erro ao carregar documentos para disposição: ${error.message}`);
  }

  const today = new Date();

  const pending = (data || [])
    .map((doc) => {
      const retentionDays = parseIntervalToDays(doc.retention_period);
      if (!retentionDays) return null;

      const uploadDate = new Date(doc.upload_date);
      const dueDate = new Date(uploadDate);
      dueDate.setDate(dueDate.getDate() + retentionDays);

      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue < 0) return null;

      return {
        id: doc.id,
        file_name: doc.file_name,
        upload_date: doc.upload_date,
        retention_period: doc.retention_period || "",
        due_date: toDateOnly(dueDate),
        days_overdue: daysOverdue,
        approval_status: doc.approval_status,
      } satisfies PendingDispositionDocument;
    })
    .filter((doc): doc is PendingDispositionDocument => !!doc && doc.approval_status !== "obsoleto")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  return pending;
};

export const applyDocumentDisposition = async (
  documentId: string,
  action: DispositionAction,
  reason: string,
): Promise<void> => {
  const { user } = await getCurrentUserAndCompany();

  const { error } = await (supabase as any).rpc("apply_document_disposition", {
    p_document_id: documentId,
    p_action: action,
    p_reason: reason,
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(`Erro ao aplicar disposição documental: ${error.message}`);
  }
};

export const syncRegulatoryReviewAlerts = async (): Promise<{
  scanned: number;
  alertsCreated: number;
}> => {
  const today = toDateOnly(new Date());
  const docs = await getRegulatoryDocuments();
  const actionableDocs = docs.filter(
    (doc) => !!doc.responsible_user_id && doc.status !== "Vigente",
  );

  const alertKeyByDocument = new Map(
    actionableDocs.map((doc) => [doc.id, `reg-review-${doc.id}-${doc.status}-${today}`]),
  );

  const targetUserIds = Array.from(
    new Set(actionableDocs.map((doc) => doc.responsible_user_id as string)),
  );

  let existingAlertKeys = new Set<string>();
  if (targetUserIds.length > 0) {
    const { data: existingNotifications, error: existingNotificationsError } = await supabase
      .from("notifications")
      .select("metadata")
      .eq("category", "regulatory_documents")
      .in("user_id", targetUserIds)
      .gte("created_at", `${today}T00:00:00`);

    if (existingNotificationsError) {
      throw new Error(`Erro ao carregar alertas regulatórios existentes: ${existingNotificationsError.message}`);
    }

    existingAlertKeys = new Set(
      (existingNotifications || [])
        .map((notification) => {
          const metadata = notification.metadata as { alert_key?: string } | null;
          return metadata?.alert_key;
        })
        .filter((alertKey): alertKey is string => !!alertKey),
    );
  }

  let alertsCreated = 0;

  for (const doc of actionableDocs) {
    const alertKey = alertKeyByDocument.get(doc.id);
    if (!alertKey || existingAlertKeys.has(alertKey)) continue;

    const title =
      doc.status === "Vencido"
        ? `Documento regulatório vencido: ${doc.document_number || doc.document_identifier_type || doc.id}`
        : `Documento regulatório a vencer: ${doc.document_number || doc.document_identifier_type || doc.id}`;

    const message =
      doc.status === "Vencido"
        ? `O documento venceu em ${new Date(`${doc.expiration_date}T00:00:00`).toLocaleDateString("pt-BR")}. Regularize imediatamente.`
        : `O documento vence em ${doc.days_remaining} dia(s) (${new Date(`${doc.expiration_date}T00:00:00`).toLocaleDateString("pt-BR")}).`;

    const notification = await createNotificationForUser(
      doc.responsible_user_id,
      title,
      message,
      doc.status === "Vencido" ? "error" : "warning",
      "/controle-documentos",
      "Abrir documentos regulatórios",
      "regulatory_documents",
      doc.status === "Vencido" ? "high" : "medium",
      {
        alert_key: alertKey,
        document_id: doc.id,
        expiration_date: doc.expiration_date,
        days_remaining: doc.days_remaining,
        status: doc.status,
      },
    );

    if (notification?.id) {
      alertsCreated += 1;
      existingAlertKeys.add(alertKey);
    }
  }

  return {
    scanned: docs.length,
    alertsCreated,
  };
};
