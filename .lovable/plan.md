
# Fase 2 - Batch 4: Services Críticos

## Análise dos Services com Maior Impacto

Baseado na análise detalhada, identifiquei os **12 services mais críticos** que precisam de migração urgente devido ao alto número de `console` calls e tipos `any`.

| Service | Console Calls | Types `any` | Categoria Logger | Prioridade |
|---------|---------------|-------------|------------------|------------|
| `documents.ts` | ~35 | 3 | `document` | **CRÍTICO** |
| `projectManagement.ts` | ~18 | 0 | `project` | **ALTA** |
| `licenseAI.ts` | ~10 | 3 | `compliance` | **ALTA** |
| `careerDevelopment.ts` | 0 | ~15 | `service` | **ALTA** (types) |
| `unifiedQualityService.ts` | ~12 | ~20 | `quality` | **CRÍTICO** |
| `riskOccurrences.ts` | 5 | 6 | `quality` | **MÉDIA** |
| `predictiveAnalytics.ts` | 4 | 1 | `emission` | **MÉDIA** |
| `wasteManagement.ts` | 3 | 1 | `emission` | **MÉDIA** |
| `analyticsService.ts` | 1 | 0 | `analytics` | **BAIXA** |

---

## Parte 1: Migração de Console.log para Logger

### 1.1 documents.ts (~35 console calls → logger)

Este é o service com mais logs no projeto. Categorias a aplicar:

```typescript
import { logger } from '@/utils/logger';

// ANTES
console.log('Fetching folder hierarchy...');
console.error('Error fetching folders:', error);
console.log('📤 Uploading document:', file.name);
console.error('❌ Storage upload error:', uploadError);
console.log('✅ File uploaded to storage:', uploadData.path);

// DEPOIS
logger.debug('Fetching folder hierarchy', 'document');
logger.error('Error fetching folders', error, 'document');
logger.debug(`Uploading document: ${file.name}`, 'document');
logger.error('Storage upload error', uploadError, 'document');
logger.debug(`File uploaded to storage: ${uploadData.path}`, 'document');
```

### 1.2 projectManagement.ts (18 console calls → logger)

```typescript
import { logger } from '@/utils/logger';

// ANTES (linha 112, 127, 157, etc.)
console.error('Error fetching projects:', error);
console.error('Error creating project:', error);

// DEPOIS
logger.error('Error fetching projects', error, 'project');
logger.error('Error creating project', error, 'project');
```

### 1.3 licenseAI.ts (10 console calls → logger)

```typescript
import { logger } from '@/utils/logger';

// ANTES (linhas 74, 91, 107, 124, 142, 158, 216, 240)
console.error('Error analyzing license:', error);
console.error('Error fetching license analyses:', error);

// DEPOIS
logger.error('Error analyzing license', error, 'compliance');
logger.error('Error fetching license analyses', error, 'compliance');
```

### 1.4 unifiedQualityService.ts (12 console calls → logger)

Alguns já usam logger, mas muitos ainda usam console:

```typescript
// ANTES (linhas 261, 307, 326, 359, 430, 533, 542, etc.)
console.error('Error fetching quality indicators list:', error);
console.error('Error creating quality indicator:', error);
console.error('Error in predictive analysis:', error);
console.log('🔍 getRiskMatrix: Fetching for matrix ID:', id);

// DEPOIS
logger.error('Error fetching quality indicators list', error, 'quality');
logger.error('Error creating quality indicator', error, 'quality');
logger.error('Error in predictive analysis', error, 'quality');
logger.debug(`getRiskMatrix: Fetching for matrix ID: ${id}`, 'quality');
```

### 1.5 riskOccurrences.ts (5 console calls → logger)

```typescript
import { logger } from '@/utils/logger';

// ANTES (linhas 49, 64, 92, 108, 122)
console.error('Error fetching risk occurrences:', error);
console.error('Error creating risk occurrence:', error);

// DEPOIS
logger.error('Error fetching risk occurrences', error, 'quality');
logger.error('Error creating risk occurrence', error, 'quality');
```

### 1.6 predictiveAnalytics.ts (4 console calls → logger)

```typescript
// ANTES (linhas 45, 55, 70, 73)
console.log('📡 [PredictiveAnalytics] Calling edge function:', { analysisType, months });
console.error('❌ [PredictiveAnalytics] Edge function error:', error);

// DEPOIS
logger.debug('Calling predictive analytics edge function', 'emission', { analysisType, months });
logger.error('Predictive analytics edge function error', error, 'emission');
```

### 1.7 wasteManagement.ts (3 console calls → logger)

