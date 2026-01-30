
# Fase 2 - Batch 3 (Continuação): Migração de Services Restantes

## Resumo do Estado Atual

**Já migrados neste Batch:**
- ✅ `customerComplaints.ts` - Logger + tipos
- ✅ `supplierPortalService.ts` - Logger + tipos
- ✅ `branches.ts` - Logger + tipos

**Pendentes neste Batch (9 services):**

| Arquivo | Console Calls | Types `any` | Categoria |
|---------|---------------|-------------|-----------|
| `trainingSchedules.ts` | 2 | 0 | `training` |
| `dataExport.ts` | 6 | 7 | `service` |
| `griReports.ts` | 4 | 4 | `gri` |
| `supplierDashboard.ts` | 3 | 1 | `supplier` |
| `licenseActivityHistory.ts` | 1 | 4 | `compliance` |
| `energyManagement.ts` | 1 | 0 | `emission` |
| `esg.ts` | 3 | 0 | `api` |
| `ghgReports.ts` | 0 | 3 | `emission` |
| `factorExport.ts` | 0 | 7 | `emission` |

---

## Parte 1: Migração de Console.log para Logger

### 1.1 trainingSchedules.ts (2 console calls)

```typescript
// Linha 72
console.error('Error getting company ID:', error);
→ logger.error('Error getting company ID', error, 'training');

// Linha 171
console.error('Erro ao adicionar participantes:', participantsError);
→ logger.error('Erro ao adicionar participantes', participantsError, 'training');
```

### 1.2 dataExport.ts (6 console calls)

```typescript
// Linha 206
console.error('Erro ao exportar dados de água:', error);
→ logger.error('Erro ao exportar dados de água', error, 'service');

// Linha 388
console.error('Erro ao exportar dados de energia:', error);
→ logger.error('Erro ao exportar dados de energia', error, 'service');

// Linha 517
console.error('Erro ao exportar consolidado ESG:', error);
→ logger.error('Erro ao exportar consolidado ESG', error, 'service');

// Linha 582
console.error('Erro ao exportar dados de emissões:', error);
→ logger.error('Erro ao exportar dados de emissões', error, 'service');

// Linha 647
console.error('Erro ao exportar dados de resíduos:', error);
→ logger.error('Erro ao exportar dados de resíduos', error, 'service');
```

### 1.3 griReports.ts (4 console calls)

```typescript
// Linha 185
console.error('Erro ao criar relatório GRI:', error);
→ logger.error('Erro ao criar relatório GRI', error, 'gri');

// Linha 193
console.error('Erro em createGRIReport:', error);
→ logger.error('Erro em createGRIReport', error, 'gri');

// Linha 482
console.error('Erro ao recalcular conclusão do relatório:', error);
→ logger.error('Erro ao recalcular conclusão do relatório', error, 'gri');

// Linha 487
console.error('Exceção em calculateReportCompletion:', e);
→ logger.error('Exceção em calculateReportCompletion', e, 'gri');
```

### 1.4 supplierDashboard.ts (3 console calls)

```typescript
// Linha 117
console.error('Error fetching supplier dashboard data:', error);
→ logger.error('Error fetching supplier dashboard data', error, 'supplier');

// Linha 170
console.error('Error updating supplier performance metrics:', error);
→ logger.error('Error updating supplier performance metrics', error, 'supplier');

// Linha 210
console.error('Error fetching suppliers overview:', error);
→ logger.error('Error fetching suppliers overview', error, 'supplier');
```

### 1.5 licenseActivityHistory.ts (1 console call)

```typescript
// Linha 51
if (error) console.error('Error logging action:', error);
→ if (error) logger.error('Error logging action', error, 'compliance');
```

### 1.6 energyManagement.ts (1 console call)

```typescript
// Linha 81
console.warn(`Unidade não reconhecida: ${unit}. Usando valor sem conversão.`);
→ logger.warn(`Unidade de energia não reconhecida: ${unit}`, 'emission');
```

### 1.7 esg.ts (3 console calls)

```typescript
// Linha 26
console.log('Calling ESG dashboard edge function...');
→ logger.debug('Calling ESG dashboard edge function', 'api');

// Linha 33
console.error('Error calling ESG dashboard function:', error);
→ logger.error('Error calling ESG dashboard function', error, 'api');

// Linha 37
console.log('ESG dashboard data received:', data);
→ logger.debug('ESG dashboard data received', 'api', { data });

// Linha 40
console.error('ESG dashboard service error:', error);
→ logger.error('ESG dashboard service error', error, 'api');
```

---

## Parte 2: Correção de Types `any`

### 2.1 dataExport.ts (7 any types)

```typescript
// Linha 18 - convertToCSV parameter
const convertToCSV = (data: any[], headers: string[]): string
→ type ExportDataRow = Record<string, string | number | boolean>;
→ const convertToCSV = (data: ExportDataRow[], headers: string[]): string

// Linhas 78, 231, 400, 529, 594 - exportData arrays
const exportData: any[] = [];
→ const exportData: ExportDataRow[] = [];
```

### 2.2 griReports.ts (4 any types)

