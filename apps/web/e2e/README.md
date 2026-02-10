# Playwright E2E

## Coverage

- `modules.guard.spec.ts`: route guard checks for protected module routes.
- `social.auth.spec.ts`: authenticated Social module smoke.
- `quality.auth.spec.ts`: authenticated Qualidade module smoke.
- `suppliers.auth.spec.ts`: authenticated Fornecedores module smoke.

## Run

From repo root:

```bash
bun run e2e:web:install
bun run e2e:web
```

Or from `apps/web`:

```bash
bun run e2e:install
bun run e2e
```

If your Linux environment is missing browser system libraries, run:

```bash
bunx playwright install --with-deps chromium
```

## Authenticated tests

Set credentials before running:

```bash
export E2E_EMAIL="your-user@example.com"
export E2E_PASSWORD="your-password"
```

If credentials are not set, authenticated specs are skipped and only guard specs run.
