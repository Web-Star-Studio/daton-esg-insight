# Auditoria Funcional Profunda — Bugs e Riscos

- **Data:** 2026-05-15
- **Escopo:** Funcional/Bugs (rotas, runtime, backend, dados, segurança que vira bug)
- **Profundidade:** 5/5
- **Método:** estática (regex + node) + Supabase linter + security scan + analytics_query (Postgres/Edge logs) + relatório E2E pré-existente

---

## Sumário Executivo

| Severidade | Total |
|---|---|
| **P0** (quebra app / vazamento de dados) | **6** |
| **P1** (funcionalidade não opera) | **9** |
| **P2** (UX degradada) | **5** |
| **P3** (débito funcional) | **4** |
| **Total** | **24** |

Sinais agregados:
- Linter Supabase: **179** issues (1 ERROR + 178 WARN, com forte concentração em `SECURITY DEFINER` exposto e `search_path` mutável).
- Scanner Lovable bespoke: **8** findings críticos (4 ERROR de RLS/escopo de empresa, 3 WARN de storage, 1 WARN auth).
- Postgres logs (últimas 24h): **2** classes de erro (`statement timeout`, `RLS violation em page_view_logs`).
- App.tsx: **323 rotas**, **160 lazy imports** — todos resolvem corretamente (zero imports quebrados).
- Sidebar dead-links após pruning: **0** (pruning estático funcionando).
- Relatório E2E (2026-02-23): **11 rotas /demo** com runtime errors em **7 arquivos** já mapeados.
- `as any` no codebase: **712** ocorrências (top: `sgqIsoDocuments.ts: 54`, `documentCenter.ts: 47`).

---

## 1. Roteamento e Navegação

### F-001 [P0] RLS bloqueia inserção em `page_view_logs`
- **Evidência:** `analytics_query` postgres_logs: `new row violates row-level security policy for table "page_view_logs"` (recorrente, último 2026-05-15 19:53Z).
- **Impacto:** O sistema de analytics (que alimenta a aba "Rotas mortas" em `UsageAnalyticsTab`) **não está gravando page views**. Toda métrica de uso por rota está zerada/desatualizada.
- **Reprodução:** qualquer navegação autenticada → erro silencioso no backend.
- **Correção:** revisar policy de INSERT em `page_view_logs` para aceitar `auth.uid() IS NOT NULL` ou `company_id = get_user_company_id()`.

### F-002 [P0] Statement timeout em queries Postgres
- **Evidência:** `canceling statement due to statement timeout` (postgres_logs).
- **Impacto:** Algum widget/dashboard está rodando query >8s e falhando silenciosamente. Gera tela em branco ou empty state enganoso.
- **Próximo passo:** instrumentar timing nas queries do Dashboard (`PredictiveInsightsWidget`, `IntegratedReports`, `ESG Dashboard`) e identificar a query lenta. Adicionar índice ou paginar.

### F-003 [P2] 6 itens de menu redirecionam silenciosamente para /dashboard
- **Evidência:** App.tsx linhas 477–482; módulo `esgGovernance: false` em `enabledModules.ts`. Itens: `/governanca-esg`, `/gestao-riscos`, `/compliance`, `/auditoria`, `/gestao-stakeholders`, `/analise-materialidade`.
- **Impacto:** Pruning do sidebar usa `isRouteDisabled` em runtime e DEVE escondê-los, mas presença no `<AppSidebar>` source aumenta superfície de regressão.
- **Correção:** confirmar visualmente em produção que estão fora do menu; se sim, remover do source para reduzir manutenção.

### F-004 [P2] Conflito entre `routeModuleMap` e `enabledModules`
- **Evidência:** `/ativos` mapeado para `esgEnvironmental` em `routeModuleMap.ts:16` mas redirecionado por `dataReports` em `enabledModules.ts:97`.
- **Impacto:** Comportamento inconsistente — a guarda do `ProtectedRoute` libera, mas `App.tsx` redireciona (depende de qual módulo estiver desabilitado).
- **Correção:** alinhar para um único módulo (provavelmente `dataReports`).

