# Business Domains and Product Logic

Snapshot date: **2026-02-22**

## 1. Product Positioning

Daton ESG Insight is not a single-purpose ESG dashboard. It is a multi-domain
operating system for:

- ESG management (E/S/G)
- compliance and audits
- supplier governance and supplier portal
- document intelligence and AI extraction
- training/workforce operations
- financial and accounting integration
- integrated ESG reporting

## 2. Domain Map

### ESG Environmental (E)

Main concerns:

- GHG inventory and scope-level emissions
- resource monitoring (water/energy/emissions/waste)
- waste management and disposal operations
- licensing and permit tracking
- sustainability goals and carbon projects

Representative code:

- `src/services/ghgInventory.ts`
- `src/pages/InventarioGEE.tsx`
- `src/pages/DashboardGHG.tsx`
- `src/pages/Residuos.tsx`
- `src/pages/Licenciamento.tsx`

### ESG Social (S)

Main concerns:

- workforce structure and employee records
- training programs and efficacy
- safety/workplace incidents and inspections
- career development and organizational capability

Representative code:

- `src/pages/GestaoFuncionarios.tsx`
- `src/pages/GestaoTreinamentos.tsx`
- `src/pages/AvaliacaoEficacia.tsx`
- `src/services/trainingPrograms.ts`
- `src/services/safetyIncidents.ts`

### ESG Governance (G)

Main concerns:

- risk management
- compliance controls and obligations
- audits and findings
- stakeholder and materiality analysis

Representative code:

- `src/pages/GestaoRiscos.tsx`
- `src/pages/Compliance.tsx`
- `src/pages/Auditoria.tsx`
- `src/pages/AnaliseMaterialidade.tsx`
- `src/services/riskManagement.ts`

### Quality Management (SGQ)

Main concerns:

- process mapping and strategic planning
- non-conformity lifecycle
- corrective and preventive actions
- controlled documentation and LAIA

Representative code:

- `src/services/nonConformityService.ts`
- `src/services/unifiedQualityService.ts`
- `src/pages/NaoConformidades.tsx`
- `src/pages/PlanejamentoEstrategico.tsx`

### Supplier Management + Supplier Portal

Main concerns:

- supplier registration and taxonomy
- required document compliance and evaluations
- supplier scoring/failures/deliveries/surveys
- external supplier authentication and portal workflows

Representative code:

- `src/services/supplierManagementService.ts`
- `src/pages/SupplierManagementDashboard.tsx`
- `src/pages/supplier-portal/SupplierLogin.tsx`
- `supabase/functions/supplier-auth/index.ts`

### Documents + AI Intelligence

Main concerns:

- central document repository
- extraction jobs and approval workflows
- reconciliation and deduplication
- AI classification and structured extraction

Representative code:

- `src/pages/DocumentosHub.tsx`
- `src/services/documentAI.ts`
- `src/services/documentExtraction.ts`
- `supabase/functions/document-ai-processor/index.ts`
- `supabase/functions/intelligent-document-classifier/index.ts`

### Reporting and GRI

Main concerns:

- integrated reports (ESG + operations)
- GRI data collection and content generation
- section generation and report approvals

Representative code:

- `src/services/integratedReports.ts`
- `src/services/griReports.ts`
- `supabase/functions/gri-report-ai-configurator/index.ts`
- `supabase/functions/report-section-generator/index.ts`

### Financial Integration

Main concerns:

- accounting entries, payable/receivable, budgets, cash flow
- ESG-financial linkage and ROI analysis

Representative code:

- `src/pages/DashboardFinanceiro.tsx`
- `src/pages/PlanoContas.tsx`
- `src/services/esgFinancial.ts`
- `supabase/functions/calculate-esg-roi/index.ts`

## 3. Cross-Domain Business Workflow (Typical)

1. Data enters from operations (documents, forms, manual records, imports).
2. AI/services normalize and classify data into domain tables.
3. Teams execute workflow states (draft, review, approval, actions, follow-up).
4. Compliance/audit/quality checks create non-conformities or tasks.
5. Results aggregate into dashboards and integrated reports.
6. Supplier and internal stakeholders receive notifications and action requests.

## 4. User and Role Logic

Role model includes:

- `platform_admin`, `super_admin`, `admin`, `manager`, `analyst`, `operator`,
  `auditor`, `viewer`

Role enforcement occurs through:

- frontend guards (`src/middleware/roleGuard.tsx`,
  `src/components/ProtectedRoute.tsx`)
- database RLS policies and role mappings (`user_roles` table)

## 5. Business Characteristics

What this product does well:

- Combines ESG + compliance + operations in a single tenant-scoped platform.
- Connects structured workflow management with AI automation.
- Supports both internal operators and external suppliers.

What drives complexity:

- High module count with shared entities (`companies`, `profiles`).
- Many stateful lifecycle tables (audit, NC, licensing, report approvals).
- Large edge-function surface area with mixed auth models.
