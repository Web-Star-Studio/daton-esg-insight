// Agregador da página /admin/usage. Roda no Postgres em vez de carregar
// 50k linhas no client. Recebe um período e (opcionalmente) um company_id;
// devolve KPIs e séries pré-agregadas para Visão geral, Páginas, Eventos,
// IA & Custos, Usuários e Heatmap.
//
// Autorização: a função usa SERVICE_ROLE para bypass de RLS — checa
// `is_platform_admin()` do JWT do caller antes de devolver qualquer dado.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Heurística de normalização (idêntica a src/lib/routePattern.ts).
// Aplicada server-side pra dados antigos (anteriores ao route_pattern em
// page_view_logs) que vêm com pathname literal contendo UUIDs/numéricos.
// Sem isso, /licenciamento/legislacoes/76c04fa0-... é tratado como rota
// distinta e aparece como "não declarada" na tab de rotas mortas.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;
const HASH_RE = /^[0-9a-zA-Z_-]{16,}$/;
const DIGIT_RE = /\d/;

const normalizeSegment = (segment: string): string => {
  if (!segment) return segment;
  if (UUID_RE.test(segment)) return ":id";
  if (NUMERIC_RE.test(segment)) return ":id";
  if (HASH_RE.test(segment) && DIGIT_RE.test(segment)) return ":id";
  return segment;
};

const getRoutePattern = (pathname: string): string => {
  if (!pathname || pathname === "/") return "/";
  const parts = pathname.split("/").map(normalizeSegment);
  const result = parts.join("/");
  return result || "/";
};

type SummaryRequest = {
  /** ISO 8601 — limite inferior. */
  from: string;
  /** ISO 8601 — limite superior (default: now). */
  to?: string;
  /** Filtra por empresa. Vazio = todas. */
  companyId?: string | null;
};

