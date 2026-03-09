# Resumo Executivo — Análise ISO 9001:2015 Itens 8.1 + 8.5 (Controle de Estoques de Entrada)

**Norma:** ISO 9001:2015 — Itens 8.1 (Planejamento e Controle Operacional) e 8.5 (Produção e Provisão de Serviço)
**Foco do Item:** Controle dos estoques de entrada — matérias-primas, materiais recebidos, peças e ferramentas
**Tipo de Análise:** Tipo B — Conformidade do sistema/codebase (sem documento de validação externo)
**Data:** 2026-03-09
**Auditor:** Compliance Auditor Agent

---

## Score de Confiança Global

**1.2 / 5 — Ausência Crítica**

O codebase do Daton ESG Insight não implementa qualquer módulo dedicado a controle de estoques de entrada de materiais, matérias-primas, peças ou ferramentas. A tabela `supplier_deliveries` registra entregas de fornecedores em nível de cabeçalho, mas não controla saldo, localização física, lote, prazo de validade, nem movimentação de estoque. Não há evidências de tabelas de banco de dados, serviços, hooks ou páginas voltadas para este domínio no universo das 375 tabelas públicas e 169 páginas mapeadas.

---

## Notas por Módulo

| Módulo / Artefato | Relevância para Estoque de Entrada | Score | Observação |
|---|---|---|---|
| `supplier_deliveries` (tabela DB) | Registro de entrega de fornecedor | 1.5/5 | Sem itens de entrega, sem saldo, sem localização; `reference_number` opcional |
| `SupplierDeliveriesPage.tsx` | UI de registro de entregas | 1.5/5 | Captura data, fornecedor e descrição livre — sem itens, quantidades por material ou unidade de estoque |
| `supplier_products_services` (tabela DB) | Catálogo de produtos/serviços por fornecedor | 1.0/5 | Cadastro de itens sem `stock_level`, `min_qty`, `location`, `batch_number` |
| `assets` (tabela DB) + `Ativos.tsx` | Gestão de ativos ambientais | 0.5/5 | Foco em fontes fixas, equipamentos e infraestrutura — não é estoque de material |
| `InventarioGEE.tsx` / `ghgInventory.ts` | Inventário de GEE (GHG) | 0/5 | Inventário de gases de efeito estufa — completamente fora do escopo de estoque físico |
| `NaoConformidades` / NC Wizard | Tratamento de NCs | 1.0/5 | NCs de não-conformidade de produto existem, mas não integradas a recebimento de material |
| `calibrationManagement.ts` | Calibração de equipamentos | 1.0/5 | Controla instrumentos, não ferramentas de produção em estoque |
| CI/CD (`.github/workflows/`) | Pipeline de desenvolvimento | N/A | Irrelevante para este item normativo |

---

## Top 5 Pontos Fortes Identificados

1. **`supplier_deliveries` com vínculo a fornecedor e tipo de fornecimento** (`supplier_id`, `supplier_type_id`, `evaluation_id`) — registra o evento de recebimento, servindo como base para expansão futura de controle de estoque.

2. **`supplier_products_services`** com campos `item_type`, `unit_of_measure`, `category` e `is_active` — oferece catálogo de itens por fornecedor que pode ser reaproveitado como lista-mestre de materiais controlados.

3. **RLS habilitado em 100% das tabelas** — qualquer tabela de estoque que seja criada herdará automaticamente o isolamento multi-tenant por `company_id`, atendendo ao requisito de controle por processo.

4. **Módulo de NCs com ciclo de 6 estágios** (`NCStageWizard.tsx`, `nonConformityService.ts`) — infraestrutura de tratamento de desvios já existente para registrar não-conformidades de material recebido caso o controle de estoque seja implementado.

5. **`assets` com `monitoring_frequency` e `operational_status`** — padrão de rastreabilidade de estado que pode ser adaptado para ferramentas e peças de reposição críticas.

---

## Top 5 Lacunas Críticas

1. **[CRÍTICO] Ausência total de módulo de controle de estoque de entrada** — Não existe nenhuma tabela (`inventory_items`, `stock_entries`, `material_receipts`, `warehouse_locations` ou equivalente), nenhuma página, nenhum serviço e nenhum hook para controle de saldo de materiais recebidos. A ISO 9001:2015 item 8.1 exige que a organização planeje e controle os processos operacionais, incluindo os recursos necessários, com determinação de critérios de controle. O item 8.5.4 exige preservação das saídas durante processamento e entrega, o que pressupõe controle de entrada.

2. **[CRÍTICO] `supplier_deliveries` sem itens de entrega** — A tabela registra apenas cabeçalho (`delivery_date`, `description`, `quantity` genérica). Não há tabela `delivery_items` ou equivalente que rastreie qual material específico foi recebido, em que quantidade, com qual número de lote, data de fabricação ou validade. Isso impede rastreabilidade por item conforme 8.5.2 (identificação e rastreabilidade).

3. **[CRÍTICO] Ausência de controle de localização física (almoxarifado)** — Não há tabelas nem campos de `warehouse_location`, `bin_location`, `storage_zone` ou equivalente. A norma (8.5.1.e) exige atividades de entrega e pós-entrega com preservação; o controle de onde o material está armazenado é pressuposto básico.

4. **[MAJOR] Sem controle de lote, validade e FIFO/FEFO** — Ausência de campos `batch_number`, `lot_number`, `expiry_date`, `manufactured_date` em qualquer tabela relacionada a materiais. Para organizações que produzem bens físicos ou utilizam insumos com prazo, isto é requisito de rastreabilidade (8.5.2) e preservação (8.5.4).

