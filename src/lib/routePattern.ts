// Heurística para inferir o "padrão" canônico de uma rota dinâmica
// (ex. `/auditoria/2a7f-…/edit` → `/auditoria/:id/edit`) sem precisar
// conhecer a árvore de `<Route>`.
//
// Por que existe: o tracking grava o `pathname` literal — sem isso, todas
// as rotas dinâmicas explodem em entradas únicas no analytics e a lista
// de "rotas mortas" fica cheia de falso-positivos. Uma rota como
// `/licenciamento/:id` é gravada em N versões diferentes, uma por id.
//
// Substituições aplicadas em cada segmento:
//   • UUIDs (8-4-4-4-12 hex)                         → :id
//   • Segmento puramente numérico                    → :id
//   • Hash/slug com ≥ 16 chars alfanuméricos         → :id
// Outros segmentos (palavras com letras) ficam como estão.
//
// Não é perfeito (slug com palavras tipo "meu-relatorio-2024" passa), mas
// resolve 95% dos casos sem manutenção. Quando houver necessidade de
// precisão maior, trocar por `matchRoutes` do react-router contra a
// árvore declarada em App.tsx.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_RE = /^\d+$/;
const HASH_RE = /^[0-9a-zA-Z_-]{16,}$/;

const normalizeSegment = (segment: string): string => {
  if (!segment) return segment;
  if (UUID_RE.test(segment)) return ":id";
  if (NUMERIC_RE.test(segment)) return ":id";
  if (HASH_RE.test(segment) && /\d/.test(segment)) return ":id";
  return segment;
};

export const getRoutePattern = (pathname: string): string => {
  if (!pathname || pathname === "/") return "/";
  const parts = pathname.split("/").map(normalizeSegment);
  const result = parts.join("/");
  return result || "/";
};
