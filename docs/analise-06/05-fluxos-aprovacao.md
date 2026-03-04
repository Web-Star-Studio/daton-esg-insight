# Análise ISO 9001:2015 — Item 7.5: Fluxos de Aprovação

**Data da análise:** 2026-03-04
**Módulo:** Fluxos de Aprovação de Documentos
**Arquivo(s) principal(is):** `src/components/ApprovalWorkflowModal.tsx`, `src/components/ApprovalWorkflowManager.tsx`, `src/services/gedDocuments.ts` (approvalWorkflowsService, documentApprovalsService), `src/services/documentApprovalLog.ts`
**Nota de confiança:** 3.5/5

---

## 1. Descrição do Módulo

O módulo de Fluxos de Aprovação implementa workflows multi-etapa para análise crítica e aprovação de documentos, cobrindo diretamente o requisito ISO 7.5.2(c) — "análise crítica e aprovação quanto à adequação e suficiência". Suporta aprovações sequenciais e paralelas, com rastreamento de status completo (rascunho → em_aprovação → aprovado/rejeitado → obsoleto).

Equivale ao mecanismo de "assinatura eletrônica" do PSG-DOC para emissão, comentários, aprovação e revisão de documentos.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Documentos podem ser marcados como `requires_approval`
- [x] Status de aprovação rastreado na tabela `documents` e `document_approvals`
- [x] Workflows reutilizáveis definidos e armazenados

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] **Análise crítica**: Etapas de tipo `review` no workflow
- [x] **Aprovação**: Etapas de tipo `approval` com aprovadores designados
- [x] **Notificação**: Etapas de tipo `notification` para comunicação
- [x] **Aprovação paralela**: Campo `parallel_approval` permite múltiplos aprovadores simultâneos
- [x] **Quórum**: `required_approvals` define quantas aprovações são necessárias por etapa
- [x] **Rastreamento**: `approval_date`, `approval_notes`, `rejection_reason` registrados
- [ ] **Assinatura eletrônica**: Usa `approver_user_id` + timestamp, não assinatura digital qualificada
- [ ] **Delegação**: Sem mecanismo de delegação de aprovação

**Evidências:**
- `src/services/gedDocuments.ts:19-28` — Interface `ApprovalStep`:
  ```typescript
  interface ApprovalStep {
    type: 'approval' | 'review' | 'notification';
    approver_user_ids: string[];
    required_approvals: number;
    parallel_approval: boolean;
  }
  ```
- `src/services/gedDocuments.ts:42-54` — Interface `DocumentApproval` com status enum completo
- `src/services/gedDocuments.ts:260-287` — `updateApprovalStatus()` registra approver, data, notes

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Status de aprovação visível na listagem de documentos
- [x] Aprovações pendentes consultáveis via `getPendingApprovals()`
- [x] Join com tabela `documents` para contexto completo

#### 2.3.2 Controle de Alterações
- [x] Status `obsoleto` permite marcar documentos desatualizados
- [x] Log de aprovações registra todas as ações (`documentApprovalLog.ts`)
- [x] Transição de status controlada por serviço centralizado
- [ ] Sem lock durante processo de aprovação (documento pode ser editado enquanto aguarda)

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P4 | Assinatura eletrônica | ⚠️ Parcial | user_id + timestamp, não assinatura qualificada |
| P5 | Rastreabilidade revisão | ✅ Implementado | approval_date + approval_notes + rejection_reason |
| P6 | Obsolescência | ✅ Implementado | Status "obsoleto" no enum |
| P7 | Grupos de acesso | ⚠️ Parcial | Aprovadores designados por user_id, não por grupo |
| P10 | Protocolo implementação | ❌ Ausente | Sem confirmação de leitura pós-aprovação |

## 4. Evidências Detalhadas

### 4.1 Tabelas

**`document_approval_workflows`**
| Campo | Tipo | Função |
|-------|------|--------|
| `name` | string | Nome do workflow |
| `steps` | json | Etapas do workflow (ApprovalStep[]) |
| `is_active` | boolean | Se o workflow está ativo |
| `created_by_user_id` | uuid | Criador do workflow |

**`document_approvals`**
| Campo | Tipo | Função |
|-------|------|--------|
| `document_id` | uuid FK | Documento sendo aprovado |
| `workflow_id` | uuid FK | Workflow utilizado |
| `current_step` | integer | Etapa atual |
| `status` | enum | rascunho/em_aprovacao/aprovado/rejeitado/obsoleto |
| `approver_user_id` | uuid | Quem aprovou/rejeitou |
| `approval_date` | timestamp | Data da ação |
| `approval_notes` | text | Notas de aprovação |
| `rejection_reason` | text | Motivo da rejeição |

### 4.2 Serviços
- `approvalWorkflowsService` — CRUD de workflows (criar, atualizar, soft-delete)
- `documentApprovalsService` — CRUD de aprovações + `getPendingApprovals()`
- `documentApprovalLog.ts` — Log de ações: approved, rejected, batch_approved, edited

### 4.3 Componentes
- `ApprovalWorkflowModal.tsx` — Visualização de progresso de aprovação
- `ApprovalWorkflowManager.tsx` — Criação e gestão de workflows

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem assinatura eletrônica qualificada | Alta | Implementar assinatura com hash + certificado ou ao menos senha de confirmação |
| 2 | Sem lock durante aprovação | Média | Bloquear edição de documentos em status `em_aprovacao` |
| 3 | Sem delegação de aprovação | Média | Adicionar funcionalidade de delegação temporária |
| 4 | Sem escalação por timeout | Baixa | Implementar alertas/escalação quando aprovação demora |
| 5 | Sem confirmação de implementação | Alta | Adicionar etapa de "implementação" no workflow (equiv. RG-DOC.01) |

## 6. Nota de Confiança: 3.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 4/5 | Multi-step, paralelo, quórum, status completo |
| Aderência PSG-DOC | 25% | 3/5 | Falta assinatura qualificada e protocolo implementação |
| Maturidade do código | 15% | 3.5/5 | Serviços bem tipados, tratamento de erros |
| Rastreabilidade | 15% | 4/5 | Log de aprovações, notas, motivos de rejeição |
| UX/Usabilidade | 15% | 3.5/5 | Modal de progresso, manager de workflows |
| **Média ponderada** | **100%** | **3.5/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Criar Workflow**
   - Em "Gerenciar Workflows" → criar workflow com 2 etapas
   - Etapa 1: Review (revisor A)
   - Etapa 2: Approval (aprovador B)
   - Salvar → verificar que aparece na lista

2. **Submeter para Aprovação**
   - Documento com `requires_approval = true`
   - Selecionar workflow → submeter
   - Status muda para `em_aprovacao`
   - Verificar que aparece em "Aprovações Pendentes"

3. **Fluxo Completo**
   - Revisor A: Review → aprovar etapa 1
   - Aprovador B: Approve → aprovar etapa 2
   - Status final: `aprovado`
   - Verificar `approval_date` e `approval_notes`

4. **Rejeição**
   - Submeter documento → rejeitar na etapa 1
   - Status: `rejeitado`
   - Verificar que `rejection_reason` é registrado

### Checklist
- [ ] Workflow pode ser criado com múltiplas etapas
- [ ] Documento transita: rascunho → em_aprovação → aprovado
- [ ] Rejeição registra motivo
- [ ] Aprovações pendentes são listáveis
- [ ] Log de aprovação registra todas as ações
- [ ] Status "obsoleto" pode ser aplicado a documentos aprovados
