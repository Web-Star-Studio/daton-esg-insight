

# Copiar dados da Transportes Gabardo para a Fike

## Contexto
- **Origem**: Transportes Gabardo (`021647af-61a5-4075-9db3-bb5024ef7a67`)
- **Destino**: Fike (`5207e9eb-3ac3-462d-aede-07000792d4f5`)

## Dados a copiar (tabelas com registros)

| Tabela | Registros | Dependências FK |
|--------|-----------|-----------------|
| departments | 51 | nenhuma |
| branches | 17 | nenhuma |
| training_programs | 61 | nenhuma |
| employees | 1913 | department (nome) |
| employee_trainings | 307 | employee_id |
| employee_experiences | 64 | employee_id |
| employee_education | 1 | employee_id |
| legislations | 357 | nenhuma |
| legislation_compliance_profiles | 1 | legislation_id |
| supplier_management | 19 | nenhuma |
| supplier_required_documents | 42 | supplier_id |
| supplier_evaluation_criteria | 6 | supplier_id |
| licenses | 8 | nenhuma |
| license_conditions | 40 | license_id |
| non_conformities | 6 | nenhuma |
| esg_risks | 3 | nenhuma |
| action_plans | 2 | nenhuma |
| emission_sources | 1 | nenhuma |
| audits | 1 | nenhuma |
| documents | 17 | nenhuma (file refs only) |
| compliance_tasks | 9 | legislation_id |
| gri_reports | 1 | nenhuma |

**Total: ~2.927 registros em 22 tabelas**

## Abordagem

Criar uma **Edge Function** `copy-company-data` que:

1. **Fase 1 - Tabelas independentes**: Copia tabelas sem FK entre si (departments, branches, training_programs, legislations, supplier_management, licenses, non_conformities, esg_risks, action_plans, emission_sources, audits, documents, gri_reports). Gera novos UUIDs e mantém um mapeamento `old_id -> new_id`.

2. **Fase 2 - Tabelas dependentes**: Usando os mapeamentos da fase 1, copia:
   - employees (remapeia department se for FK)
   - employee_trainings, employee_experiences, employee_education (remapeia employee_id)
   - supplier_required_documents, supplier_evaluation_criteria (remapeia supplier_id)
   - license_conditions (remapeia license_id)
   - legislation_compliance_profiles, compliance_tasks (remapeia legislation_id)

3. **Colunas user_id**: Campos como `created_by_user_id`, `responsible_user_id` que referenciam profiles da Gabardo serão setados como `NULL` na Fike (pois os usuários são diferentes).

4. **Batch processing**: Insere em lotes de 500 para evitar timeouts.

## Alterações

**Criar**: `supabase/functions/copy-company-data/index.ts` - Edge function com service_role key que executa a cópia completa.

**Executar**: Invocar a function uma vez com `{ sourceCompanyId, targetCompanyId }`.

## Riscos
- Timeout na edge function com 1913 employees (mitigado com batches)
- Documentos físicos no storage nao serao copiados (apenas metadados)

