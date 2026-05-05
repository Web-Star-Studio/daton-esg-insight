import { useEffect } from "react";
import { enqueueError, flushErrorBuffer } from "@/lib/errorReporter";

/**
 * Captura global de erros de cliente — `error_logs`.
 *
 * Cobre:
 *   • `window.onerror`             → erros JS síncronos (TypeError etc.)
 *   • `unhandledrejection`         → Promises rejeitadas sem catch
 *
 * Não cobre (ainda):
 *   • Erros de fetch silenciados em try/catch sem rethrow — precisa
 *     de interceptor explícito no client (futuro).
 *   • Erros React de render — trate via ErrorBoundary chamando
 *     `reportError(err, 'react')` de `@/lib/errorReporter`.
 *
 * Buffer, dedup e flush ficam no `errorReporter` pra serem
 * compartilhados entre captura automática (esse componente) e
 * reportes manuais (`reportError`).
 */

const truncate = (s: string | undefined | null, n: number): string | null => {
  if (!s) return null;
  return s.length > n ? s.slice(0, n) : s;
};

export const ErrorTracker = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      void enqueueError({
        source: "js_error",
        message:
          truncate(event.message ?? "unknown_error", 500) ?? "unknown_error",
        stack: truncate(event.error?.stack ?? null, 4000),
        file_url: truncate(event.filename, 500),
        line_no: typeof event.lineno === "number" ? event.lineno : null,
        col_no: typeof event.colno === "number" ? event.colno : null,
        metadata: {},
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "unhandled_rejection";
      const stack = reason instanceof Error ? reason.stack ?? null : null;
      void enqueueError({
        source: "unhandled",
        message: truncate(message, 500) ?? "unhandled_rejection",
        stack: truncate(stack, 4000),
        file_url: null,
        line_no: null,
        col_no: null,
        metadata: {},
      });
    };

    const handlePageHide = () => {
      void flushErrorBuffer();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  return null;
};
