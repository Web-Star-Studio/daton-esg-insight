# Resumo Executivo — Análise ISO 9001:2015 Item 8.2.2 (Critérios de Levantamento e Controle de Requisitos ao Longo do Ciclo de Venda)

**Norma:** ISO 9001:2015
**Item:** 8.2.2 — Determinação de requisitos relativos a produtos e serviços (foco: critérios de levantamento e controle antes, durante e após a venda)
**Tipo de análise:** Tipo B (Conformidade do Sistema — sem documento externo de validação)
**Data:** 2026-03-09
**Auditor:** Compliance Auditor IA

---

## Score de Confiança Global

**2.4 / 5 — Parcial**

O codebase do Daton ESG Insight evidencia módulos adjacentes que tocam indiretamente os requisitos de 8.2.2 — especialmente o módulo de partes interessadas (`stakeholderRequirements.ts`), acordos internos (`internalAgreements.ts`) e pesquisas de satisfação (`satisfactionSurveys.ts`). Contudo, **nenhum módulo implementa um critério formal e completo para levantamento, registro e controle de requisitos de produtos/serviços especificamente ao longo das fases pré-venda, durante a execução e pós-entrega**. O sistema trata requisitos regulatórios e de partes interessadas genéricas, mas não o ciclo específico de requisitos de clientes individuais associado a pedidos ou contratos concretos.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|--------|-----------------|------|-----------|
| Acordos Internos (pré-venda) | `src/services/internalAgreements.ts` | 3.0 | `scope`, `deliverables`, `milestones` e versionamento presentes; ausente checklist de requisitos do cliente pré-aceite |
| Requisitos Regulatórios | `src/services/compliance.ts` | 2.5 | `RegulatoryRequirement` cobre requisitos legais/jurisdicionais; não mapeia requisitos específicos de produto/cliente |
| Requisitos ISO (biblioteca) | `src/services/isoRequirements.ts` | 2.0 | Biblioteca de cláusulas ISO no banco (`iso_requirements`); não inclui cláusulas da seção 8.2 |
| Partes Interessadas | `src/services/stakeholderRequirements.ts` | 3.5 | Melhor mecanismo disponível: status, evidências, revisão periódica e KPIs — mas hardcoded para cláusula 4.2, não para requisitos de clientes individuais |
| Pesquisa de Satisfação (pós-venda) | `src/services/satisfactionSurveys.ts` | 3.2 | Coleta estruturada de feedback pós-entrega com analytics; sem gatilho associado a pedido específico |
| Reclamações de Clientes | `src/services/customerComplaints.ts` | 3.0 | Captura de desvios após entrega; `OuvidoriaClientes.tsx` desconectada (dados mock) |
| Formulários Customizados | `src/services/customForms.ts` | 2.5 | Captura livre, mas sem estrutura de fase (pré/durante/pós) nem associação a produto/serviço |
| Templates de Auditoria ISO | `src/data/isoTemplates.ts` | 1.0 | Nenhum template cobre cláusulas 8.x da ISO 9001 |

---

## Top 5 Pontos Fortes

1. **Estrutura de acordos com entregáveis e marcos** — `internal_agreements` (schema confirmado em `src/integrations/supabase/types.ts`, linhas 13731-13754) inclui `scope` (texto), `deliverables` (JSON), `milestones` (JSON), `approval_workflow`, `signatures` e `version` — fornecendo a base estrutural para registrar o que foi acordado com o cliente antes e durante a execução.

2. **Mecanismo de levantamento de requisitos de partes interessadas** — `stakeholderRequirements.ts` implementa ciclo completo: cadastro de requisito com `requirement_title`, `requirement_description`, `monitoring_method`, `source_reference`, `review_due_date`, log de `last_checked_at`, evidências documentais e KPIs de atendimento (`calculateStakeholderRequirementKpis` em `stakeholderRequirementsCompliance.ts`). Este padrão é o mais próximo de um controle estruturado de requisitos no sistema.

3. **Pesquisa de satisfação com análise por questão** — `satisfactionSurveys.ts` suporta tipos de questão variados (NPS, rating, escala, texto livre, múltipla escolha) com analytics por questão (`analyzeQuestionResponses`), habilitando coleta quantitativa e qualitativa de percepção do cliente pós-entrega.

4. **Biblioteca de requisitos ISO consultável** — `isoRequirements.ts` + tabela `iso_requirements` no banco permitem busca por cláusula, standard e termos livres. Embora a cláusula 8.2 não esteja cadastrada, a infraestrutura existe para incluí-la e vinculá-la a checklists de levantamento de requisitos.

