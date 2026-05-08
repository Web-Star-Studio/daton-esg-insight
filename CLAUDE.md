# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all apps + backend in parallel)
bun run dev

# Individual dev servers
bun run dev:web        # Next.js at localhost:3000
bun run dev:native     # Expo dev server
bun run dev:backend    # Convex dev server (generates _generated/ types)

# Build, lint, type-check (all packages via Turborepo)
bun run build
bun run lint
bun run type-check

# Format
bun run format           # Fix formatting
bun run format:check     # Check only

# E2E tests (Playwright)
bun run test:e2e                        # All browsers
bun run test:e2e --project=chromium     # Chromium only
bun run test:e2e:ui                     # Interactive UI mode

# Filter to a single package
turbo run lint --filter=@ws/web
turbo run type-check --filter=@ws/shared
```

## Architecture

Turborepo monorepo with bun workspaces. Two apps share a Convex backend and a shared types/utils package. UI is separate per platform — only business logic and types are shared.

### Workspace Layout

- **`apps/web`** (`@ws/web`) — Next.js 16 with App Router and Turbopack. Auth routes at `/api/auth/[...all]`.
- **`apps/native`** (`@ws/native`) — Expo SDK 54 with expo-router. Uses `expo-secure-store` for auth token storage.
- **`apps/e2e`** (`@ws/e2e`) — Playwright tests against the web app. Config auto-starts the Next.js dev server.
- **`packages/backend`** (`@ws/backend`) — Convex backend with Better Auth component. Both apps import `api` from `@ws/backend/convex/_generated/api`.
- **`packages/shared`** (`@ws/shared`) — Shared types and utilities. Exports raw TypeScript (JIT compiled by each app's bundler).
- **`packages/eslint-config`** — ESLint 9 flat configs (`base`, `next`, `react-native`).
- **`packages/typescript-config`** — Shared tsconfig presets (`base`, `next`, `react-native`).

### Convex + Better Auth Integration

The backend package registers the `@convex-dev/better-auth` component in `convex/convex.config.ts`. Auth tables are managed by the component — app tables go in `convex/schema.ts`.

**`convex/auth.ts`** exports:
- `authComponent` — the Better Auth client used for route registration and auth queries
- `createAuth()` — factory that creates a Better Auth instance with email/password + Convex plugin
- `getCurrentUser` — Convex query returning the authenticated user

**`convex/http.ts`** registers auth HTTP routes via `authComponent.registerRoutes()`.

### Auth Client Differences

| | Web (Next.js) | Native (Expo) |
|---|---|---|
| Client plugins | `convexClient()` | `expoClient()` + `convexClient()` |
| Token storage | Cookies (automatic) | `expo-secure-store` |
| Base URL | Not needed (same origin) | `EXPO_PUBLIC_CONVEX_SITE_URL` |
| Server helpers | `convexBetterAuthNextJs()` in `src/lib/auth-server.ts` | N/A |

Both apps wrap their root layout with `ConvexBetterAuthProvider`.

### Turborepo Task Graph

`lint` and `type-check` use a **transit node** pattern — they depend on a `transit` task (which depends on `^transit`) for parallel execution with correct cache invalidation. They do NOT depend on `^build`.

The `build` task uses `dependsOn: ["^build"]` and caches `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` env vars.

## Key Conventions

- **`better-auth` version must be pinned** (not floating) per Convex component docs.
- **`signOut()` is called directly**, not via `.mutate()`.
- **Convex `_generated/` only exists after running `convex dev`** — type-check will fail in CI or on fresh clone until the backend has been initialized.
- **Environment variable prefixes**: `NEXT_PUBLIC_` for web client, `EXPO_PUBLIC_` for native client. Auth secrets (`BETTER_AUTH_SECRET`, `SITE_URL`) are set on the Convex dashboard, not in local `.env`.
- **Root scripts must use `turbo run`** (not the `turbo` shorthand) per Turborepo best practices.
- **CI uses `--affected`** to only run tasks on changed packages.

## Mandatory Code Review Workflow (CodeRabbit)

Every time you write or modify actual code (not docs-only or config-only changes), you **must** follow this workflow before moving on to the next task:

1. **Stage and commit** your changes with a conventional commit message.
2. **Create a PR** targeting `main`. Keep each PR to **100 changed files or fewer** — manter PRs pequenos é uma boa prática do projeto e ajuda a revisão automatizada a ser eficaz. Se as mudanças passarem de 100 arquivos, divida em PRs sequenciais.
3. **Wait for CodeRabbit's auto-review.** CodeRabbit revisa automaticamente todo PR ao ser criado — sem trigger manual. Acompanhe pelos comentários do bot no PR ou via `gh pr view <num> --comments`.
4. **If CodeRabbit raises issues**: corrija na mesma branch, faça push, e aguarde a revisão de follow-up.
5. **If CodeRabbit has no issues** (ou todas as issues foram resolvidas): merge o PR e siga para a próxima tarefa.

**Do not skip this workflow.** Código que não passou pela revisão do CodeRabbit não deve ser mergeado.

## EAS Workflows

`.eas/workflows/` contains Expo Application Services CI/CD:
- `build-all.yml` — Production builds (Android + iOS) on push to main
- `build-preview.yml` — Fingerprints first, only builds if native code changed
- `update-preview.yml` — OTA update if fingerprint unchanged (skips native rebuild)
