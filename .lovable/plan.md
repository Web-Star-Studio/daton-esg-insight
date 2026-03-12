

## Problem

The import fails with 434 RLS errors because the matching logic can't find existing legislations. The spreadsheet's "RESUMO E TÍTULO" column contains the **summary** text of existing legislations, not their short `title`. For example:

- **DB record**: `title="CONSTITUIÇÃO FEDERAL"`, `summary="Art. 227. É dever da família..."`
- **Spreadsheet row**: `RESUMO E TÍTULO = "Art. 227. É dever da família..."`

The current matching only checks `norm_type+norm_number` and `title` — never `summary`. So all rows fail to match, the code tries to INSERT new legislations, and gets RLS errors. The 5 that succeeded were the first 5 inserts before something broke (likely a constraint or timing issue).

Additionally, the 5 rows that were imported as NEW legislations are now **duplicates** that need to be cleaned up.

## Fix

**File: `src/services/legislationImport.ts`**

### 1. Add summary-based matching to `existingMap` (around line 844-864)

When building the existing legislations map, also fetch `summary` and index by it:

```typescript
const { data: existingLegislations } = await supabase
  .from('legislations')
  .select('id, title, norm_type, norm_number, summary')
  .eq('company_id', companyId);

// Add summary-based key
if (l.summary) {
  const summaryKey = `summary:${l.summary.toLowerCase().substring(0, 150)}`;
  if (!existingMap.has(summaryKey)) {
    existingMap.set(summaryKey, { id: l.id, title: l.title });
  }
}
```

### 2. Add summary matching in the lookup (around line 904-916)

After trying `norm_type+norm_number` and `title`, also try matching the parsed title against DB summaries:

```typescript
// Third attempt: match by summary (for simplified formats where
// the "RESUMO E TÍTULO" column maps to the DB summary field)
if (!existingLegislation && leg.title) {
  const summaryKey = `summary:${leg.title.toLowerCase().substring(0, 150)}`;
  existingLegislation = existingMap.get(summaryKey) || null;
}
```

### 3. For simplified format (no norm_type column), skip INSERT and warn instead

When the spreadsheet has no explicit `Tipo de Norma` column (simplified format), if a row can't be matched to an existing legislation, **don't try to INSERT** — just report a warning saying "Legislação não encontrada no banco de dados":

```typescript
// If no match and simplified format (no explicit norm_type column),
// skip insert and report as warning
if (!existingLegislation && !hasExplicitNormTypeColumn) {
  result.warnings++;
  result.details.push({
    rowNumber: leg.rowNumber,
    title: leg.title?.substring(0, 60) || '(sem título)',
    status: 'warning',
    message: 'Legislação não encontrada no banco de dados - importação ignorada',
  });
  continue;
}
```

### 4. Clean up the 5 duplicate legislations already imported

The 5 records imported with `norm_type="Outros"` and full descriptive titles are duplicates. They should be deleted from the DB. This will be done via a data cleanup query.

## Summary

- 1 file changed: `src/services/legislationImport.ts`
- Core fix: match spreadsheet rows against existing legislations by **summary** field (truncated to 150 chars)
- Safety: simplified format imports only update existing records, never create new ones
- Cleanup: remove the 5 duplicate records from the previous failed import

