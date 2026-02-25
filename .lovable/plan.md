

# Bulk Status Update para Funcionários

## Objetivo

Adicionar seleção em lote (checkboxes) na lista de funcionários para permitir alterar o status (Ativo/Inativo) de múltiplos funcionários simultaneamente.

## Arquivos a criar/modificar

### 1. `src/services/employees.ts` (modificar)

Adicionar função `bulkUpdateEmployeeStatus`:
```typescript
export const bulkUpdateEmployeeStatus = async (
  employeeIds: string[], 
  status: string
) => { ... }
```
Executa um `UPDATE employees SET status = $status WHERE id IN (...)`.

### 2. `src/components/EmployeesList.tsx` (modificar)

Alterações principais:

**a) Estado de seleção:**
- Adicionar `selectedIds: Set<string>` para rastrear funcionários selecionados
- Checkbox "selecionar todos" no topo da lista (seleciona apenas os da página atual)
- Checkbox individual em cada card de funcionário

**b) Barra de ações em lote (inline, não componente separado):**
- Aparece quando `selectedIds.size > 0`
- Barra fixa no rodapé (padrão similar ao `BulkActionsBar` já existente no projeto)
- Exibe contagem de selecionados
- Botões: "Ativar" e "Inativar"
- Botão "Limpar seleção"

**c) Fluxo:**
1. Usuário marca checkboxes nos cards dos funcionários
2. Barra de ações aparece no rodapé
3. Usuário clica "Ativar" ou "Inativar"
4. Confirmação via `confirm()` dialog
5. Chamada `bulkUpdateEmployeeStatus`
6. Invalidação das queries e limpeza da seleção
7. Toast de sucesso/erro

### 3. Layout dos checkboxes

Cada card de funcionário receberá um `Checkbox` (componente já existente em `ui/checkbox.tsx`) à esquerda do Avatar, com visual discreto. O checkbox "selecionar todos" ficará na barra de filtros, ao lado do campo de busca.

## Detalhes técnicos

- Usa `Checkbox` de `@radix-ui/react-checkbox` já instalado
- Seleção persiste apenas na página atual (ao mudar de página, limpa)
- Status utiliza strings em português: "Ativo", "Inativo" (conforme padrão documentado)
- Invalidação de queries: `employees-paginated`, `employees-stats`, `employees`
- Sem necessidade de migration — campo `status` já existe na tabela `employees`

