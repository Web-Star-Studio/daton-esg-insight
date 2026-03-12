

## Problem

`createInitialMappings(detectedUnitColumns, branches)` is called immediately after file parsing. If the `useBranches()` query hasn't resolved yet (or is still `[]`), all mappings get `branchId: null` and show "Ignorar esta coluna".

The branches dropdown works fine later because by that time the query has resolved, but the initial auto-matching already ran with empty data.

## Fix

**File: `src/components/legislation/LegislationImportDialog.tsx`**

Add a `useEffect` that re-runs `createInitialMappings` when `branches` data loads/changes while on the mapping stage with unmapped columns:

```typescript
useEffect(() => {
  if (stage === 'mapping' && branches.length > 0 && detectedUnitColumns.length > 0) {
    const hasMapped = unitMappings.some(m => m.branchId);
    if (!hasMapped) {
      // Re-run auto-matching now that branches are available
      const remapped = createInitialMappings(detectedUnitColumns, branches);
      setUnitMappings(remapped);
    }
  }
}, [branches, stage]);
```

This ensures that if the user reaches the mapping step before branches load, the auto-matching retries once branches become available. It only re-runs if zero mappings were made (avoids overwriting user's manual selections).

Additionally, add a "Re-detectar" button in `UnitMappingStep.tsx` so users can manually trigger re-matching if needed.

