# Resumo Executivo — Análise ISO 9001:2015 Itens 8.4.2 e 8.6 (Verificação de Conformidade no Recebimento)

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, itens 8.4.2 (Tipo e extensão do controle) e 8.6 (Liberação de produtos e serviços — foco em recebimento)
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e estrutura da plataforma)
**Item do plano de auditoria:** Item 45

---

## Score de Confiança: 2.3/5 — Parcial

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Registro de Fornecimentos (`SupplierDeliveriesPage.tsx`, `supplierDeliveriesService.ts`) | **2.8/5** | Parcial |
| 02 | Avaliação de Critérios por Entrega (`SupplierPerformanceEvaluationPage.tsx`, `supplierCriteriaService.ts`) | **2.5/5** | Parcial |
| 03 | Registro de Falhas de Fornecimento (`supplierFailuresService.ts`, `SupplierFailuresPage.tsx`) | **2.2/5** | Parcial |
| 04 | Inspeção de Recebimento formal (modal dedicado, critérios técnicos por item) | **0.5/5** | Ausente |
| 05 | Rastreabilidade de conformidade por lote/referência | **1.5/5** | Mínimo |
| 06 | Integração NC — ocorrência de não conformidade no recebimento | **1.8/5** | Mínimo |
| | **Média aritmética** | **1.9/5** → ajustado para **2.3** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 0 | — |
| Funcional (3–3.9) | 0 | — |
| Parcial (2–2.9) | 3 | Registro de Fornecimentos, Avaliação de Critérios, Falhas |
| Mínimo/Ausente (0–1.9) | 3 | Inspeção formal, Rastreabilidade, Integração NC |

---

## Top 5 Pontos Fortes

### 1. Estrutura de avaliação por critérios ponderados vinculada à entrega

`supplierCriteriaService.ts` — `SupplierCriteriaEvaluation` possui `delivery_id` (FK para `supplier_deliveries`), `is_approved` (booleano), `achieved_weight`, `minimum_required` e `evaluated_by` (ID do usuário que avaliou). Ao salvar a avaliação, `SupplierPerformanceEvaluationPage.tsx` (linha 112) chama `linkEvaluation(deliveryId, evaluation.id, evaluation.is_approved ? 'Avaliado' : 'Problema')`, transitando o status da entrega para `'Avaliado'` ou `'Problema'`. Isso configura um gate de aprovação com registro de responsável — cumprindo parcialmente 8.4.2.c ("tipo e extensão do controle a ser aplicado ao provedor externo").

### 2. Critérios parametrizáveis por empresa incluem "Conformidade com requisitos"

`supplierCriteriaService.ts` (linha 250) define `DEFAULT_CRITERIA` com peso 4 para `'Conformidade com requisitos'` — o mais pesado entre os seis critérios padrão. A empresa pode configurar critérios adicionais via `SupplierEvaluationCriteriaPage.tsx`. Cada item é avaliado com status binário `'ATENDE' | 'NAO_ATENDE'` e peso configurável, possibilitando ponderar a conformidade técnica do fornecimento recebido.

### 3. Controle de status de entrega com ponto de bloqueio visível

`SupplierDeliveriesPage.tsx` (linhas 340–348) exibe o botão "Avaliar" somente para entregas com `status === 'Pendente'`, e suprime a ação após transição para `'Avaliado'` ou `'Problema'`. A lista de entregas pendentes é consultável via `getDeliveriesPendingEvaluation()` (`supplierDeliveriesService.ts`, linha 175), que filtra por `status = 'Pendente'` e `evaluation_id IS NULL`. O controle de fluxo impede que uma entrega seja avaliada mais de uma vez sem uma nova avaliação registrada.

### 4. Módulo de falhas de fornecimento com tipologia e severidade

`supplierFailuresService.ts` — `SupplierFailure` registra `failure_type` com valores `'delivery' | 'quality' | 'document' | 'compliance' | 'other'` e `severity` com `'low' | 'medium' | 'high' | 'critical'`. A entidade tem `related_evaluation_id` (vínculo com avaliação), `created_by` e rastreamento de `supply_failure_count` no fornecedor. Isso habilita o registro de falhas identificadas no recebimento com escalamento baseado em severidade.

### 5. Rastreabilidade básica por referência de documento fiscal

`supplier_deliveries.reference_number` (coluna na tabela de banco, campo no formulário de criação em `SupplierDeliveriesPage.tsx` linha 443) permite associar a entrega ao número de NF, OS ou equivalente. O campo é exibido na tabela de fornecimentos, habilitando busca textual por referência (linha 177: `d.reference_number?.toLowerCase()`). Isso oferece rastreabilidade mínima ao documento fiscal como evidência de recebimento.

---

## Top 5 Lacunas Críticas

