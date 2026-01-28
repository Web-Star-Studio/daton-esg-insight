
# Plano: Corrigir Fluxo de Convite de Usuario

## Diagnostico

O problema tem duas partes:

### Problema 1: URL errada no magic link

A edge function `invite-user` usa uma URL hardcoded:
```javascript
const siteUrl = "https://dqlvioijqzlvnvvajmft.lovableproject.com";
```

Mas a URL publicada do app e:
```
https://daton-esg-insight.lovable.app
```

O usuario recebe o email com link apontando para a URL errada.

### Problema 2: Usuario tenta signup normal

1. Admin convida usuario via edge function
2. Usuario e criado no auth.users com `email_confirm: false`
3. Usuario recebe email mas vai para `/auth` e tenta criar conta
4. Supabase retorna "User already registered" (erro 422)
5. Usuario fica travado

---

## Solucao

### Parte 1: Corrigir URL na Edge Function

**Arquivo:** `supabase/functions/invite-user/index.ts`

Atualizar `siteUrl` para usar a URL publicada:

```typescript
// DE:
const siteUrl = Deno.env.get("SUPABASE_URL")?.includes("localhost")
  ? "http://localhost:5173"
  : "https://dqlvioijqzlvnvvajmft.lovableproject.com";

// PARA:
const siteUrl = Deno.env.get("SUPABASE_URL")?.includes("localhost")
  ? "http://localhost:5173"
  : "https://daton-esg-insight.lovable.app";
```

### Parte 2: Melhorar Mensagem de Erro no Signup

**Arquivo:** `src/contexts/AuthContext.tsx`

Quando usuario tenta signup e recebe "already registered", mostrar mensagem mais clara:

```typescript
// No tratamento de erro do signup:
if (error.message?.includes("already been registered") || 
    error.message?.includes("already registered")) {
  toast({
    variant: "destructive",
    title: "Email ja cadastrado",
    description: "Este email ja esta registrado. Se voce recebeu um convite, verifique seu email e clique no link de acesso. Ou tente fazer login.",
  });
  return;
}
```

### Parte 3: Adicionar aviso na pagina de Auth

**Arquivo:** `src/pages/Auth.tsx`

Adicionar info box na aba de "Criar Conta" informando sobre convites:

```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
  <p className="text-sm text-blue-800">
    <strong>Recebeu um convite?</strong> Use o link enviado por email 
    para definir sua senha. Nao e necessario criar uma nova conta.
  </p>
</div>
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/invite-user/index.ts` | Atualizar `siteUrl` para URL publicada |
| `src/contexts/AuthContext.tsx` | Melhorar mensagem de erro "already registered" |
| `src/pages/Auth.tsx` | Adicionar aviso sobre convites na aba de registro |

---

## Resultado Esperado

1. Novos convites terao o link correto para `https://daton-esg-insight.lovable.app/set-password`
2. Usuarios que tentarem signup normal verao mensagem clara direcionando para o email
3. Aba de registro tera aviso preventivo sobre convites

---

## Acao Imediata para Usuario Atual

Para o usuario que ja foi convidado e esta travado, o admin pode:
1. Usar o botao "Reenviar Convite" na gestao de usuarios
2. O novo link sera gerado com a URL correta
