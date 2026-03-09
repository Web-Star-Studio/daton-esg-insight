# Resumo Executivo — Análise ISO 9001:2015 Item 8.4.3

**Norma:** ISO 9001:2015
**Item:** 8.4.3 — Informação para provedores externos (Requisitos de Aquisição/Contratação)
**Tipo de Análise:** Tipo B — Conformidade do Sistema (codebase)
**Data:** 2026-03-09
**Auditor:** Compliance Auditor Agent

---

## Score de Confiança: 3.2 / 5 — Funcional com Lacunas Estruturais

O sistema possui infraestrutura funcional para comunicação de requisitos aos fornecedores: contratos estruturados, portal do fornecedor com leituras obrigatórias e pesquisas, tipagem de documentos exigíveis por tipo de fornecedor, e qualificação com critérios explícitos. No entanto, a norma exige que os requisitos de aquisição sejam comunicados de forma completa e rastreável ao fornecedor — incluindo especificação de produtos/serviços, qualificação do pessoal, desempenho esperado e gestão do SGQ. O codebase não evidencia transmissão estruturada de requisitos técnicos por pedido/contrato específico, nem confirmação de recebimento e entendimento pelo fornecedor. O mecanismo de leituras obrigatórias (portal) cobre parcialmente os requisitos de capacitação, mas não os requisitos de fornecimento em si.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|---|---|---|---|
| Contratos de fornecedores | `src/services/supplierContracts.ts` | 3.5 | Captura contrato_type, terms_conditions, sla_requirements, payment_terms — ausente campo de requisitos técnicos detalhados |
| Tipagem e documentos obrigatórios | `supplierManagementService.ts` (RequiredDocument) | 4.0 | Lista documentos exigíveis por tipo de fornecedor — bom mecanismo para 8.4.3.a |
| Portal do fornecedor (leituras e pesquisas) | `src/services/supplierPortalService.ts` | 3.5 | Leituras obrigatórias com confirmação de IP e timestamp — cobre 8.4.3.f parcialmente |
| Qualificação (modal) | `src/components/SupplierQualificationModal.tsx` | 3.0 | Critérios hardcoded no frontend — sem persistência estruturada por fornecedor |
| Registro de fornecimentos (ALX) | `src/pages/SupplierDeliveriesPage.tsx` | 2.5 | description livre, reference_number opcional — sem requisito técnico por entrega |
| Modal de contrato (UI) | `src/components/SupplierContractModal.tsx` | 2.5 | Campos terms_conditions e sla_requirements não aparecem no formulário de criação |

---

## Top 5 Pontos Fortes

1. **Documentos obrigatórios por tipagem (`RequiredDocument` + `supplier_document_submissions`):** A configuração de documentos exigíveis vinculada ao tipo do fornecedor é um mecanismo concreto de transmissão de requisitos (8.4.3.a — especificação do que será fornecido indiretamente via documentação compulsória).

2. **Contratos com SLA e condições (`supplierContracts.ts`, campos `sla_requirements: any`, `terms_conditions`, `payment_terms`):** A estrutura de dados do contrato permite capturar requisitos de desempenho e condições formais. Campo `contract_type` com valores controlados ("Fornecimento", "Serviços", "Manutenção", "Consultoria", "Obra") provê categorização.

3. **Portal do fornecedor com leituras obrigatórias e confirmação (`supplierPortalService.ts`, tabela `supplier_reading_confirmations`):** O fornecedor acessa e confirma leitura de materiais, com registro de `confirmed_at` e `ip_address`. Cobre o requisito de comunicação de processos (8.4.3.f) para materiais instrucionais.

4. **Lógica de qualificação com critérios obrigatórios (`SupplierQualificationModal.tsx`):** Critérios explícitos (Documentação Legal, Capacidade Técnica, Sistema da Qualidade, Gestão Ambiental, Segurança do Trabalho) são verificados antes de qualificar o fornecedor — reflete parte da exigência de 8.4.3.e (qualificação de pessoal).

5. **Alertas de vencimento integrados (`SupplierAlertsPage.tsx`, `supplier_expiration_alerts`):** O sistema monitora vencimento de documentos dos fornecedores e dispara alertas, garantindo que os requisitos de documentação permaneçam válidos durante o fornecimento.

---

