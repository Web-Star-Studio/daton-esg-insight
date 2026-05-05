import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTION_CONFIG } from "@/utils/productionConfig";

/**
 * Microsoft Clarity — session replay + heatmap, grátis ilimitado.
 *
 * Project ID lido de `productionConfig.ANALYTICS.CLARITY_PROJECT_ID`
 * (single source of truth — mesma lógica de VITE_SUPABASE_URL no
 * client.ts). É público por design: aparece no bundle JS do client
 * de qualquer forma, então não tratamos como secret.
 *
 * Desabilitar globalmente: setar `FEATURES.CLARITY_ANALYTICS_ENABLED`
 * pra `false` no productionConfig, ou esvaziar o `CLARITY_PROJECT_ID`.
 *
 * Identificação do usuário:
 *   Quando há sessão Supabase, chamamos `clarity('identify', userId)`
 *   pra correlacionar replays com nossos dados (queries cruzadas
 *   user_id ↔ replay_id no Clarity dashboard).
 */

const CLARITY_PROJECT_ID = PRODUCTION_CONFIG.FEATURES.CLARITY_ANALYTICS_ENABLED
  ? PRODUCTION_CONFIG.ANALYTICS.CLARITY_PROJECT_ID
  : "";

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & {
      q?: unknown[];
    };
  }
}

const injectClarity = (projectId: string) => {
  if (typeof window === "undefined") return;
  if (window.clarity) return;
  // Snippet oficial v0.7 (https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup),
  // adaptado pra TypeScript. Cria a fila `clarity.q` antes do script
  // carregar pra não perder calls early.
  (function (c: any, l: any, a: any, r: any, i: any) {
    c[a] =
      c[a] ||
      function () {
        // eslint-disable-next-line prefer-rest-params
        (c[a].q = c[a].q || []).push(arguments);
      };
    const t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
};

export const ClarityScript = () => {
  useEffect(() => {
    if (!CLARITY_PROJECT_ID) return;
    injectClarity(CLARITY_PROJECT_ID);

    // Identifica o user pra correlação user_id ↔ replay.
    // Reage a auth state pra capturar login após o load.
    const identify = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user || !window.clarity) return;
        window.clarity("identify", user.id, undefined, undefined, user.email);
      } catch {
        // best-effort
      }
    };

    void identify();
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && window.clarity) {
        window.clarity(
          "identify",
          session.user.id,
          undefined,
          undefined,
          session.user.email,
        );
      }
    });

    return () => {
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  return null;
};
