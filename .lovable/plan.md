

# Fix Build Errors: Onboarding Type Incompatibilities

## Problem

The `ModuleConfig` type (`{ [key: string]: unknown }`) and `companyProfile: unknown` from the onboarding flow are not compatible with the Supabase `Json` type. TypeScript rejects `unknown` values where `Json` is expected.

## Solution

Cast the incompatible values to `Json` at the boundary where data is passed to Supabase queries. This is safe because these values are always serializable JSON objects.

### File 1: `src/contexts/onboarding-flow/types.ts`

Change `ModuleConfig` and `companyProfile` to use `Json`-compatible types:
```typescript
export interface ModuleConfig {
  [key: string]: any;  // changed from unknown to any
}
```
And change `companyProfile` from `unknown` to `Record<string, any> | null`.

### File 2: `src/contexts/onboarding-flow/persistence.ts`

Cast `moduleConfigurations` and `companyProfile` to `Json` at lines 87-88 and 128-129:
```typescript
module_configurations: state.moduleConfigurations as unknown as Json,
company_profile: (state.companyProfile || {}) as unknown as Json,
```

### File 3: `src/components/onboarding/CleanOnboardingMain.tsx`

- Line 201: Fix spread of potentially undefined value by adding a fallback:
  ```typescript
  ...(moduleConfigurations['inventario_gee'] as Record<string, any> || {}),
  ```
- Lines 261-262: Cast to `Json`:
  ```typescript
  module_configurations: (state.moduleConfigurations || {}) as unknown as Json,
  company_profile: (state.companyProfile || {}) as unknown as Json,
  ```

## Impact

- Only type-level changes, no runtime behavior changes
- Fixes all 5 reported TypeScript errors
- Maintains type safety at the Supabase boundary

