export type ReportType = 'executive' | 'conditions_detailed' | 'compliance' | 'renewal_dossier';

export type ReportFormat = 'pdf' | 'excel' | 'both';

export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  period_start?: string;
  period_end?: string;
  sections: {
    license_info: boolean;
    conditions: boolean;
    alerts: boolean;
    documents: boolean;
    history: boolean;
  };
  options: {
    include_charts: boolean;
    include_watermark: boolean;
    digital_signature: boolean;
  };
}

export interface GeneratedReport {
  id: string;
  license_id: string;
  company_id: string;
  report_type: ReportType;
  report_config: ReportConfig;
  file_path_pdf?: string;
  file_path_xlsx?: string;
  generated_by_user_id: string;
  generated_at: string;
  created_at: string;
}

export interface ReportTemplate {
  title: string;
  description: string;
  icon: string;
  sections: string[];
  estimatedPages: number;
}
