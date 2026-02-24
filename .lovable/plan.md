

# Make Dashboard Cards Navigate to Filtered Assessments

## Overview

The four summary cards in the LAIA unit dashboard (Total, Significativos, Criticos, Nao Significativos) will become clickable, switching to the "Avaliacoes" tab with the relevant filter pre-applied.

## Filter Mapping

| Card                | Filter Applied                        |
|---------------------|---------------------------------------|
| Total de Aspectos   | Switch to Avaliacoes tab (no filter)  |
| Significativos      | `significance = "significativo"`      |
| Criticos            | `category = "critico"`                |
| Nao Significativos  | `significance = "nao_significativo"`  |

## Changes

### 1. `src/components/laia/LAIADashboard.tsx`

- Add an `onCardClick` callback prop: `(filter?: { category?: string; significance?: string }) => void`
- Wrap each card with a clickable handler that calls `onCardClick` with the appropriate filter
- Add `cursor-pointer hover:shadow-md transition-shadow` styling to cards

### 2. `src/components/laia/LAIAAssessmentTable.tsx`

- Add an optional `initialFilters` prop to allow parent to set filters from outside
- Use a `useEffect` to sync `initialFilters` into the internal filter state when it changes

### 3. `src/pages/LAIAUnidadePage.tsx`

- Add state for `assessmentInitialFilters`
- Pass `onCardClick` to `LAIADashboard` that:
  1. Sets the initial filters state
  2. Switches `activeTab` to `"assessments"`
- Pass `initialFilters` to `LAIAAssessmentTable`

## Technical Details

The flow is:
1. User clicks a card in the dashboard
2. `LAIADashboard` calls `onCardClick({ significance: "significativo" })` (for example)
3. `LAIAUnidadePage` stores the filter and switches to the assessments tab
4. `LAIAAssessmentTable` receives the filter via `initialFilters` prop and applies it
5. User sees the filtered list of assessments

No database or service changes required -- this is purely a UI wiring change across 3 files.
