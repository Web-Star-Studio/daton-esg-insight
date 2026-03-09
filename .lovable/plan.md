
Diagnóstico confirmado (com evidência):
- O loading infinito não é mais “só UI”: há erro real de backend + tratamento de estado no frontend.
- Rede mostra `404 PGRST205` para `public.document_read_campaigns` (“Could not find the table…”).
- Consulta no banco confirma que hoje só existe `document_change_log`; faltam tabelas usadas pela página: `document_read_campaigns`, `document_read_recipients`, `document_requests`, `document_relations` (e também `document_control_profiles`).
- Em `SGQDocumentDetail.tsx`, a tela usa `if (isLoading || !document)` para mostrar spinner; quando a query falha e `document` fica `undefined`, entra em spinner infinito.
- Além disso, `markDocumentViewed` roda no `useEffect` apenas com `documentId` e pode rejeitar promessa sem `catch`, gerando erro não tratado.

Do I know what the issue is?
- Sim. É combinação de schema incompleto + fallback de UI incorreto.

Plano de correção:

1) Corrigir schema SGQ com migration de reparo (nova migration, timestamp atual)
- Criar (com `IF NOT EXISTS`) as tabelas faltantes:
  - `document_control_profiles`
  - `document_read_campaigns`
  - `document_read_recipients`
  - `document_requests`
  - `document_relations`
- Ajustar `document_change_log` existente para o formato esperado pelo serviço:
  - adicionar `company_id`, `summary`, `diff`, `created_by_user_id` (sem quebrar dados existentes)
  - manter compatibilidade com colunas antigas já criadas
- Aplicar RLS + políticas por empresa (`get_user_company_id()`), índices e triggers `updated_at` onde necessário.

2) Remover o “loading infinito” na página de detalhe
- Arquivo: `src/pages/SGQDocumentDetail.tsx`
- Trocar lógica de render:
  - `isLoading` => spinner
  - `isError` => estado de erro com botão “Tentar novamente” e “Voltar”
  - sem documento (não loading) => estado “Documento não encontrado”
- Não usar mais `|| !document` para manter spinner eterno.
- Ajustar `useEffect` de `markDocumentViewed` para:
  - executar somente após `document` carregado
  - tratar erro com `catch` (sem unhandled rejection).

3) Fortalecer resiliência do serviço para falhas de tabela ausente
- Arquivo: `src/services/documentCenter.ts`
- Nos pontos que consultam módulos auxiliares (`fetchReadCampaigns`, `syncDerivedStatuses`, `fetchDocumentRequests`, `fetchDocumentRelations`, `getControlProfiles`):
  - detectar erro de tabela ausente (`PGRST205`) e degradar para `[]/{}` em vez de quebrar o detalhe inteiro.
- Resultado: mesmo se algum módulo opcional falhar, os dados centrais do documento ainda renderizam.

4) Validação pós-correção
- Reabrir `/documentos/:id` e validar:
  - página abre sem spinner infinito
  - se faltar algum submódulo, aparece conteúdo principal + seção vazia (sem travar)
  - sem `UNHANDLED_PROMISE_REJECTION` no console.
- Conferir no banco existência das tabelas SGQ e políticas RLS ativas.

Arquivos previstos:
- `supabase/migrations/<novo_timestamp>_repair_document_center_schema.sql`
- `src/pages/SGQDocumentDetail.tsx`
- `src/services/documentCenter.ts`
