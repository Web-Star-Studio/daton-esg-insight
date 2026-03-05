# Daton ESG Insight — Claude Skills

Skills organizadas para manutenção diária do projeto. Invoke com `/skill-name`.

## Estrutura

```
skills/
├── demo/
│   ├── add-mock.md           → /demo-add-mock       Adicionar mock data para feature no modo demo
│   └── audit.md              → /demo-audit          Auditar componente para segurança no modo demo
├── features/
│   ├── add-page.md           → /add-page            Scaffold completo de nova página
│   ├── add-route.md          → /add-route           Adicionar rota (App.tsx + sidebar + demo)
│   └── compliance-report.md  → /compliance-report   Gerar relatório de conformidade normativa (ISO/NBR)
└── ui/
    └── responsive.md         → /responsive          Checar e corrigir responsividade
```

## Contexto do Projeto

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Supabase + React Query
- **Rotas demo:** `/demo/*` — NUNCA fazem CRUD real. Mock data via `DemoDataSeeder` + React Query cache
- **Breakpoints customizados:** `xs:320px sm:480px md:768px lg:1024px xl:1366px 2xl:1920px`
- **Cor primária:** `#00bf63` (green) — classe `text-primary`, `bg-primary`
- **Arquivos-chave:**
  - `src/App.tsx` — Roteamento central (lazy imports + routes)
  - `src/components/DemoDataSeeder.tsx` — Injeta mock data no React Query cache
  - `src/data/demo/` — Mock data por módulo (17 arquivos)
  - `src/data/demo/queryResolver.ts` — Fallback inteligente por query key
  - `src/utils/demoGuard.ts` — `triggerDemoBlocked()`, `demoAction()`
  - `src/components/AppSidebar.tsx` — Menu de navegação
  - `src/config/enabledModules.ts` — Feature flags por módulo