### F-005 [P3] 16 rotas declaradas em `routeModuleMap` mas várias rotas reais sem mapeamento
- **Evidência:** rotas como `/laia`, `/marketplace`, `/intelligence-center`, `/ia-insights`, `/painel-governanca`, `/admin/legislation-watchdog` não aparecem em `ROUTE_MODULE_MAP` → `ProtectedRoute` libera sem checagem de módulo.
- **Impacto:** RBAC frouxo — usuários sem permissão no módulo conseguem acessar via URL direta.
- **Correção:** mapear todas as rotas protegidas para um `moduleKey` em `routeModuleMap.ts`.

### F-006 [P3] Drift `declaredRoutes.ts` × `App.tsx`
- **Evidência:** `declaredRoutes.ts` lista 207 rotas únicas; App.tsx tem 299 paths declarados (com nested). Faltam ~80 rotas no canônico.
- **Impacto:** A aba "Rotas mortas" (que compara contra essa lista) gera falsos negativos/positivos.
- **Correção:** rodar `python3 scripts/extract-routes.py` e regenerar.

---

## 2. Páginas — Runtime Errors Conhecidos (Relatório E2E 2026-02-23)

Estes 7 achados continuam pendentes (mesmo arquivo, mesmas linhas no código atual):

### F-007 [P1] `IntelligentAlertsSystem.tsx:104,178` — `upcomingConditions.forEach/.filter is not a function`
- **Reprodução:** abrir `/demo/licenciamento` ou rota que renderize o componente sem dados.
- **Correção:** `Array.isArray(upcomingConditions) ? upcomingConditions : []`.

### F-008 [P1] `NonConformityTimelineModal.tsx:99` — `timeline?.map is not a function`
- **Reprodução:** abrir modal de timeline em NC sem histórico.
- **Correção:** normalizar `timeline` para array antes de renderizar.

### F-009 [P1] `EmployeeBenefitsModal.tsx:85,181` — `enrollments.map is not a function`
- **Correção:** mesma técnica (guard + default `[]`).

### F-010 [P1] `SegurancaTrabalho.tsx:148` — `inspections.filter is not a function`
- **Reprodução:** página de Segurança do Trabalho sem inspeções cadastradas.
- **Correção:** garantir array vazio em fallback do hook.

### F-011 [P1] `DesenvolvimentoCarreira.tsx:131` — `careerPlans?.filter is not a function`
- **Correção:** `Array.isArray(careerPlans) ? careerPlans : []`.

### F-012 [P1] `GestaoRiscos.tsx:321` — `riskMatrices?.map is not a function`
- **Correção:** idem.

### F-013 [P1] Múltiplas páginas — `Invalid time value`
- **Causa:** `new Date(x)` em string vazia/null sem `parseDateSafe`.
- **Correção:** auditar e substituir por `parseDateSafe` (regra de memória core).

### F-014 [P2] Edge function `predictive-analytics` retorna empty state ruim
- **Evidência:** logs recorrentes "Dados insuficientes: nenhum registro de emissões encontrado".
- **Impacto:** widget `PredictiveInsightsWidget` provavelmente renderiza vazio sem CTA de "cadastrar emissões".
- **Correção:** adicionar empty state com link para `/inventario-gee`.

---

## 3. Backend / Supabase

### F-015 [P0] **Career Development Plans expostos entre empresas** (cross-tenant leak)
- **Scanner Lovable:** ERROR `MISSING_COMPANY_SCOPE`.
- **Detalhe:** policy ALL com `auth.role() = 'authenticated'` — **qualquer usuário lê/escreve planos de carreira de qualquer empresa**.
- **Correção:** trocar para `company_id = get_user_company_id()`.

### F-016 [P0] **Mentoring Relationships expostas entre empresas**
- **Scanner Lovable:** ERROR. Mesmo padrão de F-015.
- **Correção:** idem.

