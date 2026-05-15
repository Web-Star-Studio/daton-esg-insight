---
title: Status da Auditoria 2026-05-15
date: 2026-05-15
related: docs/audits/auditoria-bugs-2026-05-15.md
---

# Resposta à auditoria de bugs de 2026-05-15

Documento companheiro de `auditoria-bugs-2026-05-15.md`. Lista o que foi
investigado, o que foi corrigido, o que era falso positivo, e o que ficou em
backlog. Use como referência ao re-rodar a auditoria — todo finding aqui
marcado como "resolvido" ou "falso positivo" deve sumir/mudar no próximo
relatório do Lovable.

## Sumário executivo

| Severidade original | Total | Corrigidos | Falso positivo | Backlog |
|---|---|---|---|---|
| P0 | 7 | 3 (F-015, F-016, F-018) | 2 (F-001, F-019) | 2 (F-002, F-017) |
| P1 | 11 | 6 (F-007 a F-012, pré-fix) | 0 | 5 (F-013, F-020, F-021, F-022, F-023) |
| P2 | 5 | 0 | 0 | 5 (F-003, F-004, F-014, F-024, F-025) |
| P3 | 2 | 0 | 0 | 2 (F-005, F-006) |
| **Total** | **25** | **9** | **2** | **14** |

> Nota: o sumário original da auditoria reporta "24 findings" mas a
> enumeração detalhada lista 25 (F-001 a F-026 com gap em F-008/F-009 etc.
> tudo presente). Esta tabela usa a contagem real do detalhe.

## P0 — detalhe

### F-001 — RLS bloqueando INSERT em `page_view_logs`

**Status: falso positivo / pré-resolvido.**

Verificação direta na produção:

```sql
SELECT policyname, cmd, roles, with_check FROM pg_policies WHERE tablename='page_view_logs';
-- → "Anyone can insert page views" | INSERT | {public} | true
SELECT COUNT(*), MAX(viewed_at), COUNT(*) FILTER (WHERE viewed_at > now() - interval '24 hours')
FROM page_view_logs;
-- → 2598 linhas, último insert 2026-05-15 22:21:31, 113 nas últimas 24h
```

A INSERT policy é totalmente permissiva (`WITH CHECK: true`) para o role
`public` (que inclui `anon` e `authenticated`). Inserts estão entrando. Os
RLS violations observados pela auditoria (timestamp 19:53Z) devem ter sido
de antes da policy ser ajustada.

### F-002 — Statement timeout em queries do dashboard

**Status: backlog (não investigado nesta sessão).**

Precisa instrumentação manual das queries do dashboard
(PredictiveInsightsWidget, IntegratedReports, ESG Dashboard) para
identificar a query lenta antes de propor índice/paginação. Mantido como
P0 da auditoria original.

### F-015 / F-016 / F-018 — RLS cross-tenant

**Status: corrigido em PR #60 (merged).**

Migração `supabase/migrations/20260515210000_rls_cross_tenant_fixes.sql`:

- `career_development_plans`: removida policy `ALL` com
  `auth.role()='authenticated'`; adicionadas 4 policies escopadas por
  `company_id = public.get_user_company_id()` (SELECT/INSERT/UPDATE/DELETE).
- `mentoring_relationships`: mesmo fix (tabela ainda vazia em prod).
- `_laia_sectors_rename_audit_20260514`: RLS habilitada; única policy é
  SELECT restrita a `public.is_platform_admin()`. Histórico preservado
  (não dropamos a tabela para permitir reversão da migration de 14/mai).

Validação esperada na re-auditoria: scanner Lovable deve parar de reportar
`MISSING_COMPANY_SCOPE` para `career_development_plans` e
`mentoring_relationships`, e `MISSING_RLS_PROTECTION` para `_laia_sectors_rename_audit_20260514`.

### F-017 — Senhas de fornecedores legíveis dentro da empresa

**Status: backlog (requer refactor de app code).**

`supplier_management.password_hash`, `temporary_password` e `access_code`
são lidas via `select('*')` em `supplierManagementService.ts:374` (`getAllSuppliers`)
e `:421` (`getManagedSupplierById`). Um simples `REVOKE SELECT (...) FROM authenticated`
quebraria essas queries. Fix requer:

