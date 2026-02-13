

## Multi-Select e Acoes em Lote no Platform Admin

### Resumo
Adicionar checkboxes de selecao multipla nas tabelas de **Usuarios** e **Empresas** do painel Platform Admin, com uma barra de acoes em lote flutuante que aparece quando ha itens selecionados.

---

### 1. Tabela de Usuarios (`PlatformUsersTable.tsx`)

**Selecao:**
- Adicionar coluna de checkbox no header (selecionar todos da pagina) e em cada linha
- Estado `selectedUserIds: Set<string>` para rastrear selecao
- Platform admins nao podem ser selecionados (checkbox desabilitado)

**Barra de acoes em lote** (flutuante no bottom, similar ao `BulkActionsBar` existente):
- **Aprovar** - aprovar todos os selecionados
- **Revogar aprovacao** - revogar aprovacao dos selecionados
- **Excluir** - excluir todos os selecionados (com dialogo de confirmacao)
- Badge com contagem de selecionados + botao limpar selecao

**Backend:**
- Adicionar action `bulkDeleteUsers` na edge function `manage-platform` que recebe um array de `userIds` e executa o mesmo fluxo de limpeza para cada um (loop sobre a logica existente de `deleteUser`)
- A aprovacao/revogacao em lote sera feita diretamente pelo client (update em `profiles` para cada ID, reutilizando a mutation existente)

---

### 2. Tabela de Empresas (`CompanyTable.tsx`)

**Selecao:**
- Mesmo padrao de checkboxes (header + linhas)
- Estado `selectedCompanyIds: Set<string>`

**Barra de acoes em lote:**
- **Suspender** - suspender todas as selecionadas
- **Ativar** - ativar todas as selecionadas

**Backend:**
- Adicionar action `bulkSuspendCompanies` e `bulkActivateCompanies` na edge function, reutilizando a logica existente de `suspendCompany`/`activateCompany` em loop

---

### Detalhes Tecnicos

**Edge Function `manage-platform/index.ts`:**
- Novas actions: `bulkDeleteUsers`, `bulkSuspendCompanies`, `bulkActivateCompanies`
- `bulkDeleteUsers` recebe `{ userIds: string[] }`, valida que nenhum e platform admin, e executa a exclusao sequencial com o service role client
- `bulkSuspendCompanies` e `bulkActivateCompanies` recebem `{ companyIds: string[] }` e fazem update em lote

**Componentes UI:**
- Importar `Checkbox` de `@/components/ui/checkbox`
- A barra de acoes em lote sera inline no proprio componente (div fixed no bottom com z-50), seguindo o padrao do `BulkActionsBar.tsx` existente
- Ao concluir uma acao em lote, limpar selecao e invalidar queries
- `colSpan` das linhas de loading/vazio sera incrementado em 1 (nova coluna de checkbox)

**Arquivos a editar:**
- `supabase/functions/manage-platform/index.ts` - novas actions em lote
- `src/components/platform/PlatformUsersTable.tsx` - checkboxes + barra de acoes
- `src/components/platform/CompanyTable.tsx` - checkboxes + barra de acoes

