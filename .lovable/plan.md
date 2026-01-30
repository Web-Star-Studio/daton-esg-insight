
# Fase 2 - Batch 5: Migração de 20 Services

## Resumo da Análise

Baseado na análise dos arquivos, identifiquei **20 services** que precisam de migração para o logger centralizado e/ou correção de tipos `any`.

### Services a Migrar

| # | Arquivo | Console Calls | Types `any` | Categoria Logger |
|---|---------|---------------|-------------|------------------|
| 1 | `documentAI.ts` | 8 | 5 | `document` |
| 2 | `lmsService.ts` | 12 | 6 | `training` |
| 3 | `audit.ts` | 22 | 2 | `audit` |
| 4 | `gedDocuments.ts` | 0 | 18 | `document` |
| 5 | `advancedAnalytics.ts` | 0 | 8 | `emission` |
| 6 | `licenses.ts` | 12 | 6 | `compliance` |
| 7 | `approvalWorkflows.ts` | 0 | 1 | `service` |
| 8 | `dataCollection.ts` | 0 | 4 | `service` |
| 9 | `ghgInventory.ts` | 1 | 1 | `emission` |
| 10 | `mlPredictionService.ts` | 1 | 1 | `api` |
| 11 | `esgRecommendedIndicators.ts` | 0 | 3 | `emission` |
| 12 | `waterManagement.ts` | 0 | 2 | `emission` |
| 13 | `lostTimeAccidentsAnalysis.ts` | 1 | 0 | `service` |
| 14 | `indicatorManagement.ts` | ~5 | 3 | `service` |
| 15 | `integratedReports.ts` | ~4 | 5 | `gri` |
| 16 | `knowledgeBase.ts` | ~3 | 2 | `service` |
| 17 | `materialityService.ts` | ~4 | 3 | `gri` |
| 18 | `operationalMetrics.ts` | ~3 | 2 | `emission` |
| 19 | `processAutomation.ts` | ~2 | 4 | `service` |
| 20 | `stakeholders.ts` | ~3 | 3 | `gri` |

**Total estimado: ~80 console calls + ~90 types `any`**

---

## Parte 1: Migração de Console.log para Logger

### 1.1 documentAI.ts (8 console.error → logger.error)

```typescript
import { logger } from '@/utils/logger';

// Linhas 93, 116, 138, 175, 203, 225, 248
console.error('Error processing document:', error);
→ logger.error('Error processing document', error, 'document');

console.error('Error fetching extraction jobs:', error);
→ logger.error('Error fetching extraction jobs', error, 'document');

console.error('Error fetching pending extractions:', error);
→ logger.error('Error fetching pending extractions', error, 'document');

console.error('Error fetching AI processing stats:', error);
→ logger.error('Error fetching AI processing stats', error, 'document');

console.error('Error approving extracted data:', error);
→ logger.error('Error approving extracted data', error, 'document');

console.error('Error rejecting extracted data:', error);
→ logger.error('Error rejecting extracted data', error, 'document');

console.error('Error fetching extraction job status:', error);
→ logger.error('Error fetching extraction job status', error, 'document');
```

### 1.2 lmsService.ts (12 console calls → logger)

```typescript
import { logger } from '@/utils/logger';

// Linhas 138, 155, 159, 164, 204, 210, 214, 217, 443, 594
console.log('Fetching training courses...');
→ logger.debug('Fetching training courses', 'training');

console.error('Error fetching courses:', error);
→ logger.error('Error fetching courses', error, 'training');

console.log('Courses fetched successfully:', data?.length || 0);
→ logger.debug('Courses fetched successfully', 'training', { count: data?.length || 0 });

console.log('Creating course:', courseData);
→ logger.debug('Creating course', 'training', { courseData });

console.error('Error creating course:', error);
→ logger.error('Error creating course', error, 'training');

console.error('Error enrolling employee:', error);
→ logger.error('Error enrolling employee', error, 'training');

console.error('Error creating learning path:', error);
→ logger.error('Error creating learning path', error, 'training');
```

### 1.3 audit.ts (22 console calls → logger)

Este serviço já importa o logger mas ainda usa console em várias funções.

```typescript
// Linhas 102, 107, 119, 135, 144, 152, 162, 168, 177, 181, 186, 195, 204, 212, 223, 229, 271, 281, 289, 294, 303, 307, 332, 335, 340, 374, 379, 390, 394
console.log('Creating audit:', auditData);
→ logger.debug('Creating audit', 'audit', { auditData });

console.log('Current user:', userResponse.user?.id);
→ logger.debug('Getting current user', 'audit', { userId: userResponse.user?.id });

console.log('Profile data:', profile);
→ logger.debug('Profile data retrieved', 'audit');

console.error('Error creating audit:', error);
→ logger.error('Error creating audit', error, 'audit');

console.log('Audit created successfully:', data);
→ logger.debug('Audit created successfully', 'audit', { auditId: data.id });

console.error('Detailed audit creation error:', error);
→ logger.error('Detailed audit creation error', error, 'audit');

// Similar para todas as outras funções: getAuditFindings, createAuditFinding, 
// updateAudit, updateAuditFinding, getActivityLogs, logActivity, getAuditTrail, getAllFindings
```

