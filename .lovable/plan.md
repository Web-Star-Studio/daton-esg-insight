
# Corrigir Popover (datas, combobox, listas) não abrindo dentro de Dialogs

## Problema
Mesmo problema do Select corrigido anteriormente: o `PopoverContent` usa `z-[200]`, mas o Dialog usa `z-[1200]`/`z-[1201]`. Todos os componentes que usam Popover (DatePicker, Combobox de categorias, seletor de filiais) ficam escondidos atrás do modal.

## Solução
Aumentar o `z-index` do `PopoverContent` em `src/components/ui/popover.tsx` de `z-[200]` para `z-[1300]`.

## Alteração

**Arquivo:** `src/components/ui/popover.tsx` — trocar `z-[200]` por `z-[1300]` na classe do `PopoverContent`.
