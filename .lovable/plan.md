

## Redesenhar SGQ/ISO com formulário próprio e features dedicadas

### Contexto
O formulário atual do SGQ/ISO é uma cópia do formulário de Documentos Regulatórios (órgão emissor, processo, fonte externa SOGI, etc.) — campos irrelevantes para documentos de qualidade. O usuário precisa de um formulário focado em **controle de versões/revisões**, **elaboração/aprovação**, **validade**, **referências cruzadas** e **protocolo de recebimento/leitura**.

### Infraestrutura existente reutilizável
- **`document_versions`** — já existe no banco com `version_number`, `changes_summary`, `created_by_user_id`, `file_path`, `is_current`
- **`document_read_campaigns` + `document_read_recipients`** — sistema completo de campanhas de leitura com status (pending → viewed → confirmed) e prazos
- **`document_relations`** — referências cruzadas entre documentos já suportadas
- **`documents`** — tabela de anexos com `related_model` / `related_id`
- **`CollaboratorMultiSelect`** — componente pronto para seleção de múltiplos usuários
- **Service functions em `documentCenter.ts`** — `createReadCampaign`, `confirmReadRecipient`, `markDocumentViewed` já implementadas

### Mudanças no Banco de Dados

**Alterar tabela `sgq_iso_documents`** — adicionar colunas para elaboração, aprovação e título:
```sql
ALTER TABLE sgq_iso_documents
  ADD COLUMN title text NOT NULL DEFAULT '',
  ADD COLUMN elaborated_by_user_id uuid REFERENCES profiles(id),
  ADD COLUMN approved_by_user_id uuid REFERENCES profiles(id),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN current_version_number integer DEFAULT 1;
```

Remover colunas irrelevantes para SGQ (issuing_body, process_number, external_source_*) pode ser feito em migração futura — por ora, torná-las opcionais no formulário (já são nullable).

**Nova tabela `sgq_document_versions`** — controle de versões/revisões dedicado:
```sql
CREATE TABLE sgq_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  version_number integer NOT NULL,
  changes_summary text,
  elaborated_by_user_id uuid REFERENCES profiles(id),
  approved_by_user_id uuid REFERENCES profiles(id),
  approved_at timestamptz,
  attachment_document_id uuid REFERENCES documents(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sgq_document_id, version_number)
);
```

**Nova tabela `sgq_document_references`** — referências cruzadas entre documentos SGQ:
```sql
CREATE TABLE sgq_document_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  referenced_document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  notes text,
  created_at timestamptz DEFAULT now()
);
```

**Nova tabela `sgq_read_campaigns`** + **`sgq_read_recipients`** — protocolo de recebimento/leitura:
```sql
CREATE TABLE sgq_read_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  title text NOT NULL,
  message text,
  due_at timestamptz,
  created_by_user_id uuid REFERENCES profiles(id),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE sgq_read_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES sgq_read_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  status text DEFAULT 'pending',
  sent_at timestamptz DEFAULT now(),
  viewed_at timestamptz,
  confirmed_at timestamptz,
  confirmation_note text,
  due_at timestamptz
);
```

RLS em todas as novas tabelas com `get_user_company_id()`.

### Mudanças no Service (`sgqIsoDocuments.ts`)

Reescrever para refletir o novo modelo:
- `createSgqDocument` — recebe título, tipo, elaborador, aprovador, filial, validade, anexo obrigatório, destinatários de leitura, referências a outros documentos. Cria o registro principal, versão 1, campanha de leitura e referências em uma transação lógica.
- `createSgqDocumentVersion` — cria nova versão com changes_summary, novo anexo, novo elaborador/aprovador, e opcionalmente nova campanha de leitura para os destinatários.
- `getSgqDocumentVersions` — retorna histórico de versões com elaborador, aprovador, anexo e data.
- `getSgqReadCampaigns` / `confirmSgqRead` — protocolo de recebimento.
- `getSgqDocumentReferences` / `addSgqDocumentReference` — referências cruzadas.

### Mudanças no Componente (`SGQIsoDocumentsTab.tsx`)

Reescrever com formulário próprio contendo:

**Formulário de criação:**
1. Título do documento (obrigatório)
2. Tipo (Manual, Procedimento, IT, Formulário, etc.)
3. Filial (Select)
4. Elaborado por (Select de colaboradores)
5. Aprovado por (Select de colaboradores)
6. Data de validade (obrigatório)
7. Anexo inicial (obrigatório — file input)
8. Destinatários de leitura (CollaboratorMultiSelect — obrigatório)
9. Referências a outros documentos (multi-select buscando da tabela `documents`)
10. Observações

**Tabela principal** — colunas: Título, Tipo, Filial, Elaborador, Aprovador, Validade, Dias Restantes, Status, Versão Atual, Destinatários Pendentes, Ações

**Dialogs secundários:**
- **Versões**: Histórico com nº versão, o que mudou, quem elaborou, quem aprovou, download do anexo
- **Nova versão**: Formulário com changes_summary, novo anexo, elaborador, aprovador, novos destinatários
- **Recebimentos**: Lista de destinatários com status (pendente/visualizado/confirmado)

### Arquivos modificados
- `supabase/migrations/` — nova migração para schema
- `src/services/sgqIsoDocuments.ts` — reescrita completa
- `src/components/document-control/SGQIsoDocumentsTab.tsx` — reescrita completa

