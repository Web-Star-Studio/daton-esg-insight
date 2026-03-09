# Resumo Executivo — Análise ISO 9001:2015 Itens 8.1 + 8.5 (Inventário de Estoque)

**Norma:** ISO 9001:2015 — Itens 8.1 (Planejamento e Controle Operacional) e 8.5 (Produção e Provisão de Serviço)
**Foco do Item:** Critérios definidos para inventário de estoque — contagem física, reconciliação e periodicidade
**Tipo de Análise:** Tipo B — Conformidade do sistema/codebase (sem documento de validação externo)
**Data:** 2026-03-09
**Auditor:** Compliance Auditor Agent

---

## Score de Confiança Global

**1.0 / 5 — Ausência Crítica**

O Daton ESG Insight não implementa qualquer mecanismo de inventário de estoque físico. Não há tabelas de banco de dados, serviços, páginas ou hooks que suportem as operações de inventário periódico (contagem cíclica, inventário geral, reconciliação de divergências, ajuste de saldo). O único uso da palavra "inventário" no codebase refere-se exclusivamente ao inventário de gases de efeito estufa (GEE/GHG), que é um domínio completamente distinto. Dado que o Item 47 pressupõe a existência do controle de estoques auditado no Item 46, e esse também está ausente (score 1.2/5 — ver relatório `req-normativo-ISO-9001-2015-item-8-1-8-5-estoque-entrada.md`), este item parte de uma lacuna ainda mais ampla.

---

## Notas por Módulo

| Módulo / Artefato | Relevância para Inventário de Estoque | Score | Observação |
|---|---|---|---|
| `InventarioGEE.tsx` / `ghgInventory.ts` | Inventário de GHG | 0/5 | Contexto totalmente diferente — GHG Protocol, emissões de CO2 |
| `supplier_deliveries` (tabela DB) | Registro de entrega | 0.5/5 | Sem saldo acumulado, sem contragem cíclica, sem reconciliação |
| `supplier_products_services` (tabela DB) | Catálogo de itens | 0.5/5 | Lista de produtos sem campo de saldo ou última contagem |
| `assets` (tabela DB) + `Ativos.tsx` | Ativos industriais | 0.5/5 | Gestão de ativos fixos, não de estoque consumível |
| `calibrationManagement.ts` | Calibração de instrumentos | 0.5/5 | Periodicidade de calibração é um padrão que poderia ser adaptado para inventário cíclico |
| Módulo de indicadores (`indicatorManagement.ts`) | Indicadores de desempenho | 0.5/5 | Periodicidade e alerta de coleta configuraveis — padrão reutilizável |
| `alertMonitoring.ts` + `notificationTriggers.ts` | Alertas e notificações | 1.0/5 | Infraestrutura para alertas de vencimento de contagem disponível |
| GED / `documentCenter.ts` | Central de documentos | 1.0/5 | Poderia armazenar relatórios de inventário, mas não é substituto do módulo |

---

## Top 5 Pontos Fortes Identificados

1. **`calibrationManagement.ts` como modelo de periodicidade** — O módulo de calibração implementa ciclos periódicos obrigatórios com `next_calibration_date`, alertas de vencimento e registro de evidências. Este padrão é diretamente reutilizável para definir periodicidade de inventário cíclico.

2. **GED com versionamento imutável** (`documentCenter.ts`, `content_hash` obrigatório em documentos) — Relatórios de contagem física poderiam ser armazenados como documentos controlados, assegurando imutabilidade e rastreabilidade pós-contagem.

3. **`indicatorManagement.ts` com `collection_frequency` e alertas de coleta** — A infraestrutura de monitoramento de indicadores inclui frequência de coleta configurável, o que poderia agendar alertas de inventário periódico.

4. **Módulo de NCs com 6 estágios** — Divergências de inventário (estoque físico ≠ saldo sistema) poderiam gerar NCs formais no ciclo já existente, com rastreabilidade de causa raiz e ação corretiva.

5. **RLS em 100% das tabelas** — Tabelas de inventário futuras serão automaticamente isoladas por `company_id`, garantindo separação multi-tenant sem trabalho adicional.

---

## Top 5 Lacunas Críticas

