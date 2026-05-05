import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminAuditLogs,
  type AdminAuditLog,
} from "@/hooks/useAdminAuditLogs";

/**
 * Aba "Auditoria Admin" — leitura da `admin_audit_logs` (append-only).
 *
 * Diferença pro `AuditTrailModule` existente: aqui é especificamente
 * sobre ações de **admin de plataforma** (Webstar / Daton) tomadas
 * sobre dados de clientes — não auditoria interna do cliente.
 *
 * Filtros: período + tipo de ação + tipo de alvo.
 * Cada linha mostra o diff (before → after) expansível.
 */

type Period = "24h" | "7d" | "30d" | "90d";

const ACTION_LABELS: Record<string, { label: string; tone: "default" | "danger" | "warning" }> = {
  impersonate_start: { label: "Impersonar usuário", tone: "warning" },
  impersonate_end: { label: "Encerrar impersonate", tone: "default" },
  suspend_company: { label: "Suspender empresa", tone: "danger" },
  unsuspend_company: { label: "Reativar empresa", tone: "default" },
  change_company_plan: { label: "Mudar plano", tone: "warning" },
  delete_company: { label: "Deletar empresa", tone: "danger" },
  invite_user: { label: "Convidar usuário", tone: "default" },
  change_user_role: { label: "Mudar role", tone: "warning" },
  deactivate_user: { label: "Desativar usuário", tone: "warning" },
  reactivate_user: { label: "Reativar usuário", tone: "default" },
  delete_user: { label: "Deletar usuário", tone: "danger" },
  reset_user_password: { label: "Reset de senha", tone: "warning" },
  export_company_data: { label: "Exportar dados (empresa)", tone: "warning" },
  export_user_data: { label: "Exportar dados (usuário)", tone: "warning" },
  modify_settings: { label: "Modificar config", tone: "warning" },
  apply_data_correction: { label: "Correção de dado", tone: "warning" },
  other: { label: "Outro", tone: "default" },
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });

const tone = (action: string) => {
  const meta = ACTION_LABELS[action];
  if (!meta) return "default";
  return meta.tone;
};

const ActionBadge = ({ action }: { action: string }) => {
  const meta = ACTION_LABELS[action] ?? { label: action, tone: "default" as const };
  const variant =
    meta.tone === "danger"
      ? "destructive"
      : meta.tone === "warning"
        ? "secondary"
        : "outline";
  return <Badge variant={variant}>{meta.label}</Badge>;
};

const AuditRow = ({ log }: { log: AdminAuditLog }) => {
  const [expanded, setExpanded] = useState(false);
  const hasDiff =
    (log.before_value && Object.keys(log.before_value).length > 0) ||
    (log.after_value && Object.keys(log.after_value).length > 0);

  return (
    <>
      <TableRow
        className={hasDiff ? "cursor-pointer hover:bg-muted/50" : ""}
        onClick={() => hasDiff && setExpanded((v) => !v)}
      >
        <TableCell className="text-xs whitespace-nowrap">
          {formatDateTime(log.occurred_at)}
        </TableCell>
        <TableCell>
          <ActionBadge action={log.action_type} />
        </TableCell>
        <TableCell className="text-xs">
          <div className="font-medium">{log.actor_email ?? "—"}</div>
          {log.actor_role && (
            <div className="text-[10px] text-muted-foreground">
              {log.actor_role}
            </div>
          )}
        </TableCell>
        <TableCell className="text-xs">
          {log.target_label ?? log.target_id ?? "—"}
          {log.target_type && (
            <div className="text-[10px] text-muted-foreground">
              {log.target_type}
            </div>
          )}
        </TableCell>
        <TableCell className="text-xs max-w-xs truncate" title={log.reason ?? undefined}>
          {log.reason ?? <span className="text-muted-foreground italic">sem reason</span>}
        </TableCell>
      </TableRow>
      {expanded && hasDiff && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-3">
            <div className="grid gap-2 md:grid-cols-2 text-xs">
              <div>
                <div className="font-medium mb-1">Antes</div>
                <pre className="bg-background border rounded p-2 overflow-x-auto text-[10px]">
                  {JSON.stringify(log.before_value ?? {}, null, 2)}
                </pre>
              </div>
              <div>
                <div className="font-medium mb-1">Depois</div>
                <pre className="bg-background border rounded p-2 overflow-x-auto text-[10px]">
                  {JSON.stringify(log.after_value ?? {}, null, 2)}
                </pre>
              </div>
            </div>
            {log.request_id && (
              <div className="text-[10px] text-muted-foreground mt-2">
                request_id: {log.request_id}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const AdminAuditTab = () => {
  const [period, setPeriod] = useState<Period>("30d");
  const [actionType, setActionType] = useState<string>("all");

  const { data, isLoading } = useAdminAuditLogs({
    period,
    actionType: actionType === "all" ? null : actionType,
  });

  const dangerCount = (data ?? []).filter(
    (l) => tone(l.action_type) === "danger",
  ).length;
  const warningCount = (data ?? []).filter(
    (l) => tone(l.action_type) === "warning",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Auditoria Admin
          </h2>
          <p className="text-sm text-muted-foreground">
            Ações sensíveis tomadas por administradores da plataforma
            sobre dados de clientes. Append-only — entradas não podem
            ser editadas ou deletadas.
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as Period)}
          className="w-fit"
        >
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ações destrutivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${dangerCount > 0 ? "text-red-700" : ""}`}
            >
              {dangerCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              suspend, delete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ações sensíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${warningCount > 0 ? "text-amber-700" : ""}`}
            >
              {warningCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              impersonate, plan change, role change, exports
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Filtrar por ação:</span>
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger className="w-[260px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Trilha de auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma ação de admin registrada no período. Quando ações
              forem instrumentadas (via <code>withAdminAudit</code>),
              aparecerão aqui.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Ator</TableHead>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
