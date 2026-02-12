

## Corrigir erro "useUnifiedTour must be used within UnifiedTourProvider"

### Causa

Ao substituir o header manual do `DemoLayout` pelo `AppHeader`, introduzimos uma dependencia no hook `useUnifiedTour`. Esse hook exige que o componente esteja dentro de um `UnifiedTourProvider`, que existe no `MainLayout` mas nao no `DemoLayout`.

### Correcao

**Arquivo: `src/components/DemoLayout.tsx`**

Envolver o conteudo do `DemoLayout` com `UnifiedTourProvider` (e `TutorialProvider`, que tambem e usado pelo `AppHeader`), espelhando a estrutura do `MainLayout`.

```tsx
import { UnifiedTourProvider } from "@/contexts/UnifiedTourContext";
import { TutorialProvider } from "@/contexts/TutorialContext";

export function DemoLayout() {
  return (
    <DemoDataSeeder>
      <TutorialProvider>
        <UnifiedTourProvider>
          <SidebarProvider defaultOpen={true}>
            {/* ... conteudo existente ... */}
          </SidebarProvider>
        </UnifiedTourProvider>
      </TutorialProvider>
    </DemoDataSeeder>
  );
}
```

Nenhum outro arquivo precisa ser alterado. Apenas a adicao dos dois providers resolve o crash.

