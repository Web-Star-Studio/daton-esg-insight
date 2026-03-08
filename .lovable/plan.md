

# Module: Gestão de Documentos e Registros (ISO 9001:2015 - Item 7.5)

Based on the PSG-DOC-2 procedure document and analysis of the existing codebase.

## Current State

The system already has foundational infrastructure:
- **Database tables**: `documents`, `document_versions`, `document_approvals`, `document_approval_workflows`, `document_master_list`, `document_controlled_copies`, `document_permissions`, `document_audit_trail`
- **Services**: `gedDocuments.ts` with version, approval, master list, controlled copy, and audit trail services
- **UI**: Basic SGQ/ISO upload tab, regulatory documents tab, and a compliance operations tab

However, the existing UI is **fragmented and incomplete** — it does not implement the full PSG-DOC lifecycle described in the document. The services exist but are not wired to a cohesive user interface.

## What PSG-DOC-2 Requires (mapped to ISO 9001:2015 item 7.5)

1. **Document hierarchy** (5 levels): MSG, PSG, IT/PSO, RG, FPLAN
2. **Automatic coding**: PSG-XX, IT-XX.YY, RG-XX.ZZ, FPLAN-001
3. **Approval workflow**: Elaboração → Aprovação → Distribuição → Implementação
4. **Revision control**: 12-month review cycle, obsolescence management
5. **Master List (Lista Mestra)**: Central registry of all controlled documents
6. **Controlled vs. Uncontrolled copies**: Distribution tracking with implementation protocol (RG-DOC.01)
7. **Read confirmation (Implementação)**: Users must confirm they read/implemented the document
8. **Retention and disposition**: Archive or destroy after retention period
9. **External document control**: Legislation via SOGI, supplier documents with quarterly validation
10. **Audit trail**: Full traceability of all actions

## User Stories

### Epic 1: Document Lifecycle Management
- **US1.1**: As a SGI Coordinator, I can create a new document selecting its level (MSG/PSG/IT/PSO/RG/FPLAN) and the system auto-generates the correct code
- **US1.2**: As a document author, I can submit a document for approval through a configurable workflow (Draft → Under Review → Approved → Published)
- **US1.3**: As an approver, I can approve or reject documents with comments, and the system notifies the author
- **US1.4**: As a SGI Coordinator, I can trigger a revision cycle and the system tracks the 12-month review deadline per document

### Epic 2: Master List & Distribution
- **US2.1**: As a SGI Coordinator, I can view the Master List (Lista Mestra) showing all active controlled documents with code, version, effective date, department, and distribution
- **US2.2**: As a SGI Coordinator, I can manage controlled copies — assign copies to users/departments and track distribution
- **US2.3**: As a document recipient, I receive a notification when a new or revised document is distributed to me

### Epic 3: Read Confirmation & Implementation Protocol
- **US3.1**: As a distributed user, I must confirm I read and understood the document (implementation protocol)
- **US3.2**: As a SGI Coordinator, I can see a dashboard of pending read confirmations per document
- **US3.3**: As a SGI Coordinator, I can generate the Implementation Protocol report (RG-DOC.01 equivalent)

### Epic 4: Obsolescence & Retention
- **US4.1**: As a SGI Coordinator, I can mark a document as obsolete, and the system removes it from active distribution while keeping it archived
- **US4.2**: As a SGI Coordinator, I can configure retention periods per document type and the system alerts when disposition is due
- **US4.3**: As a SGI Coordinator, I can apply disposition actions (archive/destroy) with mandatory justification and audit trail

### Epic 5: External Documents & Legislation
- **US5.1**: As a SGI Coordinator, I can register external documents (legislation, supplier docs) with validity tracking
- **US5.2**: The system alerts quarterly for supplier document revalidation

## Implementation Plan

### Phase 1: Restructure the Document Control Page (replace current `/controle-documentos`)

Build a new unified page with 6 tabs:

```text
┌─────────────────────────────────────────────────────────┐
│  Controle de Documentos e Registros                     │
│  ISO 9001:2015 - Item 7.5                               │
├─────────┬──────────┬──────────┬─────────┬───────┬───────┤
│ Docs    │ Lista    │ Aprovação│ Implem. │ Obsol.│ Ext.  │
│ Sistema │ Mestra   │          │         │       │       │
└─────────┴──────────┴──────────┴─────────┴───────┴───────┘
```

**Tab 1 - Documentos do Sistema**: Full CRUD for internal documents with:
- Level selector (Nível 1-5)
- Auto-code generation based on level + type
- Upload with branch linking (reuse existing)
- Status badge (Rascunho / Em Aprovação / Aprovado / Obsoleto)
- Version history sidebar
- Filter by level, status, department

**Tab 2 - Lista Mestra**: Read-only registry view using `document_master_list` table
- Auto-populated from approved documents
- Export to Excel/PDF
- Shows: Code, Title, Version, Effective Date, Review Date, Department, Distribution

**Tab 3 - Aprovação**: Workflow queue using `document_approvals` + `document_approval_workflows`
- Pending approvals list for current user
- Approve/Reject with comments
- Workflow configuration (for Admin/Coordinator)

**Tab 4 - Implementação (RG-DOC.01)**: Read confirmation dashboard
- Per-document confirmation tracking using existing `document_read_confirmations`
- Pending confirmations for current user
- Report generation

**Tab 5 - Obsolescência e Retenção**: Merge existing compliance tab
- 12-month review alerts
- Disposition actions (archive/destroy)
- Retention policy configuration

**Tab 6 - Documentos Externos**: External/legislation documents
- Supplier document validity tracking
- Quarterly revalidation alerts

### Phase 2: Database Migrations

New columns/tables needed:
- Add `document_level` enum (`nivel_1_msg`, `nivel_2_psg`, `nivel_3_it_pso`, `nivel_4_rg`, `nivel_5_fplan`) to `documents`
- Add `review_due_date` (timestamp) to `documents` for 12-month cycle
- Add `status` enum (`rascunho`, `em_aprovacao`, `aprovado`, `publicado`, `obsoleto`) — consolidate with existing `approval_status`
- Create `document_external` table for external/legislation tracking with quarterly alerts

### Phase 3: Services & Hooks

- Extend `gedDocuments.ts` with code auto-generation logic
- Create `useDocumentLifecycle` hook for state transitions
- Create `useDocumentReviewCycle` hook for 12-month alerts
- Reuse existing services: `documentCompliance.ts`, `documentApprovalLog.ts`

### Phase 4: Components

New components under `src/components/document-control/`:
- `SystemDocumentsTab.tsx` — replaces SGQIsoDocumentsTab
- `MasterListTab.tsx` — Lista Mestra view
- `ApprovalQueueTab.tsx` — approval workflow UI
- `ImplementationProtocolTab.tsx` — read confirmations
- `ObsolescenceRetentionTab.tsx` — refactored from existing compliance tab
- `ExternalDocumentsTab.tsx` — external docs management
- `DocumentCodeGenerator.tsx` — auto-code component
- `DocumentLevelBadge.tsx` — visual level indicator
- `ReviewCycleAlert.tsx` — 12-month alert component

### Summary of Effort

| Phase | Scope | Complexity |
|-------|-------|------------|
| Phase 1 | New page structure + 6 tabs | Medium |
| Phase 2 | DB migrations (2-3 migrations) | Low |
| Phase 3 | Services + hooks (3-4 files) | Medium |
| Phase 4 | 8-9 new components | High |

The approach reuses all existing database tables and services, adding only what's missing. No existing functionality is deleted — it's reorganized into the PSG-DOC-2 compliant structure.

