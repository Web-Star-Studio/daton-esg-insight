# Resumo Executivo — Análise ISO 9001:2015 Item 8.2.2 e 8.2.3 (Análise Crítica da Capacidade)

**Norma:** ISO 9001:2015
**Item:** 8.2.2 — Determinação de requisitos relativos a produtos e serviços + 8.2.3 — Análise crítica dos requisitos relativos a produtos e serviços
**Tipo de análise:** Tipo B (Conformidade do Sistema — sem documento externo de validação)
**Data:** 2026-03-09
**Auditor:** Compliance Auditor IA

---

## Score de Confiança Global

**2.6 / 5 — Parcial**

O codebase evidencia infraestrutura de captura de requisitos de partes interessadas e de reclamações de clientes, bem como gestão de acordos internos. Porém, nenhum dos mecanismos implementados constitui um processo formal de **análise crítica da capacidade de atender a requisitos** (8.2.3) antes de assumir compromisso de fornecimento. O fluxo de levantamento de requisitos existe (8.2.2 parcialmente coberto), mas a etapa de revisão/confirmação de viabilidade antes da aceitação de pedido ou contrato (8.2.3) está ausente como processo estruturado.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|--------|-----------------|------|-----------|
| Reclamações de clientes | `src/services/customerComplaints.ts` | 3.5 | Estrutura completa (numeração, SLA, log de comunicação, satisfação), mas interface `OuvidoriaClientes.tsx` desconectada (`mockComplaints: any[] = []`) |
| Acordos Internos | `src/services/internalAgreements.ts` | 3.0 | Modelo com scope, deliverables, milestones e workflow de aprovação; ausente campo de análise crítica pré-aceitação |
| Pesquisas de Satisfação | `src/services/satisfactionSurveys.ts` | 3.2 | Coleta pós-entrega (NPS, rating, múltipla escolha); sem gatilho associado a pedido/contrato novo |
| Requisitos de Partes Interessadas | `src/services/stakeholderRequirements.ts` | 3.8 | Modelo robusto com ISO clause, status de atendimento, evidências e revisão periódica; voltado a 4.2, não a 8.2.2/8.2.3 |
| Formulários Customizados | `src/services/customForms.ts` | 2.5 | Suporta captura livre de requisitos via forms públicos, mas sem fluxo formal de análise crítica de viabilidade |
| Templates de Auditoria ISO | `src/data/isoTemplates.ts` | 1.5 | Templates existentes não cobrem cláusula 8.2 (apenas 4.x, 5.x e normas 14001/45001/39001) |
| Interface Ouvidoria | `src/pages/OuvidoriaClientes.tsx` | 1.0 | Totalmente desconectada: `mockComplaints: any[] = []` (linha 23) — dados reais não chegam à UI |

---

## Top 5 Pontos Fortes

1. **Modelo de dados robusto para reclamações** — `customer_complaints` (DB/tipos em `src/integrations/supabase/types.ts`, linhas 5469-5524) inclui `resolution_target_date`, `sla_met`, `communication_log`, `customer_satisfaction_rating` e escalonamento — base sólida para rastreabilidade pós-venda.

2. **Acordos internos com versionamento e escopo** — `internal_agreements` (DB Row, linha 13731 do types.ts) possui campos `scope`, `deliverables`, `milestones`, `approval_workflow`, `signatures` e controle de versão — infraestrutura que suporta análise crítica formal de contratos.

3. **Mecanismo de pesquisa de satisfação pós-entrega** — `satisfactionSurveys.ts` implementa pesquisas multi-tipo (NPS, rating, escala, texto livre) com analytics por questão, `target_audience` configurável e ciclo rascunho → ativo → finalizado, habilitando coleta sistemática de percepção do cliente.

4. **Rastreabilidade de requisitos de partes interessadas** — `stakeholderRequirements.ts` inclui `review_due_date`, `last_checked_at`, `source_reference`, campo `is_relevant_to_sgq`, evidências linkadas a documentos e KPIs de atendimento — padrão que pode ser estendido a requisitos específicos de clientes.

5. **Controle de SLA em reclamações** — campo `sla_met` booleano e `resolution_target_date` na tabela `customer_complaints` permitem monitorar cumprimento de prazo de resolução e calcular taxa de conformidade com SLA (`getComplaintsStats()` em `customerComplaints.ts`, linha 289).

---

## Top 5 Lacunas Críticas

