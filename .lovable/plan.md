

# Remover Lenis e corrigir scroll de modais

## Diagnóstico

O Lenis (`src/components/layout/SmoothScroll.tsx`) está interceptando todos os eventos de scroll da página. Apesar do `MutationObserver` que pausa o Lenis quando um dialog está aberto, isso não está funcionando de forma confiável --- o replay mostra a classe `lenis-stopped` sendo aplicada, mas o scroll interno dos modais continua bloqueado. O Lenis adiciona classes como `lenis` e `lenis-stopped` ao `<html>`, e seu próprio CSS pode estar interferindo com `overflow`.

Além disso, o `MainLayout.tsx` tem um `setInterval` de 2s que reseta `body.style.overflow` quando não detecta chat ou dialog aberto, o que pode causar race conditions com o lock do Radix Dialog.

## Alterações

### 1. Remover SmoothScroll completamente

**`src/components/layout/SmoothScroll.tsx`** --- Deletar o arquivo.

**`src/App.tsx`** (linhas 26, 972-974):
- Remover `import SmoothScroll from "@/components/layout/SmoothScroll";`
- Substituir `<SmoothScroll><AppContent /></SmoothScroll>` por apenas `<AppContent />`

**`package.json`** (linha 89):
- Remover `"lenis": "^1.3.17"` das dependências.

### 2. Manter CSS `scroll-behavior: smooth` nativo

O `src/index.css` já tem `html { scroll-behavior: smooth; }` (linha 691). Será mantido.

### 3. Remover failsafe de overflow do MainLayout

**`src/components/MainLayout.tsx`** (linhas 48-65):
- Remover o `useEffect` com `setInterval` que reseta `body.style.overflow`. Esse script causa race conditions com o Radix Dialog que usa `data-scroll-locked` no `<html>` para gerenciar scroll lock. O Radix Dialog já cuida do bloqueio de scroll do body nativamente.

### 4. Garantir isolamento de scroll no `DialogContent`

**`src/components/ui/dialog.tsx`** --- Já tem `overscroll-contain`, `max-h-[85vh]`, e `overflow-y-auto`. Está correto. O problema era o Lenis, não o componente em si.

## Resultado esperado

- Todos os modais (edição de usuário, convite, detalhes, etc.) scrollam internamente sem mover o fundo.
- A página principal usa scroll nativo do navegador com `scroll-behavior: smooth` para âncoras.
- Nenhuma biblioteca externa de scroll interferindo com componentes Radix.

