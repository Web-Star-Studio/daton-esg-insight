

# Fix ER Diagram to Show All Columns

## Problem

The ER diagram only shows the `id` column for every table because of two issues:

1. **Data layer**: `extractTablesFromSupabaseTypes()` in `erDiagramData.ts` hardcodes `columns: [{ name: 'id', type: 'UUID', nullable: false }]` for every table instead of actually parsing the columns from the Supabase types.
2. **UI layer**: `EREntityBox.tsx` has hardcoded `id` and `company_id` columns instead of iterating over `table.columns`.

## Solution

### Step 1: Parse real columns from Supabase types

Update `extractTablesFromSupabaseTypes()` in `src/utils/erDiagramData.ts` to dynamically read the `Row` type of each table from the `Database['public']['Tables']` object. For each table, iterate over the keys of the `Row` type to extract column names and infer types (string, number, boolean, etc.) and nullability.

### Step 2: Update EREntityBox to render all columns

Update `src/components/er-diagram/EREntityBox.tsx` to iterate over `table.columns` instead of hardcoding `id` and `company_id`. Each column will show:
- A key icon for the primary key (`id`)
- A link icon for foreign key columns
- The column name and its type
- Visual distinction for nullable vs required columns

## Technical Details

**`src/utils/erDiagramData.ts`** - In `extractTablesFromSupabaseTypes()`, replace the hardcoded single-column approach:

```typescript
// Instead of:
columns: [{ name: 'id', type: 'UUID', nullable: false }]

// Actually read from the Database type at runtime:
const tables = (await import('@/integrations/supabase/types')).Database.public.Tables;
// For each table, extract Row keys and map to column metadata
```

Since the Supabase types are TypeScript-only (erased at runtime), we'll use the `Tables` object which IS available at runtime via the generated types export. We'll read `Insert` type keys (which show nullability via optional fields) to determine column metadata.

**`src/components/er-diagram/EREntityBox.tsx`** - Replace hardcoded columns section with:

```typescript
{table.columns.map(col => (
  <div key={col.name} className="flex items-center gap-1.5">
    {col.isPrimaryKey ? <Key /> : col.isForeignKey ? <Link2 /> : <span />}
    <span>{col.name}</span>
    <span className="ml-auto">{col.type}</span>
  </div>
))}
```

