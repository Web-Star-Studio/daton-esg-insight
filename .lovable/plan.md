

## Corrigir select de Responsavel nas Acoes Imediatas de NC

### Problema identificado

O dropdown de "Responsavel" na tela de Acoes Imediatas busca dados da tabela `profiles` (usuarios com login na plataforma), que tem apenas ~10 registros para a empresa. Porem, a empresa tem ~1.898 colaboradores na tabela `employees`.

Resultado: apenas usuarios com conta na plataforma aparecem no select, quando o esperado e que todos os colaboradores da empresa estejam disponiveis.

### Solucao

Alterar o componente `NCStage2ImmediateAction.tsx` para usar o hook `useCompanyEmployees` (que busca da tabela `employees`) em vez do `useCompanyUsers` (que busca de `profiles`).

O hook `useCompanyEmployees` ja existe em `src/hooks/data/useCompanyEmployees.ts` e faz exatamente o necessario: busca funcionarios ativos filtrados por `company_id` com paginacao ate 5.000 registros.

### Detalhes tecnicos

**Arquivo: `src/components/non-conformity/NCStage2ImmediateAction.tsx`**

1. Substituir a importacao de `useCompanyUsers` por `useCompanyEmployees` de `@/hooks/data/useCompanyEmployees`
2. Trocar `const { data: users } = useCompanyUsers()` por `const { data: users } = useCompanyEmployees()`
3. O campo `responsible_user_id` continua funcionando pois ambas as tabelas usam UUID como `id` e possuem `full_name`

**Consideracao importante**: O campo na tabela `nc_immediate_actions` se chama `responsible_user_id`, indicando que originalmente referenciava `profiles.id`. Se houver foreign key constraint apontando para `profiles`, sera necessario:
- Remover a FK constraint, ou
- Adicionar uma coluna separada `responsible_employee_id` referenciando `employees.id`

Vou verificar isso antes de implementar e, se necessario, ajustar o schema.

**Arquivo: `src/hooks/useNonConformity.ts`**

- A funcao `useCompanyUsers` exportada pode ser mantida para outros usos, mas o componente de acoes imediatas deixara de usa-la.

### Impacto

- O dropdown passara a listar todos os colaboradores ativos da empresa (~1.898)
- Com muitos registros, o select pode ficar lento; considerar adicionar busca/filtro com `Command` (combobox) em vez de `Select` simples
- Paginas que ja usam `useCompanyEmployees` continuam funcionando normalmente

