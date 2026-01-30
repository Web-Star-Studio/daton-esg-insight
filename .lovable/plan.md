
# Fase 2 - Batch 3: Migração de 20 Services e Correção de Types

## Resumo da Análise

| Arquivo | Console Calls | Types `any` | Categoria Logger | Prioridade |
|---------|---------------|-------------|------------------|------------|
| `customerComplaints.ts` | 12 | 3 | `quality` | ALTA |
| `supplierPortalService.ts` | 13 | 4 | `supplier` | ALTA |
| `brazilianFactorsTransform.ts` | 2 | 0 | `import` | MÉDIA |
| `trainingSchedules.ts` | 2 | 0 | `training` | MÉDIA |
| `branches.ts` | 15+ | 3 | `service` | ALTA |
| `dataExport.ts` | 6 | 7 | `service` | ALTA |
| `valueChainMapping.ts` | 0 | 15 | `service` | MÉDIA (types) |
| `griReports.ts` | 3 | 4 | `gri` | ALTA |
| `ghgReports.ts` | 0 | 3 | `emission` | MÉDIA (types) |
| `factorExport.ts` | 0 | 7 | `emission` | MÉDIA (types) |
| `deduplication.ts` | 5 | 2 | `service` | MÉDIA |
| `supplierDashboard.ts` | 3 | 1 | `supplier` | MÉDIA |
| `licenseActivityHistory.ts` | 1 | 4 | `compliance` | MÉDIA |
| `energyManagement.ts` | 1 | 0 | `emission` | BAIXA |
| `isoRequirements.ts` | 0 | 0 | `compliance` | (OK) |
| `employeeService.ts` | 0 | 0 | `service` | (OK) |
| `favorites.ts` | 0 | 0 | `service` | (OK) |
| `extractionApprovalLog.ts` | 0 | 0 | `document` | (OK - já migrado) |
| `esg.ts` | 3 | 0 | `api` | BAIXA |
| `trainingStatuses.ts` | 0 | 0 | `training` | (OK - já migrado) |

---

## Parte 1: Migração de Console.log para Logger

### 1.1 customerComplaints.ts (12 console.error → logger.error)

```typescript
// ANTES (linhas 72, 88, 131, 149, 169, 193, 214, 232, 246, 284)
console.error('Error fetching customer complaints:', error);
console.error('Error creating customer complaint:', error);
console.error('Error resolving complaint:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Error fetching customer complaints', error, 'quality');
logger.error('Error creating customer complaint', error, 'quality');
logger.error('Error resolving complaint', error, 'quality');
```

### 1.2 supplierPortalService.ts (13 console.error → logger.error)

```typescript
// ANTES (linhas 70, 85, 101, 115, 128, 151, 166, 182, 196, 209, 228)
console.error('Error fetching mandatory readings:', error);
console.error('Error creating mandatory reading:', error);
console.error('Error fetching supplier surveys:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Error fetching mandatory readings', error, 'supplier');
logger.error('Error creating mandatory reading', error, 'supplier');
logger.error('Error fetching supplier surveys', error, 'supplier');
```

### 1.3 branches.ts (15+ console.log/warn → logger.debug/warn)

```typescript
// ANTES (linhas 52, 68, 86, 117, 184, 224, 238, 251, 262, 273, 285, 296, 306, 318, 329, 340, 351, 362, 370, 382, 386, 391, 394)
console.warn('[branches] getUserCompanyId: No authenticated user');
console.log(`[deleteBranch] Iniciando exclusão da filial ${id}`);
console.log(`[deleteBranch] Participantes de agendamentos removidos`);

// DEPOIS
import { logger } from '@/utils/logger';

logger.warn('getUserCompanyId: No authenticated user after retries', 'auth');
logger.debug(`Iniciando exclusão da filial ${id}`, 'service');
logger.debug('Participantes de agendamentos removidos', 'service');
```

### 1.4 trainingSchedules.ts (2 console.error → logger.error)

