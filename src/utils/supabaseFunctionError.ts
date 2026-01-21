export type SupabaseFunctionErrorInfo = {
  message: string;
  hint?: string;
};

/**
 * Best-effort extraction of `{ error, hint }` returned by Supabase Edge Functions.
 * supabase-js may surface non-2xx responses as `error` with a generic message,
 * while the function's JSON body is available in `error.context.body`.
 */
export function parseSupabaseFunctionError(err: unknown): SupabaseFunctionErrorInfo {
  const fallbackMessage =
    (typeof (err as any)?.message === "string" && (err as any).message) ||
    "Erro ao chamar a função. Tente novamente.";

  const body = (err as any)?.context?.body;
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      const message =
        (typeof parsed?.error === "string" && parsed.error) || fallbackMessage;
      const hint = typeof parsed?.hint === "string" ? parsed.hint : undefined;
      return { message, hint };
    } catch {
      // fall through
    }
  }

  return { message: fallbackMessage };
}