5. **Controle de versão em acordos** — campo `version` em `internal_agreements` (iniciado em `'1.0'` na criação, linha 91 de `internalAgreements.ts`) e campo `parent_agreement_id` possibilitam rastrear histórico de alterações de requisitos ao longo do contrato — base para conformidade com 8.2.4 (mudanças nos requisitos).

---

## Top 5 Lacunas Críticas

1. **CRITICA — Ausência de checklist de levantamento pré-venda:** Nenhum formulário, serviço ou tabela implementa a captura estruturada dos quatro tipos de requisitos exigidos pela norma antes da aceitação do pedido: (a) requisitos declarados pelo cliente, (b) requisitos implícitos necessários ao uso, (c) requisitos regulatórios aplicáveis ao produto/serviço, e (d) requisitos adicionais da organização. O campo `scope` de `internal_agreements` é texto livre sem estrutura de checklist.

2. **CRITICA — Ausência de fase "durante a execução" para controle de requisitos:** Nenhum módulo rastreia se os requisitos acordados estão sendo atendidos *durante* a entrega do produto/serviço. O único ponto de monitoramento de requisitos é o módulo de partes interessadas (`review_due_date`), que opera em escala temporal periódica genérica, não atrelada ao ciclo de execução de um pedido específico.

3. **CRITICA — Interface `OuvidoriaClientes.tsx` inoperante (linha 23: `mockComplaints: any[] = []`):** A captura de desvios pós-entrega — canal essencial para identificar requisitos não atendidos após a venda — está completamente desconectada de dados reais. O `TODO` na linha 22 confirma que o módulo não foi integrado ao `customerComplaints.ts`.

4. **MAJOR — `stakeholderRequirements.ts` hardcoded para cláusula 4.2:** O método `createStakeholderRequirement` define `iso_clause: "4.2"` e `iso_standard: "ISO_9001"` de forma fixa (linhas 321-322). Isso impede o reaproveitamento deste módulo para requisitos de clientes em contexto 8.2.2 sem refatoração. Qualquer requisito criado fica erroneamente catalogado como requisito de parte interessada (4.2), não de produto/serviço.

5. **MINOR — Biblioteca `iso_requirements` sem cláusulas 8.x:** O serviço `isoRequirements.ts` consulta a tabela `iso_requirements`, mas nenhuma evidência no codebase indica que as cláusulas 8.2.2 e 8.2.3 estão cadastradas como requisitos ativos. Os templates de auditoria em `isoTemplates.ts` cobrem apenas cláusulas 4.x e 5.x da ISO 9001, confirmando que o sistema não orienta equipes internas a verificar conformidade com 8.2.

---

## Cobertura por Sub-requisito

| Sub-requisito | Descrição Normativa | Status | Evidência / Lacuna |
|--------------|---------------------|--------|--------------------|
| 8.2.2.a — Requisitos declarados pelo cliente | Capturar o que o cliente especificou explicitamente | Parcial | `internal_agreements.scope` e `deliverables` capturam escopo; sem campo estruturado por item de requisito |
| 8.2.2.b — Requisitos não declarados mas necessários | Identificar requisitos implícitos ao uso | Ausente | Nenhum processo ou campo específico no codebase |
| 8.2.2.c — Requisitos legais e regulatórios do produto | Mapear obrigações legais aplicáveis ao produto/serviço | Parcial | `compliance.ts` + `is_legal_requirement` em `stakeholderRequirements.ts`; sem vinculação direta a produto/serviço |
| 8.2.2.d — Requisitos adicionais da organização | Requisitos internos além dos exigidos pelo cliente | Não verificável | Não identificado |
| 8.2.2 — Controle PRÉ-VENDA | Levantar e confirmar requisitos antes de comprometer-se | Ausente | Nenhum fluxo formal de pré-venda para captura de requisitos |
| 8.2.2 — Controle DURANTE | Monitorar atendimento de requisitos na execução | Ausente | Nenhum módulo de acompanhamento de requisitos por pedido |
| 8.2.2 — Controle PÓS-VENDA | Capturar feedback e desvios após entrega | Parcial | `satisfactionSurveys.ts` e `customerComplaints.ts` existem; `OuvidoriaClientes.tsx` desconectada |
| 8.2.4 — Mudanças nos requisitos | Atualizar documentação e comunicar mudanças | Parcial | `version` e `parent_agreement_id` em `internal_agreements`; sem notificação automática de mudança |

---

## Plano de Ação Priorizado

### Faixa 1 — Urgente (0–30 dias)

