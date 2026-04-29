import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getRoutePattern } from "@/lib/routePattern";

// Vocabulário fechado de eventos de negócio. Mantém-se enxuto de propósito
// — eventos não previstos ficam fora do contrato e voltam à `activity_logs`
// (livre/auditoria). Sempre que adicionar um novo, atualizar a UI de
// filtros em /platform-admin (tab "Uso & Custos").
export type EventType =
  | "login"
  | "logout"
  | "org_switch"
  | "export_pdf"
  | "export_excel"
  | "export_csv"
  | "report_generated"
  | "document_uploaded"
  | "ai_chat_started"
  | "nc_created"
  | "goal_created"
  | "indicator_created"
  | "bulk_import";

export type TrackEventArgs = {
  type: EventType;
  /** Nome lógico do tipo da entidade (ex. 'document', 'nc', 'report'). */
  entityType?: string;
  /** Identificador da entidade (livre — UUID, slug etc.). */
  entityId?: string;
  /** Metadata complementar (não enviar PII desnecessária). */
  metadata?: Record<string, unknown>;
};

/**
 * `track(...)` registra um evento de negócio em `event_logs`. Best-effort:
 * não bloqueia UX, não relança erros. RLS exige `user_id = auth.uid()`,
 * então só registra quando há sessão.
 */
export const useEventTracking = () => {
  const location = useLocation();

  const track = useCallback(
    async ({ type, entityType, entityId, metadata }: TrackEventArgs) => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return; // anônimos não registram (RLS bloquearia)

        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .maybeSingle();

        await supabase.from("event_logs").insert({
          event_type: type,
          entity_type: entityType ?? null,
          entity_id: entityId ?? null,
          user_id: user.id,
          company_id: profile?.company_id ?? null,
          route_pattern: getRoutePattern(location.pathname),
          metadata: (metadata ?? {}) as never,
        });
      } catch {
        // tracking nunca derruba UX
      }
    },
    [location.pathname],
  );

  return { track };
};
