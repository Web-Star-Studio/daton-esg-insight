# Daton ESG Insight

Plataforma integrada de gestão ESG (Environmental, Social, Governance), qualidade e conformidade regulatória.

## Monorepo Status

Este repositório foi migrado para **Bun Workspaces + Turborepo**.

- `apps/web`: app web atual (Vite, em fase de transição para mover `src/` do root)
- `apps/native`: app mobile Expo (iOS-first) com Expo Router + Uniwind
- `packages/backend`: backend Convex (esquema inicial para Social, Qualidade e Fornecedores)
- `packages/shared`: tipos/contratos compartilhados

## Tech Stack

- **Frontend:** React 18, TypeScript 5, Vite 5
- **UI:** Tailwind CSS, shadcn/ui (Radix UI)
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State:** TanStack Query v5
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library

## Instalação Rápida

```bash
bun install
cp .env.example .env.local
bun run dev
```

### Rodar por workspace

```bash
bun run dev:web
bun run dev:native
bun run dev:backend
```

## Build para Produção

```bash
npm run build
npm run preview
```

## Estrutura do Projeto

```
src/
├── components/       # Componentes React reutilizáveis (400+)
│   ├── ui/           # Componentes base (shadcn)
│   ├── forms/        # Componentes de formulário
│   └── [modulo]/     # Componentes por módulo
├── pages/            # Páginas/Rotas da aplicação (130+)
├── services/         # Serviços de API e lógica de negócios (170+)
├── hooks/            # Custom React hooks (90+)
├── contexts/         # Context API (Auth, Company, Compliance)
├── utils/            # Funções utilitárias
├── types/            # Definições TypeScript
├── integrations/     # Integrações externas (Supabase)
├── constants/        # Constantes e configurações
└── schemas/          # Schemas de validação Zod

supabase/
└── functions/        # Edge Functions Deno (60+)

docs/
├── api.md            # Documentação de API
├── architecture.md   # Arquitetura do sistema
├── development.md    # Guia de desenvolvimento
├── operations.md     # Guia de operações
└── prd.md            # PRD do produto
```

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Executar ESLint |
| `npm run test` | Executar testes |
| `npm run test:ui` | Interface visual de testes |
| `npm run test:coverage` | Testes com cobertura |

## Documentação

- [Documentação de API](./docs/api.md)
- [Arquitetura do Sistema](./docs/architecture.md)
- [Guia de Desenvolvimento](./docs/development.md)
- [Guia de Operações](./docs/operations.md)
- [Guia de Performance](./PERFORMANCE.md)
- [Guia de Testes](./TESTING.md)
- [PRD do Produto](./docs/prd.md)

## Módulos Principais

| Módulo | Descrição |
|--------|-----------|
| **ESG Social** | Gestão de funcionários, treinamentos, segurança do trabalho |
| **ESG Ambiental** | Inventário GEE, licenças, água, energia, resíduos |
| **Qualidade (SGQ)** | Não conformidades, ações corretivas, documentos |
| **Fornecedores** | Cadastro, avaliação, portal do fornecedor |
| **Administração** | Usuários, permissões, configurações |

## Variáveis de Ambiente

```env
# Obrigatório - Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# Opcional - IoT
VITE_IOT_WEBSOCKET_URL=ws://localhost:3001/iot
```

Ver [.env.example](./.env.example) para mais detalhes.

## Licença

Proprietário - Daton ESG Insight © 2024-2026
