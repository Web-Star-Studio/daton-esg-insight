/**
 * Quality management entity types
 */

export interface RiskMatrixCell {
  probability: string;
  impact: string;
  risks: unknown[];
  count: number;
}

export interface RiskCounts {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RiskMatrixResult {
  matrix: RiskMatrixCell[];
  riskCounts: RiskCounts;
}

export interface OccurrenceMetrics {
  total: number;
  thisYear: number;
  open: number;
  inTreatment: number;
  resolved: number;
  closed: number;
  byImpact: Record<string, number>;
  totalFinancialImpact: number;
  avgResolutionDays: number;
}

export interface OccurrenceTrendPoint {
  month: string;
  count: number;
  highImpact: number;
  financialImpact: number;
}

export interface QualityIndicator {
  id: string;
  name: string;
  value: number;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface NonConformity {
  id: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at?: string;
  resolved_at?: string;
}

export interface LogContext {
  [key: string]: unknown;
}
