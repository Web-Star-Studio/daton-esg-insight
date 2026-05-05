import { supabase } from "@/integrations/supabase/client";
import { getRoutePattern } from "@/lib/routePattern";

// Vocabulário fechado de eventos de negócio. Mantém-se enxuto de propósito
// — eventos não previstos ficam fora do contrato e voltam à `activity_logs`
// (livre/auditoria). Sempre que adicionar um novo, atualizar a UI de
// filtros em /platform-admin (tab "Uso & Custos").
export type EventType =
  | "login"
  | "logout"
  | "export_pdf"
  | "export_excel"
  | "export_csv"
  | "report_generated"
  | "document_uploaded"
  | "ai_chat_started"
  | "nc_created"
  | "goal_created"
  | "indicator_created"
  | "bulk_import"
  // Captura UI genérica via <UITracker /> (atributo data-track="..."):
  // qualquer clique em elemento marcado vira `ui_action` com o id da
  // ação no `entity_id`. Mantém o vocabulário fechado mesmo com cobertura
  // ampla — eventos UI ficam separados de eventos de domínio explícitos.
  | "ui_action"
  // Disparado por `useFormTracking`: submit success/error com tempo total
  // de preenchimento em metadata.
  | "form_submit";

export type TrackEventArgs = {
  type: EventType;
  /** Nome lógico do tipo da entidade (ex. 'document', 'nc', 'report'). */
  entityType?: string;
  /** Identificador da entidade (livre — UUID, slug etc.). */
  entityId?: string;
  /** Metadata complementar (não enviar PII desnecessária). */
  metadata?: Record<string, unknown>;
  /** Override do route_pattern. Default: deriva de `window.location.pathname`. */
  routePattern?: string;
};

// ============================================================
// Buffer
// ============================================================
// Por que existe: cada `trackEvent` antes fazia um INSERT individual no
// PostgREST — 1 round-trip por evento. Em fluxos UI agitados (export +
// notificação + navegação) isso virava N requests sequenciais. O buffer
// acumula até 20 eventos ou 10s e manda em UM único `insert([...])`.
//
// Garantias:
//   • Flush no `pagehide` e `visibilitychange→hidden` pra não perder
//     eventos no fechamento da aba.
//   • Falhas de rede/RLS NÃO recolocam eventos na fila (evita loop) —
//     tracking é best-effort por design.

const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_MAX_BATCH = 20;

type BufferedRow = {
  event_type: EventType;
  entity_type: string | null;
  entity_id: string | null;
  user_id: string;
  company_id: string | null;
  route_pattern: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

let buffer: BufferedRow[] = [];
let timerId: ReturnType<typeof setTimeout> | null = null;
let listenersInstalled = false;

const installListeners = () => {
  if (listenersInstalled || typeof window === "undefined") return;
  listenersInstalled = true;
  window.addEventListener("pagehide", () => {
    void flushBuffer();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flushBuffer();
  });
};

const scheduleFlush = () => {
  if (timerId !== null) return;
  timerId = setTimeout(() => {
    timerId = null;
    void flushBuffer();
  }, FLUSH_INTERVAL_MS);
};

const flushBuffer = async (): Promise<void> => {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  try {
    // Cast: o tipo `Json` gerado é recursivo e o TS não reconcilia bem
    // com `Record<string, unknown>`; em runtime o supabase-js serializa
    // direto pra JSON. Mesmo padrão que era usado antes do batching.
    await supabase.from("event_logs").insert(batch as never);
  } catch {
    // best-effort — perda silenciosa pra não bloquear UX
  }
};

/**
 * `trackEvent(...)` registra um evento de negócio. Envio em batch
 * (até 20 eventos / 10s), fire-and-forget — nunca bloqueia a UI nem
 * relança erros. RLS exige `user_id = auth.uid()`, então só registra
 * quando há sessão.
 *
 * Use diretamente em services / código não-React. Em componentes React,
 * prefira `useEventTracking()` que injeta o `routePattern` via `useLocation`.
 */
export const trackEvent = async ({
  type,
  entityType,
  entityId,
  metadata,
  routePattern,
}: TrackEventArgs): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    const pathname =
      routePattern ??
      (typeof window !== "undefined"
        ? getRoutePattern(window.location.pathname)
        : "/");

    installListeners();

    buffer.push({
      event_type: type,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      user_id: user.id,
      company_id: profile?.company_id ?? null,
      route_pattern: pathname,
      metadata: metadata ?? {},
      created_at: new Date().toISOString(),
    });

    if (buffer.length >= FLUSH_MAX_BATCH) {
      void flushBuffer();
    } else {
      scheduleFlush();
    }
  } catch {
    // tracking nunca derruba UX
  }
};

/**
 * Força o flush imediato do buffer. Útil em testes e em pontos críticos
 * (pré-logout, pré-redirect externo).
 */
export const flushEventBuffer = (): Promise<void> => flushBuffer();
