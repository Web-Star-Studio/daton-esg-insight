export interface RenewalSchedule {
  id: string;
  license_id: string;
  company_id: string;
  scheduled_start_date: string;
  protocol_deadline: string;
  expected_completion_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to_user_id?: string;
  notification_config?: {
    reminders: number[]; // days before
    channels: ('email' | 'in_app')[];
  };
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalWizardStep {
  step: number;
  title: string;
  completed: boolean;
}

export interface RenewalFormData {
  scheduled_start_date: Date;
  protocol_deadline: Date;
  expected_completion_date?: Date;
  assigned_to_user_id?: string;
  notification_days: number[];
  notification_channels: ('email' | 'in_app')[];
  create_tasks: boolean;
}

export interface RenewalSuggestion {
  ideal_start_date: Date;
  protocol_deadline: Date;
  estimated_completion: Date;
  days_until_expiration: number;
  is_within_deadline: boolean;
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
}
