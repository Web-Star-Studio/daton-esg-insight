

## Plan: Fix Import — Robust Column Matching

### Root Cause

The error "Nenhuma legislação encontrada no arquivo" occurs because `getColumnValue()` does **exact property name matching** (`row[name]`). When XLSX parses the spreadsheet, column headers like "RESUMO E TÍTULO" may have different Unicode encoding (composed `Í` vs decomposed `I + combining accent`) than the hardcoded strings. This causes all column lookups to fail, resulting in empty `title`, `norm_type`, and `norm_number` — which makes every row get filtered out at line 653.

### Fix

**File: `src/services/legislationImport.ts`**

1. **Replace `getColumnValue` with fuzzy key matching** — instead of exact `row[name]`, normalize both the row keys and search terms (lowercase, remove accents) and match:

```typescript
function normalizeKey(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getColumnValue(row: any, ...possibleNames: string[]): string {
  // First try exact match (fast path)
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }
  // Fallback: normalized matching
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const normalizedName = normalizeKey(name);
    const matchingKey = rowKeys.find(k => normalizeKey(k) === normalizedName);
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }
  // Last resort: partial/contains matching
  for (const name of possibleNames) {
    const normalizedName = normalizeKey(name);
    const matchingKey = rowKeys.find(k => 
      normalizeKey(k).includes(normalizedName) || normalizedName.includes(normalizeKey(k))
    );
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null) {
      return String(row[matchingKey]).trim();
    }
  }
  return '';
}
```

2. **Apply same normalization to `detectUnitColumns`** — normalize with accent removal before comparing against `KNOWN_UNIT_CODES`:

```typescript
export function detectUnitColumns(headers: string[]): string[] {
  return headers.filter(h => {
    const normalized = normalizeKey(h).toUpperCase();
    const normalizedCodes = KNOWN_UNIT_CODES.map(c => normalizeKey(c).toUpperCase());
    return normalizedCodes.includes(normalized) || 
           (normalized.length <= 6 && /^[A-Z]{2,6}$/.test(normalized) && 
            !['UF', 'ID', 'URL', 'OK', 'NA', 'NR', 'NBR'].includes(normalized));
  });
}
```

3. **Apply same normalization in `findHeaderRow`** — the `.includes()` checks for header patterns should also normalize to handle accent mismatches.

### Summary

- 1 file changed: `src/services/legislationImport.ts`
- Core fix: Unicode normalization (NFD + strip accents) for all column name matching
- This resolves the import failure for any spreadsheet with accented column headers

