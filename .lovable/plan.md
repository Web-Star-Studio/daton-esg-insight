

## Problem

For simplified spreadsheet formats (like the Gabardo format with "RESUMO E TÍTULO" + unit columns), the import logic still validates `norm_type`, `title`, and `jurisdiction` as required fields (line 909). Even though `extractNormTypeFromTitle` provides a fallback, some rows might have empty titles, and more critically — **the entire validation and insert flow is wrong for this use case**.

The simplified format's purpose is solely to **update unit compliance status** for already-existing legislations. It should never attempt to create new legislation records.

## Fix

**File: `src/services/legislationImport.ts`** — Restructure the import flow for simplified format:

### 1. Skip required field validation for simplified format (line 909)

When `isSimplifiedFormat` is true, skip the `norm_type`/`jurisdiction` check. The only thing needed is `title` (which is the summary text used for matching):

```typescript
// For simplified format, only title is needed (used for matching)
if (options.isSimplifiedFormat) {
  if (!leg.title) {
    result.warnings++;
    result.details.push({ ... message: 'Linha sem texto para identificação' });
    continue;
  }
} else {
  // Original validation for full format
  if (!leg.norm_type || !leg.title || !leg.jurisdiction) { ... }
}
```

### 2. Move simplified format guard BEFORE the insert block (already exists at line 1037, just needs the validation fix above)

The existing guard at line 1037 already prevents inserts for simplified format — the only issue is rows being rejected at line 909 before reaching it.

### 3. Improve matching with normalized/partial summary matching

Add a fuzzy match fallback: normalize both sides (strip accents, lowercase, trim to 100 chars) for better matching when summaries have slight differences.

This is a small, focused change — just restructuring the validation gate at line 909 to let simplified format rows through to the matching logic.

