// Helpers para parsing tolerante de respostas LLM que deveriam ser JSON.
//
// Modelos (sonar-pro especialmente quando saímos do `response_format`
// strict) frequentemente embrulham o JSON em ```json ... ```, prefixam
// com texto explicativo, ou anexam comentários no final. `JSON.parse`
// direto falha. Os helpers abaixo extraem o primeiro objeto/array
// balanceado e devolvem string parseable, sem inventar conteúdo.

/**
 * Extrai o primeiro objeto JSON balanceado de uma string.
 *
 * Lida com:
 * - resposta crua: `{...}` → retorna ela mesma
 * - markdown: ```json\n{...}\n``` ou ```\n{...}\n``` → retorna o miolo
 * - prefixo de texto: "Aqui está...\n{...}" → retorna o objeto
 *
 * Se não achar `{`, devolve `"{}"` (parseável como objeto vazio).
 * Se achar `{` mas não fechar, devolve o que tem — o caller vai pegar
 * SyntaxError no JSON.parse com mensagem útil.
 */
export function extractFirstJsonObject(s: string): string {
  if (!s) return "{}";
  // Tenta markdown code fence primeiro: ```json ... ``` ou ``` ... ```
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : s;
  const start = candidate.indexOf("{");
  if (start < 0) return "{}";
  return scanBalanced(candidate, start, "{", "}");
}

/**
 * Mesmo, mas para arrays. Útil quando o modelo responde direto com
 * `[ ... ]` sem wrapper de objeto.
 */
export function extractFirstJsonArray(s: string): string {
  if (!s) return "[]";
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : s;
  const start = candidate.indexOf("[");
  if (start < 0) return "[]";
  return scanBalanced(candidate, start, "[", "]");
}

function scanBalanced(s: string, start: number, open: string, close: string): string {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  // Não fechou — devolve o que tem (parser do caller vai falhar com erro útil).
  return s.slice(start);
}