### 1.4 licenses.ts (12 console.error → logger.error)

```typescript
import { logger } from '@/utils/logger';

// Linhas 174, 181, 197, 215, 224, 267, 279, 305, 317, 331, 339, 361, 420, 452, 483, 500
console.error('Error fetching licenses:', error);
→ logger.error('Error fetching licenses', error, 'compliance');

console.error('Error in getLicenses:', error);
→ logger.error('Error in getLicenses', error, 'compliance');

console.error('Error fetching license:', licenseError);
→ logger.error('Error fetching license', licenseError, 'compliance');

console.error('Error creating license:', error);
→ logger.error('Error creating license', error, 'compliance');

console.error('Error updating license:', error);
→ logger.error('Error updating license', error, 'compliance');

console.error('Error deleting license:', error);
→ logger.error('Error deleting license', error, 'compliance');

console.error('Error uploading file:', uploadError);
→ logger.error('Error uploading file', uploadError, 'compliance');

console.error('Error fetching license stats:', error);
→ logger.error('Error fetching license stats', error, 'compliance');
```

### 1.5 ghgInventory.ts (1 console.error → logger.error)

```typescript
import { logger } from '@/utils/logger';

// Linha 359
console.error(`Erro ao atualizar meta ${goal.id}:`, error);
→ logger.error(`Erro ao atualizar meta ${goal.id}`, error, 'emission');
```

### 1.6 mlPredictionService.ts (1 console.log → logger.debug)

```typescript
import { logger } from '@/utils/logger';

// Linha 538
console.log(`Model ${modelId} retrained with accuracy: ${model.accuracy}`);
→ logger.debug(`Model ${modelId} retrained`, 'api', { accuracy: model.accuracy });
```

### 1.7 lostTimeAccidentsAnalysis.ts (1 console.error → logger.error)

```typescript
import { logger } from '@/utils/logger';

// Linha 246
console.error('Error calculating lost time accidents metrics:', error);
→ logger.error('Error calculating lost time accidents metrics', error, 'service');
```

---

## Parte 2: Correção de Types `any`

### 2.1 documentAI.ts (5 any types)

```typescript
// Linhas 24, 35, 55, 59, 189
pipeline?: any[];
result_data?: any;
extracted_fields: Record<string, any>;
suggested_mappings?: Record<string, any>;
editedData?: Record<string, any>

// DEPOIS
interface PipelineStep {
  step: string;
  status: string;
  duration_ms?: number;
  result?: unknown;
}

interface ExtractedField {
  value: string | number | boolean | null;
  confidence?: number;
  source?: string;
}

interface SuggestedMapping {
  target_field: string;
  confidence: number;
  transform?: string;
}

pipeline?: PipelineStep[];
result_data?: Record<string, unknown>;
extracted_fields: Record<string, ExtractedField | string | number>;
suggested_mappings?: Record<string, SuggestedMapping>;
editedData?: Record<string, string | number | boolean | null>
```

### 2.2 lmsService.ts (6 any types)

```typescript
// Linhas 14, 15, 69, 70, 120, 129
prerequisites: any;
learning_objectives: any;
options: any;
correct_answer: any;
answers: any;
courses: any;

// DEPOIS
interface LearningObjective {
  title: string;
  description?: string;
}

interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

prerequisites: string[] | null;
learning_objectives: LearningObjective[] | string[];
options: QuestionOption[];
correct_answer: string | string[] | Record<string, unknown>;
answers: Record<string, string | string[]>;
courses: string[] | Array<{ course_id: string; order?: number }>;
```

### 2.3 audit.ts (2 any types)

```typescript
// Linhas 10, 311
details_json?: any;
async logActivity(actionType: string, description: string, detailsJson?: any)

// DEPOIS
details_json?: Record<string, unknown>;
async logActivity(actionType: string, description: string, detailsJson?: Record<string, unknown>)
```

### 2.4 gedDocuments.ts (18 any types)

Este é o serviço com mais tipos `any`. Principais correções:

