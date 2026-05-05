import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Carrega tudo que registramos de UM usuário específico, pra alimentar
 * o drilldown (UserActivityDrawer).
 *
 * Tudo é REAL — nada de estimativa aqui. Se faltar dado é porque o
 * tracking não foi deployado ainda (sessions, time_on_page_ms,
 * eventos UI granulares). Cada bloco identifica claramente o que é
 * real e o que ainda não está sendo coletado.
 */

type Period = "7d" | "30d" | "90d";
const periodDays: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

const sinceIso = (period: Period): string =>
  new Date(Date.now() - periodDays[period] * 86_400_000).toISOString();

export type PageviewItem = {
  id: string;
  viewed_at: string;
  pathname: string;
  route_pattern: string | null;
  /** Real, vindo do exit handler. Null pré-deploy. */
  time_on_page_ms: number | null;
  /** Real, vindo do scroll listener. Null pré-deploy. */
  max_scroll_pct: number | null;
  exit_type: string | null;
  device_type: string | null;
};

export type EventItem = {
  id: string;
  created_at: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  route_pattern: string | null;
  metadata: Record<string, unknown> | null;
};

export type SessionItem = {
  id: string;
  started_at: string;
  ended_at: string | null;
  end_reason: string | null;
  active_seconds: number;
  idle_seconds: number;
  device_type: string | null;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  job_title: string | null;
  department: string | null;
};

export type UserActivity = {
  profile: UserProfile | null;
  pageviews: PageviewItem[];
  events: EventItem[];
  sessions: SessionItem[];
  totals: {
    period: Period;
    pageviews: number;
    events: number;
    sessions: number;
    /** Real (sessions). 0 antes do deploy. */
    real_active_seconds: number;
    /** Tempo entre primeira e última pageview do período (wall-clock). */
    span_seconds: number;
    distinct_routes: number;
    last_seen: string | null;
  };
};

export const useUserActivity = (userId: string | null, period: Period = "30d") => {
  return useQuery({
    queryKey: ["user-activity", userId, period],
    enabled: !!userId,
    queryFn: async (): Promise<UserActivity> => {
      if (!userId) throw new Error("userId required");
      const since = sinceIso(period);

      const profileRes = await supabase
        .from("profiles")
        .select("id, full_name, email, role, job_title, department")
        .eq("id", userId)
        .maybeSingle();

      const pageviewsRes = await supabase
        .from("page_view_logs")
        .select(
          "id, viewed_at, pathname, route_pattern, time_on_page_ms, max_scroll_pct, exit_type, device_type",
        )
        .eq("user_id", userId)
        .gte("viewed_at", since)
        .order("viewed_at", { ascending: true });

      const eventsRes = await supabase
        .from("event_logs")
        .select(
          "id, created_at, event_type, entity_type, entity_id, route_pattern, metadata",
        )
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      const sessionsRes = await supabase
        .from("user_activity_sessions")
        .select(
          "id, started_at, ended_at, end_reason, active_seconds, idle_seconds, device_type",
        )
        .eq("user_id", userId)
        .gte("started_at", since)
        .order("started_at", { ascending: false });

      const pageviews = (pageviewsRes.data ?? []) as PageviewItem[];
      const events = (eventsRes.data ?? []) as EventItem[];
      const sessions = (sessionsRes.data ?? []) as SessionItem[];

      const distinctRoutes = new Set(
        pageviews.map((p) => p.route_pattern).filter(Boolean) as string[],
      );

      const realActiveSeconds = sessions.reduce(
        (acc, s) => acc + (s.active_seconds ?? 0),
        0,
      );

      const spanSeconds =
        pageviews.length >= 2
          ? Math.floor(
              (new Date(pageviews[pageviews.length - 1].viewed_at).getTime() -
                new Date(pageviews[0].viewed_at).getTime()) /
                1000,
            )
          : 0;

      return {
        profile: (profileRes.data as UserProfile | null) ?? null,
        pageviews,
        events,
        sessions,
        totals: {
          period,
          pageviews: pageviews.length,
          events: events.length,
          sessions: sessions.length,
          real_active_seconds: realActiveSeconds,
          span_seconds: spanSeconds,
          distinct_routes: distinctRoutes.size,
          last_seen:
            pageviews.length > 0
              ? pageviews[pageviews.length - 1].viewed_at
              : null,
        },
      };
    },
    staleTime: 30_000,
  });
};
