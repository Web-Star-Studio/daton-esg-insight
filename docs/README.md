# Daton ESG Insight Knowledge Base

This folder stores the current architecture and business understanding of the
project.

Snapshot date: **2026-02-22**

Sources used for this knowledge base:

- Local codebase (`src/*`, `supabase/*`)
- Supabase MCP runtime data (`list_edge_functions`, `execute_sql`)

## Documents

- `docs/codebase-overview.md`: High-level system map and where logic lives.
- `docs/frontend-architecture.md`: Frontend architecture, routing, auth, and
  data access patterns.
- `docs/backend-edge-functions.md`: Edge Functions inventory and execution
  patterns.
- `docs/backend-database-er.md`: Database schema/ER analysis based on Supabase
  MCP metadata.
- `docs/business-domains.md`: Product/business domain model and core workflows.

## Notes

- Supabase runtime can evolve independently from local files. Any mismatch
  between `supabase/functions/*` and deployed functions should be treated as
  deployment drift and verified before changes.
