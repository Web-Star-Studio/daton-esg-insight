# Resumo Executivo — Análise ISO 9001:2015 Item 8.4.1 (Homologação de Fornecedores)

**Norma:** ISO 9001:2015 — Item 8.4.1 (Controle de processos, produtos e serviços providos externamente — Generalidades / Qualificação de Fornecedores)
**Escopo da análise:** Procedimento de homologação/qualificação de fornecedores, critérios de avaliação documental e de desempenho, gestão de riscos de fornecimento
**Tipo de análise:** Tipo B — Conformidade do sistema/codebase (sem documento de validação externo)
**Data:** 2026-03-09

---

## Score de Confiança

**3.6 / 5 — Funcional com lacunas estruturais**

O sistema possui uma infraestrutura robusta para homologação de fornecedores, com dois eixos complementares de avaliação (AVA1 — documental e AVA2 — desempenho por critérios) plenamente funcionais. A lacuna principal está na ausência de análise de risco de fornecimento estruturada como critério formal de seleção/homologação, e na ausência de documento formal de procedimento de homologação em `docs/`.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|--------|------------------|------|------------|
| Cadastro de Fornecedores | `src/pages/SupplierRegistration.tsx` | 4.2 | Validação CNPJ/CPF, verificação de duplicidade, gestão de status com motivo |
| Categorias e Tipos de Fornecedor | `src/pages/SupplierCategoriesPage.tsx`, `src/pages/SupplierTypesPage.tsx` | 4.0 | Hierarquia categoria→tipo presente; ausência de campo de criticidade por tipo |
| Homologação (Qualificação Modal) | `src/components/SupplierQualificationModal.tsx` | 3.2 | Critérios hardcoded no frontend; resultado não persiste itens individualmente no banco |
| AVA1 — Avaliação Documental | `src/pages/SupplierDocumentEvaluationPage.tsx` | 4.5 | Snapshot histórico, threshold 90%, datas de vencimento, isenção com motivo — bem estruturado |
| AVA2 — Avaliação por Critérios | `src/pages/SupplierEvaluationCriteriaPage.tsx`, `src/pages/SupplierPerformanceEvaluationPage.tsx` | 4.0 | Critérios configuráveis com peso; mínimo de aprovação configurável; sem análise de risco explícita |
| Gestão de Falhas de Fornecimento | `src/services/supplierFailuresService.ts`, `src/services/supplierFailureConfigService.ts` | 4.2 | Severidade 4 níveis (low/medium/high/critical), pesos configuráveis, `getSuppliersAtRisk()` funcional |
| Documento Formal de Procedimento | `docs/` | 0.0 | Ausente — sem PSQ, POQ ou procedimento documentado de homologação |

---

## Top 5 Pontos Fortes

1. **AVA1 com snapshot imutável por avaliação** (`SupplierDocumentEvaluationPage.tsx` linhas 398–420): cada avaliação documental persiste `criteria_snapshot` em JSONB com o estado exato de cada documento (peso, arquivo, vencimento, isenção, status ATENDE/NAO_ATENDE) — garantindo rastreabilidade histórica irrestrita.

2. **Threshold de conformidade documental parametrizável** (`COMPLIANCE_THRESHOLD = 90` em `SupplierDocumentEvaluationPage.tsx` linha 58; coluna `compliance_threshold NUMERIC(5,2)` na migration `20260302183000`): o percentual mínimo de aprovação é configurável por empresa, com cálculo automático de `is_compliant` no banco.

3. **AVA2 com critérios ponderados configuráveis** (`supplierCriteriaService.ts` linhas 82–95, `SupplierEvaluationCriteriaPage.tsx`): empresa define critérios com pesos livres e ponto de corte mínimo para aprovação via `supplier_evaluation_config.minimum_approval_points`; resultado `is_approved` é calculado e persistido.

