// Wrapper único para chamadas ao gateway Lovable AI.
//
// Por que existe: cada edge function fazia `fetch('https://ai.gateway.
// lovable.dev/v1/chat/completions', …)` direto e descartava o `usage` da
// resposta. Resultado: zero visibilidade de custo/tokens por
// função/modelo/empresa. Este wrapper centraliza a chamada, mede latência
// e grava em `public.ai_usage_logs`.
//
// Não substitui a função: ela continua dona do prompt, das tools, do
// parsing do retorno. Só centraliza o transporte e o registro.
//
// Modos suportados:
//   - non-streaming: `aiCall(...)` → retorna o JSON completo, loga 1 linha.
//   - streaming: `aiCallStream(...)` → retorna o `Response` original e
//     uma promise `usagePromise` que resolve quando a última linha SSE
//     com `usage` for vista. Quem consome é responsável por await na
//     promise depois de drenar o stream pra fechar o log.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { estimateCostUsd, isPricedModel } from "./ai-pricing.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AiCallContext = {
  /** Nome canônico da edge function (use o nome do diretório). */
  functionName: string;
  /** Subdivisão lógica dentro da função, ex. 'chat', 'ocr', 'gri-autofill'. */
  featureTag?: string;
  /** Empresa associada à requisição, se houver. */
  companyId?: string | null;
  /** Usuário autenticado que originou a chamada, se houver. */
  userId?: string | null;
  /** Metadata extra para investigação (não vaza prompt completo). */
  meta?: Record<string, unknown>;
};

export type AiCallBody = {
  model: string;
  messages: Array<{ role: string; content: unknown }>;
  tools?: unknown;
  tool_choice?: unknown;
  temperature?: number;
  max_tokens?: number;
  // Outros campos OpenAI-compatible passam direto.
  [k: string]: unknown;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

const getServiceClient = (): SupabaseClient | null => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
};

const writeLog = async (
  ctx: AiCallContext,
  body: AiCallBody,
  result: {
    usage?: Usage | null;
    latencyMs: number;
    success: boolean;
    errorText?: string;
  },
) => {
  const client = getServiceClient();
  if (!client) {
    console.warn("[ai-logger] sem SUPABASE_SERVICE_ROLE_KEY — log ignorado");
    return;
  }
  const promptTokens = result.usage?.prompt_tokens ?? 0;
  const completionTokens = result.usage?.completion_tokens ?? 0;
  const totalTokens =
    result.usage?.total_tokens ?? promptTokens + completionTokens;
  const costUsd = estimateCostUsd(body.model, promptTokens, completionTokens);

  if (!isPricedModel(body.model)) {
    console.warn(
      `[ai-logger] modelo "${body.model}" não está em MODEL_PRICES — custo gravado como 0`,
    );
  }

  const { error } = await client.from("ai_usage_logs").insert({
    function_name: ctx.functionName,
    feature_tag: ctx.featureTag ?? null,
    model: body.model,
    company_id: ctx.companyId ?? null,
    user_id: ctx.userId ?? null,
    prompt_tokens: promptTokens || null,
    completion_tokens: completionTokens || null,
    total_tokens: totalTokens || null,
    estimated_cost_usd: costUsd,
    latency_ms: result.latencyMs,
    success: result.success,
    error_text: result.errorText ?? null,
    request_meta: ctx.meta ?? {},
  });
  if (error) {
    console.warn("[ai-logger] insert falhou:", error.message);
  }
};

/**
 * Chamada não-streaming. Retorna o JSON parseado da resposta da Lovable.
 * Loga 1 linha em `ai_usage_logs` (sucesso ou falha).
 *
 * Lança em erros HTTP/timeout — quem chama trata como hoje.
 */
export const aiCall = async <T = unknown>(
  ctx: AiCallContext,
  body: AiCallBody,
  opts: { timeoutMs?: number } = {},
): Promise<T> => {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const timeoutMs = opts.timeoutMs ?? 45_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startedAt = Date.now();
  let httpResp: Response | null = null;
  try {
    httpResp = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, stream: false }),
      signal: controller.signal,
    });
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    await writeLog(ctx, body, {
      latencyMs,
      success: false,
      errorText: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  const latencyMs = Date.now() - startedAt;

  if (!httpResp.ok) {
    const errorText = await httpResp.text().catch(() => "");
    await writeLog(ctx, body, {
      latencyMs,
      success: false,
      errorText: `HTTP ${httpResp.status}: ${errorText.slice(0, 500)}`,
    });
    const err = new Error(`AI API error: ${httpResp.status}`);
    (err as Error & { status?: number; body?: string }).status = httpResp.status;
    (err as Error & { status?: number; body?: string }).body = errorText;
    throw err;
  }

  const json = (await httpResp.json()) as T & { usage?: Usage };
  await writeLog(ctx, body, {
    latencyMs,
    success: true,
    usage: json.usage ?? null,
  });
  return json;
};

/**
 * Variante streaming. Retorna o `Response` original (pra quem chama fazer
 * o forwarding do SSE) + uma promise que resolve quando o `usage` final
 * for parseado. O caller deve ler o stream com `tee()` ou interceptar e
 * resolver o `usage` chamando `reportStreamUsage()` no fim.
 *
 * Para a primeira onda de refator (PR 2), preferimos manter as edge
 * functions de streaming sem instrumentação e logar só o request inicial
 * (sem tokens). Implementação completa com tee fica para PR seguinte.
 */
export const logStreamRequest = async (
  ctx: AiCallContext,
  body: AiCallBody,
  result: { latencyMs: number; success: boolean; errorText?: string },
) => {
  await writeLog(ctx, body, result);
};
