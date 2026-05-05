import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/eventTracking";
import { getRoutePattern } from "@/lib/routePattern";

/**
 * Hook pra instrumentar formulários: captura tempo total de preenchimento,
 * sucesso/erro de submit, e (opcional) erros de validação por campo.
 *
 * Tempo é medido entre o primeiro mount do form e o submit. Inclui
 * abandono se o user fechar a aba — `time_to_submit_ms` em metadata
 * só é gravado quando há submit de fato.
 *
 * Uso típico:
 *
 *   const form = useFormTracking("nc-create");
 *
 *   const onSubmit = async (data) => {
 *     try {
 *       await api.create(data);
 *       form.trackSuccess({ ncId: data.id });
 *     } catch (err) {
 *       form.trackError(err);
 *     }
 *   };
 *
 * Para múltiplos forms na mesma página, use `formId` distinto por
 * instância — o evento sai com `entity_id=formId`.
 */

type ErrorLike = unknown;

const errorMessage = (err: ErrorLike): string => {
  if (err instanceof Error) return err.message.slice(0, 200);
  if (typeof err === "string") return err.slice(0, 200);
  try {
    return JSON.stringify(err).slice(0, 200);
  } catch {
    return "unknown_error";
  }
};

export const useFormTracking = (formId: string) => {
  const location = useLocation();
  const startedAtRef = useRef<number>(Date.now());
  // Reset do timer quando o formId muda (mesma página, form diferente).
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [formId]);

  const trackSuccess = useCallback(
    (extra?: Record<string, unknown>) => {
      void trackEvent({
        type: "form_submit",
        entityType: "form",
        entityId: formId,
        routePattern: getRoutePattern(location.pathname),
        metadata: {
          status: "success",
          time_to_submit_ms: Date.now() - startedAtRef.current,
          ...(extra ?? {}),
        },
      });
    },
    [formId, location.pathname],
  );

  const trackError = useCallback(
    (err: ErrorLike, extra?: Record<string, unknown>) => {
      void trackEvent({
        type: "form_submit",
        entityType: "form",
        entityId: formId,
        routePattern: getRoutePattern(location.pathname),
        metadata: {
          status: "error",
          error: errorMessage(err),
          time_to_submit_ms: Date.now() - startedAtRef.current,
          ...(extra ?? {}),
        },
      });
    },
    [formId, location.pathname],
  );

  /**
   * Registra erro de validação de campo (sem submit). Útil pra entender
   * onde o user trava no formulário antes de desistir.
   */
  const trackFieldError = useCallback(
    (fieldName: string, message: string) => {
      void trackEvent({
        type: "form_submit",
        entityType: "form_field",
        entityId: `${formId}:${fieldName}`,
        routePattern: getRoutePattern(location.pathname),
        metadata: {
          status: "field_error",
          message: message.slice(0, 200),
        },
      });
    },
    [formId, location.pathname],
  );

  return { trackSuccess, trackError, trackFieldError };
};
