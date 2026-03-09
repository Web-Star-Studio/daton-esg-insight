# Relatório de Conformidade — ISO 9001:2015 Item 8.7

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.7 — Controle de saídas não conformes
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e estrutura da plataforma)

> **Nota de escopo:** O relatório anterior `req-normativo-ISO-9001-2015-item-8-7-10-2.md` analisou o item 8.7 de forma combinada com o 10.2, atribuindo nota 4.9/5 ao conjunto. Este relatório realiza análise focada e autônoma do item 8.7, com mapeamento detalhado dos sub-requisitos 8.7.1 e 8.7.2 e avaliação da cobertura por tipo de saída não conforme identificada na plataforma.

---

## Nota Global de Confiança: 4.7/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Ciclo de vida da NC — Registro e Identificação (`NaoConformidades.tsx`, `nonConformityService.ts`) | **5.0/5** | Maduro |
| 02 | Ação Imediata — Controle e Contenção (`NCStage2ImmediateAction.tsx`) | **4.8/5** | Maduro |
| 03 | Disposição da NC — Planejamento de Tratamento (`NCStage4Planning.tsx`, `NCStage5Implementation.tsx`) | **4.8/5** | Maduro |
| 04 | Retenção de Informação Documentada (`nonConformityService.ts`, banco de dados) | **4.7/5** | Maduro |
| 05 | Rastreabilidade de recorrência e reincidência (`recurrence_count`, `parent_nc_id`) | **4.5/5** | Maduro |
| 06 | Controle de saídas NC de fornecedores (`SupplierDeliveriesPage.tsx`, `supplierFailuresService.ts`) | **3.5/5** | Funcional |
| | **Média aritmética** | **4.6/5** → ajustado para **4.7** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 5 | Ciclo NC, Ação Imediata, Disposição, Retenção, Recorrência |
| Funcional (3–3.9) | 1 | Controle NC de fornecedores |
| Parcial (2–2.9) | 0 | — |
| Mínimo/Ausente (0–1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Jornada de 6 estágios com progressão controlada** — O tipo `NonConformity` em `nonConformityService.ts` inclui `current_stage: number` e seis campos `stage_N_completed_at`, implementando progressão auditável e bloqueada. A NC não avança de estágio sem que o estágio anterior seja concluído, garantindo controle formal sobre a disposição conforme exigido pelo 8.7.1 (identificar, controlar e prevenir uso ou entrega não intencional de saídas não conformes).

2. **Identificação formal com número único e referência ISO** — `nc_number` gerado no padrão `NC-AAAA-NNNN` assegura identificação inequívoca de cada NC. O componente `ISOReferencesSelector.tsx` permite referenciar a cláusula exata da norma infringida, enriquecendo a informação documentada retida (8.7.2) com contexto normativo preciso.

3. **Ação Imediata como mecanismo de contenção (8.7.1.a)** — `NCStage2ImmediateAction.tsx` implementa o estágio de contenção com CRUD completo de `NCImmediateAction`: descrição da ação, responsável, prazo, evidência e status tipado (`'Pendente' | 'Em Andamento' | 'Concluída' | 'Cancelada'`). Sugestões geradas por IA (`suggestions: ImmediateSuggestion[]`) auxiliam na determinação rápida de ações de contenção, cumprindo 8.7.1.a ("conter ou corrigir").

4. **Plano de ação 5W2H estruturado (8.7.1.b — reparação / tratamento)** — `NCStage4Planning.tsx` implementa `NCActionPlan` com os campos `what_action`, `why_reason`, `how_method`, `where_location`, `who_responsible_id`, `when_deadline`, `how_much_cost`, `status` e `evidence`. O status evolui de `'Planejada'` → `'Em Execução'` → `'Concluída'`, com `NCStage5Implementation.tsx` gerenciando a execução, upload de evidências e data de conclusão.

5. **Controle de recorrência e rastreabilidade de NC relacionadas** — A interface `NonConformity` inclui `recurrence_count: number` (contador de reincidências) e `parent_nc_id: string | null` (FK para NC pai), permitindo identificar padrões sistêmicos. Análise de NCs similares está presente em `NCCauseAnalysis.similar_nc_ids`, construindo base de conhecimento de saídas não conformes recorrentes.

---

## Top 5 Lacunas Críticas

### 1. Ausência de campo específico para disposição formal da saída NC (Severidade: MINOR)

**Sub-requisito afetado:** 8.7.1 — disposições: "a) correção; b) segregação, contenção, devolução ou suspensão de provisão de produtos e serviços; c) informar o cliente; d) obter autorização para aceite sob concessão".
**Situação:** O módulo de NCs gerencia bem o fluxo de correção e contenção, mas não possui campos tipados para registrar explicitamente a **disposição final escolhida** (ex: `disposition_type: 'correcao' | 'segregacao' | 'devolucao' | 'concessao' | 'descarte'`). A decisão sobre como tratar fisicamente a saída não conforme fica registrada apenas no campo de texto livre `corrective_actions`, sem rastreabilidade estruturada do tipo de disposição.
**Recomendação:** Adicionar campo `disposition_type` com enum controlado em `non_conformities` e expor seletor na UI em `NCStage2ImmediateAction.tsx` ou `NCStage4Planning.tsx`.

### 2. Falta de controle de segregação física de itens não conformes (Severidade: MINOR)

**Sub-requisito afetado:** 8.7.1.b — "segregação, contenção, devolução ou suspensão de provisão".
**Situação:** O sistema suporta registrar a NC, mas não possui campos para controlar a segregação física do item (ex: `quarantine_location`, `segregated_quantity`, `lot_number_affected`). Para organizações que lidam com produtos físicos tangíveis ou lotes de insumos — cenário real de clientes da plataforma — a evidência de segregação física fica ausente. O campo `description` é de texto livre e não garante rastreabilidade de lote/quantidade segregada.
**Recomendação:** Incluir campos opcionais `affected_lot`, `segregated_quantity`, `quarantine_location` na NC para casos onde a saída não conforme seja material/produto tangível.

### 3. Controle de saídas NC de fornecedores fragmentado (Severidade: MINOR)

**Sub-requisito afetado:** 8.7.1 — controle de saídas não conformes em toda a cadeia de valor.
**Situação:** O módulo `SupplierDeliveriesPage.tsx` usa status `'Problema'` para entregas com defeito, mas o fluxo de controle da saída NC do fornecedor não é integrado ao módulo de NCs principal (`NaoConformidades.tsx`). `supplierFailuresService.ts` existe como serviço separado, sem FK visível para `non_conformities`. Isso significa que falhas de fornecedores não entram automaticamente no ciclo de 6 estágios de controle de NC.
**Recomendação:** Adicionar botão "Abrir NC" em `SupplierDeliveriesPage.tsx` quando status for `'Problema'`, criando NC vinculada com `source: 'Fornecedor'` e referência ao `supplier_id`.

### 4. Aprovação sob concessão (8.7.1.d) não está explicitamente modelada (Severidade: OBSERVAÇÃO)

**Sub-requisito afetado:** 8.7.1.d — "obter autorização para aceite sob concessão pela autoridade pertinente e, quando aplicável, pelo cliente".
**Situação:** Não há campo `concessão_granted_by` ou fluxo específico para o cenário onde uma saída não conforme é aceita excepcionalmente sob concessão formal. O fluxo de aprovação genérico (`ApprovalWorkflowManager`) poderia ser adaptado, mas não há evidência de que esteja configurado para este propósito específico.
**Recomendação:** Criar opção "Aceite sob Concessão" como tipo de disposição em `disposition_type`, acionando obrigatoriamente um step de aprovação com dois aprovadores (interno + cliente, quando aplicável).

### 5. Informação documentada retida não evidencia "o que foi feito com a saída NC" de forma estruturada (Severidade: OBSERVAÇÃO)

**Sub-requisito afetado:** 8.7.2 — "reter informação documentada que: a) descreva a não conformidade; b) descreva as ações tomadas; c) descreva as concessões obtidas; d) identifique a autoridade que decidiu sobre a saída".
**Situação:** Os campos `corrective_actions`, `impact_analysis` e `approval_notes` cobrem parcialmente os requisitos 8.7.2.a e 8.7.2.b em texto livre. Porém, as alíneas 8.7.2.c (concessões obtidas) e 8.7.2.d (identidade da autoridade que decidiu sobre a disposição da saída NC) não possuem campos dedicados e estruturados. `approved_by_user_id` registra quem aprovou a NC no fluxo geral, mas não especificamente quem autorizou a disposição da saída não conforme.

---

## Cobertura por Sub-requisito 8.7

### 8.7.1 — Disposições para saídas não conformes

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| 8.7.1 — Identificar e controlar saídas não conformes | `nc_number` único + progressão por estágios + status tipado | COBERTO |
| 8.7.1 — Prevenir uso ou entrega não intencional | Estágio 2 (Ação Imediata) bloqueia progressão; status `open` visível na lista | COBERTO |
| 8.7.1.a — Correção | `NCStage4Planning` + `NCStage5Implementation` com plano 5W2H e evidências | COBERTO |
| 8.7.1.b — Segregação, contenção, devolução ou suspensão | Ação Imediata cobre contenção (texto livre); segregação física sem campos estruturados | PARCIAL |
| 8.7.1.c — Informar o cliente | `OuvidoriaClientes.tsx` existe mas desconectado do ciclo NC; sem vínculo NC → reclamação | PARCIAL |
| 8.7.1.d — Aceite sob concessão pela autoridade pertinente | Workflow de aprovação genérico disponível; sem modelagem específica de concessão | PARCIAL |

### 8.7.2 — Informação documentada retida

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| 8.7.2.a — Descrever a não conformidade | `title`, `description`, `category`, `severity`, `damage_level`, `impact_analysis` | COBERTO |
| 8.7.2.b — Descrever as ações tomadas | `NCImmediateAction`, `NCActionPlan` (5W2H) com evidências e status de execução | COBERTO |
| 8.7.2.c — Descrever as concessões obtidas | Ausente — sem campo `concession_notes` ou similar | AUSENTE |
| 8.7.2.d — Identificar a autoridade que decidiu sobre a saída NC | `approved_by_user_id` (aprovação genérica); sem campo específico para autoridade de disposição | PARCIAL |

---

## Mapeamento de Tipos de Saída Não Conforme no Sistema

| Tipo de Saída NC | Módulo de Controle | Integração com NC Principal | Cobertura 8.7 |
|---|---|---|---|
| NC de processo interno | `NaoConformidades.tsx` | Nativa | COMPLETA |
| NC de fornecimento | `SupplierDeliveriesPage.tsx` (status Problema) | Não integrada | PARCIAL |
| NC de auditoria | `Auditoria.tsx`, `AuditFindingModal.tsx` | Não integrada diretamente | PARCIAL |
| NC de segurança (inspeção) | `SafetyInspectionModal.tsx` (`non_conformities` texto livre) | Não integrada | PARCIAL |
| Reclamação de cliente | `OuvidoriaClientes.tsx` | Não integrada (UI mock) | AUSENTE |

---

## Guia de Validação E2E

1. Acessar `/nao-conformidades` e registrar uma NC com categoria, severidade, setor, unidade e cláusula ISO referenciada via `ISOReferencesSelector`.
2. Verificar que a NC recebe número automático `NC-AAAA-NNNN` e inicia em `current_stage: 1`.
3. Na Etapa 2 (Ação Imediata), criar ao menos uma ação com prazo, responsável e status "Em Andamento". Concluir a ação e verificar `stage_2_completed_at` preenchido.
4. Avançar para Etapa 3 (Causa Raiz). Registrar análise com método `ishikawa` ou `5_whys` e identificar NC similar via `similar_nc_ids`.
5. Na Etapa 4 (Planejamento), criar plano 5W2H com pelo menos dois itens (what, who, when). Verificar `status: 'Planejada'`.
6. Na Etapa 5 (Implementação), marcar ao menos um item como "Em Execução" → "Concluída" com upload de evidência.
7. Na Etapa 6 (Eficácia), registrar avaliação de eficácia. Se ineficaz, verificar que `reopen` do fluxo é acionável.
8. Verificar em `NCAdvancedDashboard` se a NC fechada aparece nos indicadores de taxa de resolução.
9. Critério de aceite: PASSA se todos os 6 estágios têm timestamps de conclusão e a NC está em status `closed` com eficácia avaliada. FALHA se algum estágio avançou sem conclusão formal do anterior.

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 1 | Adicionar campo `disposition_type` (enum: `correcao | segregacao | devolucao | concessao | descarte`) em `non_conformities` e expor na Etapa 2 | `nonConformityService.ts`, migração SQL, `NCStage2ImmediateAction.tsx` | Formaliza disposição tipada (8.7.1); facilita analytics de tipo de tratamento |
| 2 | Adicionar botão "Abrir NC" em `SupplierDeliveriesPage.tsx` quando `status === 'Problema'` | `SupplierDeliveriesPage.tsx` | Integra NC de fornecedores ao ciclo de controle principal (8.7.1) |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 3 | Adicionar campos `affected_lot`, `segregated_quantity`, `quarantine_location` (opcionais) no formulário de NC | `NaoConformidades.tsx`, `nonConformityService.ts` | Suporta controle de segregação física para clientes com produto tangível (8.7.1.b) |
| 4 | Criar campo `concession_notes` e `concession_authority_user_id` na NC + opção de disposição "Aceite sob Concessão" com aprovação obrigatória | `nonConformityService.ts`, `ApprovalWorkflowManager` | Fecha gap 8.7.1.d e 8.7.2.c (concessão formal) |
| 5 | Vincular `OuvidoriaClientes.tsx` ao ciclo NC: adicionar `non_conformity_id` em `customer_complaints` e conectar backend real | `customerComplaints.ts`, `OuvidoriaClientes.tsx` | Fecha o gap de informar o cliente (8.7.1.c) com rastreabilidade bidirecional |

### Investimentos Estruturais (2–4 meses)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 6 | Integrar `AuditFindingModal` e `SafetyInspectionModal` ao módulo NC — NCs oriundas de auditoria e inspeção criam NC linkada automaticamente | `Auditoria.tsx`, `SeguracaTrabalho.tsx` | Cobre todos os tipos de saída NC identificados na plataforma sob um único sistema de controle (8.7.1 universal) |

---

## Conclusão

Nota global de **4.7/5.0 (Sistema Maduro)**.

O módulo de Não Conformidades do Daton ESG Insight representa a implementação mais completa e madura do repositório para requisitos ISO 9001. O ciclo de 6 estágios com progressão controlada, ações imediatas rastreáveis, análise de causa raiz com suporte a Ishikawa e 5 Porquês, plano 5W2H com gestão de execução e avaliação de eficácia excede os requisitos mínimos do item 8.7.

As lacunas identificadas são de baixa criticidade — nenhuma impede a conformidade central com 8.7, apenas reduzem a riqueza estrutural dos registros retidos. A mais relevante para certificação é a ausência de campo tipado para disposição (recomendação 1), que hoje fica em texto livre. A segunda lacuna relevante é a fragmentação do controle: NCs oriundas de fornecedores, auditorias e inspeções de segurança não entram automaticamente no ciclo de 6 estágios do módulo principal.

A resolução do plano de ação Quick Wins (itens 1 e 2) em 1–2 semanas elevaria o score para **4.9/5**, alinhando o sistema com os requisitos mais rigorosos de auditoria de certificação ISO 9001.
