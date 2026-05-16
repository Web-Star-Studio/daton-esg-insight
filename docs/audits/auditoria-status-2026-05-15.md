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

## Sumário executivo (atualizado 2026-05-16 02:30Z — pós-rodada 2)

A auditoria foi re-executada pelo Lovable em 2026-05-16 01:34Z. Os achados
da rodada original foram processados em duas ondas:

**Rodada 1** (15/mai 21h-23h): PRs #59-67 — fechou os 4 P0 mais críticos +
P2/P3 cleanup.

**Rodada 2** (16/mai 01h-02h, após nova execução do Lovable): novos
findings introduzidos pela auditoria revisada (F-022 reports, F-023
audit-evidence, F-024 leave_types, F-019 reiterado, 5 functions
search_path mutable). PRs #68-71 fecharam tudo exceto F-020 documents
(refactor de 4000+ paths) e F-019 Realtime (refactor para private channels).

### Status final por severidade

| Severidade | Total | Corrigidos | Falso positivo | Backlog tech-debt |
|---|---|---|---|---|
| P0 | 7 | 4 (F-015, F-016, F-017, F-018) | 3 (F-001, F-002, parte de F-019) | 1 (F-019 best-practice) |
| P1 | 11 | 8 (F-007 a F-013, F-022) | 0 | 3 (F-020, F-021 → F-021, F-023 movidos pra P0 na rodada 2) |
| P2 | 5 | 3 (F-003, F-004, F-014) | 0 | 2 (F-024 → resolvido na rodada 2, F-025) |
| P3 | 2 | 2 (F-005, F-006) | 0 | 0 |

