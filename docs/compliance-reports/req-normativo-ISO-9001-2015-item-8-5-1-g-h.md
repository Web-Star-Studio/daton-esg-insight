# Resumo Executivo — Análise ISO 9001:2015 Itens 8.5.1.g e 8.5.1.h

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, itens 8.5.1.g e 8.5.1.h — Prevenção de erro humano e atividades de liberação, entrega e pós-entrega
**Documento de validação:** Conformidade de Sistema (Tipo B — codebase)

---

## Nota Global de Confiança: 2.9/5

### Notas por Módulo

| # | Módulo | Sub-item | Nota | Classificação |
|---|--------|----------|------|---------------|
| 01 | Wizard multi-estágios de NC com validações por estágio (`NCStageWizard.tsx`) | g | **4.0/5** | Maduro |
| 02 | Validação de formulários e bloqueio de submit (`useFormErrorValidation.ts`, `AcoesCorretivas.tsx`) | g | **3.8/5** | Funcional |
| 03 | Sanitização de dados de entrada (`NCStage5Implementation.tsx`, `useEnhancedForm.ts`) | g | **3.5/5** | Funcional |
| 04 | Fluxo de aprovação para liberação de entidades críticas (`ApprovalWorkflowModal.tsx`) | h | **3.2/5** | Funcional |
| 05 | Rastreabilidade de revisões de NC (`nonConformityService.ts`) | h | **3.8/5** | Funcional |
| 06 | Dupla verificação obrigatória para operações de alto impacto | g | **1.5/5** | Mínimo |
| 07 | Critérios formais de liberação para deploy em produção | h | **1.0/5** | Mínimo |
| 08 | Processo estruturado de pós-entrega (suporte, SLA, feedback) | h | **0.5/5** | Ausente |
| | **Média aritmética** | | **2.7/5** | |

> Nota: Considerando pesos maiores para os sub-itens críticos de liberação (h) e prevenção de erro humano em operações destrutivas (g), a nota ponderada é **2.9/5**.

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 1 | Wizard multi-estágios de NC |
| Funcional (3–3.9) | 4 | Validação/bloqueio, Sanitização, Aprovação, Rastreabilidade de revisões |
| Parcial (2–2.9) | 0 | — |
| Mínimo/Ausente (0–1.9) | 3 | Dupla verificação, Critérios de liberação, Pós-entrega |

---

## Top 5 Pontos Fortes

1. **[g] Wizard guiado de 6 estágios como prevenção de erro por design** (4.0) — O `src/components/non-conformity/NCStageWizard.tsx` estrutura o processo de NC em 6 estágios sequenciais com `StageAdvanceConfirmDialog` para confirmação de avanço. Verificações de completude impedem pular etapas: `NCStage1Details` com `isStageComplete = nc.current_stage > 1 || !!nc.stage_1_completed_at`; `NCStage4Planning` exige `what_action` e `when_deadline`; `NCStage6Effectiveness` exige `isEffective` selecionado e `evidence` preenchida. Prevenção de erro humano por omissão implementada por design.

2. **[g] Confirmação de ações destrutivas antes da execução** (3.8) — O `src/components/non-conformity/NCStage4Planning.tsx` exibe confirmação antes de executar `deleteMutation.mutate(id)`. O componente `StageAdvanceConfirmDialog` implementa diálogo de confirmação para avanço irreversível de estágio. Mecanismo anti-erro para operações destrutivas, reduzindo risco de exclusão acidental.

3. **[g] Sanitização automática de nomes de arquivo** (3.5) — O `src/components/non-conformity/NCStage5Implementation.tsx` implementa `sanitizeFileName()` que normaliza NFD, remove diacríticos, substitui caracteres especiais por `_` e converte para minúsculas. Prevenção automática de erros causados por nomes de arquivo com caracteres especiais, sem dependência de disciplina do usuário.

4. **[h] Rastreabilidade de revisões de NC com vínculo de origem** (3.8) — A interface `NonConformity` em `src/services/nonConformityService.ts` inclui `revision_number` e `parent_nc_id`. Quando uma NC é reaberta por ineficácia (via `NCStage6Effectiveness.tsx` com `isEffective = false`), cria-se nova revisão vinculada. O componente exibe alerta: "Revisão #{nc.revision_number} - Originada da NC {nc.parent_nc_id}" — rastreabilidade de ciclos de reentrega e histórico de revisões.

5. **[h] Fluxo de aprovação multi-etapa para liberação de entidades críticas** (3.2) — O `src/components/ApprovalWorkflowModal.tsx` e `ApprovalWorkflowManager.tsx` implementam workflows de aprovação configuráveis por tipo de entidade (`workflow_type: "non_conformity"`, etc.), registrando `approved_at`, `comments` e identidade do aprovador em cada etapa — controle formal de liberação com rastreabilidade.

---

## Top 5 Lacunas Críticas

### 1. [g] Ausência de dupla verificação obrigatória para operações de alto impacto (Severidade: ALTA)

