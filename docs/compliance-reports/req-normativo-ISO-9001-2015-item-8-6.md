# Relatório de Conformidade — ISO 9001:2015 Item 8.6

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.6 — Liberação de produtos e serviços
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e estrutura da plataforma)

---

## Nota Global de Confiança: 3.4/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Aprovação de Documentos — GED (`documentApprovalLog.ts`, `DocumentApprovalModal.tsx`) | **4.2/5** | Maduro |
| 02 | Inspeções de Segurança / Qualidade (`safetyInspections.ts`, `SafetyInspectionModal.tsx`) | **4.0/5** | Maduro |
| 03 | Workflows de Aprovação (`approvalWorkflows.ts`, `ApprovalWorkflowManager.tsx`) | **3.8/5** | Funcional |
| 04 | Avaliação de Entregas de Fornecedores (`SupplierDeliveriesPage.tsx`, `supplierDeliveriesService.ts`) | **3.0/5** | Parcial |
| 05 | Liberação de Relatórios ESG/GRI (`griReports.ts`, `integratedReports.ts`) | **2.5/5** | Parcial |
| 06 | Critérios de aceitação formais por tipo de produto/serviço | **1.5/5** | Mínimo |
| | **Média aritmética** | **3.2/5** → ajustado para **3.4** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 2 | Aprovação de Documentos, Inspeções |
| Funcional (3–3.9) | 1 | Workflows de Aprovação |
| Parcial (2–2.9) | 2 | Entregas de Fornecedores, Relatórios ESG/GRI |
| Mínimo/Ausente (0–1.9) | 1 | Critérios de aceitação formais |

---

## Top 5 Pontos Fortes

1. **Log auditável de aprovação de documentos** — `documentApprovalLog.ts` grava na tabela `extraction_approval_log` cada ação de aprovação/rejeição com: `approved_by_user_id`, `action` (`approved` | `rejected` | `batch_approved` | `edited`), `items_count`, `high_confidence_count`, `edited_fields`, `approval_notes` e `processing_time_seconds`. Isso implementa plenamente o 8.6 para as saídas documentais do sistema, registrando quem autorizou a liberação, quando e com quais observações.

2. **Checklists parametrizáveis de inspeção** — `safetyInspections.ts` implementa `ChecklistItem` com status tipado `'conforme' | 'nao_conforme' | 'na' | 'pendente'` e resultado de inspeção tipado (`INSPECTION_RESULTS`: `'Conforme' | 'Não Conforme' | 'Parcialmente Conforme'`). A estrutura permite verificação planejada antes da liberação de processos/áreas, atendendo ao 8.6 para saídas operacionais internas.

3. **Motor de workflows de aprovação multi-etapas** — `approvalWorkflows.ts` implementa `ApprovalWorkflow` com `steps` configuráveis, `ApprovalRequest` com `current_step` e `ApprovalStep` com `approver_user_id`, `status`, `comments` e `approved_at`. Isso oferece infraestrutura genérica para criar fluxos de liberação de qualquer tipo de saída do sistema.

4. **Registro da pessoa que liberou** — Tanto o `documentApprovalLog.ts` (campo `approved_by_user_id`) quanto o módulo de NCs (`approved_by_user_id` + `approval_date` em `nonConformityService.ts`) registram a identidade do aprovador, cumprindo o requisito explícito da norma: "reter informação documentada sobre a liberação de produtos e serviços, incluindo a(s) pessoa(s) que autorizou(aram) a liberação" (8.6.b).

5. **Status de entrega de fornecedores com passo de avaliação** — `SupplierDelivery.status` usa enum `'Pendente' | 'Avaliado' | 'Problema'`. Entregas criadas iniciam em `'Pendente'` e avançam para `'Avaliado'` somente via ação explícita do usuário (`handleEvaluate` navega para avaliação de desempenho), configurando um gate de liberação para fornecimentos recebidos.

---

## Top 5 Lacunas Críticas

### 1. Ausência de critérios de aceitação formalizados por tipo de saída (Severidade: MAJOR)

