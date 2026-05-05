import { useEffect } from "react";
import { trackEvent, type EventType } from "@/lib/eventTracking";

/**
 * Captura automática de cliques em elementos marcados com `data-track`.
 *
 * Por que delegated listener (não wrapper por componente):
 *   • Não força refactor de cada button. Marcas o CTA com um atributo,
 *     pronto. Cobertura escala sem trabalho.
 *   • Listener único no document — performance OK mesmo com milhares
 *     de elementos rastreáveis.
 *
 * Convenções:
 *
 *   <button data-track="export-licenca-pdf">Exportar PDF</button>
 *      → event_type='ui_action', entity_id='export-licenca-pdf'
 *
 *   <button data-track="report-create" data-track-event="report_generated">…</button>
 *      → event_type='report_generated' (override do vocabulário de domínio)
 *
 *   <button data-track="upload-doc" data-track-meta='{"size":1024}'>…</button>
 *      → metadata = { size: 1024 }
 *
 *   <button data-track="open-modal" data-track-entity-type="modal">…</button>
 *      → entity_type='modal'
 *
 * O atributo é resolvido fazendo `closest("[data-track]")` a partir do
 * target — clicar em <span> dentro de <button data-track="..."> funciona.
 */

const VALID_EVENT_TYPES: ReadonlySet<EventType> = new Set<EventType>([
  "login",
  "logout",
  "export_pdf",
  "export_excel",
  "export_csv",
  "report_generated",
  "document_uploaded",
  "ai_chat_started",
  "nc_created",
  "goal_created",
  "indicator_created",
  "bulk_import",
  "ui_action",
  "form_submit",
]);

const parseMeta = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

export const UITracker = () => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const tracked = target.closest<HTMLElement>("[data-track]");
      if (!tracked) return;

      const actionId = tracked.dataset.track;
      if (!actionId) return;

      // event_type override — se inválido, cai pra ui_action.
      const overrideRaw = tracked.dataset.trackEvent as
        | EventType
        | undefined;
      const eventType: EventType =
        overrideRaw && VALID_EVENT_TYPES.has(overrideRaw)
          ? overrideRaw
          : "ui_action";

      const entityType = tracked.dataset.trackEntityType ?? null;
      const meta = parseMeta(tracked.dataset.trackMeta ?? null);

      // metadata sempre carrega o tag/role/label do elemento — útil pra
      // distinguir "click em <a>" de "click em <button>" no mesmo CTA.
      const enriched: Record<string, unknown> = {
        ...(meta ?? {}),
        tag: tracked.tagName.toLowerCase(),
      };
      const ariaLabel = tracked.getAttribute("aria-label");
      if (ariaLabel) enriched.aria_label = ariaLabel.slice(0, 120);
      const text = tracked.textContent?.trim().slice(0, 80);
      if (text) enriched.text = text;

      void trackEvent({
        type: eventType,
        entityType: entityType ?? undefined,
        entityId: actionId,
        metadata: enriched,
      });
    };

    // capture: false (default) — bubble. Não interfere com handlers
    // do React. passive: true — handler nunca preventDefault().
    document.addEventListener("click", handleClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
};
