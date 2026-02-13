

## Corrigir Sobreposicao do Botao sobre o Texto no Hero Mobile

### Problema
O botao "EXPLORAR DEMONSTRACAO" continua sobrepondo o subtitulo no mobile. A causa raiz e que o container usa `min-height: 100vh` com `justify-content: flex-end`, empurrando todo o conteudo para o fundo. O padding inferior (`clamp(2rem, 5vh, 80px)`) e insuficiente, e o `gap-8` sozinho nao resolve porque o espaco disponivel no fundo e limitado.

### Solucao

**Arquivo: `src/components/landing/heimdall/HeroSection.tsx`**

1. Aumentar o padding inferior do container da section para dar mais respiro ao conteudo empilhado em mobile: trocar `clamp(2rem, 5vh, 80px)` por `clamp(6rem, 12vh, 80px)` no bottom padding
2. Na action bar, remover `w-full` em mobile (que faz o botao ocupar 100% e competir visualmente) e usar `self-end` para alinhar a direita sem sobrepor
3. Adicionar `shrink-0` na action bar para impedir que o flexbox a comprima sobre o texto

**Alteracao concreta (linha 73):**
```
padding: 'clamp(100px, 15vw, 120px) clamp(1rem, 4vw, 2rem) clamp(6rem, 12vh, 80px)'
```

**Alteracao na action bar (linha 210):**
- Trocar `w-full md:w-fit` por `self-end shrink-0 md:w-fit`

Isso garante que o conteudo textual tenha espaco suficiente antes da action bar, sem sobreposicao em nenhum breakpoint.

### Arquivo a editar
- `src/components/landing/heimdall/HeroSection.tsx` (2 linhas)

