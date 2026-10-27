# Repository Guidelines

## O que é este repositório

Este projeto é **apenas a landing page institucional da Daton** (daton.com.br).
O sistema (v2) é hospedado fora deste projeto, em `https://painel.daton.com.br`.

- Qualquer rota fora da lista de páginas institucionais é redirecionada ao
  painel pelo `PainelRedirectGuard` (config em `src/config/externalApp.ts`).
- A pasta `supabase/` (migrations, edge functions, tipos do banco) é
  **mantida intacta**: é a base de dados do sistema antigo e pode ser usada
  para migrar dados para a v2. Não apagar.
- Backup completo do sistema antigo (front-end): git history +
  `daton-sistema-completo-backup-2026-10-22.tar.gz` em Files.

## Estrutura

- `src/pages/`: apenas páginas institucionais (LandingPage, Contato, SobreNos,
  FAQ, Privacidade, Termos, Seguranca, ESGAmbiental/Social/Governanca,
  Funcionalidades, Documentacao).
- `src/components/landing/heimdall/`: componentes da landing (navbar, hero,
  footer, css próprio).
- `src/components/ui/`: subset do shadcn usado pelas páginas institucionais.
- `src/config/externalApp.ts`: URL do painel + lista de rotas da LP
  (`PUBLIC_LP_PATHS`). Ao adicionar uma página institucional nova, incluir
  o path lá E em `src/App.tsx`.

## Comandos

- `bun run dev` / `bun run build` / `bun run preview`
- `bun run lint` — ESLint
- `bun run test` — Vitest (testes unitários, ex.: `src/config/externalApp.test.ts`)
- Typecheck: `npx tsgo --noEmit -p tsconfig.app.json`

## Convenções

- TypeScript, 2 espaços, double quotes + semicolons.
- Tema claro forçado (`forcedTheme="light"` no App.tsx) — dark mode desativado.
- CTAs de acesso ao sistema apontam para `PAINEL_URL` via
  `window.location.href` (navegação externa), nunca `<Link>`/`<Navigate>`.

- Commercial contact uses an isolated public `commercial-contact` Edge Function with a server-owned recipient and shared schema validation; it never reads or modifies legacy data or functions.
- Commercial email uses the linked Resend gateway from server code only; browser success requires provider acceptance, not just form submission.
- Initialize the contact client only on submission and require Cloud environment values at publication builds; missing hosting configuration must not crash institutional pages or silently ship a broken contact form.
- Documentation preserves its public FAQ view without local authentication; system access goes directly to the external panel because the LP has no user sessions.
- Deno resolves its versioned npm dependencies automatically through root deno.json so legacy function dependencies remain intact alongside the frontend dependencies.
- Institutional photography uses the shared responsive image registry with original-resolution fallbacks and CDN-hosted smaller variants; prioritize each page's first photo and defer below-fold images to avoid competing downloads.