1. Trocar `select('*')` por lista explícita de colunas sem secrets nessas duas funções.
2. Edge function dedicada (com service_role) para o caso onde o admin
   precisa exibir a senha temporária ao criar o fornecedor
   (`SupplierRegistration.tsx:156`).
3. Migration: `REVOKE SELECT (password_hash, temporary_password, access_code)
   ON supplier_management FROM authenticated`.

### F-019 — Realtime sem authorization

**Status: falso positivo (RLS nas tabelas-fonte protege).**

Verificação:

- 6 tabelas em `supabase_realtime` publication: `notifications`,
  `audit_notifications`, `document_extraction_jobs`, `extracted_data_preview`,
  `extraction_approval_log`, `extraction_items_staging`.
- Todas têm RLS SELECT tenant/user-scoped (verificado em `pg_policies`).
- 100% das subscriptions do app (`grep -r '.channel' src/`) usam
  `postgres_changes` exceto uma (`useSystemOptimization.ts:104`, canal
  `system-health`, sem dado sensível).
- Em modo `postgres_changes`, o Supabase Realtime aplica RLS no SELECT
  que faz para entregar a row ao subscriber. Subscriber não recebe rows
  de outros tenants.

A recomendação do scanner (habilitar policies em `realtime.messages`) é
best-practice para migrar para **Realtime Authorization** com private
channels — refactor grande sem ganho de segurança imediato, fica como
melhoria futura.

**Side finding (não-F-019):** `notifications.INSERT` e `audit_notifications.INSERT`
têm `WITH CHECK: true` — qualquer usuário autenticado pode inserir uma
notificação para qualquer outro usuário (cross-tenant inclusive). Não é
leak via WebSocket, mas é spam/phishing risk. Em backlog separado.

## P1 — detalhe

### F-007 a F-012 — Runtime errors de `.forEach/.filter/.map is not a function`

**Status: corrigido em commits anteriores.**

Verificado arquivo por arquivo — todos já têm o pattern
`Array.isArray(x) ? x : []`:

| Finding | Arquivo | Linha do guard |
|---|---|---|
| F-007 | `src/components/IntelligentAlertsSystem.tsx` | 74-75 |
| F-008 | `src/components/NonConformityTimelineModal.tsx` | 51 |
| F-009 | `src/components/EmployeeBenefitsModal.tsx` | 84-91 |
| F-010 | `src/pages/SeguracaTrabalho.tsx` | 57 |
| F-011 | `src/pages/DesenvolvimentoCarreira.tsx` | 114 |
| F-012 | `src/pages/GestaoRiscos.tsx` | 99 |

A auditoria foi gerada a partir de um snapshot E2E de 2026-02-23 — os
fixes foram aplicados em commits intermediários. Validação esperada na
re-auditoria: esses 6 findings devem sair do relatório.

Nota sobre F-010: a auditoria referencia `SegurancaTrabalho.tsx`, mas o
arquivo real é `SeguracaTrabalho.tsx` (typo no nome, sem o "n"). Existe
também `Seguranca.tsx` que é uma página estática diferente (política de
segurança pública, não SST).

### F-013 — `Invalid time value` em `new Date(x)` sem `parseDateSafe`

**Status: backlog (varredura ampla).**

Codebase tem 38 usos corretos de `parseDateSafe` e 5 usos defensivos de
`isValid(new Date(...))`, mas restam ~30 chamadas `format(new Date(x))`
sem guard em modais e dashboards. Exemplos:

- `src/components/ComplianceDashboard.tsx:237, 282`
- `src/components/TrainingCertificationModal.tsx:176, 180`
- `src/components/WasteLogDetailModal.tsx:68, 74`
- `src/components/NonConformityDetailsModal.tsx:381, 552, 599`

Fix recomendado, aplicado individualmente conforme cada componente é
tocado (sweep automático tem risco de regressão):

```tsx
// Antes
{format(new Date(x), "dd/MM/yyyy", { locale: ptBR })}
// Depois
{(() => {
  const d = parseDateSafe(x);
  return d ? format(d, "dd/MM/yyyy", { locale: ptBR }) : "—";
})()}
```

### F-020 a F-023 — Storage policies e linter

Backlog. Cada um é um PR de RLS/policy isolado. F-020 é o linter
reportando "RLS Disabled in Public" (identificar a tabela no dashboard
Supabase Linter). F-021, F-022 e F-023 são policies de bucket
(`documents`, `nc-evidence`, `reports`).

