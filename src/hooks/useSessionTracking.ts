import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tracking de sessão de atividade ("quanto tempo o user usou o sistema").
 *
 * Por que existe: pageview sozinho não diz uso real — só "abriu a porta".
 * Esse hook cria uma row em `user_activity_sessions` no login e manda
 * heartbeat a cada 30s só quando a aba está visível E o user esteve ativo
 * (mouse/keyboard) nos últimos 60s. Encerra no logout, no idle longo, ou
 * via `pagehide`.
 *
 * Lifecycle: o hook reage a `supabase.auth.onAuthStateChange` —
 * `SIGNED_IN`/`INITIAL_SESSION` cria sessão, `SIGNED_OUT` encerra.
 *
 * Notas:
 *   • Best-effort: erros não derrubam UX.
 *   • A FK lógica `page_view_logs.session_id` é populada via
 *     `window.__activitySessionId` (lido pelo `usePageTracking`).
 */

const HEARTBEAT_MS = 30_000;            // batida a cada 30s
const ACTIVE_WINDOW_MS = 60_000;        // ativo se houve input nos últimos 60s
const IDLE_TIMEOUT_MS = 30 * 60_000;    // 30 min sem input → encerra sessão
const ACTIVE_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "touchstart",
] as const;

type DeviceType = "mobile" | "tablet" | "desktop";

const detectDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const safeTimezone = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
};

declare global {
  interface Window {
    __activitySessionId?: string | null;
  }
}

type SessionRefs = {
  id: string | null;
  lastActivityAt: number;
  lastHeartbeatAt: number;
  heartbeatCount: number;
  activeMs: number;
  idleMs: number;
  ended: boolean;
};

const initialRefs = (): SessionRefs => ({
  id: null,
  lastActivityAt: Date.now(),
  lastHeartbeatAt: Date.now(),
  heartbeatCount: 0,
  activeMs: 0,
  idleMs: 0,
  ended: false,
});

export const useSessionTracking = () => {
  const refs = useRef<SessionRefs>(initialRefs());

  useEffect(() => {
    let intervalId: number | null = null;
    let cancelled = false;
    let currentUserId: string | null = null;

    const markActivity = () => {
      refs.current.lastActivityAt = Date.now();
    };

    const startSession = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", userId)
          .maybeSingle();

        if (cancelled) return;

        const { data: session } = await supabase
          .from("user_activity_sessions")
          .insert({
            user_id: userId,
            company_id: profile?.company_id ?? null,
            user_agent: navigator.userAgent.slice(0, 500),
            device_type: detectDeviceType(),
            viewport_w: window.innerWidth,
            viewport_h: window.innerHeight,
            timezone: safeTimezone(),
            locale: navigator.language || null,
          })
          .select("id")
          .single();

        if (cancelled || !session) return;
        refs.current.id = session.id;
        window.__activitySessionId = session.id;
      } catch {
        // best-effort
      }
    };

    const flushHeartbeat = async () => {
      const r = refs.current;
      if (!r.id || r.ended) return;

      const now = Date.now();
      const elapsed = now - r.lastHeartbeatAt;

      // Heartbeat só conta tempo se a aba está visível.
      const visible = document.visibilityState === "visible";
      const wasRecentlyActive = now - r.lastActivityAt < ACTIVE_WINDOW_MS;

      if (visible) {
        if (wasRecentlyActive) r.activeMs += elapsed;
        else r.idleMs += elapsed;
      }
      r.lastHeartbeatAt = now;
      r.heartbeatCount += 1;

      try {
        await supabase
          .from("user_activity_sessions")
          .update({
            last_seen_at: new Date(now).toISOString(),
            active_seconds: Math.floor(r.activeMs / 1000),
            idle_seconds: Math.floor(r.idleMs / 1000),
            heartbeat_count: r.heartbeatCount,
          })
          .eq("id", r.id);
      } catch {
        // tudo bem — próximo tick tenta de novo
      }

      if (now - r.lastActivityAt > IDLE_TIMEOUT_MS) {
        await endSession("idle_timeout");
      }
    };

    const endSession = async (reason: string) => {
      const r = refs.current;
      if (r.ended || !r.id) return;
      r.ended = true;

      try {
        await supabase
          .from("user_activity_sessions")
          .update({
            ended_at: new Date().toISOString(),
            end_reason: reason,
            active_seconds: Math.floor(r.activeMs / 1000),
            idle_seconds: Math.floor(r.idleMs / 1000),
            heartbeat_count: r.heartbeatCount,
          })
          .eq("id", r.id);
      } catch {
        // ignora
      }

      window.__activitySessionId = null;
    };

    const handlePageHide = () => {
      // No unload o navegador pode cortar a request — fazemos o melhor
      // que dá. Para robustez 100%, futura edge function POST de
      // /session-end via sendBeacon.
      void endSession("tab_closed");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") markActivity();
    };

    const startTracking = (userId: string) => {
      // Se já tem sessão pra mesmo user, não recria.
      if (currentUserId === userId && refs.current.id) return;
      // User trocou — encerra a antiga.
      if (currentUserId && currentUserId !== userId) {
        void endSession("logout");
      }
      currentUserId = userId;
      refs.current = initialRefs();
      void startSession(userId).then(() => {
        if (cancelled || intervalId !== null) return;
        intervalId = window.setInterval(() => {
          void flushHeartbeat();
        }, HEARTBEAT_MS);
      });
    };

    const stopTracking = (reason: string) => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      void endSession(reason);
      currentUserId = null;
    };

    // Listeners passivos pra detectar atividade.
    ACTIVE_EVENTS.forEach((evt) => {
      window.addEventListener(evt, markActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    // Inicializa com o estado atual + reage a mudanças.
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const userId = data?.user?.id;
      if (userId) startTracking(userId);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        const userId = session?.user?.id ?? null;
        if (event === "SIGNED_OUT" || !userId) {
          stopTracking("logout");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          startTracking(userId);
        }
      },
    );

    return () => {
      cancelled = true;
      authSub?.subscription?.unsubscribe();
      ACTIVE_EVENTS.forEach((evt) => {
        window.removeEventListener(evt, markActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      stopTracking("logout");
    };
  }, []);
};
