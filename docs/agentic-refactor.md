# Refator Agentic + Hardening — Handoff

Doc auto-suficiente para o próximo chat. Cobre dois objetivos:

1. **Hardening** das edge functions de IA já implementadas no worktree (sem refator estrutural).
2. **Refator agentic**: trocar single-shot Perplexity por loop com tool use, **usando apenas a infra existente** (Lovable AI Gateway + Perplexity). Sem novos providers, sem novos secrets.

> Trabalhe sempre dentro do worktree `/home/jp/daton/daton-esg-insight/.claude/worktrees/vivid-wobbling-quail`. Não toque no main.

---

## 0. Contexto mínimo

**Projeto**: daton-esg-insight. Front Vite + React + TS hospedado via Lovable. Back Supabase (Edge Functions Deno + Postgres + pg_cron). Frontend chama edge functions via `supabase.functions.invoke()`.

**Deploy**:
- Autosync do Lovable é não-determinístico para edge functions; MCP Supabase falha em algumas funções.
- **Sempre deployar via CLI**: `supabase functions deploy <name>`
- Migrations: `supabase db push`

**O usuário já testou via UI** o que foi implementado no worktree. Foco aqui é hardening + agentic — sem regressar contrato com o front.

---

## 1. Estado atual no worktree (não-commitado)

Implementação single-shot de 3 features de IA, todas chamando Perplexity Sonar via `fetch` direto:

| Edge function | Path | LOC | Padrão atual |
|---|---|---|---|
| `legislation-suggestions-from-profile` | `supabase/functions/legislation-suggestions-from-profile/index.ts` | ~460 | Cruza `generated_tags` × `applicability_tags` (DB) + 1 chamada Perplexity quando match < 20 |
| `legislation-monthly-radar` | `supabase/functions/legislation-monthly-radar/index.ts` | ~485 | 1 chamada Perplexity Sonar-pro pedindo "6-12 normas do mês" |
| `compliance-update-letter-generator` | `supabase/functions/compliance-update-letter-generator/index.ts` | 832 | Lê `legislation_history` do mês, 1 chamada Perplexity para summary + diffs, persiste em `compliance_update_letters` |
| `compliance-update-letter-cron` | `supabase/functions/compliance-update-letter-cron/index.ts` | 130 | Itera branches ativas, chama generator sequencialmente |

Migrations não-aplicadas:
- `supabase/migrations/20260507120000_compliance_update_letters.sql` — tabela + pg_cron
- `supabase/migrations/20260508120000_legislation_ai_ingestion_fields.sql` — colunas `ai_ingested` em `legislations`

Front:
- `src/pages/ComplianceUpdateLetters.tsx`, `src/pages/LegislationSuggestions.tsx`
- `src/services/{complianceUpdateLetters,legislationSuggestions,legislationRadar}.ts`
- `src/hooks/data/{useComplianceUpdateLetters,useLegislationRadar,useLegislationSuggestions}.ts`
- `src/components/compliance/{ComplianceUpdateLetterPDF,ComplianceUpdateLetterViewer}.tsx`
- Rotas + sidebar em `App.tsx` e `AppSidebar.tsx`

---

## 2. Gaps de hardening (consertar antes do refator agentic)

### G1. JWT hard-coded na migration de cron — BLOQUEADOR DE SEGURANÇA

**Arquivo**: `supabase/migrations/20260507120000_compliance_update_letters.sql`, linhas 73–83.

O `cron.schedule` injeta um anon JWT inline no SQL — vai pro git. Mover pra `vault`:

```sql
-- Antes do cron.schedule:
SELECT vault.create_secret(
  '<anon-jwt>',
  'cron_invoke_jwt',
  'JWT usado pelo pg_cron para invocar edge functions internas'
);

-- No cron.schedule, ler via subquery:
SELECT cron.schedule(
  'compliance-update-letter-monthly',
  '0 6 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://dqlvioijqzlvnvvajmft.supabase.co/functions/v1/compliance-update-letter-cron',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_invoke_jwt')
    ),
    body := jsonb_build_object('source','cron','timestamp', now())
  );
  $$
);
```

> **Atenção**: o JWT já está no histórico do git da branch atual. Após mergear o fix, **rotacionar o anon key** no Supabase dashboard.

