// Cron mensal — para todas as branches ativas, dispara
// `compliance-update-letter-generator` em modo cron-internal
// (header `x-cron-internal: 1` + Bearer = service role). O generator
// reconhece esse caminho, pula a checagem de JWT/usuário e gera com
// `generated_by: null`. Falhas individuais não derrubam o lote.
//
// Acionada pelo pg_cron configurado em
// `supabase/migrations/20260507120000_compliance_update_letters.sql`.
//
// **Comportamento de resposta**: retorna 202 IMEDIATO e processa em
// background via `EdgeRuntime.waitUntil`. Sequência síncrona com 50+
// branches estourava o timeout de edge function (~150s no plano free).
// O log agregado em `ai_usage_logs` no fim da task continua ativo, então
// a observabilidade não regrediu.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BranchSummary {
  id: string;
  name: string;
  status: "ok" | "error";
  error?: string;
}

interface SkippedBranch {
  id: string;
  name: string;
  status: string | null;
}

const ACCEPTED_BRANCH_STATUSES = new Set(["ativa", "active", "ativo"]);

// `EdgeRuntime` existe em runtime Supabase Deno mas não no tipo padrão.
// Tipamos local pra não depender de @ts-ignore.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response(
      JSON.stringify({ error: "Supabase env vars missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Auth do caller: cron lê do vault e passa via Authorization Bearer.
  // Sem essa checagem, qualquer um que descobrisse a URL poderia disparar
  // o lote (custo Perplexity × N branches por chamada). O secret é o mesmo
  // `cron_invoke_jwt` usado pelo pg_cron (ver migration de vault).
  const CRON_INVOKE_JWT = Deno.env.get("CRON_INVOKE_JWT");
  if (!CRON_INVOKE_JWT) {
    return new Response(
      JSON.stringify({ error: "CRON_INVOKE_JWT não configurada — provisionar no Edge Function Secrets" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${CRON_INVOKE_JWT}`) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // Mês de referência = mês imediatamente anterior, em UTC.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const referenceMonthISO = monthStart.toISOString().slice(0, 10);

  // Lê TODAS as branches da empresa, não só "ativa"-like — pra registrar
  // explicitamente quem foi pulado (G4: status null, "ATIVO" upper, etc.).
  const { data: allBranches, error: branchesErr } = await supabase
    .from("branches")
    .select("id, name, status");
  if (branchesErr) {
    return new Response(
      JSON.stringify({ error: branchesErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const eligible: Array<{ id: string; name: string; status: string | null }> = [];
  const skipped: SkippedBranch[] = [];
  for (const b of allBranches ?? []) {
    const norm = (b.status ?? "").toLowerCase();
    if (ACCEPTED_BRANCH_STATUSES.has(norm)) {
      eligible.push(b);
    } else {
      skipped.push({ id: b.id, name: b.name, status: b.status ?? null });
    }
  }

  const task = processBatch({
    supabase,
    supabaseUrl: SUPABASE_URL,
    serviceRole: SERVICE_ROLE,
    branches: eligible,
    skipped,
    referenceMonthISO,
  });

  // EdgeRuntime.waitUntil só existe no runtime real do Supabase. No worker
  // Deno local é undefined — caímos pra await direto (manter compat de teste).
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(task);
  } else {
    // Em ambiente sem EdgeRuntime, espera (modo legacy/local).
    await task;
  }

  return new Response(
    JSON.stringify({
      status: "accepted",
      reference_month: referenceMonthISO,
      branch_count: eligible.length,
      skipped_count: skipped.length,
      message: typeof EdgeRuntime !== "undefined"
        ? "Processamento em background iniciado."
        : "Processamento síncrono finalizado.",
    }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

interface BatchInput {
  supabase: ReturnType<typeof createClient>;
  supabaseUrl: string;
  serviceRole: string;
  branches: Array<{ id: string; name: string; status: string | null }>;
  skipped: SkippedBranch[];
  referenceMonthISO: string;
}

async function processBatch(input: BatchInput): Promise<void> {
  const { supabaseUrl, serviceRole, branches, skipped, referenceMonthISO } = input;
  const generatorUrl = `${supabaseUrl}/functions/v1/compliance-update-letter-generator`;
  const summary: BranchSummary[] = [];

  // Sequencial é proposital: limita pressão no Perplexity e mantém o log
  // por branch encadeado. Pode crescer pra mini-paralelismo (concurrency=3)
  // se o volume virar problema.
  for (const b of branches) {
    try {
      const resp = await fetch(generatorUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRole}`,
          "x-cron-internal": "1",
        },
        body: JSON.stringify({
          branch_id: b.id,
          reference_month: referenceMonthISO,
          cron_internal: true,
        }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        summary.push({ id: b.id, name: b.name, status: "error", error: `HTTP ${resp.status}: ${text.slice(0, 200)}` });
      } else {
        summary.push({ id: b.id, name: b.name, status: "ok" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.push({ id: b.id, name: b.name, status: "error", error: message });
    }
  }

  // Log agregado em ai_usage_logs para observabilidade. Inclui as branches
  // puladas pra dar visibilidade — sem isso, status fora do filtro vira
  // ghost (G4).
  try {
    await fetch(`${supabaseUrl}/rest/v1/ai_usage_logs`, {
      method: "POST",
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        function_name: "compliance-update-letter-cron",
        feature_tag: "compliance-update-letter:cron-batch",
        model: null,
        prompt_tokens: null,
        completion_tokens: null,
        total_tokens: null,
        estimated_cost_usd: 0,
        latency_ms: 0,
        success: summary.every((s) => s.status === "ok"),
        error_text: summary.filter((s) => s.status === "error").map((s) => `${s.id}:${s.error}`).join("|").slice(0, 1000) || null,
        metadata: {
          reference_month: referenceMonthISO,
          branch_count: summary.length,
          ok_count: summary.filter((s) => s.status === "ok").length,
          error_count: summary.filter((s) => s.status === "error").length,
          skipped_count: skipped.length,
          skipped_branches: skipped.slice(0, 50), // cap pra não estourar jsonb
        },
      }),
    });
  } catch (err) {
    console.warn("[compliance-update-letter-cron] log failed:", err);
  }
}
