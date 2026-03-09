# Resumo Executivo — Análise ISO 9001:2015 Itens 8.1 e 8.5 (Gestão de Estoques de Saída)

**Item normativo:** ISO 9001:2015 — 8.1 (Planejamento e Controle Operacional) e 8.5 (Produção e Provisão de Serviço) — foco em gestão de estoques de saídas e requisitos de entrega e pós-entrega
**Tipo de análise:** Tipo B — Conformidade do Sistema (análise de codebase sem documento de validação externo)
**Data:** 2026-03-09
**Analista:** Compliance Auditor — Daton ESG Insight
**Score de Confiança:** 2.5 / 5 — Parcial

---

## Nota Global

**2.5 / 5 — Conformidade Parcial**

O Daton ESG Insight é uma plataforma SaaS de gestão ESG. Nesse contexto, o "produto acabado" (saída) é o **serviço de software entregue ao cliente** — funcionalidades ativas, relatórios gerados, dados processados e exportados. Não há estoque físico. A aplicação da cláusula 8.1 e 8.5 ao gerenciamento de "estoques de saída" deve ser interpretada sob a perspectiva de:

1. Controle das saídas do serviço: relatórios GRI, GHG, integrados; dados exportados; entregáveis documentais aos clientes.
2. Requisitos de entrega: disponibilidade e integridade das funcionalidades entregues, SLA de acesso, controle de versão/release.
3. Requisitos de pós-entrega: suporte pós-entrega, captura de feedback, tratamento de reclamações.

O sistema demonstra **infraestrutura robusta de controle de saídas de dados e relatórios**, incluindo módulos de geração de relatórios GRI/GHG com rastreabilidade, exportação controlada de dados e gestão de documentos (GED) com versionamento imutável. Entretanto, há lacunas significativas no gerenciamento formal de SLA de entrega ao cliente, no módulo de pós-entrega (Ouvidoria desconectada de dados reais), e ausência de definição explícita dos critérios de "pronto para entrega" para as saídas de serviço.

---

## Tabela de Módulos

| Módulo / Processo | Cobertura Normativa | Score | Observação |
|---|---|---|---|
| Geração de relatórios GRI/GHG/Integrados | 8.1, 8.5.1 | 3.5/5 | Relatórios com status, aprovação e lock parcial |
| Exportação de dados (dataExport.ts) | 8.1, 8.5.1 | 3.0/5 | Exportação funcional; sem log de entrega por cliente |
| GED — versionamento de documentos | 8.5.1, 8.5.2 | 4.5/5 | content_hash, is_current, changes_summary obrigatório |
| Entrega de fornecimentos (supplier_deliveries) | 8.1, 8.5.5 | 2.5/5 | Status 3 estados; reference_number opcional; sem inspeção |
| Módulo de pós-entrega (OuvidoriaClientes.tsx) | 8.5.5 | 1.0/5 | mockComplaints desconectado; botão sem handler |
| customerComplaints.ts | 8.5.5 | 3.5/5 | Serviço funcional; nunca invocado pela UI |
| satisfactionSurveys.ts | 8.5.5 | 3.0/5 | Estrutura completa; sem rota exposta |
| Feature flags / enabledModules.ts | 8.1 | 3.5/5 | Rollout controlado de funcionalidades |
| CI/CD (.github/workflows/ci.yml) | 8.1 | 2.0/5 | lint com `|| true`; sem portão de qualidade de saída |
| Dashboard de KPIs de qualidade | 8.5.1 | 2.5/5 | Dados reais de NCs; métricas de saída hardcoded |

---

## Top 5 Pontos Fortes

1. **GED com versionamento imutável:** `documentVersionsService.createVersion()` em `src/services/gedDocuments.ts` exige `changes_summary` obrigatório, registra `content_hash`, `is_current` e `created_by_user_id` — rastreabilidade completa das versões de saídas documentais (relatórios, procedimentos).