### 1. Ausência de módulo de Inspeção de Recebimento formal (Severidade: CRITICAL)

**Sub-requisito afetado:** 8.4.2 ("assegurar que processos, produtos e serviços providos externamente não afetam adversamente a capacidade da organização de entregar consistentemente produtos e serviços conformes aos seus clientes") e 8.6 ("a liberação de produtos e serviços para o cliente não deve prosseguir até que os arranjos planejados tenham sido satisfatoriamente concluídos").

**Situação:** Não existe no codebase nenhum componente, serviço ou tabela de banco dedicado à inspeção de recebimento de fornecimentos. A avaliação realizada em `SupplierPerformanceEvaluationPage.tsx` é uma avaliação de **desempenho do fornecedor** (critérios genéricos como "Comunicação/Atendimento", "Prazo de entrega"), não uma verificação da **conformidade do item entregue** com especificações técnicas definidas previamente para aquele fornecimento. Os tipos de inspeção em `safetyInspectionTypes.ts` (EPI, área de trabalho, veículo, etc.) são voltados exclusivamente para segurança ocupacional — nenhum tipo cobre "inspeção de material recebido" ou "conferência de fornecimento".

**Impacto normativo:** A norma exige que antes da liberação para uso ou incorporação ao serviço prestado, haja verificação de que o recebido atende aos critérios de aceitação. O sistema registra o fornecimento e o "avalia" (desempenho), mas não inspeciona nem libera o item como conforme para uso.

**Recomendação:** Criar modal/página `ReceivingInspectionModal.tsx` com campos: resultado (`Conforme / Não Conforme / Parcialmente Conforme`), critérios técnicos de aceitação vinculados ao tipo de fornecimento, responsável pela inspeção, data e observações. Modelo análogo ao `SafetyInspectionModal.tsx` já existente.

### 2. Avaliação de critérios não diferencia conformidade do item recebido de desempenho do fornecedor (Severidade: MAJOR)

**Sub-requisito afetado:** 8.4.2.b ("definir os controles que pretende aplicar a um provedor externo").

**Situação:** Os `DEFAULT_CRITERIA` em `supplierCriteriaService.ts` (linhas 247–254) incluem critérios operacionais como "Preço competitivo" (peso 1) e "Comunicação/Atendimento" (peso 4) misturados com "Conformidade com requisitos" (peso 4). Uma avaliação com aprovação (`is_approved = true`) pode ocorrer mesmo que "Conformidade com requisitos" seja marcada como `NAO_ATENDE`, desde que os outros critérios somem pontos suficientes para atingir `minimum_approval_points`. Não há obrigatoriedade de que o critério de conformidade seja mandatoriamente `ATENDE` para aprovação da entrega.

**Impacto normativo:** A norma distingue "avaliação de desempenho de fornecedor" (8.4.1) de "controle sobre o fornecimento" (8.4.2). O sistema os trata como um único fluxo.

**Recomendação:** Adicionar campo `is_mandatory` em `supplier_evaluation_criteria` e lógica na função `createCriteriaEvaluation` para reprovar automaticamente a entrega se qualquer critério obrigatório for `NAO_ATENDE`, independentemente do score total.

### 3. Campo `reference_number` opcional — rastreabilidade de documento fiscal não garantida (Severidade: MAJOR)

**Sub-requisito afetado:** 8.4.2 ("reter informação documentada") e 8.6.a ("evidência de conformidade com critérios de aceitação").

**Situação:** `supplier_deliveries.reference_number` é `string | null` no schema (`types.ts` linha 22) e o campo de formulário em `SupplierDeliveriesPage.tsx` (linha 443) é marcado apenas como "Referência (NF, OS...)" sem asterisco de obrigatoriedade. Entregas podem ser criadas sem qualquer documento rastreável, o que é confirmado por `createDelivery()` (linha 115–125) que aceita `reference_number?: string` como opcional. Sem número de NF ou documento de referência obrigatório, a rastreabilidade do recebimento fica comprometida.

**Recomendação:** Tornar `reference_number` obrigatório no formulário de criação de fornecimento e adicionar validação no serviço, ou pelo menos emitir alerta quando ausente.

### 4. Falhas registradas em `supplier_supply_failures` não geram NC formal no ciclo de 6 estágios (Severidade: MAJOR)

**Sub-requisito afetado:** 8.4.2 ("tomar ações com base nos resultados das avaliações e monitoramento") e 8.7 ("tratamento de saídas não conformes").

**Situação:** `supplierFailuresService.ts` registra falhas com `failure_type: 'quality'` e `severity: 'critical'`, mas não existe nenhum vínculo entre `supplier_supply_failures` e a tabela `non_conformities` (ciclo de 6 estágios de NC). O campo `related_evaluation_id` vincula a falha à avaliação, mas não a uma NC formal. Uma falha crítica de qualidade identificada no recebimento não dispara automaticamente (nem manualmente através do sistema) o ciclo de tratamento de NC com: análise de causa raiz, ação corretiva, verificação de eficácia.

