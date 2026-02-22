
# Complete Database Entity-Relationship Diagram

## Overview

The Daton ESG Insight system has **376 tables** with **610 foreign key relationships** across multiple business domains. The ER diagram will be implemented as a dedicated interactive page in the application, since the sheer volume of entities makes a static diagram impractical.

## Approach

Create a new page `/er-diagram` with a comprehensive, interactive, domain-grouped ER visualization built with React and SVG/Canvas, reusing the existing database schema parser infrastructure.

## Domain Groups (organized by business area)

The tables will be grouped into the following domains:

1. **Core / Auth** -- `companies`, `profiles`, `user_roles`, `platform_admins`, `permissions`, `role_permissions`, `user_custom_permissions`, `branches`, `system_settings`, etc.
2. **Employees / HR** -- `employees`, `departments`, `positions`, `organizational_chart`, `attendance_records`, `employee_benefits`, `employee_education`, `employee_experiences`, `employee_schedules`, `benefit_enrollments`, etc.
3. **Training / LMS** -- `training_programs`, `employee_trainings`, `training_courses`, `course_modules`, `course_enrollments`, `assessments`, `assessment_questions`, `assessment_attempts`, `training_documents`, etc.
4. **Environmental / GHG** -- `emission_sources`, `emission_factors`, `activity_data`, `calculated_emissions`, `energy_consumption_data`, `waste_logs`, `water_monitoring`, `carbon_projects`, `credit_purchases`, `credit_retirements`, etc.
5. **Licenses** -- `licenses`, `license_alerts`, `license_conditions`, `license_observations`, `license_ai_analysis`, `license_documents`, etc.
6. **Conservation / Biodiversity** -- `conservation_activities`, `conservation_activity_types`, `activity_monitoring`, `circular_economy_assessments`, `pgrs_plans`, `pgrs_waste_sources`, etc.
7. **Quality (SGQ)** -- `non_conformities`, `corrective_actions`, `action_plans`, `action_plan_items`, `quality_indicators`, `indicator_measurements`, `indicator_targets`, `process_maps`, `process_steps`, `calibration_records`, etc.
8. **Audits (SGI)** -- `audits`, `audit_templates`, `audit_categories`, `audit_standards`, `audit_standard_items`, `audit_sessions`, `audit_session_items`, `audit_findings`, `audit_evidence`, `audit_scoring_config`, `audit_programs`, `audit_plans`, etc.
9. **Documents** -- `documents`, `document_folders`, `document_versions`, `document_approvals`, `document_master_list`, `document_controlled_copies`, `document_permissions`, `document_audit_trail`, etc.
10. **Suppliers** -- `suppliers`, `supplier_evaluations`, `evaluation_criteria`, `evaluation_scores`, `supplier_documents`, `supplier_contracts`, `supplier_portal_users`, etc.
11. **Financial** -- `accounts_payable`, `accounts_receivable`, `bank_accounts`, `chart_of_accounts`, `accounting_entries`, `accounting_entry_lines`, `cost_centers`, `budgets`, `cash_flow_transactions`, etc.
12. **Strategic / BSC** -- `bsc_perspectives`, `bsc_objectives`, `okrs`, `key_results`, `strategic_initiatives`, `strategic_associations`, `swot_analysis`, `swot_items`, etc.
13. **Projects** -- `projects`, `project_tasks`, `project_milestones`, `project_resources`, `project_scope_changes`, `project_burndown_data`, etc.
14. **Safety** -- `safety_incidents`, `safety_inspections`, `safety_risk_assessments`, etc.
15. **Risks** -- `esg_risks`, `risk_occurrences`, `opportunities`, `risk_treatments`, etc.
16. **GRI / Reporting** -- `gri_reports`, `gri_report_sections`, `gri_indicator_data`, `gri_indicators_library`, `materiality_topics`, `sdg_alignment`, `esrs_disclosures`, `double_materiality_matrix`, etc.
17. **AI / Chat** -- `ai_chat_conversations`, `ai_chat_messages`, `ai_operation_history`, `ai_operation_feedback`, `ai_performance_metrics`, `ai_extraction_patterns`, etc.
18. **Compliance / Legal** -- `regulatory_requirements`, `compliance_tasks`, `legislation`, `legislation_history`, `legal_documents`, `corporate_policies`, etc.
19. **Communication** -- `email_campaigns`, `email_campaign_sends`, `email_mailing_lists`, `notifications`, `custom_forms`, `form_submissions`, etc.
20. **Assets** -- `assets`, `asset_ownership_records`, `equipment_maintenance_schedules`, etc.
21. **Marketplace** -- `esg_solution_providers`, `esg_solutions`, `marketplace_leads`, `solution_reviews`, etc.
22. **Customer Complaints** -- `customer_complaints`, etc.
23. **Knowledge Base** -- `knowledge_base_articles`, `article_versions`, `article_comments`, `article_bookmarks`, `article_approvals`, etc.
24. **Career Development** -- `career_development_plans`, `mentoring_relationships`, `competency_matrix`, etc.

## Implementation Plan

### Step 1: Create the ER Diagram data utility

File: `src/utils/erDiagramData.ts`

- Parse all 376 tables from the Supabase types
- Map all 610 foreign key relationships
- Group tables into the 24 domains listed above
- Export structured data for rendering

### Step 2: Create the ER Diagram page

File: `src/pages/ERDiagram.tsx`

- Full-screen interactive viewer
- Left sidebar with domain filter (collapsible list of domains with checkboxes)
- Main area with a scrollable/zoomable canvas rendering entity boxes and relationship lines
- Each entity box shows: table name, column count, FK count
- Click an entity to expand and see all columns with types and FK indicators
- Relationship lines drawn between connected tables
- Color-coded by domain
- Search bar to find specific tables
- Export to PNG option using html2canvas (already installed)

### Step 3: Create supporting components

- `src/components/er-diagram/ERDomainFilter.tsx` -- Domain selection sidebar
- `src/components/er-diagram/EREntityBox.tsx` -- Individual table box component
- `src/components/er-diagram/ERRelationshipLine.tsx` -- SVG line between entities
- `src/components/er-diagram/ERDiagramCanvas.tsx` -- Main canvas with pan/zoom

### Step 4: Add route

Update `src/App.tsx` to add lazy-loaded route for `/er-diagram`.

## Technical Details

### Data Source

The diagram will be generated from the auto-generated Supabase types file (`src/integrations/supabase/types.ts`), augmented by the existing `databaseSchemaParser.ts` utility, plus a hardcoded FK mapping derived from the live database query results (since Supabase types don't encode FK relationships).

### Rendering Strategy

Given 376 tables, a force-directed graph would be too chaotic. Instead, use a **grid-based domain layout**:
- Each domain gets a titled section
- Tables within a domain are laid out in a grid
- Cross-domain FK lines are drawn as curved SVG paths
- Users can toggle domains on/off to reduce visual noise
- Pan and zoom via CSS transform

### Color Palette (per domain)

Each domain gets a distinct color for its entity boxes and relationship lines, using the existing design system colors.

### Performance

- Use `React.memo` and virtualization for entity boxes
- Only render visible entities based on viewport
- Lazy compute relationship lines
- Domain filtering reduces rendered entities significantly
