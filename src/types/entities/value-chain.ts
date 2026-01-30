/**
 * Value chain mapping related types
 */

export interface ExternalEntity {
  name: string;
  contact?: string;
  type?: string;
}

export interface ProcessRequirement {
  id?: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ProcessKPI {
  name: string;
  target?: number;
  unit?: string;
  frequency?: string;
}

export interface SLARequirement {
  metric: string;
  target_value: number;
  unit: string;
  measurement_period?: string;
}

export interface EscalationMatrixEntry {
  level: number;
  contact_role: string;
  response_time?: string;
  action?: string;
}

export interface PerformanceIndicator {
  name: string;
  target?: number;
  current?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface RelationshipData {
  client_department: string;
  supplier_department: string;
  service_description: string;
}
