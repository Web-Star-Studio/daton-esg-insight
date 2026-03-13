

# Notificações Robustas no Módulo de Controle de Documentos

## Estado Atual
- **Regulatórios**: Já tem `syncRegulatoryReviewAlerts` que notifica o responsável sobre docs vencidos/a vencer. Funciona.
- **SGQ/ISO**: Zero notificações. Nenhum evento gera notificação — nem criação, revisão, aprovação, rejeição, ou campanhas de leitura.
- **Nenhuma** verificação periódica de vencimento para documentos SGQ/ISO.

## Eventos que precisam de notificações

### SGQ/ISO — Notificações direcionadas (usuário específico)
1. **Revisão solicitada** → notificar o *revisor designado* quando alguém envia doc para revisão
2. **Revisão aprovada** → notificar o *solicitante* que a revisão foi aprovada e nova versão criada
3. **Revisão rejeitada** → notificar o *solicitante* com o motivo da rejeição
4. **Campanha de leitura criada** → notificar cada *destinatário* que tem um documento pendente de leitura
5. **Documento SGQ criado** → notificar o *aprovador designado* que foi designado como aprovador

### SGQ/ISO — Verificação periódica
6. **Documentos SGQ a vencer/vencidos** → análogo ao `syncRegulatoryReviewAlerts`, verificar `sgq_iso_documents.expiration_date` e notificar elaborador

## Alterações

### 1. Novo: `src/services/sgqDocumentNotifications.ts`
Serviço dedicado com funções:
- `notifyReviewRequested(reviewerUserId, docTitle, docId)` — cria notificação para o revisor
- `notifyReviewApproved(requesterUserId, docTitle, docId, newVersion)` — cria notificação para quem solicitou
- `notifyReviewRejected(requesterUserId, docTitle, docId, reason)` — cria notificação para quem solicitou
- `notifyReadCampaignCreated(recipientUserIds[], docTitle, docId)` — cria notificação em lote para destinatários
- `notifyDocumentCreated(approverUserId, docTitle, docId)` — notifica aprovador designado
- `syncSgqExpirationAlerts()` — verifica vencimento de docs SGQ e notifica elaborador (com deduplicação por alert_key)

Todas usam `createNotificationForUser` com `action_url: '/controle-documentos'`, categoria `sgq_documents`, e deduplicação via `metadata.alert_key`.

### 2. Alterar: `src/services/sgqIsoDocuments.ts`
Adicionar chamadas de notificação em:
- `createSgqDocument` (~linha 417) → chamar `notifyDocumentCreated` + `notifyReadCampaignCreated`
- `createReviewRequest` (~linha 514) → chamar `notifyReviewRequested`
- `approveReviewRequest` (~linha 652) → chamar `notifyReviewApproved` + `notifyReadCampaignCreated` (nova campanha)
- `rejectReviewRequest` (~linha 668) → chamar `notifyReviewRejected`

### 3. Alterar: `src/services/notificationTriggers.ts`
Adicionar novo event type `document_sgq_expiring` ao `BusinessEvent` e novo método `checkSgqDocumentExpirations()` que consulta `sgq_iso_documents` com `expiration_date` próximo.

### 4. Alterar: `src/hooks/useNotificationTriggers.ts`
Adicionar query periódica para `syncSgqExpirationAlerts` (diária, como já existe para licenças).

### 5. Alterar: `src/components/document-control/RegulatoryDocumentsTab.tsx`
Sem alterações — já funciona com `syncRegulatoryReviewAlerts`.

## Deduplicação
Todas as notificações usam `metadata.alert_key` composto por tipo + entityId + data, verificando existência antes de criar. Isso evita spam ao recarregar páginas ou re-executar verificações periódicas.

