/**
 * Central index for all demo mock data
 * Aggregates all module mock entries for the DemoDataSeeder
 */

import { dashboardMockEntries } from './dashboardMocks';
import { esgMockEntries } from './esgMocks';
import { environmentalMockEntries } from './environmentalMocks';
import { socialMockEntries } from './socialMocks';
import { governanceMockEntries } from './governanceMocks';
import { qualityMockEntries } from './qualityMocks';
import { supplierMockEntries } from './supplierMocks';
import { financialMockEntries } from './financialMocks';
import { settingsMockEntries } from './settingsMocks';
import { dataReportsMockEntries } from './dataReportsMocks';
import { organizationMockEntries } from './organizationMocks';

export interface MockEntry {
  queryKey: readonly unknown[];
  data: unknown;
}

/**
 * Returns all demo mock data entries for cache seeding
 */
export function getAllDemoMockData(): MockEntry[] {
  return [
    ...dashboardMockEntries,
    ...esgMockEntries,
    ...environmentalMockEntries,
    ...socialMockEntries,
    ...governanceMockEntries,
    ...qualityMockEntries,
    ...supplierMockEntries,
    ...financialMockEntries,
    ...settingsMockEntries,
    ...dataReportsMockEntries,
    ...organizationMockEntries,
  ] as MockEntry[];
}
