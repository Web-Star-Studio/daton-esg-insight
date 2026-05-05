import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Métricas focadas na Gabardo (única empresa cliente atualmente).
 *
 * Por que hardcoded: a Gabardo é o único cliente ativo no momento e o
 * objetivo desse hook é fornecer evidência consolidada pra reuniões de
 * cobrança. Quando houver multi-tenant real, vira `useCompanyMetrics(id)`
 * com seletor — substituir essa constante por param do hook.
 *
 * Tudo respeita RLS: as queries só retornam dados se o user atual for
 * platform_admin (policies já configuradas em page_view_logs, event_logs,
 * ai_usage_logs, user_activity_sessions).
 *
 * "Active vs ghost user" é derivado de `page_view_logs` (não de
 * `last_sign_in_at` em profiles, que não existe — esse campo vive em
 * `auth.users`, fora do alcance do client com RLS).
 */

const GABARDO_COMPANY_ID = "021647af-61a5-4075-9db3-bb5024ef7a67";

type Period = "7d" | "30d" | "90d";

const periodDays: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const sinceIso = (period: Period): string =>
  new Date(Date.now() - periodDays[period] * 86_400_000).toISOString();

export type GabardoUserRow = {
  user_id: string;
  full_name: string | null;
  pageviews: number;
  active_days: number;
  last_seen: string | null;
  total_active_seconds: number | null;
};

export type GabardoRouteRow = {
  route_pattern: string;
  pageviews: number;
  unique_users: number;
  avg_time_on_page_ms: number | null;
};

export type GabardoAiCostRow = {
  feature_tag: string | null;
  function_name: string;
  model: string;
  calls: number;
  total_tokens: number;
  cost_usd: number;
};

export type GabardoMetrics = {
  totals: {
    period: Period;
    total_users: number;
    active_users: number;
    inactive_users: number;
    pageviews: number;
    events: number;
    ai_calls: number;
    ai_cost_usd: number;
    sessions: number;
    total_active_minutes: number;
    avg_session_minutes: number | null;
  };
  top_users: GabardoUserRow[];
  ghost_users: Array<{ user_id: string; full_name: string | null }>;
  top_routes: GabardoRouteRow[];
  ai_cost_breakdown: GabardoAiCostRow[];
};

