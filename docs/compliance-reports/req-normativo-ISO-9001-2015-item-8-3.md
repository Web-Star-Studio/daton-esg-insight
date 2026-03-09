# Resumo Executivo — Análise ISO 9001:2015 Item 8.3

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.3 — Projeto e Desenvolvimento de Produtos e Serviços
**Documento de validação:** N/A — Análise Tipo B (conformidade do sistema/codebase)

---

## Nota Global de Confiança: 2.1/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | 8.3.1 — Processo de P&D documentado | **1.5/5** | Mínimo |
| 02 | 8.3.2 — Planejamento de etapas e controles | **2.0/5** | Parcial |
| 03 | 8.3.3 — Entradas do projeto (inputs) | **2.5/5** | Parcial |
| 04 | 8.3.4 — Controles de P&D (revisões, verificação, validação) | **2.0/5** | Parcial |
| 05 | 8.3.5 — Saídas do projeto (outputs documentados) | **2.5/5** | Parcial |
| 06 | 8.3.6 — Controle de mudanças de P&D | **2.0/5** | Parcial |
| | **Média aritmética** | **2.1/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 0 | — |
| Funcional (3-3.9) | 0 | — |
| Parcial (2-2.9) | 5 | 8.3.2, 8.3.3, 8.3.4, 8.3.5, 8.3.6 |
| Mínimo/Ausente (0-1.9) | 1 | 8.3.1 |

---

## Top 5 Pontos Fortes

1. **Controle de versão via Git + GitHub Actions** (8.3.6 — Parcial) — O repositório usa Git como sistema de controle de mudanças de código. O arquivo `.github/workflows/ci.yml` implementa pipeline de CI que executa lint, type check, testes unitários e build em cada push ao `main` e em PRs, fornecendo portões mínimos de verificação técnica antes da integração de mudanças.

2. **Catálogo de módulos com validação** (8.3.5 — Parcial) — `src/components/onboarding/modulesCatalog.ts` define formalmente o catálogo de serviços entregáveis, com função `validateModuleCatalog()` que verifica integridade dos atributos de cada módulo. Representa uma forma embrionária de especificação de saída do produto.

3. **Workflow de aprovação de PR documentado no AGENTS.md** (8.3.4 — Parcial) — O arquivo `AGENTS.md` define processo de PR incluindo: resumo obrigatório, áreas afetadas, confirmação de lint e testes. Isso constitui um controle de revisão de mudanças parcialmente formalizado, com campos equivalentes a requisitos de entrada/saída de design review.

4. **Pipeline CI com etapas sequenciais** (8.3.2 — Parcial) — O `ci.yml` implementa dois jobs com dependência: `test` (lint → type-check → test → coverage) e `build` (`needs: test`), criando uma sequência mínima de verificação antes da entrega, análoga a portões de qualidade entre estágios de P&D.

5. **Controle de feature flags e módulos desabilitados** (8.3.6 — Parcial) — `src/config/enabledModules.ts` implementa toggles (`financial: false`, `esgGovernance: false`, `dataReports: false`) com mapa de rotas afetadas, permitindo gerenciar rollout de funcionalidades em desenvolvimento. Isso constitui um mecanismo parcial de controle de mudanças em produção.

---

## Top 5 Lacunas Críticas

### 1. Ausência de processo formal de P&D documentado (Severidade: ALTA)
**Impacto:** ISO 9001:2015, item 8.3.1 — Determinação do processo de P&D
**Situação:** Não existe nenhum documento em `docs/` ou no repositório que defina formalmente o processo de projeto e desenvolvimento do sistema Daton. Não há procedimento de P&D, plano de desenvolvimento de produto, ou documentação de processo de engenharia de software. O `docs/README.md` e `docs/codebase-overview.md` descrevem a arquitetura técnica mas não definem o processo de P&D como exigido pela norma (etapas, responsabilidades, critérios de entrada e saída de cada fase).
**Recomendação:** Criar documento `docs/processo-pd.md` (ou PSG-PD equivalente) definindo formalmente: escopo do processo de P&D, fases (levantamento de requisitos → design → desenvolvimento → verificação → validação → entrega), responsabilidades por fase, critérios de entrada e saída de cada fase, e referências a ferramentas utilizadas (GitHub Issues, PRs, CI/CD).

