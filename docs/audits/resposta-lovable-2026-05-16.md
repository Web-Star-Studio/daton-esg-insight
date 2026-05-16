# Resposta à auditoria Lovable de 2026-05-16 15:55

**Resumo:** a maior parte das findings reportadas como "P0 ainda em aberto" **já foi corrigida** entre a auditoria anterior e a atual. Verificado ao vivo no banco (não em cache) via `mcp__supabase__get_advisors` + queries diretas em `pg_policy` / `pg_policies` em 2026-05-16 ~14:00 UTC.

A Lovable parece ter olhado um snapshot anterior — pedimos que ela **re-puxe schema + advisors atualizados** antes de re-classificar.

---

## 1. "Build quebrado" — falso positivo

| Claim Lovable | Realidade |
|---|---|
| 13 erros TS em `types.ts` editado manualmente | `npx tsc --noEmit` → **exit 0, zero erros** |
| "violando a regra NEVER edit types.ts" | `git log src/integrations/supabase/types.ts` mostra que as últimas 3 edições foram do **`gpt-engineer-app[bot]` (a própria Lovable)**, não desta sessão |

**Não há necessidade de regenerar `types.ts`.** O build compila limpo.

---

## 2. Findings F-019…F-024 — TODAS fechadas

| Finding | Estado no banco (verificado via SQL agora) | PR |
|---|---|---|
| **F-019** Realtime sem RLS | `realtime.messages` tem 2 policies (`authenticated_realtime_subscribe`, `authenticated_realtime_broadcast`). 16 `.channel()` no cliente passaram a `{ config: { private: true } }`. | **#87** (mergeado) |
| **F-020** bucket `documents` sem company scope | 5 services refatorados (`documents.ts`, `documentCenter.ts`, `licenses.ts`, `waste.ts`, `mtrDocuments.ts`) pra usar `${company_id}/...`. Edge function `license-document-analyzer` valida path. 3.423 órfãos `temp/*` (158 MB) + 298 `temp-vision-*` (11 MB) apagados. | **#82, #83, #84, #85** |
| **F-021** `nc-evidence` | 3 policies escopadas via `non_conformities.company_id = get_user_company_id()` | **#71** |
| **F-022** `reports` | 3 policies escopadas via `licenses.company_id` | **#70** |
| **F-023** `audit-evidence` | 3 policies escopadas via `audits.company_id`. Frontend usa `createSignedUrl` (bucket privado). | **#69** |
| **F-024** `leave_types` | 2 policies, **0 com `USING(true)`** (verificado: `SELECT COUNT(*) FROM pg_policies WHERE tablename='leave_types' AND qual='true'` → 0) | **#68** |
| **PR extra E** | `gri-documents` (upload estava quebrado por path mismatch) + `audit-attachments` (path tenant-scoped) | **#86** |

**Auth Leaked Password Protection:** habilitado pelo usuário no Dashboard (Authentication → Providers → Password Settings). O advisor atual **não lista mais** essa warning.

---

## 3. Linter atual — 169 findings (não 173)

Rodado via `mcp__supabase__get_advisors` (security). Quebra:

| Categoria | Qtd | Severity | Status |
|---|---|---|---|
| `authenticated_security_definer_function_executable` | 83 | WARN | Helpers RLS legítimos (ver §4) |
| `anon_security_definer_function_executable` | 82 | WARN | Idem |
| `public_bucket_allows_listing` (avatars, form-logos) | 2 | WARN | Buckets públicos por design |
| `extension_in_public` (pg_net) | 1 | WARN | Cosmético — mover schema |
| `rls_policy_always_true` (page_view_logs INSERT) | 1 | WARN | Design (analytics) — ver §5 |
| **ERROR** | **0** | — | — |

**Zero findings ERROR.** Os 169 são todos `WARN`.

---

## 4. SECURITY DEFINER — análise honesta

- Linter conta **165 entradas** (83 + 82) porque conta cada função × cada role com EXECUTE.
- Em funções **únicas**, são apenas **29** funções SECURITY DEFINER com EXECUTE granted (validado via `pg_proc` + `information_schema.role_routine_grants`).
- Rodada anterior (PRs #73-#76) fechou 78 funções via `REVOKE EXECUTE`.
- As 29 restantes são **helpers chamados de dentro de RLS policies** (`get_user_company_id`, `is_platform_admin`, etc.) — REVOKE quebraria o RLS de várias tabelas. Confirmado item-a-item na rodada anterior.

**Recomendação:** marcar como tech-debt "by design", não P0.

---

## 5. `page_view_logs` policy permissiva — design intencional

```sql
"Anyone can insert page views" — INSERT, with_check: true
"Platform admins can read page views" — SELECT, is_platform_admin()
"Users can update their own page views" — UPDATE, user_id = auth.uid()
```

- INSERT permissivo: é tracking de pageview (analytics). Sem PII no insert path — só registra navegação.
- SELECT é **gated por `is_platform_admin()`** — usuários comuns não leem.
- Não vaza dados; apenas permite logar.

**Recomendação:** classificar como "design intencional", não vulnerabilidade.

---

## 6. Backlog real

Pontos legítimos sem urgência:

1. **`pg_net` em `public`** → mover pra schema dedicado. 1 migration trivial.
2. **`avatars` / `form-logos` listáveis** → adicionar policy SELECT restritiva por bucket-owner ou aceitar como público intencional. Refactor cosmético.
3. **Realtime Authorization endurecido** → trocar `USING (true)` em `realtime.messages` por filtros por topic (`notifications-<auth.uid()>`). Incremento futuro de defesa-em-camadas.
4. **15 órfãos legacy** `{ts}-{rand}.ext` na raiz do bucket `documents` (1.8 MB) — bug do `documentCenter.ts` que o PR #85 fechou. Cleanup quando conveniente.
5. **P1 Frontend (task 2d002af2 da Lovable)** — 7 arquivos com `.map`/datas sem guards. **A Lovable não enviou os nomes dos arquivos** — pedimos a lista pra atacar.

---

## 7. PRs desta sessão (10)

| PR | Escopo |
|---|---|
| #82 | F-020 Fase 1 — `temp/` cleanup + edge function hardening |
| #83 | Edge function `license-document-analyzer` filePath validation |
| #84 | `documents.ts:uploadDocument` company prefix |
| #85 | 4 sites restantes bucket `documents` (documentCenter/licenses/waste/mtr) |
| #86 | gri-documents (upload destravado) + audit-attachments tenant-scoped |
| #87 | F-019 Realtime Authorization + 16 channels `private: true` + teardown fix |
| #68-#71 | F-022/F-023/F-024 buckets + leave_types (rodada anterior) |
| #73-#76 | SECURITY DEFINER cleanup wave 1-4 (78 funções) |
| #77-#81 | F-026 + `as any` cleanup |

---

## Pedido à Lovable

1. **Re-puxar advisors** ao vivo via Supabase CLI / API (não usar snapshot anterior).
2. **Confirmar via SQL** as 6 findings P0 que foram classificadas como "ainda em aberto" — todas estão fechadas no banco.
3. **Enviar a lista dos 7 arquivos** com guards faltantes (task 2d002af2).
4. **Não regenerar `types.ts`** — `tsc --noEmit` passa.

Se ainda houver finding P0/ERROR real após re-scan, mandar nome + alvo (schema.table ou função) específico pra atacarmos.
