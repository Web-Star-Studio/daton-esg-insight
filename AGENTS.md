# Repository Guidelines

## Project Structure & Module Organization
This repository is a Vite + React + TypeScript application with Supabase integration.

- `src/`: application source code (pages, components, hooks, services, contexts, utils).
- `public/`: static assets served directly.
- `supabase/`: Supabase functions and platform-related backend assets.
- `docs/`: project documentation and audits.
- `dist/`: build output (generated).

Keep business logic in `src/services` or domain hooks, UI in `src/components`, and shared app state in `src/contexts`.

## Build, Test, and Development Commands
Run commands from the repository root:

- `bun install`: install dependencies.
- `bun run dev`: start local Vite dev server.
- `bun run build`: production build into `dist/`.
- `bun run build:dev`: development-mode build.
- `bun run preview`: preview built app locally.
- `bun run lint`: run ESLint across the codebase.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts` / `.tsx`).
- Indentation: 2 spaces.
- Prefer double quotes and semicolons for new edits (follow existing file style where needed).
- Component files: `PascalCase` (e.g., `UserDashboard.tsx`).
- Utilities/services: `camelCase` or domain-based names (e.g., `notificationService.ts`).
- Route/page modules: keep naming consistent with existing `src/pages/*` patterns.

Use ESLint as the quality gate; avoid introducing new warnings when possible.

## Testing Guidelines
- Test stack available: Vitest + Testing Library (`vitest`, `@testing-library/*`).
- Place tests near the feature or under a dedicated test folder using `*.test.ts` / `*.test.tsx`.
- Current repo does not include a configured Playwright E2E workspace.

When adding behavior, include focused unit/integration tests for critical logic.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`, `chore: ...`.
- Keep commits scoped and atomic.
- PRs should include:
  - concise summary and affected areas,
  - linked issue/ticket (if available),
  - screenshots/video for UI changes,
  - confirmation that `bun run lint` and relevant tests pass.

## Security & Configuration Tips
- Never commit secrets.
- Keep environment values in `.env`/`.env.example` patterns.
- Review Supabase changes carefully, especially auth, policies, and edge functions.
