
# Fase 2 - Continuação: Migração de console.logs e Correção de Types

## Resumo do Estado Atual

**Concluído (Sprint 1 - Parte 1):**
- ✅ Logger aprimorado com categorias: `emission`, `training`, `supplier`, `document`, `gri`, `audit`, `compliance`, `quality`, `notification`, `import`
- ✅ Métodos `perf()`, `trace()`, `startTimer()` adicionados
- ✅ Arquivos de tipos criados: `src/types/api.ts`, `src/types/supabase-helpers.ts`
- ✅ 6 services migrados (legislationImport, unifiedFactorImport, documentExtraction, griIndicators, emissions, notificationTriggers)

**Pendente:**
| Item | Quantidade | Status |
|------|------------|--------|
| Services com console.log | 99 arquivos, ~3.000 ocorrências | ❌ |
| Hooks com console.log | 27 arquivos, ~593 ocorrências | ❌ |
| Types `any` em hooks | 161+ ocorrências | ❌ |
| Types `any` em services | 1.199+ ocorrências | ❌ |

---

## Parte 1: Continuar Migração de Services (Batch 1 - Alta Prioridade)

### Arquivos a Migrar (20 services críticos)

| Arquivo | Logs | Categoria Logger |
|---------|------|------------------|
| `trainingStatuses.ts` | 3 | `training` |
| `extractionApprovalLog.ts` | 1 | `document` |
| `documentApprovalLog.ts` | 1 | `document` |
| `emissionFactors.ts` | 15 | `emission` |
| `ghgProtocol2025Factors.ts` | 10 | `emission` |
| `organizationalStructure.ts` | 4 | `service` |
| `efficacyEvaluationDashboard.ts` | 2 | `training` |
| `calibrationManagement.ts` | N/A | `quality` |
| `equipmentMaintenance.ts` | N/A | `quality` |
| `gedDocuments.ts` | N/A | `document` |
| `advancedAnalytics.ts` | N/A | `api` |
| `wasteManagement.ts` | N/A | `emission` |
| `waterManagement.ts` | N/A | `emission` |
| `energyManagement.ts` | N/A | `emission` |
| `licenses.ts` | N/A | `compliance` |
| `safetyIncidents.ts` | N/A | `quality` |
| `supplierService.ts` | N/A | `supplier` |
| `recruitment.ts` | N/A | `service` |
| `knowledgeBase.ts` | N/A | `service` |
| `marketplace.ts` | N/A | `service` |

### Padrão de Migração

```typescript
// ANTES:
console.log('📤 Processing data:', data);
console.error('Error:', error);
console.warn('Warning message');

// DEPOIS:
import { logger } from '@/utils/logger';

logger.debug('Processing data', 'emission', { data });
logger.error('Error processing', error, 'emission');
logger.warn('Warning message', 'emission');
```

---

## Parte 2: Migrar Hooks (27 arquivos)

### Hooks Prioritários

| Arquivo | Logs | Correção |
|---------|------|----------|
| `useAuthCheck.ts` | 1 | `console.error` → `logger.error('auth')` |
| `useNotifications.tsx` | 3 | `console.error` → `logger.error('notification')` |
| `useIntelligentCache.ts` | 7 | `console.log/warn` → `logger.debug/warn('service')` |
| `useChatAssistant.tsx` | 4 | `console.log/error` → `logger.debug/error('api')` |
| `useGRIAutoSave.ts` | 5 | `console.log/error` → `logger.debug/error('gri')` |
| `useContextualAI.ts` | 1 | `console.error` → `logger.error('api')` |
| `audit/useExecution.ts` | 9 | `console.error` → `logger.error('audit')` |
| `useEmployeeCodeValidation.ts` | 1 | `console.error` → `logger.error('service')` |

---

## Parte 3: Correção de Types `any` (Início do Sprint 2)

### 3.1 Hooks - Tipos a Corrigir

**`useAuthCheck.ts`** (2 any types):
```typescript
// ANTES:
user: any;
profile: any;

// DEPOIS:
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/supabase-helpers';

interface AuthStatus {
  user: User | null;
  profile: UserProfile | null;
}
```

**`useNotifications.tsx`** (2 any types):
```typescript
// ANTES:
metadata?: any;
.from('notifications' as any)
.filter((n: any) => !n.is_read)

// DEPOIS:
interface NotificationMetadata {
  source?: string;
  priority?: number;
  [key: string]: unknown;
}

metadata?: NotificationMetadata;
// Remover "as any" usando tipo correto do Supabase
```

**`useIntelligentCache.ts`** (3 any types):
```typescript
// ANTES:
data: any;
fetchFn: (key: string) => Promise<any>

// DEPOIS:
interface CacheEntry<T = unknown> {
  data: T;
  // ...
}
fetchFn: <T>(key: string) => Promise<T>
```

### 3.2 Services - Tipos a Corrigir (Alta Prioridade)

**`emissionFactors.ts`**:
```typescript
// ANTES:
details_json?: any;

// DEPOIS:
interface EmissionFactorDetails {
  biogenic_fraction?: number;
  density?: number;
  calorific_value?: number;
  [key: string]: number | string | boolean | undefined;
}
details_json?: EmissionFactorDetails;
```

**`organizationalStructure.ts`**:
```typescript
// ANTES:
return (data as any) || [];

// DEPOIS:
// Criar interface Department/Position tipada
return (data || []) as Department[];
```

---

## Arquivos a Criar

| Arquivo | Propósito |
|---------|-----------|
| `src/types/entities/notification.ts` | Interface NotificationMetadata |
| `src/types/entities/emission.ts` | Interface EmissionFactorDetails |
| `src/types/entities/organization.ts` | Interfaces Department, Position |

## Arquivos a Modificar

### Batch 1 - Services (20 arquivos)
- `trainingStatuses.ts`
- `extractionApprovalLog.ts`
- `documentApprovalLog.ts`
- `emissionFactors.ts`
- `ghgProtocol2025Factors.ts`
- `organizationalStructure.ts`
- `efficacyEvaluationDashboard.ts`
- `wasteManagement.ts`
- `waterManagement.ts`
- `energyManagement.ts`
- `licenses.ts`
- `safetyIncidents.ts`
- `supplierService.ts`
- `recruitment.ts`
- `knowledgeBase.ts`
- `marketplace.ts`
- `calibrationManagement.ts`
- `equipmentMaintenance.ts`
- `gedDocuments.ts`
- `advancedAnalytics.ts`

### Batch 2 - Hooks (8 arquivos prioritários)
- `useAuthCheck.ts`
- `useNotifications.tsx`
- `useIntelligentCache.ts`
- `useChatAssistant.tsx`
- `useGRIAutoSave.ts`
- `useContextualAI.ts`
- `audit/useExecution.ts`
- `useEmployeeCodeValidation.ts`

---

## Ordem de Execução

1. **Migrar 20 services** para logger centralizado
2. **Migrar 8 hooks prioritários** para logger
3. **Criar arquivos de tipos** para entidades
4. **Corrigir types `any`** nos 8 hooks prioritários
5. **Corrigir types `any`** nos 20 services do Batch 1

---

## Métricas de Sucesso para Este Batch

| Métrica | Antes | Depois |
|---------|-------|--------|
| Services migrados | 6 | 26 |
| Hooks migrados | 0 | 8 |
| `any` types corrigidos | 0 | ~50 |
| Console logs restantes | ~3.600 | ~2.800 |