1. **CRITICA — Ausência de processo formal de análise crítica pré-aceitação (8.2.3):** Nenhum componente, serviço ou tabela implementa um fluxo de revisão da capacidade de atender aos requisitos do cliente *antes* de assumir compromisso de fornecimento (aceitar pedido, assinar contrato ou emitir proposta). A ISO 9001:2015 exige que a organização analise criticamente se pode cumprir os requisitos antes de se comprometer — esse passo não existe no sistema.

2. **CRITICA — Interface `OuvidoriaClientes.tsx` desconectada:** A página principal de gestão de reclamações de clientes (`src/pages/OuvidoriaClientes.tsx`, linha 23) usa `mockComplaints: any[] = []` e `TODO: Implementar hook useOmbudsman para conectar com dados reais`. O serviço `customerComplaints.ts` existe, mas a UI não consome dados reais, tornando o módulo inoperante para fins de auditoria.

3. **MAJOR — Ausência de template de auditoria para 8.2 no sistema:** `src/data/isoTemplates.ts` cobre cláusulas 4.x, 5.x, 6.x (ISO 14001/45001/39001), mas não possui nenhum template para as cláusulas 8.1 a 8.7 da ISO 9001, incluindo 8.2.2 e 8.2.3. Auditores internos não têm roteiro sistemático para verificar conformidade com esses requisitos.

4. **MAJOR — `internal_agreements` sem campo de análise crítica de viabilidade:** A tabela `internal_agreements` possui `scope`, `deliverables` e `approval_workflow`, mas não há campo estruturado para registrar a análise de capacidade (ex.: `capacity_review_result`, `capacity_review_notes`, `reviewed_by`) antes da aprovação do acordo. O fluxo de aprovação registra apenas assinaturas digitais, não a análise de viabilidade técnica ou operacional.

5. **MINOR — `stakeholderRequirements.ts` hardcoded para 4.2:** No serviço, o método `createStakeholderRequirement` fixa `iso_standard: "ISO_9001"` e `iso_clause: "4.2"` (linha 321-322 de `stakeholderRequirements.ts`) para todos os requisitos criados. Isso impede usar o mesmo serviço para registrar requisitos específicos de clientes em contexto 8.2.2, limitando a reutilização do módulo.

---

## Cobertura por Sub-requisito

| Sub-requisito | Descrição | Status | Evidência / Lacuna |
|--------------|-----------|--------|--------------------|
| 8.2.2 — Determinar requisitos de produtos/serviços | Definir requisitos legais, regulatórios e do cliente | Parcial | `stakeholderRequirements.ts` cobre partes interessadas genéricas; sem módulo específico para requisitos de produto/serviço pré-venda |
| 8.2.2.a — Requisitos declarados pelo cliente | Capturar o que o cliente especificou | Parcial | `internal_agreements.scope` e `deliverables` capturam escopo; `customForms.ts` permite captura livre; sem estrutura formal de especificação de requisitos de cliente |
| 8.2.2.b — Requisitos não declarados mas necessários | Identificar requisitos implícitos | Não verificável | Nenhum processo ou campo específico identificado no codebase |
| 8.2.2.c — Requisitos regulatórios aplicáveis ao produto | Mapear obrigações legais do produto/serviço | Parcial | `is_legal_requirement` em `stakeholderRequirements.ts`; sem link explícito a produto/serviço específico |
| 8.2.2.d — Requisitos adicionais da organização | Requisitos internos além do especificado | Não verificável | Não identificado |
| 8.2.3 — Analisar criticamente antes de comprometer | Revisar capacidade de atendimento pré-aceitação | Ausente | Nenhum fluxo de análise crítica pré-aceitação encontrado |
| 8.2.3.a — Confirmar requisitos antes de fornecimento | Assegurar que organização pode cumprir | Ausente | Não implementado |
| 8.2.3.b — Resolver diferenças entre proposta e pedido | Tratar discrepâncias antes de aceitar | Ausente | Nenhum mecanismo de resolução de divergências identificado |
| 8.2.3.c — Confirmar requisitos de cliente sem contrato formal | Para pedidos não documentados | Ausente | Não implementado |
| 8.2.3 — Manter informação documentada da análise crítica | Registro das revisões realizadas | Ausente | Nenhuma tabela de análise crítica de pedidos/contratos |
| 8.2.4 — Mudanças nos requisitos | Atualizar documentação quando requisitos mudam | Parcial | Versionamento em `internal_agreements.version`; sem notificação automática de mudança de requisito ao responsável |

---

## Plano de Ação Priorizado

### Faixa 1 — Urgente (0–30 dias)

