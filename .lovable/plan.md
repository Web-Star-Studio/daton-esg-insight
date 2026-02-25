

# Sistema de Histórico de Revisões LAIA

## Conceito

Um sistema inspirado em Git onde alterações em avaliações e setores são rastreadas como "changesets" que o usuário pode revisar, validar, titular e salvar como uma revisão formal no histórico.

## Fluxo do Usuário

```text
1. Usuário edita avaliação(ões) ou setor(es)
   ↓
2. Alterações ficam pendentes (staging area)
   ↓
3. Na aba "Revisões", usuário vê alterações pendentes
   ↓
4. Clica "Criar Revisão" → visualiza diff das mudanças
   ↓
5. Valida as alterações → dá um título/descrição
   ↓
6. Salva a revisão → registrada no histórico com número sequencial
```

Exemplo de título: *"Revisão 09 - Revisão Geral e análise crítica de POA e PIR; Elaboração da LAIA de Duque de Caxias, Anápolis e São José dos Pinhais. 15/04/2024"*

## Banco de Dados

### Tabela: `laia_revisions`

Armazena cada revisão finalizada.

```sql
CREATE TABLE public.laia_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  revision_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',  -- rascunho, validada, finalizada
  created_by UUID REFERENCES public.profiles(id),
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, revision_number)
);
```

- `status`: `rascunho` → `validada` → `finalizada`
- `revision_number`: sequencial por empresa (auto-incrementado via query)

### Tabela: `laia_revision_changes`

Registra cada alteração individual dentro de uma revisão.

```sql
CREATE TABLE public.laia_revision_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES public.laia_revisions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,          -- 'assessment' | 'sector'
  entity_id UUID NOT NULL,
  change_type TEXT NOT NULL,          -- 'created' | 'updated' | 'deleted'
  field_name TEXT,                     -- campo alterado (null para created/deleted)
  old_value TEXT,                      -- valor anterior (JSON stringified)
  new_value TEXT,                      -- novo valor (JSON stringified)
  branch_id UUID REFERENCES public.branches(id),
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);
```

Cada campo alterado gera um registro separado, permitindo visualizar o diff detalhado.

### RLS Policies

Ambas as tabelas terão RLS habilitado com políticas baseadas em `company_id` usando `get_user_company_id()`.

### Trigger de captura automática

Um trigger `AFTER UPDATE` na tabela `laia_assessments` e `laia_sectors` captura automaticamente as mudanças em uma tabela intermediária `laia_pending_changes` (staging area), ou alternativamente a captura pode ser feita no frontend comparando o estado antes/depois no momento do save.

**Abordagem escolhida: captura no frontend.** Ao salvar uma edição, o código compara `initialData` com `formData` campo a campo e registra as diferenças em `laia_revision_changes` vinculadas a uma revisão em status `rascunho`.

## Service Layer

### Novo arquivo: `src/services/laiaRevisionService.ts`

Funções:
- `getRevisions(companyId)`: lista revisões ordenadas por número
- `getRevisionById(id)`: revisão com seus changes (join)
- `createDraftRevision()`: cria revisão rascunho com próximo número sequencial
- `addChangesToRevision(revisionId, changes[])`: insere registros de alteração
- `getOrCreateDraftRevision()`: busca rascunho existente ou cria um novo
- `validateRevision(id)`: muda status para `validada`
- `finalizeRevision(id, title, description)`: muda para `finalizada` com título
- `updateRevisionTitle(id, title, description)`: edita título/descrição
- `deleteRevision(id)`: remove revisão (apenas rascunhos)
- `getPendingChangesCount()`: conta alterações em rascunho atual

### Hooks em `src/hooks/useLAIA.ts`

- `useLAIARevisions()`: query para listar revisões
- `useLAIARevision(id)`: query para detalhe de revisão
- `useLAIAPendingChangesCount()`: query para badge de pendentes
- `useCreateDraftRevision()`: mutation
- `useAddChangesToRevision()`: mutation
- `useValidateRevision()`: mutation
- `useFinalizeRevision()`: mutation
- `useUpdateRevisionTitle()`: mutation
- `useDeleteRevision()`: mutation

## Integração com Edição

### `LAIAAssessmentForm.tsx` e `LAIASectorManager.tsx`

Ao salvar uma edição (update), o código:
1. Compara `initialData` com `formData` campo a campo
2. Gera array de `{ field_name, old_value, new_value }` para campos que mudaram
3. Busca/cria revisão rascunho via `getOrCreateDraftRevision()`
4. Insere os changes via `addChangesToRevision()`

Isso acontece automaticamente — o usuário não precisa fazer nada extra ao editar.

## Componente: Aba Revisões

### Novo: `src/components/laia/LAIARevisoes.tsx`

Layout em duas seções:

**1. Revisão Pendente (Rascunho)**
- Exibida no topo quando existe uma revisão em status `rascunho`
- Badge com contagem de alterações pendentes
- Botão "Visualizar Alterações" → abre modal com diff
- Botão "Validar" → muda status para `validada`
- Quando validada: campos de título e descrição aparecem
- Botão "Finalizar Revisão" → salva com título

**2. Histórico de Revisões**
- Timeline/lista de revisões finalizadas, ordenadas por número decrescente
- Cada item mostra: número, título, data, quem criou, qtd de alterações
- Clique expande para ver os changes detalhados
- Botão de editar título (pencil icon) para revisões finalizadas

### Novo: `src/components/laia/LAIARevisionDetail.tsx`

Modal/sheet com o diff detalhado de uma revisão:
- Agrupado por entidade (assessment/sector) e por branch
- Para cada campo alterado: nome do campo, valor anterior → novo valor
- Labels traduzidos para pt-BR
- Badges coloridos para tipo de mudança (criado, editado, removido)

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar `laia_revisions` + `laia_revision_changes` + RLS + triggers |
| `src/services/laiaRevisionService.ts` | Novo — CRUD de revisões |
| `src/hooks/useLAIA.ts` | Adicionar hooks de revisão |
| `src/components/laia/LAIARevisoes.tsx` | Novo — aba de revisões com staging + histórico |
| `src/components/laia/LAIARevisionDetail.tsx` | Novo — visualização de diff |
| `src/components/laia/LAIAAssessmentForm.tsx` | Capturar diff ao salvar edição |
| `src/services/laiaService.ts` | Retornar dados anteriores no update para diff |
| `src/pages/LAIAUnidades.tsx` | Substituir placeholder de Revisões pelo componente real |

## Detalhes Técnicos

### Cálculo de diff no frontend

```typescript
function computeChanges(
  entityType: 'assessment' | 'sector',
  entityId: string,
  branchId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  fieldsToTrack: string[]
): Change[] {
  return fieldsToTrack
    .filter(field => JSON.stringify(oldData[field]) !== JSON.stringify(newData[field]))
    .map(field => ({
      entity_type: entityType,
      entity_id: entityId,
      change_type: 'updated',
      field_name: field,
      old_value: JSON.stringify(oldData[field]),
      new_value: JSON.stringify(newData[field]),
      branch_id: branchId,
    }));
}
```

### Numeração sequencial

```sql
SELECT COALESCE(MAX(revision_number), 0) + 1
FROM laia_revisions
WHERE company_id = $1
```

### Labels de campos para o diff

Mapa de tradução `field_name` → label legível:
```typescript
const FIELD_LABELS: Record<string, string> = {
  activity_operation: "Atividade/Operação",
  environmental_aspect: "Aspecto Ambiental",
  environmental_impact: "Impacto Ambiental",
  temporality: "Temporalidade",
  severity: "Severidade",
  scope: "Abrangência",
  // ...etc
};
```

