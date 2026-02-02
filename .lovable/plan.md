
# Plano de Validacao de Integridade de Dados

## Resumo Executivo

Este plano aborda uma auditoria completa de integridade de dados no sistema Daton ESG Insight, identificando e corrigindo mock data, validando tipos de dados, e garantindo consistencia de enums e valores padrao.

---

## Diagnostico do Estado Atual

### Resumo de Problemas Identificados

| Categoria | Quantidade | Severidade |
|-----------|------------|------------|
| Mock data em componentes de producao | 5 arquivos | ALTA |
| Math.random() gerando dados fake | 8 arquivos | ALTA |
| Tipos `any[]` sem tipagem estrita | 87 arquivos | MEDIA |
| console.log em services | 64 arquivos | BAIXA |
| Enums inconsistentes | 203 arquivos | MEDIA |

### Arquivos com Mock Data Critico (Prioridade ALTA)

| Arquivo | Problema | Impacto |
|---------|----------|---------|
| `src/components/compliance/ComplianceAuditTrail.tsx` | Mock data hardcoded para auditoria | Dados falsos em producao |
| `src/components/StrategicAssociations.tsx` | Mock risks e indicators | Associacoes estrategicas com dados fake |
| `src/components/GoalTrackingWidget.tsx` | `Math.random()` para progresso historico | Graficos com valores aleatorios |
| `src/services/intelligentReporting.ts` | `Math.random()` em analytics | Metricas de IA falsas |
| `src/services/avantgardeFrameworks.ts` | `Math.random()` para readiness_score | Scores de frameworks aleatorios |
| `src/pages/BeneficiosRemuneracao.tsx` | `Math.random()` para salarios | Salarios ficticios exibidos |
| `src/pages/DashboardGHG.tsx` | `Math.random()` para cores de graficos | Cores inconsistentes |

### Estado de Conformidade por Categoria

| Regra | Status Atual | Acao Necessaria |
|-------|--------------|-----------------|
| Strings: nunca null, usar "" | Parcial | Alguns locais usam null para strings |
| Numbers: nunca undefined, usar 0 ou null | OK | Maioria correta |
| Booleans: true/false, nunca truthy | OK | Uso correto de `=== true` |
| Dates: ISO 8601 | OK | `parseDateSafe()` implementado |
| Enums: allowlist | Parcial | Alguns valores dispersos |
| Arrays: [] se vazio | OK | Padrao `[] as any[]` usado |

---

## Plano de Correcoes

### TAREFA 1: Remover Mock Data

#### 1.1 ComplianceAuditTrail.tsx - Mock auditTrailData

**Problema:** Array hardcoded com 5 registros de auditoria falsos (linhas 19-77)

**Correcao:**
```typescript
// ANTES (mock data)
const auditTrailData = [
  { id: '1', action: 'task_created', ... },
  ...
];

// DEPOIS (buscar do banco ou mostrar estado vazio)
export function ComplianceAuditTrail() {
  const { data: auditTrailData = [], isLoading } = useQuery({
    queryKey: ['compliance-audit-trail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) return <Skeleton />;
  if (auditTrailData.length === 0) {
    return <EmptyState message="Nenhuma atividade registrada" />;
  }
  // ... render real data
}
```

#### 1.2 StrategicAssociations.tsx - Mock risks e indicators

**Problema:** Linhas 124-138 retornam arrays mock para tipos 'risk' e 'indicator'

**Correcao:**
```typescript
// ANTES
case 'risk':
  items = [
    { id: 'risk-1', title: 'Risco Operacional', ... },
    { id: 'risk-2', title: 'Risco Financeiro', ... }
  ];
  break;

// DEPOIS
case 'risk':
  const { data: risks } = await supabase
    .from('esg_risks')
    .select('id, title, status')
    .eq('company_id', companyId)
    .limit(10);
  items = (risks || []).map(r => ({
    id: r.id,
    title: r.title,
    type: 'risk' as const,
    status: r.status
  }));
  break;

case 'indicator':
  const { data: indicators } = await supabase
    .from('gri_indicators')
    .select('id, indicator_code, indicator_name')
    .limit(10);
  items = (indicators || []).map(ind => ({
    id: ind.id,
    title: `${ind.indicator_code} - ${ind.indicator_name}`,
    type: 'indicator' as const,
    status: 'active'
  }));
  break;
```

#### 1.3 GoalTrackingWidget.tsx - Math.random() para progresso

**Problema:** Linha 92 usa `Math.random()` para gerar progresso historico

