// Wrapper sobre `fetch` para Perplexity Chat Completions com retry curto
// em 5xx/429. Todas as edge functions IA do projeto que falam direto com
// `api.perplexity.ai` devem usar este helper — não fazer fetch cru pra
// padronizar o comportamento de falha.
//
// Não trata 4xx (a não ser 429): erros de prompt/quota são determinísticos
// e retry só atrasa. Em 5xx ou 429, faz `retries` tentativas com backoff
// linear (`backoffMs * (i+1)`) — o default cobre o caso típico de blip
// de upstream sem custar latência exagerada.
//
// Uso:
//   const resp = await callPerplexityWithRetry(apiKey, body);
//   if (!resp.ok) { ...usar resp.text()... }
//   const json = await resp.json();

export interface PerplexityCallOptions {
  /** default 1 (uma tentativa adicional após o erro). */
  retries?: number;
  /** default 2000 ms. Cresce linearmente: 2s, 4s, 6s... */
  backoffMs?: number;
  /** AbortSignal opcional pra cancelar a chamada (timeout do caller). */
  signal?: AbortSignal;
}

export async function callPerplexityWithRetry(
  apiKey: string,
  body: unknown,
  opts: PerplexityCallOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 1;
  const backoff = opts.backoffMs ?? 2000;
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: opts.signal,
      });

      // 5xx e 429 são transitórios — vale retry. 4xx que não 429 é
      // determinístico (prompt inválido, quota estourada): devolve já.
      const isTransient = resp.status >= 500 || resp.status === 429;
      if (!isTransient || attempt >= retries) {
        return resp;
      }
      // Drena o body antes de tentar de novo (pra liberar a conexão).
      try { await resp.text(); } catch { /* ignore */ }
      await delay(backoff * (attempt + 1));
    } catch (err) {
      // Erros de rede/abort caem aqui. Retry só pra erros não-abort.
      if (err instanceof Error && err.name === "AbortError") throw err;
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt >= retries) break;
      await delay(backoff * (attempt + 1));
    }
  }

  throw lastErr ?? new Error("Perplexity call failed after retries");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
