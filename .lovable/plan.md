

## Problem

Multiple spreadsheet rows resolve to the **same existing legislation** (via summary matching). Each row generates a compliance record for the same branch. When these are batched into a single `upsert()` call, Postgres rejects it because the same `(legislation_id, branch_id)` key appears more than once in the same INSERT statement.

## Fix

**File: `src/services/legislationImport.ts`** — Deduplicate `complianceRecords` before upserting.

After building the `complianceRecords` array (around lines 1010-1012 and 1245-1247), deduplicate by `legislation_id + branch_id`, keeping the **last** entry (most recent row wins):

```typescript
// Deduplicate by (legislation_id, branch_id) — last row wins
const uniqueMap = new Map<string, typeof complianceRecords[0]>();
for (const rec of complianceRecords) {
  uniqueMap.set(`${rec.legislation_id}:${rec.branch_id}`, rec);
}
const dedupedRecords = Array.from(uniqueMap.values());
```

Then use `dedupedRecords` in the `.upsert()` call instead of `complianceRecords`.

This change applies to **both** upsert blocks (existing legislation ~line 1012, and new legislation ~line 1247).

