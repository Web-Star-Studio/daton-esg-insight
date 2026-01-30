
# Fase 2 - Continuação: Migração de Console.logs e Correção de Types

## Análise Atual

**Dados coletados:**
- 93 services com console.log/error/warn (2.914 ocorrências)
- 27 hooks com console.log/error/warn (593 ocorrências)
- Arquivos já migrados: 6 services (legislationImport, unifiedFactorImport, documentExtraction, griIndicators, emissions, notificationTriggers, trainingStatuses, emissionFactors, ghgProtocol2025Factors, extractionApprovalLog, documentApprovalLog, efficacyEvaluationDashboard)

---

## Parte 1: Migrar Services - Batch 2 (20 arquivos prioritários)

### Arquivos com console.log a migrar

| Arquivo | Logs | Categoria |
|---------|------|-----------|
| `licenseRenewal.ts` | 3 | `compliance` |
| `conversionFactors.ts` | 6 | `emission` |
| `employees.ts` | 7 | `service` |
| `complianceFrameworks.ts` | 7 | `compliance` |
| `dataExport.ts` | 5 | `service` |
| `organizationalStructure.ts` | 4 | `service` |
| `trainingSchedules.ts` | N/A | `training` |
| `energyManagement.ts` | N/A | `emission` |
| `waterManagement.ts` | N/A | `emission` |
| `wasteManagement.ts` | N/A | `emission` |
| `licenses.ts` | N/A | `compliance` |
| `supplierService.ts` | N/A | `supplier` |
| `safetyIncidents.ts` | N/A | `quality` |
| `calibrationManagement.ts` | N/A | `quality` |
| `equipmentMaintenance.ts` | N/A | `quality` |
| `gedDocuments.ts` | N/A | `document` |
| `advancedAnalytics.ts` | N/A | `api` |
| `knowledgeBase.ts` | N/A | `service` |
| `marketplace.ts` | N/A | `service` |
| `recruitment.ts` | N/A | `service` |

### Padrão de Migração

```typescript
// ANTES:
console.error('Error scheduling renewal:', error);
console.warn('Aviso ao limpar employee_experiences:', e);
console.log('📥 Loading data...');

// DEPOIS:
import { logger } from '@/utils/logger';

logger.error('Error scheduling renewal', error, 'compliance');
logger.warn('Aviso ao limpar employee_experiences', 'service', e);
logger.debug('Loading data', 'service');
```

---

## Parte 2: Migrar Hooks - 8 Arquivos Prioritários

| Arquivo | Logs | Categoria | Alterações |
|---------|------|-----------|------------|
| `useAuthCheck.ts` | 1 | `auth` | console.error → logger.error |
| `useNotifications.tsx` | 3 | `notification` | console.error → logger.error |
| `useIntelligentCache.ts` | 7 | `service` | console.log/warn → logger.debug/warn |
| `useChatAssistant.tsx` | ~15 | `api` | Já parcialmente migrado, completar |
| `useGRIAutoSave.ts` | 5 | `gri` | console.log/error → logger |
| `useContextualAI.ts` | 1 | `api` | console.error → logger.error |
| `audit/useExecution.ts` | 9 | `audit` | console.error → logger.error |
| `useEmployeeCodeValidation.ts` | 1 | `service` | console.error → logger.error |

### Exemplo de Migração (useIntelligentCache.ts)

```typescript
// ANTES (linhas 75, 117, 157, 173, 179, 198, 222):
console.log(`🧹 Cache eviction: removed ${evicted} entries`);
console.log(`💾 Cached "${key}"`);
console.warn(`Failed to prefetch ${key}:`, error);

// DEPOIS:
logger.debug(`Cache eviction: removed ${evicted} entries`, 'service');
logger.debug(`Cached "${key}"`, 'service', { priority, size });
logger.warn(`Failed to prefetch ${key}`, 'service', error);
```

---

## Parte 3: Correção de Types `any` - Início

### 3.1 Hooks a Corrigir

**`useAuthCheck.ts`** (linhas 8-9):
```typescript
// ANTES:
user: any;
profile: any;

// DEPOIS:
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types/supabase-helpers';

user: User | null;
profile: UserProfile | null;
```

