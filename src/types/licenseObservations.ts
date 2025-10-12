export interface LicenseObservation {
  id: string;
  license_id: string;
  company_id: string;
  created_by_user_id: string;
  title: string;
  observation_text: string;
  observation_type: 'nota' | 'inspeção' | 'comunicação' | 'incidente' | 'melhoria';
  category?: 'técnica' | 'jurídica' | 'operacional' | 'administrativa';
  priority: 'baixa' | 'média' | 'alta';
  visibility: 'interna' | 'pública' | 'restrita';
  related_alert_id?: string;
  related_condition_id?: string;
  related_document_ids: string[];
  requires_followup: boolean;
  followup_date?: string;
  followup_assigned_to?: string;
  is_archived: boolean;
  tags: string[];
  attachments: any[];
  metadata: any;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface CreateObservationInput {
  license_id: string;
  title: string;
  observation_text: string;
  observation_type: LicenseObservation['observation_type'];
  category?: LicenseObservation['category'];
  priority?: LicenseObservation['priority'];
  visibility?: LicenseObservation['visibility'];
  related_alert_id?: string;
  related_condition_id?: string;
  related_document_ids?: string[];
  requires_followup?: boolean;
  followup_date?: string;
  followup_assigned_to?: string;
  tags?: string[];
}

export interface UpdateObservationInput {
  title?: string;
  observation_text?: string;
  observation_type?: LicenseObservation['observation_type'];
  category?: LicenseObservation['category'];
  priority?: LicenseObservation['priority'];
  visibility?: LicenseObservation['visibility'];
  related_alert_id?: string;
  related_condition_id?: string;
  related_document_ids?: string[];
  requires_followup?: boolean;
  followup_date?: string;
  followup_assigned_to?: string;
  tags?: string[];
}

export interface ObservationFilters {
  observation_type?: LicenseObservation['observation_type'];
  category?: LicenseObservation['category'];
  priority?: LicenseObservation['priority'];
  is_archived?: boolean;
  requires_followup?: boolean;
  created_by?: string;
  tags?: string[];
}

export interface ObservationStats {
  total: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  requiring_followup: number;
  archived: number;
}

export interface Comment {
  id: string;
  alert_id?: string;
  observation_id?: string;
  company_id: string;
  user_id: string;
  comment_text: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
  };
}
