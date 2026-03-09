# Resumo Executivo — Análise ISO 9001:2015 Itens 8.1 e 8.5 (Gestão de Veículos de Carga)

**Data da análise:** 2026-03-09
**Tipo:** B — Análise de conformidade do sistema/codebase (sem documento de validação externo)
**Escopo:** Gestão de veículos de carga — critérios para conformidade da entrega e preservação do produto durante o transporte
**Norma de referência:** ISO 9001:2015, itens 8.1 (Planejamento e Controle Operacionais) e 8.5 (Produção e Provisão de Serviço), com ênfase em 8.5.4 (Preservação) e 8.5.5 (Atividades Pós-Entrega)

---

## Score de Confiança Global

**1.4 / 5 — Insuficiente**

O codebase do Daton ESG Insight não possui módulo dedicado à gestão de veículos de carga. Os elementos relacionados ao transporte existentes na plataforma cobrem exclusivamente a dimensão de inventário de emissões GEE (Escopo 1 / Escopo 3 GHG Protocol) e registros de saída de resíduos via MTR — nenhum dos quais constitui controle operacional de conformidade de entrega no sentido da ISO 9001:2015 cláusulas 8.1 e 8.5.

---

## Notas por Módulo

| Módulo / Arquivo | Relevância | Score | Observação |
|---|---|---|---|
| `src/components/TransportDistributionModal.tsx` | Registro de modal/distância de transporte GHG | 0/5 | Finalidade ambiental (GEE Scope 3 Cat. 4 e 9), sem critério de conformidade de entrega |
| `src/services/scope3Categories.ts` — `transport_distribution` | Tabela de transporte (GHG) | 0/5 | Campos: `direction`, `transport_mode`, `distance_km`, `weight_tonnes`, `fuel_type`, `fuel_consumption`; sem campos de conformidade de carga |
| `src/constants/safetyInspectionTypes.ts` — tipo `veiculo` | Checklist de inspeção de veículo (segurança) | 2/5 | 7 itens de segurança (pneus, freios, luzes, documentação, kit emergência, extintor, cinto); foco em SST, não em preservação de produto |
| `src/services/waste.ts` — `WasteLogListItem` | Log de resíduos com `driver_name`, `vehicle_plate` | 2/5 | Placa e motorista registrados, mas contexto é transporte de resíduos (MTR), não de produto ao cliente |
| `src/services/mtrDocuments.ts` — `ExtractedMTRData` | MTR com `transporter_name`, `transporter_cnpj`, `transport_date` | 2/5 | Rastreabilidade do transportador de resíduos; sem extensão para produto comercial |
| `src/services/wasteSuppliers.ts` — `WasteSupplier` | Fornecedores de transporte de resíduos com `license_number`, `license_expiry` | 2/5 | Controle de licença de transportador (IBAMA/órgão ambiental), não RNTRC/ANTT |
| `src/services/supplierDeliveriesService.ts` — `supplier_deliveries` | Entregas de fornecedores | 1/5 | Sem campos de modal de transporte, veículo, condições de carga, conformidade de entrega |
| `src/services/mobileCombustion.ts` — `MobileFuel` | Combustíveis por categoria de veículo (Escopo 1) | 0/5 | Finalidade ambiental; `vehicle_category: 'Caminhão'` apenas para cálculo de emissão |
| `src/components/legislation/ComplianceQuestionnaireWizard.tsx` | Campo `has_fleet` (frota própria) | 1/5 | Apenas flag booleano de existência de frota; sem campos de gestão |
| `src/data/demo/dataReportsMocks.ts` — `Frota de Caminhões (5 veículos)` | Ativo demo tipo `Veículo` | 1/5 | Ativo cadastrado no módulo de gestão de ativos ambientais; sem campos de conformidade de carga |

---

## Top 5 Pontos Fortes

1. **Checklist de inspeção de veículo em `safetyInspectionTypes.ts`** — O sistema possui template estruturado (`CHECKLIST_TEMPLATES.veiculo`) com 7 itens de verificação (pneus, freios, luzes/sinalização, documentação, kit de emergência, extintor, cintos), vinculado ao tipo de inspeção `veiculo` no módulo de SST. Constitui fundação técnica que pode ser estendida para critérios de preservação de carga.