const fetchTotals = async (
  period: Period,
): Promise<GabardoMetrics["totals"]> => {
  const since = sinceIso(period);

  // Promise.all com tipos genéricos profundos do supabase-js gera
  // "Type instantiation is excessively deep". Quebro em chamadas
  // individuais — overhead despreciável vs sanidade do checker.
  const profilesQ = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", GABARDO_COMPANY_ID)
    .eq("is_internal_tester", false);

  // "Active users" no período = users com pelo menos 1 pageview.
  const activeUsersDistinctQ = await supabase
    .from("page_view_logs")
    .select("user_id")
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("viewed_at", since)
    .not("user_id", "is", null);

  const activeUserIds = new Set(
    (activeUsersDistinctQ.data ?? []).map((r) => r.user_id as string),
  );

  const pageviewsQ = await supabase
    .from("page_view_logs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("viewed_at", since);

  const eventsQ = await supabase
    .from("event_logs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("created_at", since);

  const aiUsageQ = await supabase
    .from("ai_usage_logs")
    .select("estimated_cost_usd, total_tokens", { count: "exact" })
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("created_at", since);

  const sessionsQ = await supabase
    .from("user_activity_sessions")
    .select("active_seconds", { count: "exact" })
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("started_at", since);

  const totalUsers = profilesQ.count ?? 0;
  const activeUsers = activeUserIds.size;
  const sessionsRows = sessionsQ.data ?? [];
  const totalActiveSeconds = sessionsRows.reduce(
    (acc, r) => acc + (r.active_seconds ?? 0),
    0,
  );
  const aiRows = aiUsageQ.data ?? [];
  const aiCostUsd = aiRows.reduce(
    (acc, r) => acc + Number(r.estimated_cost_usd ?? 0),
    0,
  );

  return {
    period,
    total_users: totalUsers,
    active_users: activeUsers,
    inactive_users: Math.max(0, totalUsers - activeUsers),
    pageviews: pageviewsQ.count ?? 0,
    events: eventsQ.count ?? 0,
    ai_calls: aiUsageQ.count ?? 0,
    ai_cost_usd: Number(aiCostUsd.toFixed(4)),
    sessions: sessionsQ.count ?? 0,
    total_active_minutes: Math.round(totalActiveSeconds / 60),
    avg_session_minutes:
      sessionsQ.count && sessionsQ.count > 0
        ? Math.round(totalActiveSeconds / 60 / sessionsQ.count)
        : null,
  };
};

const fetchTopUsers = async (period: Period): Promise<GabardoUserRow[]> => {
  const since = sinceIso(period);

  const { data: views } = await supabase
    .from("page_view_logs")
    .select("user_id, viewed_at")
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("viewed_at", since)
    .not("user_id", "is", null);

  if (!views) return [];

  type Bucket = {
    pageviews: number;
    days: Set<string>;
    last_seen: string;
  };
  const byUser = new Map<string, Bucket>();
  for (const v of views) {
    const userId = v.user_id;
    if (!userId) continue;
    const day = (v.viewed_at as string).slice(0, 10);
    const cur = byUser.get(userId);
    if (!cur) {
      byUser.set(userId, {
        pageviews: 1,
        days: new Set([day]),
        last_seen: v.viewed_at as string,
      });
    } else {
      cur.pageviews += 1;
      cur.days.add(day);
      if ((v.viewed_at as string) > cur.last_seen)
        cur.last_seen = v.viewed_at as string;
    }
  }

  const userIds = Array.from(byUser.keys());
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, is_internal_tester")
    .in("id", userIds);

  const profileMap = new Map<
    string,
    { full_name: string | null; is_internal_tester: boolean | null }
  >();
  (profiles ?? []).forEach((p) => {
    profileMap.set(p.id, {
      full_name: p.full_name,
      is_internal_tester: p.is_internal_tester,
    });
  });

  const { data: sessions } = await supabase
    .from("user_activity_sessions")
    .select("user_id, active_seconds")
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("started_at", since);

  const activeByUser = new Map<string, number>();
  (sessions ?? []).forEach((s) => {
    activeByUser.set(
      s.user_id,
      (activeByUser.get(s.user_id) ?? 0) + (s.active_seconds ?? 0),
    );
  });

  return Array.from(byUser.entries())
    .filter(([uid]) => !profileMap.get(uid)?.is_internal_tester)
    .map(([uid, b]) => ({
      user_id: uid,
      full_name: profileMap.get(uid)?.full_name ?? null,
      pageviews: b.pageviews,
      active_days: b.days.size,
      last_seen: b.last_seen,
      total_active_seconds: activeByUser.get(uid) ?? null,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 15);
};

const fetchGhostUsers = async (
  period: Period,
): Promise<Array<{ user_id: string; full_name: string | null }>> => {
  const since = sinceIso(period);

  // Lista todos os profiles da Gabardo (não-testers)
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, is_internal_tester")
    .eq("company_id", GABARDO_COMPANY_ID);

  const candidates = (allProfiles ?? []).filter((p) => !p.is_internal_tester);
  if (candidates.length === 0) return [];

  // Pega user_ids distintos com pageview no período
  const { data: views } = await supabase
    .from("page_view_logs")
    .select("user_id")
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("viewed_at", since)
    .not("user_id", "is", null);

  const seen = new Set<string>();
  (views ?? []).forEach((v) => {
    if (v.user_id) seen.add(v.user_id);
  });

  return candidates
    .filter((p) => !seen.has(p.id))
    .map((p) => ({ user_id: p.id, full_name: p.full_name }));
};

const fetchTopRoutes = async (period: Period): Promise<GabardoRouteRow[]> => {
  const since = sinceIso(period);

  const { data } = await supabase
    .from("page_view_logs")
    .select("route_pattern, user_id, time_on_page_ms")
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("viewed_at", since);

  if (!data) return [];

  type Bucket = {
    pageviews: number;
    users: Set<string>;
    times: number[];
  };
  const byRoute = new Map<string, Bucket>();
  for (const r of data) {
    const key = r.route_pattern ?? "(unknown)";
    const cur = byRoute.get(key) ?? {
      pageviews: 0,
      users: new Set<string>(),
      times: [],
    };
    cur.pageviews += 1;
    if (r.user_id) cur.users.add(r.user_id);
    if (r.time_on_page_ms != null) cur.times.push(r.time_on_page_ms);
    byRoute.set(key, cur);
  }

  return Array.from(byRoute.entries())
    .map(([route, b]) => ({
      route_pattern: route,
      pageviews: b.pageviews,
      unique_users: b.users.size,
      avg_time_on_page_ms:
        b.times.length > 0
          ? Math.round(b.times.reduce((a, t) => a + t, 0) / b.times.length)
          : null,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 20);
};

const fetchAiCost = async (period: Period): Promise<GabardoAiCostRow[]> => {
  const since = sinceIso(period);

  const { data } = await supabase
    .from("ai_usage_logs")
    .select(
      "function_name, feature_tag, model, total_tokens, estimated_cost_usd",
    )
    .eq("company_id", GABARDO_COMPANY_ID)
    .gte("created_at", since);

  if (!data) return [];

  const key = (r: {
    function_name: string;
    feature_tag: string | null;
    model: string;
  }) => `${r.function_name}|${r.feature_tag ?? ""}|${r.model}`;

  const byKey = new Map<string, GabardoAiCostRow>();
  for (const r of data) {
    const k = key(r);
    const cur = byKey.get(k) ?? {
      function_name: r.function_name,
      feature_tag: r.feature_tag,
      model: r.model,
      calls: 0,
      total_tokens: 0,
      cost_usd: 0,
    };
    cur.calls += 1;
    cur.total_tokens += r.total_tokens ?? 0;
    cur.cost_usd += Number(r.estimated_cost_usd ?? 0);
    byKey.set(k, cur);
  }

  return Array.from(byKey.values()).sort((a, b) => b.cost_usd - a.cost_usd);
};

export const useGabardoMetrics = (period: Period = "30d") => {
  return useQuery({
    queryKey: ["gabardo-metrics", period],
    queryFn: async (): Promise<GabardoMetrics> => {
      const [totals, top_users, ghost_users, top_routes, ai_cost_breakdown] =
        await Promise.all([
          fetchTotals(period),
          fetchTopUsers(period),
          fetchGhostUsers(period),
          fetchTopRoutes(period),
          fetchAiCost(period),
        ]);
      return {
        totals,
        top_users,
        ghost_users,
        top_routes,
        ai_cost_breakdown,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};
