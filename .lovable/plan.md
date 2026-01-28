
# Plano: Corrigir Erro de FK ao Excluir Conta

## Diagnostico

O erro `user_roles_assigned_by_user_id_fkey` ocorre porque:

1. Usuario "A" atribuiu roles para usuarios "B", "C", "D"
2. Esses registros em `user_roles` tem `assigned_by_user_id = A.id`
3. Quando "A" tenta excluir sua conta, a funcao deleta seus proprios roles
4. Mas os roles de B, C, D ainda referenciam A como `assigned_by_user_id`
5. O Supabase nao consegue deletar o usuario de `auth.users` por causa da FK

---

## Solucao

Antes de deletar o usuario, precisamos limpar as referencias de `assigned_by_user_id` em TODOS os `user_roles` que esse usuario atribuiu.

---

## Alteracao no Codigo

**Arquivo:** `supabase/functions/delete-account/index.ts`

### Para Usuario Nao-Dono (linhas 539-583)

Adicionar ANTES de deletar o profile:

```typescript
// Clear references to this user in other user_roles (assigned_by_user_id)
const { error: assignedByError } = await supabaseAdmin
  .from('user_roles')
  .update({ assigned_by_user_id: null })
  .eq('assigned_by_user_id', userId);

if (assignedByError) {
  console.warn('Error clearing assigned_by_user_id:', assignedByError);
}
```

### Para Usuario Dono (linha ~480)

Ja deleta todos os user_roles da empresa, mas precisamos garantir que `assigned_by_user_id` de outras empresas tambem seja limpo (caso o usuario tenha atribuido roles em contextos diferentes):

Adicionar ANTES de deletar os user_roles da empresa:

```typescript
// Clear assigned_by references from ALL user_roles (may span companies)
for (const uid of userIds) {
  await supabaseAdmin
    .from('user_roles')
    .update({ assigned_by_user_id: null })
    .eq('assigned_by_user_id', uid);
}
```

---

## Codigo Final (Usuario Nao-Dono)

```typescript
} else {
  // Delete only user data
  console.log(`Deleting user ${userId} data...`);

  // *** NEW: Clear references to this user as assigner ***
  const { error: assignedByError } = await supabaseAdmin
    .from('user_roles')
    .update({ assigned_by_user_id: null })
    .eq('assigned_by_user_id', userId);

  if (assignedByError) {
    console.warn('Error clearing assigned_by_user_id:', assignedByError);
  }

  // Delete user_role
  const { error: roleDeleteError } = await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  // ... resto do codigo
}
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/delete-account/index.ts` | Adicionar limpeza de `assigned_by_user_id` antes da exclusao |

**Total:** ~10 linhas adicionadas

---

## Resultado Esperado

1. Antes de deletar o usuario, todas as referencias em `user_roles.assigned_by_user_id` sao setadas para `NULL`
2. O usuario pode ser deletado sem erro de FK constraint
3. Historico de quem atribuiu roles e perdido (aceitavel para exclusao de conta)
