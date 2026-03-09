# Resumo Executivo — Análise ISO 9001:2015 Item 8.4.2

**Norma:** ISO 9001:2015
**Item:** 8.4.2 — Tipo e extensão do controle de provedores externos (Avaliação Durante o Fornecimento)
**Tipo de Análise:** Tipo B — Conformidade do Sistema (codebase)
**Data:** 2026-03-09
**Auditor:** Compliance Auditor Agent

---

## Score de Confiança: 3.8 / 5 — Funcional com Lacunas de Processo

O sistema possui uma arquitetura de controle de fornecedores durante o fornecimento estruturada em múltiplas camadas: avaliação documental periódica (AVA1), avaliação por critérios ponderados por entrega (AVA2), registro de falhas de fornecimento com severidade e contagem automática, inativação automática por acumulação de falhas, portal externo com treinamentos e pesquisas de satisfação, e central de alertas de vencimento. Esta é uma cobertura substancialmente mais abrangente do que a média de sistemas ESG. As lacunas residem na falta de integração explícita de análise de risco de fornecimento como critério de escalonamento do controle (8.4.1 referenciado por 8.4.2), na ausência de pontuação de risco consolidada por fornecedor, e em alguns campos não obrigatórios que fragilizam a rastreabilidade.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|---|---|---|---|
| Avaliação documental periódica (AVA1) | `src/pages/SupplierDocumentEvaluationPage.tsx` | 4.5 | Threshold 90%, snapshot imutável por avaliação, próxima data obrigatória, histórico completo |
| Avaliação por critérios e entregas (AVA2) | `src/pages/SupplierPerformanceEvaluationPage.tsx` | 4.5 | Critérios configuráveis com peso, linkagem delivery→avaliação, histórico, aprovado/reprovado calculado |
| Falhas de fornecimento | `src/services/supplierFailuresService.ts` | 4.0 | Tipos (delivery/quality/document/compliance), severidade (low/medium/high/critical), contagem acumulada, inativação automática |
| Indicadores do portal (EXT1) | `src/services/supplierIndicatorsService.ts` | 3.5 | Taxas de conclusão de treinamentos, leituras, pesquisas — métricas de engajamento do fornecedor |
| Registro de fornecimentos (ALX) | `src/services/supplierDeliveriesService.ts` | 3.0 | reference_number opcional fragiliza rastreabilidade; sem campo de inspeção de recebimento |
| Alertas de vencimento | `src/pages/SupplierAlertsPage.tsx` | 4.0 | Três categorias (crítico/atenção/ok), tipos (documento/treinamento/avaliação), resolução manual |
| Análise de risco de fornecimento | Não encontrado | 1.0 | Sem pontuação consolidada de risco por fornecedor para escalonamento do controle |
| Dashboard de indicadores | `src/services/supplierDashboard.ts` | 3.5 | Ranking de fornecedores, evolução mensal de conformidade e desempenho |

---

## Top 5 Pontos Fortes

1. **Avaliação documental com snapshot imutável e agendamento obrigatório (`SupplierDocumentEvaluationPage.tsx`):** Cada avaliação AVA1 persiste um `criteria_snapshot` com todos os documentos avaliados, seus pesos, status, datas de vencimento e arquivos. A data da próxima avaliação é obrigatória (`nextEvaluationDate` linha 357: `if (!nextEvaluationDate) { throw new Error(...) }`). Isso garante periodicidade e auditabilidade — atende diretamente 8.4.2.a (assegurar conformidade com requisitos especificados).

2. **Avaliação por critérios ponderados vinculada por entrega (`SupplierPerformanceEvaluationPage.tsx`, `supplierCriteriaService.ts`):** Critérios configuráveis com peso (`DEFAULT_CRITERIA` + `supplier_evaluation_criteria`), resultado calculado automaticamente (APROVADO/REPROVADO), linkagem `deliveryId → evaluationId` via `linkEvaluation()`. Permite avaliação individual por entrega — cobre 8.4.2.a para monitoramento de desempenho real.

3. **Falhas com contagem acumulada e inativação automática (`supplierFailuresService.ts`, campo `supply_failure_count`):** O sistema registra falhas com tipo, severidade e referência à avaliação. Fornecedores com 2+ falhas entram em risco (`getSuppliersAtRisk()`); com 3+ falhas são inativados automaticamente. Reativação exige justificativa e respeita `reactivation_blocked_until`. Este é um mecanismo concreto de escalonamento de controle baseado em performance — alinha com 8.4.2 e 8.4.1.

4. **Portal do fornecedor com participação mensurável (`supplierIndicatorsService.ts`, taxas de treinamento/leitura/pesquisa):** A organização consegue monitorar o engajamento do fornecedor com seus processos de capacitação durante o fornecimento. Taxa de conclusão de treinamentos, confirmações de leituras e respostas a pesquisas são indicadores de controle do fornecedor externo (8.4.2.b — assegurar que os processos externos não afetam a capacidade de entregar produtos conformes).

