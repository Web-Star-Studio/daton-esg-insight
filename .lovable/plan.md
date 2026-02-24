
# Isolar Validacao e Importacao LAIA por Unidade (branch_id)

## Problema

As funcoes `validateLAIAImport` e `importLAIAAssessments` em `src/services/laiaImport.ts` buscam setores e codigos de aspecto existentes filtrando apenas por `company_id`, sem considerar o `branch_id`. Isso faz com que setores e codigos que existem em outra unidade disparem avisos falsos ao importar para uma unidade diferente.

## Solucao

Adicionar o parametro `branchId` na funcao de validacao e ajustar todas as queries para filtrar por `branch_id`.

## Alteracoes

### 1. `src/services/laiaImport.ts`

**Funcao `validateLAIAImport` (linha 454)**:
- Adicionar parametro `branchId?: string` na assinatura
- Na query de setores existentes (linha 464-467): adicionar `.eq('branch_id', branchId)` quando branchId informado
- Na query de aspect_codes existentes (linha 474-477): adicionar `.eq('branch_id', branchId)` quando branchId informado

**Funcao `importLAIAAssessments` (linha 563-566)**:
- Na query de setores existentes: adicionar `.eq('branch_id', branchId)` quando branchId informado
- Na chamada `createLAIASector` (linha 584): passar `branch_id: branchId` no objeto

### 2. `src/hooks/useLAIAImport.ts`

**Funcao `validateMutation` (linha 53)**:
- Alterar para aceitar `branchId` e passa-lo para `validateLAIAImport`
- Alterar a assinatura do `validate` exposto pelo hook para aceitar branchId

### 3. Componente do wizard de importacao

- Passar o `branchId` selecionado na etapa de filial para a chamada de validacao

## Resultado esperado

Ao importar avaliacoes para a unidade B, setores e codigos de aspecto que ja existam na unidade A nao gerarao avisos. Apenas setores/codigos da propria unidade B serao verificados.
