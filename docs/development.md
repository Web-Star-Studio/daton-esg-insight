# Guia de Desenvolvimento - Daton ESG Insight

## Configuração do Ambiente

### Requisitos

- Node.js 20+
- npm 10+
- Git

### Setup Inicial

```bash
# Clonar repositório
git clone <repo_url>
cd daton-esg-insight

# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://dqlvioijqzlvnvvajmft.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=dqlvioijqzlvnvvajmft
VITE_IOT_WEBSOCKET_URL=ws://localhost:3001/iot (opcional)
```

---

## Estrutura de Pastas

```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/           # Componentes base (shadcn)
│   ├── forms/        # Componentes de formulário
│   └── [modulo]/     # Componentes por módulo
├── pages/            # Páginas (1 arquivo = 1 rota)
├── services/         # Chamadas de API
├── hooks/            # Custom hooks
├── contexts/         # React Context
├── utils/            # Funções utilitárias
├── types/            # Tipos TypeScript
├── constants/        # Constantes
└── schemas/          # Zod schemas
```

---

## Scripts NPM

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor desenvolvimento |
| `npm run build` | Build produção |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run test:ui` | Vitest UI |
| `npm run test:coverage` | Cobertura de testes |

---

## Padrões de Código

### Componentes React

```typescript
// Estrutura padrão
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onAction}>Ação</Button>
    </div>
  );
}
```

### Hooks com TanStack Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getItems, createItem } from '@/services/items';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: getItems,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
```

### Serviços (API Layer)

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createItem(item: CreateItemInput) {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

---

## Design System

### Tokens de Cor (Usar Apenas)

```tsx
// ✅ Correto - usar tokens semânticos
<div className="bg-primary text-primary-foreground">
<div className="bg-success/10 text-success">
<div className="bg-warning text-warning-foreground">

// ❌ Errado - cores hardcoded
<div className="bg-green-500 text-white">
<div className="bg-[#00bf63]">
```

### Componentes de Status

```tsx
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Badge } from '@/components/ui/badge';

// Status indicator
<StatusIndicator status="success">Aprovado</StatusIndicator>
<StatusIndicator status="warning">Pendente</StatusIndicator>
<StatusIndicator status="error">Rejeitado</StatusIndicator>

// Badge variants
<Badge variant="success">Ativo</Badge>
<Badge variant="warning-subtle">Em análise</Badge>
<Badge variant="destructive">Cancelado</Badge>
```

### Design Helpers

```typescript
import { getStatusClasses, getPriorityClasses } from '@/utils/designHelpers';

const statusClasses = getStatusClasses('success');
// { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', ... }

const priorityClasses = getPriorityClasses('high');
// 'bg-destructive/10 text-destructive border-destructive/30'
```

---

## Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase (use*) | `useUserData.ts` |
| Serviços | camelCase | `userService.ts` |
| Constantes | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Tipos/Interfaces | PascalCase | `UserProfile` |

---

## Git Workflow

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/*` - Novas features
- `fix/*` - Bug fixes
- `hotfix/*` - Correções urgentes

### Commit Messages

**Formato:** `type(scope): descrição`

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas gerais

**Exemplos:**
```
feat(emissions): adicionar cálculo de escopo 3
fix(auth): corrigir logout em mobile
docs(readme): atualizar instruções de setup
```

### Pull Request Checklist

- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Tipos TypeScript corretos
- [ ] Sem erros de lint
- [ ] Build passa sem erros
- [ ] Documentação atualizada (se necessário)

---

## Debugging

### Console Logs (Dev Only)

```typescript
import { logger } from '@/utils/logger';

logger.info('Ação executada', { userId, action });
logger.error('Erro ao salvar', error);
logger.debug('Debug info', data); // Apenas em dev
```

### React Query DevTools

- Abre automaticamente em desenvolvimento
- Inspecionar cache, queries, mutations

### Performance

- Chrome DevTools > Performance
- Ver `performanceMonitor.ts` para métricas

---

## Testes

### Estrutura

```
src/test/
├── setup.ts                   # Configuração global
├── components/                # Testes de componentes
├── hooks/                     # Testes de hooks
├── services/                  # Testes de serviços
└── utils/                     # Testes de utilidades
```

### Exemplo de Teste

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('deve renderizar o título', () => {
    render(<MyComponent title="Teste" />);
    expect(screen.getByText('Teste')).toBeInTheDocument();
  });
});
```

---

## Recursos Adicionais

- [React Docs](https://react.dev)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)
- [Guia de Arquitetura](./architecture.md)
- [Guia de Operações](./operations.md)
