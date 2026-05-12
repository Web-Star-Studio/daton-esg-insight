// Página admin de operação do watchdog de legislações.
//
// Roda manual durante fase de teste. Mostra últimas execuções com métricas
// operacionais (normas checadas, mudanças detectadas, custo, duração). O
// disparo grava `watchdog_run_audit` + escreve em `legislation_change_events`
// pra cada mudança detectada — consumido depois pela Carta Mensal.

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  TimerReset,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useHasRole } from "@/middleware/roleGuard";
import {
  listRecentWatchdogRuns,
  triggerWatchdog,
  type WatchdogAuditRow,
} from "@/services/legislationWatchdog";

const STATUS_VARIANT: Record<WatchdogAuditRow["status"], "default" | "destructive" | "secondary"> = {
  completed: "default",
  failed: "destructive",
  running: "secondary",
};

const formatDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
};

const formatDuration = (ms: number | null): string => {
  if (!ms) return "—";
  if (ms < 1000) return `${ms} ms`;
  const sec = Math.round(ms / 100) / 10;
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = Math.round(sec - min * 60);
  return `${min}m ${remSec}s`;
};

const formatCost = (usd: number | null | undefined): string => {
  if (usd == null) return "—";
  if (usd === 0) return "$0,0000";
  if (usd < 0.0001) return "<$0,0001";
  return `$${usd.toFixed(4)}`;
};

export default function LegislationWatchdogPage() {
  const isAdmin = useHasRole(["admin", "platform_admin"]);
  const [maxUniqueNormas, setMaxUniqueNormas] = useState<number>(50);

  const { data: runs, isLoading, refetch } = useQuery({
    queryKey: ["watchdog-runs"],
    queryFn: () => listRecentWatchdogRuns(20),
    enabled: isAdmin,
    refetchInterval: 10_000,
  });

  const triggerMutation = useMutation({
    mutationFn: () =>
      triggerWatchdog({
        scope: "global",
        max_unique_normas: maxUniqueNormas,
      }),
    onSuccess: (data) => {
      toast.success(
        `Watchdog concluído. ${data.normas_checked} normas checadas, ${data.change_events_created} mudanças detectadas. Custo: ${formatCost(data.total_cost_usd)}`,
      );
      void refetch();
    },
    onError: (err: Error) => {
      toast.error(`Watchdog falhou: ${err.message}`);
    },
  });

  if (!isAdmin) {
    return (
      <div className="w-full overflow-hidden py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Página restrita a admin/platform_admin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const lastCompleted = runs?.find((r) => r.status === "completed");
  const isRunning = triggerMutation.isPending || runs?.some((r) => r.status === "running");

  return (
    <div className="w-full overflow-hidden py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Watchdog de Legislações</h1>
        <p className="text-muted-foreground">
          Varre as legislações vinculadas detectando alteração, revogação ou supersedência via Perplexity Sonar.
          Dedup compute-time: cada norma única (norm_type|norm_number|issuing_body|publication_date) é checada 1× e o resultado é fan-out pras companies afetadas.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disparar execução</CardTitle>
          <CardDescription>
            Por padrão varre escopo global. O cap protege contra surprise bill — comece baixo (50) e suba aos poucos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="max-unique">Máximo de normas únicas a checar</Label>
              <Input
                id="max-unique"
                type="number"
                min={1}
                max={10000}
                value={maxUniqueNormas}
                onChange={(e) => setMaxUniqueNormas(Math.max(1, Math.min(10000, Number(e.target.value) || 1)))}
                disabled={isRunning}
              />
              <p className="text-xs text-muted-foreground">
                ~$0,001 por norma. 50 normas ≈ $0,05.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => triggerMutation.mutate()}
              disabled={isRunning}
              size="lg"
            >
              {triggerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Rodar watchdog agora
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {triggerMutation.isPending ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Em execução. Pode levar alguns minutos dependendo do volume — não feche a página.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      {lastCompleted ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Última execução concluída
            </CardTitle>
            <CardDescription>{formatDateTime(lastCompleted.finished_at)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-sm">
              <Stat label="Normas totais" value={lastCompleted.normas_total.toLocaleString("pt-BR")} />
              <Stat label="Únicas (deduped)" value={lastCompleted.normas_unique.toLocaleString("pt-BR")} />
              <Stat label="Checadas" value={lastCompleted.normas_checked.toLocaleString("pt-BR")} />
              <Stat label="Mudanças" value={lastCompleted.change_events_created.toLocaleString("pt-BR")} />
              <Stat label="Custo" value={formatCost(lastCompleted.total_cost_usd)} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Execuções recentes</CardTitle>
          <CardDescription>Histórico das últimas 20 execuções do watchdog.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : !runs || runs.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <TimerReset className="h-6 w-6 mx-auto mb-2 opacity-50" />
              Nenhuma execução ainda. Dispare a primeira pelo botão acima.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Únicas</TableHead>
                  <TableHead className="text-right">Checadas</TableHead>
                  <TableHead className="text-right">Mudanças</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(r.started_at)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                      {r.error_text ? (
                        <div className="text-xs text-destructive mt-1 max-w-[24rem] truncate" title={r.error_text}>
                          {r.error_text}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{r.normas_unique.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{r.normas_checked.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{r.change_events_created.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-right">{formatCost(r.total_cost_usd)}</TableCell>
                    <TableCell className="text-right">{formatDuration(r.duration_ms)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