2. **Rastreabilidade de transportador no módulo de resíduos** — `WasteLogListItem` registra `driver_name`, `vehicle_plate`, `transporter_name` e `transporter_cnpj`; `WasteSupplier` registra `license_number`, `license_type`, `license_expiry` e `license_issuing_body`. O padrão de controle de transportador existe e é funcional, embora restrito ao contexto ambiental/MTR.

3. **Registro de modais de transporte** — `TransportDistributionModal.tsx` oferece seleção estruturada de modal (Rodoviário, Ferroviário, Hidroviário, Aéreo) e tipo de combustível (inclusive Diesel S10/S500 com `vehicle_category: 'Caminhão'` em `mobileCombustion.ts`), demonstrando que a taxonomia de transporte está modelada na plataforma.

4. **Módulo de ativos com tipo `Veículo`** — `dataReportsMocks.ts` referencia `asset_type: 'Veículo'` para frota de caminhões, confirmando que o módulo de gestão de ativos (`src/services/assets.ts`) suporta cadastro de veículos com campos como `operational_status`, `monitoring_frequency` e `monitoring_responsible`. Pode ser utilizado para frota própria.

5. **Controle de fornecedores de resíduos com alerta de licença** — `wasteSuppliers.ts` monitora `license_expiry` de transportadores e emite alertas de vencimento; `WasteSuppliersStats.expired_licenses` agrega o indicador. Lógica de controle de habilitação legal de transportador está implementada e pode ser replicada para veículos de carga de produto.

---

## Top 5 Lacunas Criticas

1. **Ausência total de módulo de gestão de veículos de carga (8.1)** — Não existe página, serviço ou tabela de banco de dados dedicada ao cadastro, controle e planejamento operacional de veículos utilizados para entrega de produto ao cliente. Não há `freight_vehicles`, `cargo_vehicles` ou equivalente no schema. O requisito 8.1 exige que a organização planeje, implemente, controle, mantenha e retenha informação documentada sobre os processos de provisão de serviço — o transporte de produto não está coberto.

2. **Sem critérios de conformidade de entrega rastreáveis (8.5.1)** — A tabela `supplier_deliveries` registra `delivery_date`, `description`, `status` e `quantity`, mas não possui campos para: modal de transporte utilizado, identificação do veículo/transportador, condições de carga, temperatura de transporte, lacre, ou verificação de conformidade pós-recebimento relacionada ao trajeto. Não é possível determinar se o produto chegou nas condições especificadas.

3. **Sem controle de preservação durante transporte (8.5.4)** — A norma exige que a organização preserve as saídas durante a produção e provisão de serviço, incluindo embalagem, contaminação, manuseio e proteção. Não há módulo de controle de: temperatura de transporte (ex.: câmara fria), acondicionamento/embalagem de carga, umidade, prazo de validade de produto em trânsito. O único registro de temperatura existente é mock de NC de câmara fria em `qualityMocks.ts` — não é controle operacional.

4. **Sem rastreabilidade de veículo em entregas de produto comercial (8.5.2)** — O requisito de rastreabilidade (8.5.2) exige identificação única dos outputs ao longo da provisão de serviço. Entregas em `supplier_deliveries` não têm `vehicle_id`, `vehicle_plate`, `driver_id`, `route_id` nem número de conhecimento de frete (CT-e). A rastreabilidade de lote/produto até o veículo transportador é inexistente.

5. **Sem informação documentada sobre requisitos de transporte de carga para fornecedores (8.4.3 / 8.5)** — Não há campo em `supplier_contracts`, `supplier_types` ou `supplier_criteria_evaluations` que capture requisitos específicos de transporte de carga (RNTRC, ANTT, tipo de carroceria, capacidade de carga, seguro de carga). O campo `sla_requirements: any` em `supplier_contracts` é genérico e não exposto no formulário de criação (`SupplierContractModal.tsx`).

---

## Cobertura por Sub-Requisito