### 2. Ausência de gestão formal de requisitos (entradas do projeto) (Severidade: ALTA)
**Impacto:** ISO 9001:2015, item 8.3.3 — Entradas do projeto e desenvolvimento
**Situação:** Não existe sistema de gestão de requisitos rastreável. Funcionalidades são desenvolvidas sem documentação formal de requisitos de usuário, requisitos funcionais, ou critérios de aceitação no repositório. O `AGENTS.md` menciona que PRs devem incluir "áreas afetadas", mas não há template de especificação de requisito, user story estruturada, ou rastreabilidade entre requisito → design → código → teste. Não foram encontrados arquivos de especificação em `docs/`, `.github/ISSUE_TEMPLATE/`, ou equivalentes.
**Recomendação:** Implementar template de issue no GitHub (`.github/ISSUE_TEMPLATE/feature-request.md`) com campos obrigatórios: problema/necessidade, critérios de aceitação, impacto em módulos existentes, requisitos legais/normativos aplicáveis. Criar rastreabilidade mínima requisito → PR → entrega.

### 3. Verificação e validação sem critérios formais de aceitação (Severidade: ALTA)
**Impacto:** ISO 9001:2015, item 8.3.4 — Controles do projeto e desenvolvimento
**Situação:** O pipeline CI (`.github/workflows/ci.yml`) executa lint e testes, mas com limitações críticas: (a) o step de lint usa `npm run lint || true` — falhas de lint não bloqueiam o pipeline; (b) a cobertura de testes é declarada como objetivo (TESTING.md: "Overall: 75%") mas não é portão de bloqueio no CI; (c) não há critério formal de aceitação para revisão de P&D além da aprovação de PR genérica definida no `AGENTS.md`. A validação junto ao usuário final (aceitação de produto) não está documentada como processo formal.
**Recomendação:** (a) Remover `|| true` do step de lint para torná-lo portão de bloqueio real; (b) Adicionar threshold de cobertura mínima no CI (ex: `--coverage --reporter=text --coverage.thresholds.lines=70`); (c) Criar checklist formal de validação de feature antes de merge para produção.

### 4. Ausência de controle de mudanças com análise de impacto formal (Severidade: MÉDIA)
**Impacto:** ISO 9001:2015, item 8.3.6 — Controle de mudanças no projeto e desenvolvimento
**Situação:** O `AGENTS.md` exige que PRs incluam "áreas afetadas" e confirme lint/testes, mas não há processo formal de análise de impacto de mudança (change impact analysis). Mudanças em tabelas críticas do Supabase (375 tabelas com 773 políticas RLS) não passam por revisão formal de impacto em módulos dependentes. O histórico de migrações SQL (`supabase/migrations/`) contém ~100+ arquivos com UUIDs como nomes, sem descrição semântica do propósito de cada mudança de schema. Não existe processo de avaliação de impacto de mudanças em módulos com feature flags desabilitados (`financial`, `esgGovernance`).
**Recomendação:** (a) Padronizar nomes de arquivos de migração com descrição semântica; (b) Criar template de análise de impacto no PR para mudanças de schema de banco; (c) Documentar dependências entre módulos para avaliar efeito cascata de mudanças.

