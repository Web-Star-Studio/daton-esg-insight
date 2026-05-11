// Loop agentic minimalista usando `aiCall` (Lovable Gateway).
//
// O modelo decide quais tools chamar; este runtime executa cada tool e
// devolve o resultado pro modelo até `finish_reason !== 'tool_calls'` OU
// `maxSteps` ser atingido. Persiste 1 row em `agent_runs` por execução
// e 1 row em `agent_steps` por turno (LLM call ou tool call).
//
// Por que loop manual (não framework): `aiCall` em `_shared/ai-logger.ts`
// já passa `tools`/`tool_choice` direto pro Lovable Gateway (linhas 40-41
// + spread em 135) e loga em `ai_usage_logs`. `daton-ai-chat` faz só
// single-turn com tools — não é loop verdadeiro. Esta é a primeira
// implementação real de loop multi-turno no projeto.
//
// Custo: passamos `meta: { run_id }` no contexto do `aiCall`, então
// `ai_usage_logs.request_meta->>'run_id'` cruza com `agent_runs.id`.
// Para custo total da run:
//
//   SELECT SUM(estimated_cost_usd) FROM ai_usage_logs
//   WHERE request_meta->>'run_id' = '<runId>';

import { aiCall, type AiCallContext } from "./ai-logger.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AgentTool {
  name: string;
  description: string;
  /** JSON Schema (formato OpenAI tool params). */
  parameters: Record<string, unknown>;
  /** Executa a tool e devolve o resultado serializável. Erros são
   *  capturados pelo runtime e devolvidos pro modelo como `{ error: ... }`. */
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentRunInput {
  agentName: string;
  /** Default: google/gemini-2.5-pro. */
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  tools: AgentTool[];
  /** Default: 8. Cap duro — sem isso loop pode queimar custo silenciosamente. */
  maxSteps?: number;
  companyId?: string | null;
  branchId?: string | null;
  /** null em runs do cron / chamadas server-to-server. */
  triggeredBy?: string | null;
  /** Cliente Supabase com service role — único writer das tabelas agent_*. */
  supabase: SupabaseClient;
  /** Snapshot leve do input pra debugging — não loga prompt completo. */
  inputForLog?: Record<string, unknown>;
  /** Default: 0.2. Determinismo razoável pro caso típico. */
  temperature?: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

interface CompletionResponse {
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
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
  /** Toda invocação de tool, na ordem. Inclui erros. */
  toolCalls: ToolCallRecord[];
  /** true se o loop saiu por bater maxSteps sem o modelo finalizar. */
  reachedMaxSteps: boolean;
}

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const model = input.model ?? "google/gemini-2.5-pro";
  const maxSteps = input.maxSteps ?? 8;
  const temperature = input.temperature ?? 0.2;

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

  const messages: ChatMessage[] = [
    { role: "system", content: input.systemPrompt },
    { role: "user", content: input.userPrompt },
  ];

  // Formato OpenAI: [{ type: "function", function: { name, description, parameters } }]
  // Lovable Gateway repassa pro provider (Gemini/GPT) que entende esse shape.
  const openAiTools = input.tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const ctx: AiCallContext = {
    functionName: input.agentName,
    featureTag: "agent-loop",
    companyId: input.companyId ?? undefined,
    userId: input.triggeredBy ?? undefined,
    meta: { run_id: runId },
  };

  let stepIndex = 0;
  let toolCallCount = 0;
  let finalText = "";
  let reachedMaxSteps = false;
  const toolCalls: ToolCallRecord[] = [];

  try {
    for (let step = 0; step < maxSteps; step++) {
      const llmStart = Date.now();
      let resp: CompletionResponse;
      try {
        resp = await aiCall<CompletionResponse>(ctx, {
          model,
          messages: messages as Array<{ role: string; content: unknown }>,
          tools: openAiTools,
          tool_choice: "auto",
          temperature,
        });
      } catch (err) {
        const errorText = err instanceof Error ? err.message : String(err);
        await input.supabase.from("agent_steps").insert({
          run_id: runId,
          step_index: stepIndex++,
          step_type: "llm_call",
          duration_ms: Date.now() - llmStart,
          error_text: errorText,
        });
        throw err;
      }

      const choice = resp.choices?.[0];
      if (!choice) {
        throw new Error("Lovable Gateway response missing choices");
      }
      const assistantMsg = choice.message;
      messages.push(assistantMsg);

      await input.supabase.from("agent_steps").insert({
        run_id: runId,
        step_index: stepIndex++,
        step_type: "llm_call",
        output: { finish_reason: choice.finish_reason, has_tool_calls: !!assistantMsg.tool_calls?.length },
        duration_ms: Date.now() - llmStart,
      });

      const turnToolCalls = assistantMsg.tool_calls ?? [];
      // Loop encerra quando o modelo respondeu com texto final (sem tool_calls)
      // OU explicitamente sinalizou stop. A condição `finish_reason ===
      // "tool_calls"` é a forma OpenAI-compatible — Gemini via Lovable usa
      // o mesmo schema.
      if (turnToolCalls.length === 0 || choice.finish_reason !== "tool_calls") {
        finalText = assistantMsg.content ?? "";
        break;
      }

      for (const tc of turnToolCalls) {
        const toolDef = input.tools.find((t) => t.name === tc.function.name);
        const tcStart = Date.now();
        let result: unknown;
        let errorText: string | undefined;
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments || "{}");
          if (!toolDef) throw new Error(`Unknown tool: ${tc.function.name}`);
          result = await toolDef.execute(parsedArgs);
        } catch (err) {
          errorText = err instanceof Error ? err.message : String(err);
          // Devolvemos um objeto serializável pro modelo. Sem isso, o turno
          // seguinte vê "undefined" e fica perdido.
          result = { error: errorText };
        }

        await input.supabase.from("agent_steps").insert({
          run_id: runId,
          step_index: stepIndex++,
          step_type: "tool_call",
          tool_name: tc.function.name,
          input: parsedArgs,
          output: result as Record<string, unknown>,
          duration_ms: Date.now() - tcStart,
          error_text: errorText ?? null,
        });

        toolCallCount++;
        toolCalls.push({ name: tc.function.name, input: parsedArgs, output: result, errorText });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result),
        });
      }

      if (step === maxSteps - 1) {
        // Última iteração e ainda há tool_calls — vai sair do loop sem
        // finalText. Marcamos pra UI poder reportar "agent did not finalize".
        reachedMaxSteps = true;
      }
    }

    await input.supabase
      .from("agent_runs")
      .update({
        status: "completed",
        output: {
          text: finalText,
          tool_call_count: toolCallCount,
          reached_max_steps: reachedMaxSteps,
        },
        total_steps: stepIndex,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return { runId, finalText, toolCallCount, toolCalls, reachedMaxSteps };
  } catch (err) {
    const errorText = err instanceof Error ? err.message : String(err);
    await input.supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error_text: errorText,
        total_steps: stepIndex,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    throw err;
  }
}
