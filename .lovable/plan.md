

## Correções e novo fluxo de Revisão para SGQ/ISO

### Problemas identificados

1. **Confirmação de leitura por qualquer usuário** — A UI exibe o botão "Confirmar" para todos os destinatários, permitindo que um admin confirme por outro. A RLS no banco já restringe UPDATE a `user_id = auth.uid()`, mas a UI precisa esconder o botão para quem não é o próprio destinatário.

2. **Configuração de Prazo Padrão não aplicada ao SGQ** — A aba Configurações só salva/carrega de `regulatory_document_settings` (via `getRegulatorySettings`/`updateRegulatorySettings`). A tabela `sgq_iso_document_settings` existe e o service SGQ a usa, mas nunca é exposta na UI de configurações.

3. **Falta fluxo de "Enviar para Revisão"** — Atualmente, criar nova versão é instantâneo (o usuário preenche elaborador, aprovador e anexo, e a versão é registrada diretamente). O correto é: alguém envia o documento para revisão → o revisor recebe notificação → o revisor aprova e só então a nova versão é registrada.

---

### Solução

#### 1. Confirmar leitura apenas pelo próprio usuário

**`SGQIsoDocumentsTab.tsx`**:
- Obter o `userId` do usuário logado (via `supabase.auth.getUser()` em um useEffect ou query dedicada)
- No dialog de Recebimentos, exibir o botão "Confirmar" apenas quando `r.user_id === currentUserId`

#### 2. Configuração de Prazo SGQ na aba de Configurações

**`DocumentSettingsTab.tsx`**:
- Adicionar um segundo Card para "Prazo SGQ/ISO" que carrega/salva via `getSgqSettings`/`updateSgqSettings`
- Separar visualmente: um card para regulatório, outro para SGQ

#### 3. Fluxo de Revisão e Aprovação

**Banco de dados** — nova tabela `sgq_review_requests`:
```sql
CREATE TABLE sgq_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sgq_document_id uuid NOT NULL REFERENCES sgq_iso_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id),
  requested_by_user_id uuid NOT NULL REFERENCES profiles(id),
  reviewer_user_id uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  changes_summary text NOT NULL,
  attachment_document_id uuid REFERENCES documents(id),
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```
RLS: SELECT/INSERT para mesma empresa, UPDATE restrito a `reviewer_user_id = auth.uid()`.

**Service** (`sgqIsoDocuments.ts`):
- `createReviewRequest(docId, reviewerUserId, changesSummary, attachment)` — faz upload do anexo, cria registro na tabela, envia notificação ao revisor
- `approveReviewRequest(requestId, reviewerNotes?)` — marca como approved, cria a nova versão automaticamente (incrementa version, cria sgq_document_versions, atualiza sgq_iso_documents), cria campanha de leitura
- `rejectReviewRequest(requestId, reviewerNotes)` — marca como rejected
- `getPendingReviewRequests(docId?)` — lista solicitações pendentes

**UI** (`SGQIsoDocumentsTab.tsx`):
- Renomear botão "Nova Versão" → "Enviar para Revisão"
- Dialog reformulado: campos são "O que mudou", "Novo Anexo", "Revisor/Aprovador" (um select de usuário)
- Nova coluna na tabela principal: "Revisões Pendentes"
- Novo dialog: "Revisões Pendentes" — lista as solicitações com opções de Aprovar/Rejeitar (visível apenas para o revisor designado)
- Ao aprovar, o sistema cria a versão automaticamente e notifica os destinatários de leitura configurados

---

### Arquivos modificados
- `supabase/migrations/` — nova migração com tabela `sgq_review_requests`
- `src/services/sgqIsoDocuments.ts` — novas funções de review + refatorar `createSgqDocumentVersion` para ser chamada internamente pela aprovação
- `src/components/document-control/SGQIsoDocumentsTab.tsx` — fluxo de revisão, restrição de confirmação de leitura ao próprio usuário
- `src/components/document-control/DocumentSettingsTab.tsx` — card de configuração SGQ