### 5. Saídas do projeto sem documentação de especificação formal (Severidade: MÉDIA)
**Impacto:** ISO 9001:2015, item 8.3.5 — Saídas do projeto e desenvolvimento
**Situação:** As "saídas" do processo de P&D (funcionalidades entregues, APIs, schemas de banco) não possuem documentação de especificação formal que atenda aos requisitos de entrada identificados. O `docs/backend-database-er.md` e `docs/frontend-architecture.md` documentam a arquitetura existente (snapshot de 2026-02-22), mas não constituem especificação de saída de P&D — não incluem critérios de aceitação, referência a requisitos atendidos, ou confirmação de verificação/validação. A `docs/backend-edge-functions.md` documenta 64 funções locais + drift de deployment (3 funções deployed-only sem código local), indicando ausência de controle formal de saídas.
**Recomendação:** Criar processo de documentação de saídas de P&D por feature/versão: registro de funcionalidade entregue, referência ao requisito de origem, resultados de verificação (CI verde), e evidência de validação com usuário.

---

## Cobertura por Sub-requisito 8.3

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 8.3.1 — Generalidades (determinação do processo de P&D) | Nenhum documento formal de processo de P&D existe no repositório | Ausente |
| 8.3.2.a — Etapas e duração das atividades | Pipeline CI define sequência técnica mínima; sem fases formais de P&D (levantamento, design, impl., verificação, validação) | Parcial |
| 8.3.2.b — Revisões necessárias | Revisão de PR definida em `AGENTS.md` como processo; sem critérios formais de revisão de design | Parcial |
| 8.3.2.c — Verificação e validação necessárias | CI executa lint e testes; lint não bloqueia (`|| true`); sem validação formal de produto | Parcial |
| 8.3.2.d — Responsabilidades e autoridades | `AGENTS.md` implica revisores de PR; sem RACI formal por fase de P&D | Ausente |
| 8.3.2.e — Necessidades de recursos internos e externos | Dependências gerenciadas via `package.json`/`bun.lock`; sem análise formal de capacidade/recursos | Parcial |
| 8.3.2.f — Interfaces entre pessoas envolvidas | Processo de PR no GitHub define interfaces mínimas; sem mapa de interfaces de equipe | Parcial |
| 8.3.3.a — Requisitos funcionais e de desempenho | Sem sistema formal de gestão de requisitos; sem templates de user story ou critérios de aceitação | Ausente |
| 8.3.3.b — Informações de atividades anteriores | Migrações SQL como histórico parcial; sem rastreabilidade formal de lições aprendidas | Parcial |
| 8.3.3.c — Requisitos legais e regulamentares | `src/services/isoRequirements.ts` define estrutura de requisitos ISO; sem vinculação explícita a P&D | Parcial |
| 8.3.3.d — Normas ou códigos de prática a implementar | `src/data/isoTemplates.ts` lista cláusulas ISO; não integrado ao processo de P&D | Parcial |
| 8.3.3.e — Consequências do fracasso | Sem análise formal de risco de P&D (FMEA ou equivalente) | Ausente |
| 8.3.4.a — Revisões de P&D | Revisão de PR; sem revisão formal de design (design review gate) | Parcial |
| 8.3.4.b — Verificações de que saídas atendem entradas | CI executa testes mas lint não bloqueia; sem rastreabilidade requisito→teste | Parcial |
| 8.3.4.c — Validação de que produto atende uso previsto | Sem processo documentado de validação com usuário final (UAT, beta) | Ausente |
| 8.3.5.a — Requisitos de monitoramento e medição | `TESTING.md` define metas de cobertura; não é portão formal no CI | Parcial |
| 8.3.5.b — Critérios de aceitação | Sem critérios de aceitação formais por feature | Ausente |
| 8.3.5.c — Características essenciais para propósito | `src/components/onboarding/modulesCatalog.ts` e `src/config/enabledModules.ts` mapeiam módulos; sem rastreabilidade a requisitos | Parcial |
| 8.3.6.a — Identificação de mudanças | Git commits + PR; migrações SQL sem nomes semânticos | Parcial |
| 8.3.6.b — Revisão de mudanças | Revisão de PR obrigatória (`AGENTS.md`); sem análise formal de impacto | Parcial |
| 8.3.6.c — Autorização de mudanças | Aprovação de PR implica autorização; sem nível formal de autoridade por tipo de mudança | Parcial |
| 8.3.6.d — Ações para prevenir impactos adversos | Feature flags em `enabledModules.ts`; sem análise formal de impacto pré-mudança | Parcial |

