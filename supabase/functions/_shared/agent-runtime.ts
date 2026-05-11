// Loop agentic via Vercel AI SDK (npm:ai), apontando pro Lovable Gateway.
//
// O modelo decide quais tools chamar; o SDK roda o loop até maxSteps OU até
// `finishReason !== 'tool-calls'`. Persistimos 1 row em `agent_runs` por
// execução e várias em `agent_steps` (1 por LLM call + 1 por tool call)
// via `onStepFinish` callback.
//
// Por que AI SDK (e não loop manual): tools com Zod schemas dão type
// safety nos `execute`, parallel tool calls funcionam nativamente, e
// trocar provider é mudança de 1 linha. Mesma infra (Deno + Lovable
// Gateway via OpenAI-compatible baseURL) — zero secret novo.
//
// Versionamento: travamos `npm:ai@4.3.16` + `@ai-sdk/openai@1.3.22` +
// `zod@3.25.76`. AI SDK lança versão major a cada ~6 meses com breaking
// changes — pinar evita surpresa silenciosa.
//
// Diferença pro loop manual anterior: AI SDK faz UM `generateText` que
// internamente loopa; nosso código antigo fazia N chamadas `aiCall`
// explicitamente. Schema do DB (`agent_runs`/`agent_steps`/`ai_usage_logs`)
// não muda — só a forma de gerar os steps que vai pra dentro do callback.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText, tool as aiTool } from "npm:ai@4.3.16";
import { createOpenAI } from "npm:@ai-sdk/openai@1.3.22";
import { z } from "npm:zod@3.25.76";
import { estimateCostUsd, isPricedModel } from "./ai-pricing.ts";

// Tool com Zod schema. O `execute` recebe args já parseados e tipados.
// `T extends z.ZodTypeAny` permite que cada tool tenha seu próprio shape.
export interface AgentTool<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  parameters: T;
  execute: (args: z.infer<T>) => Promise<unknown>;
}

export interface AgentRunInput {
  agentName: string;
  /** Default: google/gemini-2.5-pro. Pode trocar pra openai/gpt-4o-mini, etc. */
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: AgentTool<any>[];
  /** Default: 8. Cap duro pro caso do agente não chamar finalize. */
  maxSteps?: number;
  companyId?: string | null;
  branchId?: string | null;
  triggeredBy?: string | null;
  /** Cliente Supabase com service role — único writer das tabelas agent_*. */
  supabase: SupabaseClient;
  inputForLog?: Record<string, unknown>;
  /** Default: 0.2. */
  temperature?: number;
}

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  errorText?: string;
}

