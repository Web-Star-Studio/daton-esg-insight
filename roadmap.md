# Roadmap — Virada para LP-only

Objetivo: este projeto vira apenas a landing page institucional. O sistema vive em painel.daton.com.br. A pasta `supabase/` (banco, functions, migrations) é mantida intacta para futura migração de dados para a v2.

## Etapas

1. [x] Backup: `daton-sistema-completo-backup-2026-10-22.tar.gz` em Files (64 MB) + git history
2. [x] Novo `src/App.tsx` enxuto: só rotas da LP + catch-all → painel; sem AuthProvider/CompanyProvider/DemoProvider/QueryClient
3. [x] Código morto apagado: ~160 páginas do sistema, services, hooks, contexts, middleware, data demo, schemas, testes antigos, portal do fornecedor
4. [x] Arquivos órfãos removidos (RouteValidator, routeModuleMap, enabledModules, declaredRoutes, scripts soltos, E2E, service worker)
5. [x] Typecheck (`tsgo`) + build de produção verdes
6. [x] Verificado no browser: LP abre sem erros, "INICIAR AGORA" presente, /auth → painel.daton.com.br, /privacidade OK
7. [x] package.json: 65 dependências removidas, scripts e2e removidos, `test` agora roda vitest de verdade
8. [x] AGENTS.md / CLAUDE.md atualizados para o repo LP-only

## Pendente (decisão do usuário)

- [ ] Publicar para daton.com.br entrar no ar como LP-only

## Contato comercial — 2026-10-27
- [x] Destinatário confirmado: felipe@webstar.studio; Resend conectado.
- [ ] Confirmar remetente verificado no Resend: a chave permite enviar, mas não consultar domínios; teste não executado.
- [ ] Ajustar formulário comercial e envio com validação, confirmação e tratamento de falhas, sem modificar acesso ao demo ou dados legados.
- [ ] Verificar envio real e recebimento antes de concluir.
