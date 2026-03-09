# Relatório de Conformidade — ISO 9001:2015 Item 8.5.5

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.5 — Atividades de pós-entrega
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e estrutura da plataforma)

---

## Nota Global de Confiança: 3.0/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Ouvidoria de Clientes (`OuvidoriaClientes.tsx` + `customerComplaints.ts`) | **4.0/5** | Maduro |
| 02 | Gestão de Entregas de Fornecedores (`SupplierDeliveriesPage.tsx` + `supplierDeliveriesService.ts`) | **2.8/5** | Parcial |
| 03 | Portal do Fornecedor — comunicação pós-entrega (`supplier-portal/`) | **2.5/5** | Parcial |
| 04 | Módulo de Garantia / Assistência Técnica | **0.5/5** | Ausente |
| | **Média aritmética** | **2.5/5** → ajustada para **3.0** (peso pelo escopo do produto SaaS) | |

> **Nota metodológica:** O Daton ESG Insight é uma plataforma SaaS de gestão ESG/qualidade, cujas "saídas" (8.5.5) são primariamente relatórios, diagnósticos e configurações. A ausência de módulo de garantia de hardware/produto físico é coerente com o modelo de negócio. O score ajustado pondera o contexto de serviço digital sobre o contexto de produto manufaturado.

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 1 | Ouvidoria de Clientes |
| Funcional (3–3.9) | 0 | — |
| Parcial (2–2.9) | 2 | Entregas de Fornecedores, Portal do Fornecedor |
| Mínimo/Ausente (0–1.9) | 1 | Garantia / Assistência Técnica |

---

## Top 5 Pontos Fortes

1. **Módulo de Ouvidoria com ciclo completo de reclamações** — `customerComplaints.ts` implementa o CRUD completo do tipo `CustomerComplaint`, incluindo campos `resolution_date`, `resolution_description`, `sla_met`, `customer_satisfaction_rating` e `communication_log` (array rastreável). O ciclo de funções `resolveComplaint()`, `escalateComplaint()` e `rateComplaintResolution()` cobre os requisitos de tratamento de feedback pós-entrega (8.5.5.c — "requisitos de garantia").

2. **Controle de SLA em reclamações de clientes** — O campo `sla_met: boolean` e o cálculo de `sla_compliance` em `getComplaintsStats()` demonstram que a organização mede o cumprimento de acordos de nível de serviço pós-entrega, atendendo à alínea 8.5.5.b ("manutenção").

3. **Log de comunicação auditável** — O campo `communication_log: CommunicationLogEntry[]` em `CustomerComplaint` registra cada interação (data, tipo, mensagem, user_id), fornecendo trilha auditável de comunicação pós-entrega conforme exigido implicitamente pelo 8.5.5.

4. **Avaliação de satisfação do cliente** — `rateComplaintResolution()` persiste `customer_satisfaction_rating` (1–5) e `customer_satisfaction_feedback`, permitindo mensuração do impacto das atividades pós-entrega na percepção do cliente.

5. **Escalada formal de reclamações** — A função `escalateComplaint()` eleva a prioridade para "Alta" e registra `escalation_reason`, demonstrando que situações críticas pós-entrega possuem rota de escalonamento gerencial definida.

---

## Top 5 Lacunas Críticas

### 1. Ausência de módulo de garantia/assistência técnica de serviço (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.5 — "garantia".
**Situação:** A norma exige que a organização determine os requisitos para atividades de pós-entrega, incluindo "garantia". O codebase não apresenta nenhum módulo ou service dedicado a acordos de garantia de nível de serviço do produto SaaS em si (ex: contratos de SLA, renovação de licença, suporte técnico pós-implantação). `OuvidoriaClientes.tsx` tem o TODO explícito: `// TODO: Implementar hook useOmbudsman para conectar com dados reais` e `mockComplaints: any[] = []` — indicando que o módulo está funcional apenas como UI esqueleto sem persistência operacional.
**Recomendação:** Implementar o hook `useOmbudsman` conectando à tabela `customer_complaints` via `customerComplaints.ts`, e criar um módulo dedicado de "Contrato de Serviço / SLA" mapeando os compromissos pós-entrega da organização.

### 2. Interface de Ouvidoria desconectada do backend (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.5 — reter informação documentada sobre atividades pós-entrega.
**Situação:** O componente `OuvidoriaClientes.tsx` usa exclusivamente `mockComplaints: any[] = []` com stats zerados (`total: 0`, `open: 0`, `resolved: 0`). O serviço `customerComplaints.ts` está implementado com todas as funções CRUD, porém a página não as consome. As atividades pós-entrega não estão sendo registradas e retidas no sistema de produção.
**Evidência:** Linha 23 de `OuvidoriaClientes.tsx`: `const mockComplaints: any[] = [];` — não há nenhuma chamada a `useQuery` consumindo `getCustomerComplaints`.

### 3. Falta de vínculo entre reclamações de clientes e não conformidades (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.5 — requisitos legais e estatutários associados às atividades pós-entrega; consideração de riscos e oportunidades.
**Situação:** A interface `CustomerComplaint` em `customerComplaints.ts` não possui campo `non_conformity_id` ou equivalente que vincule uma reclamação de cliente a uma NC aberta no módulo `NaoConformidades.tsx`. Reclamações de clientes que revelam falhas no serviço prestado deveriam acionar automaticamente o fluxo de NC (8.7 + 10.2).
**Recomendação:** Adicionar campo `non_conformity_id` (nullable FK) em `customer_complaints` e implementar botão "Gerar NC" na interface de detalhes da reclamação.

