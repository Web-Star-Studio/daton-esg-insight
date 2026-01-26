
## Plano: Corrigir Problema de Timezone na Gestao de Treinamentos

### Problema Identificado

O mesmo problema de timezone encontrado nos funcionarios tambem afeta a gestao de treinamentos. Quando o JavaScript interpreta datas no formato `"YYYY-MM-DD"` usando `new Date()`, ele assume **meia-noite UTC**, que no Brasil (UTC-3) corresponde a **21:00 do dia anterior**, causando o deslocamento de 1 dia.

---

### Arquivos Afetados

| Arquivo | Linhas | Problema |
|---------|--------|----------|
| `src/utils/trainingStatusCalculator.ts` | 31-32 | `new Date(training.start_date)` e `new Date(training.end_date)` |
| `src/components/EmployeeTrainingModal.tsx` | 153 | `new Date(training.completion_date)` |
| `src/components/TrainingReportsModal.tsx` | 54, 93, 245 | `new Date(training.completion_date)` em filtros e formatacao |
| `src/components/TrainingComplianceMatrix.tsx` | 80, 93 | `new Date(training.completion_date)` no calculo de expiracao |
| `src/pages/GestaoTreinamentos.tsx` | 791 | `format(new Date(training.completion_date), ...)` |
| `src/components/AddEmployeeTrainingDialog.tsx` | 92, 271 | `new Date(formData.completion_date)` |
| `src/components/EditEmployeeTrainingDialog.tsx` | 287 | `new Date(calculateExpirationDate()!)` |

---

### Correcoes Necessarias

#### 1. `src/utils/trainingStatusCalculator.ts`

Adicionar import e usar `parseDateSafe`:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';

// Linhas 31-32:
const startDate = training.start_date ? parseDateSafe(training.start_date) : null;
const endDate = training.end_date ? parseDateSafe(training.end_date) : null;
```

---

#### 2. `src/components/EmployeeTrainingModal.tsx`

Adicionar import e usar no reset do form:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';

// Linha 153:
completion_date: training.completion_date ? parseDateSafe(training.completion_date) ?? undefined : undefined,
```

---

#### 3. `src/components/TrainingReportsModal.tsx`

Adicionar import e corrigir tres locais:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';

// Linha 54 - filtro:
const completionDate = parseDateSafe(training.completion_date);
if (!completionDate) return true;

// Linha 93 - CSV:
completionDate: training.completion_date 
  ? format(parseDateSafe(training.completion_date) || new Date(), 'dd/MM/yyyy') 
  : 'N/A',

// Linha 245 - exibicao:
{training.completion_date 
  ? `Concluido em ${format(parseDateSafe(training.completion_date) || new Date(), 'dd/MM/yyyy', { locale: ptBR })}` 
  : 'Em andamento'}
```

---

#### 4. `src/components/TrainingComplianceMatrix.tsx`

Adicionar import e corrigir funcoes `isExpiringSoon` e `isExpired`:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';

// Linha 80 (isExpiringSoon):
const completionDate = parseDateSafe(training.completion_date);
if (!completionDate) return false;
const expirationDate = new Date(completionDate);

// Linha 93 (isExpired):
const completionDate = parseDateSafe(training.completion_date);
if (!completionDate) return false;
const expirationDate = new Date(completionDate);
```

---

#### 5. `src/pages/GestaoTreinamentos.tsx`

Adicionar import e usar na exibicao:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';
import { formatDateDisplay } from '@/utils/dateUtils';

// Linha 791:
Concluido em {formatDateDisplay(training.completion_date) || 'N/A'}
```

---

#### 6. `src/components/AddEmployeeTrainingDialog.tsx`

Adicionar import e corrigir calculo de expiracao:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';

// Linha 92 (calculateExpirationDate):
const completionDate = parseDateSafe(formData.completion_date);
if (!completionDate) return null;
const expirationDate = addMonths(completionDate, selectedProgram.valid_for_months);

// Linha 271:
{calculateExpirationDate() 
  ? format(parseDateSafe(calculateExpirationDate()!) || new Date(), 'dd/MM/yyyy')
  : '-'}
```

---

#### 7. `src/components/EditEmployeeTrainingDialog.tsx`

Adicionar import e corrigir formatacao:

```typescript
import { parseDateSafe } from '@/utils/dateUtils';

// Linha 287:
{calculateExpirationDate() 
  ? format(parseDateSafe(calculateExpirationDate()!) || new Date(), 'dd/MM/yyyy')
  : '-'}
```

---

### Resumo das Alteracoes

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/utils/trainingStatusCalculator.ts` | Import + 2 linhas |
| `src/components/EmployeeTrainingModal.tsx` | Import + 1 linha |
| `src/components/TrainingReportsModal.tsx` | Import + 3 linhas |
| `src/components/TrainingComplianceMatrix.tsx` | Import + 2 funcoes |
| `src/pages/GestaoTreinamentos.tsx` | Import + 1 linha |
| `src/components/AddEmployeeTrainingDialog.tsx` | Import + 2 locais |
| `src/components/EditEmployeeTrainingDialog.tsx` | Import + 1 linha |

**Total: 7 arquivos, ~15 alteracoes**

---

### Resultado Esperado

Apos as correcoes:
- Data de inicio/fim do programa exibida corretamente
- Data de conclusao de treinamentos exibida corretamente  
- Calculo de status automatico correto (Planejado/Em Andamento/Concluido)
- Calculo de expiracao de certificados correto
- Filtros por data funcionando corretamente
- Exportacao CSV com datas corretas
