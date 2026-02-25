

# Status de Levantamento por Unidade no LAIA

## Visão geral

Cada unidade terá um "Status de Levantamento" configurável na aba Configurações, com 3 valores possíveis. Unidades com status "Não Levantados" ficam ocultas na aba Unidades.

## Banco de dados

### Nova tabela: `laia_branch_config`

Armazena configurações LAIA por unidade, separada da tabela `branches` para manter o desacoplamento.

```sql
CREATE TABLE public.laia_branch_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  survey_status TEXT NOT NULL DEFAULT 'nao_levantado',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(branch_id)
);
```

- `survey_status`: `'nao_levantado'` | `'em_levantamento'` | `'levantado'`
- Constraint `UNIQUE(branch_id)` — uma config por unidade
- Default `'nao_levantado'` para unidades sem configuração explícita
- RLS policies para company_id match

Trigger para atualizar `updated_at` automaticamente.

## Service layer

### Novo arquivo: `src/services/laiaBranchConfigService.ts`

- `getLAIABranchConfigs()`: busca todas as configs da empresa
- `upsertLAIABranchConfig(branchId, surveyStatus)`: insere ou atualiza o status de uma unidade (upsert no `branch_id`)

### Novos hooks em `src/hooks/useLAIA.ts`

- `useLAIABranchConfigs()`: query para buscar configs
- `useUpsertLAIABranchConfig()`: mutation para salvar

## Componente: Configurações

### Novo componente: `src/components/laia/LAIAConfiguracoes.tsx`

Tabela com todas as unidades ativas da empresa, mostrando:

| Unidade | Código | Status de Levantamento |
|---------|--------|----------------------|
| Nome    | COD    | [Select: dropdown]   |

- Um `Select` por linha com as 3 opções
- Ao alterar, faz upsert imediato (ou botão "Salvar" global)
- Badges coloridos para cada status:
  - Não Levantados → cinza
  - Em Levantamento → amarelo
  - Levantados → verde

## Filtro na aba Unidades

No `LAIAUnidades.tsx`, o `filteredBranches` passa a excluir unidades cujo status seja `'nao_levantado'`:

```typescript
// Após carregar branchConfigs
const visibleBranches = activeBranches.filter(b => {
  const config = branchConfigs?.find(c => c.branch_id === b.id);
  // Se não tem config, default é nao_levantado → oculta
  return config?.survey_status !== 'nao_levantado' 
    && config !== undefined;
});
```

Unidades sem registro em `laia_branch_config` ficam ocultas (default = não levantado).

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `laia_branch_config` + RLS + trigger |
| `src/services/laiaBranchConfigService.ts` | Novo — CRUD da config |
| `src/hooks/useLAIA.ts` | Adicionar hooks para branch config |
| `src/components/laia/LAIAConfiguracoes.tsx` | Novo — UI da aba Configurações |
| `src/pages/LAIAUnidades.tsx` | Usar configs para filtrar unidades + renderizar componente de Configurações |

