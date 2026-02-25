

# Correção definitiva: RPC functions para estatísticas LAIA

## Problema

O `.range(0, 49999)` aplicado na correção anterior **não resolve** o problema. O PostgREST do Supabase pode truncar resultados mesmo com `.range()` ampliado. A empresa tem 2.107 avaliações ativas e os cards mostram valores zerados ou incorretos porque a query client-side recebe dados truncados.

Dados reais (confirmados via SQL direto):
- SJP: 96 total, 55 significativos, 6 criticos, 41 nao significativos
- Interface mostra: 0, 0, 0, 0

## Solução: RPC functions no PostgreSQL

Mover a agregação para o banco de dados usando duas funções RPC, eliminando completamente a necessidade de buscar todos os registros no client.

### Migration SQL — Duas funções RPC

**1. `get_laia_branch_stats(p_company_id UUID)`**

Retorna as contagens agrupadas por `branch_id` para a galeria de unidades (`/laia`):

```sql
CREATE OR REPLACE FUNCTION get_laia_branch_stats(p_company_id UUID)
RETURNS TABLE (
  branch_id UUID,
  total BIGINT,
  criticos BIGINT,
  significativos BIGINT,
  nao_significativos BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT
    a.branch_id,
    COUNT(*)::BIGINT,
    COALESCE(SUM(CASE WHEN a.category = 'critico' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN a.significance = 'significativo' THEN 1 ELSE 0 END), 0)::BIGINT,
    COALESCE(SUM(CASE WHEN a.significance != 'significativo' OR a.significance IS NULL THEN 1 ELSE 0 END), 0)::BIGINT
  FROM public.laia_assessments a
  WHERE a.company_id = p_company_id AND a.status = 'ativo'
  GROUP BY a.branch_id;
$$;
```

**2. `get_laia_dashboard_stats(p_company_id UUID, p_branch_id UUID DEFAULT NULL)`**

Retorna estatísticas detalhadas (totais + distribuições por temporalidade, situação operacional, incidência e classe de impacto) para o dashboard de uma unidade específica:

```sql
CREATE OR REPLACE FUNCTION get_laia_dashboard_stats(
  p_company_id UUID, 
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'significativos', SUM(CASE WHEN significance = 'significativo' THEN 1 ELSE 0 END),
    'nao_significativos', SUM(CASE WHEN significance != 'significativo' OR significance IS NULL THEN 1 ELSE 0 END),
    'criticos', SUM(CASE WHEN category = 'critico' THEN 1 ELSE 0 END),
    'moderados', SUM(CASE WHEN category = 'moderado' THEN 1 ELSE 0 END),
    'despreziveis', SUM(CASE WHEN category = 'desprezivel' THEN 1 ELSE 0 END),
    'by_temporality', (SELECT COALESCE(json_agg(...), '[]') ...),
    'by_operational_situation', ...,
    'by_incidence', ...,
    'by_impact_class', ...
  ) INTO result
  FROM public.laia_assessments
  WHERE company_id = p_company_id AND status = 'ativo'
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
  
  RETURN result;
END;
$$;
```

### Alterações em `src/services/laiaService.ts`

**`getLAIABranchStats`** — Substituir o fetch client-side por:
```typescript
const { data, error } = await supabase.rpc('get_laia_branch_stats', {
  p_company_id: profile.company_id
});
```

**`getLAIADashboardStats`** — Substituir o fetch client-side por:
```typescript
const { data, error } = await supabase.rpc('get_laia_dashboard_stats', {
  p_company_id: profile.company_id,
  p_branch_id: branchId || null
});
```

Ambas as funções eliminam os loops de contagem manual que existem atualmente no TypeScript.

### Alterações em `src/hooks/useLAIA.ts`

O hook `useLAIABranchStats` e `useLAIADashboardStats` continuam iguais — apenas os dados retornados pelo service mudam de formato para compatibilidade direta.

## Arquivos a modificar

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | Criar 2 RPC functions |
| `src/services/laiaService.ts` | Reescrever `getLAIABranchStats` e `getLAIADashboardStats` para usar `supabase.rpc()` |

## Por que esta solução é definitiva

- A agregação acontece 100% no PostgreSQL — sem limite de linhas
- Performance superior: retorna apenas os totais, não milhares de registros
- Segue o padrão obrigatório do projeto (memory: `supabase-query-batching-pattern` e stack overflow suggestion)

