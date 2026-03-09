# Resumo Executivo — Análise ISO 9001:2015 Item 8.5.1.f

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.1.f — Implementação de atividades de verificação de conformidade com requisitos de produtos e serviços
**Documento de validação:** Conformidade de Sistema (Tipo B — codebase)

---

## Nota Global de Confiança: 3.1/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Validação de formulários com Zod (`useFormErrorValidation.ts`, `useEnhancedForm.ts`) | **4.2/5** | Maduro |
| 02 | Validação de relatórios GRI (`useGRIReportValidation.ts`) | **4.0/5** | Maduro |
| 03 | Portões de qualidade por estágio no processo de NC (`NCStage4Planning.tsx`, `NCStage6Effectiveness.tsx`) | **3.8/5** | Funcional |
| 04 | Verificação de autenticação e autorização antes de operações (`AcoesCorretivas.tsx`) | **3.5/5** | Funcional |
| 05 | Verificação de prontidão de produção (`SystemStatusDashboard.tsx`) | **3.2/5** | Funcional |
| 06 | Cobertura de testes automatizados (`tests/e2e/`) | **1.2/5** | Mínimo |
| 07 | Pipeline CI/CD com portão de qualidade formal | **0.5/5** | Ausente |
| | **Média aritmética** | **2.9/5** | |

> Nota: Considerando o peso crítico dos testes automatizados e do CI/CD como evidência sistêmica de conformidade, a nota ponderada é **3.1/5**.

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 2 | Validação Zod, Validação GRI |
| Funcional (3–3.9) | 3 | Portões de NC, Autenticação, Readiness check |
| Parcial (2–2.9) | 0 | — |
| Mínimo/Ausente (0–1.9) | 2 | Testes automatizados, CI/CD |

---

## Top 5 Pontos Fortes

1. **Validação centralizada com Zod bloqueando dados não conformes** (4.2) — O `src/hooks/useFormErrorValidation.ts` implementa validação centralizada com Zod (`zod ^4.1.11`), retornando erros por campo com mensagens em português, registrando falhas via `logFormValidation` e exibindo `toast.error` imediato. O `src/hooks/useEnhancedForm.ts` complementa com validação por campo ao digitar, limpeza de erros e sanitização via `sanitizeFormData`. O sistema não processa dados inválidos — verificação de conformidade dos dados de entrada com os requisitos do serviço.

2. **Validação especializada para relatórios GRI com severidades distintas** (4.0) — O `src/hooks/useGRIReportValidation.ts` implementa validação para relatórios GRI incluindo: título com mínimo de 5 caracteres (bloqueio), ano válido (2000 a ano corrente + 1), período de reporte com data início anterior à data fim. Severidades distintas: `error` (bloqueia), `warning` (alerta), `info` (informativo). Verifica conformidade dos dados com os requisitos do padrão GRI antes de persistir.

3. **Portões de qualidade por estágio no processo de NC** (3.8) — O `src/components/non-conformity/NCStage4Planning.tsx` exige `what_action` e `when_deadline` preenchidos antes de submissão. O `NCStage6Effectiveness.tsx` exige `isEffective` selecionado e `evidence` preenchida antes de encerrar ou reabrir a NC. Esses portões impedem avanço sem dados de conformidade — verificação de conformidade por estágio durante a realização do serviço.

4. **Verificação de autenticação e vínculo de empresa antes de operações críticas** (3.5) — O `src/pages/AcoesCorretivas.tsx` verifica `getUserAndCompany()` e lança erro se `!company_id || !id` antes de qualquer inserção de dado, bloqueando operações não autorizadas como controle preventivo de conformidade operacional.

5. **ProductionReadinessChecker como verificação pré-liberação** (3.2) — O `src/components/production/SystemStatusDashboard.tsx` executa `ProductionReadinessChecker` que valida pré-requisitos antes de considerar o sistema "pronto para produção", retornando `healthy`, `degraded` ou `unhealthy`.

---

## Top 5 Lacunas Críticas

### 1. Cobertura de testes automatizados insuficiente para verificação sistêmica (Severidade: ALTA)