**Correcao:**
```typescript
// ANTES
const actualProgress = i === monthsTotal ? currentProgress : Math.random() * expectedProgress;

// DEPOIS - Usar dados reais ou null para meses futuros
const actualProgress = i === monthsTotal 
  ? currentProgress 
  : i <= currentMonthIndex 
    ? (goal.historical_progress?.[i] ?? null) 
    : null;
```

#### 1.4 intelligentReporting.ts - Analytics com Math.random()

**Problema:** Linhas 261-276 geram metricas de IA com valores aleatorios

**Correcao:**
```typescript
// ANTES
async getReportingAnalytics() {
  return {
    total_reports_generated: Math.floor(Math.random() * 100) + 50,
    ai_accuracy_average: Math.floor(Math.random() * 20) + 80,
    ...
  };
}

// DEPOIS - Retornar zeros ou buscar dados reais
async getReportingAnalytics() {
  const { data: metrics } = await supabase
    .from('ai_metrics_daily')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(30);

  if (!metrics || metrics.length === 0) {
    return {
      total_reports_generated: 0,
      ai_accuracy_average: 0,
      insights_generated: 0,
      time_saved_hours: 0,
      top_categories: [],
      monthly_trend: []
    };
  }
  // Calculate real metrics from data
  return this.calculateRealMetrics(metrics);
}
```

#### 1.5 avantgardeFrameworks.ts - readiness_score aleatorio

**Problema:** Linha 677 gera score aleatorio para frameworks

**Correcao:**
```typescript
// ANTES
readiness_score: Math.floor(Math.random() * 40) + 20, // Placeholder

// DEPOIS
readiness_score: 0, // Score real calculado apos avaliacao
```

#### 1.6 BeneficiosRemuneracao.tsx - Salarios aleatorios

**Problema:** Linha 466 gera salarios com Math.random()

**Correcao:**
```typescript
// ANTES
<p className="font-medium">R$ {(Math.random() * 8000 + 3000).toLocaleString('pt-BR', {...})}</p>

// DEPOIS - Usar dado real do funcionario ou placeholder "-"
<p className="font-medium">
  {employee.salary 
    ? `R$ ${employee.salary.toLocaleString('pt-BR', {...})}`
    : '-'
  }
</p>
```

#### 1.7 DashboardGHG.tsx - Cores aleatorias

**Problema:** Linha 186 gera cores aleatorias para graficos

**Correcao:**
```typescript
// ANTES
color: "#" + Math.floor(Math.random()*16777215).toString(16)

// DEPOIS - Usar paleta fixa deterministica
const CATEGORY_COLORS: Record<string, string> = {
  'Combustao Estacionaria': '#2563eb',
  'Combustao Movel': '#16a34a',
  'Processos Industriais': '#ea580c',
  'Fugitivas': '#9333ea',
  'Outros': '#64748b'
};

color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Outros']
```

---

### TAREFA 2: Validacao de Tipos

#### 2.1 Criar Utilitario de Normalizacao

**Arquivo:** `src/utils/dataNormalization.ts` (NOVO)

```typescript
/**
 * Normaliza valores para tipos seguros
 */

// Strings: nunca null, usar ""
export function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Numbers: usar 0 como default para calculos, null para "nao informado"
export function normalizeNumber(value: unknown, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

export function normalizeNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Booleans: true/false, nunca truthy
export function normalizeBoolean(value: unknown, defaultValue: boolean = false): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 'true' || value === '1' || value === 1) return true;
  return defaultValue;
}

// Dates: ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ)
export function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export function normalizeDatetime(value: unknown): string | null {
  if (!value) return null;
  
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString(); // Full ISO 8601
}

// Arrays: [] se vazio
export function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  return [];
}

// Enums: validar contra allowlist
export function normalizeEnum<T extends string>(
  value: unknown, 
  allowlist: readonly T[], 
  defaultValue: T
): T {
  if (allowlist.includes(value as T)) {
    return value as T;
  }
  return defaultValue;
}
```

#### 2.2 Definir Allowlists de Enums

**Arquivo:** `src/types/enums.ts` (NOVO)

