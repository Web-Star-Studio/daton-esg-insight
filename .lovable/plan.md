

## Corrigir Erro "useUnifiedTour must be used within UnifiedTourProvider" no Onboarding

### Problema
Apos o registro, o usuario e redirecionado para `/onboarding`, que renderiza `CleanOnboardingMain`. Esse componente chama `useUnifiedTour()`, mas a rota `/onboarding` nao esta envolvida por nenhum `UnifiedTourProvider`. O provider so existe dentro de `MainLayout` e `DemoLayout`, que nao sao usados na rota de onboarding.

### Solucao
Envolver o conteudo do `OnboardingRoute` com os providers necessarios: `TutorialProvider` e `UnifiedTourProvider`.

### Alteracao

**Arquivo: `src/routes/onboarding.tsx`**
- Importar `UnifiedTourProvider` e `TutorialProvider`
- Envolver o `<CleanOnboardingMain />` com ambos os providers

O resultado sera:
```tsx
import { TutorialProvider } from '@/contexts/TutorialContext';
import { UnifiedTourProvider } from '@/contexts/UnifiedTourContext';

// ... dentro do render:
return (
  <TutorialProvider>
    <UnifiedTourProvider>
      <CleanOnboardingMain />
    </UnifiedTourProvider>
  </TutorialProvider>
);
```

Apenas 1 arquivo editado, sem impacto em nenhuma outra rota.
