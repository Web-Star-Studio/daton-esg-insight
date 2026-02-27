

# Corrigir redirecionamento do link de redefinição de senha para domínio de produção

## Problema

O `window.location.origin` retorna a URL do preview do Lovable quando o email é disparado a partir do ambiente de desenvolvimento. Além disso, a edge function `manage-user` tem um fallback para `daton-esg-insight.lovable.app`.

## Alterações

### 1. `src/components/ForgotPasswordModal.tsx`
- Detectar se está rodando em domínio customizado ou no Lovable preview
- Se estiver no preview, forçar o `redirectTo` para `https://daton.com.br/reset-password`
- Lógica: se `window.location.hostname` contém `lovable.app` ou `lovableproject.com`, usar a URL de produção hardcoded; caso contrário, usar `window.location.origin`

### 2. `supabase/functions/manage-user/index.ts`
- Alterar o fallback de `https://daton-esg-insight.lovable.app` para `https://daton.com.br`
- Linha ~541: trocar `Deno.env.get('SITE_URL') || 'https://daton-esg-insight.lovable.app'` por `Deno.env.get('SITE_URL') || 'https://daton.com.br'`

### 3. Configuração Supabase (manual pelo usuário)
- No dashboard Supabase → Authentication → URL Configuration:
  - **Site URL**: definir como `https://daton.com.br`
  - **Redirect URLs**: adicionar `https://daton.com.br/**`

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ForgotPasswordModal.tsx` | Forçar redirect para domínio de produção |
| `supabase/functions/manage-user/index.ts` | Atualizar fallback URL |

