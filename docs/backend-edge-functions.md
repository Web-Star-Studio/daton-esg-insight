# Backend: Supabase Edge Functions

Snapshot date: **2026-02-22**

## 1. Overview

Edge Functions are a major backend execution layer for:

- AI and document processing
- compliance/audit workflows
- supplier portal/auth flows
- reporting and analytics orchestration
- platform administration tasks

Code locations:

- Local sources: `supabase/functions/*`
- Shared helpers: `supabase/functions/_shared/*`
- Runtime settings: `supabase/config.toml`

## 2. Inventory Status

Local repository:

- 64 function directories (excluding `_shared`)

Live project via Supabase MCP (`list_edge_functions`):

- Large deployed set (60+ active functions)
- Includes local functions plus additional deployed-only slugs

Observed deployed-only slugs (not present as local folders in this snapshot):

- `parse-chat-document`
- `ai-chat-controller`
- `intelligent-pipeline-orchestrator`

This indicates deployment drift and should be tracked explicitly.

## 3. Implementation Pattern

Common function structure:

- Deno `serve(...)` handler
- CORS handling for `OPTIONS`
- Supabase client creation inside function
- Auth validation (token or header-based)
- `action` switch routing in request body for multi-operation handlers

Representative examples:

- `supabase/functions/quality-management/index.ts`
- `supabase/functions/document-ai-processor/index.ts`
- `supabase/functions/supplier-auth/index.ts`

## 4. Shared Utilities

Cross-function helpers in `_shared`:

- `validation.ts`: auth validation, Zod schemas, in-memory rate limiting
- `company-context-builder.ts`: tenant-aware data context for AI workflows
- `validators.ts`: normalization/validation utilities (CPF/CNPJ/date/number)
- `cors.ts`: CORS headers

## 5. Security and JWT Modes

Configured jwt mode is mixed:

- Many functions use `verify_jwt = true` (default expected secure mode)
- Some intentionally exposed/loosely protected functions use
  `verify_jwt = false` (for specific flows or custom auth)

Examples with `verify_jwt = false` in local config:

- `license-ai-analyzer`
- `license-document-analyzer`
- `process-intelligent-alerts`
- `intelligent-document-classifier`
- `advanced-document-extractor`
- `smart-content-analyzer`
- `supplier-auto-alerts`
- `supplier-notifications`
- `cnpj-lookup`
- `cnpj-pdf-extractor`
- `delete-account`

Security implication:

- Every `verify_jwt = false` function must implement explicit access controls in
  function code (or be strictly safe for public invocation).

## 6. Functional Domain Map

### Document + AI pipeline

- `document-ai-processor`
- `advanced-document-extractor`
- `intelligent-document-classifier`
- `document-validator`
- `field-mapper`
- `document-insights-generator`
- `universal-document-processor`
- `approve-extracted-data`
- `extract`, `extract-status`
- `mtr-ocr-processor`

### ESG and analytics

- `esg-dashboard`
- `performance-analysis`
- `predictive-analytics`
- `ai-insights-engine`
- `company-health-score`
- `calculate-esg-roi`
- `ghg-recalculate`

### Reports and GRI

- `generate-intelligent-report`
- `report-section-generator`
- `gri-content-generator`
- `gri-index-generator`
- `gri-indicator-autofill`
- `gri-report-ai-configurator`

### Quality, audit, and compliance

- `quality-management`
- `audit-management`
- `audit-notifications-scheduler`
- `compliance-management`
- `analyze-nc-text`
- `nc-immediate-suggestions`
- `nc-action-suggestions`
- `nc-iso-suggestions`

### Suppliers and external portal

- `supplier-auth`
- `supplier-auto-alerts`
- `supplier-notifications`

### Platform/admin operations

- `manage-platform`
- `manage-user`
- `platform-analytics`
- `invite-user`
- `delete-account`

### Misc integrations and support

- `custom-forms-management`
- `documents-management`
- `data-collection-management`
- `data-import-processor`
- `email-mailing-management`
- `marketplace-matcher`
- `cnpj-lookup`
- `cnpj-pdf-extractor`

## 7. Frontend Invocation Reality

Most frequent `supabase.functions.invoke(...)` call sites in frontend code:

- `custom-forms-management` (8 call sites)
- `quality-management` (5)
- `supplier-auth` (4)
- `license-ai-analyzer` (4)

Interpretation:

- Forms, quality operations, supplier auth, and license AI are high-traffic
  integration points and should be treated as backend-critical.
