

# Fix: `/controle-documentos` redirecting to `/documentos`

## Problem
In `src/App.tsx`, both route definitions for `/controle-documentos` (lines 310 and 882) use `<Navigate to="/documentos?document_kind=controlled" replace />` instead of rendering the `ControleDocumentos` page component. The component is already lazy-imported (line 144) but never used.

## Fix
Replace both `<Navigate>` redirects with the actual component:

- **Line 310** (demo routes): `<Route path="controle-documentos" element={<LazyPageWrapper><ControleDocumentos /></LazyPageWrapper>} />`
- **Line 882** (protected routes): `<Route path="/controle-documentos" element={<ProtectedLazyPageWrapper><ControleDocumentos /></ProtectedLazyPageWrapper>} />`

Two lines changed, no new files.

