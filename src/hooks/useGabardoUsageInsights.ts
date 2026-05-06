import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getModuleKeyForRoute } from "@/config/routeModuleMap";

const GABARDO_COMPANY_ID = "021647af-61a5-4075-9db3-bb5024ef7a67";

export type UserClassification = "power" | "regular" | "casual" | "churning" | "ghost";

export type GabardoUserUsageRow = {
  user_id: string;
  full_name: string | null;
  classification: UserClassification;
  pageviews_30d: number;
  active_days_30d: number;
  last_seen: string | null;
  days_since_last_seen: number | null;
  modules_used: string[];
};

export type ModuleAdoptionRow = {
  module_key: string;
  unique_users: number;
  pageviews: number;
  adoption_pct: number; // % de usuários da Gabardo (não-tester) que tocaram o módulo
};

export type GabardoUsageInsights = {
  classification_counts: Record<UserClassification, number>;
  users: GabardoUserUsageRow[];
  module_adoption: ModuleAdoptionRow[];
  total_eligible_users: number;
};

const daysAgoIso = (d: number) =>
  new Date(Date.now() - d * 86_400_000).toISOString();

const classify = (
  pageviews30d: number,
  activeDays30d: number,
  daysSinceLast: number | null,
): UserClassification => {
  if (daysSinceLast === null) return "ghost";
  if (daysSinceLast > 14) return "churning";
  if (activeDays30d >= 12 && pageviews30d >= 80) return "power";
  if (activeDays30d >= 5) return "regular";
  return "casual";
};

export const useGabardoUsageInsights = () => {
  return useQuery({
    queryKey: ["gabardo-usage-insights"],
    queryFn: async (): Promise<GabardoUsageInsights> => {
      const since30 = daysAgoIso(30);

      const [{ data: profiles }, { data: views }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, is_internal_tester")
          .eq("company_id", GABARDO_COMPANY_ID),
        supabase
          .from("page_view_logs")
          .select("user_id, viewed_at, route_pattern, pathname")
          .eq("company_id", GABARDO_COMPANY_ID)
          .gte("viewed_at", since30)
          .not("user_id", "is", null),
      ]);

      const eligible = (profiles ?? []).filter((p) => !p.is_internal_tester);
      const eligibleIds = new Set(eligible.map((p) => p.id));
      const nameById = new Map(eligible.map((p) => [p.id, p.full_name]));

      type Bucket = {
        pageviews: number;
        days: Set<string>;
        last_seen: string;
        modules: Set<string>;
      };
      const byUser = new Map<string, Bucket>();
      const moduleUsers = new Map<string, Set<string>>();
      const modulePageviews = new Map<string, number>();

      for (const v of views ?? []) {
        const uid = v.user_id as string | null;
        if (!uid || !eligibleIds.has(uid)) continue;
        const path = (v.route_pattern || v.pathname || "") as string;
        const moduleKey = getModuleKeyForRoute(path) ?? "other";
        const day = (v.viewed_at as string).slice(0, 10);
        const cur = byUser.get(uid) ?? {
          pageviews: 0,
          days: new Set<string>(),
          last_seen: v.viewed_at as string,
          modules: new Set<string>(),
        };
        cur.pageviews += 1;
        cur.days.add(day);
        cur.modules.add(moduleKey);
        if ((v.viewed_at as string) > cur.last_seen)
          cur.last_seen = v.viewed_at as string;
        byUser.set(uid, cur);

        if (!moduleUsers.has(moduleKey))
          moduleUsers.set(moduleKey, new Set());
        moduleUsers.get(moduleKey)!.add(uid);
        modulePageviews.set(
          moduleKey,
          (modulePageviews.get(moduleKey) ?? 0) + 1,
        );
      }

      const now = Date.now();
      const users: GabardoUserUsageRow[] = eligible.map((p) => {
        const b = byUser.get(p.id);
        const lastSeen = b?.last_seen ?? null;
        const daysSince =
          lastSeen !== null
            ? Math.floor((now - new Date(lastSeen).getTime()) / 86_400_000)
            : null;
        const pv = b?.pageviews ?? 0;
        const ad = b?.days.size ?? 0;
        return {
          user_id: p.id,
          full_name: nameById.get(p.id) ?? null,
          classification: classify(pv, ad, daysSince),
          pageviews_30d: pv,
          active_days_30d: ad,
          last_seen: lastSeen,
          days_since_last_seen: daysSince,
          modules_used: Array.from(b?.modules ?? []),
        };
      });

      const counts: Record<UserClassification, number> = {
        power: 0,
        regular: 0,
        casual: 0,
        churning: 0,
        ghost: 0,
      };
      users.forEach((u) => counts[u.classification]++);

      const totalEligible = eligible.length;
      const moduleAdoption: ModuleAdoptionRow[] = Array.from(
        moduleUsers.entries(),
      )
        .map(([k, set]) => ({
          module_key: k,
          unique_users: set.size,
          pageviews: modulePageviews.get(k) ?? 0,
          adoption_pct:
            totalEligible > 0
              ? Math.round((set.size / totalEligible) * 100)
              : 0,
        }))
        .sort((a, b) => b.unique_users - a.unique_users);

      users.sort((a, b) => b.pageviews_30d - a.pageviews_30d);

      return {
        classification_counts: counts,
        users,
        module_adoption: moduleAdoption,
        total_eligible_users: totalEligible,
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
};
