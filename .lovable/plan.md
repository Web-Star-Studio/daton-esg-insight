

# Upload SGQ/ISO com IA + Vinculação a Filiais + Página Dedicada por Documento

## Visão Geral

Transformar o módulo de upload de documentos SGQ/ISO em uma feature de IA que:
1. Permite vincular documento a uma ou mais filiais (obrigatório)
2. Faz leitura e extração de informações via IA em tempo real após upload
3. Salva os resultados em uma página dedicada por documento (`/controle-documentos/:id`)

## Alterações no Banco de Dados

### Nova tabela `document_branches` (many-to-many)
```sql
CREATE TABLE public.document_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, branch_id)
);
ALTER TABLE public.document_branches ENABLE ROW LEVEL SECURITY;
-- RLS: users can manage documents of their company
```

## Alterações no Frontend

### 1. Modal de Upload (`SGQIsoDocumentsTab.tsx`)
- Adicionar seletor multi-filial (checkboxes ou multi-select) usando `useBranches()`
- Campo obrigatório — bloquear upload sem ao menos uma filial selecionada
- Após upload do arquivo, disparar automaticamente `processDocumentWithAI(docId)` e mostrar progresso em tempo real (spinner + status)
- Salvar associações na tabela `document_branches`

### 2. Tabela de documentos — exibir filiais vinculadas
- Mostrar badges das filiais associadas a cada documento na listagem

### 3. Nova página de detalhe: `/controle-documentos/:id`
- **Cabeçalho**: nome do documento, categoria, data de upload, filiais vinculadas
- **Seção de visualização**: preview inline do documento (PDF/imagem)
- **Seção IA**: resultados da extração (campos extraídos, confiança, resumo, entidades, relevância ESG)
- **Ações**: download, reprocessar com IA, editar vinculações de filiais
- Rota registrada no `App.tsx`

### 4. Navegação
- Tornar cada linha da tabela SGQ/ISO clicável, redirecionando para `/controle-documentos/:id`

## Arquivos a Criar/Editar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/xxx_create_document_branches.sql` | Criar tabela + RLS |
| `src/components/document-control/SGQIsoDocumentsTab.tsx` | Refatorar modal de upload com multi-filial + trigger IA |
| `src/pages/SGQDocumentDetail.tsx` | Nova página dedicada por documento |
| `src/App.tsx` | Registrar rota `/controle-documentos/:id` |
| `src/services/documentBranches.ts` | CRUD para associações documento-filial |

## Fluxo do Usuário

1. Clica "Novo Documento SGQ" → abre modal
2. Seleciona arquivo, categoria, e **uma ou mais filiais** (obrigatório)
3. Clica "Fazer Upload" → arquivo é salvo no storage + registro no banco
4. Automaticamente, a IA começa a processar o documento (indicador visual de progresso)
5. Ao concluir, redireciona para `/controle-documentos/:id` com os resultados da extração
6. Na página dedicada, o usuário vê: preview do documento, dados extraídos pela IA, resumo, entidades, confiança

## Observações Técnicas
- A Edge Function `document-ai-processor` já existe e funciona — será reutilizada
- O `useBranches()` já existe em `src/services/branches.ts`
- Os build errors pré-existentes nas Edge Functions (daton-ai-chat, generate-intelligent-report, get-company-quick-stats) são problemas de tipagem anteriores e não serão abordados neste escopo

