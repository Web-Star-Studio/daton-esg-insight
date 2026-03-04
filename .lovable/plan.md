

# Copiar dados LAIA da Gabardo para a Fike

## Contexto
As 5 tabelas LAIA não foram incluídas na migração original. A Gabardo possui:

| Tabela | Registros |
|--------|-----------|
| laia_sectors | 191 |
| laia_assessments | 2,107 |
| laia_branch_config | 16 |
| laia_revisions | 1 |
| laia_revision_changes | 3 |

**Total: ~2,318 registros**

## Mapeamento de branch_id

Os `branch_id` da Gabardo precisam ser remapeados para os da Fike. Consigo fazer isso via `created_at` (que foi preservado na clonagem). Todos os 17 branches possuem correspondência 1:1.

## Abordagem

Atualizar a Edge Function `copy-company-data` adicionando uma nova fase `phase_laia` que:

1. Busca o mapeamento `old_branch_id -> new_branch_id` via `created_at` entre as duas empresas
2. Copia `laia_sectors` (191 registros) — remapeia `company_id` e `branch_id`, gera novos UUIDs, mantém mapa `old_sector_id -> new_sector_id`
3. Copia `laia_branch_config` (16 registros) — remapeia `company_id` e `branch_id`
4. Copia `laia_assessments` (2,107 registros) — remapeia `company_id`, `branch_id`, `sector_id` (usando mapa de setores), nula `responsible_user_id`. Em batches de 500.
5. Copia `laia_revisions` (1 registro) — remapeia `company_id`, nula `created_by` e `validated_by`
6. Copia `laia_revision_changes` (3 registros) — remapeia `revision_id`, `branch_id`, nula `changed_by`

## Alterações

- **Editar** `supabase/functions/copy-company-data/index.ts` — adicionar case `phase_laia`
- **Deploy** e invocar com `{ sourceCompanyId, targetCompanyId, phase: "phase_laia" }`