1. **[CRÍTICO] Ausência total de módulo de inventário de estoque** — Não existe nenhuma tabela `inventory_counts`, `cycle_count_schedules`, `count_sessions`, `inventory_adjustments` ou equivalente. A ISO 9001:2015 item 8.1 exige controle dos processos, o que inclui a verificação periódica da acurácia do estoque. Sem inventário, não há como verificar se os recursos necessários estão disponíveis.

2. **[CRÍTICO] Ausência de critérios de periodicidade para inventário** — Mesmo que o módulo base de estoque fosse implementado, não existem campos de configuração para frequência de contagem (mensal, trimestral, anual), responsável pela contagem, tipo de inventário (geral ou cíclico) ou tolerância de divergência aceitável. A norma exige critérios definidos.

3. **[CRÍTICO] Sem reconciliação de divergências** — Não há tabela de `inventory_adjustments` com campos `physical_count`, `system_count`, `delta_qty`, `adjustment_reason` e `approved_by`. Qualquer divergência entre contagem física e saldo do sistema ficaria sem registro, tratamento ou aprovação formal.

4. **[MAJOR] Dependência em módulo predecessor ausente** — O inventário de estoque pressupõe a existência de `inventory_items` e `stock_movements`, que também estão ausentes (ver Item 46 / `req-normativo-ISO-9001-2015-item-8-1-8-5-estoque-entrada.md`). Não é possível fazer inventário de algo que o sistema não registra.

5. **[MAJOR] Sem evidência documentada de processo de inventário** — Nenhum arquivo em `docs/` descreve processo de contagem física, método de amostragem ou critérios de aceite de divergência. A ISO 9001:2015 item 7.5 exige informação documentada para suporte aos processos operacionais.

---

## Cobertura por Sub-requisito

| Sub-requisito | Descrição | Status | Evidência / Gap |
|---|---|---|---|
| 8.1.b | Estabelecer critérios para os processos | Ausente | Sem critérios de frequência, método ou tolerância de inventário |
| 8.1.c | Determinar e manter recursos para conformidade | Ausente | Sem mecanismo de verificação de disponibilidade por contagem |
| 8.1.d | Implementar controle conforme critérios | Ausente | Nenhum processo de inventário implementado no sistema |
| 8.1.e | Reter informação documentada sobre conformidade | Ausente | Sem relatórios de contagem, sem registros de ajuste |
| 8.5.4 | Preservação — incluindo identificação, proteção, controle de quantidade | Ausente | Quantidade só pode ser verificada com inventário; inexistente |
| 7.5.3 | Controle de informação documentada (registros de inventário) | Ausente | Nenhum documento de inventário no GED ou em `docs/` |
| 9.1.1 | Monitoramento, medição, análise e avaliação | Parcial | KPIs existem para ESG; nenhum KPI de acurácia de estoque |

---

## Plano de Ação Priorizado

### Faixa 1 — Crítico (0–30 dias) — Pré-requisito

| # | Ação | Dependência | Observação |
|---|---|---|---|
| A1 | Implementar módulo de estoque base (Item 46) | Independente | Ver ações A1–A3 em `req-normativo-ISO-9001-2015-item-8-1-8-5-estoque-entrada.md` |
| A2 | Criar tabela `inventory_count_sessions` com campos: `company_id`, `session_type` ('geral', 'cíclico', 'surpresa'), `scheduled_date`, `started_at`, `completed_at`, `status`, `responsible_user_id`, `notes` | Após A1 | Define o evento de contagem |
| A3 | Criar tabela `inventory_count_items` com campos: `session_id`, `inventory_item_id`, `location`, `system_qty`, `physical_qty`, `delta_qty`, `counted_by`, `counted_at`, `status` ('pendente', 'contado', 'aprovado', 'ajustado') | Após A2 | Detalhe de cada item na contagem |