| # | Ação | Responsável Sugerido | Impacto |
|---|------|---------------------|---------|
| 1 | Conectar `OuvidoriaClientes.tsx` ao serviço `customerComplaints.ts` — substituir `mockComplaints: any[] = []` por hook real que chama `getCustomerComplaints()` | Front-end | Crítico |
| 2 | Criar tabela `customer_requirement_reviews` no banco para registrar análise crítica pré-aceitação (campos sugeridos: `agreement_id`, `requirement_description`, `capacity_confirmed`, `divergences_noted`, `reviewed_by`, `reviewed_at`) | Back-end | Crítico |
| 3 | Adicionar template de auditoria para ISO 9001:2015 cláusulas 8.2.2 e 8.2.3 em `src/data/isoTemplates.ts` | Qualidade | Major |

### Faixa 2 — Médio Prazo (30–90 dias)

| # | Ação | Responsável Sugerido | Impacto |
|---|------|---------------------|---------|
| 4 | Adicionar etapa de "Análise Crítica de Viabilidade" no fluxo de aprovação de `internal_agreements` — campo `capacity_review_result` (Aprovado/Aprovado com ressalvas/Reprovado) + `capacity_review_notes` obrigatório antes da transição para `Aprovado` | Back-end + Produto | Crítico |
| 5 | Generalizar `stakeholderRequirements.ts` para suportar cláusulas além de 4.2 — remover hardcode de `iso_clause: "4.2"` (linha 322) e permitir associação a requisitos de cliente em contexto 8.2.2 | Back-end | Major |
| 6 | Criar workflow pré-venda em `customForms.ts` para levantamento estruturado de requisitos de clientes (checklist: requisitos declarados, implícitos, legais, adicionais) com resultado salvo em nova tabela `customer_requirement_specs` | Produto | Major |

### Faixa 3 — Estrutural (90–180 dias)

| # | Ação | Responsável Sugerido | Impacto |
|---|------|---------------------|---------|
| 7 | Implementar módulo completo de "Análise Crítica de Pedidos/Contratos" integrado ao ciclo de `internal_agreements` — incluindo checklist de 8.2.2 (a, b, c, d), confirmação de capacidade (8.2.3.a), resolução de divergências (8.2.3.b) e registro de informação documentada conforme requerido | Produto + Qualidade | Crítico |
| 8 | Criar alerta automático de renegociação quando requisito de cliente muda — integrar com `notifications.ts` para notificar responsável pelo acordo quando `scope` ou `deliverables` de `internal_agreements` é atualizado | Back-end | Minor |

---

## Guia de Validação E2E

Para validar conformidade com 8.2.2 e 8.2.3 após implementação das ações:

1. Acesse Ouvidoria/Reclamações → confirme que reclamações reais aparecem (não lista vazia).
2. Crie um novo acordo interno (`internal_agreements`) → verifique se campo de análise crítica de viabilidade é exibido e obrigatório antes da aprovação.
3. Simule divergência de requisito (ex.: cliente solicita entrega em 5 dias, capacidade é 10 dias) → confirme que o sistema registra a divergência e requer resolução antes de aceitar.
4. Consulte `stakeholder_matrix_reviews` → confirme que existe ao menos uma revisão da matriz com referência à reunião de análise crítica da direção.
5. Execute auditoria interna com template 8.2 → confirme que template existe em `isoTemplates.ts` e cobre os sub-requisitos a, b, c, d de 8.2.2 e a, b, c de 8.2.3.

---

## Conclusão

O Daton ESG Insight possui infraestrutura de dados razoável para gestão de reclamações, acordos e pesquisas de satisfação, mas **não implementa o processo central exigido pelo item 8.2.3**: a análise crítica da capacidade de atender aos requisitos do cliente *antes* de assumir compromisso de fornecimento. Adicionalmente, a interface de Ouvidoria está completamente desconectada dos dados reais, comprometendo também a conformidade com 8.2.2 para captura e acompanhamento de requisitos durante e após a venda. O score 2.6/5 reflete um sistema que construiu as peças de dados mas não as conectou em um processo formal e auditável conforme a norma exige.

| Dimensão | Status |
|----------|--------|
| Levantamento de requisitos (8.2.2) | Parcial (infraestrutura presente, processo incompleto) |
| Análise crítica pré-aceitação (8.2.3) | Ausente |
| Registro de informação documentada | Parcial |
| Interface operacional de reclamações | Inoperante (dados mock) |
| Gestão de mudanças de requisitos (8.2.4) | Parcial |
