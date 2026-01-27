

## Plano: Exclusao Inteligente de Filiais com Limpeza de Vinculos

### Problema Identificado

Ao tentar excluir filiais sem codigo/localizacao pela interface `/gestao-filiais`, o sistema retorna erro de constraint de chave estrangeira:

```
update or delete on table "branches" violates foreign key constraint
"training_programs_branch_id_fkey" on table "training_programs"
```

Isso ocorre porque existem dados vinculados (programas de treinamento, assessments LAIA, compliance profiles) que precisam ser removidos antes da exclusao da filial.

---

### Solucao Proposta

Implementar uma funcao `deleteBranchWithDependencies` que:

1. **Remove dados vinculados** em ordem correta (respeitando foreign keys)
2. **Desvincula colaboradores** (set `branch_id = NULL`) ao inves de deletar
3. **Deleta a filial** apos limpeza completa

---

### Tabelas Afetadas (ordem de exclusao)

```text
1. training_efficacy_evaluations (via employee_trainings)
2. employee_trainings (vinculado a training_programs)
3. training_documents (vinculado a training_programs)
4. training_schedules (vinculado a training_programs)
5. training_programs (branch_id)
6. laia_assessments (branch_id)
7. legislation_unit_compliance (branch_id)
8. legislation_compliance_profiles (branch_id)
9. employees (SET branch_id = NULL)
10. branches (DELETE)
```

---

### Alteracoes Tecnicas

#### Arquivo 1: `src/services/branches.ts`

Criar nova funcao `deleteBranchWithDependencies`:

```typescript
export const deleteBranchWithDependencies = async (id: string) => {
  // 1. Buscar training_programs da filial
  const { data: programs } = await supabase
    .from('training_programs')
    .select('id')
    .eq('branch_id', id);
  
  const programIds = programs?.map(p => p.id) || [];
  
  if (programIds.length > 0) {
    // 2. Buscar employee_trainings desses programas
    const { data: trainings } = await supabase
      .from('employee_trainings')
      .select('id')
      .in('training_program_id', programIds);
    
    const trainingIds = trainings?.map(t => t.id) || [];
    
    // 3. Deletar efficacy evaluations
    if (trainingIds.length > 0) {
      await supabase
        .from('training_efficacy_evaluations')
        .delete()
        .in('employee_training_id', trainingIds);
    }
    
    // 4. Deletar employee_trainings
    await supabase
      .from('employee_trainings')
      .delete()
      .in('training_program_id', programIds);
    
    // 5. Deletar training_documents
    await supabase
      .from('training_documents')
      .delete()
      .in('training_program_id', programIds);
    
    // 6. Deletar training_schedules
    await supabase
      .from('training_schedules')
      .delete()
      .in('training_program_id', programIds);
    
    // 7. Deletar training_programs
    await supabase
      .from('training_programs')
      .delete()
      .eq('branch_id', id);
  }
  
  // 8. Deletar laia_assessments
  await supabase
    .from('laia_assessments')
    .delete()
    .eq('branch_id', id);
  
  // 9. Deletar legislation_unit_compliance
  await supabase
    .from('legislation_unit_compliance')
    .delete()
    .eq('branch_id', id);
  
  // 10. Deletar legislation_compliance_profiles
  await supabase
    .from('legislation_compliance_profiles')
    .delete()
    .eq('branch_id', id);
  
  // 11. Desvincular colaboradores (nao deletar)
  await supabase
    .from('employees')
    .update({ branch_id: null })
    .eq('branch_id', id);
  
  // 12. Deletar a filial
  const { error } = await supabase
    .from('branches')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
```

Atualizar hook `useDeleteBranch` para usar a nova funcao.

---

#### Arquivo 2: `src/pages/GestaoFiliais.tsx`

Aprimorar o dialogo de confirmacao para informar ao usuario sobre os dados que serao removidos:

**Linha ~540-565**: Atualizar `AlertDialogDescription` para mostrar aviso sobre limpeza de dados:

```tsx
<AlertDialogDescription>
  Esta acao nao pode ser desfeita. Ao excluir a filial "{branchToDelete?.name}",
  os seguintes dados vinculados tambem serao removidos:
  <ul className="list-disc list-inside mt-2 text-sm">
    <li>Programas de treinamento e registros de participantes</li>
    <li>Avaliacoes LAIA</li>
    <li>Perfis de compliance de legislacoes</li>
  </ul>
  <p className="mt-2 font-medium">
    Colaboradores vinculados serao mantidos, porem sem filial associada.
  </p>
</AlertDialogDescription>
```

---

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/branches.ts` | Nova funcao `deleteBranchWithDependencies` + atualizar hook |
| `src/pages/GestaoFiliais.tsx` | Melhorar dialogo de confirmacao com lista de dados afetados |

**Total: 2 arquivos, ~80 linhas adicionadas/modificadas**

---

### Beneficios

- **Exclusao segura**: Respeita ordem de foreign keys
- **Preserva colaboradores**: Apenas remove vinculo (branch_id = NULL)
- **Transparencia**: Usuario ve claramente o que sera deletado antes de confirmar
- **Sem erros de constraint**: Funciona para qualquer filial com dados vinculados

