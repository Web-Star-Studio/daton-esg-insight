

# Fix: Imagens inferiores do grid nao respondem ao hover

## Problema
Quando uma imagem superior e hovereada, a linha inferior encolhe para `1fr` (cerca de 25% da altura). As imagens inferiores ficam muito finas mas ainda existem -- o problema e que o `onMouseEnter` esta diretamente no `<img>`, e quando o mouse se move para baixo, ele sai da imagem superior (resetando o grid para `1fr 1fr`) antes de chegar na imagem inferior. Isso cria uma "corrida" onde o grid reseta antes do mouse alcancar a imagem de baixo.

Alem disso, cada `<img>` com `onMouseEnter` tem uma area de deteccao que depende do tamanho renderizado da imagem -- quando ela esta comprimida, a area e minuscula.

## Solucao
Envolver cada imagem em um `<div>` container que ocupe toda a celula do grid. O `onMouseEnter` vai no `<div>` em vez do `<img>`. Isso garante que a area de hover seja a celula inteira do grid (mesmo quando comprimida), nao apenas a imagem renderizada.

Tambem adicionar `cursor-pointer` para feedback visual.

### Arquivo editado
- `src/pages/SobreNos.tsx`

### Mudanca concreta
Substituir:
```tsx
{[socio1, socio2, socio3, socio4].map((src, idx) => (
  <img
    key={idx}
    src={src}
    alt={`Socio ${idx + 1}`}
    className="w-full h-full object-cover rounded-xl grayscale"
    onMouseEnter={() => setHoveredIdx(idx)}
  />
))}
```

Por:
```tsx
{[socio1, socio2, socio3, socio4].map((src, idx) => (
  <div
    key={idx}
    className="overflow-hidden rounded-xl cursor-pointer"
    onMouseEnter={() => setHoveredIdx(idx)}
  >
    <img
      src={src}
      alt={`Socio ${idx + 1}`}
      className="w-full h-full object-cover grayscale"
    />
  </div>
))}
```

O `<div>` ocupa 100% da celula do grid automaticamente, entao mesmo quando a celula esta pequena (1fr), toda a area da celula e sensivel ao hover. O `rounded-xl` e `overflow-hidden` ficam no div para manter o visual arredondado.

