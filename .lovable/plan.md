

# Efeito de Hover Interativo no Grid de Socios

## Comportamento
Ao passar o mouse sobre uma das 4 imagens do grid, ela cresce (ocupa ~70% do espaco) enquanto as outras 3 encolhem (~30%), mantendo o conjunto total como um quadrado. As 5 combinacoes sao: nenhum hover (4 iguais), hover no top-left, top-right, bottom-left, bottom-right -- exatamente como nos diagramas de referencia.

## Abordagem Tecnica

Substituir o `grid grid-cols-2` por um layout CSS Grid com `grid-template-rows` e `grid-template-columns` controlados por estado React (`hoveredIndex`).

- **Estado default (nenhum hover)**: `grid-template-columns: 1fr 1fr` e `grid-template-rows: 1fr 1fr` -- 4 quadrados iguais.
- **Hover no indice 0 (top-left)**: columns `3fr 1fr`, rows `3fr 1fr` -- top-left grande, os outros 3 pequenos.
- **Hover no indice 1 (top-right)**: columns `1fr 3fr`, rows `3fr 1fr`.
- **Hover no indice 2 (bottom-left)**: columns `3fr 1fr`, rows `1fr 3fr`.
- **Hover no indice 3 (bottom-right)**: columns `1fr 3fr`, rows `1fr 3fr`.

A transicao sera suave com `transition: grid-template-rows 0.4s, grid-template-columns 0.4s` via style inline.

### Arquivo editado
- `src/pages/SobreNos.tsx`

### Detalhes
- Adicionar `useState<number | null>(null)` para `hoveredIndex`
- Cada imagem recebe `onMouseEnter={() => setHoveredIndex(idx)}` e o container `onMouseLeave={() => setHoveredIndex(null)}`
- O `aspect-square` sera removido das imagens individuais -- o aspecto quadrado do conjunto sera mantido pelo container com `aspect-square`
- As imagens usarao `w-full h-full object-cover` para preencher suas celulas
- Transicao CSS de 400ms ease para um efeito fluido
- Em mobile, o efeito permanece funcional (touch) sem quebrar o layout

### O que nao muda
- As imagens, filtro grayscale, bordas arredondadas
- O layout 30/70 com a Worton
- O fundo escuro da secao