```typescript
// Linhas 16, 35, 66, 124-125, 176, 187, 202, 266, 290, 311, 330, 347, 374, 562-563
metadata?: any;
steps: any;
distribution_list: any;
old_values?: any;
new_values?: any;
async getWorkflows(): Promise<any[]>
async createWorkflow(workflow: any): Promise<any>
async updateWorkflow(id: string, updates: any): Promise<any>
async getPendingApprovals(): Promise<any[]>
const updates: any = { ... }
async getMasterList(): Promise<any[]>
async addToMasterList(item: any): Promise<any>
async updateMasterListItem(id: string, updates: any): Promise<any>
async generateMasterListReport(): Promise<any>
oldValues?: any, newValues?: any

// DEPOIS - Usar tipos específicos ou Record<string, unknown>
import type { Json } from '@/integrations/supabase/types';

type DocumentMetadata = Record<string, unknown>;
type ActionValues = Record<string, unknown>;

metadata?: DocumentMetadata;
steps: ApprovalStep[] | Json;
distribution_list: string[] | Json;
old_values?: ActionValues;
new_values?: ActionValues;
async getWorkflows(): Promise<ApprovalWorkflow[]>
async createWorkflow(workflow: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow>
async updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow>
```

### 2.5 advancedAnalytics.ts (8 any types)

```typescript
// Linhas 96, 107, 113, 208, 236, 237
function processEmissionData(emissionData: any[], ...): AnalyticsData
source.activity_data?.reduce((sum: number, activity: any) => {
calculations.reduce((calcSum: number, calc: any) => {
function generateInsights(data: any): string[]
function generateRecommendations(data: any)
const recommendations: any[] = [];

// DEPOIS
interface EmissionSourceData {
  id: string;
  name: string;
  scope: number;
  category: string;
  subcategory?: string;
  scope_3_category_number?: number;
  company_id: string;
}

interface ActivityDataItem {
  calculated_emissions?: CalculatedEmission | CalculatedEmission[];
  period_start_date: string;
  period_end_date: string;
  emission_sources?: EmissionSourceData;
}

interface CalculatedEmission {
  total_co2e: number;
  biogenic_co2_kg?: number;
}

interface AnalyticsContext {
  totalEmissions: number;
  scope1Total: number;
  scope2Total: number;
  scope3Total: number;
  categoryBreakdown: CategoryBreakdown[];
  topSources: TopSource[];
}

interface Recommendation {
  title: string;
  description: string;
  potential_reduction?: number;
  priority: 'high' | 'medium' | 'low';
}

function processEmissionData(emissionData: EmissionSourceData[], ...): AnalyticsData
function generateInsights(data: AnalyticsContext): string[]
function generateRecommendations(data: AnalyticsContext): Recommendation[]
const recommendations: Recommendation[] = [];
```

### 2.6 licenses.ts (6 any types)

```typescript
// Linhas 33, 53, 119, 161, 254, 258, 287
partial_data?: any;
ai_extracted_data?: any;
ai_extracted_data?: any;
query = query.eq('status', filters.status as any)
type: licenseData.type as any,
status: licenseData.status as any,
const updateData: any = { ...updates }

// DEPOIS
import type { Json } from '@/integrations/supabase/types';

interface PartialExtractedData {
  fields?: Record<string, string | number>;
  confidence?: number;
  errors?: string[];
}

partial_data?: PartialExtractedData;
ai_extracted_data?: ExtractedLicenseFormData | Record<string, unknown>;

// Remover casts desnecessários - usar tipos corretos
const updateData: UpdateLicenseData & { issue_date?: string; expiration_date?: string } = { ...updates };
```

### 2.7 approvalWorkflows.ts (1 any type)

```typescript
// Linha 9
steps: any;

// DEPOIS
import type { Json } from '@/integrations/supabase/types';

interface WorkflowStep {
  step_number: number;
  name: string;
  approver_ids: string[];
  required_approvals?: number;
}

steps: WorkflowStep[] | Json;
```

### 2.8 dataCollection.ts (4 any types)

```typescript
// Linhas 16, 34, 180
metadata: any;
log: any;
async getTemplate(type: string): Promise<{ data: any[]; fileName: string }>

// DEPOIS
interface TaskMetadata {
  source?: string;
  target_table?: string;
  field_mappings?: Record<string, string>;
  [key: string]: unknown;
}

interface ImportLog {
  entries: Array<{ timestamp: string; message: string; level: string }>;
  errors?: string[];
  warnings?: string[];
}

interface TemplateRow {
  [key: string]: string | number | boolean | null;
}

metadata: TaskMetadata;
log: ImportLog;
async getTemplate(type: string): Promise<{ data: TemplateRow[]; fileName: string }>
```

### 2.9 ghgInventory.ts (1 any type - index signature)

```typescript
// Linha 23
[key: string]: any;

// DEPOIS
[key: string]: string | number | boolean | null | undefined;
```

### 2.10 mlPredictionService.ts (1 any type)

```typescript
// Linha 21
prediction: any

// DEPOIS
prediction: number | string | Record<string, number>;
```