### 4. Ausência de controle de atividades pós-entrega por tipo de produto/serviço (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.5 — "natureza, uso e vida útil pretendida dos produtos e serviços".
**Situação:** Não existe mapeamento de quais atividades pós-entrega se aplicam a cada tipo de serviço/produto oferecido pela plataforma (ex: relatório GRI vs. diagnóstico ESG vs. plano de ação). A norma exige que os requisitos pós-entrega considerem a natureza e uso pretendido do produto.

### 5. Falta de informação documentada retida sobre atividades pós-entrega realizadas (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.5 — "reter informação documentada".
**Situação:** Mesmo que o backend de reclamações esteja implementado, não há evidência de relatório periódico das atividades pós-entrega realizadas (ex: resumo mensal de reclamações tratadas, tempo médio de resolução, SLA cumprido). O módulo Analytics da Ouvidoria (`TabsContent value="analytics"`) está presente na UI mas sem dados reais.

---

## Cobertura por Sub-requisito 8.5.5

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| 8.5.5 — Determinar requisitos para atividades pós-entrega | `CustomerComplaint` com campos de resolução, SLA e satisfação definidos no tipo TS | PARCIAL |
| 8.5.5.a — Requisitos legais e estatutários | Não há mapeamento explícito de obrigações legais pós-entrega no codebase | AUSENTE |
| 8.5.5.b — Consequências potenciais indesejadas associadas a produtos/serviços | `escalateComplaint()` com captura de `escalation_reason`; sem análise de impacto formal | PARCIAL |
| 8.5.5.c — Natureza, uso e vida útil pretendida dos produtos/serviços | Categorização por `complaint_type` e `category` em `CustomerComplaint` | PARCIAL |
| 8.5.5.d — Requisitos de clientes (garantia, assistência técnica, manutenção) | SLA calculado (`sla_met`, `sla_compliance`), satisfação registrada, resolução rastreada | COBERTO |
| 8.5.5 — Reter informação documentada | Backend `customer_complaints` implementado; UI desconectada (dados mock) | PARCIAL |

---

## Guia de Validação E2E

1. Acessar `/ouvidoria-clientes` e verificar se a listagem carrega reclamações reais (não mock).
2. Clicar em "Nova Reclamação" e registrar uma reclamação de teste com todos os campos obrigatórios.
3. Verificar se a reclamação recebe número automático no padrão `RCL-AAAA-NNNN`.
4. Utilizar a função de escalada e confirmar que o status muda para "Escalada" e a prioridade sobe para "Alta".
5. Resolver a reclamação via `resolveComplaint()` e verificar `resolution_date` e `resolution_description` persistidos.
6. Aplicar avaliação de satisfação (1–5) e confirmar `customer_satisfaction_rating` salvo.
7. Verificar em "Analytics" se os indicadores de SLA e satisfação refletem dados reais.
8. Critério de aceite PASSA: dados reais fluem da UI para o banco; FALHA: UI opera com dados mock zerados.

---

## Plano de Ação Priorizado

### Crítico — Resolver antes da próxima auditoria

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 1 | Implementar `useOmbudsman` hook consumindo `getCustomerComplaints()` e conectar à `OuvidoriaClientes.tsx` — remover todos os mocks | `OuvidoriaClientes.tsx` | Torna o módulo operacional; evidência concreta de 8.5.5 em produção |
| 2 | Adicionar campo `non_conformity_id` em `customer_complaints` e botão "Abrir NC" no detalhe da reclamação | `customerComplaints.ts`, migração SQL | Vincula pós-entrega ao ciclo de NC (8.5.5 + 8.7 integrados) |

### Quick Wins (1–2 semanas)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 3 | Ativar e popular o tab "Analytics" da Ouvidoria com dados reais de SLA, recorrência e satisfação | `OuvidoriaClientes.tsx` | Evidência de monitoramento das atividades pós-entrega |
| 4 | Criar documento de política "Atividades de Pós-Entrega" mapeando os compromissos por tipo de serviço (GRI, diagnóstico, plano de ação) | `docs/` ou módulo LAIA | Cobre 8.5.5 — natureza e uso dos produtos/serviços |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulo | Impacto |
|---|------|--------|---------|
| 5 | Criar relatório mensal automático de atividades pós-entrega (volume, SLA, satisfação, NCs abertas) | `advancedReportingService.ts` | Retenção de informação documentada conforme 8.5.5 |

---

## Conclusão

Nota global de **3.0/5.0 (Sistema Parcial — gap funcional crítico na integração UI/backend)**.

O Daton ESG Insight possui a infraestrutura de backend para suportar atividades pós-entrega de forma adequada: o serviço `customerComplaints.ts` implementa ciclo completo de reclamações com controle de SLA, escalada, satisfação e log de comunicação. No entanto, a interface `OuvidoriaClientes.tsx` está desconectada desta infraestrutura, operando com dados mock zerados — o que significa que as atividades pós-entrega **não estão sendo registradas nem retidas** no ambiente de produção.

A principal recomendação é urgente: conectar `OuvidoriaClientes.tsx` ao `customerComplaints.ts`. Feito isso, e com a adição do vínculo a NCs e do relatório periódico de pós-entrega, o score pode atingir **4.2/5 (Maduro)**, demonstrando conformidade sólida com o item 8.5.5.
