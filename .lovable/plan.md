

## Problem

The uploaded spreadsheet has a simplified format with columns like `RESUMO E TÍTULO`, `POA`, `PIR`, `GO`, etc. — but **no** `Tipo de Norma` column and **no** `Jurisdição` column. The validation (lines 711-737) treats both as required, so all 439 rows fail with:
- "Tipo de Norma é obrigatório"
- "Jurisdição é obrigatória"

## Fix

**File: `src/services/legislationImport.ts`**

### 1. Auto-extract `norm_type` from the title text (line ~652)

Many titles in the spreadsheet start with patterns like "Art. 227", "Lei nº 6.938", "Resolução CONAMA nº 001", "Decreto nº 99.274". Parse the beginning of the title to extract the norm type automatically:

```typescript
function extractNormTypeFromTitle(title: string): string {
  const patterns = [
    /^(Lei Complementar)/i, /^(Lei Federal)/i, /^(Lei)/i,
    /^(Decreto-Lei)/i, /^(Decreto)/i,
    /^(Resolução)/i, /^(Portaria)/i, /^(Instrução Normativa)/i,
    /^(Norma Regulamentadora)/i, /^(NR)\s/i,
    /^(Constituição)/i, /^(Art\.?\s)/i,
    /^(NBR)/i, /^(Deliberação)/i, /^(Medida Provisória)/i,
  ];
  for (const p of patterns) {
    const match = title.match(p);
    if (match) return match[1];
  }
  return 'Outros'; // fallback
}
```

Apply when `norm_type` is empty at line 652.

### 2. Default `jurisdiction` to 'federal' for this format (line ~584)

The spreadsheet is named "federais_sem_formula" — all records are federal. When jurisdiction is empty and the sheet name or file context suggests federal, default to `'federal'`.

### 3. Relax validation for simplified formats (lines 711-737)

- If `norm_type` is empty but title exists, auto-assign via `extractNormTypeFromTitle` and demote to warning instead of error.
- If `jurisdiction` is empty, default to `'federal'` and add a warning instead of error.

This ensures all 439 rows pass validation with the correct inferred values.

