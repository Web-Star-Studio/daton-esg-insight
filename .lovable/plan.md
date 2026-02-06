
# Plano de Correção: Problema Sistêmico de Timezone em Datas

## Resumo do Teste End-to-End

### Verificações Realizadas

| Módulo | Status | Resultado |
|--------|--------|-----------|
| Gestão de Treinamentos | Testado | Datas corrigidas (27/01/2026) |
| Gestão de Desempenho | Código verificado | Correções aplicadas |
| Gestão de Stakeholders | Código verificado | Correção aplicada |
| Coleta de Dados | Código verificado | Correção aplicada |
| Análise de Materialidade | Código verificado | Correção aplicada |
| Formulários Customizados | Código verificado | Correção aplicada |

### Novo Problema Identificado: Timezone em Datas

Durante a varredura do codebase, identifiquei que **112 arquivos** ainda usam o padrão problemático:

```typescript
format(new Date(date), 'dd/MM/yyyy')
```

Este padrão causa o problema de "um dia atrás" devido à interpretação de timezone:
- JavaScript interpreta "2026-01-26" como meia-noite UTC
- No Brasil (UTC-3), meia-noite UTC = 21:00 do dia anterior
- Resultado: 26/01/2026 aparece como 25/01/2026

### Arquivos Críticos Afetados

| Arquivo | Linhas Afetadas | Contexto |
|---------|-----------------|----------|
| `SocialESG.tsx` | 486 | Datas de projetos sociais |
| `GoalTrackingWidget.tsx` | 222, 312 | Datas de metas ESG |
| `DesenvolvimentoCarreira.tsx` | 367, 760 | Datas de planos e vagas |
| `SupplierPerformanceEvaluationPage.tsx` | 348 | Datas de avaliações |
| `SupplierSurveysManagementPage.tsx` | 230, 402 | Datas de pesquisas |
| `FluxoCaixa.tsx` | 316 | Datas de transações |
| `LancamentosContabeis.tsx` | 41 | Datas de lançamentos |
| `AttendanceReportsModal.tsx` | 345 | Datas de frequência |
| `IndicatorTargetModal.tsx` | 353, 354 | Datas de metas |
| `LegislationHistoryTimeline.tsx` | 125, 126 | Datas de legislação |

---

## Solução Proposta

### Abordagem em 3 Fases

**Fase 1 - Imediata**: Corrigir os 10 arquivos mais críticos (páginas principais)

**Fase 2 - Componentes**: Corrigir modais e widgets reutilizáveis

**Fase 3 - Auditoria**: Varrer todo o codebase para garantir consistência

### Padrão de Correção

Em cada arquivo:

1. Adicionar import do utilitário:
```typescript
import { formatDateDisplay } from '@/utils/dateUtils';
```

2. Substituir todas as ocorrências:
```typescript
// ANTES
format(new Date(date), 'dd/MM/yyyy')

// DEPOIS  
formatDateDisplay(date)
```

---

## Arquivos a Modificar (Fase 1)

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/SocialESG.tsx` | Linha 486: usar `formatDateDisplay` |
| `src/pages/DesenvolvimentoCarreira.tsx` | Linhas 367, 760 |
| `src/pages/SupplierPerformanceEvaluationPage.tsx` | Linha 348 |
| `src/pages/SupplierSurveysManagementPage.tsx` | Linhas 230, 402 |
| `src/pages/FluxoCaixa.tsx` | Linha 316 |
| `src/pages/LancamentosContabeis.tsx` | Linha 41 |
| `src/components/GoalTrackingWidget.tsx` | Linhas 222, 312 |
| `src/components/AttendanceReportsModal.tsx` | Linha 345 |
| `src/components/IndicatorTargetModal.tsx` | Linhas 353, 354 |
| `src/components/legislation/LegislationHistoryTimeline.tsx` | Linhas 125, 126 |

---

## Exemplo de Correção

### SocialESG.tsx (Linha 486)

**Antes**:
```typescript
{project.start_date ? format(new Date(project.start_date), 'dd/MM/yyyy') : '-'} - {project.end_date ? format(new Date(project.end_date), 'dd/MM/yyyy') : '-'}
```

**Depois**:
```typescript
{project.start_date ? formatDateDisplay(project.start_date) : '-'} - {project.end_date ? formatDateDisplay(project.end_date) : '-'}
```

### GoalTrackingWidget.tsx (Linhas 222 e 312)

**Antes**:
```typescript
{goal.description || `Reduzir emissões para ${goal.target_value} tCO₂e até ${format(new Date(goal.deadline_date), 'dd/MM/yyyy')}`}
```

**Depois**:
```typescript
{goal.description || `Reduzir emissões para ${goal.target_value} tCO₂e até ${formatDateDisplay(goal.deadline_date)}`}
```

---

## Resumo das Correções Anteriores

### Correções Confirmadas Funcionando

1. **Race Condition em 7 páginas** - Todas as ocorrências de `enabled: isAuthenticated` e `enabled: !!user` em páginas protegidas foram removidas

2. **Data de Treinamentos** - Corrigida usando `formatDateDisplay`

3. **Busca de Avaliadores** - Corrigida usando `shouldFilter={false}` e `value` com nome

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Datas em todas as páginas | Possível 1 dia atrás | Data correta |
| Projetos Sociais | 25/01/2026 | 26/01/2026 |
| Metas ESG | 25/01/2026 | 26/01/2026 |
| Avaliações de Fornecedores | 25/01/2026 | 26/01/2026 |

---

## Seção Técnica

### Por que `formatDateDisplay` funciona?

A função usa o utilitário `parseDateSafe` que adiciona `T12:00:00` à string de data:

```typescript
export function parseDateSafe(dateString: string): Date | null {
  // Adiciona meio-dia para evitar problemas de timezone
  const normalized = `${dateString}T12:00:00`;
  return new Date(normalized);
}

export function formatDateDisplay(date: string | Date | null): string {
  const parsed = parseDateSafe(date);
  return parsed ? format(parsed, 'dd/MM/yyyy') : '-';
}
```

Meio-dia (12:00) é um "ponto seguro" - qualquer timezone do mundo (UTC-12 a UTC+14) não consegue empurrar meio-dia para outro dia.

### Padrão Consolidado

Este padrão já está documentado na memória do projeto:
- `memory/technical/timezone-safe-date-handling-standard`
- Aplicado em: Employees, Training, NC

Após esta correção, o padrão será aplicado em todo o sistema.