4. **Gestão de falhas com severidade graduada e automação de risco** (`supplierFailureConfigService.ts` linhas 68–89): pesos configuráveis por severidade (low/medium/high/critical), limite de falhas por período, bloqueio de reativação e `getSuppliersAtRisk()` identificando fornecedores próximos do limite — controle de risco pós-homologação.

5. **Tipos de fornecedor com documentação obrigatória por tipo** (`supplierManagementService.ts` — `getDocumentsForType()`): tabela `supplier_type_document_requirements` vincula documentos obrigatórios a cada tipo de fornecedor, com flag `is_mandatory`, permitindo que a avaliação AVA1 seja diferenciada por segmento de fornecimento.

---

## Top 5 Lacunas Críticas

1. **Ausência de campo de risco/criticidade por tipo de fornecedor** (Severidade: **Major**): nenhuma das tabelas `supplier_types`, `supplier_categories` ou `supplier_management` contém campo de classificação de risco (crítico/estratégico/não-crítico) ou de impacto. A norma exige que o grau de controle sobre fornecedores externos seja determinado conforme o risco potencial (8.4.1.a/b). A gestão de falhas classifica `severity` por evento, mas não existe uma classificação de risco cadastral do fornecedor que oriente a intensidade da homologação.

2. **Critérios de qualificação hardcoded no frontend sem persistência individual** (Severidade: **Major**): `SupplierQualificationModal.tsx` (linhas 29–78) define 8 critérios fixos (documentação legal, situação financeira, capacidade técnica, etc.) diretamente no código TypeScript. O resultado da qualificação é salvo apenas como texto concatenado no campo `notes` do fornecedor — sem registro estruturado de quais critérios foram atendidos. Isso torna impossível filtrar ou auditar fornecedores por critério específico.

3. **Ausência de documento formal de procedimento de homologação** (Severidade: **Major**): não há em `docs/` nenhum documento descrevendo o fluxo oficial de homologação (quando acionar AVA1, AVA2, quem aprova, prazo de validade da homologação, critérios mínimos para aprovação inicial vs. re-homologação). A ISO 9001:2015, 8.4.1 exige que a organização determine e aplique critérios para avaliação, seleção e re-avaliação de fornecedores externos.

4. **Sem processo formal de re-homologação periódica automatizada** (Severidade: **Minor**): `SupplierDocumentEvaluationPage.tsx` exige data de próxima avaliação obrigatória (linha 357), e o campo `next_evaluation_date` é persistido. No entanto, não há mecanismo de alerta/notificação automática quando essa data se aproxima ou vence — a re-homologação depende de ação manual do usuário.

5. **`qualifySupplier()` sobrescreve status sem histórico de versão** (Severidade: **Minor**): `supplierService.ts` linha 310–319 realiza `UPDATE` direto na tabela `suppliers` (campos `qualification_status` e `notes`) sem registrar a mudança em tabela de histórico. Auditores não conseguem reconstruir a cronologia de qualificações do mesmo fornecedor pela tabela `suppliers`.

---

## Cobertura por Sub-requisito (ISO 9001:2015, 8.4.1)

| Sub-requisito | Texto normativo (resumido) | Status | Evidência / Lacuna |
|---------------|---------------------------|--------|--------------------|
| 8.4.1 geral | Determinar controles sobre processos/produtos/serviços externos | Parcial | AVA1 + AVA2 cobrem; ausência de classificação de risco formal |
| 8.4.1.a | Garantir que não afete capacidade de entregar produtos conformes | Parcial | `supplier_failure_config` monitora pós-homologação; sem critério de risco pré-seleção |
| 8.4.1.b | Critérios para avaliação, seleção, monitoramento e re-avaliação | Parcial | AVA1 e AVA2 cobrem avaliação; sem procedimento formal de seleção e re-avaliação automática |
| 8.4.1.c | Manter informação documentada sobre avaliações | Parcial | Snapshots AVA1 persistidos; qualificação modal sem registro estruturado por critério |
| 8.4.1 — Risco | Considerar riscos de fornecimento na determinação dos controles | Nao atende | Sem campo `risk_level` no cadastro de fornecedor ou tipo |

