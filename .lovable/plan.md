

# Plano de Correção: Funcionários não aparecem na criação de Programas de Treinamento

## Diagnóstico do Problema

### Causa Raiz Identificada

O problema ocorre porque **as query keys usadas nos modais de treinamento não são invalidadas quando funcionários são criados/atualizados**.

Quando um funcionário é cadastrado:

```text
┌─────────────────────────┐      ┌──────────────────────────────┐
│  useCreateEmployee()    │ ---> │  Invalida apenas:            │
│  (src/services/         │      │  - ['employees']             │
│   employees.ts)         │      │  - ['employees-paginated']   │
│                         │      │  - ['employees-stats']       │
└─────────────────────────┘      └──────────────────────────────┘
                                           |
                                           v
                          ┌────────────────────────────────────────┐
                          │  NÃO invalida:                         │
                          │  - ['employees-for-training-modal']    │
                          │  - ['employees-for-training-modal-2']  │
                          │  - ['employees-for-schedule']          │
                          │  - ['employees-for-reschedule']        │
                          └────────────────────────────────────────┘
```

### Evidências

1. **TrainingProgramModal.tsx** (linha 107): Query key `["employees-for-training-modal"]`
2. **EmployeeTrainingModal.tsx** (linha 105): Query key `["employees-for-training-modal-2"]`
3. **useCreateEmployee** (linha 386-388): Invalida apenas `['employees']`, `['employees-paginated']`, `['employees-stats']`

Mesmo com `staleTime: 0`, os dados só são refetch quando:
- A query é remontada (modal abre novamente após fechamento completo)
- A query é explicitamente invalidada
- O usuário faz refresh na página

---

## Solução Proposta

### Opção A: Invalidar todas as queries de funcionários (Recomendada)

Adicionar invalidação das queries específicas usadas nos modais de treinamento quando funcionários são criados/atualizados/excluídos.

**Arquivo a modificar:** `src/services/employees.ts`

```typescript
// useCreateEmployee (linha 385-389)
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['employees'] });
  queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
  queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
  // ADICIONAR - Invalidar queries de treinamento
  queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal'] });
  queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal-2'] });
  queryClient.invalidateQueries({ queryKey: ['employees-for-schedule'] });
  queryClient.invalidateQueries({ queryKey: ['employees-for-reschedule'] });
},
```

Aplicar a mesma correção em:
- `useUpdateEmployee` (linha 398-402)
- `useDeleteEmployee` (linha 410-414)

### Opção B: Padronizar query keys (Melhoria de longo prazo)

Unificar todas as queries de funcionários sob uma query key base comum, permitindo invalidação por prefixo.

**Mudança nas queries:**
- Mudar de: `["employees-for-training-modal"]`
- Para: `["employees", "training-modal"]`

Depois usar invalidação por prefixo:
```typescript
queryClient.invalidateQueries({ queryKey: ['employees'] });
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/services/employees.ts` | Adicionar invalidação das queries de treinamento em `useCreateEmployee`, `useUpdateEmployee`, `useDeleteEmployee` |

---

## Correção Detalhada

### 1. Atualizar useCreateEmployee

Linha ~385-389 em `src/services/employees.ts`:

```typescript
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      // Queries principais de funcionários
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      // Queries de modais de treinamento
      queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal-2'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-reschedule'] });
      // Queries de company employees
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
    },
  });
};
```

### 2. Atualizar useUpdateEmployee

Linha ~398-402:

```typescript
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Employee> }) =>
      updateEmployee(id, updates),
    onSuccess: () => {
      // Queries principais de funcionários
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      // Queries de modais de treinamento
      queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal-2'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-reschedule'] });
      // Queries de company employees
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
    },
  });
};
```

### 3. Atualizar useDeleteEmployee

Linha ~410-414:

```typescript
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      // Queries principais de funcionários
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      // Queries de modais de treinamento
      queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-training-modal-2'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['employees-for-reschedule'] });
      // Queries de company employees
      queryClient.invalidateQueries({ queryKey: ['company-employees'] });
    },
    onError: (error: Error) => {
      logger.error('Erro na mutação de exclusão', error, 'service');
    },
  });
};
```

---

## Melhoria Adicional (Opcional)

### Criar função helper para invalidar todas as queries de funcionários

```typescript
// Em src/services/employees.ts

const invalidateAllEmployeeQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
  const employeeQueryKeys = [
    ['employees'],
    ['employees-paginated'],
    ['employees-stats'],
    ['employees-for-training-modal'],
    ['employees-for-training-modal-2'],
    ['employees-for-schedule'],
    ['employees-for-reschedule'],
    ['company-employees'],
  ];
  
  employeeQueryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: key });
  });
};
```

Depois usar em cada mutation:
```typescript
onSuccess: () => {
  invalidateAllEmployeeQueries(queryClient);
},
```

---

## Resultado Esperado

Após a correção:
1. Ao cadastrar um novo funcionário, o modal de criação de programa de treinamento exibirá o funcionário recém-cadastrado
2. Ao atualizar o status de um funcionário, os modais refletirão a mudança
3. Ao excluir um funcionário, ele desaparecerá imediatamente dos modais de treinamento

