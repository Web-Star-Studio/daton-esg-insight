

## Unificar SGQ/ISO com as features de Documentos Regulatórios

### Problema
A tab SGQ/ISO atualmente é uma simples lista de arquivos (nome, categoria, tamanho, data). Falta controle de validade, renovação, versões e anexos — features que existem na tab de Documentos Regulatórios.

### Abordagem
Criar uma tabela `sgq_iso_documents` no banco com campos espelhados da `licenses` (validade, renovação, órgão emissor, responsável, etc.) e uma tabela de settings correspondente. Refatorar a `SGQIsoDocumentsTab` para usar o mesmo layout de tabela e dialog de formulário da `RegulatoryDocumentsTab`, adaptando labels/opções ao contexto SGQ.

### Mudanças no Banco de Dados

**Nova tabela `sgq_iso_documents`:**
- `id`, `company_id`, `branch_id`, `responsible_user_id`
- `document_identifier_type` (Manual, Procedimento, IT, Formulário, Política, etc.)
- `document_number`, `issuing_body`, `process_number`
- `issue_date`, `expiration_date`
- `renewal_required`, `renewal_alert_days`
- `notes`, `external_source_*` fields
- RLS policies por `company_id`

**Nova tabela `sgq_iso_document_settings`:**
- `company_id`, `default_expiring_days`

**Reutilização existente:**
- `license_renewal_schedules` → criar `sgq_renewal_schedules` (mesma estrutura, referenciando `sgq_iso_documents`)
- `documents` table → anexos via `related_model = 'sgq_iso_document'`

### Mudanças no Código

1. **Novo service `src/services/sgqIsoDocuments.ts`** — espelha `regulatoryDocuments.ts` com queries para `sgq_iso_documents` e `sgq_renewal_schedules`. Funções: `getSgqDocuments`, `createSgqDocument`, `updateSgqDocument`, `upsertSgqRenewalData`, `uploadSgqAttachment`, `getSgqDocumentVersions`, `getSgqSettings`, `updateSgqSettings`.

2. **Refatorar `SGQIsoDocumentsTab.tsx`** — substituir toda a implementação atual por uma versão que espelha o layout da `RegulatoryDocumentsTab`:
   - Mesmo header com botão "Novo Documento SGQ" abrindo dialog de formulário completo
   - Card de configuração de prazo padrão
   - Card de filtros (busca, filial, tipo, status documento, status renovação)
   - Tabela com colunas: Identificação, Nº Documento, Órgão, Processo, Filial, Responsável, Emissão, Validade, Dias Restantes, Status Documento, Status Renovação, Fonte Externa, Protocolo, Versões, Última Atualização, Ações
   - Dialog de versões com download
   - Ações: Editar, Anexar nova versão

3. **Adaptar opções de tipo** — substituir `REGULATORY_DOCUMENT_IDENTIFIER_OPTIONS` por opções SGQ: Manual, Procedimento, Instrução de Trabalho, Formulário, MSG, FPLAN, Política, Plano, Relatório, Certificado, Outro.

### O que NÃO muda
- Tab de Documentos Regulatórios permanece intacta
- Tabelas `licenses` e `license_renewal_schedules` não são alteradas
- Documentos SGQ existentes na tabela `documents` continuam acessíveis (podem ser migrados futuramente)