## P2 — detalhe

Todos backlog:

- **F-003** — 6 itens de menu redirecionam silenciosamente para
  `/dashboard` via blocos `!ENABLED_MODULES.X` no `App.tsx` — intencional
  para `esgGovernance` (DB live=false). Confirmado visualmente: seção
  GOVERNANÇA escondida no menu para Gabardo. Manter.
- **F-004** — conflito entre `routeModuleMap.ts:16` (`/ativos → esgEnvironmental`)
  e `enabledModules.ts:97` (`/ativos → dataReports`). Atualmente
  acessível (esgEnvironmental enabled), mas inconsistente. **Mesma classe
  do bug que motivou PR #59** (`/formularios-customizados`).
- **F-014** — Edge function `predictive-analytics` retorna empty state ruim.
  Solução: adicionar CTA "cadastrar emissões" no `PredictiveInsightsWidget`
  quando o retorno é "dados insuficientes".
- **F-024** — ~150 funções `SECURITY DEFINER` executáveis por qualquer
  signed-in user. Auditar e revogar EXECUTE de quem não precisa.
- **F-025** — 712 ocorrências de `as any` no codebase. Risco de mascarar
  bugs de schema. Tipar com `Database['public']['Tables']['…']['Row']`.

## P3 — detalhe

Todos backlog:

- **F-005** — `ROUTE_MODULE_MAP` não cobre todas as rotas protegidas
  (`/laia`, `/marketplace`, `/intelligence-center`, `/ia-insights`,
  `/painel-governanca`, `/admin/legislation-watchdog`). RBAC frouxo —
  ProtectedRoute libera sem checar módulo. Operacional, não bloqueia.
- **F-006** — drift entre `declaredRoutes.ts` (207 rotas) e `App.tsx`
  (299 paths). Aba "Rotas mortas" gera falsos positivos/negativos.
  Regenerar via `python3 scripts/extract-routes.py`.

## Notas sobre F-026 (P2 não listado no detalhe)

F-026 (4 services consultando tabelas sem filtro `.eq('company_id', ...)`
em `licenseAI.ts:189-192`) foi reclassificado: as tabelas envolvidas
(`license_ai_analysis`, `license_conditions`, `license_alerts`, `licenses`)
têm RLS escopada por company. O filtro explícito seria defesa em
profundidade, mas não há vazamento real. Backlog.

## PR mergeado durante esta sessão

- **#59** `fix(routes): formulários customizados bloqueado por dataReports desabilitado`
  — fora do escopo da auditoria, mas era um caso real do mesmo padrão (rota
  mapeada para módulo desabilitado no DB). Reportado pela Gabardo.
- **#60** `fix(rls): fechar vazamento cross-tenant em career plans, mentoring
  e laia audit` — F-015, F-016, F-018.

## Como re-rodar a auditoria no Lovable

1. Rode o mesmo prompt/skill que gerou `auditoria-bugs-2026-05-15.md`.
2. Compare os achados com este documento. Esperado:
   - F-001 sai do relatório (ou: `page_view_logs` saiu da lista de tabelas
     com RLS violation recente).
   - F-007 a F-012 saem do relatório (array guards em produção).
   - F-015, F-016, F-018 saem do relatório (scanner não acha mais cross-tenant).
   - F-019 ainda pode aparecer porque `realtime.messages` continua sem
     policy — comentar/justificar como decisão arquitetural.
   - F-017 ainda aparece — assumido como backlog próximo.
3. Se algum dos itens marcados como "corrigido" reaparecer, é regressão —
   investigar imediatamente.

## Tasks abertas que vieram desta auditoria

Internas (não-Lovable):

- F-002 (statement timeout): precisa instrumentação de queries do dashboard.
- F-013 (Invalid time value): sweep `format(new Date(x))` → `parseDateSafe`.
- F-014 (predictive-analytics empty state): adicionar CTA no widget.
- F-017 (supplier secrets): refactor `supplierManagementService` + edge function.
- INSERT spoofing `notifications`/`audit_notifications` (side de F-019).
- F-020 a F-023 (storage e linter): policies de bucket + RLS auditoria.
- F-004 (`/ativos` mapping conflict): alinhar `routeModuleMap` e `enabledModules`.