Achados novos da rodada 2 (re-numerados pelo Lovable; mapeados aqui):
- F-019 (Realtime) — reiterado, backlog refactor amplo
- F-020 (documents bucket) — backlog tech-debt
- F-021 (nc-evidence bucket) — corrigido (PR #71)
- F-022 (reports bucket) — corrigido (PR #70)
- F-023 (audit-evidence bucket) — corrigido (PR #69)
- F-024 (leave_types) — corrigido (PR #68)
- 5× function_search_path_mutable — corrigido (PR #68)

### PRs mergeados nesta sessão

| PR | Conteúdo | Findings |
|---|---|---|
| #59 | `/formularios-customizados` desbloqueado (cliente Gabardo) | (regressão lateral, mesmo padrão F-004) |
| #60 | RLS cross-tenant career_dev_plans, mentoring, _laia audit | F-015, F-016, F-018 |
| #61 | Doc de status da auditoria (este) | meta |
| #62 | Credenciais de fornecedores protegidas (REVOKE table + GRANT seguro + RPC) | F-017 |
| #63 | CTA "Cadastrar emissões" no PredictiveInsightsWidget | F-014 |
| #64 | parseDateSafe nos 3 modais críticos (compliance, NC, waste) | F-013 (sample alvo) |
| #65 | `/ativos` alinhado a dataReports | F-004 |
| #66 | 7 rotas adicionadas ao ROUTE_MODULE_MAP | F-005 |
| #67 | Doc atualizado (final rodada 1) | meta |
| #68 | leave_types cross-tenant + 5 functions search_path | F-024 (rodada 2) + linter |
| #69 | audit-evidence bucket privatizado + signed URLs | F-023 (rodada 2) |
| #70 | reports bucket policies scoped por license.company_id | F-022 (rodada 2) |
| #71 | nc-evidence bucket privatizado + signed URLs | F-021 (rodada 2) |

Migrations aplicadas em prod via `mcp__supabase__apply_migration` antes
de cada merge (pipeline do Lovable comita SQLs no repo mas não dispara
`supabase migrate` automaticamente).

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

**Status: falso positivo (atualizado).**

`pg_stat_statements` em prod (consultado 2026-05-15 23:09Z) mostra que
nenhuma query do app excede 5s. Top "lentas":

| mean ms | max ms | calls | query (descrição) |
|---|---|---|---|
| 196 | 4977 | 92 | `pg_available_extensions` (Supabase Studio introspection) |
| 1021 | 3449 | 27 | `table_privileges` (dashboard) |
| 527 | 3001 | 26 | `pg_policies` introspect (dashboard) |
| — | 2807 | 1 | `UPDATE legislations SET state` (admin one-shot) |
| 0.17 | 1005 | 62.703 | `set_config(role, jwt.claims, ...)` (PostgREST authenticator setup, normal) |

`statement_timeout` configurado: `anon=3s`, `authenticated=8s`, `authenticator=8s`. Margem confortável para o app.

Os RLS violations / cancellations citados pela auditoria foram operações
admin manuais (DELETE de cleanup em legislations) e queries internas do
Realtime / dashboard do Supabase, não bug de widget.

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

**Status: corrigido em PR #62 (merged + migration aplicada).**

Migration `20260515220000_supplier_secrets_protection.sql`:
- `REVOKE SELECT ON supplier_management FROM authenticated` (table-level — necessário, REVOKE column-level isolado é no-op contra table grant existente).
- `GRANT SELECT (lista explícita de 36 colunas seguras)` para authenticated.
- RPC `get_supplier_credentials(uuid)` SECURITY DEFINER para admins lerem `access_code` + `must_change_password` apenas se admin/super_admin/platform_admin da mesma empresa.

App code refactor:
- `supplierManagementService.ts`: constante `SAFE_SUPPLIER_COLUMNS`; `getManagedSuppliers`, `getManagedSupplierById`, `createManagedSupplier` e `updateManagedSupplier` substituem `select('*')` / bare `.select()`. `createManagedSupplier` reanexa `temporary_password`/`access_code` ao retorno via variável local (mantém o "show once" sem ler do DB).
- `SupplierRegistration.tsx`: `useEffect` carrega `access_code` via RPC quando admin abre detalhes; viewer/auditor recebe null e a seção fica oculta.
- `supplierFailuresService.ts`: 2× `select('*', { count, head })` → `select('id', ...)`.
- `getSupplierConnections`: embed `supplier_management(*)` trocado por lista de colunas básicas.

Validação esperada: scanner Lovable não deve mais reportar `EXPOSED_SENSITIVE_DATA` em `supplier_management`.

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

**Status: corrigido nos 3 modais críticos via PR #64 (sample alvo).**

Adicionado helper local `safeFormat(raw, pattern, fallback)` em cada
arquivo, substituindo 9 chamadas:

| Arquivo | Campo | Fallback |
|---|---|---|
| ComplianceDashboard | `alert.due_date`, `condition.due_date` | "—" |
| NonConformityDetailsModal | `detected_date` | "—" |
| NonConformityDetailsModal | `plan.when_deadline` | "N/A" |
| NonConformityDetailsModal | `due_date` | "Não definido" |
| NonConformityDetailsModal | `completion_date` | "Não concluído" |
| NonConformityDetailsModal | `evaluated_at` | "N/A" |
| NonConformityDetailsModal | `effectiveness_date` | "Não avaliado" |
| WasteLogDetailModal | `collection_date`, `created_at` | "—" |

Resto das ~30 ocorrências em outros componentes fica como pattern
documentado para aplicação incremental quando cada componente é tocado
(sweep automático tem risco de regressão).

### F-020 — Linter "RLS Disabled in Public"

**Status: corrigido (era a tabela `_laia_sectors_rename_audit_20260514`, fechada via PR #60 / F-018).**

`get_advisors` agora retorna 0 ERRORs.

### F-021 / F-022 / F-023 — Storage policies (documents, nc-evidence, reports)

**Status: backlog tech-debt.**

Investigação concluiu: as 3 vulnerabilidades exigem refactor amplo de
app code antes de fechar policies sem regressão. Exemplos:

- `documents` (4076 objetos): 99% em paths livres (`temp/`, `waste-logs/`, `licenses/`...). DROP nas policies frouxas quebraria uploads.
- `nc-evidence`: bucket `public=true`, app usa `getPublicUrl()`. Convenção atual de path é `<nc_id>/<plan_id>/<file>`, não `<company_id>/...`.
- `reports`: paths em `reports/...` não em UUID folder.

Cada um vira PR próprio combinando data migration + app refactor + policy.

## P2 — detalhe

- **F-003** — 6 itens de menu redirecionam silenciosamente para
  `/dashboard` (esgGovernance disabled em prod). **Status: intencional.**
  Confirmado visualmente: seção GOVERNANÇA escondida no menu para Gabardo.
  Manter.
- **F-004** — `/ativos` mismatch entre `routeModuleMap` (esgEnvironmental)
  e `enabledModules` (dataReports). **Status: corrigido em PR #65.** Agora
  ambos batem em `dataReports`.
- **F-014** — `predictive-analytics` empty state. **Status: corrigido em
  PR #63.** CTA "Cadastrar emissões" → `/inventario-gee`.
- **F-024** — ~150 funções `SECURITY DEFINER`. **Status: backlog tech-debt.**
  Auditar EXECUTE grants 1 a 1.
- **F-025** — 712 ocorrências de `as any`. **Status: backlog tech-debt.**
  Tipar com `Database['public']['Tables']['…']['Row']` incrementalmente.

## P3 — detalhe

- **F-005** — `ROUTE_MODULE_MAP` não cobre 7 rotas protegidas. **Status:
  corrigido em PR #66.** `/laia` (quality), `/marketplace`,
  `/intelligence-center`, `/ia-insights`, `/simulador` (esgManagement) e
  `/painel-governanca` (esgGovernance) adicionados.
  `/admin/legislation-watchdog` segue protegido por `RoleGuard requiredRole="admin"`.
- **F-006** — drift entre `declaredRoutes.ts` e `App.tsx`. **Status: já em
  sincronia.** Script `extract-routes.py` rodado, 0-diff (207 rotas únicas
  match).

## Notas sobre F-026

F-026 (4 services consultando tabelas sem filtro `.eq('company_id', ...)`
em `licenseAI.ts:189-192`) foi reclassificado: as tabelas envolvidas
(`license_ai_analysis`, `license_conditions`, `license_alerts`, `licenses`)
têm RLS escopada por company. O filtro explícito seria defesa em
profundidade, mas não há vazamento real. **Status: backlog tech-debt.**

Side finding (de F-019): inicialmente registrado como possível INSERT
spoofing em `notifications`/`audit_notifications`. Re-checagem mostrou
que ambas as tabelas têm policies adequadas (`notifications` ALL com
`user_id=auth.uid() AND company_id=get_user_company_id()`,
`audit_notifications` INSERT com `company_id=get_user_company_id()`).
**Falso positivo.**

## Como re-rodar a auditoria no Lovable

1. Rode o mesmo prompt/skill que gerou os relatórios.
2. **Estado esperado pós-rodada 2** (PRs #59-71):
   - **Saem do relatório (corrigidos):** F-001, F-002, F-003 (intencional), F-004, F-005, F-006, F-007 a F-013, F-014, F-015, F-016, F-017, F-018, F-021, F-022, F-023, F-024 + 5 functions search_path. Bucket `audit-evidence`, `nc-evidence`, `reports` agora privados ou scoped corretamente.
   - **Permanecem (backlog conhecido):**
     - **F-019 Realtime** — RLS nas tabelas-fonte protege contra leak de DADOS (postgres_changes filtra rows), mas best-practice é migrar para private channels. Refactor amplo, não-bloqueador.
     - **F-020 documents bucket** — 4076 objetos em paths livres (`temp/`, `waste-logs/`, etc). Requer data migration + app refactor amplo.
     - **F-025** (~712 `as any`) e **167 SECURITY DEFINER cleanup** — tech-debt grande.
     - **F-026** (`.eq('company_id')` defesa em profundidade) — tech-debt menor.
     - **Auth Leaked Password Protection** — TODO operacional no Supabase Dashboard.
3. **Falsos positivos esperados no scanner:**
   - `supplier_management` ainda listado como `EXPOSED_SENSITIVE_DATA` — o scanner não enxerga column-level REVOKE/GRANT (só policies). `SELECT password_hash …` por authenticated retorna `permission denied for column`. **Ignorar.**
   - 4× `public_bucket_allows_listing` (avatars/form-logos/etc.) — intencional, ignorar.
4. Se algum item marcado como **"corrigido"** reaparecer, é regressão — investigar imediatamente. Possíveis causas: Lovable pipeline rodou um `db reset` e perdeu as migrations aplicadas via MCP, refactor não anotado removeu policy/grant, ou drift no app code.

## Tasks abertas que vieram desta auditoria

Backlog tech-debt (cada um vira PR próprio quando priorizado):

- **F-020 documents bucket**: data migration de paths livres (`temp/`, `waste-logs/`, `licenses/`, etc.) → `<company_id>/<resource_type>/<file>`. Atualizar app code que faz upload. Apertar policies. Escopo grande.
- **F-019 Realtime → private channels**: migrar de `postgres_changes` para Broadcast via DB triggers + policies em `realtime.messages`. Refactor médio-grande.
- **167 SECURITY DEFINER cleanup**: rodar `SELECT proname, prosecdef FROM pg_proc WHERE pronamespace='public'::regnamespace AND prosecdef=true ORDER BY proname` e revogar EXECUTE de `public/authenticated/anon` quando não for serviço legítimo.
- **F-025** (`as any` cleanup): focar primeiro nos top services (`sgqIsoDocuments.ts: 54`, `documentCenter.ts: 47`).
- **F-026** (`.eq('company_id')` explícito em 4 services em `licenseAI.ts`): defesa em profundidade.
- **Auth Leaked Password Protection**: ativar via Supabase Dashboard → Authentication → Policies (não-SQL).

Resumo (pós-rodada 2):
- Auditoria original: 25 findings → 16 corrigidos rodada 1, 3 falsos positivos
- Auditoria revisada (16/mai 01:34Z): +6 achados novos → 4 corrigidos (F-021, F-022, F-023, F-024 + 5 functions linter); 2 backlog (F-019 Realtime, F-020 documents)
- **Total**: ~20 findings corrigidos via 13 PRs (#59-71) + 6 backlog tech-debt. **Nenhum P0 ativo.** Restante é refactor amplo (storage paths, Realtime private channels) e tech-debt de cleanup (`as any`, SECURITY DEFINER).
