# Resumo Executivo — Análise ISO 9001:2015 Item 8.2.4

**Norma:** ISO 9001:2015
**Item:** 8.2.4 — Alterações nos requisitos para produtos e serviços
**Data da análise:** 2026-03-09
**Tipo de análise:** Tipo B — Conformidade do Sistema (codebase)
**Score de Confiança:** 2.3 / 5 — Parcial com lacunas críticas

---

## Contexto do Requisito

O item 8.2.4 exige que a organização assegure que, quando os requisitos para produtos e serviços forem alterados, as informações pertinentes sejam atualizadas e que as pessoas relevantes sejam conscientizadas dos requisitos alterados. O requisito está diretamente ligado a 8.2.2 (determinação de requisitos) e 8.2.3 (análise de viabilidade antes da aceitação de pedidos). Em essência, toda alteração em contrato ou pedido deve:

- (a) Passar por um processo de análise crítica da capacidade de atendimento antes da aceitação;
- (b) Resultar em atualização da informação documentada relevante;
- (c) Ser comunicada às partes internas afetadas (equipes de produção, entrega, qualidade).

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|---|---|---|---|
| Gestão de Contratos de Fornecedores | `src/services/supplierContracts.ts` | 2.5 | CRUD funcional; sem histórico de versões ou log de alterações |
| Modal de Criação de Contrato | `src/components/SupplierContractModal.tsx` | 2.0 | Criação apenas; sem modal de edição/aditivo separado |
| Modal de Detalhes do Contrato | `src/components/SupplierContractDetailsModal.tsx` | 2.0 | Exibe dados; sem ação de "Registrar Alteração" ou "Novo Aditivo" |
| Aba de Contratos (UI) | `src/components/SupplierContractsTab.tsx` | 2.0 | Lista e visualiza contratos; sem fluxo de alteração controlada |
| Controle de Escopo de Projetos | `src/integrations/supabase/types.ts` (tabela `project_scope_changes`) | 3.5 | Modelo robusto para change requests de projetos — não adaptado para contratos de clientes |
| Audit Trail de Documentos | `src/integrations/supabase/types.ts` (tabela `document_audit_trail`) | 3.0 | Rastreia alterações em documentos do GED; não aplicado a contratos |
| Comunicação com Partes Interessadas | `src/components/StakeholderCommunicationHub.tsx` | 2.5 | Pode registrar comunicações; não vinculado a eventos de alteração contratual |
| Módulo de Pedidos de Clientes | Não localizado | 0 | Não existe tabela ou serviço dedicado a pedidos/orders de clientes finais |
| Análise de viabilidade antes de aceitar alteração | Não localizado | 0 | Sem processo de capacity check pré-aceitação de alteração |

---

## Top 5 Pontos Fortes

1. **Modelo `project_scope_changes` demonstra padrão correto de gestão de mudanças** — A tabela `project_scope_changes` (`src/integrations/supabase/types.ts`, linha 19473) contém `change_request`, `justification`, `impact_description`, `budget_impact`, `schedule_impact_days`, `status` e `approved_by_user_id`. Este é o padrão de design que deveria ser adaptado para alterações contratuais com clientes.

2. **`document_audit_trail` oferece mecanismo de audit trail reutilizável** — A tabela `document_audit_trail` persiste `old_values: Json`, `new_values: Json`, `action`, `user_id` e `timestamp` — estrutura pronta para ser replicada na gestão de alterações contratuais com clientes.

3. **`updateSupplierContract()` funcional como base** — `src/services/supplierContracts.ts`, linha 110, implementa `updateSupplierContract(id, updates)` via Supabase. A infraestrutura de persistência existe, faltando apenas o camada de controle e rastreabilidade.

4. **`updated_at` automático no modelo de contratos** — A tabela `supplier_contracts` mantém `updated_at` atualizado automaticamente, o que provê uma trilha mínima de data da última modificação — embora insuficiente para rastreabilidade completa.

5. **`sla_requirements: Json` permite registrar acordos de nível de serviço negociados** — O campo `sla_requirements` na tabela `supplier_contracts` suporta termos estruturados que poderiam incluir condições de alteração e análise de capacidade, mesmo que atualmente seja de uso livre.

---

## Top 5 Lacunas Críticas

1. **[Crítica] Ausência total de módulo para pedidos/requisitos de clientes finais** — O codebase não possui tabela, serviço ou página para registro e controle de pedidos ou requisitos de clientes finais. A tabela `supplier_contracts` cobre apenas o lado de fornecimento. Não há `customer_orders`, `service_requests` ou equivalente. O requisito 8.2.4 aplica-se ao ciclo de pedido do cliente, não ao contrato com fornecedor.

2. **[Crítica] Sem histórico de versões de contratos** — `updateSupplierContract()` sobrescreve os dados diretamente sem registrar a versão anterior. Não há tabela `supplier_contract_versions` ou equivalente. Qualquer alteração de valor, prazo ou escopo destrói os dados anteriores sem rastro auditável.

3. **[Crítica] Sem processo de análise de viabilidade antes da aceitação de alteração (8.2.3 + 8.2.4)** — Não há workflow, checklist ou campo obrigatório que force uma análise da capacidade de atendimento antes de um contrato ou pedido alterado ser aceito. A `updateSupplierContract()` aceita qualquer campo sem validação de negócio.