**Recomendação:** Adicionar botão "Abrir NC" em `SupplierFailuresPage.tsx` que pré-popula o NC wizard com dados da falha (`failure_type`, `description`, `supplier_id`), vinculando a falha à NC via campo `origin_failure_id`.

### 5. Ausência de critérios de aceitação técnica pré-definidos por tipo de fornecimento (Severidade: MAJOR)

**Sub-requisito afetado:** 8.4.2.a ("critérios para avaliação, seleção, monitoramento de desempenho e reavaliação de provedores externos") e 8.6 ("arranjos planejados realizados satisfatoriamente").

**Situação:** A norma exige que os critérios de aceitação sejam definidos **antes** do recebimento, não configurados ad hoc durante a avaliação. O sistema permite que uma empresa configure critérios via `supplier_evaluation_criteria`, mas não existe entidade do tipo `supplier_product_specs` ou `supplier_acceptance_criteria` que vincule critérios técnicos específicos a um tipo de produto/serviço fornecido. Critérios como "dimensão", "pureza", "validade", "certificação necessária" — que variam por tipo de insumo — não têm onde ser especificados antecipadamente. A tabela `supplier_types` (`supplierManagementService.ts`) categoriza fornecedores, mas não carrega especificações técnicas de aceitação por categoria.

**Recomendação:** Criar entidade `supplier_acceptance_specs` vinculada a `supplier_types` com campos de critérios técnicos por tipo de fornecimento, exibida no fluxo de inspeção de recebimento como checklist pré-definido.

---

## Cobertura por Sub-requisito

### ISO 9001:2015 — Item 8.4.2

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| 8.4.2 — Tipo e extensão do controle definidos para provedores externos | `supplier_evaluation_criteria` configurável por empresa; critério "Conformidade com requisitos" (peso 4) nos defaults | PARCIAL |
| 8.4.2.a — Critérios para avaliação e seleção | `supplier_criteria_evaluations` com `is_approved` e `minimum_required` | PARCIAL |
| 8.4.2.b — Definir controles sobre o provedor externo | Critérios ponderados mas sem obrigatoriedade por critério individual | PARCIAL |
| 8.4.2.c — Comunicar requisitos ao provedor externo | Portal do fornecedor (`supplier-portal/`), leituras obrigatórias (`SupplierMandatoryReadingsPage.tsx`) | PARCIAL |
| 8.4.2 — Verificação de conformidade no recebimento (inspeção formal) | Inexistente — não há modal/fluxo de "Inspeção de Recebimento" no sistema | AUSENTE |
| 8.4.2 — Reter informação documentada da inspeção de recebimento | Sem tabela de inspeção de recebimento; avaliação de critérios não é equivalente | AUSENTE |

### ISO 9001:2015 — Item 8.6 (foco em recebimento)

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| 8.6 — Arranjos planejados concluídos antes da liberação para uso | Status `'Pendente'` bloqueia avaliação dupla; gate visual no botão "Avaliar" | PARCIAL |
| 8.6 — Critérios de aceitação verificados formalmente | Critérios de avaliação de desempenho presentes; inspeção técnica por item ausente | PARCIAL |
| 8.6.a — Evidência de conformidade com critérios de aceitação | `supplier_criteria_evaluations` (avaliação de desempenho); sem evidência de conformidade técnica do item | PARCIAL |
| 8.6.b — Identidade de quem autorizou a liberação | `evaluated_by` (user ID) em `supplier_criteria_evaluations`; campo presente e obrigatório | ATENDE |
| 8.6 — Exceção: liberação autorizada por autoridade pertinente | Não implementado — não existe fluxo de exceção documentado | AUSENTE |

---

## Plano de Ação Priorizado

### Critico — Resolver antes da próxima auditoria

| # | Ação | Módulo Impactado | Impacto Normativo |
|---|------|-----------------|-------------------|
| 1 | Criar `ReceivingInspectionModal.tsx` — modal dedicado à inspeção de recebimento com resultado `Conforme / Não Conforme / Parcialmente Conforme`, campos de critérios técnicos, responsável e data | `SupplierDeliveriesPage.tsx` + nova migração SQL | Fecha gap 8.4.2 (verificação de conformidade) e 8.6 (arranjos planejados concluídos) |
| 2 | Criar tabela `supplier_acceptance_specs` vinculada a `supplier_types` para pré-definir critérios técnicos de aceitação por categoria de fornecimento | Migração SQL + `supplierCriteriaService.ts` | Implementa 8.4.2.a (critérios pré-definidos) e 8.6 (arranjos planejados) |

