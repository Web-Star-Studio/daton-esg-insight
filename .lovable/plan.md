
## Fix: First Tab Label Cut Off in /configuracao-organizacional

### Problem
The first tab "Informacoes Basicas" is displaying only the letter "s" on mobile. The remaining tabs ("Estrutura Organizacional", "Escopo de Relato", "Dados Financeiros") appear fine. This is caused by the `TabsList` having `w-full` which constrains maximum width to the container, but the combined tab widths exceed that space. Even though `shrink-0` is set, the `w-full` constraint can cause clipping of the first element before the scroll position.

### Solution
Replace `flex w-full overflow-x-auto` with `flex overflow-x-auto w-max min-w-full` on the `TabsList`. This ensures the tab list takes the natural width of its children (allowing horizontal scroll) while having a minimum of the container width.

### Technical Details

**File: `src/pages/ConfiguracaoOrganizacional.tsx` (line 203)**

Change:
```tsx
<TabsList className="flex w-full overflow-x-auto">
```
To:
```tsx
<TabsList className="flex overflow-x-auto w-max min-w-full">
```

This single-line change ensures:
- `w-max`: The list takes the intrinsic width of all tabs combined, preventing compression
- `min-w-full`: Ensures the list is at least as wide as the container when tabs fit
- `overflow-x-auto`: Enables horizontal scrolling when tabs exceed container width