5. **Central de alertas com categorização por criticidade e tipo (`SupplierAlertsPage.tsx`):** Alertas de vencimento de documentos, treinamentos e avaliações são categorizados em crítico/atenção/em dia, com ação de resolução e navegação direta para a avaliação correspondente. Garante continuidade do controle durante todo o ciclo de vida do fornecimento.

---

## Top 5 Lacunas Críticas

1. **Lacuna Crítica — 8.4.2 (extensão do controle proporcional ao risco): Sem pontuação consolidada de risco por fornecedor.**
   A norma exige que "o tipo e a extensão do controle sejam baseados" na capacidade de atender requisitos, no impacto potencial sobre produtos/serviços, e no desempenho histórico. O sistema possui dados de desempenho dispersos (AVA1, AVA2, falhas), mas não há um score de risco unificado por fornecedor que determine automaticamente a frequência das avaliações ou o nível de controle exigido. O campo `supply_failure_count` é o único indicador agregado disponível na tabela `supplier_management`.

2. **Lacuna Maior — 8.4.2.a (verificação ou outras atividades para assegurar adequação): `reference_number` opcional em `supplier_deliveries`.**
   O campo `reference_number: string | null` (`supplierDeliveriesService.ts` linha 11) é opcional na UI (`SupplierDeliveriesPage.tsx`, label "Referência (NF, OS...)"). Sem número de nota fiscal ou ordem de serviço obrigatório, não há rastreabilidade plena da entrega ao documento fiscal, fragilizando a verificação de conformidade. Este ponto já foi identificado em auditorias anteriores (MEMORY.md).

3. **Lacuna Maior — 8.4.2 (controle de processos fornecidos externamente que afetam SGQ): Sem inspeção de recebimento estruturada.**
   O registro de entrega (`supplier_deliveries`) captura data, descrição, referência, quantidade e valor — mas não possui campo de inspeção de recebimento (checklist de conferência, responsável pela inspeção, resultado da inspeção, não conformidades de recebimento). A ligação entre `delivery_id` e avaliação AVA2 é o mecanismo mais próximo, mas é opcional (entrega pode permanecer em status "Pendente" indefinidamente) e não cobre inspeção física da entrega.

4. **Lacuna Maior — 8.4.2.b (garantia de que processos externos não afetam conformidade): Módulo de treinamentos sem verificação de proficiência.**
   O portal rastreia conclusão de treinamentos, mas o campo `score` em `supplier_training_progress` (linha 430 do `supplierPortalService.ts`, apenas preenchido quando `status === 'Concluído'`) é opcional (`score !== undefined`). Não há limiar mínimo de aprovação configurável por treinamento, o que significa que um fornecedor pode "concluir" um treinamento sem demonstrar proficiência mínima.

5. **Lacuna Menor — 8.4.2 (atividades de verificação/validação no fornecedor): Sem suporte a auditorias in loco.**
   A norma contempla a possibilidade de a organização realizar verificações nas instalações do fornecedor externo. Não há no codebase funcionalidade para registrar auditorias presenciais de fornecedores (visitas técnicas, auditorias de segunda parte), seus achados e planos de ação decorrentes. O módulo de auditorias ISO (`isoTemplates.ts`) não possui template para auditoria de fornecedor.

---

## Cobertura por Sub-requisito

| Sub-requisito | Descricao | Status | Evidencia |
|---|---|---|---|
| 8.4.2 (geral) | Controle durante o fornecimento baseado em risco | Parcial | AVA1 + AVA2 + falhas cobrem controle, mas sem escalonamento automático por risco |
| 8.4.2.a | Assegurar conformidade com requisitos especificados | Funcional | AVA1 (documental, 90%) + AVA2 (critérios ponderados por entrega) + alertas de vencimento |
| 8.4.2.a.2 | Verificação ou atividades de inspeção no fornecedor | Ausente | Sem módulo de auditoria in loco de fornecedor |
| 8.4.2.b | Assegurar que processos externos não afetam conformidade | Parcial | Portal com treinamentos (sem limiar de aprovação), leituras obrigatórias confirmadas |
| 8.4.2 (escalonamento por risco) | Controle proporcional ao risco e impacto | Ausente | Sem score de risco consolidado; apenas supply_failure_count como indicador |
| 8.4.2 (rastreabilidade da entrega) | Rastrear entrega ao fornecimento específico | Parcial | reference_number opcional em supplier_deliveries |
| 8.4.2 (histórico para decisões) | Usar histórico de desempenho para controle | Funcional | Histórico de AVA1/AVA2/falhas disponível; inativação automática por falhas |

---

## Plano de Ação Priorizado

### Faixa 1 — Ações Imediatas (0–30 dias)

