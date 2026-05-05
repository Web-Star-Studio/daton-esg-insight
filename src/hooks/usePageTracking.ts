import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getRoutePattern } from "@/lib/routePattern";

/**
 * Registra cada navegação na tabela `page_view_logs` e enriquece com
 * tempo na página, scroll máximo, tempo com foco e tipo de saída.
 *
 * Fluxo:
 *   1. Entrada: INSERT cria a row com pathname/route_pattern (igual antes).
 *   2. Durante: listeners de scroll/visibility acumulam métricas em ref.
 *   3. Saída: UPDATE da mesma row com `time_on_page_ms`, `max_scroll_pct`,
 *      `had_focus_ms` e `exit_type`. Disparado em (a) navegação interna
 *      (mudança de location), (b) `pagehide` (close/reload), e
 *      (c) `visibilitychange→hidden`.
 *
 * Limites conhecidos:
 *   • Anon não consegue UPDATE (RLS) — pageviews anônimos ficam só com
 *     dados de entrada. Aceito, app é majoritariamente gated.
 *   • UPDATE no `pagehide` pode ser cortado pelo browser. Pra robustez
 *     futura, edge function POST + sendBeacon.
 *   • StrictMode dispara o effect 2x; deduplica via `lastTrackedKeyRef`.
 */

type DeviceType = "mobile" | "tablet" | "desktop";

const detectDeviceType = (): DeviceType => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const computeScrollPct = (): number => {
  const doc = document.documentElement;
  const scrolled = window.scrollY + window.innerHeight;
  const total = Math.max(doc.scrollHeight, window.innerHeight);
  if (!total) return 0;
  return Math.min(100, Math.max(0, Math.floor((scrolled / total) * 100)));
};

type ExitType = "navigate" | "close" | "background" | "reload" | "unknown";

type PageViewState = {
  rowId: string | null;
  startedAt: number;
  maxScrollPct: number;
  focusedMs: number;
  lastFocusEnter: number | null;
  exitSent: boolean;
};

const newState = (): PageViewState => ({
  rowId: null,
  startedAt: Date.now(),
  maxScrollPct: 0,
  focusedMs: 0,
  lastFocusEnter:
    typeof document !== "undefined" && document.visibilityState === "visible"
      ? Date.now()
      : null,
  exitSent: false,
});

const sendExit = async (
  state: PageViewState,
  exitType: ExitType,
  opts: { keepRow?: boolean } = {},
): Promise<void> => {
  if (!state.rowId) return;
  if (!opts.keepRow) state.exitSent = true;

  const now = Date.now();
  let focusedMs = state.focusedMs;
  if (state.lastFocusEnter) {
    focusedMs += now - state.lastFocusEnter;
  }

  try {
    await supabase
      .from("page_view_logs")
      .update({
        time_on_page_ms: now - state.startedAt,
        max_scroll_pct: state.maxScrollPct,
        had_focus_ms: focusedMs,
        exit_type: exitType,
      })
      .eq("id", state.rowId);
  } catch {
    // tudo bem
  }
};

export const usePageTracking = () => {
  const location = useLocation();
  const lastTrackedKeyRef = useRef<string>("");
  const stateRef = useRef<PageViewState>(newState());

  // INSERT na entrada + fechamento da rota anterior.
  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    if (lastTrackedKeyRef.current === key) return;

    const previous = stateRef.current;
    if (previous.rowId && !previous.exitSent) {
      void sendExit(previous, "navigate");
    }

    lastTrackedKeyRef.current = key;
    stateRef.current = newState();
    const current = stateRef.current;

    void (async () => {
      try {
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

        const { data: row } = await supabase
          .from("page_view_logs")
          .insert({
            user_id: user?.id ?? null,
            company_id: companyId,
            pathname: location.pathname,
            route_pattern: getRoutePattern(location.pathname),
            search: location.search || null,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent.slice(0, 500),
            session_id: window.__activitySessionId ?? null,
            viewport_w: window.innerWidth,
            viewport_h: window.innerHeight,
            device_type: detectDeviceType(),
          })
          .select("id")
          .single();

        if (row && current === stateRef.current) {
          current.rowId = row.id;
        }
      } catch {
        // silencioso — tracking não pode quebrar a aplicação
      }
    })();
  }, [location.pathname, location.search]);

  // Listeners globais (scroll/visibility/pagehide). Não dependem da rota
  // mudar — ficam montados pelo lifetime do hook.
  useEffect(() => {
    const handleScroll = () => {
      const pct = computeScrollPct();
      if (pct > stateRef.current.maxScrollPct) {
        stateRef.current.maxScrollPct = pct;
      }
    };

    const handleVisibilityChange = () => {
      const s = stateRef.current;
      const now = Date.now();
      if (document.visibilityState === "visible") {
        s.lastFocusEnter = now;
      } else {
        if (s.lastFocusEnter) {
          s.focusedMs += now - s.lastFocusEnter;
          s.lastFocusEnter = null;
        }
        if (s.rowId && !s.exitSent) {
          void sendExit(s, "background", { keepRow: true });
        }
      }
    };

    const handlePageHide = () => {
      const s = stateRef.current;
      if (s.lastFocusEnter) {
        s.focusedMs += Date.now() - s.lastFocusEnter;
        s.lastFocusEnter = null;
      }
      if (s.rowId && !s.exitSent) {
        void sendExit(
          s,
          document.visibilityState === "hidden" ? "close" : "unknown",
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);
};
