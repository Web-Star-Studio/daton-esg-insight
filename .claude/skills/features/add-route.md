# Skill: add-route
# Trigger: /add-route
# Descrição: Adicionar uma nova rota ao App.tsx com lazy loading, tratamento demo e sidebar (sem criar novo componente de página)

Use esta skill quando o componente de página já existe e você só precisa registrar a rota.

## Contexto

`src/App.tsx` é o arquivo central de roteamento (~900 linhas). Usa React Router DOM com:
- Lazy imports no topo do arquivo
- `<Routes>` com `<Route>` aninhados
- Wrappers: `LazyPageWrapper`, `ProtectedLazyPageWrapper`, `DemoRoute`, `ProtectedRoute`

## Mapa de wrappers

| Contexto | Wrapper | Quando usar |
|----------|---------|-------------|
| Demo | `<LazyPageWrapper>` | Rota em `/demo/*` |
| Protegida simples | `<ProtectedLazyPageWrapper>` | Rota normal autenticada |
| Protegida com role | `<ProtectedRoute requiredRole="Admin">` | Rota restrita a papel específico |
| Protegida com módulo | `<ProtectedRoute requiredModule="modulo">` | Rota com feature flag |

## Passo 1 — Lazy import

Localize o bloco de lazy imports em App.tsx (após os imports estáticos):

```typescript
// Adicionar em ordem alfabética ou junto ao módulo relacionado:
const NomeComponente = lazy(() => import('./pages/NomeComponente'));
```

## Passo 2 — Rota demo (se aplicável)

Localize `<Route path="/demo"` em App.tsx. Dentro do Route aninhado:

```typescript
<Route
  path="nome-sub-rota"
  element={
    <LazyPageWrapper>
      <NomeComponente />
    </LazyPageWrapper>
  }
/>
```

A URL final será `/demo/nome-sub-rota`.

## Passo 3 — Rota protegida

Localize a seção de rotas protegidas (buscar por `path="/dashboard"` como referência). Adicionar próximo ao módulo relacionado:

```typescript
<Route
  path="/nome-rota"
  element={
    <ProtectedLazyPageWrapper>
      <NomeComponente />
    </ProtectedLazyPageWrapper>
  }
/>
```

### Com proteção de role:

```typescript
<Route
  path="/nome-rota"
  element={
    <ProtectedRoute requiredRole="Admin">
      <Suspense fallback={<PageSkeleton />}>
        <NomeComponente />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

### Com proteção de módulo:

```typescript
<Route
  path="/nome-rota"
  element={
    <ProtectedRoute requiredModule="nomeModulo">
      <Suspense fallback={<PageSkeleton />}>
        <NomeComponente />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

## Passo 4 — Sidebar (se necessário)

Em `src/components/AppSidebar.tsx`, adicionar item na seção correta:

```typescript
{
  title: 'Nome da Rota',
  url: isDemo ? '/demo/nome-sub-rota' : '/nome-rota',
  icon: IconeLucide,
},
```

**Onde encontrar ícones:** `import { NomeIcone } from 'lucide-react'`
- Catálogo: https://lucide.dev/icons

## Passo 5 — Breadcrumb (se necessário)

Se a página usa `Breadcrumbs`, verificar se a rota está mapeada em `src/components/navigation/Breadcrumbs.tsx`.

## Passo 6 — Verificação

```bash
bun run type-check
bun run dev
# Testar: navegar para a nova rota
# Testar: navegar para /demo/nova-rota
```

## Checklist

- [ ] Lazy import adicionado
- [ ] Rota demo registrada (se aplicável)
- [ ] Rota protegida registrada
- [ ] Item de sidebar adicionado com URL condicional
- [ ] Type-check passando
- [ ] Rota funciona em modo normal e modo demo