## Top 5 Lacunas Críticas

1. **Lacuna Crítica — 8.4.3.a (especificação de produtos/serviços): Sem campo estruturado de requisitos técnicos por contrato.**
   O modal de criação de contrato (`SupplierContractModal.tsx`) só captura número, título, tipo, valor, datas e descrição livre. Os campos `sla_requirements` e `terms_conditions` existem no schema (`supplierContracts.ts` linhas 19 e 39) mas não são expostos no formulário de criação. A norma exige que o fornecedor receba a descrição completa do produto/serviço a ser fornecido — isso não está estruturado.

2. **Lacuna Crítica — 8.4.3.b (aprovação de produtos, processos, equipamentos): Sem workflow de aprovação prévia ao início do fornecimento.**
   Não há no codebase uma etapa formal de aprovação técnica antes do primeiro fornecimento. O status de `supplier_management` é 'Ativo'/'Inativo'/'Suspenso', mas não há campo de "pré-aprovação de fornecimento" ou "aprovação de amostra/piloto". A tabela `supplier_deliveries` aceita qualquer fornecedor com status Ativo sem validação de requisitos específicos da entrega.

3. **Lacuna Crítica — 8.4.3.c (competência do pessoal, incluindo qualificações): Critérios de qualificação de pessoal são hardcoded no frontend e não persistidos individualmente por fornecedor.**
   `SupplierQualificationModal.tsx` (linha 29, `QUALIFICATION_CRITERIA`) define 8 critérios fixos no código TypeScript, serializa o resultado como string de texto livre em `qualificationNotes` e chama `qualifySupplier()`. Não há tabela dedicada para os resultados por critério, impedindo auditoria futura e rastreabilidade.

4. **Lacuna Crítica — 8.4.3.d (interações com o SGQ do fornecedor): Sem campo ou processo de comunicação de requisitos do SGQ.**
   A norma exige que a organização comunique suas interações com o sistema de gestão da qualidade do fornecedor externo. Não há no codebase evidência de transmissão de procedimentos, normas internas, ou requisitos de gestão que o fornecedor deve seguir além dos documentos de leitura obrigatória do portal — que são genéricos e não vinculados ao contrato específico.

5. **Lacuna Maior — 8.4.3 (confirmação de adequação antes da comunicação): Sem validação de suficiência dos requisitos antes de envio ao fornecedor.**
   A norma exige que a organização "assegure a adequação dos requisitos especificados antes de comunicá-los ao fornecedor externo". Não há step de revisão/aprovação interna dos termos do contrato antes de enviá-lo ao fornecedor. `createSupplierContract()` persiste diretamente sem workflow de aprovação prévia.

---

## Cobertura por Sub-requisito

| Sub-requisito | Descricao | Status | Evidencia |
|---|---|---|---|
| 8.4.3.a | Descrição de produtos/serviços a serem fornecidos | Parcial | Campos livres no contrato (description, terms_conditions) — sem estrutura obrigatória |
| 8.4.3.b | Aprovação de produtos, processos, equipamentos, métodos de liberação | Ausente | Sem workflow de pré-aprovação técnica de fornecimento |
| 8.4.3.c | Competência, incluindo qualificações requeridas | Parcial | `SupplierQualificationModal.tsx` — critérios verificados, mas resultados não persistidos por critério |
| 8.4.3.d | Interações com o SGQ do fornecedor externo | Ausente | Sem campo/processo para requisitos de gestão da qualidade do fornecedor |
| 8.4.3.e | Controle e monitoramento do desempenho do fornecedor | Funcional | `supplier_evaluation_criteria` + `supplier_criteria_evaluations` — robusto |
| 8.4.3.f | Atividades de verificação/validação que a organização ou cliente pretende executar | Parcial | Leituras obrigatórias no portal + AVA1/AVA2, mas sem vinculação contratual formal |
| Verificação de adequação pré-comunicação | Assegurar suficiência antes de comunicar | Ausente | Sem step de revisão interna antes de criar contrato |

---

## Plano de Ação Priorizado

### Faixa 1 — Ações Imediatas (0–30 dias)

**PA-843-01:** Expor campos `sla_requirements` e `terms_conditions` no formulário de criação de contrato (`SupplierContractModal.tsx`), tornando `terms_conditions` obrigatório para contratos de tipo "Fornecimento" e "Serviços".
**Impacto:** 8.4.3.a | **Severidade:** Maior