| # | Ação | Responsável Sugerido | Impacto |
|---|------|---------------------|---------|
| 1 | Conectar `OuvidoriaClientes.tsx` ao `customerComplaints.ts` — remover `mockComplaints: any[] = []` e implementar `useQuery` com `getCustomerComplaints()` | Front-end | Crítico |
| 2 | Cadastrar cláusulas 8.2.2 e 8.2.3 na tabela `iso_requirements` com campos `clause_number`, `clause_title`, `description` e `evidence_examples` para habilitar referência no módulo de auditoria interna | Qualidade | Major |
| 3 | Adicionar template de auditoria para cláusulas 8.2.x em `src/data/isoTemplates.ts` com perguntas para as fases pré-venda, durante e pós-venda | Qualidade | Major |

### Faixa 2 — Médio Prazo (30–90 dias)

| # | Ação | Responsável Sugerido | Impacto |
|---|------|---------------------|---------|
| 4 | Criar tabela `customer_requirement_specs` com campos: `agreement_id`, `phase` (pré_venda/execução/pós_venda), `requirement_type` (declarado/implícito/regulatório/organizacional), `description`, `acceptance_criteria`, `status`, `recorded_by`, `recorded_at` | Back-end | Crítico |
| 5 | Desenvolver componente de levantamento de requisitos pré-venda integrado ao fluxo de `internal_agreements` — checklist estruturado em 4 categorias (a, b, c, d de 8.2.2) obrigatório antes da criação do acordo | Produto | Crítico |
| 6 | Generalizar `stakeholderRequirements.ts` — remover hardcode de `iso_clause: "4.2"` (linha 322) e permitir associar requisitos a cláusulas 8.2.x, habilitando reuso do módulo para requisitos de clientes específicos | Back-end | Major |

### Faixa 3 — Estrutural (90–180 dias)

| # | Ação | Responsável Sugerido | Impacto |
|---|------|---------------------|---------|
| 7 | Implementar dashboard de "Controle de Requisitos por Pedido" com três abas — Pré-Venda (levantamento), Durante (monitoramento de entrega), Pós-Venda (satisfação + reclamações) — integrando `customer_requirement_specs`, `satisfactionSurveys.ts` e `customerComplaints.ts` | Produto + Front-end | Crítico |
| 8 | Criar gatilho automático de revisão de requisitos quando `deliverables` ou `scope` de `internal_agreements` é atualizado — notificar responsável para revisar impacto e registrar mudança em `customer_requirement_specs` com `phase: "execução"` | Back-end | Major |
| 9 | Integrar `satisfactionSurveys.ts` com `internal_agreements` — ao encerrar um acordo, disparar automaticamente pesquisa de satisfação vinculada ao `agreement_id` para rastrear atendimento de requisitos na fase pós-venda | Back-end | Minor |

---

## Guia de Validação E2E

Para verificar conformidade com 8.2.2 (controle de requisitos ao longo do ciclo de venda) após implementação:

1. **Pré-venda:** Acesse criação de novo acordo interno → verifique que sistema exibe checklist de levantamento de requisitos nas categorias (a) declarados, (b) implícitos, (c) regulatórios, (d) organizacionais. Confirme que todos são obrigatórios antes de salvar.
2. **Durante:** Abra acordo em status "Ativo" → verifique aba de "Monitoramento de Requisitos" com status por item e possibilidade de registrar desvio.
3. **Pós-venda:** Encerre um acordo → confirme disparo automático de pesquisa de satisfação vinculada ao acordo; verifique registro de reclamação gerado na `OuvidoriaClientes` (não mais mock).
4. **Mudança de requisito:** Edite `scope` de acordo aprovado → confirme que sistema registra nova versão e notifica responsável.
5. **Auditoria interna:** Execute checklist da cláusula 8.2.2 em `isoTemplates` → confirme cobertura das três fases e quatro categorias de requisito.

---

## Conclusão

O Daton ESG Insight não possui um processo formal e rastreável de levantamento e controle de requisitos de produtos/serviços ao longo do ciclo de venda conforme exigido pelo item 8.2.2 da ISO 9001:2015. O sistema dispõe de peças isoladas (acordos com escopo, pesquisas de satisfação, reclamações de clientes), mas essas peças não estão integradas em um fluxo coerente de três fases (pré-venda, durante, pós-venda) e a principal interface de captura de feedback pós-entrega (`OuvidoriaClientes.tsx`) permanece inoperante. O score 2.4/5 reflete um sistema com boa infraestrutura de dados mas sem o processo formal que a norma exige para cada etapa do ciclo comercial.

| Dimensão | Status |
|----------|--------|
| Levantamento pré-venda (requisitos a, b, c, d) | Ausente como processo formal |
| Controle durante a execução | Ausente |
| Captura pós-venda (satisfação + reclamações) | Parcial (UI desconectada) |
| Versionamento de mudanças de requisitos | Parcial |
| Template de auditoria para 8.2.2 | Ausente |
| Rastreabilidade por pedido/acordo | Parcial (via `internal_agreements`) |
