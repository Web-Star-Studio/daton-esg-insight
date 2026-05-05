// Tabela de preços por modelo, em USD por 1k tokens.
//
// Fonte: preços públicos dos providers (OpenAI, Google AI Studio) em
// 2026-04-29. O gateway Lovable repassa os modelos mas não publica seu
// próprio preço unitário, então tudo aqui é **estimativa** — usar como
// proxy de custo relativo, não como número de fatura.
//
// Sempre que adicionar/usar um modelo novo numa edge function, registre
// aqui. Modelo desconhecido cai em `UNKNOWN_MODEL_PRICE` (custo 0) e
// gera log de aviso no `aiCall`.

export type ModelPrice = {
  /** USD por 1k tokens de input */
  input: number;
  /** USD por 1k tokens de output */
  output: number;
};

export const MODEL_PRICES: Record<string, ModelPrice> = {
  // Google Gemini
  "google/gemini-3-flash-preview": { input: 0.000075, output: 0.0003 },
  "google/gemini-2.5-pro": { input: 0.00125, output: 0.005 },
  "google/gemini-2.0-flash-exp": { input: 0.0001, output: 0.0004 },

  // OpenAI — slug com prefixo "openai/" é o que o gateway Lovable usa.
  // Os mesmos modelos sem prefixo (legados) ficam abaixo pra
  // compatibilidade com chamadas antigas.
  "openai/gpt-5-mini": { input: 0.00025, output: 0.002 },
  "openai/gpt-5": { input: 0.00125, output: 0.01 },
  "openai/gpt-4o": { input: 0.0025, output: 0.01 },
  "openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
};

const UNKNOWN_MODEL_PRICE: ModelPrice = { input: 0, output: 0 };

export const estimateCostUsd = (
  model: string,
  promptTokens: number,
  completionTokens: number,
): number => {
  const price = MODEL_PRICES[model] ?? UNKNOWN_MODEL_PRICE;
  return (
    (promptTokens / 1000) * price.input +
    (completionTokens / 1000) * price.output
  );
};

export const isPricedModel = (model: string): boolean =>
  model in MODEL_PRICES;