2. **Relatórios GRI/GHG com ciclo de aprovação:** `src/services/griReports.ts` e `src/services/integratedReports.ts` registram status e histórico dos relatórios gerados, suportando a noção de "saída controlada" antes de sua divulgação ao cliente.

3. **Feature flags centralizadas (enabledModules.ts):** `src/config/enabledModules.ts` permite habilitar/desabilitar módulos de forma controlada sem deletar código, operacionalizando um controle de rollout de funcionalidades entregues ao cliente.

4. **customerComplaints.ts com rastreabilidade completa:** `src/services/customerComplaints.ts` implementa numeração automática `RCL-YYYY-NNNN`, `communication_log` imutável append-only, SLA (`resolution_target_date`, `sla_met`), escalamento com log, e rating de satisfação pós-resolução — infraestrutura de pós-entrega adequada para 8.5.5.

5. **Document Master List com código estruturado:** `masterListService` em `src/services/gedDocuments.ts` valida códigos no padrão `PSG-XX / IT-XX.YY / RG-XX.ZZ` (regex `MASTER_LIST_CODE_REGEX`), `effective_date`, `review_date` e `distribution_list` — controle de quais saídas documentais são válidas e para quem foram distribuídas.

---

## Top 5 Lacunas Críticas

1. **OuvidoriaClientes.tsx completamente desconectada da infra de pós-entrega** (Severidade: **Crítica** — 8.5.5): `src/pages/OuvidoriaClientes.tsx` linha 23 define `mockComplaints: any[] = []` — dados nunca carregados do banco. O botão "Nova Reclamação" não possui handler. `customerComplaints.ts` (serviço funcional com CRUD completo) não é invocado. Toda a gestão de pós-entrega ao cliente é inacessível pela UI real.

2. **Ausência de definição formal de critérios de "pronto para entrega" de saídas de serviço** (Severidade: **Maior** — 8.1 e 8.5.1.a): Não existe documento formal em `docs/` nem tabela no banco que defina quais critérios uma funcionalidade ou relatório deve atender antes de ser disponibilizado ao cliente (equivalente ao conceito de "releasing" para produção). O lint com `|| true` no CI (`ci.yml` linha 27) significa que saídas com erros de código podem ser entregues.

3. **reference_number opcional em supplier_deliveries** (Severidade: **Maior** — 8.1 e 8.5.2): `src/services/supplierDeliveriesService.ts` linha 11 define `reference_number: string | null`. O formulário de criação (`SupplierDeliveriesPage.tsx` linha 68) inicializa como string vazia sem validação obrigatória. Fornecimentos registrados sem número de referência (NF/OS) comprometem a rastreabilidade de saídas recebidas de fornecedores, que impactam o serviço entregue ao cliente.

4. **satisfactionSurveys.ts funcional sem rota ou UI exposta** (Severidade: **Maior** — 8.5.5): `src/services/satisfactionSurveys.ts` implementa CRUD completo de pesquisas de satisfação contra tabela `satisfaction_surveys` real, mas não existe rota mapeada no `src/App.tsx` nem item de menu ativo para que o usuário interno acesse e execute pesquisas com clientes. A captura sistemática de feedback pós-entrega permanece inoperante.

5. **Sem SLA formal de entrega e disponibilidade do serviço SaaS** (Severidade: **Maior** — 8.1 e 8.5.5): Não há tabela `service_agreements`, `sla_configurations` ou equivalente no banco de dados que formalize os requisitos de entrega ao cliente (disponibilidade %, tempo de resposta, frequência de atualizações). Os `internal_agreements` cobrem acordos entre empresas, mas não definem o SLA do próprio serviço Daton para o cliente-tenant.

---

## Cobertura por Sub-requisito

### 8.1 — Planejamento e controle operacional