### F-017 [P0] **Senhas de fornecedores legíveis por todos os usuários da empresa**
- **Scanner Lovable:** ERROR `EXPOSED_SENSITIVE_DATA`.
- **Detalhe:** `supplier_management.password_hash` e `temporary_password` retornam em SELECT escopado por company. Viewer/auditor consegue ler.
- **Correção:** policy SELECT com lista de colunas excluindo as duas; ou mover para tabela separada com policy mais restrita.

### F-018 [P0] **Tabela de auditoria interna `_laia_sectors_rename_audit_20260514` sem RLS, publicamente legível**
- **Scanner Lovable:** ERROR `MISSING_RLS_PROTECTION`. 306 linhas com `company_id`, `branch_id`, dados operacionais de múltiplos tenants.
- **Correção:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policy por company. Ou dropar se foi tabela temporária de migration.

### F-019 [P0] **Realtime sem autorização — qualquer usuário escuta canais de qualquer empresa**
- **Scanner Lovable:** ERROR `REALTIME_MISSING_AUTHORIZATION`.
- **Impacto:** notificações, audit_notifications, document_extraction_jobs vazam entre tenants via WebSocket.
- **Correção:** habilitar Realtime Authorization (policies em `realtime.messages`).

### F-020 [P1] Linter: **1 ERROR "RLS Disabled in Public"**
- Identificar a tabela exata pelo dashboard linter e habilitar RLS imediatamente.

### F-021 [P1] Storage: bucket `documents` aceita upload em qualquer path por qualquer usuário autenticado
- **Scanner:** WARN. INSERT policy `auth.uid() IN (SELECT id FROM profiles)`.
- **Correção:** restringir ao folder `<company_id>/...`.

### F-022 [P1] Storage: bucket `nc-evidence` legível **sem autenticação**
- **Scanner:** WARN. SELECT sem `auth.uid() IS NOT NULL`.
- **Correção:** adicionar check de auth + escopo por company.

### F-023 [P1] Storage: bucket `reports` legível por qualquer usuário autenticado de qualquer empresa
- **Scanner:** WARN. Restringir ao folder da empresa.

### F-024 [P2] Linter: ~150 funções `SECURITY DEFINER` executáveis por qualquer signed-in user
- Auditar uma a uma; revogar EXECUTE de quem não precisa.

---

## 4. Qualidade de Dados / Padrões Frágeis

### F-025 [P2] 712 ocorrências de `as any` no projeto
- **Top services:** `sgqIsoDocuments.ts (54)`, `documentCenter.ts (47)`, `legislationReportExport.ts (28)`, `stakeholderRequirements.ts (27)`.
- **Risco:** mascara bugs de schema. Recomendado tipar com `Database['public']['Tables']['...']['Row']`.

### F-026 [P2] 4 services consultam tabelas sem filtro `company_id` aparente
- `licenseAI.ts:189-192` consulta `license_ai_analysis`, `license_conditions`, `license_alerts`, `licenses` sem `.eq('company_id', ...)`.
- **Impacto:** se RLS estiver fraca, retorna dados cross-tenant. Validar RLS dessas 4 tabelas e adicionar filtro explícito por defesa em profundidade.

---

## Anexos

### A1. Rotas redirecionadas para `/dashboard` (módulos desativados)
Total: **23**. Listadas em `App.tsx:444-485` e `985`. Atualmente desativados: `financial`, `esgGovernance`. Os de `dataReports` foram reativados.

### A2. Edge functions sem erros 5xx nas últimas 72h
`function_edge_logs` com `status_code >= 500`: **0 ocorrências**. Bom sinal, mas warnings de "dados insuficientes" continuam (ver F-014).

### A3. Comandos para reproduzir esta auditoria
```bash
rg -nP '<Route\s+path="([^"]+)"' src/App.tsx -or '$1' | sort -u
rg -N -oP 'path:\s*"\K(/[^"]*)' src/components/AppSidebar.tsx | sort -u
# linter: tool supabase--linter
# security scan: tool security--run_security_scan
# postgres errors: analytics_query em postgres_logs
```
