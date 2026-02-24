

# Corrigir setores sem branch_id que nao aparecem mais

## Problema

Todos os setores existentes no banco de dados possuem `branch_id = NULL` pois foram criados antes da refatoracao para arquitetura por unidade. Com a alteracao recente que adicionou `.eq("branch_id", branchId)` na query, esses setores deixaram de aparecer.

## Solucao

Duas acoes complementares:

### 1. Corrigir dados existentes (SQL)

Executar um UPDATE para associar os setores orfaos a uma unidade. Como os setores existentes podem estar vinculados a avaliacoes de qualquer unidade, a abordagem mais segura e associar cada setor a unidade onde ele e mais usado.

Primeiro, verificar quais unidades existem e associar os setores que nao tem `branch_id` a unidade correta com base nas avaliacoes existentes:

```sql
-- Atualizar setores baseado na unidade mais usada nas avaliacoes
UPDATE laia_sectors s
SET branch_id = sub.branch_id
FROM (
  SELECT a.sector_id, a.branch_id, COUNT(*) as cnt
  FROM laia_assessments a
  WHERE a.sector_id IS NOT NULL AND a.branch_id IS NOT NULL
  GROUP BY a.sector_id, a.branch_id
  ORDER BY a.sector_id, cnt DESC
) sub
WHERE s.id = sub.sector_id AND s.branch_id IS NULL;
```

Para setores que nao tem nenhuma avaliacao associada, sera necessario definir manualmente ou perguntar ao usuario qual unidade usar.

### 2. Tornar a query mais robusta (codigo)

No `laiaService.ts`, alterar a logica para que, quando `branchId` for fornecido, busque setores COM aquele `branch_id` OU setores sem `branch_id` (para compatibilidade). Isso garante que setores antigos continuem visiveis enquanto sao migrados.

**Arquivo:** `src/services/laiaService.ts` (linhas 30-32)

Substituir:
```ts
if (branchId) {
  query = query.eq("branch_id", branchId);
}
```

Por:
```ts
if (branchId) {
  query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
}
```

Isso mostra tanto os setores ja vinculados a unidade quanto os setores legados sem unidade definida, evitando perda de dados.

### 3. Garantir que novos setores sejam criados com branch_id

Verificar que o `LAIASectorManager` e `createLAIASector` ja passam o `branchId` ao criar setores -- isso ja esta funcionando conforme o codigo atual em `useLAIA.ts`.

## Resumo

| Acao | Arquivo/Local | Descricao |
|------|---------------|-----------|
| Alterar query | `laiaService.ts` linha 30-32 | Usar `.or()` para incluir setores sem branch_id |
| Migrar dados | SQL no banco | Associar setores orfaos as unidades corretas |