```typescript
import { logger } from '@/utils/logger';

// ANTES (linhas 40, 225, 497)
console.warn(`Unidade não reconhecida: ${unit}. Assumindo toneladas.`);
console.log('Dados do ano anterior não disponíveis');

// DEPOIS
logger.warn(`Unidade de resíduo não reconhecida: ${unit}`, 'emission');
logger.debug('Dados do ano anterior não disponíveis', 'emission');
```

---

## Parte 2: Correção de Types `any`

### 2.1 unifiedQualityService.ts (~20 any types)

```typescript
// ANTES (linhas 126, 435, 521-531, 552, 585-665)
private log(message: string, context?: any)
private async generateQualityInsights(dashboardData: any)
async getQualityTrends(period: string = '30d'): Promise<any[]>
async getTeamPerformance(): Promise<any[]>
async getRiskMatrix(id: string): Promise<any>
const matrix: any[] = [];
async getProcessEfficiency(): Promise<any[]>
async createStrategicMap(data: any): Promise<any>
async createBSCPerspective(data: any): Promise<any>
async createProcessMap(data: any): Promise<any>
async getRiskMatrices(): Promise<any[]>
async createRiskMatrix(data: any): Promise<any>
async getNonConformities(): Promise<any[]>
async createNonConformity(data: any): Promise<any>

// DEPOIS - Definir interfaces específicas
interface LogContext {
  [key: string]: unknown;
}

interface RiskMatrixCell {
  probability: string;
  impact: string;
  risks: RiskAssessment[];
  count: number;
}

interface RiskCounts {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface RiskMatrixResult {
  matrix: RiskMatrixCell[];
  riskCounts: RiskCounts;
}

private log(message: string, context?: LogContext)
private async generateQualityInsights(dashboardData: Partial<QualityDashboard>)
async getQualityTrends(period: string = '30d'): Promise<unknown[]>
async getRiskMatrix(id: string): Promise<RiskMatrixResult>
const matrix: RiskMatrixCell[] = [];
```

### 2.2 careerDevelopment.ts (~15 any types)

```typescript
// ANTES (linhas 16-18, 61, 81, 107-108, 143-146, 191)
goals: any[] | any;
skills_to_develop: any[] | any;
development_activities: any[] | any;
development_needs: any[];
objectives: any[];
requirements: any[];
benefits: any[];
const cleanDataForSupabase = (data: Record<string, any>): Record<string, any>
const withNormalizedFields: Record<string, any> = { ... };

// DEPOIS - Definir interfaces específicas
interface CareerGoal {
  title: string;
  description?: string;
  target_date?: string;
  status?: string;
}

interface SkillDevelopment {
  skill_name: string;
  current_level?: string;
  target_level?: string;
}

interface DevelopmentActivity {
  activity_type: string;
  description: string;
  scheduled_date?: string;
  completed?: boolean;
}

interface DevelopmentNeed {
  area: string;
  priority?: 'low' | 'medium' | 'high';
  action_plan?: string;
}

interface JobRequirement {
  requirement: string;
  is_mandatory?: boolean;
}

interface JobBenefit {
  benefit: string;
  description?: string;
}

goals: CareerGoal[];
skills_to_develop: SkillDevelopment[];
development_activities: DevelopmentActivity[];
development_needs: DevelopmentNeed[];
objectives: string[];
requirements: JobRequirement[];
benefits: JobBenefit[];
```

### 2.3 licenseAI.ts (3 any types)

```typescript
// ANTES (linhas 7, 41, 73)
ai_insights: any;
metadata: any;
} catch (error: any) {

// DEPOIS
interface AIInsight {
  category: string;
  finding: string;
  confidence: number;
  recommendation?: string;
}

interface AlertMetadata {
  source?: string;
  related_condition_id?: string;
  auto_generated?: boolean;
  [key: string]: unknown;
}

ai_insights: AIInsight[] | Record<string, unknown>;
metadata: AlertMetadata;
} catch (error: unknown) {
```

### 2.4 riskOccurrences.ts (6 any types)

```typescript
// ANTES (linhas 41, 58, 82, 101, 127, 175)
.from('risk_occurrences' as any)
async getOccurrenceMetrics(): Promise<any>
async getRiskOccurrenceTrend(): Promise<any[]>

// DEPOIS - Usar tipos específicos
interface OccurrenceMetrics {
  total: number;
  thisYear: number;
  open: number;
  inTreatment: number;
  resolved: number;
  closed: number;
  byImpact: Record<string, number>;
  totalFinancialImpact: number;
  avgResolutionDays: number;
}

interface OccurrenceTrendPoint {
  month: string;
  count: number;
  highImpact: number;
  financialImpact: number;
}

async getOccurrenceMetrics(): Promise<OccurrenceMetrics>
async getRiskOccurrenceTrend(): Promise<OccurrenceTrendPoint[]>
```

