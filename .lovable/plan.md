
## Plano: Corrigir Cache de Funcionários no Modal de Programa de Treinamento

### Problema Identificado

Funcionarios recém-cadastrados não aparecem no modal "Novo Programa de Treinamento" porque:

1. **Cache global de 5 minutos**: O `QueryClient` em `App.tsx` (linha 208) define `staleTime: 1000 * 60 * 5` (5 minutos) para todas as queries
2. **A query `employees-for-training-modal`** (linha 107 em `TrainingProgramModal.tsx`) não sobrescreve esse comportamento
3. **Resultado**: A lista de funcionários fica em cache por 5 minutos, mostrando dados desatualizados

---

### Solucao

Adicionar `staleTime: 0` na query de funcionários do modal para que ela sempre busque dados frescos quando o modal for aberto.

---

### Alteracoes Tecnicas

#### Arquivo: `src/components/TrainingProgramModal.tsx`

**Linhas 106-121** - Adicionar `staleTime: 0` para forcar refetch:

```typescript
// Query para buscar funcionários ativos (case-insensitive e múltiplos status)
const { data: employees = [] } = useQuery({
  queryKey: ["employees-for-training-modal"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, employee_code, department, status")
      .order("full_name");
    if (error) throw error;
    // Filtrar localmente para ser case-insensitive e incluir múltiplos status válidos
    const activeStatuses = ['ativo', 'férias', 'ferias', 'licença', 'licenca'];
    return (data || []).filter(emp => 
      emp.status && activeStatuses.includes(emp.status.toLowerCase())
    );
  },
  enabled: open,
  staleTime: 0, // NOVO: Sempre buscar dados frescos ao abrir o modal
});
```

---

### Comportamento Apos Correcao

| Cenario | Antes | Depois |
|---------|-------|--------|
| Abrir modal 1min apos cadastrar funcionario | Nao aparece (cache) | Aparece imediatamente |
| Abrir modal 10min apos cadastrar funcionario | Aparece (cache expirou) | Aparece imediatamente |
| Performance | Menos requisicoes | 1 requisicao extra por abertura do modal |

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/TrainingProgramModal.tsx` | Adicionar `staleTime: 0` na query de funcionarios (linha 120) |

---

### Justificativa

O custo de uma requisicao extra ao abrir o modal eh insignificante comparado a experiencia negativa do usuario ao nao encontrar o funcionario que acabou de cadastrar. A query ja esta filtrada para retornar apenas colunas necessarias, minimizando o payload.
