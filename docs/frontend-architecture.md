# Frontend Architecture

Snapshot date: **2026-02-22**

## 1. App Composition

Entry points:

- `src/main.tsx`: renders app, web vitals logging, service worker registration
- `src/App.tsx`: full route map, providers, query client setup, lazy loading

Provider and shell layers in `src/App.tsx`:

- `HelmetProvider`
- `ThemeProvider`
- `QueryClientProvider`
- `AuthProvider`
- `CompanyProvider`
- Toaster providers and global UX systems

Protected layout:

- `ProtectedRoute` wraps authenticated pages and mounts `MainLayout`
- `ProtectedLazyPageWrapper` combines `ProtectedRoute` + lazy loading fallback
- `MainLayout` includes sidebar, header, breadcrumbs, onboarding flow, and
  global chat assistant (`src/components/MainLayout.tsx`)

## 2. Routing Model

Route structure in `src/App.tsx`:

- Public routes (`/`, `/auth`, `/reset-password`, landing/static pages)
- Demo routes under `/demo` for non-approved users
- Protected main product routes (`/dashboard` and module routes)
- External supplier portal routes (`/fornecedor/*`)
- Legacy redirects to canonical URLs

Canonical path registry:

- `src/constants/routePaths.ts` centralizes route names
- Includes legacy mapping (`LEGACY_REDIRECTS`) and helper functions

## 3. Auth, Approval, and Role Control

Auth lifecycle:

- `AuthContext` manages session, profile fetch, onboarding state, login/register
  (`src/contexts/AuthContext.tsx`)
- `authService.getCurrentUser()` loads profile + company + role from
  `user_roles` (`src/services/auth.ts`)

Access gating:

- `ProtectedRoute` flow:
  - no session -> `/auth`
  - unapproved + needs onboarding -> `/onboarding`
  - unapproved -> `/demo`
  - approved -> render application
- Role hierarchy in `src/middleware/roleGuard.tsx`:
  - `platform_admin` > `super_admin` > `admin` > `manager` > `analyst` >
    `operator` > `auditor` > `viewer`

## 4. Module Gating and Navigation

Feature toggles:

- `src/config/enabledModules.ts` gates modules and sets disabled route patterns
- `src/App.tsx` contains conditional redirects for disabled modules

Current toggles from code:

- disabled: `financial`, `dataReports`, `esgGovernance`
- enabled: `esgEnvironmental`, `esgSocial`, `quality`, `suppliers`, etc.

Navigation taxonomy:

- `src/components/AppSidebar.tsx` defines module tree:
  - ESG (ambiental/social/governanca)
  - Qualidade (SGQ)
  - Fornecedores
  - Financeiro
  - Reports/data/config/admin sections

## 5. Data Access Pattern

Supabase integration:

- Client initialized in `src/integrations/supabase/client.ts`
- Services in `src/services/*` handle table CRUD and edge function calls
- Hooks in `src/hooks/*` orchestrate state + async behavior for components

Edge invocation hotspots from code scan:

- `custom-forms-management`
- `quality-management`
- `supplier-auth`
- `license-ai-analyzer`
- `daton-ai-chat`

## 6. Frontend Domain Breadth

Large domain surface exists across pages/services/components:

- ESG emissions and monitoring
- licensing and legislation compliance
- audit and non-conformities
- supplier management and supplier portal
- HR/training/workforce
- integrated reporting and AI insights
- document hub with extraction/reconciliation/deduplication

## 7. Observed Strengths and Complexity Risks

Strengths:

- Strong lazy-loading discipline in route layer
- Centralized auth and role enforcement model
- Clear separation: pages/components/hooks/services

Complexity risks:

- Very large `App.tsx` route map can become change-fragile
- Some route validation lists appear static/manual
  (`src/components/RouteValidator.tsx`)
- Parallel legacy and canonical paths increase redirect maintenance burden