### G2. Cron processa sequencialmente — risco de timeout

**Arquivo**: `supabase/functions/compliance-update-letter-cron/index.ts`, linhas 56–87.

Loop síncrono. Para >50 branches, estoura o timeout da edge function (~150s free, ~400s paid). Refator pra responder 202 imediato e processar em background:

```ts
serve(async (req) => {
  // ... validações ...

  const task = (async () => {
    for (const b of branches ?? []) {
      // ... fetch generator ...
    }
    // ... log agregado ...
  })();

  // @ts-ignore — EdgeRuntime existe no runtime Supabase Deno
  EdgeRuntime.waitUntil(task);

  return new Response(
    JSON.stringify({ status: "accepted", branch_count: branches?.length ?? 0 }),
    { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
```

### G3. Sem retry no Perplexity

**Arquivos**: as 3 edge functions IA atuais. Cada `fetch("https://api.perplexity.ai/...")` é única — se a Perplexity der 5xx, falha pra sempre naquela run.

Criar helper compartilhado em `supabase/functions/_shared/perplexity-call.ts`:

```ts
export async function callPerplexityWithRetry(
  apiKey: string,
  body: unknown,
  opts: { retries?: number; backoffMs?: number } = {},
): Promise<Response> {
  const retries = opts.retries ?? 1;
  const backoff = opts.backoffMs ?? 2000;
  let lastErr: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok && (resp.status >= 500 || resp.status === 429) && i < retries) {
        await new Promise((r) => setTimeout(r, backoff * (i + 1)));
        continue;
      }
      return resp;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (i < retries) {
        await new Promise((r) => setTimeout(r, backoff * (i + 1)));
        continue;
      }
    }
  }
  throw lastErr ?? new Error("Perplexity call failed after retries");
}
```

Substituir cada `fetch("https://api.perplexity.ai/...")` direto pelas 3 functions de IA.

### G4. Status de branch silenciosamente pulado no cron

**Arquivo**: `supabase/functions/compliance-update-letter-cron/index.ts`, linhas 46–48.

Filtro `["Ativa","active","Ativo"]` não cobre variantes ("ATIVO", null). Branch fora do filtro não gera carta e ninguém é avisado. Ação: query "branches no filtro" + "branches totais", logar o delta em `ai_usage_logs.metadata.skipped_branches: [{id, name, status}]`.

### G5. Imports do sidebar

**Arquivo**: `src/components/AppSidebar.tsx`. O diff adiciona uso de `Sparkles` e `Mail` no submenu. Confirmar que ambos estão no `import { ... } from "lucide-react"` no topo. Se faltar, adicionar.

### G6. Botão de regeneração manual

**Arquivo**: `src/pages/ComplianceUpdateLetters.tsx`. Confirmar se existe botão "Regenerar carta" para mês corrente. Se não, adicionar — chama o generator com JWT do usuário (sem `cron_internal`). Útil para debug e quando o cron falha.

### G7. Documentar secrets necessários

