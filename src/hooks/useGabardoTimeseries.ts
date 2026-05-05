import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Séries temporais diárias da Gabardo pra alimentar gráficos do
 * Gabardo View. Granularidade: 1 ponto por dia. Períodos: 7d/30d/90d.
 *
 * Por que client-side aggregation: Postgres rolaria mais rápido com
 * `date_trunc + GROUP BY`, mas exigiria RPC custom. Pra MVP buscamos
 * raw + agrupamos no JS — volume Gabardo é < 5k rows/30d, OK.
 */

const GABARDO_COMPANY_ID = "021647af-61a5-4075-9db3-bb5024ef7a67";

type Period = "7d" | "30d" | "90d";
const periodDays: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

const sinceIso = (period: Period): string =>
  new Date(Date.now() - periodDays[period] * 86_400_000).toISOString();

export type DailyPoint = {
  /** YYYY-MM-DD */
  day: string;
  pageviews: number;
  unique_users: number;
  ai_calls: number;
  ai_cost_usd: number;
  ai_tokens: number;
};

const buildDayBuckets = (period: Period): Map<string, DailyPoint> => {
  // Pré-cria buckets com 0s pra todos os dias do período. Garante que
  // gráfico mostra dias sem atividade como "0" em vez de pular.
  const days = periodDays[period];
  const map = new Map<string, DailyPoint>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, {
      day: key,
      pageviews: 0,
      unique_users: 0,
      ai_calls: 0,
      ai_cost_usd: 0,
      ai_tokens: 0,
    });
  }
  return map;
};

export const useGabardoTimeseries = (period: Period = "30d") => {
  return useQuery({
    queryKey: ["gabardo-timeseries", period],
    queryFn: async (): Promise<DailyPoint[]> => {
      const since = sinceIso(period);
      const buckets = buildDayBuckets(period);

      const [pageviewsRes, aiUsageRes] = await Promise.all([
        supabase
          .from("page_view_logs")
          .select("user_id, viewed_at")
          .eq("company_id", GABARDO_COMPANY_ID)
          .gte("viewed_at", since),
        supabase
          .from("ai_usage_logs")
          .select("created_at, total_tokens, estimated_cost_usd")
          .eq("company_id", GABARDO_COMPANY_ID)
          .gte("created_at", since),
      ]);

      // Acumular usuários únicos por dia precisa de Set por dia.
      const usersByDay = new Map<string, Set<string>>();

      (pageviewsRes.data ?? []).forEach((r) => {
        const day = (r.viewed_at as string).slice(0, 10);
        const bucket = buckets.get(day);
        if (!bucket) return;
        bucket.pageviews += 1;
        if (r.user_id) {
          let set = usersByDay.get(day);
          if (!set) {
            set = new Set();
            usersByDay.set(day, set);
          }
          set.add(r.user_id);
        }
      });

      usersByDay.forEach((set, day) => {
        const bucket = buckets.get(day);
        if (bucket) bucket.unique_users = set.size;
      });

      (aiUsageRes.data ?? []).forEach((r) => {
        const day = (r.created_at as string).slice(0, 10);
        const bucket = buckets.get(day);
        if (!bucket) return;
        bucket.ai_calls += 1;
        bucket.ai_tokens += r.total_tokens ?? 0;
        bucket.ai_cost_usd += Number(r.estimated_cost_usd ?? 0);
      });

      // Arredondar custo pra evitar floats sujos no chart.
      buckets.forEach((b) => {
        b.ai_cost_usd = Number(b.ai_cost_usd.toFixed(4));
      });

      return Array.from(buckets.values());
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};
