

# Correções no Módulo LAIA

## Problema 1: Setores fora de ordem numérica

A query em `getLAIASectors` usa `.order("code")` que faz ordenação **alfabética** (string). Resultado: 1, 10, 11, 12, 2, 3... em vez de 1, 2, 3, 10, 11, 12.

**Solução:** Ordenar no client-side com comparação numérica no `LAIASectorManager.tsx`, usando `localeCompare` com `{ numeric: true }` ao renderizar os setores.

## Problema 2: Cards de unidades com quantidades erradas

A função `getLAIABranchStats` busca **todos** os assessments da empresa para contar no client-side, mas o Supabase tem limite padrão de **1000 linhas** por query. A empresa tem **2107 avaliações ativas**, então apenas ~1000 são retornadas, gerando contagens incorretas (PIR mostra 11 ao invés de 352, DUQUE mostra 1 ao invés de 125, etc).

**Solução:** Usar uma abordagem com paginação ou, mais eficientemente, fazer a contagem diretamente no banco com um RPC (function PostgreSQL) que retorna as contagens agrupadas por `branch_id`. Como alternativa mais simples e sem migration, podemos adicionar `.range(0, 9999)` para remover o limite de 1000, embora a abordagem ideal seja via RPC.

A mesma vulnerabilidade existe na função `getLAIADashboardStats` (também busca todos os assessments client-side).

## Arquivos a modificar

### 1. `src/services/laiaService.ts`

**a) `getLAIABranchStats`** — Substituir a query genérica por uma query com contagem usando `select("id, branch_id, category, significance", { count: "exact" })` não resolve pois precisamos agrupar. A solução prática: fazer fetch paginado ou usar `.range(0, 50000)` para superar o limite de 1000.

Aplicar `.range(0, 50000)` na query de `getLAIABranchStats` (linha 469-473):
```typescript
const { data: assessments, error } = await supabase
  .from("laia_assessments")
  .select("id, branch_id, category, significance")
  .eq("company_id", profile.company_id)
  .eq("status", "ativo")
  .range(0, 49999);
```

**b) `getLAIADashboardStats`** — Mesmo fix, adicionar `.range(0, 49999)` na query (linhas 355-373).

**c) `getLAIASectors`** — Sem alteração necessária no service (a ordenação será no componente).

### 2. `src/components/laia/LAIASectorManager.tsx`

Ordenar os setores numericamente antes de renderizar:

```typescript
const sortedSectors = useMemo(() => {
  if (!sectors) return [];
  return [...sectors].sort((a, b) => 
    a.code.localeCompare(b.code, undefined, { numeric: true })
  );
}, [sectors]);
```

Usar `sortedSectors` no lugar de `sectors` no `map` da tabela e no `toggleSelectAll`.

## Resumo técnico

| Problema | Causa raiz | Correção |
|----------|-----------|----------|
| Setores fora de ordem | `.order("code")` = ordenação de string | `localeCompare` com `{ numeric: true }` no componente |
| Stats incorretas nos cards | Limite de 1000 linhas do Supabase | `.range(0, 49999)` nas queries de stats |