**PA-842-01:** Tornar `reference_number` obrigatório em `supplier_deliveries` para tipos de fornecimento que envolvem nota fiscal. Adicionar validação no `SupplierDeliveriesPage.tsx`: campo obrigatório quando `supplier_type` for de categoria "produto" (configurável). Mínimo: exibir aviso quando não preenchido.
**Impacto:** 8.4.2.a (rastreabilidade) | **Severidade:** Maior

**PA-842-02:** Adicionar campo `minimum_score` em `supplier_training_materials` para definir nota mínima de aprovação por treinamento. Atualizar `updateTrainingProgress()` para rejeitar conclusão quando `score < minimum_score`. Expor resultado como APROVADO/REPROVADO no portal.
**Impacto:** 8.4.2.b | **Severidade:** Maior

### Faixa 2 — Ações de Curto Prazo (30–90 dias)

**PA-842-03:** Criar tabela `supplier_risk_scores` com cálculo periódico consolidado: `ava1_score` (última conformidade documental), `ava2_score` (média de avaliações de desempenho), `failure_score` (penalidade por falhas e severidade), `portal_score` (taxa de participação), `composite_risk` (ponderado). Exibir no dashboard do fornecedor e usar para sugerir frequência de avaliação.
**Impacto:** Escalonamento de controle por risco | **Severidade:** Crítica

**PA-842-04:** Adicionar checklist de inspeção de recebimento em `supplier_deliveries`: campos `inspection_required` (boolean), `inspection_result` ('Conforme', 'Não Conforme', 'Pendente'), `inspection_notes`, `inspected_by`, `inspected_at`. Disparar aviso quando entrega marcada como "Avaliado" sem inspeção preenchida para tipos críticos.
**Impacto:** 8.4.2.a (inspeção de recebimento) | **Severidade:** Maior

### Faixa 3 — Ações Estruturais (90–180 dias)

**PA-842-05:** Criar módulo de auditoria de segunda parte (fornecedor): tabela `supplier_audits` com `supplier_id`, `audit_date`, `auditor_id`, `type` ('Documental', 'In Loco', 'Remota'), `findings` (JSON array), `action_plan_id` (FK para NCs). Integrar achados ao ciclo de 6 estágios de NCs.
**Impacto:** 8.4.2.a.2 (verificação in loco) | **Severidade:** Maior

**PA-842-06:** Implementar lógica de escalonamento automático de controle baseada em `composite_risk` de PA-842-03: para fornecedores de risco alto, sugerir/obrigar AVA1 trimestral (em vez de semestral); para risco crítico, bloquear novos fornecimentos até aprovação manual da gestão. Exibir badge de risco (Baixo/Médio/Alto/Crítico) no painel do fornecedor.
**Impacto:** 8.4.2 (escalonamento por risco) | **Severidade:** Crítica

---

## Guia de Validação E2E

Para verificar se o item 8.4.2 está sendo atendido para um fornecedor específico, o auditor deve:

1. Navegar em `/fornecedores/avaliacao-documental/:id` e verificar: (a) existência de avaliação AVA1 nos últimos 6 meses, (b) conformidade >= 90%, (c) data da próxima avaliação preenchida, (d) snapshot de critérios preservado no histórico.
2. Navegar em `/fornecedores/fornecimentos` e verificar: (a) entregas recentes com `reference_number` preenchido, (b) status das entregas (Pendente/Avaliado/Problema), (c) ratio de entregas avaliadas vs. total.
3. Verificar em `/fornecedores/falhas` se há falhas registradas e se o `supply_failure_count` reflete o histórico corretamente.
4. Acessar `/fornecedores/alertas` e verificar se não há alertas críticos em aberto para o fornecedor.
5. No portal do fornecedor, verificar taxa de conclusão de treinamentos obrigatórios.

---

## Conclusão

**Score: 3.8/5 — Funcional com Lacunas de Processo**

O módulo de gestão de fornecedores do Daton ESG Insight apresenta uma das implementações mais completas do codebase para monitoramento durante o fornecimento: AVA1 com snapshot imutável e 90% de threshold, AVA2 com critérios configuráveis e linkagem por entrega, falhas com inativação automática, portal externo com participação mensurável, e central de alertas. Estes mecanismos cobrem substancialmente o requisito de "assegurar adequação e eficácia dos controles aplicados" (8.4.2.a). As lacunas críticas são a ausência de score de risco consolidado (que impede escalonamento proporcional do controle, exigência explícita da norma), a ausência de inspeção de recebimento estruturada, e a falta de um módulo de auditoria in loco. As ações PA-842-03 e PA-842-06 são as de maior impacto normativo.

**Itens MUST atendidos:** Controle de documentação (AVA1), avaliação de desempenho (AVA2), histórico de falhas, participação no portal.
**Itens MUST parcialmente atendidos:** Rastreabilidade de entregas (reference_number opcional), proficiência em treinamentos (sem limiar de aprovação).
**Itens MUST não atendidos:** Escalonamento de controle por risco consolidado, inspeção de recebimento, auditoria de segunda parte.
