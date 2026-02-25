

# Exibir código da filial em vez do nome em toda a codebase

## Problema

Todas as referências a filiais no sistema exibem `branch.name` (ex: "Transportes Gabardo") em vez de `branch.code` (ex: "SJP", "DUQUE"). Como muitas filiais compartilham o mesmo nome (razão social), o código é o único identificador visual útil. O padrão correto, já documentado no projeto, é `{code} - {name}` ou apenas `{code}` quando o espaço é limitado.

## Padrão de exibição

Criar uma função utilitária centralizada para formatar o label de filiais:

```typescript
// src/utils/branchDisplay.ts
export function getBranchDisplayLabel(branch: { code?: string | null; name: string }): string {
  return branch.code ? `${branch.code} - ${branch.name}` : branch.name;
}

export function getBranchShortLabel(branch: { code?: string | null; name: string }): string {
  return branch.code || branch.name;
}
```

## Arquivos a alterar (13 arquivos)

### 1. `src/components/BranchSelect.tsx` (componente reutilizado em vários formulários)
- **Linha 77**: `{selectedBranch.name}` → `{getBranchDisplayLabel(selectedBranch)}`
- **Linha 156**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`
- Este componente é usado no cadastro de colaboradores — é a causa direta do problema reportado.

### 2. `src/components/EmployeeDetailModal.tsx`
- **Linha 170**: `return branch?.name` → `return branch?.code ? \`${branch.code} - ${branch.name}\` : branch?.name`

### 3. `src/pages/NaoConformidades.tsx`
- **Linha 436**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`

### 4. `src/pages/LegislationReports.tsx`
- **Linha 174**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`

### 5. `src/pages/LegislationDetail.tsx`
- **Linha 447**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`

### 6. `src/components/legislation/BulkComplianceModal.tsx`
- **Linha 170**: `{branch.name}` → `{getBranchShortLabel(branch)}`

### 7. `src/components/legislation/ComplianceProfilesManager.tsx`
- **Linha 136**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`
- **Linha 222**: `branchName={selectedBranch.name}` → `branchName={getBranchDisplayLabel(selectedBranch)}`

### 8. `src/components/legislation/UnitMappingStep.tsx`
- **Linha 82**: `branchName: branch?.name` → `branchName: branch?.code ? \`${branch.code} - ${branch.name}\` : branch?.name`
- **Linha 171**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`

### 9. `src/components/laia/LAIAImportWizard.tsx`
- **Linhas 282, 314, 339, 400, 503**: Substituir `branch.name` / `selectedBranch.name` por `getBranchDisplayLabel()`

### 10. `src/components/branches/BranchesMap.tsx`
- **Linha 132**: `{branch.name}` → `{getBranchDisplayLabel(branch)}`

### 11. `src/pages/LAIASectorDetailPage.tsx`
- **Linha 126**: `{branch?.name || "Unidade"}` → `{branch?.code || branch?.name || "Unidade"}`

### 12. `src/components/social/SocialDashboardFilters.tsx`
- Verificar se exibe `branch.name` em SelectItem e corrigir para `getBranchDisplayLabel(branch)`

### 13. `src/pages/GestaoFiliais.tsx`
- **Linha 281**: Já exibe `branch.name` na tabela ao lado do código (coluna separada para code). Manter como está — nesta página, nome e código já são colunas separadas.

## Locais que já estão corretos (sem alteração)

- `src/pages/LAIAUnidades.tsx`: Já usa `branch.code` como título principal
- `src/pages/LAIAUnidadePage.tsx`: Já usa `{branch.code} - {branch.name}`
- `src/pages/GestaoFiliais.tsx`: Já tem colunas separadas para nome e código

## Sequência de execução

1. Criar `src/utils/branchDisplay.ts` com as funções utilitárias
2. Atualizar todos os 12 arquivos acima para usar as funções centralizadas
3. Garantir que o `BranchSelect.tsx` (usado no formulário de colaboradores) exiba o código

