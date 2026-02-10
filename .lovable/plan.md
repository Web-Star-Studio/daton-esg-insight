

## Corrigir listagem de usuarios no Platform Admin

### Problema raiz

A query do `PlatformUsersTable` tenta fazer um join embutido `profiles -> user_roles(role)`, mas nao existe uma foreign key direta entre `profiles` e `user_roles`. A FK de `user_roles.user_id` aponta para `auth.users(id)`, nao para `profiles(id)`. Isso causa erro 400 do PostgREST e nenhum usuario e retornado.

### Solucao

Separar a busca em duas queries:

1. Buscar `profiles` com join em `companies(name)` (que funciona, pois `profiles.company_id` tem FK para `companies`)
2. Buscar `user_roles` separadamente para os IDs retornados, e combinar no cliente

### Mudancas no arquivo

**`src/components/platform/PlatformUsersTable.tsx`**

Alterar a `queryFn` para:

1. Remover `user_roles(role)` do select embutido do profiles
2. Apos obter os profiles, buscar os roles separadamente:

```typescript
// Query 1: profiles + companies
const { data: profiles, count, error } = await supabase
  .from("profiles")
  .select("id, full_name, email, is_active, is_approved, created_at, job_title, company_id, companies(name)", { count: "exact" })
  .order("created_at", { ascending: false })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

// Query 2: roles para esses usuarios
const userIds = profiles.map(p => p.id);
const { data: roles } = await supabase
  .from("user_roles")
  .select("user_id, role")
  .in("user_id", userIds);

// Combinar
const roleMap = Object.fromEntries(roles.map(r => [r.user_id, r.role]));
const users = profiles.map(p => ({ ...p, role: roleMap[p.id] }));
```

3. Atualizar a renderizacao para usar `user.role` diretamente em vez de `user.user_roles?.[0]?.role`

### Arquivo modificado

| Arquivo | Mudanca |
|---------|---------|
| `src/components/platform/PlatformUsersTable.tsx` | Separar query de roles e combinar no cliente |