Criar `supabase/functions/_shared/REQUIRED_SECRETS.md` listando:
- `PERPLEXITY_API_KEY` (já existe)
- `LOVABLE_API_KEY` (já existe — usado pelo `aiCall` em `_shared/ai-logger.ts`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (built-in)

> **Não há novo secret a adicionar** — o refator agentic usa o `LOVABLE_API_KEY` existente.

---

## 3. Decisão técnica do refator agentic

**Stack: zero providers novos.**

| Peça | Escolha | Por quê |
|---|---|---|
| Cérebro do agente | `google/gemini-2.5-pro` (default) ou `google/gemini-3-flash-preview` (econômico) | Já cabeado no Lovable Gateway, pricing já em `_shared/ai-pricing.ts:19-34`, suporta tool calling no formato OpenAI-compatible |
| Tool de busca | Perplexity Sonar / Sonar-pro | Já paga, já cabeada |
| Loop | Manual, ~30 linhas, sem framework | `aiCall` de `_shared/ai-logger.ts` já loga em `ai_usage_logs`. Lovable Gateway aceita `tools` e `tool_choice` (linhas 40-41 do helper). `daton-ai-chat` é prova de conceito em produção |
| Fallback | `openai/gpt-4o-mini` | Caso Gemini falhe persistente |

**Por que não Vercel AI SDK / Anthropic**: ambos exigem secret + billing novos. Toda a infra já está no projeto.

**Modelos com pricing cadastrado** (`_shared/ai-pricing.ts:19-34`):
- `google/gemini-3-flash-preview`: $0.075 / $0.30 por 1M tokens
- `google/gemini-2.5-pro`: $1.25 / $5.00 por 1M tokens
- `openai/gpt-5-mini`: $0.25 / $2.00
- `openai/gpt-4o-mini`: $0.15 / $0.60

> Sempre passar o slug exato (com prefixo `google/` ou `openai/`) — `isPricedModel` cospe warning se modelo não for reconhecido.

---

## 4. Refator agentic — passo a passo

### 4.1. Migration de observabilidade — `agent_runs` + `agent_steps`

Criar `supabase/migrations/<timestamp>_agent_runs.sql`:

```sql
CREATE TABLE public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id  uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  triggered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('running','completed','failed')) DEFAULT 'running',
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb,
  total_steps int NOT NULL DEFAULT 0,
  total_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  error_text text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX agent_runs_company_idx ON public.agent_runs (company_id, started_at DESC);
CREATE INDEX agent_runs_agent_idx   ON public.agent_runs (agent_name, started_at DESC);

CREATE TABLE public.agent_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  step_index int NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('llm_call','tool_call')),
  tool_name text,
  input  jsonb,
  output jsonb,
  tokens_prompt int,
  tokens_completion int,
  cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  duration_ms int,
  error_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_index)
);
CREATE INDEX agent_steps_run_idx ON public.agent_steps (run_id, step_index);

ALTER TABLE public.agent_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_select ON public.agent_runs FOR SELECT
  USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY agent_steps_select ON public.agent_steps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agent_runs r
    WHERE r.id = agent_steps.run_id
      AND r.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  ));
-- writes apenas via service role nas edge functions; sem policies de insert/update.
```

Para correlacionar com `ai_usage_logs` (que `aiCall` já popula), passe `meta: { run_id }` no `AiCallContext` — `request_meta->>'run_id'` permite o JOIN.

### 4.2. Helper `_shared/agent-runtime.ts`

Loop manual usando o `aiCall` que já existe. Sem framework, sem dependência nova.

```ts
// supabase/functions/_shared/agent-runtime.ts
//
// Loop agentic minimalista usando aiCall (Lovable Gateway). Modelo decide
// quais tools chamar; runtime executa e devolve o resultado pro modelo;
// loop encerra quando finishReason !== 'tool_calls' ou maxSteps atingido.

import { aiCall, type AiCallContext } from "./ai-logger.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AgentTool {
  name: string;
  description: string;
  /** JSON Schema (formato OpenAI tool params) */
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface AgentRunInput {
  agentName: string;
  /** default: google/gemini-2.5-pro */
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  tools: AgentTool[];
  /** default: 8 */
  maxSteps?: number;
  companyId?: string | null;
  branchId?: string | null;
  /** null em runs do cron */
  triggeredBy?: string | null;
  /** Service role */
  supabase: SupabaseClient;
  inputForLog?: Record<string, unknown>;
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

export interface AgentRunResult {
  runId: string;
  finalText: string;
  toolCallCount: number;
  /** Última invocação de cada tool, na ordem em que apareceram. */
  toolCalls: Array<{ name: string; input: Record<string, unknown>; output: unknown }>;
}

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const model = input.model ?? "google/gemini-2.5-pro";
  const maxSteps = input.maxSteps ?? 8;

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
  if (runErr || !run) throw new Error(`failed to create agent_run: ${runErr?.message}`);
  const runId = run.id as string;

  const messages: ChatMessage[] = [
    { role: "system", content: input.systemPrompt },
    { role: "user", content: input.userPrompt },
  ];

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
  const toolCalls: AgentRunResult["toolCalls"] = [];

  try {
    for (let step = 0; step < maxSteps; step++) {
      const stepStart = Date.now();
      const resp = await aiCall<{
        choices: Array<{ message: ChatMessage; finish_reason: string }>;
      }>(ctx, {
        model,
        messages: messages as Array<{ role: string; content: unknown }>,
        tools: openAiTools,
        tool_choice: "auto",
        temperature: 0.2,
      });

      const choice = resp.choices[0];
      const assistantMsg = choice.message;
      messages.push(assistantMsg);

      await input.supabase.from("agent_steps").insert({
        run_id: runId,
        step_index: stepIndex++,
        step_type: "llm_call",
        duration_ms: Date.now() - stepStart,
      });

      const turnToolCalls = assistantMsg.tool_calls ?? [];
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
        toolCalls.push({ name: tc.function.name, input: parsedArgs, output: result });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name: tc.function.name,
          content: JSON.stringify(result),
        });
      }
    }

    await input.supabase.from("agent_runs")
      .update({
        status: "completed",
        output: { text: finalText, tool_call_count: toolCallCount },
        total_steps: stepIndex,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return { runId, finalText, toolCallCount, toolCalls };
  } catch (err) {
    await input.supabase.from("agent_runs")
      .update({
        status: "failed",
        error_text: err instanceof Error ? err.message : String(err),
        total_steps: stepIndex,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    throw err;
  }
}
```

**Notas:**
- Custo por LLM step é gravado pelo `aiCall` em `ai_usage_logs` (request_meta.run_id). Para ver custo agregado da run: `SELECT SUM(estimated_cost_usd) FROM ai_usage_logs WHERE request_meta->>'run_id' = '<runId>'`.
- `tools` precisa estar no formato OpenAI: `[{ type: "function", function: { name, description, parameters } }]`. Lovable Gateway repassa pro provider (Gemini/GPT) que entende esse formato.
- Loop encerra quando `finish_reason !== "tool_calls"` (modelo respondeu com texto final) ou ao bater `maxSteps`.

### 4.3. Refator A — `legislation-monthly-radar` virando agente

**Hoje**: 1 prompt amplo pedindo 6–12 normas do mês.

**Agentic**: agente recebe perfil + UF + cidade + janela, decide quais 3-5 temas priorizar, faz **N buscas Perplexity focadas** (uma por tema), valida URLs governamentais via `fetch_url`, dedupe contra catálogo via `query_existing_legislations`, encerra chamando `finalize_novelties`.

Tools:

```ts
import { callPerplexityWithRetry } from "../_shared/perplexity-call.ts";
import { runAgent, type AgentTool } from "../_shared/agent-runtime.ts";

const tools: AgentTool[] = [
  {
    name: "search_perplexity",
    description: "Busca normas brasileiras publicadas em janela de datas. Use uma query por tema/jurisdição — não faça uma busca única ampla.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Query natural em PT-BR. Ex: 'normas ANTT publicadas março 2026 transporte cargas perigosas'" },
        date_from: { type: "string", description: "YYYY-MM-DD" },
        date_to:   { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["query", "date_from", "date_to"],
    },
    execute: async (args) => {
      const apiKey = Deno.env.get("PERPLEXITY_API_KEY")!;
      const resp = await callPerplexityWithRetry(apiKey, {
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Analista jurídico BR. Retorne JSON puro com array `items` (reference, norm_type, norm_number, title, summary, source_url, publication_date)." },
          { role: "user", content: `Busque normas publicadas entre ${args.date_from} e ${args.date_to}: ${args.query}` },
        ],
        temperature: 0.2,
      });
      const json = await resp.json();
      const content = json.choices?.[0]?.message?.content ?? "{}";
      // parse JSON balanceado, devolve items
      return { raw: content };
    },
  },
  {
    name: "fetch_url",
    description: "Baixa o HTML de uma URL para validar publicação. Use só pra URLs governamentais (in.gov.br, planalto, agências).",
    parameters: {
      type: "object",
      properties: { url: { type: "string", format: "uri" } },
      required: ["url"],
    },
    execute: async ({ url }) => {
      try {
        const resp = await fetch(url as string, { signal: AbortSignal.timeout(8000) });
        const text = await resp.text();
        return { status: resp.status, snippet: text.slice(0, 4000) };
      } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
      }
    },
  },
  {
    name: "query_existing_legislations",
    description: "Lista normas já vinculadas a uma branch — use pra evitar duplicar.",
    parameters: {
      type: "object",
      properties: { branch_id: { type: "string", format: "uuid" } },
      required: ["branch_id"],
    },
    execute: async ({ branch_id }) => {
      const { data } = await supabase
        .from("legislation_unit_compliance")
        .select("legislation_id, legislations(norm_type, norm_number, title)")
        .eq("branch_id", branch_id);
      return { existing: data ?? [] };
    },
  },
  {
    name: "finalize_novelties",
    description: "Retorna a lista final curada de normas. Chame UMA vez no final, com 6-12 itens.",
    parameters: {
      type: "object",
      properties: {
        novelties: {
          type: "array",
          items: {
            type: "object",
            properties: {
              reference: { type: "string" },
              norm_type: { type: "string" },
              norm_number: { type: "string" },
              publication_date: { type: "string" },
              title: { type: "string" },
              summary: { type: "string" },
              jurisdiction: { type: "string", enum: ["federal","estadual","municipal","nbr","internacional"] },
              state: { type: ["string","null"] },
              municipality: { type: ["string","null"] },
              issuing_body: { type: "string" },
              source_url: { type: "string", format: "uri" },
              applicability_hint: { type: "string", enum: ["real","potential"] },
              matched_themes: { type: "array", items: { type: "string" } },
            },
            required: ["reference","title","summary","jurisdiction","source_url","applicability_hint","matched_themes","publication_date"],
          },
        },
      },
      required: ["novelties"],
    },
    execute: async ({ novelties }) => ({ saved: true, count: (novelties as unknown[]).length }),
  },
];
```

System prompt:

```
Você é analista jurídico brasileiro. Sua missão é levantar legislação publicada em uma janela mensal aplicável a uma unidade específica.

PROCESSO:
1. Olhe os temas da unidade (matched_themes do perfil de compliance).
2. Para os 3-5 temas mais relevantes, faça uma busca Perplexity por tema (ex: licenciamento, resíduos, transporte). Não faça uma busca única ampla.
3. Para cada candidato com URL governamental, valide com fetch_url se a publicação data confere.
4. Dedupe contra o catálogo via query_existing_legislations.
5. Chame finalize_novelties UMA VEZ com a lista final (mínimo 6, máximo 12).

REGRAS DURAS:
- publication_date dentro da janela informada.
- jurisdiction='estadual' só pra UF da unidade; municipal só pra cidade da unidade.
- source_url HTTPS obrigatório.
```

**Caller** (no `handle` da edge function):

```ts
const { runId, toolCalls } = await runAgent({
  agentName: "legislation-monthly-radar",
  model: "google/gemini-2.5-pro",
  systemPrompt,
  userPrompt: `Branch: ${targetBranch.name} (${targetBranch.city}/${targetBranch.state}).
Janela: ${searchStartISO} a ${searchEndISO}.
Temas do perfil: ${tags.join(", ")}.
Branch ID (para query_existing_legislations): ${targetBranch.id}.`,
  tools,
  maxSteps: 12,
  companyId: companyId,
  branchId: targetBranch.id,
  triggeredBy: isCronInternal ? null : userId,
  supabase,
  inputForLog: { reference_month: monthStartISO },
});

const finalize = toolCalls.findLast?.((c) => c.name === "finalize_novelties");
const novelties = (finalize?.input?.novelties as RadarNovelty[]) ?? [];
// ...continua com validação server-side existente (state/city), retorna ResponseShape.
```

> **Não mude o contrato `ResponseShape`** que a UI consome. Mantém os campos `novelties`, `branch`, `reference_month`, `ai_failed`, `ai_error`, `duplicate_count`.

### 4.4. Refator B — `legislation-suggestions-from-profile`

Mesmo padrão. **Mantém a camada determinística** (SQL com tag overlap em `applicability_tags` — é grátis e rápida). Só o ramo de IA vira agente.

Quando `matched.length < AUTO_AI_THRESHOLD` (20) ou `body.expand_ai === true`, em vez do single-shot, roda `runAgent` com tools:
- `search_perplexity`
- `query_existing_legislations`
- `inspect_compliance_response({ question_id })` — lê `responses[question_id]` do perfil pra contextualizar dúvidas específicas
- `finalize_suggestions({ items })` — retorna `DiscoveredSuggestion[]`

System prompt: foco em "preencher buracos do perfil" — agente decide quais temas estão fracos (poucos matches no SQL) e busca legislação direcionada pra eles.

`maxSteps: 8`.

### 4.5. Refator C — `compliance-update-letter-generator` (opcional, fase 2)

**Recomendação: deixar pra depois.** O generator atual é robusto e já cumpre a função.

Refatorar agentic só vale a pena se feedback do usuário indicar cartas rasas em revogações. Caso sim:
- Agente roda **só pra normas revogadas sem substituta cadastrada**: `search_perplexity("o que substituiu a Lei X?")` + `fetch_url` pra validar fonte
- Output enriquece a observação da carta
- Resto do fluxo permanece igual

---

## 5. Ordem de execução

PRs separados (≤100 arquivos cada, regra Greptile do CLAUDE.md):

1. **PR 1 — Hardening**: gaps G1-G7. Sem agentic ainda.
2. **PR 2 — Migration `agent_runs`/`agent_steps`** + helper `_shared/agent-runtime.ts`.
3. **PR 3 — Refator radar** (legislation-monthly-radar). Começar por aqui — é o caso onde agentic dá mais ganho (per-theme parallel search vs single broad query).
4. **PR 4 — Refator suggestions** (legislation-suggestions-from-profile).
5. **PR 5 (opcional)** — refator generator. Só se houver feedback do usuário.

Cada PR passa por Greptile review automático (workflow obrigatório do projeto).

---

## 6. Critérios de aceitação

| Item | Como validar |
|---|---|
| G1 | `grep -r "eyJ" supabase/migrations/` retorna 0 hits; cron continua disparando dia 1 |
| G2 | Cron retorna 202 em <1s; após ~5min, `agent_runs` (ou `ai_usage_logs`) tem 1 entrada por branch |
| G3 | Forçar 503 mockado em modo dev; confirmar 1 retry antes de falhar |
| G4 | Rodar cron com 1 branch de status null; ver entrada em `ai_usage_logs.metadata.skipped_branches` |
| G5/G6/G7 | Build OK; regenerar manual funciona; doc existe |
| Refator radar (PR 3) | Run mensal cria linha em `agent_runs`; `agent_steps` mostra ≥3 chamadas Perplexity (uma por tema); `ResponseShape` intacto pra UI |
| Refator suggestions (PR 4) | Em branch nova com profile recém-preenchido, agente roda, propõe ≥3 normas com `source_url` HTTPS validada |

---

## 7. Variáveis de ambiente (Supabase secrets)

```bash
# Já existem no projeto — não adiciona nada novo
PERPLEXITY_API_KEY=...
LOVABLE_API_KEY=...
```

Sem `ANTHROPIC_API_KEY`. Sem nenhum secret novo.

---

## 8. Estimativa de custo

Usando `google/gemini-2.5-pro` ($1.25/M input, $5/M output) como cérebro:

| Item | Por run de radar |
|---|---|
| Gemini 2.5 Pro: 4-6 turnos × ~3k input + ~500 output | ~$0.018 |
| Perplexity Sonar-pro: 4-5 buscas × $0.005 search + tokens | ~$0.022 |
| **Total por branch/mês** | **~$0.04** |

50 branches/mês = ~$2/mês.

Modo econômico (`google/gemini-3-flash-preview`, $0.075/M input): cai pra ~$0.005 por run, ~$0.25/mês pras 50 branches.

Comparação com o single-shot atual: hoje cada radar gasta ~$0.015 (1 chamada Sonar-pro). Agentic com Gemini Flash custa **menos** que o single-shot atual, porque o cérebro é barato e ele faz buscas Perplexity mais focadas.

---

## 9. Notas finais

- **Não mude contratos das edge functions com o front** durante o refator. A UI espera `{ matched, discovered, ... }` na suggestions e `{ novelties, ... }` no radar — preserve. O agente é detalhe de implementação interno.
- **Cap duro** em `maxSteps`: 12 no radar, 8 nos outros. Sem isso, agente em loop pode queimar custo silenciosamente.
- **Não migre pra Vercel AI SDK** — não adiciona valor sobre o `aiCall` atual e cria dependência.
- **Não refatore o generator agora** (832 linhas estáveis); single-shot é apropriado pro caso dele.
- **Rotacionar anon key** depois de consertar G1, porque o JWT antigo está no histórico do git.