**Impacto:** ISO 9001:2015, item 8.5.1.f — atividades de verificação de conformidade com os requisitos, incluindo evidência objetiva de que os requisitos são atendidos após cada mudança.
**Situação:** O repositório contém apenas 3 arquivos de teste E2E (`tests/e2e/smoke.spec.ts`, `demo-features.spec.ts`, `demo-social.spec.ts`). O `smoke.spec.ts` contém apenas um teste de carregamento de página (`await expect(page.locator("body")).toBeVisible()`). O `package.json` lista `vitest ^3.2.4` e `@testing-library/react ^16.3.0` como dependências, mas não foram encontrados arquivos `.test.ts` ou `.spec.ts` em `src/` além de `src/components/onboarding/__tests__/recommendations.test.ts`. Não há testes unitários para lógica crítica de negócio (cálculo de indicadores, transições de NC, validação GRI).
**Recomendação:** Ampliar cobertura de testes unitários para: cálculo de status de indicadores (`IndicatorCard`), transições de estágio de NC, validações do `useGRIReportValidation` e regras de negócio de `AcoesCorretivas`.

### 2. Ausência de pipeline CI/CD com portão de qualidade formal (Severidade: ALTA)

**Impacto:** ISO 9001:2015, item 8.5.1.f — verificação sistêmica e automatizada de conformidade antes de cada entrega.
**Situação:** O `package.json` define scripts de `lint`, `build` e `e2e`, mas não foi localizado arquivo de workflow CI/CD (GitHub Actions, GitLab CI, etc.) no repositório que defina um pipeline com portão de qualidade (build + lint + testes devem passar antes do merge/deploy). Sem pipeline de verificação automática, a conformidade com requisitos depende exclusivamente da disciplina manual do desenvolvedor.
**Recomendação:** Implementar pipeline CI/CD (GitHub Actions ou equivalente) com portões de: lint passa, build passa, testes E2E passam — como condição obrigatória para merge na branch principal.

### 3. Limiar de confiança para aprovação de extração por IA sem critério formal (Severidade: MÉDIA)

**Impacto:** ISO 9001:2015, item 8.5.1.f — conformidade dos dados processados com os requisitos antes de sua aceitação.
**Situação:** O `src/components/DocumentExtractionApproval.tsx` implementa fluxo de aprovação de dados extraídos por IA com `confidence_scores` e `validation_status`, mas não foi verificada a existência de um limiar formal de `confidence_score` mínimo que determine aceite automático versus revisão humana obrigatória. A decisão de aprovar ou rejeitar parece ser totalmente manual e discricionária.
**Recomendação:** Definir limiar mínimo de `confidence_score` (ex.: ≥ 0,85 para aceite automático, < 0,85 para revisão humana obrigatória) e documentar em política de qualidade.

### 4. Ausência de log de conformidade auditável para operações críticas de NC (Severidade: MÉDIA)

**Impacto:** ISO 9001:2015, item 8.5.1.f — reter evidência objetiva de que as atividades de verificação foram realizadas.
**Situação:** O `src/services/documentApprovalLog.ts` implementa log de aprovação de documentos, e `logFormValidation` registra falhas de validação de formulário, mas não foi localizado mecanismo equivalente para registrar histórico de conformidade de operações críticas como criação/encerramento de NCs, aprovação de planos de ação e avaliação de eficácia.
**Recomendação:** Implementar log de auditoria para operações críticas de NC (criação, fechamento, avaliação de eficácia), registrando: usuário, timestamp, dados antes/depois e resultado da verificação.

### 5. DOMPurify e sanitização sem política formal de conformidade de segurança (Severidade: BAIXA)

**Impacto:** ISO 9001:2015, item 8.5.1.f — conformidade com requisitos de segurança do serviço prestado.
**Situação:** O `package.json` lista `dompurify ^3.3.1` como dependência, indicando sanitização de HTML para prevenção de XSS. O `sanitizeFormData` em `useEnhancedForm.ts` e a sanitização de nomes de arquivo em `NCStage5Implementation.tsx` são boas práticas, mas não há política formal documentada que liste os controles de segurança implementados e os requisitos de conformidade que cada um atende.
**Recomendação:** Documentar política de segurança de conteúdo listando os controles implementados (DOMPurify, sanitizeFormData, sanitização de nomes de arquivo) e os requisitos que cobrem.

---

