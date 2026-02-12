

## Onboarding obrigatorio antes do demo + detalhes do usuario no painel admin

### Problema atual

1. **Redirecionamento pos-onboarding**: `CleanOnboardingMain` sempre redireciona para `/dashboard` apos concluir. Embora o `ProtectedRoute` eventualmente redirecione usuarios nao aprovados para `/demo`, isso causa um flash de redirect desnecessario.

2. **Sem pagina de detalhes do usuario**: O painel de platform admin (`PlatformUsersTable`) mostra apenas a listagem basica. Nao ha como ver os dados de onboarding (modulos selecionados, perfil da empresa, configuracoes) que o usuario preencheu.

### Solucao

#### 1. Corrigir redirecionamento pos-onboarding

**Arquivo: `src/components/onboarding/CleanOnboardingMain.tsx`**

Alterar `handleStartUsingPlatform`, `handleSkipOnboarding` e `handleEmergencyComplete` para verificar `isApproved` do `useAuth()` e redirecionar para `/demo` quando o usuario nao esta aprovado, em vez de sempre ir para `/dashboard`.

```
const destination = isApproved ? '/dashboard' : '/demo';
navigate(destination, { replace: true });
```

Pontos de alteracao:
- Linha 105: `handleSkipOnboarding` - trocar `navigate('/dashboard')` por logica condicional
- Linha 152: `handleStartUsingPlatform` - trocar `navigate('/dashboard', ...)` por logica condicional
- Linha 293: `handleEmergencyComplete` - trocar `navigate('/dashboard', ...)` por logica condicional
- Linha 305: fallback de erro - idem

#### 2. Criar modal de detalhes do usuario no painel admin

**Novo arquivo: `src/components/platform/UserDetailsModal.tsx`**

Um Dialog/Sheet que exibe informacoes detalhadas de um usuario selecionado, incluindo:

- **Dados do perfil**: nome, email, cargo, empresa, data de cadastro, status de aprovacao
- **Dados de onboarding** (da tabela `onboarding_selections`):
  - Modulos selecionados (`selected_modules`)
  - Configuracoes de modulos (`module_configurations`)
  - Perfil da empresa informado no onboarding (`company_profile`)
  - Status de conclusao e data (`is_completed`, `completed_at`)
  - Etapa atual do onboarding (`current_step` / `total_steps`)

O modal buscara os dados de `onboarding_selections` via query separada filtrada por `user_id`.

#### 3. Integrar modal na tabela de usuarios

**Arquivo: `src/components/platform/PlatformUsersTable.tsx`**

- Adicionar botao "Ver detalhes" (icone Eye) na coluna de acoes de cada usuario
- Ao clicar, abrir o `UserDetailsModal` passando o `userId`
- O botao ficara ao lado do botao de Aprovar/Revogar existente

### Estrutura dos dados de onboarding exibidos

A tabela `onboarding_selections` ja contem todos os campos necessarios:

| Campo | Descricao | Exibicao |
|---|---|---|
| `selected_modules` | Array de IDs dos modulos escolhidos | Lista com badges |
| `module_configurations` | JSON com configs por modulo | Accordion expandivel |
| `company_profile` | JSON com setor, porte, etc. | Cards informativos |
| `is_completed` | Se finalizou o onboarding | Badge status |
| `completed_at` | Data/hora de conclusao | Data formatada |
| `current_step` | Etapa atual (se nao concluiu) | Progress indicator |

### Arquivos modificados

- `src/components/onboarding/CleanOnboardingMain.tsx` - redirecionar para `/demo` se nao aprovado
- `src/components/platform/UserDetailsModal.tsx` - novo componente de detalhes
- `src/components/platform/PlatformUsersTable.tsx` - integrar botao e modal

