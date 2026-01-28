
# Plano: Corrigir Exclusao de Conta para Usuarios Orfaos

## Diagnostico

O usuario `araujodgdev@gmail.com` existe em `auth.users` mas **nao tem registro** na tabela `profiles`. Isso causa:

1. **Login funciona** - auth.users existe
2. **Edge functions falham** - dependem de profiles que nao existe

## Causa Provavel

O profile pode ter sido deletado acidentalmente, ou o trigger `handle_new_user` falhou durante o cadastro.

---

## Solucao

Modificar a edge function `delete-account` para lidar com usuarios sem profile:

### Logica Atualizada

```
Usuario solicita exclusao
         |
         v
  [Buscar profile]
         |
    +----+----+
    |         |
 Encontrou  Nao encontrou
    |         |
    v         v
 Fluxo     Deletar apenas
 normal    o auth.user
           (usuario orfao)
```

---

## Alteracoes no Codigo

**Arquivo:** `supabase/functions/delete-account/index.ts`

### Trecho Atual (linhas 388-401)

```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('id, full_name, company_id, created_at')
  .eq('id', userId)
  .single();

if (profileError || !profile) {
  console.error('Profile not found:', profileError);
  return new Response(
    JSON.stringify({ error: 'Perfil não encontrado' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### Trecho Novo

```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('id, full_name, company_id, created_at')
  .eq('id', userId)
  .maybeSingle();

// Handle orphaned user (exists in auth but not in profiles)
if (!profile) {
  console.log('Orphaned user detected (no profile), deleting auth user only...');
  
  // Just delete the auth user directly
  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (deleteAuthError) {
    console.error('Error deleting orphaned auth user:', deleteAuthError);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao excluir conta',
        message: deleteAuthError.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Conta excluída com sucesso',
      deletedUsers: 1,
      deletedTables: 0
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Continue with normal flow for users with profile...
const companyId = profile.company_id;
```

---

## Resumo das Alteracoes

| Linha | De | Para |
|-------|-----|------|
| 393 | `.single()` | `.maybeSingle()` |
| 395-401 | Retornar erro 404 | Tratar usuario orfao e deletar auth user |

**Total:** ~25 linhas modificadas/adicionadas

---

## Resultado Esperado

1. Usuarios com profile: fluxo normal (como esta hoje)
2. Usuarios sem profile (orfaos): deleta apenas o auth.user
3. Voce conseguira excluir sua conta mesmo sem ter profile
4. Sistema mais robusto para casos edge
