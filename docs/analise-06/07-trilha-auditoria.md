# Análise ISO 9001:2015 — Item 7.5: Trilha de Auditoria

**Data da análise:** 2026-03-04
**Módulo:** Trilha de Auditoria (Audit Trail)
**Arquivo(s) principal(is):** `src/hooks/admin/useAuditTrail.ts`, `src/services/documentApprovalLog.ts`, `src/services/gedDocuments.ts` (AuditTrailEntry)
**Nota de confiança:** 3.0/5

---

## 1. Descrição do Módulo

O módulo de Trilha de Auditoria registra e exibe um log de todas as ações realizadas no sistema, incluindo criação, atualização, exclusão, login/logout e ações administrativas. Para documentos especificamente, há uma tabela dedicada (`document_audit_trail`) e um log de aprovações (`extraction_approval_log`). O módulo suporta filtros por data, usuário e tipo de ação, com exportação CSV.

Atende parcialmente ao PSG-DOC no que tange à rastreabilidade de revisões e ao controle de quem fez o quê.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Registro centralizado de atividades do sistema
- [x] Tipos de ação mapeados: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, audit_created, etc.
- [x] Integração com perfis de usuário para identificação

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Ações de criação e atualização registradas com detalhes JSON
- [x] Identificação do usuário que realizou a ação
- [ ] Nem todas as edições de documentos disparam log automaticamente

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Logs disponíveis na interface administrativa
- [x] Filtros por data, usuário, tipo de ação
- [x] Paginação para grandes volumes

#### 2.3.2 Controle de Alterações e Retenção
- [x] **Valores antigos e novos**: `old_values` e `new_values` na `document_audit_trail`
- [x] **IP do usuário**: `user_ip_address` rastreado
- [x] **Exportação CSV**: Disponível para auditoria externa
- [x] **Paginação**: Controle de volume com offset/limit
- [ ] **Retenção**: Apenas 90 dias (filtro `gte('created_at', ninetyDaysAgo)`)
- [ ] **Sem arquivo**: Logs antigos são filtrados, não há archiving antes da purga
- [ ] **Sem proteção contra adulteração**: Logs em tabela comum, sem hash chain

**Evidências:**
- `src/hooks/admin/useAuditTrail.ts:16-26` — Interface `AuditLogEntry`
- `src/hooks/admin/useAuditTrail.ts:61-63` — Retenção 90 dias:
  ```typescript
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  ```
- `src/hooks/admin/useAuditTrail.ts:35-54` — 14 tipos de ação mapeados com labels PT-BR
- `src/services/gedDocuments.ts:118-128` — Interface `AuditTrailEntry` com `old_values`, `new_values`, `user_ip_address`

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P5 | Rastreabilidade revisão | ⚠️ Parcial | Registra ações mas 90 dias é curto |
| P8 | Backup e proteção | ❌ Ausente | Sem archiving de logs antes da expiração |
| P15 | Retenção com períodos definidos | ⚠️ Parcial | 90 dias fixo, sem configuração por tipo |

**Observação crítica:** O PSG-DOC seção 8 define que registros devem ter retenção "Enquanto Vigente" para itens como o Protocolo de Implementação. A retenção de 90 dias para logs de auditoria é significativamente mais curta do que o esperado para fins ISO.

## 4. Evidências Detalhadas

### 4.1 Tabelas

**`activity_logs`** (trilha principal)
| Campo | Tipo | Função |
|-------|------|--------|
| `user_id` | uuid | Quem realizou a ação |
| `action_type` | string | Tipo (CREATE, UPDATE, DELETE, etc.) |
| `description` | text | Descrição da ação |
| `details_json` | json | Detalhes adicionais |
| `created_at` | timestamp | Quando ocorreu |
| `company_id` | uuid | Empresa |

**`document_audit_trail`** (trilha documental)
| Campo | Tipo | Função |
|-------|------|--------|
| `document_id` | uuid FK | Documento afetado |
| `action` | string | Ação realizada |
| `user_id` | uuid | Quem realizou |
| `user_ip_address` | string | IP do usuário |
| `old_values` | json | Valores antes da alteração |
| `new_values` | json | Valores depois da alteração |
| `timestamp` | timestamp | Quando ocorreu |
| `details` | text | Detalhes textuais |

**`document_processing_audit`** (pipeline AI)
| Campo | Tipo | Função |
|-------|------|--------|
| `action_type` | string | Tipo de ação no pipeline |
| `pipeline_step` | string | Etapa do processamento |
| `duration_ms` | integer | Duração em milissegundos |
| `error_details` | text | Detalhes de erro |

### 4.2 Hook
- `useAuditTrail(filters)` — Hook com React Query, filtros, paginação, exportação CSV

### 4.3 Exportação CSV
Função `exportToCSV` que gera download com colunas: Data, Usuário, Email, Ação, Descrição, Detalhes.

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Retenção de apenas 90 dias | Alta | Aumentar para mínimo 3 anos ou "enquanto vigente" |
| 2 | Sem archiving antes da purga | Alta | Implementar export/archive automático para storage antes de filtrar |
| 3 | Sem proteção contra adulteração | Média | Implementar hash chain ou tabela append-only |
| 4 | Nem toda ação em documentos gera log | Média | Adicionar triggers SQL para INSERT/UPDATE/DELETE na tabela documents |
| 5 | Retenção não configurável por tipo | Média | Permitir configurar retenção diferente por tipo de registro |
| 6 | Sem alerta quando logs estão próximos da purga | Baixa | Notificar admin antes da remoção |

## 6. Nota de Confiança: 3.0/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 3.5/5 | Registra ações com old/new values, IP, user |
| Aderência PSG-DOC | 25% | 2/5 | Retenção 90 dias insuficiente, sem archiving |
| Maturidade do código | 15% | 3.5/5 | Hook bem estruturado, tipagem, labels PT-BR |
| Rastreabilidade | 15% | 3.5/5 | old_values/new_values, IP, exportação CSV |
| UX/Usabilidade | 15% | 3.5/5 | Filtros, paginação, exportação |
| **Média ponderada** | **100%** | **3.0/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Geração de Log**
   - Criar documento → verificar que aparece log CREATE
   - Editar documento → verificar log UPDATE com old/new values
   - Deletar documento → verificar log DELETE

2. **Filtros**
   - Filtrar por tipo "CREATE" → apenas criações
   - Filtrar por data → apenas período selecionado
   - Filtrar por usuário → apenas ações desse usuário

3. **Retenção**
   - Verificar que logs > 90 dias não aparecem na consulta
   - Verificar se existe archiving antes da exclusão (esperado: ausente)

4. **Exportação**
   - Exportar CSV → verificar que contém Data, Usuário, Email, Ação, Descrição

### Checklist
- [ ] Ações de documento geram logs automaticamente
- [ ] old_values e new_values são registrados para updates
- [ ] IP do usuário é capturado
- [ ] Filtros funcionam (data, usuário, tipo)
- [ ] Paginação funciona corretamente
- [ ] Exportação CSV gera arquivo válido
- [ ] Logs de aprovação são registrados no documentApprovalLog
