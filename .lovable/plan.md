

# Correcao do Redirecionamento Pos-Cadastro

## Problema Identificado
Apos o registro bem-sucedido, o fluxo segue este caminho quebrado:

1. `Auth.tsx` faz `navigate('/onboarding')` apos o cadastro
2. `OnboardingRoute` verifica se ha usuario autenticado
3. Como o Supabase pode exigir confirmacao de email, o usuario ainda nao esta autenticado
4. `OnboardingRoute` redireciona para `/login` -- **mas essa rota nao existe** (a rota correta e `/auth`)
5. O resultado e um erro 404

## Correcoes Necessarias

### 1. Corrigir rota inexistente em `src/routes/onboarding.tsx`
- Linha 33: Trocar `<Navigate to="/login" replace />` por `<Navigate to="/auth" replace />`
- Isso garante que, caso o usuario nao esteja autenticado, ele sera levado para a pagina de login correta

### 2. Ajustar fluxo pos-registro em `src/pages/Auth.tsx`
- Linha 106: Apos o registro, verificar se o usuario precisa confirmar email antes de navegar para `/onboarding`
- Se o Supabase exigir confirmacao de email, manter o usuario na tela de auth com uma mensagem informativa em vez de redirecionar para onboarding
- Se nao exigir (auto-confirm habilitado), redirecionar para `/onboarding` normalmente

### Detalhes Tecnicos

**Arquivo `src/routes/onboarding.tsx` (linha 33):**
- Alterar redirect de `/login` para `/auth`

**Arquivo `src/pages/Auth.tsx` (linhas 97-109):**
- Apos o `register()`, verificar se o usuario foi autenticado automaticamente (session existe)
- Se sim: `navigate('/onboarding')`
- Se nao (precisa confirmar email): exibir mensagem de sucesso e manter na tela de auth, sem redirecionar para onboarding