### Faixa 2 — Importante (31–90 dias)

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| B1 | Criar tabela `inventory_adjustments` com aprovação dupla (`requested_by`, `approved_by`, `approved_at`, `adjustment_reason`, `adjustment_qty`) | Médio | Controle de ajuste com segregação de funções |
| B2 | Criar `inventory_count_schedules` para programação de inventários cíclicos recorrentes (frequência: mensal, trimestral, semestral, anual) com alertas automáticos via `notificationTriggers.ts` | Médio | Periodicidade definida e rastreável |
| B3 | Criar `InventoryManagementPage.tsx` com painéis de: (a) sessões de contagem em aberto; (b) divergências pendentes de aprovação; (c) histórico de ajustes; (d) acurácia de estoque (%) | Alto | Visibilidade operacional |
| B4 | Integrar divergências de inventário acima de tolerância configurável com geração automática de NC via `nonConformityService` | Médio | Fecha ciclo de melhoria contínua (10.2) |

### Faixa 3 — Melhoria Contínua (91–180 dias)

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| C1 | Adicionar KPI de acurácia de inventário ao `QualityDashboard.tsx` (métrica: % itens com delta ≤ tolerância configurada / total de itens contados) | Médio | Indicador de processo mensurável (9.1.1) |
| C2 | Implementar sugestão automática de itens para inventário cíclico (ABC/XYZ) baseado em movimentação histórica | Alto | Otimização do esforço de contagem |
| C3 | Gerar relatório PDF de inventário com assinatura digital do responsável, exportável ao GED como documento controlado | Médio | Evidência de auditoria (7.5.3 + 8.1.e) |

---

## Relação com Outros Itens Auditados

| Item | Relatório | Interação |
|---|---|---|
| 8.5.2 (Identificação e rastreabilidade) | `req-normativo-ISO-9001-2015-item-8-5-2.md` | Inventário pressupõe rastreabilidade por lote/número de série |
| 8.5.3 (Propriedade pertencente a clientes/fornecedores) | `req-normativo-ISO-9001-2015-item-8-5-3.md` | Itens de propriedade de terceiros em custódia devem ser inventariados separadamente |
| 8.5.4 (Preservação) | `req-normativo-ISO-9001-2015-item-8-5-4.md` | Preservação implica controle de quantidade e condição — verificável apenas por inventário |
| 8.4.2 (Recebimento de fornecedores) | `req-normativo-ISO-9001-2015-item-8-4-2-recebimento.md` (score 2.3/5) | Entradas de estoque originadas de recebimento de fornecedor |
| Item 46 (Estoque de entrada) | `req-normativo-ISO-9001-2015-item-8-1-8-5-estoque-entrada.md` (score 1.2/5) | Pré-requisito direto: sem módulo de estoque, inventário é inviável |

---

## Guia de Validação E2E (Pós-Implementação)

Após implementação das ações Faixa 1 e Faixa 2:

1. Criar sessão de inventário cíclico para categoria "Insumos Químicos" → verificar que apenas itens desta categoria aparecem para contagem
2. Inserir contagem física diferente do saldo do sistema em 3 itens → verificar cálculo automático de `delta_qty`
3. Delta acima da tolerância configurada (ex: >5%) → verificar geração automática de NC via `nonConformityService`
4. Aprovar ajuste de inventário com usuário sem permissão `manager` → verificar bloqueio por RLS/RoleGuard
5. Concluir sessão de inventário → verificar que relatório é gerado e disponibilizado no GED como documento com `content_hash`
6. Verificar que `current_qty` em `inventory_items` é atualizado automaticamente após aprovação do ajuste

---

## Conclusão

O Daton ESG Insight **não atende** os requisitos da ISO 9001:2015 itens 8.1 e 8.5 no que tange a critérios definidos para inventário de estoque. A ausência é dupla: nem o módulo de estoque base (Item 46) nem o processo de inventário periódico (Item 47) estão implementados. O único módulo chamado "inventário" no sistema (`InventarioGEE.tsx`) refere-se ao inventário de gases de efeito estufa, domínio completamente distinto. A implementação deve seguir a sequência lógica: (1) módulo de estoque base → (2) sessões de contagem → (3) reconciliação e ajuste → (4) indicadores de acurácia.

**Nível de conformidade atual: Não Conforme (Lacuna de Sistema — Módulo Inexistente)**
**Risco normativo:** Crítico — impossibilidade de demonstrar controle de recursos materiais em auditoria de terceira parte
**Pré-requisito bloqueante:** Implementação do Item 46 (controle de estoque de entrada) antes de qualquer avanço neste item