4. **[Major] Sem notificação a partes internas sobre alterações** — Quando um contrato é atualizado via `updateSupplierContract()`, não há disparo de notificação para usuários afetados, equipes responsáveis ou stakeholders vinculados. O sistema de notificações em `src/services/notificationTriggers.ts` existe mas não está conectado a eventos de alteração contratual.

5. **[Major] `SupplierContractModal.tsx` não possui fluxo de aditivo/emenda** — O modal de criação só permite criar contratos novos; não há modal de "Registrar Aditivo" ou "Solicitar Alteração" que exija justificativa, análise e aprovação antes de persistir. Qualquer alteração é silenciosa e direta.

---

## Cobertura por Sub-requisito

| Sub-requisito | Status | Evidência / Lacuna |
|---|---|---|
| 8.2.4 — Atualização de informações documentadas quando requisitos alterados | Parcial | `updated_at` atualiza automaticamente; não há histórico de versões ou log estruturado de o que mudou |
| 8.2.4 — Conscientização das pessoas relevantes sobre alterações | Ausente | `notificationTriggers.ts` existe mas não é invocado em `updateSupplierContract()` |
| 8.2.3 (pré-requisito) — Análise crítica antes da aceitação | Ausente | Sem campo de confirmação de viabilidade no fluxo de alteração |
| Módulo de pedidos de clientes finais | Ausente | Nenhuma tabela ou serviço identificado para `customer_orders` |
| Rastreabilidade de histórico de alterações | Ausente | Sem tabela `contract_versions` ou equivalente; `document_audit_trail` não cobre contratos |

---

## Plano de Ação Priorizado

### Faixa 1 — Crítico (resolver em até 30 dias)

| # | Ação | Arquivo / Artefato Alvo | Esforço |
|---|---|---|---|
| 1 | Criar tabela `supplier_contract_changes` modelada sobre `project_scope_changes`: campos `change_type`, `change_description`, `previous_values: Json`, `justification`, `impact_description`, `status`, `approved_by_user_id`, `approved_at`, `contract_id` | Migration Supabase | Médio |
| 2 | Criar função `registerContractChange(contractId, changes, justification)` em `supplierContracts.ts` que persiste o change record antes de executar o `update` | `src/services/supplierContracts.ts` | Médio |
| 3 | Adicionar botão "Registrar Alteração" no `SupplierContractDetailsModal.tsx` com formulário de justificativa obrigatória e análise de impacto | `src/components/SupplierContractDetailsModal.tsx` | Médio |

### Faixa 2 — Major (resolver em até 90 dias)

| # | Ação | Arquivo / Artefato Alvo | Esforço |
|---|---|---|---|
| 4 | Adicionar step de confirmação de viabilidade no fluxo de alteração: campo `capacity_confirmed: boolean` + responsável que confirma | Novo componente de wizard | Médio |
| 5 | Conectar `updateSupplierContract()` ao sistema de notificações: disparar notificação via `notificationTriggers.ts` para o `responsible_user_id` e stakeholders vinculados ao contrato | `src/services/supplierContracts.ts` + `src/services/notificationTriggers.ts` | Médio |
| 6 | Criar módulo básico de pedidos de clientes (`customer_orders`) com campos: `order_number`, `customer_id`, `requirements`, `status`, `accepted_at`, `change_log: Json` | Nova tabela + serviço + página | Alto |

### Faixa 3 — Melhoria (até 180 dias)

| # | Ação | Esforço |
|---|---|---|
| 7 | Aplicar `document_audit_trail` (ou equivalente) à tabela `supplier_contracts` via trigger Supabase, registrando `old_values` e `new_values` automaticamente a cada `UPDATE` | Médio |
| 8 | Criar relatório de "Histórico de Alterações Contratuais" acessível via `SupplierContractDetailsModal` mostrando a linha do tempo de mudanças com justificativas | Alto |

---

## Guia de Validação E2E

Para considerar 8.2.4 atendido, um auditor deve conseguir demonstrar:

1. **Registrar uma alteração contratual** (ex: extensão de prazo ou revisão de valor) via UI com preenchimento de justificativa obrigatória.
2. **Consultar o histórico de versões** de um contrato e ver os valores anteriores lado a lado com os atuais.
3. **Verificar que uma notificação foi disparada** ao responsável e partes afetadas após a alteração.
4. **Confirmar a análise de viabilidade** — campo `capacity_confirmed` preenchido pelo responsável antes da aprovação.
5. **Rastrear quem aprovou** a alteração, quando e com qual justificativa.

---

## Conclusão

O codebase possui a infraestrutura técnica necessária para implementar um processo robusto de controle de alterações contratuais — evidenciado pelo padrão já implementado em `project_scope_changes` e `document_audit_trail`. No entanto, esses padrões não foram aplicados ao módulo de contratos de fornecedores nem existe qualquer equivalente para pedidos de clientes finais. O `updateSupplierContract()` atual permite alterações silenciosas sem rastreabilidade, sem análise de viabilidade e sem notificação de partes internas — descumprindo os três requisitos fundamentais do item 8.2.4. O score 2.3/5 reflete a existência de padrões de design corretos no codebase, mas a ausência de sua aplicação no contexto específico deste requisito normativo.
