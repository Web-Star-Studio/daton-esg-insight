# Correção: Sidebar Sumiu das Páginas Protegidas

## Problema Identificado
Durante a "Etapa 3" da consolidação de navegação, o `LazyPageWrapper` substituiu o `ProtectedRoute` em todas as rotas do `App.tsx`. Isso causou a perda do `MainLayout` (que contém o `AppSidebar`) em todas as páginas protegidas.

## Causa Raiz
- `LazyPageWrapper`: Fornece apenas `Suspense` + `ErrorBoundary`
- `ProtectedRoute`: Fornece autenticação + `MainLayout` (com `AppSidebar`)
- As rotas protegidas precisavam de **ambos**, mas estavam usando apenas o `LazyPageWrapper`

## Solução Implementada

### 1. Criado `ProtectedLazyPageWrapper`
Novo componente que combina:
- ✅ Proteção de autenticação (`ProtectedRoute`)
- ✅ Layout com sidebar (`MainLayout` via `ProtectedRoute`)
- ✅ Loading states consistentes (`LazyPageWrapper`)
- ✅ Error boundaries robustos (`LazyPageWrapper`)

### 2. Atualizado `App.tsx`
Todas as rotas protegidas agora usam `ProtectedLazyPageWrapper`:
- `/dashboard`
- `/inventario-gee`
- `/licenciamento` e subrotas
- `/residuos`
- `/metas`
- `/gestao-riscos`
- Todas as páginas SGQ, RH, ESG, etc.

### 3. Rotas Públicas Mantidas com `LazyPageWrapper`
Páginas que **não** devem ter sidebar continuam usando `LazyPageWrapper`:
- `/` (Landing Page)
- `/auth`
- `/contato`
- `/funcionalidades`
- `/documentacao`
- `/form/:formId` (formulários públicos)

## Resultado
✅ Sidebar restaurado em todas as páginas protegidas
✅ Performance mantida (lazy loading)
✅ Error boundaries robustos mantidos
✅ Autenticação e proteção de rotas mantidas
✅ Loading states consistentes mantidos

## Arquivos Modificados
1. `src/components/ProtectedLazyPageWrapper.tsx` - **CRIADO**
2. `src/App.tsx` - **ATUALIZADO** (todas as rotas protegidas)

## Status
✅ **CONCLUÍDO** - Sidebar funcionando corretamente em todas as páginas protegidas