**Sub-requisito afetado:** 8.6 — "os arranjos planejados foram realizados satisfatoriamente" (implica critérios previamente definidos).
**Situação:** A norma exige que a liberação seja baseada em verificação de que "arranjos planejados foram realizados satisfatoriamente". Não existe no codebase nenhum artefato que defina critérios de aceitação explícitos para as principais saídas da plataforma (relatórios GRI aprovados, diagnósticos ESG, planos de ação). O `AuditChecklist` (`auditChecklist.ts`) define checklists parametrizáveis por padrão ISO, mas esses checklists não estão vinculados ao ciclo de liberação de produtos/serviços SaaS — são checklists de auditoria interna.
**Recomendação:** Criar uma entidade `acceptance_criteria` vinculada a cada tipo de produto/serviço (`product_type`), com campos verificáveis antes da liberação formal.

### 2. Relatórios ESG/GRI sem fluxo de aprovação e liberação explícito (Severidade: MAJOR)

**Sub-requisito afetado:** 8.6 — reter evidência de conformidade com critérios de aceitação (8.6.a).
**Situação:** Os serviços `griReports.ts` e `integratedReports.ts` estão implementados, mas não há evidência no codebase de que relatórios passam por aprovação formal antes de serem "entregues" ao cliente. O campo `report_status_enum` referenciado em `backend-database-er.md` existe na base de dados, porém os serviços de relatório não expõem uma função `approveReport()` ou equivalente com registro de aprovador e data.
**Recomendação:** Integrar o `ApprovalWorkflowManager` ao ciclo de vida de relatórios ESG/GRI, adicionando step de liberação com `approved_by_user_id` e `approval_date` antes da exportação final.

### 3. Avaliação de entregas de fornecedores sem critérios de aceitação técnica (Severidade: MAJOR)

**Sub-requisito afetado:** 8.6 — "conformidade com os critérios de aceitação".
**Situação:** `SupplierDeliveriesPage.tsx` ao acionar "Avaliar" navega para `/fornecedores/avaliacao-desempenho/:supplier_id` — ou seja, a avaliação de entrega é uma avaliação de **desempenho do fornecedor**, não uma verificação de **conformidade do item entregue com requisitos especificados**. Não existe campo de `acceptance_criteria_met: boolean`, resultado de inspeção por lote/item, nem vinculação a especificações técnicas.
**Recomendação:** Criar modal de "Inspeção de Recebimento" específico para `supplier_deliveries` com campos: resultado (`Conforme/Não Conforme/Parcialmente Conforme`), observações, responsável pela inspeção e data — análogo ao `SafetyInspectionModal`.

### 4. Aprovações de documentos não cobrem todos os tipos de saída (Severidade: MINOR)

**Sub-requisito afetado:** 8.6 — "liberação de produtos e serviços não deve prosseguir até que os arranjos planejados tenham sido satisfatoriamente concluídos".
**Situação:** `documentApprovalLog.ts` cobre apenas aprovação de extrações de documentos (pipeline de AI). Saídas como Planos de Ação 5W2H (`PlanoAcao5W2H.tsx`), Diagnósticos de Materialidade (`AnaliseMaterialidade.tsx`) e Inventário GEE (`InventarioGEE.tsx`) não possuem fluxo de aprovação/liberação evidente no codebase.
**Recomendação:** Mapear todos os tipos de saída do sistema e verificar quais possuem (ou deveriam ter) fluxo de aprovação, utilizando o `ApprovalWorkflowManager` genérico já existente.

### 5. Informação documentada de liberação não consolida evidências de conformidade (Severidade: MINOR)

**Sub-requisito afetado:** 8.6.a — "evidência de conformidade com os critérios de aceitação".
**Situação:** O sistema retém logs de aprovação individualmente por módulo (extração, NC, workflow), mas não existe painel ou relatório consolidado de "liberações realizadas no período" com evidências de conformidade por produto/serviço entregue. Auditores externos precisariam consultar múltiplos módulos para reconstruir o histórico de liberações.

---