| Sub-requisito | Texto normativo | Status | Evidência / Gap |
|---|---|---|---|
| 8.1.a | Determinar requisitos para produtos e serviços | Parcial | `internal_agreements` com scope e deliverables; sem tabela de requisitos de serviço por tenant |
| 8.1.b | Estabelecer critérios para processos e aceitação | Parcial | feature flags habilitam/desabilitam módulos; sem critérios formais de aceite de funcionalidade |
| 8.1.c | Determinar recursos necessários | Parcial | CI/CD presente; lint com `|| true` — pipeline não garante qualidade da saída |
| 8.1.d | Implementar controle conforme critérios | Parcial | GED com aprovação; relatórios com status; sem controle de release formal |
| 8.1.e | Determinar, manter e reter informação documentada | Parcial | Audit trail em GED; sem log de entrega de versões por tenant |

### 8.5.1 — Controle de produção e provisão de serviço

| Sub-requisito | Status | Evidência / Gap |
|---|---|---|
| 8.5.1.a — Informações sobre características | Parcial | Relatórios GRI/GHG com metadados; sem ficha de especificação por funcionalidade |
| 8.5.1.b — Critérios de controle de processo | Parcial | Feature flags; CI/CD; lint não bloqueia |
| 8.5.1.c — Uso de infraestrutura adequada | Atendido | Supabase com RLS; 100% das tabelas com controle de acesso |
| 8.5.1.d — Pessoal competente | Não verificável | Sem evidência de política de onboarding de desenvolvedores no codebase |
| 8.5.1.e — Validação de processos | Parcial | Tests E2E existem mas são superficiais; sem validação formal de saídas de serviço |
| 8.5.1.f — Ações de prevenção de erros humanos | Parcial | Validação Zod; confirmações de exclusão; lint parcialmente ativo |
| 8.5.1.g — Atividades de liberação e entrega | Não atendido | Sem processo de release gate; sem critério de "pronto para entrega" ao tenant |

### 8.5.2 — Identificação e rastreabilidade

| Sub-requisito | Status | Evidência / Gap |
|---|---|---|
| Identificação de saídas | Parcial | Relatórios com ID e status; supplier_deliveries sem reference_number obrigatório |
| Rastreabilidade ao longo da produção | Atendido (GED) | document_audit_trail com timestamps, user_id, old/new values |
| Manutenção de informação documentada | Atendido | Versionamento imutável com is_current e content_hash |

### 8.5.5 — Requisitos de pós-entrega

| Sub-requisito | Texto normativo | Status | Evidência / Gap |
|---|---|---|
| 8.5.5.a — Requisitos legais | Não verificável | Sem evidência de mapeamento de obrigações legais de suporte pós-entrega |
| 8.5.5.b — Consequências indesejadas | Não atendido | Sem análise formal de riscos de pós-entrega; sem política de rollback documentada |
| 8.5.5.c — Natureza, uso e vida útil | Não atendido | Sem SLA de disponibilidade do serviço SaaS por tenant |
| 8.5.5.d — Requisitos do cliente | Não atendido | OuvidoriaClientes.tsx desconectada; satisfactionSurveys sem UI ativa |
| 8.5.5.e — Retroalimentação do cliente | Parcial | customerComplaints.ts funcional mas inacessível; rating pós-resolução implementado no serviço |

---

## Plano de Ação Priorizado

### Faixa 1 — Imediato (0 a 30 dias)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| A1 | Conectar `OuvidoriaClientes.tsx` ao `customerComplaints.ts`: substituir `mockComplaints: any[] = []` por `useQuery` invocando `getCustomerComplaints()`; implementar handler do botão "Nova Reclamação" | Crítico — 8.5.5 | Baixo (1-2 dias dev) |
| A2 | Tornar `reference_number` obrigatório em `supplier_deliveries`: adicionar `NOT NULL` na migration e validação no formulário de `SupplierDeliveriesPage.tsx` | Maior — 8.1, 8.5.2 | Baixo (1 dia) |
| A3 | Corrigir lint no CI: remover `|| true` de `npm run lint` em `.github/workflows/ci.yml` linha 27 e tratar os erros bloqueantes | Maior — 8.1 | Baixo (2-4h) |

