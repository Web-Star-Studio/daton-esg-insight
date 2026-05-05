import { useEffect } from "react";
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals";
import { supabase } from "@/integrations/supabase/client";
import { getRoutePattern } from "@/lib/routePattern";

/**
 * Web Vitals (Core Web Vitals + extras) reportados pelo Google.
 * Cada métrica gera UMA row em `client_perf_logs` por pageview, o que
 * facilita p50/p95/p99 por route × metric × período.
 *
 * Métricas:
 *   • LCP   — Largest Contentful Paint (load)
 *   • FCP   — First Contentful Paint (load)
 *   • CLS   — Cumulative Layout Shift (visual stability)
 *   • INP   — Interaction to Next Paint (responsiveness, substituiu FID)
 *   • TTFB  — Time To First Byte (network)
 *
 * O `web-vitals` cuida de reportar no momento certo (LCP só após o
 * último candidate, CLS no `pagehide` etc.). Cada handler é chamado
 * uma vez por pageview.
 */

type DeviceType = "mobile" | "tablet" | "desktop";

const detectDeviceType = (): DeviceType => {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

let companyIdCache: { userId: string; companyId: string | null } | null = null;

const resolveCompanyId = async (userId: string): Promise<string | null> => {
  if (companyIdCache?.userId === userId) return companyIdCache.companyId;
  const { data } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();
  companyIdCache = { userId, companyId: data?.company_id ?? null };
  return companyIdCache.companyId;
};

const sendMetric = async (metric: Metric) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    const companyId = user ? await resolveCompanyId(user.id) : null;

    await supabase.from("client_perf_logs").insert({
      user_id: user?.id ?? null,
      company_id: companyId,
      session_id: window.__activitySessionId ?? null,
      route_pattern: getRoutePattern(window.location.pathname),
      pathname: window.location.pathname,
      metric: metric.name,
      value: Number(metric.value.toFixed(4)),
      rating: metric.rating,
      navigation_type: metric.navigationType ?? null,
      device_type: detectDeviceType(),
      user_agent: navigator.userAgent.slice(0, 500),
    });
  } catch {
    // best-effort
  }
};

export const WebVitalsTracker = () => {
  useEffect(() => {
    onCLS(sendMetric);
    onFCP(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onTTFB(sendMetric);
  }, []);

  return null;
};