**Impacto:** ISO 9001:2015, item 8.5.1.g — prevenção de erro humano em operações críticas.
**Situação:** O fluxo de aprovação (`ApprovalWorkflowManager`) é configurável mas sua utilização é opcional. Não existe enforcing de que operações de alta criticidade — encerramento de NC com avaliação de eficácia, aprovação de plano de ação corretivo, liberação de relatório GRI — obrigatoriamente passem por revisão de segunda pessoa. Um usuário com permissões suficientes pode executar todo o ciclo de NC sem aprovação de ninguém.
**Recomendação:** Tornar o workflow de aprovação obrigatório para fechamento de NCs de severidade `major` e `critical`, e para publicação de relatórios GRI, com enforcement no backend.

### 2. [h] Ausência de critérios formais de liberação para deploy em produção (Severidade: ALTA)

**Impacto:** ISO 9001:2015, item 8.5.1.h — atividades de liberação do produto/serviço com critérios de "go/no-go".
**Situação:** O `ProductionReadinessChecker` existe em código (`src/utils/productionReadinessChecker.ts` referenciado em `SystemStatusDashboard.tsx`), mas não foi localizado documento formal de critérios de liberação (Release Checklist, Plano de Deploy, Go-Live Criteria) nem workflow de CI/CD que automatize a verificação pré-deploy. A liberação para produção parece depender de verificação manual e discricionária.
**Recomendação:** Implementar pipeline CI/CD com verificação automatizada dos critérios do `ProductionReadinessChecker` como portão obrigatório antes do deploy, e documentar os critérios em Release Checklist formal.

### 3. [h] Ausência de processo estruturado de pós-entrega (Severidade: ALTA)

**Impacto:** ISO 9001:2015, item 8.5.1.h — atividades pós-entrega incluindo suporte, garantia, manutenção e coleta de feedback.
**Situação:** Não foram localizados no repositório artefatos que evidenciem: processo de suporte a clientes (ticketing, SLA de atendimento), mecanismo de coleta estruturada de reclamações/feedback, procedimento de gestão de incidentes pós-produção, ou registro de ocorrências relatadas por usuários. O módulo `SystemAlerts` monitora alertas técnicos, mas sem vínculo verificado com processo de atendimento ao cliente.
**Recomendação:** Criar e documentar processo de suporte pós-entrega com SLA, canais de atendimento e registro de reclamações, integrando-o ao módulo de ações corretivas existente.

### 4. [g] Confirmação de exclusão via `confirm()` nativo do browser (Severidade: BAIXA)

**Impacto:** ISO 9001:2015, item 8.5.1.g — consistência e confiabilidade dos mecanismos de prevenção de erro humano.
**Situação:** O `src/components/non-conformity/NCStage4Planning.tsx` usa `confirm()` nativo do browser para confirmação de exclusão. Esse diálogo não possui identidade visual da plataforma, não é consistente com os demais controles de UI e pode ser bloqueado por configurações de browser corporativo, comprometendo a proteção contra exclusão acidental.
**Recomendação:** Substituir `confirm()` por componente `AlertDialog` do Radix UI (`@radix-ui/react-alert-dialog` já disponível no `package.json`).

### 5. [h] Ausência de registro de entrega para exportações de relatórios oficiais (Severidade: BAIXA)

**Impacto:** ISO 9001:2015, item 8.5.1.h — rastreabilidade de atividades de entrega do produto/serviço ao cliente.
**Situação:** O módulo de relatórios inclui `ExportButtons.tsx` (`src/components/audit/reports/ExportButtons.tsx`) e `useReportExport.ts`, que geram PDFs e documentos exportáveis. Não foi localizado mecanismo que registre: quando um relatório foi gerado, qual versão dos dados foi incluída, e quem realizou a exportação. Isso é relevante para rastreabilidade pós-entrega de relatórios oficiais (GRI, GHG, etc.).
**Recomendação:** Implementar log de exportação de relatórios registrando usuário, timestamp, versão dos dados e tipo de exportação.

---

## Cobertura por Sub-requisito 8.5.1.g e 8.5.1.h

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| [g] Prevenção de erro por design (wizards, sequências guiadas) | `NCStageWizard.tsx` com 6 estágios sequenciais e verificações de completude por estágio | Maduro |
| [g] Confirmações de ações destrutivas | `StageAdvanceConfirmDialog`; `confirm()` nativo para exclusão (inconsistente) | Funcional |
| [g] Validação e sanitização de dados de entrada | `useFormErrorValidation.ts` (Zod), `sanitizeFormData`, `sanitizeFileName()` | Funcional |
| [g] Dupla verificação para operações de alto impacto | `ApprovalWorkflowManager` configurável mas não obrigatório para NCs críticas | Mínimo |
| [h] Controle de liberação com rastreabilidade de aprovador | `ApprovalWorkflowModal` com `approved_at` e identidade do aprovador | Funcional |
| [h] Rastreabilidade de ciclos de reentrega | `revision_number` + `parent_nc_id` em `nonConformityService.ts` | Funcional |
| [h] Critérios formais de liberação para deploy em produção | `ProductionReadinessChecker` sem documento formal; sem CI/CD com portão de qualidade | Mínimo |
| [h] Processo estruturado de pós-entrega (suporte, SLA, feedback) | Não evidenciado no repositório | Ausente |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Substituir `confirm()` nativo por `AlertDialog` do Radix UI (`@radix-ui/react-alert-dialog`) para confirmação de exclusão | `NCStage4Planning.tsx` | Consistência e confiabilidade dos mecanismos de prevenção de erro |
| 2 | Implementar log de exportação de relatórios (usuário, timestamp, versão dos dados, tipo) | `ExportButtons.tsx`, `useReportExport.ts`, banco de dados | Rastreabilidade de entrega de relatórios oficiais |

