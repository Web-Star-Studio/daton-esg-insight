import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Métricas de erros e Web Vitals — alimentam a aba "Erros & Performance".
 *
 * Dois objetivos:
 *   1. Top errors agregados por fingerprint (ver os fogos primeiro)
 *   2. Web Vitals p50/p95 por route_pattern (ver páginas lentas)
 *
 * RLS: SELECT só pra platform_admin (já configurado em error_logs e
 * client_perf_logs).
 */

type Period = "24h" | "7d" | "30d";
const periodIntervalMs: Record<Period, number> = {
  "24h": 24 * 3_600_000,
  "7d": 7 * 86_400_000,
  "30d": 30 * 86_400_000,
};

const sinceIso = (period: Period): string =>
  new Date(Date.now() - periodIntervalMs[period]).toISOString();

export type TopErrorRow = {
  fingerprint: string;
  message: string;
  source: string;
  count: number;
  unique_users: number;
  unique_routes: number;
  last_seen: string;
  sample_route: string | null;
};

export type WebVitalRow = {
  route_pattern: string;
  metric: string;
  samples: number;
  p50: number;
  p95: number;
  rating_good: number;
  rating_poor: number;
};

export type ErrorsPerfMetrics = {
  totals: {
    period: Period;
    total_errors: number;
    unique_fingerprints: number;
    affected_users: number;
    perf_samples: number;
  };
  top_errors: TopErrorRow[];
  web_vitals: WebVitalRow[];
};

const percentile = (sorted: number[], p: number): number => {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(p * sorted.length)),
  );
  return sorted[idx];
};

const fetchErrors = async (
  period: Period,
): Promise<{
  total: number;
  uniqueFingerprints: number;
  affectedUsers: number;
  topErrors: TopErrorRow[];
}> => {
  const since = sinceIso(period);

  const { data } = await supabase
    .from("error_logs")
    .select(
      "fingerprint, message, source, user_id, route_pattern, occurred_at",
    )
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(5000);

  if (!data) {
    return {
      total: 0,
      uniqueFingerprints: 0,
      affectedUsers: 0,
      topErrors: [],
    };
  }

  type Bucket = {
    fingerprint: string;
    message: string;
    source: string;
    count: number;
    users: Set<string>;
    routes: Set<string>;
    last_seen: string;
    sample_route: string | null;
  };
  const byFp = new Map<string, Bucket>();
  const allUsers = new Set<string>();

  for (const r of data) {
    const fp = r.fingerprint ?? "(no-fingerprint)";
    const cur = byFp.get(fp) ?? {
      fingerprint: fp,
      message: r.message,
      source: r.source,
      count: 0,
      users: new Set<string>(),
      routes: new Set<string>(),
      last_seen: r.occurred_at as string,
      sample_route: r.route_pattern ?? null,
    };
    cur.count += 1;
    if (r.user_id) {
      cur.users.add(r.user_id);
      allUsers.add(r.user_id);
    }
    if (r.route_pattern) cur.routes.add(r.route_pattern);
    if ((r.occurred_at as string) > cur.last_seen) {
      cur.last_seen = r.occurred_at as string;
    }
    byFp.set(fp, cur);
  }

  const topErrors = Array.from(byFp.values())
    .map((b) => ({
      fingerprint: b.fingerprint,
      message: b.message,
      source: b.source,
      count: b.count,
      unique_users: b.users.size,
      unique_routes: b.routes.size,
      last_seen: b.last_seen,
      sample_route: b.sample_route,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return {
    total: data.length,
    uniqueFingerprints: byFp.size,
    affectedUsers: allUsers.size,
    topErrors,
  };
};

const fetchWebVitals = async (
  period: Period,
): Promise<{ samples: number; rows: WebVitalRow[] }> => {
  const since = sinceIso(period);

  const { data } = await supabase
    .from("client_perf_logs")
    .select("route_pattern, metric, value, rating")
    .gte("measured_at", since)
    .limit(10_000);

  if (!data) return { samples: 0, rows: [] };

  type Bucket = {
    route_pattern: string;
    metric: string;
    values: number[];
    good: number;
    poor: number;
  };
  const byKey = new Map<string, Bucket>();
  for (const r of data) {
    const key = `${r.route_pattern}|${r.metric}`;
    const cur = byKey.get(key) ?? {
      route_pattern: r.route_pattern,
      metric: r.metric,
      values: [],
      good: 0,
      poor: 0,
    };
    cur.values.push(Number(r.value));
    if (r.rating === "good") cur.good += 1;
    if (r.rating === "poor") cur.poor += 1;
    byKey.set(key, cur);
  }

  const rows = Array.from(byKey.values())
    .map((b) => {
      const sorted = [...b.values].sort((a, c) => a - c);
      return {
        route_pattern: b.route_pattern,
        metric: b.metric,
        samples: b.values.length,
        p50: Math.round(percentile(sorted, 0.5)),
        p95: Math.round(percentile(sorted, 0.95)),
        rating_good: b.good,
        rating_poor: b.poor,
      };
    })
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 50);

  return { samples: data.length, rows };
};

export const useErrorsPerfMetrics = (period: Period = "24h") => {
  return useQuery({
    queryKey: ["errors-perf-metrics", period],
    queryFn: async (): Promise<ErrorsPerfMetrics> => {
      const [errors, vitals] = await Promise.all([
        fetchErrors(period),
        fetchWebVitals(period),
      ]);
      return {
        totals: {
          period,
          total_errors: errors.total,
          unique_fingerprints: errors.uniqueFingerprints,
          affected_users: errors.affectedUsers,
          perf_samples: vitals.samples,
        },
        top_errors: errors.topErrors,
        web_vitals: vitals.rows,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};
