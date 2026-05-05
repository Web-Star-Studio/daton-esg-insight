import { useMemo, useState } from "react";
import { Activity, Clock, Eye, FileText, Globe } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUserActivity,
  type EventItem,
  type PageviewItem,
} from "@/hooks/useUserActivity";

/**
 * Drilldown lateral pra um usuário específico — abre quando você clica
 * numa linha da tabela de top users.
 *
 * O que mostra:
 *   • Header: identidade + KPIs (pageviews, eventos, sessões, último visto)
 *   • Timeline: pageviews + eventos mesclados por timestamp
 *   • Cada pageview tem GAP até a próxima (estimado quando real ainda
 *     não medido — claramente marcado)
 *   • Sessões reais (vazio antes do deploy do useSessionTracking)
 *
 * REGRA ABSOLUTA: o que é real está sem prefixo; o que é estimado
 * tem badge "estimado" pra evitar confusão em reuniões.
 */

type Period = "7d" | "30d" | "90d";

type Props = {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  return `${hours}h ${restMin}min`;
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", { timeStyle: "medium" });

type TimelineEntry =
  | { kind: "pageview"; ts: string; data: PageviewItem; gapToNextSec: number | null; realTimeOnPageMs: number | null }
  | { kind: "event"; ts: string; data: EventItem };

const buildTimeline = (
  pageviews: PageviewItem[],
  events: EventItem[],
): TimelineEntry[] => {
  const pvEntries: TimelineEntry[] = pageviews.map((pv, i) => {
    const next = pageviews[i + 1];
    let gapSec: number | null = null;
    if (next) {
      const diff = Math.floor(
        (new Date(next.viewed_at).getTime() -
          new Date(pv.viewed_at).getTime()) /
          1000,
      );
      // Gap > 30 min = nova sessão; descarta como tempo em página
      if (diff > 0 && diff < 1800) gapSec = diff;
    }
    return {
      kind: "pageview",
      ts: pv.viewed_at,
      data: pv,
      gapToNextSec: gapSec,
      realTimeOnPageMs: pv.time_on_page_ms,
    };
  });

  const evEntries: TimelineEntry[] = events.map((ev) => ({
    kind: "event",
    ts: ev.created_at,
    data: ev,
  }));

  return [...pvEntries, ...evEntries].sort((a, b) =>
    a.ts.localeCompare(b.ts),
  );
};

const PageviewRow = ({
  entry,
}: {
  entry: Extract<TimelineEntry, { kind: "pageview" }>;
}) => {
  const { data, gapToNextSec, realTimeOnPageMs } = entry;

  return (
    <div className="flex gap-3 border-l-2 border-blue-500 pl-3 py-1.5">
      <Eye className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <code className="text-xs font-mono">
            {data.route_pattern ?? data.pathname}
          </code>
          <span className="text-xs text-muted-foreground">
            {formatTime(data.viewed_at)}
          </span>
          {data.device_type && (
            <Badge variant="outline" className="text-[10px]">
              {data.device_type}
            </Badge>
          )}
          {data.exit_type && (
            <Badge variant="outline" className="text-[10px]">
              exit: {data.exit_type}
            </Badge>
          )}
        </div>
        {data.pathname !== data.route_pattern && (
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {data.pathname}
          </div>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs">
          {realTimeOnPageMs !== null ? (
            <span className="text-emerald-600 font-medium">
              ⏱ {Math.round(realTimeOnPageMs / 1000)}s na página{" "}
              <span className="text-muted-foreground font-normal">
                (real)
              </span>
            </span>
          ) : gapToNextSec !== null ? (
            <span className="text-muted-foreground">
              ⏱ ~{formatDuration(gapToNextSec)}{" "}
              <Badge variant="secondary" className="text-[9px] ml-1">
                estimado
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground/60">
              tempo na página: não medido
            </span>
          )}
          {data.max_scroll_pct !== null && (
            <span className="text-muted-foreground">
              📜 {data.max_scroll_pct}% scroll
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const EventRow = ({
  entry,
}: {
  entry: Extract<TimelineEntry, { kind: "event" }>;
}) => {
  const { data } = entry;
  const eventColor =
    data.event_type === "login"
      ? "border-emerald-500 text-emerald-600"
      : data.event_type === "logout"
        ? "border-orange-500 text-orange-600"
        : "border-purple-500 text-purple-600";

  return (
    <div className={`flex gap-3 border-l-2 pl-3 py-1.5 ${eventColor.split(" ")[0]}`}>
      <Activity className={`h-4 w-4 mt-0.5 shrink-0 ${eventColor.split(" ")[1]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{data.event_type}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(data.created_at)}
          </span>
          {data.entity_id && (
            <Badge variant="outline" className="text-[10px] font-mono">
              {data.entity_id}
            </Badge>
          )}
        </div>
        {data.metadata && Object.keys(data.metadata).length > 0 && (
          <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
            {JSON.stringify(data.metadata).slice(0, 120)}
          </div>
        )}
      </div>
    </div>
  );
};

const Kpi = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) => (
  <div className="rounded-md border p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-xl font-semibold mt-0.5">{value}</div>
    {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
  </div>
);

export const UserActivityDrawer = ({ userId, open, onOpenChange }: Props) => {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading } = useUserActivity(userId, period);

  const timeline = useMemo(
    () =>
      data ? buildTimeline(data.pageviews, data.events) : [],
    [data],
  );

  const estimatedTotalSeconds = useMemo(() => {
    if (!data) return 0;
    return timeline
      .filter((e): e is Extract<TimelineEntry, { kind: "pageview" }> => e.kind === "pageview")
      .reduce((acc, e) => {
        if (e.realTimeOnPageMs !== null) return acc + Math.round(e.realTimeOnPageMs / 1000);
        if (e.gapToNextSec !== null) return acc + Math.min(e.gapToNextSec, 300);
        return acc;
      }, 0);
  }, [data, timeline]);

  const hasRealTime = useMemo(
    () =>
      data
        ? data.pageviews.some((p) => p.time_on_page_ms !== null) ||
          data.sessions.length > 0
        : false,
    [data],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {!userId || isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{data.profile?.full_name ?? "Usuário"}</SheetTitle>
              <SheetDescription className="space-y-0.5">
                <div>{data.profile?.email}</div>
                {(data.profile?.job_title || data.profile?.department) && (
                  <div className="text-xs">
                    {[data.profile?.job_title, data.profile?.department]
                      .filter(Boolean)
                      .join(" — ")}
                  </div>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="flex justify-end mt-4">
              <Tabs
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
                className="w-fit"
              >
                <TabsList>
                  <TabsTrigger value="7d">7d</TabsTrigger>
                  <TabsTrigger value="30d">30d</TabsTrigger>
                  <TabsTrigger value="90d">90d</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Kpi
                label="Pageviews"
                value={String(data.totals.pageviews)}
                hint={`${data.totals.distinct_routes} rotas únicas`}
              />
              <Kpi
                label="Eventos"
                value={String(data.totals.events)}
                hint="login, logout, ações UI"
              />
              <Kpi
                label="Sessões registradas"
                value={String(data.totals.sessions)}
                hint={
                  data.totals.sessions === 0
                    ? "tracking sessions ainda não deployado"
                    : `${formatDuration(data.totals.real_active_seconds)} ativos`
                }
              />
              <Kpi
                label={hasRealTime ? "Tempo total" : "Tempo total (estimado)"}
                value={formatDuration(
                  data.totals.real_active_seconds || estimatedTotalSeconds,
                )}
                hint={
                  hasRealTime
                    ? "real (sessions + pageviews)"
                    : "via gap entre pageviews"
                }
              />
            </div>

            {!hasRealTime && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <strong>Aviso:</strong> tracking enriquecido (tempo na
                página, sessões com heartbeat) ainda não foi deployado.
                Tempos abaixo são estimados via gap entre pageviews
                consecutivos. Após o deploy, a maioria dos números fica
                real automaticamente.
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Timeline cronológica ({timeline.length} entradas)
              </h3>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem atividade no período.
                </p>
              ) : (
                <div className="space-y-2">
                  {timeline.map((entry, i) =>
                    entry.kind === "pageview" ? (
                      <PageviewRow key={`pv-${entry.data.id}-${i}`} entry={entry} />
                    ) : (
                      <EventRow key={`ev-${entry.data.id}-${i}`} entry={entry} />
                    ),
                  )}
                </div>
              )}
            </div>

            {data.sessions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Sessões ({data.sessions.length})
                </h3>
                <div className="space-y-2">
                  {data.sessions.map((s) => (
                    <div key={s.id} className="rounded-md border p-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="h-3 w-3" />
                        <span>{formatDateTime(s.started_at)}</span>
                        <span>→</span>
                        <span>
                          {s.ended_at ? formatDateTime(s.ended_at) : "em curso"}
                        </span>
                        {s.end_reason && (
                          <Badge variant="outline" className="text-[10px]">
                            {s.end_reason}
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        Ativo: {formatDuration(s.active_seconds)} · Idle:{" "}
                        {formatDuration(s.idle_seconds)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
