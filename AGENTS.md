# Repository Guidelines

## Project Structure & Module Organization
This repository is a Bun workspace + Turborepo monorepo.

- `apps/web`: Next.js App Router frontend (`src/app`, `src/lib`).
- `apps/native`: Expo Router mobile app (`app/`, `src/lib`).
- `apps/e2e`: Playwright end-to-end suite (`tests/*.spec.ts`).
- `packages/backend`: Convex backend (`convex/schema.ts`, `convex/*.ts`).
- `packages/shared`: Shared TypeScript types/utilities consumed by web and native.
- `packages/eslint-config`, `packages/typescript-config`: Shared lint and TS presets.

## Build, Test, and Development Commands
Run from repo root unless noted.

- `bun install`: Install workspace dependencies.
- `bun run dev`: Start web, native, and backend in parallel via Turbo.
- `bun run dev:web` / `bun run dev:native` / `bun run dev:backend`: Start one target.
- `bun run build`: Build all packages/apps.
- `bun run lint`: Run ESLint across workspaces.
- `bun run type-check`: Run TypeScript checks across workspaces.
- `bun run test:e2e`: Run Playwright tests in `apps/e2e`.
- `bun run test:e2e:ui`: Open Playwright interactive UI.

## Coding Style & Naming Conventions
- Language: TypeScript-first across apps/packages.
- Formatting: Prettier (`.prettierrc`) with 2 spaces, semicolons, double quotes, trailing commas, 80-char line width.
- Linting: ESLint 9 flat config from `@ws/eslint-config`.
- File naming: React components in `PascalCase`; utility modules and routes in `kebab-case` or framework-default names (e.g., `page.tsx`, `route.ts`).
- Keep shared contracts in `packages/shared` and backend-facing schema/API code in `packages/backend/convex`.

## Testing Guidelines
- Framework: Playwright (`@playwright/test`) in `apps/e2e`.
- Test files: `*.spec.ts` under `apps/e2e/tests` (example: `auth.spec.ts`).
- Local run: `bun run test:e2e`; for debugging use `bun run test:e2e:ui`.
- Coverage focus: critical user flows (auth, landing/home, cross-browser smoke). Add or update E2E tests for behavior changes.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commit style seen in history (example: `feat: ...`).
- Use format: `<type>: <short imperative summary>` (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`).
- PRs should include:
  - Clear summary and affected workspace(s) (web/native/backend/shared/e2e).
  - Linked issue (if applicable) and config/env changes (`.env.example`, Convex vars).
  - Screenshots or recordings for UI changes (web or native).
  - Confirmation that `bun run lint`, `bun run type-check`, and relevant tests pass.

## Mandatory Code Review Workflow (Greptile)

Every code change (not docs-only or config-only) **must** go through this workflow:

1. **Stage and commit** changes using conventional commit format.
2. **Create a PR** targeting `main` with **100 changed files or fewer** per PR (Greptile's execution limit). Split larger changes into multiple PRs.
3. **Wait for Greptile's auto-review.** Greptile reviews every PR automatically on creation — no manual trigger needed.
4. **If issues are raised**: fix them, push, and wait for re-review.
5. **If no issues remain**: merge the PR and continue.

Code that hasn't passed Greptile review must not be merged.

## Security & Configuration Tips
- Never commit secrets; use `.env.local` (copied from `.env.example`).
- Keep Convex and auth secrets in environment variables, not source files.