---

## Plano de Ação Priorizado

### Faixa 1 — Curto Prazo (0–30 dias)

- **PA-01:** Adicionar campo `risk_level ENUM('critico','alto','medio','baixo')` à tabela `supplier_management` (ou `supplier_types`), com campo obrigatório no formulário de cadastro. Exibir no painel `SupplierEvaluations.tsx` como coluna filtrável. Impacta: 8.4.1.a, 8.4.1.b.

- **PA-02:** Migrar critérios hardcoded de `SupplierQualificationModal.tsx` para a tabela `supplier_evaluation_criteria` (já existente), aproveitando a infraestrutura AVA2. Persistir resultado por critério em `supplier_criteria_evaluation_items`. Impacta: 8.4.1.b, 8.4.1.c.

### Faixa 2 — Médio Prazo (30–90 dias)

- **PA-03:** Implementar tabela `supplier_qualification_history` com colunas `supplier_id`, `previous_status`, `new_status`, `changed_by`, `changed_at`, `justification` — inserir via trigger ou via service em cada chamada de `qualifySupplier()`. Impacta: 8.4.1.c.

- **PA-04:** Implementar alerta automático (e-mail ou notificação no painel) para avaliações com `next_evaluation_date` nos próximos 30 dias — pode usar Edge Function Supabase agendada. Impacta: 8.4.1.b.

### Faixa 3 — Longo Prazo (90+ dias)

- **PA-05:** Criar documento formal `docs/procedimentos/PSQ-FORN-001-homologacao-fornecedores.md` descrevendo: critérios de seleção inicial por nível de risco, fluxo AVA1→AVA2, responsáveis, periodicidade de re-avaliação, critérios de desqualificação. Impactar: conformidade com 8.4.1 geral.

---

## Guia de Validação E2E

Para validar manualmente a conformidade atual:

1. Acessar `/fornecedores/cadastro` — criar novo fornecedor PJ; verificar validação CNPJ e unicidade.
2. Vincular o fornecedor a um tipo via `/fornecedores/vinculacao/:id`.
3. Acessar `/fornecedores/avaliacoes` → "Avaliação Documental (AVA1)" → verificar se documentos obrigatórios do tipo aparecem corretamente.
4. Anexar documentos, preencher vencimentos, salvar avaliação; confirmar que `criteria_snapshot` é gerado.
5. Acessar "Avaliação de Desempenho (AVA2)" → verificar critérios ponderados, preencher ATENDE/NAO_ATENDE, salvar — confirmar `is_approved` calculado.
6. Acessar `SupplierQualificationModal` — verificar que resultado salvo é apenas texto no campo `notes` (lacuna PA-02).
7. Acessar `/fornecedores/falhas` — registrar falha crítica; verificar `getSuppliersAtRisk()` no dashboard.

---

## Conclusão

O módulo de homologação de fornecedores do Daton ESG Insight apresenta infraestrutura técnica **substancialmente avançada** para um sistema SaaS de gestão ESG: dois ciclos de avaliação complementares (AVA1 documental e AVA2 por critérios), snapshot histórico imutável, gestão de falhas com classificação de severidade e algoritmo de risco acumulado. Essas capacidades cobrem grande parte dos requisitos de 8.4.1.

As lacunas que impedem pontuação mais alta são estruturais: (a) ausência de campo de risco/criticidade no cadastro do fornecedor, impedindo que o nível de controle seja proporcional ao risco; (b) critérios de qualificação modal sem persistência granular; e (c) ausência de procedimento formal documentado. Nenhuma dessas lacunas representa problema de implementação complexo — todas são corrigíveis em 30–90 dias com as ações do plano proposto.