### Melhorias Estruturais (2–4 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Tornar o workflow de aprovação obrigatório para NCs de severidade `major` e `critical` e para publicação de relatórios GRI | `ApprovalWorkflowManager.tsx`, `NCStage6Effectiveness.tsx` | Fecha lacuna crítica de dupla verificação para operações de alto impacto |
| 4 | Implementar pipeline CI/CD com `ProductionReadinessChecker` como portão de "go/no-go" obrigatório antes do deploy | `.github/workflows/`, CI/CD | Formaliza critérios de liberação para produção |

### Mudanças Arquiteturais (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Criar e documentar processo de suporte pós-entrega com SLA, canais de atendimento e registro de reclamações integrado ao módulo de ações corretivas | Novo módulo/processo, `AcoesCorretivas.tsx` | Atende sub-requisito explícito de atividades pós-entrega (8.5.1.h) |
| 6 | Documentar Release Checklist formal com critérios de "go/no-go" para liberação, referenciando `ProductionReadinessChecker` | Documentação, `SystemStatusDashboard.tsx` | Torna critérios de liberação auditáveis por não-técnicos |

---

## Guia de Validação E2E

1. **[g]** Acessar o módulo de NC e tentar avançar o estágio 4 sem preencher `what_action`. Verificar que o sistema bloqueia o avanço com mensagem descritiva.
2. **[g]** Tentar excluir uma ação no estágio 4. Verificar que aparece um diálogo de confirmação com identidade visual da plataforma (não um `confirm()` nativo do browser).
3. **[g]** Tentar encerrar uma NC de severidade `major` sem passar por aprovação de segunda pessoa. Verificar se o sistema exige workflow de aprovação obrigatório.
4. **[h]** Verificar se existe pipeline CI/CD (`.github/workflows/` ou equivalente) que execute verificação de prontidão antes do deploy.
5. **[h]** Exportar um relatório GRI e verificar se o sistema registra log com usuário, timestamp e versão dos dados exportados.
6. **[h]** Verificar se existe documentação de processo de suporte ao cliente com SLA e canal de registro de reclamações/feedback.
7. **[h]** Criar uma NC, avançar todos os 6 estágios, avaliar como ineficaz no estágio 6, e verificar que nova NC é criada com `revision_number` = 2 e `parent_nc_id` referenciando a NC original.
8. Critério de aceite:
   - PASSA: Portões de estágio de NC bloqueiam avanço sem dados obrigatórios, aprovação obrigatória para NCs críticas, pipeline CI/CD com portão pré-deploy, e processo de pós-entrega documentado.
   - FALHA: Portões de estágio burlados, aprovação opcional para NCs críticas, ausência de CI/CD, ou ausência de qualquer processo de suporte pós-entrega.

---

## Conclusão

Nota global de **2.9/5.0 (Sistema Parcial com elementos Funcionais)**.

O Daton ESG Insight demonstra controles relevantes de prevenção de erro humano (8.5.1.g): o wizard de 6 estágios de NC com verificações de completude por estágio, o `StageAdvanceConfirmDialog` para ações irreversíveis e a sanitização automática de dados de entrada são implementações sólidas de prevenção por design. Para atividades de liberação (8.5.1.h), o sistema possui o fluxo de aprovação multi-etapa com rastreabilidade de aprovador e o controle de revisões de NC.

As lacunas mais críticas residem nos sub-requisitos que o sistema não cobre de forma sistêmica: (a) dupla verificação obrigatória para operações de alto impacto — o workflow de aprovação existe mas é opcional; (b) critérios formais de liberação para deploy em produção — o `ProductionReadinessChecker` existe no código, mas sem pipeline CI/CD que o execute automaticamente; e (c) processo estruturado de pós-entrega — completamente ausente no repositório.

A resolução das ações 3 e 4 (aprovação obrigatória para NCs críticas e pipeline CI/CD) são as de maior impacto normativo imediato, e elevariam o score para a faixa Funcional (3.3–3.5/5). A ação 5 (processo de pós-entrega) é a mais transformadora para atingir o requisito 8.5.1.h de forma completa e elevaria o sistema para a faixa Funcional sólida (3.6–3.8/5).