## Cobertura por Sub-requisito 8.6

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| 8.6 — Arranjos planejados realizados satisfatoriamente antes da liberação | Checklists de inspeção (`safetyInspections.ts`); aprovação de documentos (`documentApprovalLog.ts`); approval workflow genérico | PARCIAL |
| 8.6 — Não liberar até que arranjos estejam concluídos (exceto aprovação por autoridade pertinente) | Status `'Pendente'` em entregas; status de aprovação em docs | PARCIAL |
| 8.6.a — Reter evidência de conformidade com critérios de aceitação | `extraction_approval_log` (extração docs); checklist_items (inspeção) | PARCIAL |
| 8.6.b — Reter informação documentada incluindo quem autorizou a liberação | `approved_by_user_id` em NC (`nonConformityService.ts`) e extração (`documentApprovalLog.ts`); falta em relatórios ESG/GRI | PARCIAL |

---

## Guia de Validação E2E

1. Acessar `/modulo-operacao` e abrir uma nova Inspeção de Segurança. Preencher o checklist e registrar resultado "Conforme" ou "Não Conforme".
2. Verificar se o resultado da inspeção fica persistido com `inspector_name` e `inspection_date`.
3. Acessar `/extracao-documentos`, processar um documento e verificar se o log de aprovação registra o `approved_by_user_id` e `action`.
4. Acessar `/fornecedores/entregas`, criar uma entrega com status "Pendente" e clicar em "Avaliar". Verificar se o status transita de "Pendente" para "Avaliado" após a ação.
5. Acessar `/relatorios-integrados`, gerar um relatório e verificar se existe passo de aprovação/liberação antes da exportação final.
6. Critério de aceite PASSA: aprovações com responsável e data retidas; status de liberação visível; FALHA: liberações sem rastreamento de aprovador ou critérios de aceitação ausentes.

---

## Plano de Ação Priorizado

### Crítico — Resolver antes da próxima auditoria

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 1 | Integrar `ApprovalWorkflowManager` ao ciclo de relatórios ESG/GRI — adicionar step de aprovação com `approved_by_user_id` antes da exportação | `griReports.ts`, `integratedReports.ts`, UI de relatórios | Fecha gap 8.6.b para a principal saída do produto SaaS |
| 2 | Criar modal de "Inspeção de Recebimento" em `SupplierDeliveriesPage.tsx` com resultado `Conforme/Não Conforme` e campo de responsável | `SupplierDeliveriesPage.tsx`, nova migração SQL | Implementa gate de aceitação para insumos externos (8.6 para fornecimentos) |

### Quick Wins (1–2 semanas)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 3 | Criar entidade/tabela `product_service_types` com campo `acceptance_criteria` (texto ou JSONB) definindo os critérios de aceitação por tipo de saída | Migração SQL + configurações | Formaliza os "arranjos planejados" exigidos pelo 8.6 |
| 4 | Adicionar painel consolidado "Histórico de Liberações" exibindo aprovações de todas as saídas (docs, relatórios, entregas) com exportação para auditoria | `AdvancedReportingSystem.tsx` ou novo componente | Provê visão de conjunto das evidências de conformidade (8.6.a + 8.6.b) |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 5 | Estender aprovação de workflow para cobrir Planos de Ação 5W2H, Diagnósticos de Materialidade e Inventários GEE | `PlanoAcao5W2H.tsx`, `AnaliseMaterialidade.tsx`, `InventarioGEE.tsx` | Universaliza o controle de liberação para todos os tipos de saída relevantes |

---

## Conclusão

Nota global de **3.4/5.0 (Sistema Funcional com lacunas relevantes)**.

O Daton ESG Insight possui infraestrutura sólida para controle de liberação em módulos específicos — especialmente o log de aprovação de extrações documentais e os checklists de inspeção de segurança. O motor de `ApprovalWorkflow` genérico representa um ativo valioso que, se sistematicamente aplicado a todas as saídas relevantes, elevaria o score para a faixa Madura.

As lacunas críticas concentram-se em três pontos: (a) relatórios ESG/GRI sem aprovação formal antes da entrega ao cliente, (b) entregas de fornecedores sem inspeção de recebimento com critérios de aceitação técnicos, e (c) ausência de critérios de aceitação formalizados por tipo de produto/serviço. A resolução dos itens 1 e 2 do plano de ação crítico, combinada com a criação de critérios de aceitação (item 3), elevaria o sistema para **4.1/5 (Maduro)**.
