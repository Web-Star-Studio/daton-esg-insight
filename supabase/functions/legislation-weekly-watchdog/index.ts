// Watchdog semanal de legislações existentes.
//
// Varre as legislações vinculadas (escopo global ou por empresa) procurando
// alteração, revogação, supersedência ou clarificação relevante desde a
// última checagem. Para cada norma única detectada como mudou, faz fan-out
// pras N rows em `legislations` que compartilham a chave lógica
// (norm_type|norm_number|issuing_body|publication_date) — uma row por
// company afetada em `legislation_change_events`.
//
// Por que não agentic: o job é mecânico (varrer + classificar). Loop com
// Gemini orquestrando dobraria o custo sem ganho real — não precisa
// "raciocinar" sobre quais normas checar, é só varrer tudo em batches.
// `watchdog_run_audit.agent_run_id` fica nullable; se um dia virar agente,
// linkamos lá.
//
// Modelo IA: Perplexity sonar (basic, NÃO sonar-pro). Pricing $1/$1 sem
// request fee — ~$0,006/batch vs $0,054/batch sonar-pro. Pra detectar
// "norma X foi alterada/revogada?" basic com web search é suficiente.
//
// Trigger: manual, via JWT de admin. Sem cron (decisão da fase de testes).

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";
import { extractFirstJsonArray } from "../_shared/json-utils.ts";

const BATCH_SIZE = 10;
const PERPLEXITY_MODEL = "sonar";
const SONAR_INPUT_USD_PER_1K = 0.001;
const SONAR_OUTPUT_USD_PER_1K = 0.001;

interface RequestBody {
  /** "global" varre todas legislações ativas; "company" requer `company_id`. */
  scope?: "global" | "company";
  company_id?: string;
  /** Cap opcional pro número de normas únicas (defesa contra surprise bills). */
  max_unique_normas?: number;
}

interface NormaKey {
  norm_type: string;
  norm_number: string;
  issuing_body: string;
  publication_date: string | null;
}

interface UniqueNorma extends NormaKey {
  key: string;
  legislation_ids: string[];
  company_ids: string[];
  title: string;
  jurisdiction: string;
  /** Última detecção pelo watchdog — usado pra delimitar janela de mudança. */
  last_checked_at: string | null;
}