### 2.5 documents.ts (3 any types)

```typescript
// ANTES (linha 560, 646)
rows?: any[];
const rows = parseResult.data as Record<string, any>[];

// DEPOIS
type CSVRow = Record<string, string | number | null>;

rows?: CSVRow[];
const rows = parseResult.data as CSVRow[];
```

### 2.6 wasteManagement.ts (1 any type)

```typescript
// ANTES (linha 286)
const result: any = {};

// DEPOIS
interface WasteIntensityResult {
  [key: string]: number | string;
}
const result: WasteIntensityResult = {};
```

---

## Parte 3: Novos Tipos de Entidade

### Novo: `src/types/entities/career.ts`

```typescript
export interface CareerGoal {
  title: string;
  description?: string;
  target_date?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
}

export interface SkillDevelopment {
  skill_name: string;
  current_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  target_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface DevelopmentActivity {
  activity_type: 'training' | 'mentoring' | 'project' | 'certification' | 'other';
  description: string;
  scheduled_date?: string;
  completed?: boolean;
}

export interface DevelopmentNeed {
  area: string;
  priority?: 'low' | 'medium' | 'high';
  action_plan?: string;
}

export interface JobRequirement {
  requirement: string;
  is_mandatory?: boolean;
}

export interface JobBenefit {
  benefit: string;
  description?: string;
}
```

### Novo: `src/types/entities/quality.ts`

```typescript
export interface RiskMatrixCell {
  probability: string;
  impact: string;
  risks: unknown[];
  count: number;
}

export interface RiskCounts {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RiskMatrixResult {
  matrix: RiskMatrixCell[];
  riskCounts: RiskCounts;
}

export interface OccurrenceMetrics {
  total: number;
  thisYear: number;
  open: number;
  inTreatment: number;
  resolved: number;
  closed: number;
  byImpact: Record<string, number>;
  totalFinancialImpact: number;
  avgResolutionDays: number;
}

export interface OccurrenceTrendPoint {
  month: string;
  count: number;
  highImpact: number;
  financialImpact: number;
}
```

---

## Ordem de Execução

1. **Criar novos arquivos de tipos** (`career.ts`, `quality.ts`)
2. **Atualizar barrel export** (`src/types/entities/index.ts`)
3. **Migrar services críticos** (documents, projectManagement, licenseAI)
4. **Migrar unifiedQualityService** (maior complexidade)
5. **Migrar services restantes** (riskOccurrences, careerDevelopment, predictiveAnalytics, wasteManagement)

---

## Métricas Esperadas

| Métrica | Antes | Depois deste Batch |
|---------|-------|-------------------|
| Services migrados | 30 | 38 |
| Console logs removidos | ~90 | ~180 |
| `any` types corrigidos | ~50 | ~100 |
| Arquivos de tipos | 7 | 9 |

---

## Arquivos a Modificar

### Services (8 arquivos)
1. `documents.ts` - 35 console + 3 any
2. `projectManagement.ts` - 18 console
3. `licenseAI.ts` - 10 console + 3 any
4. `unifiedQualityService.ts` - 12 console + 20 any
5. `riskOccurrences.ts` - 5 console + 6 any
6. `careerDevelopment.ts` - 15 any types
7. `predictiveAnalytics.ts` - 4 console + 1 any
8. `wasteManagement.ts` - 3 console + 1 any

### Novos Arquivos de Tipos (2 arquivos)
1. `src/types/entities/career.ts`
2. `src/types/entities/quality.ts`

### Atualização de Barrel (1 arquivo)
1. `src/types/entities/index.ts`

---

## Detalhes Técnicos

### Padrão de Logger por Categoria

| Service | Categoria | Justificativa |
|---------|-----------|---------------|
| documents.ts | `document` | Gestão de documentos |
| projectManagement.ts | `project` | Nova categoria para projetos |
| licenseAI.ts | `compliance` | Análise de licenças |
| unifiedQualityService.ts | `quality` | Nova categoria para qualidade |
| riskOccurrences.ts | `quality` | Riscos são parte do SGQ |
| careerDevelopment.ts | `service` | Serviço genérico de RH |
| predictiveAnalytics.ts | `emission` | Predições de emissões |
| wasteManagement.ts | `emission` | Gestão de resíduos |

### Atualização do Logger

Adicionar novas categorias ao logger:

```typescript
// src/utils/logger.ts
type LogCategory = 
  | 'api' | 'auth' | 'service' | 'training' | 'compliance'
  | 'document' | 'emission' | 'supplier' | 'gri' | 'import'
  | 'quality' | 'project';  // Novas categorias
```