**`useContextualAI.ts`** (linhas 13-14, 24-27):
```typescript
// ANTES:
relatedData: any;
currentGoals: any[];
recentActivity: any;

// DEPOIS:
// Criar interface ContextualRelatedData
interface ContextualRelatedData {
  [key: string]: unknown;
}

relatedData: ContextualRelatedData;
currentGoals: Goal[];
recentActivity: RecentActivityMetrics;
```

**`useIntelligentCache.ts`** (linhas 5, 91, 164):
```typescript
// ANTES:
data: any;
data: any;
fetchFn: (key: string) => Promise<any>

// DEPOIS:
// Usar generics
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  // ...
}

setInCache: <T>(key: string, data: T, priority?: Priority) => void;
prefetchData: <T>(keys: string[], fetchFn: (key: string) => Promise<T>) => Promise<void>;
```

### 3.2 Services a Corrigir (Prioridade)

**`organizationalStructure.ts`** (linhas 90, 100, 166, 176, 247, etc.):
```typescript
// ANTES:
return (data as any) || [];

// DEPOIS:
// Usar tipos do Supabase ou interfaces definidas
return (data ?? []) as Department[];
```

**`employees.ts`** (linhas 34, 186, 206):
```typescript
// ANTES:
const sanitizeEmployeeData = (data: Record<string, any>)

// DEPOIS:
type EmployeeFormData = Partial<Employee> & Record<string, unknown>;
const sanitizeEmployeeData = (data: EmployeeFormData)
```

---

## Arquivos a Modificar

### Services (20 arquivos)
1. `licenseRenewal.ts` - 3 console calls
2. `conversionFactors.ts` - 6 console calls
3. `employees.ts` - 7 console calls + 3 any types
4. `complianceFrameworks.ts` - 7 console calls
5. `dataExport.ts` - 5 console calls
6. `organizationalStructure.ts` - 4 console calls + 8 any types
7. `trainingSchedules.ts`
8. `energyManagement.ts`
9. `waterManagement.ts`
10. `wasteManagement.ts`
11. `licenses.ts`
12. `supplierService.ts`
13. `safetyIncidents.ts`
14. `calibrationManagement.ts`
15. `equipmentMaintenance.ts`
16. `gedDocuments.ts`
17. `advancedAnalytics.ts`
18. `knowledgeBase.ts`
19. `marketplace.ts`
20. `recruitment.ts`

### Hooks (8 arquivos)
1. `useAuthCheck.ts` - 1 console + 2 any types
2. `useNotifications.tsx` - 3 console calls
3. `useIntelligentCache.ts` - 7 console + 3 any types
4. `useChatAssistant.tsx` - ~15 console calls
5. `useGRIAutoSave.ts` - 5 console calls
6. `useContextualAI.ts` - 1 console + 4 any types
7. `audit/useExecution.ts` - 9 console calls
8. `useEmployeeCodeValidation.ts` - 1 console call

---

## Ordem de Execução

1. **Migrar 20 services prioritários** para logger (Batch 2)
2. **Migrar 8 hooks** para logger
3. **Corrigir any types** nos hooks migrados
4. **Corrigir any types** nos services críticos

---

## Métricas Esperadas

| Métrica | Antes | Depois deste Batch |
|---------|-------|-------------------|
| Services migrados | 12 | 32 |
| Hooks migrados | 0 | 8 |
| `any` types corrigidos | 0 | ~25 |
| Console logs restantes | ~3.500 | ~2.700 |

---

## Notas Técnicas

### Categorias do Logger a Usar

| Categoria | Uso |
|-----------|-----|
| `auth` | Autenticação, sessões |
| `api` | Chamadas de API, edge functions |
| `emission` | Emissões, fatores de emissão |
| `training` | Treinamentos, capacitação |
| `compliance` | Licenças, conformidade |
| `quality` | Qualidade, calibração, manutenção |
| `supplier` | Fornecedores |
| `document` | Documentos, GED |
| `service` | Serviços gerais |
| `notification` | Notificações |
| `gri` | Relatórios GRI |
| `audit` | Auditorias |

### Padrão de Type Guards para Erros

```typescript
// Já existe em src/utils/typeGuards.ts
import { getErrorMessage } from '@/utils/typeGuards';

// Uso em catch blocks:
catch (error: unknown) {
  logger.error('Error message', error, 'category');
}
```
