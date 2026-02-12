

# Fix: Grid deve manter tamanho fixo no hover

## Problema
O container do grid tem `aspect-square` que faz o grid inteiro redimensionar quando as proporcoes `3fr/1fr` mudam. O grid deveria manter seu tamanho original e apenas redistribuir o espaco interno entre as 4 imagens.

## Solucao
Remover `aspect-square` do container externo e definir uma altura fixa para o grid. O container do grid precisa de dimensoes fixas para que o CSS Grid apenas redistribua o espaco interno sem alterar o tamanho total.

### Arquivo editado
- `src/pages/SobreNos.tsx`

### Mudancas
1. Remover `aspect-square` do div container externo (`md:w-[70%]`)
2. Adicionar uma altura fixa ao grid interno, por exemplo `h-[500px]` ou usar `aspect-square` no container externo mas com `overflow-hidden` -- na verdade, o correto e manter `aspect-square` no container externo mas garantir que o grid interno use `w-full h-full` sem que o container mude de tamanho
3. O problema real: o container externo com `aspect-square` esta correto, mas o grid interno esta fazendo o container crescer. A solucao e adicionar `overflow-hidden` ao container externo para que ele mantenha suas dimensoes fixas, e o grid interno redistribua o espaco dentro dessas dimensoes fixas

Na verdade, revisando melhor: `aspect-square` com `md:w-[70%]` define a altura com base na largura. O grid interno com `w-full h-full` deveria preencher esse espaco. O problema pode ser que o grid esta empurrando o container. A solucao e garantir que o container externo tenha dimensoes fixas e o grid nao o expanda.

### Correcao concreta
- No div externo (`md:w-[70%] aspect-square`): adicionar `overflow-hidden` para conter o grid
- No div do grid (`grid w-full h-full gap-2`): esta correto, ele preenche o container
- O `aspect-square` no container garante que ele mantem formato quadrado baseado na largura (70% do pai)

Se o grid ainda crescer, a alternativa e remover `aspect-square` e usar uma altura calculada via CSS (`aspect-ratio: 1/1` no style inline) junto com `overflow-hidden`.
