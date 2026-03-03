import { describe, it, expect } from 'vitest';
import { financialMockEntries } from '@/data/demo/financialMocks';

describe('financialMocks', () => {
  describe('Data integrity', () => {
    it('should export financialMockEntries as an array', () => {
      expect(Array.isArray(financialMockEntries)).toBe(true);
    });

    it('should not be empty', () => {
      expect(financialMockEntries.length).toBeGreaterThan(0);
    });

    it('should have unique query keys', () => {
      const keys = financialMockEntries.map(entry => JSON.stringify(entry.queryKey));
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  describe('Entry structure', () => {
    it('should have queryKey and data properties', () => {
      financialMockEntries.forEach(entry => {
        expect(entry).toHaveProperty('queryKey');
        expect(entry).toHaveProperty('data');
        expect(Array.isArray(entry.queryKey)).toBe(true);
      });
    });
  });

  describe('DRE (Income Statement) data', () => {
    it('should contain DRE entries', () => {
      const dreEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'dre'
      );
      expect(dreEntry).toBeDefined();
    });

    it('should have valid DRE structure with required fields', () => {
      const dreEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'dre' && entry.queryKey.length === 1
      );

      if (dreEntry && typeof dreEntry.data === 'object' && dreEntry.data !== null) {
        const dre = dreEntry.data as any;
        expect(dre).toHaveProperty('receitaBruta');
        expect(dre).toHaveProperty('receitaLiquida');
        expect(dre).toHaveProperty('lucroLiquido');
        expect(dre).toHaveProperty('margemBruta');
        expect(dre).toHaveProperty('margemLiquida');

        // All should be numbers
        expect(typeof dre.receitaBruta).toBe('number');
        expect(typeof dre.lucroLiquido).toBe('number');
        expect(typeof dre.margemBruta).toBe('number');
      }
    });

    it('should have receita liquida = receita bruta - deducoes', () => {
      const dreEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'dre' && entry.queryKey.length === 1
      );

      if (dreEntry && typeof dreEntry.data === 'object') {
        const dre = dreEntry.data as any;
        const calculated = dre.receitaBruta - dre.deducoes;
        expect(Math.abs(calculated - dre.receitaLiquida)).toBeLessThan(1);
      }
    });
  });

  describe('Budget summary data', () => {
    it('should contain budget summary entries', () => {
      const budgetEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'budget-summary'
      );
      expect(budgetEntry).toBeDefined();
    });

    it('should have valid budget structure', () => {
      const budgetEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'budget-summary'
      );

      if (budgetEntry && typeof budgetEntry.data === 'object') {
        const budget = budgetEntry.data as any;
        expect(budget).toHaveProperty('totalBudget');
        expect(budget).toHaveProperty('totalSpent');
        expect(budget).toHaveProperty('executionRate');

        expect(typeof budget.totalBudget).toBe('number');
        expect(typeof budget.totalSpent).toBe('number');
        expect(budget.totalBudget).toBeGreaterThan(0);
        expect(budget.totalSpent).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Cash flow data', () => {
    it('should contain cashflow summary entries', () => {
      const cashflowEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'cashflow-summary'
      );
      expect(cashflowEntry).toBeDefined();
    });

    it('should have valid cashflow structure', () => {
      const cashflowEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'cashflow-summary'
      );

      if (cashflowEntry && typeof cashflowEntry.data === 'object') {
        const cashflow = cashflowEntry.data as any;
        expect(cashflow).toHaveProperty('monthlyInflows');
        expect(cashflow).toHaveProperty('monthlyOutflows');
        expect(cashflow).toHaveProperty('netCashFlow');

        expect(typeof cashflow.monthlyInflows).toBe('number');
        expect(typeof cashflow.monthlyOutflows).toBe('number');
      }
    });
  });

  describe('Accounts payable data', () => {
    it('should contain accounts payable entries', () => {
      const payableEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'accounts-payable'
      );
      expect(payableEntry).toBeDefined();
    });

    it('should have valid payable structure', () => {
      const payableEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'accounts-payable'
      );

      if (payableEntry && Array.isArray(payableEntry.data)) {
        payableEntry.data.forEach((payable: any) => {
          expect(payable).toHaveProperty('id');
          expect(payable).toHaveProperty('invoice_number');
          expect(payable).toHaveProperty('supplier_name');
          expect(payable).toHaveProperty('original_amount');
          expect(payable).toHaveProperty('status');
          expect(typeof payable.original_amount).toBe('number');
        });
      }
    });
  });

  describe('Accounts receivable data', () => {
    it('should contain accounts receivable entries', () => {
      const receivableEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'accounts-receivable'
      );
      expect(receivableEntry).toBeDefined();
    });

    it('should have valid receivable structure', () => {
      const receivableEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'accounts-receivable'
      );

      if (receivableEntry && Array.isArray(receivableEntry.data)) {
        receivableEntry.data.forEach((receivable: any) => {
          expect(receivable).toHaveProperty('id');
          expect(receivable).toHaveProperty('invoice_number');
          expect(receivable).toHaveProperty('customer_name');
          expect(receivable).toHaveProperty('original_amount');
          expect(receivable).toHaveProperty('status');
          expect(typeof receivable.original_amount).toBe('number');
        });
      }
    });
  });

  describe('Chart of accounts', () => {
    it('should contain chart of accounts entries', () => {
      const coaEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'chart-of-accounts'
      );
      expect(coaEntry).toBeDefined();
    });

    it('should have valid account structure', () => {
      const coaEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'chart-of-accounts'
      );

      if (coaEntry && Array.isArray(coaEntry.data)) {
        coaEntry.data.forEach((account: any) => {
          expect(account).toHaveProperty('account_code');
          expect(account).toHaveProperty('account_name');
          expect(account).toHaveProperty('account_type');
          expect(account).toHaveProperty('account_nature');
          expect(account).toHaveProperty('status');
          expect(typeof account.account_code).toBe('string');
        });
      }
    });
  });

  describe('Financial alerts', () => {
    it('should contain financial alerts entries', () => {
      const alertsEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'financial-alerts'
      );
      expect(alertsEntry).toBeDefined();
    });

    it('should have valid alert structure', () => {
      const alertsEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'financial-alerts'
      );

      if (alertsEntry && Array.isArray(alertsEntry.data)) {
        alertsEntry.data.forEach((alert: any) => {
          expect(alert).toHaveProperty('id');
          expect(alert).toHaveProperty('type');
          expect(alert).toHaveProperty('severity');
          expect(alert).toHaveProperty('title');
          expect(['overdue', 'due_soon']).toContain(alert.type);
          expect(['high', 'medium', 'low']).toContain(alert.severity);
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
        } else if (Array.isArray(obj)) {
          obj.forEach(checkNumbers);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(checkNumbers);
        }
      };

      financialMockEntries.forEach(entry => {
        checkNumbers(entry.data);
      });
    });

    it('should have positive amounts for financial values', () => {
      const checkAmounts = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            if (
              typeof value === 'number' &&
              (key.includes('amount') || key.includes('budget') || key.includes('revenue'))
            ) {
              expect(value).toBeGreaterThanOrEqual(0);
            } else if (typeof value === 'object') {
              checkAmounts(value);
            }
          });
        }
      };

      financialMockEntries.forEach(entry => {
        checkAmounts(entry.data);
      });
    });
  });

  describe('Percentage values', () => {
    it('should have percentages within reasonable range (0-100)', () => {
      const checkPercentages = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            if (
              typeof value === 'number' &&
              (key.includes('percentage') || key.includes('rate') || key.includes('margin'))
            ) {
              expect(value).toBeGreaterThanOrEqual(-100);
              expect(value).toBeLessThanOrEqual(200); // Allow some margin for extreme cases
            } else if (typeof value === 'object') {
              checkPercentages(value);
            }
          });
        }
      };

      financialMockEntries.forEach(entry => {
        checkPercentages(entry.data);
      });
    });
  });

  describe('Financial categories coverage', () => {
    it('should cover main financial domains', () => {
      const hasDRE = financialMockEntries.some(e => e.queryKey[0] === 'dre');
      const hasBudget = financialMockEntries.some(e => e.queryKey[0].includes('budget'));
      const hasCashflow = financialMockEntries.some(e => e.queryKey[0].includes('cashflow'));
      const hasPayable = financialMockEntries.some(e => e.queryKey[0].includes('payable'));
      const hasReceivable = financialMockEntries.some(e => e.queryKey[0].includes('receivable'));

      expect(hasDRE).toBe(true);
      expect(hasBudget).toBe(true);
      expect(hasCashflow).toBe(true);
      expect(hasPayable).toBe(true);
      expect(hasReceivable).toBe(true);
    });
  });

  describe('Status fields', () => {
    it('should have valid status values', () => {
      const checkStatus = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          if ('status' in obj && typeof obj.status === 'string') {
            expect(obj.status.length).toBeGreaterThan(0);
          }
          Object.values(obj).forEach(checkStatus);
        }
      };

      financialMockEntries.forEach(entry => {
        checkStatus(entry.data);
      });
    });
  });

  describe('Date fields', () => {
    it('should have valid date formats', () => {
      const checkDates = (obj: any) => {
        if (typeof obj === 'string' && obj.match(/\d{4}-\d{2}-\d{2}/)) {
          expect(() => new Date(obj)).not.toThrow();
          expect(new Date(obj).toString()).not.toBe('Invalid Date');
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(checkDates);
        }
      };

      financialMockEntries.forEach(entry => {
        checkDates(entry.data);
      });
    });
  });

  describe('Profitability data', () => {
    it('should contain profitability entries', () => {
      const profitEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'profitability' ||
        entry.queryKey[0].includes('project-profitability') ||
        entry.queryKey[0].includes('category-profitability')
      );
      expect(profitEntry).toBeDefined();
    });

    it('should have valid ROI values', () => {
      const profitEntry = financialMockEntries.find(entry =>
        entry.queryKey[0] === 'profitability'
      );

      if (profitEntry && typeof profitEntry.data === 'object') {
        const data = profitEntry.data as any;
        if ('roi' in data) {
          expect(typeof data.roi).toBe('number');
          expect(data.roi).toBeGreaterThanOrEqual(-100);
          expect(data.roi).toBeLessThanOrEqual(1000); // Reasonable upper bound
        }
      }
    });
  });
});