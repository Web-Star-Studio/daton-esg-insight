
# Fase 2: Migração para Logger Centralizado e Correção de Types

## Resumo do Escopo

| Área | Quantidade | Prioridade |
|------|------------|------------|
| console.log em services/ | 3.391 ocorrências (104 arquivos) | ALTA |
| console.log em hooks/ | ~200 ocorrências (15 arquivos) | ALTA |
| console.log em components/ | ~1.500 ocorrências (~100 arquivos) | MÉDIA |
| `any` types em services/ | 1.199 ocorrências (91 arquivos) | ALTA |
| `any` types em hooks/ | 161 ocorrências (15 arquivos) | ALTA |
| Componentes desorganizados | 424 arquivos na raiz | MÉDIA |

---

## Parte 1: Migração Console.log para Logger

### 1.1 Aprimorar o Logger Centralizado

O logger atual em `src/utils/logger.ts` já está funcional, mas precisa de melhorias:

```typescript
// Adicionar novas categorias específicas
type LogCategory = 
  | 'auth' | 'api' | 'ui' | 'database' | 'service' | 'general'
  | 'emission' | 'training' | 'supplier' | 'document' | 'gri';

// Adicionar log de performance
perf(operation: string, duration: number) { ... }

// Adicionar log estruturado para debugging
trace(message: string, data: object) { ... }
```

### 1.2 Padrões de Migração

**Serviços (Prioridade Alta - 104 arquivos)**

Padrão atual problemático:
```typescript
console.log('📤 Uploading file:', file.name);
console.error('Error fetching data:', error);
```

Padrão corrigido:
```typescript
import { logger } from '@/utils/logger';

logger.debug('Uploading file', 'service', { fileName: file.name });
logger.error('Error fetching data', error, 'database');
```

**Arquivos prioritários para migração:**

| Arquivo | Logs | Categoria |
|---------|------|-----------|
| `src/services/legislationImport.ts` | 15+ | `service` |
| `src/services/unifiedFactorImport.ts` | 20+ | `service` |
| `src/services/documentExtraction.ts` | 10+ | `document` |
| `src/services/griIndicators.ts` | 15+ | `gri` |
| `src/services/emissions.ts` | 12+ | `emission` |
| `src/services/notificationTriggers.ts` | 8+ | `service` |

### 1.3 Script de Migração Automatizada

Criar um script de migração:
```typescript
// scripts/migrate-console-to-logger.ts
// Padrões de substituição:
// console.log('message') → logger.debug('message', 'general')
// console.error('message', error) → logger.error('message', error, 'general')
// console.warn('message') → logger.warn('message', 'general')
```

---

## Parte 2: Correção de Tipos `any`

### 2.1 Priorização por Impacto

**Tier 1 - Crítico (Corrigir primeiro)**
- Catch blocks com `error: any` → usar `unknown` + type guards
- Callbacks de API com `data: any` → criar interfaces tipadas
- Props de componentes com `any` → definir interfaces

**Tier 2 - Alto Impacto**
- Retornos de hooks com `any` → tipar corretamente
- Parâmetros de funções utilitárias → usar generics

**Tier 3 - Manutenção**
- Tipos internos de objetos temporários
- Tipos de bibliotecas externas

### 2.2 Interfaces Comuns a Criar

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
}

// src/types/supabase-helpers.ts
export interface SupabaseError {
  message: string;
  code: string;
  details?: string;
}

// src/types/common.ts
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}
```

### 2.3 Arquivos Prioritários para Refatoração

**Hooks (15 arquivos - 161 any types)**

| Arquivo | Any Types | Correção |
|---------|-----------|----------|
| `useAuthCheck.ts` | `user: any, profile: any` | Importar tipos do Supabase |
| `useNotifications.tsx` | `metadata?: any` | Criar interface NotificationMetadata |
| `useIntelligentCache.ts` | `data: any` | Usar generics `<T>` |
| `useChatAssistant.tsx` | 10+ any | Criar interfaces de AI Response |

**Services (91 arquivos - 1.199 any types)**

| Arquivo | Any Types | Correção |
|---------|-----------|----------|
| `calibrationManagement.ts` | `tolerance_range: any` | Interface ToleranceRange |
| `equipmentMaintenance.ts` | `parts_replaced: any[]` | Interface MaintenancePart[] |
| `gedDocuments.ts` | `steps: any` | Interface WorkflowStep[] |
| `advancedAnalytics.ts` | `emissionData: any[]` | Interface EmissionDataPoint[] |

### 2.4 Type Guards Utilities

Expandir `src/utils/typeGuards.ts`:
```typescript
export function isSupabaseError(error: unknown): error is SupabaseError {
  return isObject(error) && 'message' in error && 'code' in error;
}