interface DetectedChange {
  norma_key: string;
  status: "amended" | "revoked" | "superseded" | "clarified" | "no_change";
  diff_summary: string | null;
  source_url: string | null;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    return await handle(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[legislation-weekly-watchdog] uncaught:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function handle(req: Request): Promise<Response> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return jsonError(500, "Supabase env vars missing");
  }
  if (!PERPLEXITY_API_KEY) {
    return jsonError(500, "PERPLEXITY_API_KEY não configurada");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonError(401, "Authorization header ausente");

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: userResp, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userResp?.user) {
    return jsonError(401, "JWT inválido");
  }
  const userId = userResp.user.id;

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  const role = roleRow?.role;
  if (role !== "admin" && role !== "platform_admin") {
    console.warn(`[watchdog] non-admin attempted access user=${userId}`);
    return jsonError(403, "Apenas admin/platform_admin podem disparar o watchdog");
  }

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    body = {};
  }
  const scope: "global" | "company" = body.scope === "company" ? "company" : "global";
  if (scope === "company" && !body.company_id) {
    return jsonError(400, "scope=company exige company_id");
  }
  const maxUnique = Math.max(1, Math.min(body.max_unique_normas ?? 5000, 10000));

  const startedAt = Date.now();

  const { data: auditRow, error: auditErr } = await supabase
    .from("watchdog_run_audit")
    .insert({
      scope,
      scope_company_id: scope === "company" ? body.company_id : null,
      triggered_by: userId,
      status: "running",
    })
    .select("id")
    .single();
  if (auditErr || !auditRow) {
    return jsonError(500, `Falha criando audit row: ${auditErr?.message ?? "no row"}`);
  }
  const runId = auditRow.id as string;

  try {
    const { unique, totalRows } = await loadUniqueNormas(
      supabase,
      scope,
      body.company_id ?? null,
      maxUnique,
    );

    if (unique.length === 0) {
      await supabase.from("watchdog_run_audit").update({
        status: "completed",
        normas_total: totalRows,
        normas_unique: 0,
        normas_checked: 0,
        change_events_created: 0,
        total_cost_usd: 0,
        duration_ms: Date.now() - startedAt,
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
      return jsonOk({
        run_id: runId,
        normas_total: totalRows,
        normas_unique: 0,
        normas_checked: 0,
        change_events_created: 0,
        total_cost_usd: 0,
        duration_ms: Date.now() - startedAt,
        message: "Nenhuma norma a checar.",
      });
    }

    let totalCost = 0;
    let normasChecked = 0;
    let eventsCreated = 0;

    for (let i = 0; i < unique.length; i += BATCH_SIZE) {
      const batch = unique.slice(i, i + BATCH_SIZE);
      const batchStart = Date.now();
      const result = await checkBatchViaPerplexity(
        PERPLEXITY_API_KEY,
        batch,
      );
      const batchLatency = Date.now() - batchStart;

      totalCost += result.costUsd;
      normasChecked += batch.length;

      // Log granular em ai_usage_logs pra correlacionar custo por batch.
      try {
        await supabase.from("ai_usage_logs").insert({
          function_name: "legislation-weekly-watchdog",
          feature_tag: "watchdog:batch",
          model: PERPLEXITY_MODEL,
          user_id: userId,
          prompt_tokens: result.promptTokens || null,
          completion_tokens: result.completionTokens || null,
          total_tokens: (result.promptTokens + result.completionTokens) || null,
          estimated_cost_usd: result.costUsd,
          latency_ms: batchLatency,
          success: !result.error,
          error_text: result.error ?? null,
          request_meta: {
            run_id: runId,
            batch_index: Math.floor(i / BATCH_SIZE),
            batch_size: batch.length,
          },
        });
      } catch (logErr) {
        console.warn("[watchdog] ai_usage_logs insert failed:", logErr);
      }

      if (result.error || result.changes.length === 0) continue;

      // Fan-out: pra cada mudança detectada, escreve N rows
      // (uma por legislation_id que compartilha a chave).
      const eventsToInsert: Array<Record<string, unknown>> = [];
      const byKey = new Map(batch.map((n) => [n.key, n]));
      for (const change of result.changes) {
        if (change.status === "no_change") continue;
        const norma = byKey.get(change.norma_key);
        if (!norma) continue;
        for (let j = 0; j < norma.legislation_ids.length; j++) {
          eventsToInsert.push({
            legislation_id: norma.legislation_ids[j],
            company_id: norma.company_ids[j],
            watchdog_run_id: runId,
            change_type: change.status,
            diff_summary: change.diff_summary ?? "(sem detalhes)",
            source_url: change.source_url,
            confidence: change.confidence,
            raw_response: { norma_key: change.norma_key, status: change.status },
          });
        }
      }

      if (eventsToInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from("legislation_change_events")
          .insert(eventsToInsert);
        if (insertErr) {
          console.warn("[watchdog] insert change events failed:", insertErr.message);
        } else {
          eventsCreated += eventsToInsert.length;
        }
      }
    }

    const duration = Date.now() - startedAt;
    await supabase.from("watchdog_run_audit").update({
      status: "completed",
      normas_total: totalRows,
      normas_unique: unique.length,
      normas_checked: normasChecked,
      change_events_created: eventsCreated,
      total_cost_usd: totalCost,
      duration_ms: duration,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);

    return jsonOk({
      run_id: runId,
      normas_total: totalRows,
      normas_unique: unique.length,
      normas_checked: normasChecked,
      change_events_created: eventsCreated,
      total_cost_usd: totalCost,
      duration_ms: duration,
    });
  } catch (err) {
    const errorText = err instanceof Error ? err.message : String(err);
    await supabase.from("watchdog_run_audit").update({
      status: "failed",
      error_text: errorText,
      duration_ms: Date.now() - startedAt,
      finished_at: new Date().toISOString(),
    }).eq("id", runId);
    return jsonError(500, errorText);
  }
}

async function loadUniqueNormas(
  supabase: SupabaseClient,
  scope: "global" | "company",
  companyId: string | null,
  maxUnique: number,
): Promise<{ unique: UniqueNorma[]; totalRows: number }> {
  // Tem que paginar manualmente — `legislations` pode ter mais de 1k rows
  // (Gabardo sozinho tem 1.448) e o Supabase REST cap é 1000 por request.
  const PAGE = 1000;
  type Row = {
    id: string;
    company_id: string;
    norm_type: string | null;
    norm_number: string | null;
    issuing_body: string | null;
    publication_date: string | null;
    title: string | null;
    jurisdiction: string | null;
  };
  const all: Row[] = [];
  let offset = 0;
  for (;;) {
    let q = supabase
      .from("legislations")
      .select(
        "id, company_id, norm_type, norm_number, issuing_body, publication_date, title, jurisdiction",
      )
      .eq("is_active", true)
      .range(offset, offset + PAGE - 1);
    if (scope === "company" && companyId) {
      q = q.eq("company_id", companyId);
    }
    const { data, error } = await q;
    if (error) throw new Error(`Falha lendo legislations: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as Row[]));
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  // Última detecção por chave — usado pra contextualizar a busca ("o que
  // mudou desde X?"). Lê de uma vez só pra evitar N+1.
  const { data: lastChecks } = await supabase
    .from("legislation_change_events")
    .select("legislation_id, detected_at")
    .order("detected_at", { ascending: false });
  const lastByLeg = new Map<string, string>();
  for (const row of (lastChecks ?? []) as Array<{ legislation_id: string; detected_at: string }>) {
    if (!lastByLeg.has(row.legislation_id)) {
      lastByLeg.set(row.legislation_id, row.detected_at);
    }
  }

  const byKey = new Map<string, UniqueNorma>();
  for (const row of all) {
    const normType = (row.norm_type ?? "").trim();
    const normNumber = (row.norm_number ?? "").trim();
    if (!normType || !normNumber) continue; // skip lixo
    const issuing = (row.issuing_body ?? "").trim();
    const pubDate = row.publication_date ?? null;
    const key = `${normType.toLowerCase()}|${normNumber.toLowerCase()}|${issuing.toLowerCase()}|${pubDate ?? ""}`;

    const existing = byKey.get(key);
    if (existing) {
      existing.legislation_ids.push(row.id);
      existing.company_ids.push(row.company_id);
      const lastForRow = lastByLeg.get(row.id);
      if (lastForRow && (!existing.last_checked_at || lastForRow > existing.last_checked_at)) {
        existing.last_checked_at = lastForRow;
      }
    } else {
      byKey.set(key, {
        key,
        norm_type: normType,
        norm_number: normNumber,
        issuing_body: issuing,
        publication_date: pubDate,
        title: (row.title ?? "").slice(0, 120),
        jurisdiction: row.jurisdiction ?? "",
        legislation_ids: [row.id],
        company_ids: [row.company_id],
        last_checked_at: lastByLeg.get(row.id) ?? null,
      });
    }
  }

  // Prioriza normas nunca checadas; depois mais antigas no histórico.
  const unique = Array.from(byKey.values())
    .sort((a, b) => {
      if (!a.last_checked_at && b.last_checked_at) return -1;
      if (a.last_checked_at && !b.last_checked_at) return 1;
      if (!a.last_checked_at && !b.last_checked_at) return 0;
      return (a.last_checked_at ?? "").localeCompare(b.last_checked_at ?? "");
    })
    .slice(0, maxUnique);

  return { unique, totalRows: all.length };
}

async function checkBatchViaPerplexity(
  apiKey: string,
  batch: UniqueNorma[],
): Promise<{
  changes: DetectedChange[];
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  error: string | null;
}> {
  const itemsText = batch.map((n, idx) => {
    const ctx = [
      `${idx + 1}. norma_key="${n.key}"`,
      `   tipo="${n.norm_type}" numero="${n.norm_number}"`,
      n.issuing_body ? `   orgao="${n.issuing_body}"` : "",
      n.publication_date ? `   publicacao="${n.publication_date}"` : "",
      n.title ? `   titulo="${n.title}"` : "",
      n.last_checked_at ? `   ultima_checagem="${n.last_checked_at.slice(0, 10)}"` : "   ultima_checagem=nunca",
    ].filter(Boolean).join("\n");
    return ctx;
  }).join("\n\n");

  const userPrompt = `Para cada norma listada abaixo, busque na web (DOU, planalto, sites de agências, portais oficiais) e me diga se houve uma das seguintes situações desde a publicação (ou desde a última checagem se houver):

- **amended**: artigo(s) alterados por norma posterior (decreto altera lei, por exemplo)
- **revoked**: revogada totalmente
- **superseded**: substituída integralmente por outra norma (ex: NBR atualizada)
- **clarified**: nota técnica/parecer/jurisprudência relevante que muda a aplicação prática
- **no_change**: nada relevante mudou

NORMAS A VERIFICAR:
${itemsText}

REGRAS DE OUTPUT (CRÍTICO):
- Retorne JSON ARRAY puro, SEM markdown, SEM texto antes ou depois.
- Uma entry por norma na ordem em que apareceram.
- Use EXATAMENTE a string norma_key fornecida.
- diff_summary em PT-BR, 1-2 frases técnicas. NULL apenas se status=no_change.
- source_url HTTPS de fonte oficial (DOU, planalto, agência). NULL se status=no_change.
- confidence entre 0.0 (palpite) e 1.0 (confirmado por fonte oficial).
- Se não conseguir verificar, retorne status="no_change" com confidence=0.5 (não invente mudança).

EXEMPLO DE FORMATO:
[
  {"norma_key":"...","status":"amended","diff_summary":"Artigo 4º alterado pela Lei 14.x/2026","source_url":"https://www.in.gov.br/...","confidence":0.9},
  {"norma_key":"...","status":"no_change","diff_summary":null,"source_url":null,"confidence":0.7}
]`;

  try {
    const resp = await callPerplexityWithRetry(apiKey, {
      model: PERPLEXITY_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Você é analista jurídico brasileiro. Sua tarefa é verificar se normas legais foram alteradas, revogadas ou substituídas. Use busca web. Retorne SOMENTE JSON array, sem texto adicional.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    });

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "");
      return {
        changes: [],
        promptTokens: 0,
        completionTokens: 0,
        costUsd: 0,
        error: `Perplexity HTTP ${resp.status}: ${errorText.slice(0, 200)}`,
      };
    }

    const json = await resp.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const raw = json.choices?.[0]?.message?.content ?? "[]";
    const promptTokens = json.usage?.prompt_tokens ?? 0;
    const completionTokens = json.usage?.completion_tokens ?? 0;
    const costUsd =
      (promptTokens / 1000) * SONAR_INPUT_USD_PER_1K +
      (completionTokens / 1000) * SONAR_OUTPUT_USD_PER_1K;

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractFirstJsonArray(raw));
    } catch (parseErr) {
      return {
        changes: [],
        promptTokens,
        completionTokens,
        costUsd,
        error: `parse falhou: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      };
    }
    if (!Array.isArray(parsed)) {
      return { changes: [], promptTokens, completionTokens, costUsd, error: "resposta não é array" };
    }

    const validStatuses = new Set(["amended", "revoked", "superseded", "clarified", "no_change"]);
    const changes: DetectedChange[] = [];
    for (const raw_item of parsed) {
      if (!raw_item || typeof raw_item !== "object") continue;
      const item = raw_item as Record<string, unknown>;
      const normaKey = typeof item.norma_key === "string" ? item.norma_key : "";
      const status = typeof item.status === "string" ? item.status : "no_change";
      if (!normaKey || !validStatuses.has(status)) continue;
      const diffSummary = typeof item.diff_summary === "string" ? item.diff_summary : null;
      const sourceUrl = typeof item.source_url === "string" && item.source_url.startsWith("http")
        ? item.source_url
        : null;
      const confidenceRaw = typeof item.confidence === "number" ? item.confidence : 0.5;
      const confidence = Math.max(0, Math.min(1, confidenceRaw));
      changes.push({
        norma_key: normaKey,
        status: status as DetectedChange["status"],
        diff_summary: diffSummary,
        source_url: sourceUrl,
        confidence,
      });
    }
    return { changes, promptTokens, completionTokens, costUsd, error: null };
  } catch (err) {
    return {
      changes: [],
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function jsonOk(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