```typescript
/**
 * Enums centralizados com allowlists para validacao
 */

// Status de Nao Conformidade
export const NC_STATUS = ['Aberta', 'Em Andamento', 'Fechada', 'Cancelada'] as const;
export type NCStatus = typeof NC_STATUS[number];

// Status de Licenca
export const LICENSE_STATUS = ['Ativa', 'Vencida', 'Em Renovacao', 'Suspensa', 'Cancelada'] as const;
export type LicenseStatus = typeof LICENSE_STATUS[number];

// Status de Tarefa
export const TASK_STATUS = ['Pendente', 'Em Andamento', 'Concluída', 'Atrasada', 'Cancelada'] as const;
export type TaskStatus = typeof TASK_STATUS[number];

// Status de Meta
export const GOAL_STATUS = ['Em Progresso', 'Concluída', 'Atrasada', 'Cancelada'] as const;
export type GoalStatus = typeof GOAL_STATUS[number];

// Severidade
export const SEVERITY_LEVELS = ['Baixa', 'Média', 'Alta', 'Crítica'] as const;
export type Severity = typeof SEVERITY_LEVELS[number];

// Prioridade
export const PRIORITY_LEVELS = ['Baixa', 'Normal', 'Alta', 'Urgente'] as const;
export type Priority = typeof PRIORITY_LEVELS[number];

// Status de Aprovacao
export const APPROVAL_STATUS = ['pendente', 'aprovado', 'rejeitado', 'em_revisao'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUS[number];

// Escopo de Emissoes
export const EMISSION_SCOPES = [1, 2, 3] as const;
export type EmissionScope = typeof EMISSION_SCOPES[number];

// Genero
export const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'] as const;
export type Gender = typeof GENDER_OPTIONS[number];

// Status de Funcionario
export const EMPLOYEE_STATUS = ['Ativo', 'Inativo', 'Afastado', 'Férias', 'Desligado'] as const;
export type EmployeeStatus = typeof EMPLOYEE_STATUS[number];
```

#### 2.3 Aplicar Normalizacao em Services

**Exemplo de refatoracao em `src/services/employees.ts`:**

```typescript
import { normalizeString, normalizeDate, normalizeEnum } from '@/utils/dataNormalization';
import { EMPLOYEE_STATUS, EmployeeStatus } from '@/types/enums';

// Ao inserir/atualizar funcionario
const normalizedData = {
  full_name: normalizeString(data.full_name),
  email: normalizeString(data.email).toLowerCase(),
  phone: normalizeString(data.phone),
  cpf: normalizeString(data.cpf).replace(/\D/g, ''),
  hire_date: normalizeDate(data.hire_date),
  birth_date: normalizeDate(data.birth_date),
  status: normalizeEnum(data.status, EMPLOYEE_STATUS, 'Ativo'),
  salary: data.salary ? Number(data.salary) : null,
  skills: normalizeArray(data.skills),
};
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/utils/dataNormalization.ts` | Utilitarios de normalizacao de tipos |
| `src/types/enums.ts` | Allowlists centralizadas de enums |

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/compliance/ComplianceAuditTrail.tsx` | Remover mock data, buscar dados reais |
| `src/components/StrategicAssociations.tsx` | Buscar risks e indicators do banco |
| `src/components/GoalTrackingWidget.tsx` | Remover Math.random() |
| `src/services/intelligentReporting.ts` | Retornar zeros ou dados reais |
| `src/services/avantgardeFrameworks.ts` | Remover readiness_score aleatorio |
| `src/pages/BeneficiosRemuneracao.tsx` | Usar salario real ou placeholder |
| `src/pages/DashboardGHG.tsx` | Usar paleta de cores fixa |

---

## Checklist de Validacao

### Mock Data

- [ ] Nenhum Lorem Ipsum no codigo
- [ ] Nenhum Math.random() para dados de negocio
- [ ] Nenhum array hardcoded com dados fake
- [ ] Todos os componentes buscam dados do banco ou mostram estado vazio

### Tipos de Dados

- [ ] Strings: "" para vazios, nunca null
- [ ] Numbers: 0 ou null explicito, nunca undefined
- [ ] Booleans: true/false literais
- [ ] Dates: Formato ISO 8601 (YYYY-MM-DD)
- [ ] Enums: Valores validados contra allowlist
- [ ] Arrays: [] para vazios

### Qualidade de Codigo

- [ ] Nenhum `any[]` sem justificativa
- [ ] console.log removidos de services
- [ ] Tipagem estrita em interfaces

---

## Ordem de Execucao

1. **Fase 1:** Criar arquivos de utilitarios (dataNormalization.ts, enums.ts)
2. **Fase 2:** Remover mock data de componentes criticos (7 arquivos)
3. **Fase 3:** Refatorar services para usar normalizacao
4. **Fase 4:** Adicionar validacao de enums em formularios
5. **Fase 5:** Testes de regressao

---

## Metricas de Sucesso

| Metrica | Antes | Depois |
|---------|-------|--------|
| Arquivos com mock data | 5 | 0 |
| Uso de Math.random() em dados | 8 | 0 |
| Componentes mostrando dados fake | 7 | 0 |
| Enums validados contra allowlist | 0% | 100% |
