# Auditoria Funcional Profunda — Levantamento de Bugs

## Objetivo

Varredura página por página + edge functions + RLS para identificar **bugs funcionais** (rotas quebradas, redirects errados, runtime errors, fluxos que falham). Entrega: relatório markdown navegável + tasks priorizadas no tracker.

## Sinais já conhecidos (baseline)

- `App.tsx` tem **323 `<Route>`** declaradas e **166 lazy imports** — risco de import quebrado.
- **23 rotas** redirecionam para `/dashboard` (módulos `financial`, `dataReports`, `esgGovernance` parcialmente desativados) — confirmado em App.tsx linhas 444–482, 985.
- `declaredRoutes.ts` lista 219 rotas — possível drift vs. App.tsx real.
- `ROUTE_MODULE_MAP` mapeia 30 paths; várias rotas declaradas (ex.: `/laia`, `/marketplace`, `/intelligence-center`, `/ia-insights`, `/painel-governanca`) **não estão mapeadas** → `ProtectedRoute` libera sem checagem de módulo.
- Conflito detectado: `/ativos` está marcado `esgEnvironmental` em `routeModuleMap` mas redirecionado por `dataReports` em `enabledModules.DISABLED_ROUTES`.
- Relatório E2E (`reports/e2e/playwright-error-report-2026-02-23.md`) já listou **11 rotas /demo** com erros de runtime (`.map is not a function`, `Invalid time value`, etc.) em 7 arquivos identificados.
- **712 ocorrências de `as any`** — pontos cegos de tipagem que mascaram bugs.
- Edge function `predictive-analytics` retorna warning recorrente: "Dados insuficientes: nenhum registro de emissões encontrado" — UX precisa de empty state.

## Escopo da auditoria

### 1. Roteamento e navegação
- Diff `DECLARED_ROUTES` ↔ `<Route>` reais em `App.tsx` (drift).
- Listar rotas que renderizam `<Navigate to="/dashboard">` e validar se ainda aparecem no menu / botões / links internos.
- Identificar rotas no `AppSidebar` que apontam para paths inexistentes em App.tsx.
- Validar `ROUTE_MODULE_MAP` × `ENABLED_MODULES`: rotas mapeadas para módulo desativado, e rotas de módulos ativos sem mapeamento (gap RBAC).
- Verificar links internos (`<Link to>`, `navigate(...)`) contra a lista canônica.

### 2. Páginas — varredura runtime
Para cada página acessível pela `MainLayout`, abrir no preview logado e capturar:
- erros do console
- falhas de rede (status >=400)
- error boundaries visíveis

Aplicar erros conhecidos do relatório E2E como checklist (7 arquivos já mapeados). Páginas prioritárias: `IntelligentAlertsSystem`, `NonConformityTimelineModal`, `EmployeeBenefitsModal`, `SegurancaTrabalho`, `DesenvolvimentoCarreira`, `GestaoRiscos`, `Licenciamento`, `ControleDocumentos`, `Auditoria/SGI`, `LAIA`, `FormDashboardPage`.

### 3. Fluxos críticos (smoke funcional)
- Auth: login, recuperação de senha, set-password, convite.
- Onboarding: empresa → filial → usuários → módulos.
- CRUD por módulo ativo: SGQ (NC, ação corretiva, doc), Fornecedores, Treinamentos, Licenças, Resíduos, Formulários customizados.
- Upload/anexo (Storage) + preview inline.
- Notificações realtime (sino + badge).
- Exportações (PDF/Excel) onde existirem.
- Multi-tenant: trocar empresa/filial e validar isolamento.

### 4. Backend — Supabase
- Rodar `supabase--linter` e classificar findings.
- Rodar `security--run_security_scan`.
- Inspecionar `postgres_logs` ERROR/WARNING dos últimos 7 dias.
- Logs de erro recentes das edge functions quentes: `daton-ai-chat`, `custom-forms-management`, `quality-management`, `manage-user`, `predictive-analytics`, `mtr-ocr-processor`.
- Validar que tabelas críticas têm RLS ativo (regra: `user_roles` é única autoridade).

### 5. Qualidade de dados / runtime defensivo
- Padrões frágeis: `.map/.filter/.forEach` sem guard, `new Date(x)` sem `parseDateSafe`, `JSON.parse` sem try/catch, `as any` em fronteiras.
- Uso correto de `parseDateSafe`, `formatDateDisplay`, `formatDateForDB`.
- Queries Supabase sem filtro `company_id` (regra multi-tenant).

## Metodologia

1. **Estática** (scripts via `code--exec`): diffs de rotas, grep estruturado, lista de imports lazy quebrados.
2. **Dinâmica** (browser tool): sweep de cada rota protegida ativa, coletando console + network + DOM. Smoke dos fluxos da seção 3.
3. **Backend**: linter + security scan + logs (postgres + edge functions).

## Entregáveis

1. **Relatório** `docs/audits/auditoria-bugs-2026-05-15.md`:
   - sumário executivo (contagens por severidade)
   - seção por área (roteamento, páginas, fluxos, backend, dados)
   - cada achado: ID, título, severidade, evidência (`arquivo:linha` ou screenshot), reprodução, correção sugerida
   - anexos: tabelas de drift, redirects, edge functions com erro
2. **Tasks no tracker** para itens **P0 e P1** com link para a seção do relatório. P2/P3 ficam só no relatório.

## Severidade

- **P0** — quebra a aplicação (tela em branco, error boundary, fluxo crítico falha, dado vazando entre tenants).
- **P1** — funcionalidade não opera mas app não cai (botão sem efeito, link morto, CRUD parcial).
- **P2** — UX degradada (empty state ruim, redirect silencioso para `/dashboard`).
- **P3** — débito funcional (rota sem uso, item de menu sem destino útil).

## Estimativa

~2–3h de execução. Sem alterações de código durante a auditoria — só leitura, navegação e geração do relatório/tasks. Correções entram em PRs subsequentes após sua priorização.
