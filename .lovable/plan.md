
## Plano: Corrigir Cache de Funcionarios em Todos os Modais de Treinamento

### Problema Identificado

Funcionarios recem-cadastrados nao aparecem imediatamente na lista de participantes porque varios modais de treinamento estao usando o cache global de 5 minutos. A correcao feita anteriormente no `TrainingProgramModal.tsx` resolveu o problema para aquele modal especifico, mas existem outros 3 modais de treinamento que apresentam o mesmo problema:

| Modal | Arquivo | Linha | Query Key | staleTime |
|-------|---------|-------|-----------|-----------|
| Novo Programa | `TrainingProgramModal.tsx` | 106-122 | `employees-for-training-modal` | **0 (ja corrigido)** |
| Agendar Sessao | `TrainingScheduleModal.tsx` | 108-111 | `employees` | 5 min (problema) |
| Registro Individual | `EmployeeTrainingModal.tsx` | 104-116 | `employees` | 5 min (problema) |
| Reagendar | `RescheduleTrainingModal.tsx` | 141-154 | `employees-for-training` | 5 min (problema) |

---

### Correcoes Necessarias

#### 1. `src/components/TrainingScheduleModal.tsx`

**Linhas 107-111** - Adicionar `staleTime: 0`:

```typescript
// Fetch employees
const { data: employees = [] } = useQuery({
  queryKey: ['employees-for-schedule'],
  queryFn: getEmployees,
  staleTime: 0, // Sempre buscar dados frescos
});
```

---

#### 2. `src/components/EmployeeTrainingModal.tsx`

**Linhas 103-116** - Adicionar `staleTime: 0`:

```typescript
// Fetch employees
const { data: employees = [] } = useQuery({
  queryKey: ["employees-for-training-modal-2"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, employee_code, department")
      .eq("status", "Ativo")
      .order("full_name");
    
    if (error) throw error;
    return data;
  },
  staleTime: 0, // Sempre buscar dados frescos
});
```

---

#### 3. `src/components/RescheduleTrainingModal.tsx`

**Linhas 140-154** - Adicionar `staleTime: 0`:

```typescript
// Fetch all employees for adding
const { data: allEmployees = [] } = useQuery({
  queryKey: ["employees-for-reschedule"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, employee_code, department")
      .eq("status", "Ativo")
      .order("full_name");
    
    if (error) throw error;
    return data;
  },
  enabled: open,
  staleTime: 0, // Sempre buscar dados frescos
});
```

---

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/TrainingScheduleModal.tsx` | Adicionar `staleTime: 0` na query de funcionarios |
| `src/components/EmployeeTrainingModal.tsx` | Adicionar `staleTime: 0` na query de funcionarios |
| `src/components/RescheduleTrainingModal.tsx` | Adicionar `staleTime: 0` na query de funcionarios |

**Total: 3 arquivos, 3 alteracoes simples**

---

### Resultado Esperado

Apos as correcoes, ao abrir qualquer modal de treinamento:
- **Novo Programa**: Lista atualizada (ja funcionando)
- **Agendar Sessao**: Lista atualizada (sera corrigido)
- **Registro Individual**: Lista atualizada (sera corrigido)
- **Reagendar**: Lista atualizada (sera corrigido)

O custo de performance e minimo (1 requisicao extra por abertura de modal) comparado ao beneficio de sempre ter dados atualizados.
