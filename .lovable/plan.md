

# Plano: Corrigir Erro de Exclusao de Funcionario

## Diagnostico

O erro "Erro desconhecido" ao excluir funcionarios ocorre porque:

1. A funcao `deleteEmployee` em `src/services/employees.ts` nao tem tratamento detalhado de erros
2. O hook `useDeleteEmployee` nao tem callback `onError` para capturar e exibir mensagens uteis
3. O erro cai no handler global do QueryClient que mostra "Erro desconhecido" para erros nao categorizados
4. O bloco catch no EmployeeModal tenta mostrar um toast, mas o erro ja foi processado pelo QueryClient

O funcionario Douglas existe no banco de dados com `company_id` correto, entao o problema nao e RLS. O erro pode estar relacionado a:
- Registros dependentes em tabelas relacionadas (employee_trainings, benefit_enrollments, etc.)
- Falta de constraint ON DELETE CASCADE nas foreign keys
- Erro silencioso no banco sem mensagem clara

---

## Solucao

### Parte 1: Melhorar tratamento de erro no deleteEmployee

**Arquivo:** `src/services/employees.ts`

Atualizar a funcao `deleteEmployee` para:
1. Deletar registros dependentes primeiro (experiencias, formacoes, documentos)
2. Fornecer mensagens de erro claras

```typescript
export const deleteEmployee = async (id: string) => {
  // Deletar registros relacionados primeiro
  await supabase.from('employee_experiences').delete().eq('employee_id', id);
  await supabase.from('employee_education').delete().eq('employee_id', id);
  await supabase.from('benefit_enrollments').delete().eq('employee_id', id);
  await supabase.from('employee_trainings').delete().eq('employee_id', id);
  
  // Agora deletar o funcionario
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir funcionario:', error);
    throw new Error(error.message || 'Nao foi possivel excluir o funcionario');
  }
};
```

### Parte 2: Adicionar onError no useDeleteEmployee

**Arquivo:** `src/services/employees.ts`

Adicionar callback `onError` ao hook para capturar erros especificos:

```typescript
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
    },
    onError: (error: Error) => {
      console.error('Erro na mutacao de exclusao:', error);
      // O erro sera propagado para o componente tratar
    },
  });
};
```

### Parte 3: Melhorar tratamento no EmployeeModal

**Arquivo:** `src/components/EmployeeModal.tsx`

Atualizar o bloco catch para exibir mensagens mais uteis:

```typescript
} catch (error: any) {
  console.error('Erro ao excluir funcionario:', error);
  const errorMessage = error?.message || 'Erro desconhecido ao excluir funcionario';
  toast.error('Erro ao excluir funcionario', {
    description: errorMessage,
  });
}
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/employees.ts` | Deletar registros dependentes antes do funcionario; melhorar mensagem de erro |
| `src/services/employees.ts` | Adicionar `onError` ao `useDeleteEmployee` |
| `src/components/EmployeeModal.tsx` | Exibir mensagem de erro detalhada no toast |

---

## Resultado Esperado

1. Exclusao funciona mesmo quando ha registros relacionados (experiencias, formacoes, etc.)
2. Mensagens de erro claras e especificas em caso de falha
3. Logs detalhados no console para debugging

