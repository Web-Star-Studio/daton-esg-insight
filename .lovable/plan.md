

## Corrigir Redirecionamento: Onboarding antes do Demo

### Problema
Quando um novo usuario se registra, o `ProtectedRoute` verifica apenas se ele esta aprovado. Como nao esta, redireciona diretamente para `/demo`, pulando o onboarding. O fluxo correto e:

**Registro -> Onboarding -> Demo (aguardando aprovacao) -> Dashboard (aprovado)**

### Causa Raiz
Dois componentes de rota ignoram o estado de onboarding:

1. **`ProtectedRoute.tsx`** (linha 53): Redireciona usuarios nao aprovados para `/demo` sem verificar `shouldShowOnboarding`
2. **`DemoRoute.tsx`** (linha 40): Permite acesso ao demo sem verificar se o onboarding foi concluido

### Correcoes

**1. `src/components/ProtectedRoute.tsx`**
- Importar `shouldShowOnboarding` do `useAuth()`
- Antes do redirecionamento para `/demo`, verificar se `shouldShowOnboarding` e `true`
- Se sim, redirecionar para `/onboarding` em vez de `/demo`

**2. `src/components/DemoRoute.tsx`**
- Importar `shouldShowOnboarding` do `useAuth()`
- Antes de renderizar o demo, verificar se o onboarding ainda nao foi concluido
- Se `shouldShowOnboarding` for `true`, redirecionar para `/onboarding`

### Detalhes Tecnicos

No `ProtectedRoute.tsx`, o bloco de redirecionamento (linhas 52-56) sera alterado de:
```
if (!isApproved) {
  return <Navigate to="/demo" replace />;
}
```
Para:
```
if (!isApproved) {
  if (shouldShowOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to="/demo" replace />;
}
```

No `DemoRoute.tsx`, adicionar antes do `return <>{children}</>`:
```
if (shouldShowOnboarding) {
  return <Navigate to="/onboarding" replace />;
}
```

Sao alteracoes de poucas linhas em 2 arquivos, sem impacto em nenhuma outra funcionalidade.