### Faixa 2 — Curto Prazo (30 a 90 dias)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| B1 | Expor `satisfactionSurveys.ts` via rota e menu ativo: criar página `SatisfactionSurveysPage.tsx` e registrar rota em `App.tsx` | Maior — 8.5.5 | Médio (3-5 dias) |
| B2 | Criar documento formal de "critérios de aceite de funcionalidade" em `docs/processes/` e tabela `feature_release_criteria` no banco, vinculando feature flags ao critério de aprovação | Maior — 8.1.b | Médio (5 dias) |
| B3 | Implementar SLA de disponibilidade por tenant: tabela `tenant_sla_agreements` com campos `uptime_target_percent`, `response_time_sla_ms`, `support_response_hours`; vincular ao `internal_agreements` existente | Maior — 8.5.5.c | Médio-alto (1-2 semanas) |

### Faixa 3 — Médio Prazo (90 a 180 dias)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| C1 | Implementar log de entrega de versões por tenant: tabela `service_deliveries` registrando versão lançada, data, tenant impactado, status de ativação e log de rollback | Maior — 8.1.d, 8.5.1.g | Alto |
| C2 | Criar processo formal de release gate: checklist de validação de saída integrado ao CI/CD antes do deploy para produção (testes E2E obrigatórios, cobertura mínima, aprovação de responsável) | Maior — 8.1 | Alto |
| C3 | Dashboard de pós-entrega integrado: métricas reais de satisfação de clientes (de `customer_complaints` e `satisfaction_surveys`) no dashboard principal, substituindo dados hardcoded | Moderado — 8.5.5 | Médio |

---

## Guia de Validação E2E

Para verificar conformidade com 8.1 e 8.5 (estoques de saída):

1. **Rastreabilidade de saídas documentais:** Criar um relatório GRI, aprovar, verificar que `document_audit_trail` registra todas as ações com `user_id` e `timestamp`.
2. **Controle de entrega de fornecimentos:** Registrar um fornecimento em `SupplierDeliveriesPage.tsx` sem `reference_number` e verificar se o sistema bloqueia (atualmente: não bloqueia — gap confirmado).
3. **Pós-entrega — reclamações:** Acessar `OuvidoriaClientes.tsx` e verificar que a lista de reclamações carrega dados reais (atualmente: lista vazia — gap confirmado).
4. **Pesquisa de satisfação:** Acessar rota de satisfactionSurveys no menu (atualmente: rota inexistente — gap confirmado).
5. **CI/CD:** Introduzir propositalmente um erro de lint no código, fazer commit e verificar se o CI bloqueia o build (atualmente: não bloqueia — gap confirmado).

---

## Conclusão

O Daton ESG Insight possui **infraestrutura técnica relevante** para o controle de saídas do serviço (GED com versionamento imutável, relatórios com ciclo de aprovação, feature flags para rollout controlado), mas carece de **fechamento de loop no pós-entrega ao cliente**: a Ouvidoria está desconectada de dados reais, a pesquisa de satisfação não tem rota ativa, e não há SLA formalizado de disponibilidade do serviço por tenant.

As lacunas mais críticas são corrigíveis em curto prazo (A1, A2, A3 têm esforço de horas a poucos dias). A maturidade do sistema para este grupo de requisitos passaria de 2.5/5 para aproximadamente 3.8/5 após a implementação da Faixa 1 e Faixa 2.

**Não-conformidades por severidade:**

| Severidade | Quantidade |
|---|---|
| Crítica | 1 (OuvidoriaClientes desconectada) |
| Maior | 4 (reference_number, lint, satisfactionSurveys sem UI, ausência de SLA formal) |
| Menor | 2 (log de entrega de versões, release gate formal) |
| Observação | 1 (hardcoded KPIs de satisfação no dashboard) |
