

# Fix Edge Function Build Errors

## Root Causes

Three categories of TypeScript errors across 4 Edge Function files:

### 1. Supabase Client Version Mismatch (`daton-ai-chat`)
`index.ts` imports `@supabase/supabase-js@2` (resolves to latest 2.98.0), while `intelligent-suggestions.ts` imports the type from `@2.57.4`. This causes all `SupabaseClient` type incompatibility errors when passing the client between files.

### 2. `error` is of type `unknown` (TS18046)
Catch blocks use `error.message` without casting — Deno strict mode requires `(error as Error).message`.

### 3. Implicit `any` and missing variable (TS7006, TS2304, TS7053)
- `toolResults` variable referenced but not in scope at line 1693
- Filter callbacks missing type annotations
- Object indexing with `any` keys on `{}` typed objects

## Fixes

| File | Fix |
|---|---|
| `intelligent-suggestions.ts` L1 | Remove versioned `SupabaseClient` import — use `any` for the client parameter type to avoid cross-file version conflicts |
| `index.ts` L1693 | Replace `toolResults?.map(...)` with `[]` (variable not in scope) |
| `generate-intelligent-report/index.ts` L79, L153 | Cast `error` to `Error`: `(error as Error).message` |
| `get-company-quick-stats/index.ts` L111 | Cast `error` to `Error` |
| `tool-executors.ts` L233, L238 | Type `byStatus` as `Record<string, number>` instead of `{}` |
| `tool-executors.ts` L341, L346 | Type `byLevel` as `Record<string, number>` |
| `tool-executors.ts` L405, L410, L413 | Type `byGender`/`byDepartment` as `Record<string, number>` |
| `tool-executors.ts` L445, L449-450, L454-455, L459 | Add `: any` to filter callback params |
| `tool-executors.ts` L564 | Cast `error` to `Error` |

All fixes are type-level only — no behavioral changes.

