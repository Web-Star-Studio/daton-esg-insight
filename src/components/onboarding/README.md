# Sistema de Onboarding

## 📋 Visão Geral

O sistema de onboarding da plataforma Daton guia novos usuários através de um processo intuitivo de configuração inicial, personalizando a experiência com base no perfil da empresa.

## 🎯 Fluxo do Onboarding

### Etapas

1. **Boas-vindas** (Welcome Step)
   - Introdução à plataforma
   - Opção de configurar perfil da empresa (opcional)
   - Possibilidade de pular onboarding

2. **Seleção de Módulos** (Module Selection)
   - Pré-seleção inteligente baseada no perfil da empresa
   - Seleção manual de módulos adicionais
   - Filtros por categoria

3. **Configuração** (Configuration)
   - Configuração detalhada de cada módulo selecionado
   - Ativação de recursos específicos
   - Opção de "Configuração Rápida"

4. **Finalização** (Completion)
   - Resumo das configurações
   - Opções: Acessar Plataforma ou Fazer Tour Guiado

## 🏗️ Arquitetura

### Componentes Principais

- **`CleanOnboardingMain.tsx`**: Componente principal que orquestra todo o fluxo
- **`OnboardingFlowContext.tsx`**: Context que gerencia o estado global do onboarding
- **`CleanWelcomeStep.tsx`**: Step de boas-vindas
- **`CleanModuleSelectionStep.tsx`**: Seleção de módulos
- **`CleanDataCreationStep.tsx`**: Configuração de módulos
- **`CleanCompletionStep.tsx`**: Finalização do onboarding
- **`CompanyProfileWizard.tsx`**: Wizard de perfil da empresa
- **`modulesCatalog.ts`**: Catálogo de todos os módulos disponíveis

### Persistência de Dados

O onboarding utiliza duas tabelas no Supabase:

1. **`onboarding_selections`**: Armazena seleções e configurações do usuário
2. **`profiles`**: Marca quando o usuário completou o onboarding

**Auto-save**: Todas as mudanças são salvas automaticamente a cada 500ms após alterações.

## 🎨 Pré-seleção Inteligente de Módulos

O sistema recomenda módulos baseado em:

### Por Setor
- **Indústria/Manufatura**: Inventário GEE, Energia, Resíduos, Saúde e Segurança
- **Agronegócio**: Água, Biodiversidade, Resíduos, Inventário GEE
- **Alimentos e Bebidas**: Qualidade, Resíduos, Água, Saúde e Segurança
- **Financeiro**: Riscos ESG, Compliance, Stakeholders, Gestão de Pessoas
- **Serviços**: Gestão de Pessoas, Qualidade, Performance, Stakeholders
- **Tecnologia**: Energia, Resíduos, Inovação, Gestão de Pessoas

### Por Objetivos de Negócio
- **Redução de Emissões** → Inventário GEE, Energia
- **Conformidade Ambiental** → Licenças Ambientais, Compliance
- **Saúde e Segurança** → Módulo de Saúde e Segurança
- **Gestão de Água** → Módulo de Água
- **Redução de Resíduos** → Resíduos, Economia Circular
- **Qualidade** → Módulo de Qualidade
- **Performance** → Performance, Análise de Dados

### Por Tamanho da Empresa
- **Micro/Pequena**: Máximo 4 módulos recomendados
- **Média/Grande**: Até 8 módulos recomendados

## 📝 Como Adicionar um Novo Módulo

### 1. Adicionar ao Catálogo
Editar `src/components/onboarding/modulesCatalog.ts`:

```typescript
import { NovoIcone } from "lucide-react";

export const MODULES: Module[] = [
  // ... módulos existentes
  { 
    id: 'novo_modulo', 
    name: 'Nome do Novo Módulo', 
    icon: NovoIcone, 
    category: 'Categoria' 
  },
];
```

### 2. Adicionar Opções de Configuração
Editar `src/components/onboarding/CleanDataCreationStep.tsx`:

