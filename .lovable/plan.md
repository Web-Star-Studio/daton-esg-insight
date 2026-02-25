

# Bulk Delete para Avaliações e Setores no Módulo LAIA

## Contexto

As tabs de **Avaliações** (`LAIAAssessmentTable`) e **Setores** (`LAIASectorManager`) na página de detalhes da unidade LAIA permitem apenas exclusão individual. O usuário precisa de seleção múltipla com exclusão em lote, seguindo o padrão já utilizado no módulo de Funcionários (bulk select com barra de ações flutuante).

## Arquivos a modificar

### 1. `src/services/laiaService.ts`

Adicionar duas funções de bulk delete:

```typescript
export async function bulkDeleteLAIAAssessments(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("laia_assessments")
    .delete()
    .in("id", ids);
  if (error) throw error;
}

export async function bulkDeleteLAIASectors(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from("laia_sectors")
    .delete()
    .in("id", ids);
  if (error) throw error;
}
```

### 2. `src/hooks/useLAIA.ts`

Adicionar dois hooks de mutation:

- `useBulkDeleteLAIAAssessments` — chama `bulkDeleteLAIAAssessments`, invalida queries `laia-assessments` e `laia-dashboard-stats`
- `useBulkDeleteLAIASectors` — chama `bulkDeleteLAIASectors`, invalida query `laia-sectors`

### 3. `src/components/laia/LAIAAssessmentTable.tsx`

Alterações na tabela de avaliações:

- **Estado**: adicionar `selectedIds: Set<string>`
- **Checkbox "selecionar todos"** no `TableHeader`, primeira coluna
- **Checkbox individual** em cada `TableRow`, primeira coluna
- **Barra de ações flutuante** no rodapé (padrão do projeto): aparece quando `selectedIds.size > 0`, exibindo contagem + botão "Excluir Selecionados"
- **AlertDialog de confirmação** para bulk delete com mensagem informando a quantidade
- Limpar seleção ao mudar filtros
- Importar `Checkbox` de `@/components/ui/checkbox`

### 4. `src/components/laia/LAIASectorManager.tsx`

Mesma lógica aplicada à tabela de setores:

- **Estado**: adicionar `selectedIds: Set<string>`
- **Checkbox "selecionar todos"** no `TableHeader`
- **Checkbox individual** em cada `TableRow` (com `e.stopPropagation()` para não disparar navegação)
- **Barra de ações flutuante** com botão "Excluir Selecionados"
- **AlertDialog de confirmação** para bulk delete
- Aviso na confirmação: "Esta ação pode afetar avaliações vinculadas aos setores selecionados"

## Layout da barra de ações

Seguindo o padrão existente (`BulkActionsBar.tsx` e implementação de Funcionários):

```text
┌──────────────────────────────────────────────────────┐
│  [3 selecionado(s)]  │  [🗑 Excluir Selecionados]  [✕] │
└──────────────────────────────────────────────────────┘
         (fixa no rodapé, centralizada, z-50)
```

## Detalhes técnicos

- Checkboxes usam `@radix-ui/react-checkbox` (já instalado)
- Seleção limpa ao trocar filtros (categoria, significância, busca, atividade)
- `stopPropagation` nos checkboxes dos setores para evitar navegação acidental
- Sem necessidade de migrations — operações DELETE já permitidas pelas RLS existentes

