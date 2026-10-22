# CLAUDE.md

Este repositório é **somente a landing page institucional da Daton**
(Vite + React + TypeScript). O sistema v2 roda fora daqui, em
`https://painel.daton.com.br`.

Leia `AGENTS.md` — ele é a fonte de verdade deste repo (estrutura, comandos,
convenções). Pontos críticos:

- Rotas fora de `PUBLIC_LP_PATHS` (`src/config/externalApp.ts`) redirecionam
  ao painel via `PainelRedirectGuard`.
- `supabase/` é mantido (banco do sistema antigo, base para migração de
  dados para a v2). Não apagar.
- Não reintroduzir AuthProvider/CompanyProvider ou páginas do sistema antigo;
  o histórico git e o backup em Files guardam esse código.
