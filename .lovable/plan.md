
# Plano de Otimizacao: Performance da Tela de Gestao de Treinamentos

## Diagnostico do Problema

### Causa Raiz: N+1 Query Problem

A funcao `getTrainingPrograms()` em `src/services/trainingPrograms.ts` tem um **problema critico de performance** nas linhas 59-85:

```text
┌──────────────────────────────────────────────────────────────────┐
│  1. Busca todos os programas de treinamento                     │
│     SELECT * FROM training_programs ORDER BY name               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  2. Para CADA programa, faz uma query separada:                 │
│     await checkHasEfficacyEvaluation(supabase, program.id)      │
│                                                                  │
│     SELECT id FROM training_efficacy_evaluations                 │
│     WHERE training_program_id = ? AND status = 'Concluida'      │
│     LIMIT 1                                                      │
└──────────────────────────────────────────────────────────────────┘
```

**Impacto:** Se existem 50 programas de treinamento, sao feitas **51 queries** ao banco de dados (1 principal + 50 verificacoes de eficacia).

### Problemas Adicionais Identificados

1. **Invalidacao Excessiva no Mount** (linhas 105-109)
   - Toda vez que a pagina carrega, invalida 3 queries forçando refetch completo
   - Combinado com `staleTime: 0`, garante que SEMPRE busque do servidor

2. **Query de Metricas Pesada** (`getTrainingMetrics`)
   - Faz 3 queries grandes (trainings, programs, employees)
   - Processa tudo no cliente sem paginacao

3. **Sem Cache Efetivo**
   - `staleTime: 0` nas queries principais
   - `refetchOnMount: 'always'` força novo fetch a cada visita

---

## Solucao Proposta

### Correcao 1: Eliminar N+1 com Batch Query

**Arquivo:** `src/services/trainingPrograms.ts`

Buscar todas as avaliacoes de eficacia de uma vez so, em vez de uma query por programa:

```typescript
export const getTrainingPrograms = async () => {
  // Busca programas
  const { data: programs, error } = await supabase
    .from('training_programs')
    .select('*')
    .order('name');

  if (error) throw error;
  if (!programs || programs.length === 0) return [];

  // OTIMIZACAO: Buscar TODAS as avaliacoes de eficacia em UMA query
  const programIds = programs
    .filter(p => p.start_date || p.end_date)
    .map(p => p.id);
  
  let efficacyMap: Record<string, boolean> = {};
  
  if (programIds.length > 0) {
    const { data: evaluations, error: evalError } = await supabase
      .from('training_efficacy_evaluations')
      .select('training_program_id')
      .in('training_program_id', programIds)
      .eq('status', 'Concluída');
    
    if (!evalError && evaluations) {
      evaluations.forEach(e => {
        efficacyMap[e.training_program_id] = true;
      });
    }
  }

  // Calcular status usando o mapa (sem queries adicionais)
  const legacyStatuses = ['Ativo', 'Inativo', 'Suspenso', 'Arquivado'];

  return programs.map(program => {
    if (legacyStatuses.includes(program.status) && !program.start_date && !program.end_date) {
      return program;
    }
    
    if (program.start_date || program.end_date) {
      const hasEfficacy = efficacyMap[program.id] || false;
      const calculatedStatus = calculateTrainingStatus({
        start_date: program.start_date,
        end_date: program.end_date,
        efficacy_evaluation_deadline: program.efficacy_evaluation_deadline,
        hasEfficacyEvaluation: hasEfficacy,
      });
      
      return { ...program, status: calculatedStatus };
    }
    
    return program;
  });
};
```

**Resultado:** De N+1 queries para apenas **2 queries** (programas + avaliacoes).

### Correcao 2: Remover Invalidacao Agressiva

**Arquivo:** `src/pages/GestaoTreinamentos.tsx`

Remover ou condicionar o useEffect que invalida queries no mount:

```typescript
// REMOVER este useEffect completamente ou tornar opcional
// React.useEffect(() => {
//   queryClient.invalidateQueries({ queryKey: ['training-programs'] });
//   queryClient.invalidateQueries({ queryKey: ['employee-trainings'] });
//   queryClient.invalidateQueries({ queryKey: ['training-metrics'] });
// }, [queryClient]);
```

### Correcao 3: Adicionar Cache Efetivo

**Arquivo:** `src/pages/GestaoTreinamentos.tsx`

Configurar staleTime razoavel para permitir cache:

```typescript
// Training programs - dados mudam com pouca frequencia
const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
  queryKey: ['training-programs'],
  queryFn: getTrainingPrograms,
  staleTime: 2 * 60 * 1000, // 2 minutos de cache
  // Remover refetchOnMount: 'always'
});

// Employee trainings
const { data: employeeTrainings = [] } = useQuery({
  queryKey: ['employee-trainings'],
  queryFn: getEmployeeTrainings,
  retry: 3,
  staleTime: 60 * 1000, // 1 minuto de cache
});

// Training metrics - dados agregados, pode ter cache maior
const { data: trainingMetrics } = useQuery({
  queryKey: ['training-metrics'],
  queryFn: getTrainingMetrics,
  staleTime: 3 * 60 * 1000, // 3 minutos de cache
});
```

---

## Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/services/trainingPrograms.ts` | Otimizar `getTrainingPrograms()` com batch query |
| `src/pages/GestaoTreinamentos.tsx` | Remover invalidacao no mount, ajustar staleTime |

---

## Estimativa de Melhoria

| Metrica | Antes | Depois |
|---------|-------|--------|
| Queries ao carregar (50 programas) | 51+ | 2-5 |
| Tempo estimado primeiro load | 3-5s | 0.5-1s |
| Cache entre navegacoes | Nenhum | 2 minutos |
| Requests em visitas subsequentes | 51+ | 0 (se dentro do cache) |

---

## Secao Tecnica

### Fluxo Otimizado

```text
┌─────────────────────────────┐
│  Primeiro Acesso            │
│  (fora do cache)            │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  Query 1: training_programs │
│  Query 2: efficacy_evals    │  ← Batch (IN clause)
│  Query 3: employee_trainings│
│  Query 4: metrics           │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  Cache por 2 minutos        │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  Acessos Subsequentes       │
│  (dentro do cache)          │
│  → Zero queries             │
└─────────────────────────────┘
```

### Invalidacao Inteligente

Manter invalidacao apenas apos acoes do usuario:

```typescript
// Ao criar/editar/excluir programa
queryClient.invalidateQueries({ queryKey: ['training-programs'] });
queryClient.invalidateQueries({ queryKey: ['training-metrics'] });
```

Isso garante dados frescos apos mudancas, mas evita refetch desnecessario no carregamento inicial.
