# Codebase Overview

Snapshot date: **2026-02-22**

## 1. System Identity

Daton ESG Insight is a multi-module ESG, quality, compliance, supplier, and
operations platform built as a single React + TypeScript + Vite application
with Supabase as backend.

## 2. Technical Architecture

- Frontend: React 18 + TypeScript + Vite (`package.json`)
- UI: Tailwind + shadcn/Radix components
- Routing: React Router (`src/App.tsx`)
- State/data fetching: TanStack Query (`src/App.tsx`)
- Backend platform: Supabase Postgres, Auth, Storage, Edge Functions
- Supabase client: `src/integrations/supabase/client.ts`

## 3. Repository Shape

Main folders:

- `src/`: frontend app (pages, components, hooks, services, contexts)
- `supabase/functions/`: local Edge Functions source
- `supabase/migrations/`: SQL migration history
- `supabase/config.toml`: local Supabase runtime config + function jwt settings

Scale indicators (current code snapshot):

- `src/pages`: 169 files
- `src/services`: 208 files
- `src/hooks`: 108 files
- `src/components`: 902 files
- `src/contexts`: 8 files
- `supabase/functions` local functions: 64 directories (excluding `_shared`)

## 4. Where Core Logic Lives

Primary logic layers:

- Page orchestration: `src/pages/*`
- Reusable UI and feature components: `src/components/*`
- Business/data operations: `src/services/*`
- Domain hooks and composition: `src/hooks/*`
- Auth/company/session state: `src/contexts/*`
- Server-side workflows: `supabase/functions/*`

## 5. Cross-Cutting Platform Patterns

- Multi-tenant scope by company:
  - client services commonly resolve `company_id` via `profiles`
  - database tables strongly anchored to `company_id`
- Auth and role enforcement:
  - frontend route protection in `ProtectedRoute` and `RoleGuard`
  - database RLS policies at table level
- AI-assisted features:
  - document extraction, classification, report generation, quality suggestions
  - orchestration done through edge functions + service calls

## 6. Operational Reality

Supabase MCP shows a large live backend footprint:

- 375 public tables
- 610 foreign keys
- 375 RLS-enabled tables
- 773 RLS policies

This indicates a mature but complex domain model with high coupling around
tenant, user, supplier, audit, report, and ESG entities.

## 7. Important Navigation Files

- App shell and route map: `src/App.tsx`
- Main protected layout: `src/components/MainLayout.tsx`
- Sidebar module taxonomy: `src/components/AppSidebar.tsx`
- Canonical paths and legacy redirects: `src/constants/routePaths.ts`
- Module feature flags: `src/config/enabledModules.ts`
- Supabase client config: `src/integrations/supabase/client.ts`
