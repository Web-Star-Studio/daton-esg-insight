import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Atividade agregada de UMA rota (`route_pattern`) — alimenta o
 * RouteActivityDrawer. Simétrico ao `useUserActivity` mas com foco
 * na rota: quem acessou, com que frequência, quais eventos.
 *
 * Tudo é REAL — nada de estimativa. Tempo na página só fica preenchido
 * pós-deploy do `usePageTracking` enriquecido.
 */

const GABARDO_COMPANY_ID = "021647af-61a5-4075-9db3-bb5024ef7a67";

type Period = "7d" | "30d" | "90d";
const periodDays: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

const sinceIso = (period: Period): string =>
  new Date(Date.now() - periodDays[period] * 86_400_000).toISOString();

export type RouteUserRow = {
  user_id: string;
  full_name: string | null;
  pageviews: number;
  total_time_on_page_ms: number;
  last_seen: string;
};

export type RouteEventRow = {
  event_type: string;
  count: number;
  last_seen: string;
};

export type RouteDailyPoint = {
  day: string;
  pageviews: number;
  unique_users: number;
};

export type RouteActivity = {
  totals: {
    period: Period;
    route_pattern: string;
    pageviews: number;
    unique_users: number;
    /** Real: soma do `time_on_page_ms` quando medido. 0 antes do deploy. */
    real_total_time_ms: number;
    real_pageviews_with_time: number;
    avg_scroll_pct: number | null;
    /** Tempo entre primeira e última pageview da rota (wall-clock total). */
    span_seconds: number;
  };
  top_users: RouteUserRow[];
  events: RouteEventRow[];
  daily: RouteDailyPoint[];
};

const buildDailyBuckets = (period: Period): Map<string, RouteDailyPoint> => {
  const days = periodDays[period];
  const map = new Map<string, RouteDailyPoint>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { day: key, pageviews: 0, unique_users: 0 });
  }
  return map;
};

export const useRouteActivity = (
  routePattern: string | null,
  period: Period = "30d",
) => {
  return useQuery({
    queryKey: ["route-activity", routePattern, period],
    enabled: !!routePattern,
    queryFn: async (): Promise<RouteActivity> => {
      if (!routePattern) throw new Error("routePattern required");
      const since = sinceIso(period);

      // Pageviews da rota — exclui testers internos via filtro no profile.
      const pageviewsRes = await supabase
        .from("page_view_logs")
        .select(
          "user_id, viewed_at, time_on_page_ms, max_scroll_pct, profiles!inner(full_name, is_internal_tester)",
        )
        .eq("company_id", GABARDO_COMPANY_ID)
        .eq("route_pattern", routePattern)
        .gte("viewed_at", since)
        .not("user_id", "is", null);

      type PvRow = {
        user_id: string;
        viewed_at: string;
        time_on_page_ms: number | null;
        max_scroll_pct: number | null;
        profiles: { full_name: string | null; is_internal_tester: boolean | null } | null;
      };

      const allViews = (pageviewsRes.data ?? []) as unknown as PvRow[];
      // Filtra testers internos.
      const views = allViews.filter(
        (v) => !v.profiles?.is_internal_tester,
      );

      // Agrega por user
      type UBucket = {
        user_id: string;
        full_name: string | null;
        pageviews: number;
        total_time_on_page_ms: number;
        last_seen: string;
      };
      const byUser = new Map<string, UBucket>();
      const dailyBuckets = buildDailyBuckets(period);
      const seenByDay = new Map<string, Set<string>>();

      let realTotalTime = 0;
      let realPageviewsWithTime = 0;
      let scrollSum = 0;
      let scrollCount = 0;

      for (const v of views) {
        const day = v.viewed_at.slice(0, 10);

        // Daily bucket
        const dailyBucket = dailyBuckets.get(day);
        if (dailyBucket) {
          dailyBucket.pageviews += 1;
          let set = seenByDay.get(day);
          if (!set) {
            set = new Set();
            seenByDay.set(day, set);
          }
          set.add(v.user_id);
        }

        // Per-user bucket
        const cur = byUser.get(v.user_id);
        if (!cur) {
          byUser.set(v.user_id, {
            user_id: v.user_id,
            full_name: v.profiles?.full_name ?? null,
            pageviews: 1,
            total_time_on_page_ms: v.time_on_page_ms ?? 0,
            last_seen: v.viewed_at,
          });
        } else {
          cur.pageviews += 1;
          cur.total_time_on_page_ms += v.time_on_page_ms ?? 0;
          if (v.viewed_at > cur.last_seen) cur.last_seen = v.viewed_at;
        }

        // Real time + scroll
        if (v.time_on_page_ms !== null) {
          realTotalTime += v.time_on_page_ms;
          realPageviewsWithTime += 1;
        }
        if (v.max_scroll_pct !== null) {
          scrollSum += v.max_scroll_pct;
          scrollCount += 1;
        }
      }

      seenByDay.forEach((set, day) => {
        const bucket = dailyBuckets.get(day);
        if (bucket) bucket.unique_users = set.size;
      });

      // Eventos disparados nessa rota
      const eventsRes = await supabase
        .from("event_logs")
        .select("event_type, created_at")
        .eq("company_id", GABARDO_COMPANY_ID)
        .eq("route_pattern", routePattern)
        .gte("created_at", since);

      type EBucket = {
        event_type: string;
        count: number;
        last_seen: string;
      };
      const byEvent = new Map<string, EBucket>();
      (eventsRes.data ?? []).forEach((e) => {
        const cur = byEvent.get(e.event_type);
        if (!cur) {
          byEvent.set(e.event_type, {
            event_type: e.event_type,
            count: 1,
            last_seen: e.created_at as string,
          });
        } else {
          cur.count += 1;
          if ((e.created_at as string) > cur.last_seen) {
            cur.last_seen = e.created_at as string;
          }
        }
      });

      const sortedViews = views
        .map((v) => v.viewed_at)
        .sort((a, b) => a.localeCompare(b));
      const spanSeconds =
        sortedViews.length >= 2
          ? Math.floor(
              (new Date(sortedViews[sortedViews.length - 1]).getTime() -
                new Date(sortedViews[0]).getTime()) /
                1000,
            )
          : 0;

      return {
        totals: {
          period,
          route_pattern: routePattern,
          pageviews: views.length,
          unique_users: byUser.size,
          real_total_time_ms: realTotalTime,
          real_pageviews_with_time: realPageviewsWithTime,
          avg_scroll_pct: scrollCount > 0 ? Math.round(scrollSum / scrollCount) : null,
          span_seconds: spanSeconds,
        },
        top_users: Array.from(byUser.values()).sort(
          (a, b) => b.pageviews - a.pageviews,
        ),
        events: Array.from(byEvent.values()).sort((a, b) => b.count - a.count),
        daily: Array.from(dailyBuckets.values()),
      };
    },
    staleTime: 30_000,
  });
};
