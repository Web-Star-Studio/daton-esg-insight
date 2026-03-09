

# Fix: Página de detalhes carregando infinitamente

## Causa raiz

A função `getDocumentRecord` em `src/services/documentCenter.ts` (linha 803) consulta a tabela `document_change_log`, que **não existe** no banco de dados. O erro é lançado dentro do `Promise.all`, fazendo toda a função falhar. O `useQuery` fica retentando indefinidamente, causando o loading infinito.

## Solução

Duas alterações necessárias:

### 1. Criar a tabela `document_change_log` via migration

```sql
CREATE TABLE public.document_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL DEFAULT 'update',
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.document_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change logs for their company documents"
  ON public.document_change_log FOR SELECT TO authenticated
  USING (
    document_id IN (
      SELECT d.id FROM public.documents d
      JOIN public.profiles p ON p.company_id = d.company_id
      WHERE p.id = auth.uid()
    )
  );

CREATE INDEX idx_document_change_log_document_id ON public.document_change_log(document_id);
```

### 2. Tornar a query resiliente em `documentCenter.ts`

Alterar a query de `document_change_log` na linha 803 para não lançar erro se falhar (graceful degradation), retornando array vazio em caso de erro em vez de `throw`.

## Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | Criar tabela `document_change_log` |
| `src/services/documentCenter.ts` | Tornar query de `document_change_log` resiliente |