```typescript
const CONFIGURATION_OPTIONS: Record<string, Array<{ key: string; label: string }>> = {
  // ... configurações existentes
  novo_modulo: [
    { key: 'opcao_1', label: 'Descrição da Opção 1' },
    { key: 'opcao_2', label: 'Descrição da Opção 2' },
  ]
};
```

### 3. Adicionar à Lógica de Recomendação (opcional)
Editar `src/components/onboarding/CompanyProfileWizard.tsx`:

```typescript
function getRecommendedModules(profile: CompanyProfile): string[] {
  const sectorMap: Record<string, string[]> = {
    'setor_especifico': ['novo_modulo', 'outro_modulo'],
    // ...
  };
  
  // Adicionar lógica por objetivo
  profile.goals.forEach(goal => {
    switch (goal) {
      case 'objetivo_relacionado':
        recommendations.push('novo_modulo');
        break;
    }
  });
}
```

## 🔧 Validação e Tratamento de Erros

### Validação do Catálogo
A função `validateModuleCatalog()` verifica:
- ✅ Todos os módulos têm `id`, `name`, `icon` e `category`
- ✅ Ícones são componentes React válidos
- ✅ Não há duplicatas de IDs

### Tratamento de Módulos Inválidos
- Módulos inválidos são filtrados automaticamente
- Console warnings são emitidos para debugging
- UI continua funcionando normalmente

## 🚀 Estados e Fluxo de Navegação

### Estados do Context

```typescript
interface OnboardingFlowState {
  currentStep: number;        // 0-3
  totalSteps: number;         // 4
  selectedModules: string[];  // IDs dos módulos
  moduleConfigurations: {...};
  isCompleted: boolean;
  isLoading: boolean;
}
```

### Ações Disponíveis
- `nextStep()`: Avança para próximo step
- `prevStep()`: Volta para step anterior
- `setSelectedModules(modules)`: Define módulos selecionados
- `updateModuleConfiguration(moduleId, config)`: Atualiza configuração
- `completeOnboarding()`: Finaliza onboarding
- `restartOnboarding()`: Reinicia do zero

## 🔒 Segurança

### RLS (Row Level Security)
Todas as queries utilizam políticas RLS do Supabase:
- Usuários só podem ver/editar seus próprios dados de onboarding
- Validação de `company_id` e `user_id` em todas as operações

### Prevenção de Loops
- `OnboardingRedirectHandler` usa state para prevenir loops de redirect
- Verificação dupla: `profiles.has_completed_onboarding` e `onboarding_selections.is_completed`

## 📊 Métricas e Logging

Todos os passos importantes são logados no console:
- 🔄 Carregamento de dados
- 💾 Auto-save
- ✅ Seleções confirmadas
- 🎯 Módulos recomendados
- 🚀 Finalização do onboarding

## 🐛 Troubleshooting

### Problema: Onboarding não salva
**Solução**: Verificar se usuário tem `company_id` válido

### Problema: Módulos não aparecem
**Solução**: Rodar `validateModuleCatalog()` no console para verificar erros

### Problema: Redirecionamento em loop
**Solução**: Limpar localStorage e database:
```javascript
localStorage.removeItem('daton_onboarding_progress');
// Resetar no banco: is_completed = false
```

### Problema: Ícones não renderizam
**Solução**: Verificar imports no `modulesCatalog.ts`

## 📚 Recursos Adicionais

- [Lucide Icons](https://lucide.dev) - Biblioteca de ícones utilizada
- [Supabase Docs](https://supabase.com/docs) - Documentação do backend
- [React Context](https://react.dev/reference/react/useContext) - State management

## 🎨 Design System

O onboarding segue o design system da plataforma:
- Usa tokens semânticos de cores (primary, muted, accent, etc.)
- Animações suaves com `animate-fade-in` e `animate-scale-in`
- Responsivo e acessível
- Progress indicators consistentes em todos os steps