```typescript
// ANTES (linhas 72, 171)
console.error('Error getting company ID:', error);
console.error('Erro ao adicionar participantes:', participantsError);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Error getting company ID', error, 'training');
logger.error('Erro ao adicionar participantes', participantsError, 'training');
```

### 1.5 brazilianFactorsTransform.ts (2 console.error → logger.error)

```typescript
// ANTES (linhas 191, 203)
console.error('Erro ao importar fator:', factor.name, error);
console.error('Erro no processo de importação:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Erro ao importar fator', error, 'import', { factorName: factor.name });
logger.error('Erro no processo de importação', error, 'import');
```

### 1.6 dataExport.ts (6 console.error → logger.error)

```typescript
// ANTES (linhas 206, 388, etc.)
console.error('Erro ao exportar dados de água:', error);
console.error('Erro ao exportar dados de energia:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Erro ao exportar dados de água', error, 'service');
logger.error('Erro ao exportar dados de energia', error, 'service');
```

### 1.7 griReports.ts (3 console.error → logger.error)

```typescript
// ANTES (linhas 185, 193, 482, 487)
console.error('Erro ao criar relatório GRI:', error);
console.error('Erro em createGRIReport:', error);
console.error('Erro ao recalcular conclusão do relatório:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Erro ao criar relatório GRI', error, 'gri');
logger.error('Error in createGRIReport', error, 'gri');
logger.error('Erro ao recalcular conclusão do relatório', error, 'gri');
```

### 1.8 deduplication.ts (5 console.error → logger.error)

```typescript
// ANTES (linhas 50, 70, 112, 138, 155)
console.error('Error fetching deduplication rules:', error);
console.error('Error creating deduplication rule:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Error fetching deduplication rules', error, 'service');
logger.error('Error creating deduplication rule', error, 'service');
```

### 1.9 supplierDashboard.ts (3 console.error → logger.error)

```typescript
// ANTES (linhas 117, 170, 210)
console.error('Error fetching supplier dashboard data:', error);
console.error('Error updating supplier performance metrics:', error);
console.error('Error fetching suppliers overview:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.error('Error fetching supplier dashboard data', error, 'supplier');
logger.error('Error updating supplier performance metrics', error, 'supplier');
logger.error('Error fetching suppliers overview', error, 'supplier');
```

### 1.10 licenseActivityHistory.ts (1 console.error → logger.error)

```typescript
// ANTES (linha 51)
if (error) console.error('Error logging action:', error);

// DEPOIS
import { logger } from '@/utils/logger';

if (error) logger.error('Error logging action', error, 'compliance');
```

### 1.11 energyManagement.ts (1 console.warn → logger.warn)

```typescript
// ANTES (linha 81)
console.warn(`Unidade não reconhecida: ${unit}. Usando valor sem conversão.`);

// DEPOIS
import { logger } from '@/utils/logger';

logger.warn(`Unidade de energia não reconhecida: ${unit}`, 'emission');
```

### 1.12 esg.ts (3 console.log/error → logger)

```typescript
// ANTES (linhas presentes)
console.log('Calling ESG dashboard edge function...');
console.error('Error calling ESG dashboard function:', error);
console.error('ESG dashboard service error:', error);

// DEPOIS
import { logger } from '@/utils/logger';

logger.debug('Calling ESG dashboard edge function', 'api');
logger.error('Error calling ESG dashboard function', error, 'api');
logger.error('ESG dashboard service error', error, 'api');
```

---

## Parte 2: Correção de Types `any`

### 2.1 customerComplaints.ts (3 any types)

```typescript
// ANTES (linhas 23-24, 43)
communication_log?: any;
attachments?: any;

// DEPOIS - Criar interfaces tipadas
interface CommunicationLogEntry {
  date: string;
  type: 'creation' | 'communication' | 'resolution' | 'escalation';
  message: string;
  user_id?: string | null;
}

interface CustomerComplaint {
  communication_log?: CommunicationLogEntry[];
  attachments?: string[] | Record<string, unknown>;
}
```

### 2.2 supplierPortalService.ts (4 any types)

