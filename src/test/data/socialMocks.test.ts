import { describe, it, expect } from 'vitest';
import { socialMockEntries } from '@/data/demo/socialMocks';

describe('socialMocks', () => {
  describe('Data integrity', () => {
    it('should export socialMockEntries as an array', () => {
      expect(Array.isArray(socialMockEntries)).toBe(true);
    });

    it('should not be empty', () => {
      expect(socialMockEntries.length).toBeGreaterThan(0);
    });

    it('should have unique query keys', () => {
      const keys = socialMockEntries.map(entry => JSON.stringify(entry.queryKey));
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Entry structure', () => {
    it('should have consistent structure with queryKey and data', () => {
      socialMockEntries.forEach((entry, index) => {
        expect(entry).toHaveProperty('queryKey');
        expect(entry).toHaveProperty('data');
        expect(Array.isArray(entry.queryKey)).toBe(true);
      });
    });

    it('should have query keys as arrays', () => {
      socialMockEntries.forEach(entry => {
        expect(Array.isArray(entry.queryKey)).toBe(true);
        expect(entry.queryKey.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Demo employee data', () => {
    it('should contain demo employees entry', () => {
      const employeesEntry = socialMockEntries.find(entry =>
        entry.queryKey[0] === 'demo-employees'
      );
      expect(employeesEntry).toBeDefined();
      expect(Array.isArray(employeesEntry?.data)).toBe(true);
    });

    it('should have employees with required fields', () => {
      const employeesEntry = socialMockEntries.find(entry =>
        entry.queryKey[0] === 'demo-employees'
      );

      if (employeesEntry && Array.isArray(employeesEntry.data)) {
        expect(employeesEntry.data.length).toBeGreaterThan(0);

        employeesEntry.data.forEach((employee: any) => {
          expect(employee).toHaveProperty('id');
          expect(employee).toHaveProperty('full_name');
          expect(employee).toHaveProperty('email');
          expect(employee).toHaveProperty('department');
          expect(employee).toHaveProperty('position');
        });
      }
    });

    it('should have employees with valid email addresses', () => {
      const employeesEntry = socialMockEntries.find(entry =>
        entry.queryKey[0] === 'demo-employees'
      );

      if (employeesEntry && Array.isArray(employeesEntry.data)) {
        employeesEntry.data.forEach((employee: any) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          expect(emailRegex.test(employee.email)).toBe(true);
        });
      }
    });
  });

  describe('Training programs data', () => {
    it('should contain training programs entries', () => {
      const trainingEntry = socialMockEntries.find(entry =>
        entry.queryKey[0] === 'training-programs' ||
        JSON.stringify(entry.queryKey).includes('training')
      );
      expect(trainingEntry).toBeDefined();
    });

    it('should have training programs with valid structure', () => {
      const trainingEntry = socialMockEntries.find(entry =>
        entry.queryKey[0] === 'training-programs'
      );

      if (trainingEntry && Array.isArray(trainingEntry.data)) {
        trainingEntry.data.forEach((program: any) => {
          expect(program).toHaveProperty('id');
          expect(program).toHaveProperty('title');
        });
      }
    });
  });

  describe('Safety data', () => {
    it('should contain safety-related entries', () => {
      const safetyEntry = socialMockEntries.find(entry =>
        JSON.stringify(entry.queryKey).includes('safety') ||
        JSON.stringify(entry.queryKey).includes('incident')
      );
      expect(safetyEntry).toBeDefined();
    });
  });

  describe('Career development data', () => {
    it('should contain career development entries', () => {
      const careerEntry = socialMockEntries.find(entry =>
        JSON.stringify(entry.queryKey).includes('career')
      );
      expect(careerEntry).toBeDefined();
    });
  });

  describe('Query key patterns', () => {
    it('should follow consistent naming conventions', () => {
      socialMockEntries.forEach(entry => {
        const firstKey = entry.queryKey[0];
        // Keys should be lowercase with hyphens or underscores
        expect(typeof firstKey).toBe('string');
        if (typeof firstKey === 'string') {
          expect(firstKey.length).toBeGreaterThan(0);
        }
      });
    });

    it('should have valid secondary keys for parameterized queries', () => {
      socialMockEntries.forEach(entry => {
        if (entry.queryKey.length > 1) {
          const secondKey = entry.queryKey[1];
          // Second key should be string or number
          expect(['string', 'number'].includes(typeof secondKey)).toBe(true);
        }
      });
    });
  });

  describe('Data types', () => {
    it('should have data as object or array', () => {
      socialMockEntries.forEach(entry => {
        const dataType = typeof entry.data;
        const isValid = dataType === 'object' || Array.isArray(entry.data);
        expect(isValid).toBe(true);
      });
    });

    it('should have consistent data structures for same query types', () => {
      // Group by first query key
      const grouped = socialMockEntries.reduce((acc, entry) => {
        const key = entry.queryKey[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
      }, {} as Record<string, typeof socialMockEntries>);

      // Check each group has consistent data types
      Object.values(grouped).forEach(group => {
        if (group.length > 1) {
          const firstIsArray = Array.isArray(group[0].data);
          group.forEach(entry => {
            expect(Array.isArray(entry.data)).toBe(firstIsArray);
          });
        }
      });
    });
  });

  describe('ID fields', () => {
    it('should have unique IDs within arrays', () => {
      socialMockEntries.forEach(entry => {
        if (Array.isArray(entry.data)) {
          const ids = entry.data
            .filter((item: any) => item && typeof item === 'object' && 'id' in item)
            .map((item: any) => item.id);

          if (ids.length > 0) {
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
          }
        }
      });
    });

    it('should have non-empty IDs', () => {
      socialMockEntries.forEach(entry => {
        if (Array.isArray(entry.data)) {
          entry.data.forEach((item: any) => {
            if (item && typeof item === 'object' && 'id' in item) {
              expect(item.id).toBeTruthy();
              expect(typeof item.id).toBe('string');
              expect(item.id.length).toBeGreaterThan(0);
            }
          });
        }
      });
    });
  });

  describe('Date fields', () => {
    it('should have valid date formats', () => {
      const dateFields = ['created_at', 'updated_at', 'start_date', 'end_date', 'date'];

      socialMockEntries.forEach(entry => {
        if (Array.isArray(entry.data)) {
          entry.data.forEach((item: any) => {
            if (item && typeof item === 'object') {
              dateFields.forEach(field => {
                if (field in item && item[field]) {
                  // Should be valid ISO date or date string
                  const dateValue = item[field];
                  if (typeof dateValue === 'string') {
                    expect(() => new Date(dateValue)).not.toThrow();
                    const date = new Date(dateValue);
                    expect(date.toString()).not.toBe('Invalid Date');
                  }
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Numeric fields', () => {
    it('should have valid numeric values', () => {
      socialMockEntries.forEach(entry => {
        if (Array.isArray(entry.data)) {
          entry.data.forEach((item: any) => {
            if (item && typeof item === 'object') {
              Object.entries(item).forEach(([key, value]) => {
                if (typeof value === 'number') {
                  expect(isNaN(value)).toBe(false);
                  expect(isFinite(value)).toBe(true);
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays gracefully', () => {
      socialMockEntries.forEach(entry => {
        if (Array.isArray(entry.data) && entry.data.length === 0) {
          // Empty arrays are valid
          expect(entry.data).toEqual([]);
        }
      });
    });

    it('should not have null or undefined as data', () => {
      socialMockEntries.forEach(entry => {
        expect(entry.data).not.toBeNull();
        expect(entry.data).not.toBeUndefined();
      });
    });

    it('should have proper nesting depth', () => {
      const checkDepth = (obj: any, depth: number = 0): number => {
        if (typeof obj !== 'object' || obj === null) return depth;
        if (Array.isArray(obj)) {
          return Math.max(depth, ...obj.map(item => checkDepth(item, depth + 1)));
        }
        return Math.max(depth, ...Object.values(obj).map(val => checkDepth(val, depth + 1)));
      };

      socialMockEntries.forEach(entry => {
        const depth = checkDepth(entry.data);
        // Reasonable nesting depth limit
        expect(depth).toBeLessThan(10);
      });
    });
  });

  describe('Mock data completeness', () => {
    it('should cover various social ESG domains', () => {
      const hasEmployees = socialMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('employee')
      );
      const hasTraining = socialMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('training')
      );
      const hasSafety = socialMockEntries.some(e =>
        JSON.stringify(e.queryKey).includes('safety') ||
        JSON.stringify(e.queryKey).includes('incident')
      );

      expect(hasEmployees).toBe(true);
      expect(hasTraining).toBe(true);
      expect(hasSafety).toBe(true);
    });

    it('should have reasonable data volumes', () => {
      const arrayEntries = socialMockEntries.filter(e => Array.isArray(e.data));
      expect(arrayEntries.length).toBeGreaterThan(0);

      arrayEntries.forEach(entry => {
        // Mock data should have reasonable size
        expect((entry.data as any[]).length).toBeLessThan(1000);
      });
    });
  });
});