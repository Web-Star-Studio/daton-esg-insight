

# Continuar migração Gabardo → Fike

## Problema pendente
A fase 1 falhou no `supplier_management` porque o código seta `cnpj: null` e `cpf: null`, mas existe um check constraint `valid_pj_fields` que exige CNPJ para fornecedores do tipo PJ.

## Correção
No `copy-company-data/index.ts`, manter os valores originais de `cnpj` e `cpf` dos fornecedores (a unicidade é por company_id, então não haverá conflito).

**Linha 77** — trocar `cnpj: null, cpf: null` por `cnpj: s.cnpj, cpf: s.cpf`.

## Execução sequencial
Após deploy da correção, executar as 4 fases em ordem:

1. **clean** — limpa dados anteriores parciais na Fike
2. **phase1** — tabelas independentes + dependentes não-employee (departments, branches, legislations, suppliers, licenses, NCs, etc.)
3. **phase2** — employees (1913 registros) + self-refs de managers
4. **phase3** — training_programs, employee_trainings, employee_experiences, employee_education

Cada fase será invocada via `curl_edge_functions`.