```typescript
// ANTES (linhas 261, 306, 392, 406)
const confirmedIds = new Set((confirmations as any[] || []).map(c => c.reading_id));
const responseMap = new Map((responses as any[] || []).map(r => [r.survey_id, r as SurveyResponse]));
const progressMap = new Map((progress as any[] || []).map(p => [p.training_material_id, p]));
const updateData: any = { ... };

// DEPOIS - Usar tipos específicos
interface ReadingConfirmationBasic {
  reading_id: string;
}
const confirmedIds = new Set((confirmations || []).map((c: ReadingConfirmationBasic) => c.reading_id));

interface TrainingProgress {
  training_material_id: string;
  status: string;
  // ...
}
const progressMap = new Map((progress || []).map((p: TrainingProgress) => [p.training_material_id, p]));
```

### 2.3 branches.ts (3 any types)

```typescript
// ANTES (linhas 103, 105, 427, 445, 478)
const branchMap = new Map((data || []).map((b: any) => [b.id, b]));
return (data || []).map((branch: any) => ({ ... }));
onError: (error: any) => { ... }

// DEPOIS
// Usar tipo Branch já definido
const branchMap = new Map((data || []).map((b: Branch) => [b.id, b]));
return (data || []).map((branch: Branch) => ({ ... }));

// Usar unknown + getErrorMessage
onError: (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erro desconhecido';
}
```

### 2.4 dataExport.ts (7 any types)

```typescript
// ANTES (linhas 18, 78, 231, 400, 529, 594)
const convertToCSV = (data: any[], headers: string[]): string => { ... }
const exportData: any[] = [];

// DEPOIS - Usar generics e tipos específicos
type ExportDataRow = Record<string, string | number | boolean>;

const convertToCSV = (data: ExportDataRow[], headers: string[]): string => { ... }
const exportData: ExportDataRow[] = [];
```

### 2.5 valueChainMapping.ts (15 any types)

```typescript
// ANTES (linhas 13-16, 29-32, 65-68, 77-80, 209)
external_suppliers: any[];
external_clients: any[];
requirements: any[];
kpis: any[];
sla_requirements: any;
escalation_matrix: any[];
performance_indicators: any[];

// DEPOIS - Criar interfaces específicas
interface ExternalEntity {
  name: string;
  contact?: string;
  type?: string;
}

interface Requirement {
  id?: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}

interface KPI {
  name: string;
  target?: number;
  unit?: string;
  frequency?: string;
}

interface SLARequirement {
  metric: string;
  target_value: number;
  unit: string;
  measurement_period?: string;
}

// Aplicar nas interfaces
external_suppliers: ExternalEntity[];
external_clients: ExternalEntity[];
requirements: Requirement[];
kpis: KPI[];
sla_requirements: SLARequirement | null;
```

### 2.6 factorExport.ts (7 any types)

```typescript
// ANTES (linhas 28, 98, 172, 175, 186, 189, 199)
const row: any = {};
const grouped: { [key: string]: any[] } = {};
const result: any[] = [];
const headerRow: any = {};
const emptyRow: any = {};

// DEPOIS
type FactorExportRow = Record<string, string | number>;

const row: FactorExportRow = {};
const grouped: Record<string, FactorExportRow[]> = {};
const result: FactorExportRow[] = [];
```

### 2.7 griReports.ts (4 any types)

```typescript
// ANTES (linhas 17-19, 180, 192, 397)
materiality_assessment?: any;
stakeholder_engagement?: any;
template_config?: any;
} as any])
catch (error: any)
.insert([topic as any])

// DEPOIS
interface MaterialityAssessment {
  topics?: string[];
  stakeholder_input?: Record<string, unknown>;
  methodology?: string;
}

interface StakeholderEngagement {
  groups?: string[];
  methods?: string[];
  frequency?: string;
}

materiality_assessment?: MaterialityAssessment;
stakeholder_engagement?: StakeholderEngagement;
template_config?: Record<string, unknown>;

// Catch blocks
} catch (error: unknown) {
```

### 2.8 ghgReports.ts (3 any types)