**PA-843-02:** Criar tabela `supplier_qualification_criteria_results` para persistir cada critério de qualificação individualmente (não como string concatenada). Migrar `SupplierQualificationModal.tsx` para inserir linhas por critério.
**Impacto:** 8.4.3.c | **Severidade:** Crítica

### Faixa 2 — Ações de Curto Prazo (30–90 dias)

**PA-843-03:** Adicionar etapa de "revisão interna" ao fluxo de criação de contrato: contrato criado em rascunho, aprovado por responsável, depois comunicado ao fornecedor. Replicar padrão de `document_approvals.status`.
**Impacto:** Verificação de adequação pré-comunicação | **Severidade:** Maior

**PA-843-04:** Criar campo `technical_requirements` (JSON estruturado) em `supplier_contracts` para capturar: especificação técnica, normas aplicáveis, requisitos de rastreabilidade, critérios de aceitação. Expor no modal com formulário assistido.
**Impacto:** 8.4.3.a, 8.4.3.d | **Severidade:** Crítica

**PA-843-05:** Criar seção "Requisitos do SGQ" no portal do fornecedor, vinculando ao contrato específico, onde o fornecedor confirma ciência dos requisitos de gestão (ex: procedimentos obrigatórios, normas a seguir). Registrar confirmação com data, versão do documento e ID do contrato.
**Impacto:** 8.4.3.d, 8.4.3.f | **Severidade:** Maior

### Faixa 3 — Ações Estruturais (90–180 dias)

**PA-843-06:** Implementar workflow de aprovação de amostra/piloto antes do primeiro fornecimento: campo `pre_supply_approval_status` em `supplier_deliveries` (valores: 'Não Requerido', 'Pendente', 'Aprovado', 'Reprovado') com `pre_supply_approval_by` e `pre_supply_approval_date`.
**Impacto:** 8.4.3.b | **Severidade:** Maior

**PA-843-07:** Integrar leituras obrigatórias do portal com contratos específicos: tabela `supplier_contract_readings` ligando `contract_id` → `reading_id`, para que requisitos específicos de um contrato sejam formalizados como leituras obrigatórias com confirmação rastreável.
**Impacto:** 8.4.3.f | **Severidade:** Menor

---

## Guia de Validação E2E

Para verificar se os requisitos de 8.4.3 estão sendo atendidos, um auditor deve:

1. Selecionar um fornecedor ativo e navegar em `/fornecedores/contratos` — verificar se `terms_conditions` está preenchido com descrição técnica e se `sla_requirements` contém critérios de desempenho mensuráveis.
2. Acessar a tela de qualificação do fornecedor e verificar se há registro individual por critério (não apenas texto livre) na tabela `supplier_qualification_criteria_results` (quando implementada).
3. No portal do fornecedor, verificar se há leituras obrigatórias vinculadas ao contrato e se foram confirmadas com data anterior ao início do fornecimento.
4. Verificar em `supplier_deliveries` se há campo de pré-aprovação preenchido para fornecedores que exigem aprovação de amostra.

---

## Conclusão

**Score: 3.2/5 — Funcional com Lacunas Estruturais**

O sistema Daton ESG Insight possui mecanismos funcionais de gestão de fornecedores que cobrem parcialmente o item 8.4.3 — em especial o monitoramento de documentação e desempenho durante o fornecimento. No entanto, o núcleo normativo do item (transmissão estruturada, completa e rastreável dos requisitos de aquisição ao fornecedor antes do início do fornecimento) apresenta lacunas críticas: campos de requisitos técnicos ausentes no formulário de contrato, critérios de qualificação de pessoal não persistidos por linha, ausência de pré-aprovação técnica e ausência de processo formal de comunicação do SGQ. Para atingir conformidade plena, as ações PA-843-01 a PA-843-05 são prioritárias.

**Itens MUST não atendidos:** 8.4.3.a (parcial), 8.4.3.b (ausente), 8.4.3.c (parcial), 8.4.3.d (ausente), verificação de adequação pré-comunicação (ausente).
**Itens MUST atendidos:** 8.4.3.e (funcional via AVA1/AVA2), 8.4.3.f (parcial via portal).