---

## Cobertura ISO 9001:2015 Item 8.3 — Resumo

| # | Sub-requisito | Status | Nota |
|---|-----------|--------|------|
| P1 | 8.3.1 — Processo de P&D determinado | ❌ | Sem documento de processo formal |
| P2 | 8.3.2.a — Etapas e duração | ⚠️ | CI define sequência técnica; sem fases formais |
| P3 | 8.3.2.b — Revisões necessárias | ⚠️ | Revisão de PR definida; sem design review formal |
| P4 | 8.3.2.c — Verificação e validação | ⚠️ | CI presente mas com falha de configuração (lint `|| true`) |
| P5 | 8.3.2.d — Responsabilidades | ❌ | Sem RACI formal de P&D |
| P6 | 8.3.3.a — Requisitos funcionais | ❌ | Sem gestão formal de requisitos |
| P7 | 8.3.3.c — Requisitos legais/normativos | ⚠️ | Estrutura em `isoRequirements.ts`; não integrada ao P&D |
| P8 | 8.3.3.e — Riscos de falha | ❌ | Sem análise de risco de P&D |
| P9 | 8.3.4.a — Revisões de P&D | ⚠️ | Revisão de PR; sem design review gate formal |
| P10 | 8.3.4.c — Validação com uso previsto | ❌ | Sem processo de UAT/validação documentado |
| P11 | 8.3.5.b — Critérios de aceitação | ❌ | Ausentes por feature |
| P12 | 8.3.6 — Controle de mudanças | ⚠️ | Git + PR; sem análise de impacto formal |

**Resumo:** 0/12 implementados (✅), 6/12 parciais (⚠️), 6/12 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Remover `|| true` do step de lint em `.github/workflows/ci.yml` linha 27 para tornar lint um portão de bloqueio real | CI/CD | 8.3.4.b — Verificação de saídas |
| 2 | Criar `.github/ISSUE_TEMPLATE/feature-request.md` com campos: necessidade/problema, critérios de aceitação, módulos afetados, requisitos normativos | GitHub | 8.3.3.a |
| 3 | Adicionar threshold de cobertura no script de CI (`--coverage.thresholds.lines=70`) para impedir merge com cobertura abaixo do alvo | CI/CD | 8.3.4.b, 8.3.5.a |
| 4 | Padronizar nomes de migrações SQL com prefixo semântico (ex: `20250910_add_document_versions_table.sql`) para futuras migrações | Banco de Dados | 8.3.6.a |

