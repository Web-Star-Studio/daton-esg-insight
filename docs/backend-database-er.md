# Backend: Database Entity-Relationship (Supabase)

Snapshot date: **2026-02-22**  
Source: Supabase MCP (`execute_sql`, `list_edge_functions`)

## 1. Schema Scale

From live MCP queries:

- Public tables: **375**
- Public views: **1**
- Foreign keys: **610**
- RLS-enabled public tables: **375**
- Public schema policies: **773**

This is a high-complexity relational model with strict row-level security.

## 2. Core Tenancy and Identity Model

Primary structural anchors:

- `companies` is the main tenant root
- `profiles` links user identity to tenant context
- `auth.users` is referenced by many auth/user-related entities

Common relationship pattern:

- `many_domain_tables.company_id -> companies.id`
- user attribution columns (`created_by_user_id`, `responsible_user_id`,
  `uploader_user_id`, etc.) frequently point to `profiles.id`

This model enforces tenant isolation and auditable actor lineage across modules.

## 3. FK Topology Hotspots

Top FK-degree entities from MCP graph query:

- `companies`: 162 incoming FKs
- `auth.users`: 73 incoming FKs
- `profiles`: 51 incoming + 2 outgoing
- `employees`: 27 incoming + 2 outgoing
- `supplier_management`: 17 incoming + 2 outgoing
- `gri_reports`: 18 incoming
- `documents`: 14 incoming + 3 outgoing
- `audits`: 13 incoming + 3 outgoing
- `legislations`: 6 incoming + 7 outgoing
- `licenses`: 8 incoming + 3 outgoing

Interpretation:

- `companies` is the strongest tenant dependency node.
- `profiles` is the strongest user-context bridge node.
- supplier/audit/document/license/legislation tables are central business graph
  clusters.

## 4. Domain Cluster Density (table name prefix analysis)

Most represented prefixes:

- `supplier`: 32 tables
- `audit`: 29
- `gri`: 20
- `document`: 11
- `license`: 9
- `esg`: 8
- `training`: 8
- `indicator`: 8
- `report`: 6
- `employee`: 6
- `legislation`: 6
- `nc`: 5

This aligns with product scope: supplier governance, audit/compliance,
document+AI workflows, ESG reporting, and workforce/training.

## 5. Example Domain Tables by Cluster

Supplier:

- `supplier_management`
- `supplier_required_documents`
- `supplier_document_submissions`
- `supplier_evaluation_criteria`
- `supplier_deliveries`
- `supplier_surveys`

Audit:

- `audits`
- `audit_plans`
- `audit_findings`
- `audit_checklists`
- `audit_notifications`
- `audit_occurrences`

Documents:

- `documents`
- `document_extraction_jobs`
- `document_approvals`
- `document_master_list`
- `document_audit_trail`
- `document_patterns`

Licenses + legislation:

- `licenses`
- `license_alerts`
- `license_conditions`
- `license_observations`
- `legislations`
- `legislation_compliance_profiles`

Quality / NC:

- `non_conformities`
- `nc_immediate_actions`
- `nc_cause_analysis`
- `nc_action_plans`
- `nc_effectiveness`
- `nc_tasks`

## 6. RLS Posture

Every public table is RLS-enabled in current snapshot.

Highest policy-count tables:

- `user_roles` (9 policies)
- `cost_centers` (8)
- `training_efficacy_evaluations` (8)
- `companies` (7)
- `training_documents` (7)
- `profiles` (6)

This indicates heavy per-role/per-operation policy segmentation.

## 7. Enum Model Signals

Enums confirm strongly typed domain states, including:

- licensing lifecycle (`license_status_enum`, `license_type_enum`)
- report lifecycle (`report_status_enum`, `report_template_enum`)
- workflow + permissions (`workflow_step_type_enum`, `permission_level_enum`)
- role models (`user_role_type`, `user_role_enum`)
- ESG/document categories (`gri_*_enum`, `document_type_enum`)
- environmental domains (`waste_*_enum`, `water_*_enum`)

## 8. Practical ER Mental Model

Tenant and identity backbone:

- `companies` <- `profiles` <- user-attributed records

Operational module spokes:

- ESG metrics/emissions/goals/risk tables
- supplier lifecycle and supplier portal tables
- audit + quality + non-conformity lifecycle tables
- documents + extraction + approval + reconciliation tables
- report + GRI + approvals + generated sections

Cross-cutting support:

- notifications, analytics, automation, AI feedback/history tables

## 9. Engineering Implications

- Schema changes should assume broad FK impact due central `companies` coupling.
- RLS policy updates can have wide behavior effects and require end-to-end
  authorization tests.
- Any module-level refactor should start with FK + policy mapping before
  feature edits.