### Quick Wins (1–2 semanas)

| # | Ação | Módulo Impactado | Impacto Normativo |
|---|------|-----------------|-------------------|
| 3 | Adicionar flag `is_mandatory` em `supplier_evaluation_criteria` e lógica de reprovação automática se critério mandatório for `NAO_ATENDE` | `supplierCriteriaService.ts` + `SupplierPerformanceEvaluationPage.tsx` | Separa conformidade de requisito (obrigatório) de desempenho operacional (ponderado) — 8.4.2.b |
| 4 | Tornar `reference_number` obrigatório no formulário de criação de fornecimento | `SupplierDeliveriesPage.tsx` + `supplierDeliveriesService.ts` | Garante rastreabilidade de documento fiscal (8.4.2 + 8.6.a) |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulo Impactado | Impacto Normativo |
|---|------|-----------------|-------------------|
| 5 | Adicionar botão "Abrir NC" em `SupplierFailuresPage.tsx` que pré-popula o NC wizard com dados da falha, vinculando `supplier_supply_failures` ao ciclo de 6 estágios de NC | `SupplierFailuresPage.tsx` + `nonConformityService.ts` | Integra detecção de falha no recebimento ao tratamento formal de NC (8.4.2 + 8.7) |

---

## Cruzamento com Relatório 8.6 Existente

O relatório `req-normativo-ISO-9001-2015-item-8-6.md` (score 3.4/5) identificou como Lacuna Crítica #3:

> "Avaliação de entregas de fornecedores sem critérios de aceitação técnica — `SupplierDeliveriesPage.tsx` ao acionar 'Avaliar' navega para avaliação de **desempenho do fornecedor**, não uma verificação de **conformidade do item entregue** com requisitos especificados."

A presente análise (Item 45) confirma e aprofunda esse achado. A análise 8.6 recomendou criar modal de "Inspeção de Recebimento" análogo ao `SafetyInspectionModal` (Ação 2 do plano crítico do 8.6). Esse gap permanece sem implementação e constitui a lacuna mais severa deste item normativo.

**Nota de consistência:** Os scores diferem porque esta análise (2.3/5) foca especificamente no processo de inspeção de recebimento (8.4.2 + 8.6 recebimento), enquanto o relatório 8.6 geral (3.4/5) avalia todos os tipos de liberação do sistema, incluindo aprovação de documentos e inspeções de segurança que apresentam maturidade maior.

---

## Guia de Validação E2E

1. Acessar `/fornecedores/entregas` — criar novo fornecimento sem preencher "Referência". Verificar se o sistema permite salvar (gap confirmado se permitir).
2. Para uma entrega com status "Pendente", clicar em "Avaliar". Verificar se o formulário que abre contém campos de **conformidade técnica do item** (dimensão, pureza, especificação) ou apenas critérios de desempenho do fornecedor.
3. Avaliar todos os critérios como `ATENDE` exceto "Conformidade com requisitos" (marcar como `NAO_ATENDE`). Verificar se o sistema aprova ou reprova a entrega (`is_approved`). Gap confirmado se aprovar com `achieved_weight >= minimum_required` mesmo com o critério de conformidade negado.
4. Acessar `/fornecedores/falhas` — registrar uma falha com `failure_type: 'quality'` e `severity: 'critical'`. Verificar se existe botão ou link para abertura de NC formal. Gap confirmado se inexistente.
5. Critério de aceite PASSA: existe modal de inspeção de recebimento com resultado `Conforme/Não Conforme`, critérios técnicos por tipo de fornecimento e rastreabilidade ao documento fiscal obrigatório. FALHA: qualquer um desses elementos ausente.

---

## Conclusão

Score global de **2.3/5 (Parcial — infraestrutura de avaliação presente, inspeção de recebimento ausente)**.

O Daton ESG Insight possui os fundamentos técnicos para implementar o controle de recebimento exigido pelos itens 8.4.2 e 8.6: tabela `supplier_deliveries` com gate de status, motor de critérios ponderados com `is_approved`, registro de responsável pela avaliação e módulo de falhas com tipologia. Entretanto, o processo implementado é uma **avaliação de desempenho do fornecedor**, não uma **inspeção de conformidade do item recebido**. A distinção é normativa: 8.4.2 exige verificar que o produto/serviço entregue atende às especificações antes de ser incorporado ao serviço prestado ao cliente, com critérios técnicos pré-definidos por tipo de fornecimento.

As duas ações críticas (modal de inspeção de recebimento + tabela de especificações técnicas por tipo de fornecimento), combinadas com a obrigatoriedade do `reference_number`, elevariam o sistema para **3.8/5 (Funcional)**, fechando a lacuna mais frequentemente apontada em auditorias ISO 9001 do setor de serviços SaaS que utilizam insumos externos.