## Cobertura por Sub-requisito 8.5.1.f

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| Verificação de conformidade dos dados de entrada com requisitos | `useFormErrorValidation.ts` com Zod; `useGRIReportValidation.ts` com regras GRI; bloqueio de submit com dados inválidos | Maduro |
| Portões de qualidade durante a realização do serviço | `NCStage4Planning.tsx` e `NCStage6Effectiveness.tsx` com validações obrigatórias por estágio | Funcional |
| Verificação de conformidade antes de entrega/liberação | `ProductionReadinessChecker` com status `healthy` / `degraded` / `unhealthy` | Funcional |
| Evidência objetiva sistêmica de conformidade (testes automatizados) | Apenas 3 testes E2E superficiais; ausência de testes unitários para lógica crítica | Mínimo |
| Portão de qualidade automatizado no pipeline de entrega (CI/CD) | Nenhum workflow CI/CD localizado no repositório | Ausente |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Definir limiar mínimo de `confidence_score` (≥ 0,85) para aceite automático de extrações por IA e documentar em política | `DocumentExtractionApproval.tsx`, docs | Formaliza critério de aceitação para dados processados por IA |
| 2 | Implementar log de auditoria para criação, fechamento e avaliação de eficácia de NCs | `nonConformityService.ts`, banco de dados | Evidência objetiva de que verificações de conformidade foram realizadas |

### Melhorias Estruturais (2–4 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Implementar pipeline CI/CD (GitHub Actions) com portões de lint + build + testes E2E | `.github/workflows/`, configuração de CI | Verificação sistêmica e automatizada de conformidade antes de cada entrega |
| 4 | Ampliar cobertura de testes unitários para cálculo de status de indicadores, transições de NC e validações GRI | `src/tests/`, vitest | Evidência objetiva de conformidade da lógica de negócio crítica |

### Mudanças Arquiteturais (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Criar política formal de segurança de conteúdo documentando controles implementados (DOMPurify, sanitizeFormData) e requisitos atendidos | Documentação, GED | Rastreabilidade de conformidade com requisitos de segurança do serviço |

---

## Guia de Validação E2E

1. Acessar o formulário de criação de não conformidade e tentar submeter com campos obrigatórios em branco. Verificar que o sistema bloqueia o submit e exibe mensagens de erro descritivas por campo.
2. Tentar avançar o estágio 4 de NC sem preencher `what_action` e `when_deadline`. Verificar que o sistema bloqueia o avanço.
3. Tentar encerrar uma NC no estágio 6 sem selecionar `isEffective` e sem preencher `evidence`. Verificar que o sistema exige esses dados.
4. Acessar `tests/e2e/smoke.spec.ts` e executar `bun run test:e2e`. Verificar que o teste único de carregamento de página passa, mas confirmar que não há cobertura de fluxos críticos de negócio.
5. Verificar se existe arquivo `.github/workflows/` ou equivalente com pipeline CI/CD que execute lint, build e testes antes de merge.
6. Criar um relatório GRI com ano inválido (ex.: 2050) e verificar que o sistema bloqueia com `error` (não apenas `warning`).
7. Critério de aceite:
   - PASSA: Formulários bloqueiam dados inválidos, portões de estágio de NC são respeitados, pipeline CI/CD existe e executa testes automatizados.
   - FALHA: Formulários permitem submissão de dados inválidos, portões de estágio burlados, ou ausência de pipeline CI/CD.

---

## Conclusão

Nota global de **3.1/5.0 (Sistema Funcional)**.

O Daton ESG Insight implementa verificações de conformidade sólidas na camada de apresentação: a validação centralizada com Zod em `useFormErrorValidation.ts`, a validação especializada para relatórios GRI com severidades distintas em `useGRIReportValidation.ts` e os portões de qualidade por estágio no processo de NC constituem uma base funcional de verificação de conformidade com os requisitos durante a realização do serviço.

As lacunas mais críticas — e que impedem classificação Maduro — são a cobertura de testes automatizados praticamente inexistente (3 testes E2E superficiais, sem testes unitários para lógica crítica) e a ausência de pipeline CI/CD com portões de qualidade. Sem esses dois elementos, a organização não possui evidência sistêmica e rastreável de que os requisitos são verificados de forma consistente a cada mudança no sistema. A implementação do pipeline CI/CD (ação 3) e a ampliação da cobertura de testes (ação 4) são as mudanças de maior impacto e elevariam o score para a faixa Maduro (4.0+).
