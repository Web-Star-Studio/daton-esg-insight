
## Excluir Usuarios pelo Platform Admin

### Resumo
Adicionar um botao "Excluir" na tabela de usuarios do painel Platform Admin (`/platform-admin`), com dialogo de confirmacao. A exclusao remove o perfil, roles e o registro de autenticacao do usuario.

### Alteracoes

**1. Edge Function `manage-platform/index.ts`**
- Adicionar a action `deleteUser` ao tipo de request
- Criar um segundo client Supabase com `SUPABASE_SERVICE_ROLE_KEY` (necessario para `auth.admin.deleteUser()`)
- O fluxo de exclusao:
  1. Limpar referencias em `user_roles.assigned_by_user_id`
  2. Deletar registros em `user_roles` do usuario
  3. Deletar o perfil em `profiles`
  4. Deletar o usuario em `auth.users` via admin API
- Impedir a exclusao de outros platform admins (seguranca)

**2. Componente `PlatformUsersTable.tsx`**
- Adicionar botao "Excluir" (icone Trash2) nas acoes de cada usuario
- O botao nao aparece para usuarios com role `platform_admin`
- Ao clicar, exibir um `AlertDialog` de confirmacao com aviso claro
- Mutation que chama `supabase.functions.invoke('manage-platform', { body: { action: 'deleteUser', data: { userId } } })`
- Invalidar cache apos sucesso

### Detalhes Tecnicos

- A edge function `manage-platform` ja verifica se o chamador e platform admin via tabela `platform_admins`
- O `SUPABASE_SERVICE_ROLE_KEY` ja esta disponivel como variavel de ambiente padrao nas edge functions do Supabase
- A acao sera registrada na tabela `platform_admin_actions` (ja implementado no fluxo existente)
- Nenhuma migracao de banco de dados e necessaria