```typescript
// Linhas 17-19 - interface fields
materiality_assessment?: any;
stakeholder_engagement?: any;
template_config?: any;
→ 
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
→ materiality_assessment?: MaterialityAssessment;
→ stakeholder_engagement?: StakeholderEngagement;
→ template_config?: Record<string, unknown>;

// Linha 180 - insert cast
} as any])
→ Remover cast, usar tipo correto

// Linha 192 - catch block
catch (error: any)
→ catch (error: unknown)

// Linhas 397, 442 - insert casts
.insert([topic as any])
.insert([alignment as any])
→ Manter JSON assertion necessária para Supabase
```

### 2.3 supplierDashboard.ts (1 any type)

```typescript
// Linha 131
metricsData?: any;
→ metricsData?: Record<string, number | string | boolean>;
```

### 2.4 licenseActivityHistory.ts (4 any types)

```typescript
// Linhas 12-13, 26-27
old_values?: any;
new_values?: any;
→ 
type ActionValues = Record<string, unknown>;
old_values?: ActionValues;
new_values?: ActionValues;
```

### 2.5 ghgReports.ts (3 any types)

```typescript
// Linha 18
report_data: any;
→ report_data: ReportData | Record<string, unknown>;

// Linha 70
[key: string]: any;
→ [key: string]: unknown;

// Linha 329
const uniqueFactors = factors?.reduce((acc: any[], curr) => {
→ 
interface UsedEmissionFactor {
  source: string;
  category: string;
  factor_value: number;
  unit: string;
}
const uniqueFactors = factors?.reduce((acc: UsedEmissionFactor[], curr) => {
```

### 2.6 factorExport.ts (7 any types)

```typescript
// Linhas 28, 98
const row: any = {};
→ type FactorExportRow = Record<string, string | number>;
→ const row: FactorExportRow = {};

// Linhas 172, 175, 186, 189, 199
const grouped: { [key: string]: any[] } = {};
const result: any[] = [];
const headerRow: any = {};
const emptyRow: any = {};
→ 
const grouped: Record<string, FactorExportRow[]> = {};
const result: FactorExportRow[] = [];
const headerRow: FactorExportRow = {};
const emptyRow: FactorExportRow = {};
```

---

## Arquivos a Modificar

### Services com Logger + Types (7 arquivos)
1. `trainingSchedules.ts` - 2 console
2. `dataExport.ts` - 6 console + 7 any
3. `griReports.ts` - 4 console + 4 any
4. `supplierDashboard.ts` - 3 console + 1 any
5. `licenseActivityHistory.ts` - 1 console + 4 any
6. `energyManagement.ts` - 1 console
7. `esg.ts` - 3 console

### Services com Types Only (2 arquivos)
1. `ghgReports.ts` - 3 any types
2. `factorExport.ts` - 7 any types

---

## Tipos a Adicionar/Atualizar

### Em `src/types/entities/index.ts` - atualizar barrel exports

### Em arquivos individuais - tipos inline:

```typescript
// dataExport.ts
type ExportDataRow = Record<string, string | number | boolean>;

// griReports.ts  
interface MaterialityAssessment { ... }
interface StakeholderEngagement { ... }

// ghgReports.ts
interface UsedEmissionFactor { ... }

// factorExport.ts
type FactorExportRow = Record<string, string | number>;

// licenseActivityHistory.ts
type ActionValues = Record<string, unknown>;
```

---

## Ordem de Execução

1. Migrar `trainingSchedules.ts` (simples, 2 logs)
2. Migrar `energyManagement.ts` (simples, 1 log)
3. Migrar `esg.ts` (simples, 3 logs)
4. Migrar `licenseActivityHistory.ts` (1 log + 4 types)
5. Migrar `supplierDashboard.ts` (3 logs + 1 type)
6. Migrar `dataExport.ts` (6 logs + 7 types)
7. Migrar `griReports.ts` (4 logs + 4 types)
8. Corrigir types em `ghgReports.ts` (3 types)
9. Corrigir types em `factorExport.ts` (7 types)

---

## Métricas Esperadas deste Batch

| Métrica | Antes | Depois |
|---------|-------|--------|
| Services migrados | 21 | 30 |
| Console logs removidos | ~70 | ~90 |
| `any` types corrigidos | ~15 | ~50 |

---

## Notas Técnicas

### Padrão de Migração Logger

```typescript
// Adicionar import no topo
import { logger } from '@/utils/logger';

// console.error → logger.error
console.error('Message:', error);
→ logger.error('Message', error, 'category');

// console.log → logger.debug
console.log('Message:', data);
→ logger.debug('Message', 'category', { data });

// console.warn → logger.warn
console.warn('Message');
→ logger.warn('Message', 'category');
```

### Categorias do Logger Utilizadas

| Service | Categoria |
|---------|-----------|
| trainingSchedules | `training` |
| dataExport | `service` |
| griReports | `gri` |
| supplierDashboard | `supplier` |
| licenseActivityHistory | `compliance` |
| energyManagement | `emission` |
| esg | `api` |
| ghgReports | `emission` |
| factorExport | `emission` |
