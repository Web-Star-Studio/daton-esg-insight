
Diagnóstico confirmado (causa raiz):
- O código atual de SGQ está inserindo/consultando `norm_reference` e `responsible_department` em `public.sgq_iso_documents`.
- No banco conectado, essas colunas ainda não existem.
- A tabela `public.sgq_document_branches` também não existe.
- Resultado: erro de schema cache ao criar documento (`Could not find 'norm_reference'...`) e, mesmo após isso, haveria falha na gravação das múltiplas filiais.

Plano de correção:

1) Sincronizar schema do banco com o código (prioridade máxima)
- Aplicar no projeto Supabase conectado a migration:
  `supabase/migrations/20260312110000_sgq_document_metadata_alignment.sql`
- Essa migration precisa criar:
  - colunas `norm_reference` e `responsible_department` em `sgq_iso_documents`
  - tabela `sgq_document_branches` + índices + RLS/policies

2) Validar que a migration realmente entrou no banco correto
- Conferir via SQL:
  - `information_schema.columns` para `sgq_iso_documents` (esperado: `norm_reference`, `responsible_department`)
  - `to_regclass('public.sgq_document_branches')` (esperado: nome da tabela, não `null`)

3) Atualizar cache do PostgREST (se o erro persistir logo após migration)
- Executar:
  - `NOTIFY pgrst, 'reload schema';`
- Aguardar alguns segundos e testar novamente.

4) Teste funcional ponta a ponta
- Em `/controle-documentos`:
  - criar documento SGQ com 2+ filiais e 1+ normas
  - validar criação do documento, vínculos em `sgq_document_branches` e listagem sem erro
  - validar que a tela carrega os novos campos sem falha.

5) Ajuste técnico adicional (build)
- Há um erro de TypeScript em `src/services/sgqIsoDocuments.ts` (linha do `reduce<Record<...>>` sobre `(data || [])` tipado como `any`).
- Corrigir a tipagem dessa redução para não bloquear build/deploy após a correção de schema.

Observação técnica:
- Hoje o formulário aceita múltiplas normas, mas persiste em `norm_reference` como texto concatenado. Se vocês quiserem auditoria mais estruturada por norma, o próximo passo é normalizar para tabela relacional (ex.: `sgq_document_norms`) e ajustar service/UI para leitura/escrita many-to-many.
