
# Plano: Corrigir Erro 404 na Página Avaliação de Eficácia

## Diagnóstico

A página `/avaliacao-eficacia` retorna **404** porque:

1. O componente `AvaliacaoEficacia.tsx` **existe** em `src/pages/`
2. O link está no **sidebar** (AppSidebar.tsx, linha 144)
3. **Porém a rota NÃO foi registrada** no `App.tsx`
4. **Também falta o import lazy** do componente

---

## Solução

Adicionar o import e a rota no arquivo `App.tsx`.

---

## Alterações

**Arquivo:** `src/App.tsx`

### 1. Adicionar import lazy (após linha 178)

```typescript
const AvaliacaoEficacia = lazy(() => import("./pages/AvaliacaoEficacia"));
```

Posicionar junto com os outros imports de RH modules (linhas 169-179).

### 2. Adicionar rota (após linha 690)

```typescript
<Route path="/avaliacao-eficacia" element={<ProtectedLazyPageWrapper><AvaliacaoEficacia /></ProtectedLazyPageWrapper>} />
```

Posicionar junto com as outras rotas de RH modules, após `/gestao-treinamentos`.

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Erro 404 ao acessar `/avaliacao-eficacia` | Página carrega normalmente |
| Link no sidebar não funciona | Navegação funciona corretamente |

---

## Resumo das Alterações

| Arquivo | Linha | Alteração |
|---------|-------|-----------|
| `src/App.tsx` | ~179 | Adicionar `const AvaliacaoEficacia = lazy(...)` |
| `src/App.tsx` | ~691 | Adicionar `<Route path="/avaliacao-eficacia" .../>` |