| Sub-requisito | Descrição | Status | Evidência / Gap |
|---|---|---|---|
| 8.1 | Planejamento e controle operacional do transporte | Ausente | Sem módulo de planejamento de rotas, critérios de seleção de veículo, definição de capacidade de carga |
| 8.1 | Informação documentada para confirmar execução conforme planejado | Ausente | `supplier_deliveries` não registra dados de execução do transporte |
| 8.5.1.b | Disponibilidade de infraestrutura adequada para transporte | Nao verificavel | Gestão de ativos existe, mas sem vinculação operacional com entrega |
| 8.5.1.c | Atividades de monitoramento e medição durante transporte | Ausente | Sem sensores de temperatura, GPS, ou registro de conformidade em trânsito |
| 8.5.2 | Rastreabilidade de outputs — identificação do veículo/lote em trânsito | Ausente | Sem `vehicle_plate` ou `vehicle_id` em `supplier_deliveries` |
| 8.5.4.a | Identificação do produto durante transporte | Ausente | Sem campo de identificação/etiqueta de carga em registros de entrega |
| 8.5.4.b | Manuseio adequado para evitar dano ou deterioração | Ausente | Sem checklist de acondicionamento ou tipo de carroceria registrado |
| 8.5.4.c | Contaminação — controle de limpeza e segregação de cargas | Ausente | Sem campo de controle de limpeza de veículo ou compatibilidade de carga |
| 8.5.4.d | Embalagem e proteção durante transporte | Ausente | Sem especificação de embalagem por tipo de produto/rota |
| 8.5.4.e | Proteção durante transporte ou armazenamento provisório | Ausente | Sem registro de condições de armazenamento intermediário |
| 8.5.5 | Atividades pós-entrega — feedback de conformidade de chegada | Parcial | `supplier_deliveries.status: 'Problema'` captura problema genérico; sem causa ligada ao transporte |
| 8.5.5 | Requisitos estatutários e regulamentares pós-entrega | Nao verificavel | RNTRC, ANTT, seguro obrigatório não são campos do sistema |

---

## Plano de Acao Priorizado

### Faixa 1 — Critico (0-30 dias): Estrutura Minima de Rastreabilidade

**Acao 1.1 — Adicionar campos de transporte em `supplier_deliveries`**
- Acrescentar: `vehicle_plate`, `driver_name`, `transport_mode` (enum: rodoviario/ferroviario/hidroviario/aereo), `carrier_name`, `carrier_cnpj`, `carrier_rntrc`
- Impacto: atende 8.5.2 (rastreabilidade) e 8.1 (informacao documentada)
- Arquivo alvo: migration Supabase + `src/services/supplierDeliveriesService.ts` + `src/pages/SupplierDeliveriesPage.tsx` (se existir)

**Acao 1.2 — Estender checklist `veiculo` para carga**
- Adicionar ao `CHECKLIST_TEMPLATES.veiculo` em `src/constants/safetyInspectionTypes.ts` itens de: tipo de carroceria, limpeza da carroceria, temperatura da carroçaria (se refrigerada), lacre de carga, documentos de carga (NF, CT-e)
- Impacto: atende 8.5.4.b e 8.5.4.c
- Arquivo alvo: `src/constants/safetyInspectionTypes.ts` linhas 78-86

### Faixa 2 — Importante (30-90 dias): Controle de Preservacao

**Acao 2.1 — Modulo de requisitos de preservacao por produto/rota**
- Criar tabela `cargo_preservation_rules` com campos: `product_category`, `min_temp`, `max_temp`, `humidity_range`, `packaging_type`, `segregation_required`, `max_transit_hours`
- Vincular a `supplier_deliveries` e `supplier_types`
- Impacto: atende 8.5.4.a/b/c/d/e e 8.1

**Acao 2.2 — Estender controle de licenca de transportador (replicar logica de `wasteSuppliers.ts`)**
- Criar `freight_carriers` com campos: `company_name`, `cnpj`, `rntrc_number`, `rntrc_expiry`, `insurance_policy`, `insurance_expiry`, `vehicle_types_allowed`, `status`
- Vincular a `supplier_deliveries.carrier_id`
- Impacto: atende 8.4.3 (requisitos para provedores externos) e 8.5.1