### 2.11 esgRecommendedIndicators.ts (3 any types)

```typescript
// Linhas 24, 557
metadata?: any;
const totalConsumption = waterData.reduce((sum: number, log: any) => {

// DEPOIS
interface IndicatorMetadata {
  calculation_method?: string;
  data_source?: string;
  last_verified?: string;
  [key: string]: unknown;
}

interface WaterLogEntry {
  quantity: number | string;
  unit?: string;
  source_type?: string;
}

metadata?: IndicatorMetadata;
const totalConsumption = waterData.reduce((sum: number, log: WaterLogEntry) => {
```

### 2.12 waterManagement.ts (2 any types)

```typescript
// Linhas 239, 248
const result: any = { ... };
}, {} as any);

// DEPOIS
interface WaterIntensityMetrics {
  total_water_m3: number;
  per_unit_m3?: number;
  per_revenue_m3?: number;
  production_volume?: number;
  production_unit?: string;
  revenue_brl?: number;
}

interface AggregatedMetrics {
  production_volume: number;
  production_unit: string;
  revenue_brl: number;
}

const result: WaterIntensityMetrics = { ... };
}, {} as AggregatedMetrics);
```

---

## Parte 3: Novas Categorias do Logger

O logger já possui todas as categorias necessárias:
- `document` (para documentAI, gedDocuments)
- `training` (para lmsService)
- `audit` (para audit.ts)
- `compliance` (para licenses)
- `emission` (para ghgInventory, advancedAnalytics, waterManagement, esgRecommendedIndicators)
- `api` (para mlPredictionService)
- `service` (para dataCollection, lostTimeAccidentsAnalysis, approvalWorkflows)
- `gri` (para integratedReports, materiality, stakeholders)

---

## Ordem de Execução

### Fase A: Services com mais console calls (maior impacto)
1. `audit.ts` - 22 console calls + 2 any
2. `lmsService.ts` - 12 console calls + 6 any
3. `licenses.ts` - 12 console calls + 6 any
4. `documentAI.ts` - 8 console calls + 5 any

### Fase B: Services com muitos types any
5. `gedDocuments.ts` - 18 any types (maior concentração)
6. `advancedAnalytics.ts` - 8 any types
7. `dataCollection.ts` - 4 any types

### Fase C: Services restantes
8. `approvalWorkflows.ts` - 1 any
9. `ghgInventory.ts` - 1 console + 1 any
10. `mlPredictionService.ts` - 1 console + 1 any
11. `esgRecommendedIndicators.ts` - 3 any
12. `waterManagement.ts` - 2 any
13. `lostTimeAccidentsAnalysis.ts` - 1 console

### Fase D: Services adicionais (se tempo permitir)
14-20. `indicatorManagement.ts`, `integratedReports.ts`, `knowledgeBase.ts`, `materiality.ts`, `operationalMetrics.ts`, `processAutomation.ts`, `stakeholders.ts`

---

## Arquivos a Modificar

### Services (13 arquivos principais)
1. `src/services/audit.ts`
2. `src/services/lmsService.ts`
3. `src/services/licenses.ts`
4. `src/services/documentAI.ts`
5. `src/services/gedDocuments.ts`
6. `src/services/advancedAnalytics.ts`
7. `src/services/dataCollection.ts`
8. `src/services/approvalWorkflows.ts`
9. `src/services/ghgInventory.ts`
10. `src/services/mlPredictionService.ts`
11. `src/services/esgRecommendedIndicators.ts`
12. `src/services/waterManagement.ts`
13. `src/services/lostTimeAccidentsAnalysis.ts`

---

## Métricas Esperadas

| Métrica | Antes (Batch 4) | Depois (Batch 5) |
|---------|-----------------|------------------|
| Services migrados | 38 | 51+ |
| Console logs removidos | ~180 | ~260 |
| `any` types corrigidos | ~100 | ~190 |

---

## Detalhes Técnicos

### Padrão de Migração

```typescript
// Import no topo
import { logger } from '@/utils/logger';

// console.log → logger.debug
console.log('Message:', data);
→ logger.debug('Message', 'category', { data });

// console.error → logger.error
console.error('Error:', error);
→ logger.error('Error message', error, 'category');

// console.warn → logger.warn
console.warn('Warning');
→ logger.warn('Warning message', 'category');
```

### Padrão para Types Any

```typescript
// Para campos JSON do Supabase
import type { Json } from '@/integrations/supabase/types';
field: SomeInterface | Json;

// Para objetos genéricos
field: Record<string, unknown>;

// Para arrays com estrutura conhecida
field: SpecificInterface[];

// Para callbacks/reducers
array.reduce((acc: SpecificType, item: ItemType) => { ... }, initialValue as SpecificType);
```
