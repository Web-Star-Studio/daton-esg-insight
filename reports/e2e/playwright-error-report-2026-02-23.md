# Playwright E2E Error Report

- Date: 2026-02-23
- Repository: `/home/webstar/projetos/daton-esg-insight`
- Command: `bunx playwright test`
- Browser project: `chromium`
- Base URL: `http://127.0.0.1:4173`

## Executive Summary

- Total tests: 4
- Passed: 3
- Failed: 1
- Failed spec: `tests/e2e/demo-features.spec.ts:275`
- Failed test: `all /demo ESG routes open without runtime errors`
- Duration: ~2.0m

The failure is concentrated in the route sweep assertion that expects zero runtime/navigation errors across all demo ESG pages.

## What Passed

- `tests/e2e/demo-features.spec.ts:262` `/demo is accessible in dev for account role=platform_admin`
- `tests/e2e/demo-features.spec.ts:262` `/demo is accessible in dev for account role=viewer`
- `tests/e2e/smoke.spec.ts:3` `landing page loads`

## What Failed

- `tests/e2e/demo-features.spec.ts:275` `all /demo ESG routes open without runtime errors`

Assertion failed at `tests/e2e/demo-features.spec.ts:330` because `failures` array was not empty.

## Affected Routes (11/38)

1. `/demo/nao-conformidades`
2. `/demo/acoes-corretivas`
3. `/demo/licenciamento`
4. `/demo/social-esg`
5. `/demo/gestao-funcionarios`
6. `/demo/seguranca-trabalho`
7. `/demo/desenvolvimento-carreira`
8. `/demo/dashboard-ghg`
9. `/demo/metas`
10. `/demo/metas-sustentabilidade` (redirects to `/demo/metas`)
11. `/demo/gestao-riscos`

## Error Signatures Observed

- `Invalid time value`
- `timeline?.map is not a function`
- `upcomingConditions.forEach is not a function`
- `upcomingConditions?.filter is not a function`
- `enrollments.map is not a function`
- `inspections.filter is not a function`
- `careerPlans?.filter is not a function`
- `riskMatrices?.map is not a function`
- `Cannot read properties of undefined (reading 'map')`
- `Cannot read properties of undefined (reading 'length')`
- `visible error boundary/message in UI`

## High-Confidence Source Locations

Based on stack traces and symbol matching:

- `src/components/IntelligentAlertsSystem.tsx:104` (`upcomingConditions.forEach`)
- `src/components/IntelligentAlertsSystem.tsx:178` (`upcomingConditions?.filter`)
- `src/components/NonConformityTimelineModal.tsx:99` (`timeline?.map`)
- `src/components/EmployeeBenefitsModal.tsx:85` / `src/components/EmployeeBenefitsModal.tsx:181` (`enrollments.map`)
- `src/pages/SeguracaTrabalho.tsx:148` (`inspections.filter`)
- `src/pages/DesenvolvimentoCarreira.tsx:131` (`careerPlans?.filter`)
- `src/pages/GestaoRiscos.tsx:321` (`riskMatrices?.map`)

## Probable Root Cause

Primary cause is likely data-shape mismatch in the E2E network mock used by this spec:

- `tests/e2e/demo-features.spec.ts:193` returns generic fallback payloads for all `/rest/v1/*` requests:
  - object `{}` when `accept` asks for PostgREST object
  - array `[]` otherwise

Many pages/components assume a specific array shape and immediately call `.map/.filter/.length` without full runtime normalization for mock responses. That creates `... is not a function` and `undefined.length` failures during the route sweep.

A secondary cause appears in date handling (`Invalid time value`) where invalid/empty dates are formatted without strong guards in some UI paths.

## Evidence Artifacts

- Raw run log: `reports/e2e/latest-run.log`
- ANSI-stripped log: `reports/e2e/latest-run.clean.log`
- Extracted failures block: `reports/e2e/route-failures.raw.txt`
- Playwright HTML report: `playwright-report/index.html`
- Failure screenshot: `test-results/demo-features-all-demo-ESG-04779-open-without-runtime-errors-chromium/test-failed-1.png`
- Failure video: `test-results/demo-features-all-demo-ESG-04779-open-without-runtime-errors-chromium/video.webm`
- Error context snapshot: `test-results/demo-features-all-demo-ESG-04779-open-without-runtime-errors-chromium/error-context.md`

## Recommended Fix Plan

1. Harden the E2E mock layer in `tests/e2e/demo-features.spec.ts`.
- Replace generic `/rest/v1/*` fallback with route-specific fixtures for endpoints consumed by these 11 routes.
- Ensure each endpoint returns correct shape (array vs object) and required fields.

2. Add defensive data normalization in UI/service boundaries.
- Convert uncertain query results to arrays before `.map/.filter`.
- Guard date formatting with validity checks before `new Date(...)/format(...)`.

3. Re-run targeted route suite while fixing.
- `bunx playwright test tests/e2e/demo-features.spec.ts -g "all /demo ESG routes"`

4. After green targeted run, re-run full E2E.
- `bunx playwright test`