```typescript
// ANTES (linhas 18, 70, 329)
report_data: any;
[key: string]: any;
const uniqueFactors = factors?.reduce((acc: any[], curr) => { ... }

// DEPOIS
report_data: ReportData;
// Remover index signature se possível ou usar Record<string, unknown>

interface UsedEmissionFactor {
  source: string;
  category: string;
  factor_value: number;
  unit: string;
}
const uniqueFactors = factors?.reduce((acc: UsedEmissionFactor[], curr) => { ... }
```

### 2.9 licenseActivityHistory.ts (4 any types)

```typescript
// ANTES (linhas 12-13, 26-27)
old_values?: any;
new_values?: any;

// DEPOIS
type ActionValues = Record<string, unknown>;

old_values?: ActionValues;
new_values?: ActionValues;
```

### 2.10 supplierDashboard.ts (1 any type)

```typescript
// ANTES (linha 131)
metricsData?: any;

// DEPOIS
interface MetricsData {
  [key: string]: number | string | boolean;
}
metricsData?: MetricsData;
```

---

## Arquivos de Tipos a Criar/Atualizar

### Novo: `src/types/entities/complaint.ts`

```typescript
export interface CommunicationLogEntry {
  date: string;
  type: 'creation' | 'communication' | 'resolution' | 'escalation';
  message: string;
  user_id?: string | null;
}

export interface AttachmentInfo {
  file_name: string;
  file_path: string;
  uploaded_at: string;
}
```

### Novo: `src/types/entities/supplier-portal.ts`

```typescript
export interface TrainingProgress {
  training_material_id: string;
  supplier_id: string;
  status: 'Não Iniciado' | 'Em Andamento' | 'Concluído';
  started_at?: string;
  completed_at?: string;
  score?: number;
}

export interface ReadingConfirmationBasic {
  reading_id: string;
}
```

### Novo: `src/types/entities/value-chain.ts`

```typescript
export interface ExternalEntity {
  name: string;
  contact?: string;
  type?: string;
}

export interface ProcessRequirement {
  id?: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ProcessKPI {
  name: string;
  target?: number;
  unit?: string;
  frequency?: string;
}

export interface SLARequirement {
  metric: string;
  target_value: number;
  unit: string;
  measurement_period?: string;
}
```

---

## Ordem de Execução

1. **Criar arquivos de tipos** (3 novos arquivos em `src/types/entities/`)
2. **Migrar 12 services** para logger centralizado
3. **Corrigir types `any`** nos 10 services identificados
4. **Atualizar barrel export** em `src/types/entities/index.ts`

---

## Métricas Esperadas

| Métrica | Antes | Depois deste Batch |
|---------|-------|-------------------|
| Services migrados | 18 | 30 |
| Console logs removidos | ~70 | ~140 |
| `any` types corrigidos | ~15 | ~65 |
| Arquivos de tipos | 4 | 7 |

---

## Arquivos a Modificar

### Services (12 arquivos)
1. `customerComplaints.ts` - 12 console + 3 any
2. `supplierPortalService.ts` - 13 console + 4 any
3. `branches.ts` - 15+ console + 3 any
4. `trainingSchedules.ts` - 2 console
5. `brazilianFactorsTransform.ts` - 2 console
6. `dataExport.ts` - 6 console + 7 any
7. `griReports.ts` - 3 console + 4 any
8. `deduplication.ts` - 5 console + 2 any
9. `supplierDashboard.ts` - 3 console + 1 any
10. `licenseActivityHistory.ts` - 1 console + 4 any
11. `energyManagement.ts` - 1 console
12. `esg.ts` - 3 console

### Services (Types Only - 3 arquivos)
1. `valueChainMapping.ts` - 15 any types
2. `ghgReports.ts` - 3 any types
3. `factorExport.ts` - 7 any types

### Novos Arquivos de Tipos (3 arquivos)
1. `src/types/entities/complaint.ts`
2. `src/types/entities/supplier-portal.ts`
3. `src/types/entities/value-chain.ts`