export function isApiResponse<T>(
  response: unknown, 
  validator: (data: unknown) => data is T
): response is ApiResponse<T> {
  return isObject(response) && 'data' in response;
}
```

---

## Parte 3: Reorganização de Componentes

### 3.1 Estrutura Proposta

```text
src/components/
├── common/                    # Componentes reutilizáveis genéricos
│   ├── EmptyState.tsx
│   ├── LoadingFallback.tsx
│   ├── ErrorBoundary.tsx
│   └── FilterBar.tsx
│
├── features/                  # Componentes por domínio
│   ├── emissions/            # Todos os 50+ componentes de emissões
│   │   ├── StationaryCombustionModal.tsx
│   │   ├── MobileCombustionModal.tsx
│   │   ├── FugitiveEmissionsModal.tsx
│   │   └── index.ts
│   │
│   ├── training/             # Componentes de treinamento
│   │   ├── TrainingCalendar.tsx
│   │   ├── TrainingProgramModal.tsx
│   │   └── index.ts
│   │
│   ├── suppliers/            # Componentes de fornecedores
│   ├── documents/            # Componentes de documentos
│   ├── gri/                  # (já organizado)
│   ├── governance/           # (já organizado)
│   └── ...
│
├── layout/                    # (já organizado)
└── ui/                        # (já organizado - shadcn)
```

### 3.2 Componentes a Mover (Por Domínio)

| Domínio | Componentes na Raiz | Destino |
|---------|---------------------|---------|
| Emissions | ~25 arquivos (Modal, Chart, etc) | `features/emissions/` |
| Training | ~20 arquivos | `features/training/` |
| Suppliers | ~15 arquivos | `features/suppliers/` |
| Documents | ~15 arquivos | `features/documents/` |
| Quality | ~20 arquivos | `features/quality/` |
| HR/Employees | ~15 arquivos | `features/employees/` |
| AI/Analytics | ~10 arquivos | `features/ai/` |

### 3.3 Barrel Exports

Criar `index.ts` em cada diretório:
```typescript
// src/components/features/emissions/index.ts
export { StationaryCombustionModal } from './StationaryCombustionModal';
export { MobileCombustionModal } from './MobileCombustionModal';
export { FugitiveEmissionsModal } from './FugitiveEmissionsModal';
// ...
```

---

## Plano de Execução

### Sprint 1: Logger Migration (Semana 1-2)

**Dias 1-2**: Aprimorar logger.ts
- Adicionar novas categorias
- Adicionar método `perf()` e `trace()`
- Criar helper de migração

**Dias 3-5**: Migrar services/ (104 arquivos)
- Priorizar arquivos críticos primeiro
- Manter padrão consistente

**Dias 6-7**: Migrar hooks/ (15 arquivos)

**Dias 8-10**: Migrar components/ (batch de 50 por dia)

### Sprint 2: Type Safety (Semana 3-4)

**Dias 1-3**: Criar interfaces base
- `src/types/api.ts`
- `src/types/entities/`
- Expandir type guards

**Dias 4-7**: Refatorar hooks/ (15 arquivos)
- Foco em hooks críticos primeiro

**Dias 8-14**: Refatorar services/ (91 arquivos)
- Processar 10-15 arquivos por dia
- Priorizar por uso

### Sprint 3: Component Reorganization (Semana 5-6)

**Dias 1-3**: Criar estrutura de diretórios
- Criar pastas em `features/`
- Criar barrel exports

**Dias 4-10**: Mover componentes
- Mover por domínio
- Atualizar imports
- Testar build a cada batch

**Dias 11-14**: Limpeza final
- Remover arquivos vazios
- Atualizar documentação
- Validar build final

---

## Métricas de Sucesso

| Métrica | Antes | Meta Sprint 1 | Meta Sprint 2 | Meta Final |
|---------|-------|---------------|---------------|------------|
| Console logs | ~5.000 | 0 | 0 | 0 |
| `any` types | ~8.000 | ~7.500 | ~500 | <100 |
| Componentes na raiz | 424 | 424 | 424 | <50 |
| Build warnings | ~200 | ~150 | ~50 | <10 |

---

## Arquivos a Criar

| Arquivo | Propósito |
|---------|-----------|
| `src/types/api.ts` | Interfaces de API genéricas |
| `src/types/entities/index.ts` | Export central de entidades |
| `src/types/supabase-helpers.ts` | Helpers para tipos Supabase |
| `src/components/features/*/index.ts` | Barrel exports por domínio |

## Arquivos a Modificar (Principais)

| Categoria | Quantidade | Alteração |
|-----------|------------|-----------|
| Services | 104 | Migrar console → logger |
| Hooks | 15 | Migrar console + fix any |
| Components | ~150 | Migrar console |
| Components | ~300 | Mover para features/ |

---

## Notas Técnicas

### Ordem de Execução Recomendada

1. **Logger primeiro** - permite que outras mudanças usem o novo padrão
2. **Types depois** - melhora a qualidade do código migrado
3. **Reorganização por último** - não quebra funcionalidade existente

### Rollback Strategy

- Commits atômicos por arquivo/módulo
- Feature branch separada para reorganização
- Build CI/CD em cada PR

### Compatibilidade

- Manter exports em locais antigos temporariamente (re-exports)
- Deprecar gradualmente imports diretos
- Usar path aliases consistentes