5. **[MAJOR] Sem alerta de estoque mínimo nem reposição** — Não existe lógica de `min_stock_level`, `reorder_point` ou monitoramento de saldo. O item 8.1 exige determinação dos recursos necessários e garantia de sua disponibilidade; o sistema não fornece visibilidade sobre criticidade de disponibilidade de materiais.

---

## Cobertura por Sub-requisito

| Sub-requisito | Descrição | Status | Evidência / Gap |
|---|---|---|---|
| 8.1.a | Determinar requisitos dos processos e produtos/serviços | Parcial | Processos ESG documentados; processos de estoque ausentes |
| 8.1.b | Estabelecer critérios para os processos e aceitação de produtos | Ausente | Sem critérios de aceitação de material recebido no sistema |
| 8.1.c | Determinar recursos necessários para conformidade | Ausente | Sem planejamento de disponibilidade de materiais |
| 8.1.d | Implementar controle dos processos conforme critérios | Ausente | Nenhum controle de processo de recebimento/estoque implementado |
| 8.1.e | Determinar, manter e reter informação documentada | Parcial | `supplier_deliveries` retém registro de entrega, sem itens |
| 8.5.1.b | Disponibilidade de recursos de monitoramento e medição | Ausente | Sem rastreamento de disponibilidade de ferramentas/instrumentos em estoque |
| 8.5.2 | Identificação e rastreabilidade por saídas | Ausente | Sem identificação de lote/número de série para materiais de entrada |
| 8.5.4 | Preservação das saídas | Ausente | Sem controle de condições de armazenamento, FIFO/FEFO, validade |

---

## Plano de Ação Priorizado

### Faixa 1 — Crítico (0–30 dias)

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| A1 | Criar tabela `inventory_items` com campos: `company_id`, `supplier_product_id` (FK → `supplier_products_services`), `item_code`, `name`, `unit_of_measure`, `category`, `min_stock_qty`, `max_stock_qty`, `current_qty`, `location`, `is_active` | Alto | Habilita rastreabilidade básica |
| A2 | Criar tabela `stock_entries` (entradas de estoque) com campos: `company_id`, `inventory_item_id`, `delivery_id` (FK → `supplier_deliveries`), `quantity`, `unit_cost`, `batch_number`, `expiry_date`, `received_by`, `received_at`, `inspection_status` | Alto | Vincula recebimento a saldo |
| A3 | Criar tabela `stock_movements` (movimentações) para saídas e transferências internas: `movement_type` ('entrada', 'saída', 'ajuste', 'transferência'), `quantity_delta`, `reference_document`, `performed_by`, `performed_at` | Alto | Auditabilidade completa do saldo |

### Faixa 2 — Importante (31–90 dias)

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| B1 | Criar `StockManagementPage.tsx` com CRUD de itens, visualização de saldo atual, alertas de estoque mínimo e movimentações recentes | Alto | Visibilidade operacional |
| B2 | Expandir `SupplierDeliveriesPage.tsx` para incluir itens de entrega (`delivery_items`) com vínculo a `inventory_items` | Médio | Rastreabilidade de recebimento |
| B3 | Integrar criação de NC automática quando inspeção de entrada reprova item (`inspection_status = 'reprovado'` → `nonConformityService.createNC()`) | Médio | Fecha ciclo 8.4.2 + 8.7 + estoque |
| B4 | Adicionar `storage_location` e `min_stock_qty` a `supplier_products_services` como campos opcionais de transição | Baixo | Quick win sem migração maior |

### Faixa 3 — Melhoria Contínua (91–180 dias)

| # | Ação | Esforço | Impacto |
|---|---|---|---|
| C1 | Implementar alertas automáticos de estoque abaixo do mínimo via `alertMonitoring.ts` e `notificationTriggers.ts` | Médio | Proatividade operacional |
| C2 | Implementar lógica FIFO/FEFO para materiais com prazo de validade (`expiry_date`) e relatório de itens próximos ao vencimento | Alto | Conformidade 8.5.4 (preservação) |
| C3 | Painel de Dashboard de Estoque integrando: saldo atual × mínimo, giro de materiais, histórico de recebimentos e custo médio | Alto | Indicador de desempenho (9.1.1) |

---

## Guia de Validação E2E (Pós-Implementação)

Após implementação das ações da Faixa 1 e Faixa 2, os seguintes cenários devem ser testados:

1. Registrar entrega de fornecedor com 3 itens distintos → verificar que `stock_entries` registra cada item com `batch_number` e `received_at`
2. Reprovar item na inspeção de entrada → verificar geração automática de NC via `nonConformityService`
3. Realizar baixa de item do estoque → verificar que `stock_movements` registra `movement_type = 'saída'` com `performed_by` e `reference_document`
4. Atingir `min_stock_qty` para um item → verificar disparo de alerta via `alertMonitoring`
5. Tentar criar movimentação sem `inventory_item_id` → verificar rejeição pela constraint de FK e validação Zod

---

## Conclusão

O Daton ESG Insight **não atende** os requisitos da ISO 9001:2015 itens 8.1 e 8.5 no que concerne ao controle de estoques de entrada. O sistema é especializado em ESG, qualidade, conformidade e gestão de fornecedores, mas não implementa qualquer módulo de gestão de estoques físicos (materiais, peças, ferramentas). A infraestrutura técnica existente — RLS multi-tenant, módulo de NCs, catálogo de produtos por fornecedor, registro de entregas — oferece uma base sólida para construção do módulo, mas o desenvolvimento de tabelas, serviços e interfaces ainda não foi iniciado.

**Nível de conformidade atual: Não Conforme (Lacuna de Sistema)**
**Risco normativo:** Crítico — ausência de evidências de controle operacional para auditoria de terceira parte
