

# Correção de z-index inconsistentes nos componentes UI

## Problema
Vários componentes Portal/overlay usam `z-50` (z-index: 50), que fica **abaixo** do `DialogOverlay` (`z-[1200]`) e `DialogContent` (`z-[1201]`). Isso significa que quando esses componentes são usados **dentro de modais**, ficam escondidos atrás do overlay — exatamente o bug do dropdown de departamento.

Apenas `SelectContent` e `PopoverContent` foram corrigidos para `z-[1300]`. Os demais continuam com `z-50`.

## Componentes afetados

| Componente | Arquivo | z-index atual | Usado em modais? |
|---|---|---|---|
| `DropdownMenuContent` | dropdown-menu.tsx | z-50 | Sim (ações em formulários) |
| `DropdownMenuSubContent` | dropdown-menu.tsx | z-50 | Sim |
| `TooltipContent` | tooltip.tsx | z-50 | Sim |
| `ContextMenuContent` | context-menu.tsx | z-50 | Possível |
| `ContextMenuSubContent` | context-menu.tsx | z-50 | Possível |
| `HoverCardContent` | hover-card.tsx | z-50 | Possível |
| `MenubarContent` | menubar.tsx | z-50 | Possível |
| `MenubarSubContent` | menubar.tsx | z-50 | Possível |
| `DrawerOverlay` | drawer.tsx | z-50 | N/A (é modal) |
| `DrawerContent` | drawer.tsx | z-50 | N/A (é modal) |
| `ToastViewport` | toast.tsx | z-[100] | Deve ficar acima de tudo |

## Correções

1. **dropdown-menu.tsx** — `DropdownMenuSubContent` e `DropdownMenuContent`: `z-50` → `z-[1300]`
2. **tooltip.tsx** — `TooltipContent`: `z-50` → `z-[1300]`
3. **context-menu.tsx** — ambos Content: `z-50` → `z-[1300]`
4. **hover-card.tsx** — `HoverCardContent`: `z-50` → `z-[1300]`
5. **menubar.tsx** — ambos Content: `z-50` → `z-[1300]`
6. **drawer.tsx** — Overlay e Content: `z-50` → `z-[1200]` e `z-[1201]` (mesmo nível que Dialog, pois Drawer é modal)
7. **toast.tsx** — `ToastViewport`: `z-[100]` → `z-[1400]` (toasts devem ficar acima de qualquer modal)

Isso garante que **qualquer componente Portal renderizado dentro de um modal** aparecerá corretamente sobre ele.