export interface AgentRunResult {
  runId: string;
  finalText: string;
  toolCallCount: number;
  toolCalls: ToolCallRecord[];
  reachedMaxSteps: boolean;
  totalCostUsd: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const model = input.model ?? "google/gemini-2.5-pro";
  const maxSteps = input.maxSteps ?? 8;
  const temperature = input.temperature ?? 0.2;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Lovable Gateway é OpenAI-compatible. Mesmo apiKey usado pelo aiCall.
  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: LOVABLE_API_KEY,
  });

  const { data: run, error: runErr } = await input.supabase
    .from("agent_runs")
    .insert({
      agent_name: input.agentName,
      company_id: input.companyId ?? null,
      branch_id: input.branchId ?? null,
      triggered_by: input.triggeredBy ?? null,
      input: input.inputForLog ?? {},
      status: "running",
    })
    .select("id")
    .single();
  if (runErr || !run) {
    throw new Error(`failed to create agent_run: ${runErr?.message ?? "no row"}`);
  }
  const runId = run.id as string;

  // Converte nossos `AgentTool` pro formato do AI SDK.
  const aiTools = Object.fromEntries(
    input.tools.map((t) => [
      t.name,
      aiTool({
        description: t.description,
        parameters: t.parameters,
        execute: t.execute,
      }),
    ]),
  );

  // Contador global de step_index — incrementa pra cada row (llm_call OU
  // tool_call). Persistência granular no onStepFinish callback.
  let stepIndex = 0;
  let toolCallCount = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCostUsd = 0;
  const toolCalls: ToolCallRecord[] = [];

  try {
    const result = await generateText({
      model: lovable(model),
      system: input.systemPrompt,
      prompt: input.userPrompt,
      tools: aiTools,
      maxSteps,
      temperature,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onStepFinish: async ({ toolCalls: stepToolCalls, toolResults, finishReason, text, usage }: any) => {
        // Acumula custo do step.
        const promptTokens = usage?.promptTokens ?? 0;
        const completionTokens = usage?.completionTokens ?? 0;
        const costUsd = isPricedModel(model)
          ? estimateCostUsd(model, promptTokens, completionTokens)
          : 0;
        totalPromptTokens += promptTokens;
        totalCompletionTokens += completionTokens;
        totalCostUsd += costUsd;

        // 1 row pro llm_call.
        try {
          await input.supabase.from("agent_steps").insert({
            run_id: runId,
            step_index: stepIndex++,
            step_type: "llm_call",
            output: {
              finish_reason: finishReason ?? null,
              has_tool_calls: (stepToolCalls?.length ?? 0) > 0,
              text_length: (text ?? "").length,
            },
            tokens_prompt: promptTokens,
            tokens_completion: completionTokens,
            cost_usd: costUsd,
          });
        } catch (err) {
          console.warn(`[agent-runtime] failed to log llm_call step:`, err);
        }

        // 1 row por tool call do step. toolResults vem alinhado por toolCallId.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resultsByCallId = new Map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((toolResults ?? []) as any[]).map((r) => [r.toolCallId, r]),
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const tc of (stepToolCalls ?? []) as any[]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resultEntry = resultsByCallId.get(tc.toolCallId) as any;
          const output = resultEntry?.result ?? null;
          const errorText = resultEntry?.error
            ? String(resultEntry.error?.message ?? resultEntry.error)
            : undefined;

          try {
            await input.supabase.from("agent_steps").insert({
              run_id: runId,
              step_index: stepIndex++,
              step_type: "tool_call",
              tool_name: tc.toolName,
              input: tc.args as Record<string, unknown>,
              output: output as Record<string, unknown>,
              error_text: errorText ?? null,
            });
          } catch (err) {
            console.warn(`[agent-runtime] failed to log tool_call step:`, err);
          }

          toolCallCount++;
          toolCalls.push({
            name: tc.toolName,
            input: tc.args as Record<string, unknown>,
            output,
            errorText,
          });
        }
      },
    });

    // AI SDK considera "reached max steps" quando finishReason === 'length'
    // OU quando steps.length === maxSteps sem finishReason='stop'.
    const reachedMaxSteps =
      result.finishReason !== "stop" &&
      result.steps.length >= maxSteps;

    // Log agregado em ai_usage_logs (compat com dashboard existente).
    try {
      await input.supabase.from("ai_usage_logs").insert({
        function_name: input.agentName,
        feature_tag: "agent-loop",
        model,
        company_id: input.companyId ?? null,
        user_id: input.triggeredBy ?? null,
        prompt_tokens: totalPromptTokens || null,
        completion_tokens: totalCompletionTokens || null,
        total_tokens: (totalPromptTokens + totalCompletionTokens) || null,
        estimated_cost_usd: totalCostUsd,
        success: true,
        request_meta: { run_id: runId, ai_sdk: true },
      });
    } catch (err) {
      console.warn(`[agent-runtime] ai_usage_logs insert failed:`, err);
    }

    await input.supabase
      .from("agent_runs")
      .update({
        status: "completed",
        output: {
          text: result.text,
          tool_call_count: toolCallCount,
          reached_max_steps: reachedMaxSteps,
          finish_reason: result.finishReason,
        },
        total_steps: stepIndex,
        total_cost_usd: totalCostUsd,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return {
      runId,
      finalText: result.text,
      toolCallCount,
      toolCalls,
      reachedMaxSteps,
      totalCostUsd,
      totalPromptTokens,
      totalCompletionTokens,
    };
  } catch (err) {
    const errorText = err instanceof Error ? err.message : String(err);

    try {
      await input.supabase.from("ai_usage_logs").insert({
        function_name: input.agentName,
        feature_tag: "agent-loop",
        model,
        company_id: input.companyId ?? null,
        user_id: input.triggeredBy ?? null,
        prompt_tokens: totalPromptTokens || null,
        completion_tokens: totalCompletionTokens || null,
        total_tokens: (totalPromptTokens + totalCompletionTokens) || null,
        estimated_cost_usd: totalCostUsd,
        success: false,
        error_text: errorText,
        request_meta: { run_id: runId, ai_sdk: true },
      });
    } catch { /* ignore */ }

    await input.supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error_text: errorText,
        total_steps: stepIndex,
        total_cost_usd: totalCostUsd,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    throw err;
  }
}