type RouteRow = { route_pattern: string; views: number; unique_users: number; last: string };
type EventRow = { event_type: string; count: number };
type ModelRow = { model: string; tokens: number; cost: number; calls: number };
type FunctionRow = { function_name: string; tokens: number; cost: number; calls: number; avg_latency_ms: number };
type CompanyAiRow = { company_id: string | null; tokens: number; cost: number; calls: number };
type UserRankingRow = { user_id: string; views: number; routes: number; events: number };
type DailyRow = { day: string; views: number; cost_usd: number; events: number };
type HeatmapCell = { dow: number; hour: number; count: number };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "missing-auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Valida que o caller é platform_admin via JWT (cliente anon).
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: isAdminData, error: rpcErr } = await authClient.rpc("is_platform_admin");
    if (rpcErr || !isAdminData) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as SummaryRequest;
    const from = body.from;
    const to = body.to ?? new Date().toISOString();
    const companyFilter = body.companyId ?? null;

    if (!from) throw new Error("`from` é obrigatório");

    // Service role pra agregar sem barreiras de RLS.
    const db = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // -- page_view_logs --------------------------------------------------
    let pvQuery = db
      .from("page_view_logs")
      .select("user_id, company_id, pathname, route_pattern, viewed_at")
      .gte("viewed_at", from)
      .lte("viewed_at", to)
      .limit(200_000);
    if (companyFilter) pvQuery = pvQuery.eq("company_id", companyFilter);
    const { data: pvRows, error: pvErr } = await pvQuery;
    if (pvErr) throw pvErr;

    // -- event_logs ------------------------------------------------------
    let evQuery = db
      .from("event_logs")
      .select("event_type, user_id, company_id, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(200_000);
    if (companyFilter) evQuery = evQuery.eq("company_id", companyFilter);
    const { data: evRows, error: evErr } = await evQuery;
    if (evErr) throw evErr;

    // -- ai_usage_logs ---------------------------------------------------
    let aiQuery = db
      .from("ai_usage_logs")
      .select("function_name, feature_tag, model, company_id, user_id, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd, latency_ms, success, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .limit(100_000);
    if (companyFilter) aiQuery = aiQuery.eq("company_id", companyFilter);
    const { data: aiRows, error: aiErr } = await aiQuery;
    if (aiErr) throw aiErr;

    // -- agregações ------------------------------------------------------
    const pageViews = pvRows ?? [];
    const events = evRows ?? [];
    const ai = aiRows ?? [];

    // Por rota (usa route_pattern; cai no pathname se nulo).
    const byRoute = new Map<string, { views: number; users: Set<string>; last: string }>();
    for (const r of pageViews) {
      const key = (r.route_pattern as string | null) || getRoutePattern(r.pathname as string);
      const cur = byRoute.get(key) ?? { views: 0, users: new Set<string>(), last: "" };
      cur.views += 1;
      if (r.user_id) cur.users.add(r.user_id as string);
      const ts = r.viewed_at as string;
      if (!cur.last || ts > cur.last) cur.last = ts;
      byRoute.set(key, cur);
    }
    const routes: RouteRow[] = Array.from(byRoute.entries())
      .map(([route_pattern, v]) => ({
        route_pattern,
        views: v.views,
        unique_users: v.users.size,
        last: v.last,
      }))
      .sort((a, b) => b.views - a.views);

    // Por event_type.
    const byEvent = new Map<string, number>();
    for (const e of events) {
      const k = e.event_type as string;
      byEvent.set(k, (byEvent.get(k) ?? 0) + 1);
    }
    const eventCounts: EventRow[] = Array.from(byEvent.entries())
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count);

    // Por modelo IA.
    const byModel = new Map<string, { tokens: number; cost: number; calls: number }>();
    for (const a of ai) {
      const k = a.model as string;
      const cur = byModel.get(k) ?? { tokens: 0, cost: 0, calls: 0 };
      cur.tokens += (a.total_tokens as number) ?? 0;
      cur.cost += Number(a.estimated_cost_usd ?? 0);
      cur.calls += 1;
      byModel.set(k, cur);
    }
    const models: ModelRow[] = Array.from(byModel.entries())
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.cost - a.cost);

    // Por function_name (custo + latência média).
    const byFn = new Map<string, { tokens: number; cost: number; calls: number; latencySum: number }>();
    for (const a of ai) {
      const k = a.function_name as string;
      const cur = byFn.get(k) ?? { tokens: 0, cost: 0, calls: 0, latencySum: 0 };
      cur.tokens += (a.total_tokens as number) ?? 0;
      cur.cost += Number(a.estimated_cost_usd ?? 0);
      cur.calls += 1;
      cur.latencySum += (a.latency_ms as number) ?? 0;
      byFn.set(k, cur);
    }
    const functions: FunctionRow[] = Array.from(byFn.entries())
      .map(([function_name, v]) => ({
        function_name,
        tokens: v.tokens,
        cost: v.cost,
        calls: v.calls,
        avg_latency_ms: v.calls > 0 ? Math.round(v.latencySum / v.calls) : 0,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Por company (no modo companyFilter=null).
    const byCompany = new Map<string | null, { tokens: number; cost: number; calls: number }>();
    for (const a of ai) {
      const k = (a.company_id as string | null) ?? null;
      const cur = byCompany.get(k) ?? { tokens: 0, cost: 0, calls: 0 };
      cur.tokens += (a.total_tokens as number) ?? 0;
      cur.cost += Number(a.estimated_cost_usd ?? 0);
      cur.calls += 1;
      byCompany.set(k, cur);
    }
    const companies: CompanyAiRow[] = Array.from(byCompany.entries())
      .map(([company_id, v]) => ({ company_id, ...v }))
      .sort((a, b) => b.cost - a.cost);

    // Ranking de usuários (combina views + eventos).
    const userMap = new Map<string, { views: number; routes: Set<string>; events: number }>();
    for (const r of pageViews) {
      if (!r.user_id) continue;
      const cur = userMap.get(r.user_id as string) ?? { views: 0, routes: new Set<string>(), events: 0 };
      cur.views += 1;
      const key = (r.route_pattern as string | null) || getRoutePattern(r.pathname as string);
      cur.routes.add(key);
      userMap.set(r.user_id as string, cur);
    }
    for (const e of events) {
      if (!e.user_id) continue;
      const cur = userMap.get(e.user_id as string) ?? { views: 0, routes: new Set<string>(), events: 0 };
      cur.events += 1;
      userMap.set(e.user_id as string, cur);
    }
    const users: UserRankingRow[] = Array.from(userMap.entries())
      .map(([user_id, v]) => ({
        user_id,
        views: v.views,
        routes: v.routes.size,
        events: v.events,
      }))
      .sort((a, b) => b.views + b.events - (a.views + a.events));

    // Daily timeline (views + custo + eventos).
    const dailyMap = new Map<string, DailyRow>();
    const dayKey = (iso: string) => iso.slice(0, 10);
    for (const r of pageViews) {
      const k = dayKey(r.viewed_at as string);
      const cur = dailyMap.get(k) ?? { day: k, views: 0, cost_usd: 0, events: 0 };
      cur.views += 1;
      dailyMap.set(k, cur);
    }
    for (const e of events) {
      const k = dayKey(e.created_at as string);
      const cur = dailyMap.get(k) ?? { day: k, views: 0, cost_usd: 0, events: 0 };
      cur.events += 1;
      dailyMap.set(k, cur);
    }
    for (const a of ai) {
      const k = dayKey(a.created_at as string);
      const cur = dailyMap.get(k) ?? { day: k, views: 0, cost_usd: 0, events: 0 };
      cur.cost_usd += Number(a.estimated_cost_usd ?? 0);
      dailyMap.set(k, cur);
    }
    const daily: DailyRow[] = Array.from(dailyMap.values()).sort((a, b) =>
      a.day.localeCompare(b.day),
    );

    // Heatmap (dow x hour) baseado em pageviews.
    const heatmap: HeatmapCell[] = [];
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const r of pageViews) {
      const d = new Date(r.viewed_at as string);
      grid[d.getDay()][d.getHours()] += 1;
    }
    for (let dow = 0; dow < 7; dow++) {
      for (let hour = 0; hour < 24; hour++) {
        if (grid[dow][hour] > 0) heatmap.push({ dow, hour, count: grid[dow][hour] });
      }
    }

    const totals = {
      page_views: pageViews.length,
      unique_users: new Set(pageViews.map((r) => r.user_id).filter(Boolean)).size,
      events: events.length,
      ai_calls: ai.length,
      ai_tokens: ai.reduce((s, a) => s + ((a.total_tokens as number) ?? 0), 0),
      ai_cost_usd: ai.reduce((s, a) => s + Number(a.estimated_cost_usd ?? 0), 0),
      ai_errors: ai.filter((a) => !a.success).length,
    };

    return new Response(
      JSON.stringify({
        totals,
        routes,
        eventCounts,
        models,
        functions,
        companies,
        users,
        daily,
        heatmap,
        // metadados pra debug.
        from,
        to,
        company_id: companyFilter,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[get-usage-summary]", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