**Acao 2.3 — Registro de ocorrencias de transporte**
- Adicionar campo `transport_incidents` (jsonb) ou tabela `delivery_transport_events` com: `event_type` (avaria, atraso, desvio de rota, violacao de temperatura), `event_timestamp`, `description`, `resolution`
- Vincular ao ciclo de NC quando `event_type` for avaria
- Impacto: atende 8.5.5 e cria ponte com 8.7 (controle de saidas nao conformes)

### Faixa 3 — Melhoria (90-180 dias): Monitoramento e Analise

**Acao 3.1 — KPI de conformidade de entrega por modal/transportador**
- Dashboard com: `taxa_entregas_conformes_por_transportador`, `ocorrencias_avaria_por_modal`, `tempo_medio_transito_vs_sla`
- Alimentado por `supplier_deliveries` estendido + `delivery_transport_events`
- Impacto: atende 9.1.1 (monitoramento de desempenho operacional) e 8.5.5

**Acao 3.2 — Integracao de conformidade de carga com avaliacao de fornecedor**
- Incluir indicador `conformidade_transporte` no calculo de score AVA2 (`SupplierPerformanceEvaluationPage.tsx`)
- Critério com peso configuravel via `supplierFailureConfigService.ts`
- Impacto: fecha loop com 8.4.1 e 8.4.2 (monitoramento de provedores externos)

---

## Guia de Validacao E2E

Para considerar a conformidade como atendida (score minimo 3.0/5), um auditor ISO 9001 deveria ser capaz de:

1. Selecionar uma entrega qualquer registrada no sistema e recuperar: placa do veiculo, nome do motorista, CNPJ e RNTRC do transportador, modal de transporte utilizado.
2. Verificar que o RNTRC do transportador estava valido na data da entrega (analogia ao controle de licenca em `wasteSuppliers.ts`).
3. Para produtos com requisito de temperatura controlada: encontrar o registro de temperatura de carroçaria na saida e na chegada.
4. Localizar o checklist de condicoes de carga preenchido antes do embarque (analogia ao `CHECKLIST_TEMPLATES.veiculo` do modulo SST).
5. Em caso de avaria ou nao conformidade de entrega: rastrear a NC gerada automaticamente a partir do evento de transporte.

Atualmente, nenhum desses passos e possivel na plataforma.

---

## Conclusao

O Daton ESG Insight e uma plataforma ESG com foco em inventario de emissoes, gestao de residuos, indicadores GRI e conformidade normativa ambiental. A gestao de veiculos de carga no sentido da ISO 9001:2015 clausulas 8.1 e 8.5 e um dominio funcionalmente ausente no sistema atual. Os fragmentos de transporte existentes (modal GHG, checklist SST, rastreabilidade de transportador de residuos) sao funcionalmente distantes dos requisitos normativos de preservacao de produto e conformidade de entrega ao cliente.

A lacuna nao e de qualidade de implementacao, mas de escopo de produto: o sistema nao foi desenhado para gerenciar a logistica de entrega de produto ao cliente final, que e o objeto central das clausulas auditadas. A plataforma pode evoluir para cobrir esse dominio reaproveitando padroes ja estabelecidos (controle de transportador de residuos, checklist de veiculo SST, ciclo de NC), mas isso requer desenvolvimento deliberado de novos modulos.

**Recomendacao:** Antes de iniciar qualquer desenvolvimento, a organizacao deve definir se o modulo de gestao de frota/entrega faz parte do escopo de produto do Daton ESG Insight. Se sim, as acoes da Faixa 1 devem ser tratadas como divida tecnica critica para a certificacao ISO 9001:2015.

---

*Analise realizada em: 2026-03-09*
*Auditor: Compliance Auditor Agent — Daton ESG Insight*
*Arquivos inspecionados: `src/components/TransportDistributionModal.tsx`, `src/services/scope3Categories.ts`, `src/constants/safetyInspectionTypes.ts`, `src/services/waste.ts`, `src/services/mtrDocuments.ts`, `src/services/wasteSuppliers.ts`, `src/services/supplierDeliveriesService.ts`, `src/services/mobileCombustion.ts`, `src/services/assets.ts`, `src/components/legislation/ComplianceQuestionnaireWizard.tsx`, `src/data/demo/dataReportsMocks.ts`, `src/integrations/supabase/types.ts`*
