
## Plano: Corrigir Problema de Timezone nas Datas de Funcionários

### Problema Identificado

As datas de admissão (`hire_date`) e nascimento (`birth_date`) estão sendo exibidas **um dia antes** do valor inserido devido ao problema clássico de timezone do JavaScript:

- Quando o JavaScript interpreta `"2026-01-26"` como `new Date("2026-01-26")`, ele assume **meia-noite UTC**
- No fuso horário do Brasil (UTC-3), meia-noite UTC corresponde a **21:00 do dia anterior**
- Resultado: `2026-01-26` vira `25/01/2026` na exibição

O projeto já possui funções utilitárias em `src/utils/dateUtils.ts` (`parseDateSafe`, `formatDateDisplay`) que resolvem este problema, mas **não estão sendo usadas** em todos os locais necessários.

---

### Locais Afetados

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `src/components/EmployeesList.tsx` | 317 | `new Date(employee.hire_date).toLocaleDateString('pt-BR')` |
| `src/components/EmployeeDetailModal.tsx` | 154-157 | Função `formatDate` usa `new Date(dateStr)` |
| `src/components/EmployeeDetailModal.tsx` | 118-128 | Função `calculateAge` usa `new Date(birthDate)` |
| `src/components/EmployeeDetailModal.tsx` | 136-152 | Função `calculateTenure` usa `new Date(hireDate)` |
| `src/components/EmployeeModal.tsx` | 212 | Inicialização: `new Date().toISOString().split('T')[0]` |

---

### Correções Necessárias

#### 1. `src/components/EmployeesList.tsx`

**Linha 317** - Substituir:
```typescript
// ANTES
Admitido em: {new Date(employee.hire_date).toLocaleDateString('pt-BR')}

// DEPOIS
Admitido em: {formatDateDisplay(employee.hire_date)}
```

Adicionar import no topo:
```typescript
import { formatDateDisplay } from '@/utils/dateUtils';
```

---

#### 2. `src/components/EmployeeDetailModal.tsx`

**Linha 154-157** - Atualizar função `formatDate`:
```typescript
// ANTES
const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return 'Não informado';
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

// DEPOIS
const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return 'Não informado';
  const formatted = formatDateDisplay(dateStr);
  return formatted || 'Data inválida';
};
```

**Linhas 118-128** - Atualizar função `calculateAge`:
```typescript
// ANTES
const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  ...
};

// DEPOIS
const calculateAge = (birthDate: string) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = parseDateSafe(birthDate);
  if (!birth) return null;
  ...
};
```

**Linhas 136-152** - Atualizar função `calculateTenure`:
```typescript
// ANTES
const calculateTenure = (hireDate: string | undefined | null) => {
  if (!hireDate) return 'Não informado';
  const hire = new Date(hireDate);
  if (isNaN(hire.getTime())) return 'Data inválida';
  ...
};

// DEPOIS
const calculateTenure = (hireDate: string | undefined | null) => {
  if (!hireDate) return 'Não informado';
  const hire = parseDateSafe(hireDate);
  if (!hire) return 'Data inválida';
  ...
};
```

Adicionar import no topo:
```typescript
import { parseDateSafe, formatDateDisplay } from '@/utils/dateUtils';
```

---

#### 3. `src/components/EmployeeModal.tsx`

**Linha 212** - Inicialização da data atual (opcional, mas mais robusto):
```typescript
// ANTES
const today = new Date().toISOString().split('T')[0];

// DEPOIS
import { formatDateForDB } from '@/utils/dateUtils';
const today = formatDateForDB(new Date()) || '';
```

---

### Arquivos a Modificar

| Arquivo | Modificações |
|---------|--------------|
| `src/components/EmployeesList.tsx` | Importar `formatDateDisplay`, usar na linha 317 |
| `src/components/EmployeeDetailModal.tsx` | Importar `parseDateSafe` e `formatDateDisplay`, atualizar 3 funções |
| `src/components/EmployeeModal.tsx` | Usar `formatDateForDB` para inicialização (já importado) |

---

### Resultado Esperado

Após as correções:
- Data inserida: `26/01/2026`
- Data exibida na lista: `26/01/2026` (correto)
- Data exibida no modal de detalhes: `26/01/2026` (correto)
- Cálculo de idade: correto (sem desvio de 1 dia)
- Cálculo de tempo de empresa: correto

---

### Verificação

Para confirmar a correção, criar/editar um funcionário com:
- Data de Nascimento: `15/02/1999`
- Data de Admissão: `26/01/2026`

E verificar que as datas exibidas na lista e no modal são idênticas às inseridas.