### Melhorias Estruturais (2-4 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Criar `docs/processo-pd.md` documentando formalmente fases de P&D: Levantamento de Requisitos → Design Técnico → Desenvolvimento → Revisão/PR → Verificação (CI) → Validação (UAT) → Deploy | Documentação | 8.3.1, 8.3.2 completo |
| 6 | Criar template de PR em `.github/pull_request_template.md` com seções: descrição da mudança, requisito de origem (issue#), critérios de aceitação verificados, módulos impactados, evidência de teste | GitHub | 8.3.4, 8.3.6 |
| 7 | Criar `docs/responsabilidades-pd.md` (RACI) definindo papéis em cada fase de P&D: Product Owner (define requisitos), Tech Lead (design review), Desenvolvedor (implementação + testes), Revisor (code review) | Documentação | 8.3.2.d |
| 8 | Integrar `src/services/isoRequirements.ts` ao processo de P&D criando campo `iso_requirement_id` nos issues e PRs para rastrear quais cláusulas ISO uma feature atende | Rastreabilidade | 8.3.3.c |

### Mudanças Arquiteturais (1-2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 9 | Implementar módulo de gestão de requisitos no sistema: tabela `product_requirements` com campos `type` (funcional/não-funcional/normativo), `acceptance_criteria`, `status` (rascunho/aprovado/implementado/validado), `linked_issues` | Banco de Dados | 8.3.3 completo |
| 10 | Criar processo formal de UAT (User Acceptance Testing): template de validação por feature, registro de aprovação de usuário, vinculação ao requisito de origem | Documentação + Processo | 8.3.4.c, 8.3.5.b |
| 11 | Implementar análise de impacto de mudança de schema: trigger ou processo que identifica tabelas dependentes antes de migração, com aprovação formal para mudanças em tabelas com +100 FKs (ex: `companies`, `profiles`) | Banco de Dados + Processo | 8.3.6 completo |
| 12 | Criar checklist formal de design review para features de alto impacto (novos módulos, mudanças em tabelas core): requisitos → design técnico → aprovação → implementação → verificação → validação → deploy | Processo | 8.3.2, 8.3.4 completo |

---

## Guia de Validação E2E

1. Verificar se existe documento de processo de P&D: executar `Glob pattern: docs/**/*.md` e confirmar existência de arquivo nomeado `processo-pd*`, `engenharia*`, `desenvolvimento*` ou equivalente — atualmente **não existe**.

2. Abrir `.github/workflows/ci.yml` linha 27 e verificar se o step de lint contém `|| true` — se sim, é não-conformidade crítica de portão de verificação.

3. Verificar existência de templates de issue em `.github/ISSUE_TEMPLATE/` — atualmente **não existe** este diretório; apenas `AGENTS.md` e `CLAUDE.md` definem diretrizes de PR sem template formal.

4. Para uma mudança recente (último PR ou commit em `main`), rastrear: (a) qual issue originou a mudança? (b) quais critérios de aceitação foram definidos? (c) há evidência de validação com usuário? — se não for possível responder a todas, o controle 8.3.3 → 8.3.4 → 8.3.5 está quebrado.

5. Verificar migrações em `supabase/migrations/`: confirmar se os nomes de arquivos têm descrição semântica além de UUID — atualmente todos os arquivos seguem padrão `YYYYMMDD_UUID.sql` sem descrição.

6. Verificar se o CI bloqueia merge em caso de falha de lint: criar um PR com erro de lint intencional e observar se o pipeline passa ou falha — com a configuração `|| true` atual, passará.

7. Critério de aceite geral:
   - **PASSA:** Existe documento de processo de P&D, templates de requisito, lint bloqueia, cobertura é portão de CI, e existe registro de validação para últimas 3 features entregues.
   - **FALHA:** Qualquer um dos acima ausente — cenário atual falha em todos os critérios.

---

## Conclusão

O Daton ESG Insight obteve **nota global 2.1/5 (Parcial)** no item 8.3 da ISO 9001:2015. O sistema possui infraestrutura técnica básica de desenvolvimento (Git, GitHub Actions, Vitest, TypeScript) que oferece elementos fragmentados compatíveis com controles de P&D, mas nenhum deles está formalizado como processo de projeto e desenvolvimento nos termos exigidos pela norma.

Os pontos fortes identificados são todos de natureza técnica e emergente: pipeline CI com sequência de jobs, catálogo de módulos com validação, feature flags para gerenciamento de rollout, e diretrizes de PR no `AGENTS.md`. Esses elementos existem por boas práticas de engenharia, não como implementação deliberada do item 8.3.

As lacunas são estruturais e cobrem 6 dos 12 sub-requisitos analisados como **ausentes**: (a) inexistência de documento formal de processo de P&D (8.3.1); (b) ausência de gestão de requisitos rastreável (8.3.3.a); (c) ausência de critérios de aceitação formais por feature (8.3.5.b); (d) lint configurado para não bloquear CI (8.3.4.b impactado); (e) ausência de validação formal com usuário final (8.3.4.c); (f) sem análise de impacto formal para mudanças de schema de banco. O plano de ação prioriza intervenções de baixo custo (remover `|| true` do lint, criar templates de issue e PR) que elevam imediatamente a maturidade dos controles, seguidas de documentação de processo e, a prazo, implementação de rastreabilidade formal de requisitos dentro do próprio sistema.
