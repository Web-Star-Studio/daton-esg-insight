

# Correção dos 2 problemas

## Problema 1: `/configuracao` redirecionando para dashboard

**Causa raiz:** A rota `/configuracao` está mapeada ao módulo `settings` em `src/config/routeModuleMap.ts` (linha 58). Se o módulo `settings` estiver desativado para o usuário na tabela `user_module_access`, o `ProtectedRoute` bloqueia o acesso e redireciona para `/dashboard`.

**Correção:** Remover `/configuracao` do `routeModuleMap.ts`. A página de configurações/perfil do usuário é uma funcionalidade essencial que todo usuário autenticado deve acessar — não deve ser tratada como um módulo restringível.

**Arquivo:** `src/config/routeModuleMap.ts` — remover linha 58 (`'/configuracao': 'settings'`)

---

## Problema 2: Link de recuperação de senha apontando para URL antiga

**Causa raiz:** O código no `ForgotPasswordModal.tsx` já detecta domínios Lovable e força `https://daton.com.br`. Porém, o Supabase tem uma configuração de **"Site URL"** no dashboard (Authentication → URL Configuration) que é usada como fallback pelo próprio Supabase quando processa o email. Se essa URL ainda estiver como `https://daton-esg-insight.lovable.app`, o Supabase pode ignorar o `redirectTo` do código.

**Ações necessárias:**
1. **Verificar no Supabase Dashboard** → Authentication → URL Configuration:
   - **Site URL** deve ser `https://daton.com.br`
   - **Redirect URLs** deve incluir `https://daton.com.br/reset-password` e `https://daton.com.br/**`
2. **No código** — garantir que `src/services/auth.ts` (registro) também force o domínio de produção, aplicando a mesma lógica de detecção de preview que já existe no `ForgotPasswordModal`:

**Arquivo:** `src/services/auth.ts` — na função `registerCompany`, trocar `window.location.origin` pela lógica que detecta preview e usa `https://daton.com.br`

---

## Resumo das alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/config/routeModuleMap.ts` | Remover `/configuracao` do mapeamento |
| `src/services/auth.ts` | Forçar redirect para `daton.com.br` em ambiente preview |
| Supabase Dashboard | Verificar Site URL e Redirect URLs |

