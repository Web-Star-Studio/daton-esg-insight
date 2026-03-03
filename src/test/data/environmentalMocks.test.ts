import { describe, it, expect } from 'vitest';
import { environmentalMockEntries } from '@/data/demo/environmentalMocks';

describe('environmentalMocks', () => {
  describe('Data integrity', () => {
    it('should export environmentalMockEntries as an array', () => {
      expect(Array.isArray(environmentalMockEntries)).toBe(true);
    });

    it('should not be empty', () => {
      expect(environmentalMockEntries.length).toBeGreaterThan(0);
    });

    it('should have unique query keys', () => {
      const keys = environmentalMockEntries.map(entry => JSON.stringify(entry.queryKey));
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Entry structure', () => {
    it('should have queryKey and data properties', () => {
      environmentalMockEntries.forEach(entry => {
        expect(entry).toHaveProperty('queryKey');
        expect(entry).toHaveProperty('data');
        expect(Array.isArray(entry.queryKey)).toBe(true);
      });
    });
  });

  describe('Emissions data', () => {
    it('should contain emissions-related entries', () => {
      const emissionsEntry = environmentalMockEntries.find(entry =>
        JSON.stringify(entry.queryKey).includes('emissions')
      );
      expect(emissionsEntry).toBeDefined();
    });

    it('should have valid emissions data structure', () => {
      const emissionsEntry = environmentalMockEntries.find(entry =>
        entry.queryKey[0] === 'emissions-data'
      );

      if (emissionsEntry && Array.isArray(emissionsEntry.data)) {
        emissionsEntry.data.forEach((emission: any) => {
          expect(emission).toHaveProperty('id');
          expect(emission).toHaveProperty('total_co2e');
          expect(typeof emission.total_co2e).toBe('number');
          expect(emission.total_co2e).toBeGreaterThanOrEqual(0);
        });
      }
    });
  });

  describe('Water monitoring data', () => {
    it('should contain water monitoring entries', () => {
      const waterEntry = environmentalMockEntries.find(entry =>
        JSON.stringify(entry.queryKey).includes('water')
      );
      expect(waterEntry).toBeDefined();
    });

    it('should have valid water data with proper numeric values', () => {
      const waterEntry = environmentalMockEntries.find(entry =>
        entry.queryKey[0] === 'water-monitoring'
      );

      if (waterEntry && typeof waterEntry.data === 'object' && waterEntry.data !== null) {
        const data = waterEntry.data as any;
        if ('total_withdrawal_m3' in data) {
          expect(typeof data.total_withdrawal_m3).toBe('number');
          expect(data.total_withdrawal_m3).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Energy monitoring data', () => {
    it('should contain energy monitoring entries', () => {
      const energyEntry = environmentalMockEntries.find(entry =>
        JSON.stringify(entry.queryKey).includes('energy')
      );
      expect(energyEntry).toBeDefined();
    });

    it('should have valid energy consumption values', () => {
      const energyEntry = environmentalMockEntries.find(entry =>
        entry.queryKey[0] === 'energy-monitoring'
      );

      if (energyEntry && typeof energyEntry.data === 'object' && energyEntry.data !== null) {
        const data = energyEntry.data as any;
        if ('total_consumption_gj' in data) {
          expect(typeof data.total_consumption_gj).toBe('number');
          expect(data.total_consumption_gj).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Waste monitoring data', () => {
    it('should contain waste monitoring entries', () => {
      const wasteEntry = environmentalMockEntries.find(entry =>
        JSON.stringify(entry.queryKey).includes('waste')
      );
      expect(wasteEntry).toBeDefined();
    });

    it('should have valid waste data structure', () => {
      const wasteEntry = environmentalMockEntries.find(entry =>
        entry.queryKey[0] === 'waste-monitoring'
      );

      if (wasteEntry && typeof wasteEntry.data === 'object' && wasteEntry.data !== null) {
        const data = wasteEntry.data as any;
        if ('total_generated_tonnes' in data) {
          expect(typeof data.total_generated_tonnes).toBe('number');
          expect(data.total_generated_tonnes).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Assets hierarchy', () => {
    it('should contain assets hierarchy data', () => {
      const assetsEntry = environmentalMockEntries.find(entry =>
        entry.queryKey[0] === 'assets-hierarchy'
      );
      expect(assetsEntry).toBeDefined();
    });

    it('should have valid asset structure with children', () => {
      const assetsEntry = environmentalMockEntries.find(entry =>
        entry.queryKey[0] === 'assets-hierarchy'
      );

      if (assetsEntry && Array.isArray(assetsEntry.data)) {
        assetsEntry.data.forEach((asset: any) => {
          expect(asset).toHaveProperty('id');
          expect(asset).toHaveProperty('name');
          expect(asset).toHaveProperty('asset_type');
          expect(asset).toHaveProperty('children');
          expect(Array.isArray(asset.children)).toBe(true);
        });
      }
    });
  });

  describe('Numeric consistency', () => {
    it('should have valid numbers (no NaN or Infinity)', () => {
      const checkNumbers = (obj: any) => {
        if (typeof obj === 'number') {
          expect(isNaN(obj)).toBe(false);
          expect(isFinite(obj)).toBe(true);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(checkNumbers);
        }
      };

      environmentalMockEntries.forEach(entry => {
        checkNumbers(entry.data);
      });
    });

    it('should have positive values for quantities and totals', () => {
      environmentalMockEntries.forEach(entry => {
        if (typeof entry.data === 'object' && entry.data !== null && !Array.isArray(entry.data)) {
          const data = entry.data as Record<string, any>;
          Object.entries(data).forEach(([key, value]) => {
            if (
              typeof value === 'number' &&
              (key.includes('total') || key.includes('quantity') || key.includes('volume'))
            ) {
              expect(value).toBeGreaterThanOrEqual(0);
            }
          });
        }
      });
    });
  });

  describe('Date fields', () => {
    it('should have valid ISO date formats', () => {
      const checkDates = (obj: any) => {
        if (typeof obj === 'string' && (obj.includes('T') || obj.includes('Z'))) {
          const date = new Date(obj);
          expect(date.toString()).not.toBe('Invalid Date');
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(checkDates);
        }
      };

      environmentalMockEntries.forEach(entry => {
        checkDates(entry.data);
      });
    });
  });

  describe('Environmental categories coverage', () => {
    it('should cover main environmental domains', () => {
      const hasEmissions = environmentalMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('emissions')
      );
      const hasWater = environmentalMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('water')
      );
      const hasEnergy = environmentalMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('energy')
      );
      const hasWaste = environmentalMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('waste')
      );

      expect(hasEmissions).toBe(true);
      expect(hasWater).toBe(true);
      expect(hasEnergy).toBe(true);
      expect(hasWaste).toBe(true);
    });
  });

  describe('Company ID consistency', () => {
    it('should use consistent company_id where applicable', () => {
      const companyIds = new Set<string>();

      const extractCompanyIds = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          if ('company_id' in obj && typeof obj.company_id === 'string') {
            companyIds.add(obj.company_id);
          }
          Object.values(obj).forEach(extractCompanyIds);
        }
      };

      environmentalMockEntries.forEach(entry => {
        extractCompanyIds(entry.data);
      });

      // Should have at most one company ID for demo data
      expect(companyIds.size).toBeLessThanOrEqual(1);
    });
  });

  describe('Scope data for emissions', () => {
    it('should have valid scope values (1, 2, or 3)', () => {
      environmentalMockEntries.forEach(entry => {
        const checkScope = (obj: any) => {
          if (typeof obj === 'object' && obj !== null) {
            if ('scope' in obj && typeof obj.scope === 'number') {
              expect([1, 2, 3]).toContain(obj.scope);
            }
            Object.values(obj).forEach(checkScope);
          }
        };
        checkScope(entry.data);
      });
    });
  });

  describe('Percentage values', () => {
    it('should have percentages between 0 and 100', () => {
      const checkPercentages = (obj: any, key: string) => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([k, v]) => {
            if (typeof v === 'number' && (k.includes('percentage') || k.includes('rate'))) {
              expect(v).toBeGreaterThanOrEqual(0);
              expect(v).toBeLessThanOrEqual(100);
            } else if (typeof v === 'object') {
              checkPercentages(v, k);
            }
          });
        }
      };

      environmentalMockEntries.forEach(entry => {
        checkPercentages(entry.data, '');
      });
    });
  });
});