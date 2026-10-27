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

- [x] Publicação solicitada para daton.com.br como LP-only (2026-10-27)

## Contato comercial — 2026-10-27
- [x] Destinatário confirmado: felipe@webstar.studio; Resend conectado.
- [x] Remetente contato@daton.com.br aceito pelo Resend no teste para João.
- [x] Formulário comercial e função isolada implantados com validação compartilhada, confirmação e tratamento de falhas; demo e dados legados preservados.
- [x] Recebimento confirmado pelo usuário (caixa de João, 2026-10-27). Envio direto a Felipe segue sem teste próprio; pedidos comerciais continuam destinados a ele.
- [x] Teste identificado para joao@webstar.studio aceito pelo Resend; pedidos comerciais continuam destinados a Felipe.
- [x] Sete testes passaram; estados de interface testados com respostas simuladas, validação da função real retornou 400 para entrada inválida.
- [x] Publicar a página Contato atualizada: publicação solicitada para daton.com.br.

## Migração para Lovable Cloud — 2026-10-27
- [x] Supabase externo desvinculado pelo usuário; Lovable Cloud ativado (banco novo e vazio).
- [x] Segredos (Resend, Lovable API) disponíveis no novo backend.
- [x] Edge function `commercial-contact` reimplantada no novo backend (mesma validação compartilhada).
- [x] Envio end-to-end testado via endpoint real: 200 com confirmação do Resend; e-mail de teste entregue em felipe@webstar.studio.
- [x] Publicação do novo backend solicitada no atendimento anterior (2026-10-27).

## Imagens institucionais — 2026-10-27
- [x] Revisados peso, resolução e carregamento das imagens em todas as páginas institucionais.
- [x] Criadas versões menores em WebP para telas menores; originais mantidos, imagem de floresta compartilhada, fotos iniciais priorizadas e fotos inferiores carregadas sob demanda. Carousel só troca para fotos decodificadas; ampliação artificial evitada por não recuperar detalhe real.
- [x] Sete testes passaram; todas as páginas verificadas em 1280px e 390px, incluindo imagens ao rolar Sobre Nós/Ambiental e menu Soluções; sem erros de execução. CDN real usado na verificação porque o servidor local não serve o caminho de assets da hospedagem. Verificação automática final sem erros.
- [ ] Publicar a otimização das imagens (aguarda solicitação do usuário).
