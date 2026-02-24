

# Fix: Filtro de setor na tabela de avaliacoes LAIA nao esta filtrado por unidade

## Problema

Na tabela de avaliacoes (`LAIAAssessmentTable.tsx`), o dropdown de setores chama `useLAIASectors()` sem passar o `branchId`, fazendo com que nenhum setor apareca (ja que os setores agora sao vinculados por unidade).

## Solucao

### Arquivo: `src/components/laia/LAIAAssessmentTable.tsx`

Uma unica alteracao na linha 86:

**Antes:**
```ts
const { data: sectors } = useLAIASectors();
```

**Depois:**
```ts
const { data: sectors } = useLAIASectors(branchId);
```

Isso garante que o dropdown de setores exiba apenas os setores pertencentes a unidade atual, permitindo a filtragem correta.

Nenhuma outra alteracao necessaria -- o filtro de setor ja esta implementado na UI e no backend, apenas faltava passar o `branchId` para o hook.

