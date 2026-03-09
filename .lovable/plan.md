

## Fix: `/controle-documentos` redireciona para `/documentos` em vez de renderizar a página própria

### Problema
Há **dois `<Navigate>` redirects** em `src/App.tsx` que redirecionam `/controle-documentos` → `/documentos?document_kind=controlled`:
- **Linha 310**: dentro do layout de qualidade (rota relativa `controle-documentos`)
- **Linha 882**: rota standalone absoluta `/controle-documentos`

O componente `ControleDocumentos` já está importado com lazy (linha 144) mas nunca é usado.

### Correção em `src/App.tsx`

1. **Linha 310** — substituir o `<Navigate>` por renderizar o componente:
```tsx
<Route path="controle-documentos" element={<LazyPageWrapper><ControleDocumentos /></LazyPageWrapper>} />
```

2. **Linha 882** — substituir o `<Navigate>` por renderizar com wrapper protegido:
```tsx
<Route path="/controle-documentos" element={<ProtectedLazyPageWrapper><ControleDocumentos /></ProtectedLazyPageWrapper>} />
```

Ambas as rotas passam a renderizar a página `ControleDocumentos.tsx` com suas tabs de Documentos Regulatórios, SGQ/ISO e Configurações.

