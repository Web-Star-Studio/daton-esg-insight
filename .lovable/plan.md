
# Fix: usePermissions lendo role da tabela errada

## Problema

O hook `usePermissions` (usado pelo `AdminDashboard` para verificar acesso) busca o role do usuario na tabela `profiles.role` em vez da tabela autoritativa `user_roles.role`. Douglas Araujo tem:

- `profiles.role` = `viewer` (desatualizado)
- `user_roles.role` = `platform_admin` (correto)

Resultado: o dashboard mostra "Voce nao tem permissao" mesmo sendo platform_admin.

## Solucao

### 1. Corrigir `src/hooks/usePermissions.tsx`

Alterar a query `user-role` para buscar da tabela `user_roles` em vez de `profiles`:

```typescript
// ANTES (incorreto - le de profiles)
const { data } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

// DEPOIS (correto - le de user_roles)
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .maybeSingle();
```

### 2. Corrigir build errors nos outros arquivos

Alem do fix principal, corrigir os erros de build reportados:

**`src/components/BenefitConfigurationModal.tsx`** - Tornar `position` opcional no tipo `Employee` local ou usar o tipo importado de `services/employees`.

**`src/pages/GestaoTreinamentos.tsx`** - Adicionar type assertions para valores `unknown` vindos de calculos/queries (cast para `number`, `Record<string, number>`, arrays tipados, `ReactNode`).

**`src/pages/SeguracaTrabalho.tsx`** - Adicionar type assertions para valores `unknown` (cast para `number`, `LTIFRMetadata`, `ReactNode`).

**`src/pages/SocialESG.tsx`** - Adicionar type assertions para valores `unknown` (cast para `number`, `string | number`, `ReactNode`).

**`src/services/esgRecommendedIndicators.ts`** - Cast valores `unknown` para `number`.

**`src/utils/erDiagramData.ts`** - Remover diretiva `@ts-expect-error` desnecessaria.

## Impacto

- Douglas (e qualquer platform_admin/super_admin/admin) tera acesso imediato ao Admin Dashboard
- Corrige a inconsistencia entre `profiles.role` e `user_roles.role` na camada de permissoes
- Resolve todos os erros de build pendentes
