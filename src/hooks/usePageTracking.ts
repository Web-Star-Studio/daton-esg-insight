import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registra cada navegação na tabela `page_view_logs` para análise de uso real
 * (incluindo páginas com 0 acesso, que o analytics da plataforma não expõe).
 *
 * - Best-effort: erros são silenciosamente ignorados (não devem quebrar UX).
 * - Deduplica chamadas idênticas no mesmo render (StrictMode dispara 2x).
 * - Funciona para usuários anônimos (RLS permite INSERT sem autenticação).
 */
export const usePageTracking = () => {
  const location = useLocation();
  const lastTrackedRef = useRef<string>("");

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    if (lastTrackedRef.current === key) return;
    lastTrackedRef.current = key;

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

        await supabase.from("page_view_logs").insert({
          user_id: user?.id ?? null,
          company_id: companyId,
          pathname: location.pathname,
          search: location.search || null,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent.slice(0, 500),
        });
      } catch {
        // silencioso — tracking não pode quebrar a aplicação
      }
    })();
  }, [location.pathname, location.search]);
};
