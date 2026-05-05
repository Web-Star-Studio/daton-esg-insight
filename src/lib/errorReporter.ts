import { supabase } from "@/integrations/supabase/client";
import { getRoutePattern } from "@/lib/routePattern";

/**
 * API pública pra reportar erros em `error_logs`.
 *
 * O `<ErrorTracker />` usa esse mesmo buffer pra erros captados
 * automaticamente (window.onerror, unhandledrejection). Use
 * `reportError(...)` em catch/ErrorBoundary onde você decide o que
 * é relevante reportar manualmente.
 *
 * Buffer + dedup ficam aqui pra ambos compartilharem fila e
 * fingerprinting. O componente só registra os listeners.
 */

export type ErrorSource =
  | "js_error"
  | "unhandled"
  | "network"
  | "react"
  | "manual";

export type BufferedError = {
  occurred_at: string;
  user_id: string | null;
  company_id: string | null;
  session_id: string | null;
  route_pattern: string | null;
  pathname: string | null;
  source: ErrorSource;
  message: string;
  stack: string | null;
  file_url: string | null;
  line_no: number | null;
  col_no: number | null;
  user_agent: string;
  fingerprint: string;
  metadata: Record<string, unknown>;
};

const FLUSH_INTERVAL_MS = 8_000;
const FLUSH_MAX_BATCH = 10;
const DEDUP_WINDOW_MS = 60_000;
const MAX_RECENT_FINGERPRINTS = 200;

let buffer: BufferedError[] = [];
let timerId: ReturnType<typeof setTimeout> | null = null;
const recentFingerprints = new Map<string, number>();

const truncate = (s: string | undefined | null, n: number): string | null => {
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
};

const fingerprintOf = (
  source: string,
  message: string,
  stack: string | null,
): string => {
  const firstFrame = stack?.split("\n").find((l) => l.includes(":")) ?? "";
  const seed = `${source}|${message.slice(0, 120)}|${firstFrame.slice(0, 200)}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (h * 33) ^ seed.charCodeAt(i);
  return (h >>> 0).toString(16);
};

const isDuplicateRecently = (fingerprint: string): boolean => {
  const now = Date.now();
  if (recentFingerprints.size > MAX_RECENT_FINGERPRINTS) {
    for (const [fp, t] of recentFingerprints) {
      if (now - t > DEDUP_WINDOW_MS) recentFingerprints.delete(fp);
    }
  }
  const last = recentFingerprints.get(fingerprint);
  if (last !== undefined && now - last < DEDUP_WINDOW_MS) return true;
  recentFingerprints.set(fingerprint, now);
  return false;
};

const scheduleFlush = () => {
  if (timerId !== null) return;
  timerId = setTimeout(() => {
    timerId = null;
    void flushBuffer();
  }, FLUSH_INTERVAL_MS);
};

export const flushErrorBuffer = async (): Promise<void> => {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  try {
    await supabase.from("error_logs").insert(batch as never);
  } catch {
    // best-effort
  }
};

const flushBuffer = flushErrorBuffer;

export type EnqueueArgs = {
  source: ErrorSource;
  message: string;
  stack: string | null;
  file_url: string | null;
  line_no: number | null;
  col_no: number | null;
  metadata: Record<string, unknown>;
  fingerprint?: string;
};

export const enqueueError = async (args: EnqueueArgs): Promise<void> => {
  try {
    const fp =
      args.fingerprint ?? fingerprintOf(args.source, args.message, args.stack);
    if (isDuplicateRecently(fp)) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;

    let companyId: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();
      companyId = profile?.company_id ?? null;
    }

    buffer.push({
      occurred_at: new Date().toISOString(),
      user_id: user?.id ?? null,
      company_id: companyId,
      session_id: window.__activitySessionId ?? null,
      route_pattern: getRoutePattern(window.location.pathname),
      pathname: window.location.pathname,
      source: args.source,
      message: args.message,
      stack: args.stack,
      file_url: args.file_url,
      line_no: args.line_no,
      col_no: args.col_no,
      user_agent: navigator.userAgent.slice(0, 500),
      fingerprint: fp,
      metadata: args.metadata,
    });

    if (buffer.length >= FLUSH_MAX_BATCH) void flushBuffer();
    else scheduleFlush();
  } catch {
    // ignora — erro do error tracker não pode encadear.
  }
};

/**
 * Reportar erro manualmente — use em catch/ErrorBoundary onde você
 * decide que é relevante. Erros de window.onerror e unhandledrejection
 * são captados automaticamente pelo <ErrorTracker />.
 */
export const reportError = (
  err: unknown,
  source: ErrorSource = "manual",
  metadata: Record<string, unknown> = {},
): void => {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "unknown_error";
  const stack = err instanceof Error ? err.stack ?? null : null;
  void enqueueError({
    source,
    message: truncate(message, 500) ?? "unknown_error",
    stack: truncate(stack, 4000),
    file_url: null,
    line_no: null,
    col_no: null,
    metadata,
  });
};
