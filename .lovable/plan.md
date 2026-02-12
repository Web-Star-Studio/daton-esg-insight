

## Correcao: Redirecionar para onboarding apos cadastro

### Causa raiz

Apos o registro, o Supabase faz login automatico do usuario (`immediate_login_after_signup`). O `handleRegister` em `Auth.tsx` apenas muda a aba para "login" (`setActiveTab('login')`) sem navegar para `/onboarding`. Como o roteamento padrao envia usuarios nao aprovados para `/demo` (via `ProtectedRoute`), o usuario nunca passa pelo onboarding.

### Fluxo atual (com bug)

```text
Registro -> Auto-login -> Auth.tsx mostra aba "login" -> Usuario clica login -> ProtectedRoute -> /demo
```

### Fluxo correto

```text
Registro -> Auto-login -> Navega para /onboarding -> Completa onboarding -> /demo (aguardando aprovacao)
```

### Correcao

**Arquivo: `src/pages/Auth.tsx`**

1. Apos o `register()` ser bem-sucedido (linha 99-105), em vez de apenas trocar para a aba de login, navegar para `/onboarding` usando `useNavigate`:

```typescript
// Antes:
await register({ ... });
setActiveTab('login');

// Depois:
await register({ ... });
navigate('/onboarding');
```

2. Adicionar `useNavigate` do react-router-dom nas importacoes e no componente.

Essa mudanca garante que, ao ser auto-logado pelo Supabase apos o cadastro, o usuario seja imediatamente levado ao fluxo de onboarding. A rota `/onboarding` (via `OnboardingRoute`) ja verifica `shouldShowOnboarding` e exibe o componente correto.

