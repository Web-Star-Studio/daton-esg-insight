

# Corrigir Dropdown "Papel no Sistema" não abrindo dentro do Dialog

## Problema
O `SelectContent` usa `z-[200]` (definido em `src/components/ui/select.tsx`), mas o `DialogOverlay` usa `z-[1200]` e o `DialogContent` usa `z-[1201]`. Como o Select renderiza via Portal na raiz do DOM, o dropdown fica **atrás** do overlay do dialog, invisível ao usuário.

## Solução
Aumentar o `z-index` do `SelectContent` para `z-[1300]`, garantindo que fique acima do dialog quando aberto dentro de modais.

## Alteração

**Arquivo:** `src/components/ui/select.tsx`

Na classe do `SelectPrimitive.Content` (linha ~72), trocar `z-[200]` por `z-[1300]`.

