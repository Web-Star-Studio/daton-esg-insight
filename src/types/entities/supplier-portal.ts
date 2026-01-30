/**
 * Supplier portal related types
 */

export interface TrainingProgressRecord {
  training_material_id: string;
  supplier_id: string;
  status: 'Não Iniciado' | 'Em Andamento' | 'Concluído';
  started_at?: string;
  completed_at?: string;
  score?: number;
}

export interface ReadingConfirmationBasic {
  reading_id: string;
}

export interface TrainingProgressUpdate {
  supplier_id: string;
  training_material_id: string;
  status: string;
  started_at?: string;
  completed_at?: string;
  score?: number;
  updated_at: string;
}

export interface PerformanceMetricsUpdate {
  qualityScore?: number;
  deliveryScore?: number;
  costPerformanceScore?: number;
  serviceLevelScore?: number;
  periodStart: string;
  periodEnd: string;
  metricsData?: Record<string, number | string | boolean>;
}
