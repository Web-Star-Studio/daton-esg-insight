
# Plano: Permitir Exclusao de Matrizes com Cascata para Filiais Vinculadas

## Problema Identificado

1. **Botao desabilitado**: Atualmente, o botao de excluir esta desabilitado para matrizes (`disabled={branch.is_headquarters}` na linha 333).

2. **Erro de FK persiste**: Mesmo com `deleteBranchWithDependencies`, ao tentar excluir uma matriz que tem filiais vinculadas ou dados (training_programs), o erro de chave estrangeira ocorre porque:
   - A funcao atual so limpa dependencias da filial sendo excluida
   - Nao exclui as **filiais-filhas** vinculadas (`parent_branch_id`)
   - Nao limpa os dados das filiais-filhas antes de excluir

3. **Comportamento desejado** (confirmado pelo usuario): Ao excluir uma matriz, **excluir tambem todas as filiais vinculadas** e seus dados dependentes.

---

## Solucao Proposta

### Fluxo de Exclusao de Matriz

```text
MATRIZ
  |
  +-- Filial A (parent_branch_id = matriz.id)
  |     +-- training_programs, laia_assessments, etc.
  |
  +-- Filial B (parent_branch_id = matriz.id)
  |     +-- training_programs, laia_assessments, etc.
  |
  +-- (dados proprios da matriz: training_programs, etc.)
```

**Ordem de exclusao:**
1. Para cada filial-filha vinculada a matriz:
   - Executar `deleteBranchWithDependencies(filial.id)`
2. Executar `deleteBranchWithDependencies(matriz.id)` para limpar dados da propria matriz

---

## Alteracoes Tecnicas

### Arquivo 1: `src/services/branches.ts`

**Criar nova funcao `deleteHeadquartersWithChildren`:**

```typescript
export const deleteHeadquartersWithChildren = async (id: string) => {
  console.log(`[deleteHQ] Iniciando exclusao da matriz ${id} com filiais`);
  
  // 1. Buscar todas as filiais vinculadas a esta matriz
  const { data: childBranches, error: childError } = await supabase
    .from('branches')
    .select('id, name')
    .eq('parent_branch_id', id);
  
  if (childError) {
    throw new Error(`Falha ao buscar filiais vinculadas: ${childError.message}`);
  }
  
  console.log(`[deleteHQ] Encontradas ${childBranches?.length || 0} filiais vinculadas`);
  
  // 2. Excluir cada filial-filha com suas dependencias
  for (const child of (childBranches || [])) {
    console.log(`[deleteHQ] Excluindo filial-filha: ${child.name}`);
    await deleteBranchWithDependencies(child.id);
  }
  
  // 3. Excluir a matriz com suas dependencias
  console.log(`[deleteHQ] Excluindo matriz com dependencias`);
  await deleteBranchWithDependencies(id);
  
  console.log(`[deleteHQ] Matriz ${id} e filiais excluidas com sucesso`);
};
```

**Atualizar hook `useDeleteBranch`:**

Modificar para receber um parametro `isHeadquarters` e chamar a funcao apropriada:

```typescript
export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, isHeadquarters }: { id: string; isHeadquarters: boolean }) => {
      if (isHeadquarters) {
        return deleteHeadquartersWithChildren(id);
      }
      return deleteBranchWithDependencies(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      unifiedToast.success('Unidade removida com sucesso', {
        description: 'Todos os dados vinculados foram removidos.'
      });
    },
    onError: (error: any) => {
      unifiedToast.error('Erro ao remover unidade', {
        description: error.message
      });
    },
  });
};
```

---

### Arquivo 2: `src/pages/GestaoFiliais.tsx`

**1. Remover bloqueio do botao de excluir matriz (linha 333):**

```diff
- disabled={branch.is_headquarters}
+ (remover completamente a propriedade disabled)
```

**2. Atualizar `handleDelete` (linha 247-253):**

```typescript
const handleDelete = () => {
  if (branchToDelete) {
    deleteMutation.mutate({
      id: branchToDelete.id,
      isHeadquarters: branchToDelete.is_headquarters
    }, {
      onSuccess: () => setBranchToDelete(null),
    });
  }
};
```

**3. Melhorar dialogo de confirmacao (linhas 559-575):**

Adicionar aviso diferenciado quando for matriz:

```tsx
<AlertDialogDescription asChild>
  <div className="space-y-3">
    {branchToDelete?.is_headquarters ? (
      <>
        <p className="text-destructive font-medium">
          ATENCAO: Voce esta excluindo uma MATRIZ!
        </p>
        <p>
          Ao excluir a matriz <strong>"{branchToDelete?.name}"</strong>,
          <strong> TODAS as filiais vinculadas</strong> tambem serao excluidas,
          junto com todos os seus dados:
        </p>
      </>
    ) : (
      <p>
        Esta acao nao pode ser desfeita. Ao excluir a filial <strong>"{branchToDelete?.name}"</strong>,
        os seguintes dados vinculados tambem serao removidos:
      </p>
    )}
    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
      {branchToDelete?.is_headquarters && (
        <li className="text-destructive">Todas as filiais vinculadas a esta matriz</li>
      )}
      <li>Programas de treinamento e registros de participantes</li>
      <li>Avaliacoes LAIA</li>
      <li>Perfis de compliance de legislacoes</li>
    </ul>
    <p className="font-medium text-foreground">
      Colaboradores vinculados serao mantidos, porem sem filial associada.
    </p>
  </div>
</AlertDialogDescription>
```

---

### Arquivo 3: `src/components/branches/BranchDeduplication.tsx`

**Atualizar chamada do deleteMutation (linhas 165 e 208):**

```typescript
// Linha 165
await deleteMutation.mutateAsync({ id: branch.id, isHeadquarters: branch.is_headquarters });

// Linha 208
await deleteMutation.mutateAsync({ id: branch.id, isHeadquarters: branch.is_headquarters });
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/branches.ts` | Nova funcao `deleteHeadquartersWithChildren` + atualizar hook |
| `src/pages/GestaoFiliais.tsx` | Remover bloqueio, atualizar handleDelete, melhorar dialogo |
| `src/components/branches/BranchDeduplication.tsx` | Atualizar chamadas do deleteMutation |

**Total: 3 arquivos, ~60 linhas adicionadas/modificadas**

---

## Resultado Esperado

1. **Botao de excluir habilitado** para matrizes
2. **Dialogo diferenciado** avisando que filiais vinculadas serao excluidas
3. **Exclusao em cascata** funcional:
   - Matriz "MATRIZ" -> exclui Filial POA, Filial CHUÍ, etc.
   - Cada filial tem seus dados limpos antes da exclusao
4. **Colaboradores preservados** (apenas desvinculados)

---

## Riscos e Mitigacao

- **Risco**: Exclusao acidental de muitos dados
  - **Mitigacao**: Dialogo de confirmacao com aviso em vermelho sobre ser matriz e listar filiais
  
- **Risco**: Timeout em matrizes com muitas filiais
  - **Mitigacao**: Logs detalhados para debug; se necessario, criar RPC no banco futuramente
