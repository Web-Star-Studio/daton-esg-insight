import { supabase } from "@/integrations/supabase/client";

export interface ConservationActivity {
  id: string;
  company_id: string;
  activity_type: string;
  title: string;
  description?: string;
  location?: string;
  area_size?: number;
  coordinates?: any;
  start_date: string;
  end_date?: string;
  status: string;
  investment_amount: number;
  carbon_impact_estimate: number;
  methodology?: string;
  monitoring_plan?: string;
  responsible_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityMonitoring {
  id: string;
  activity_id: string;
  company_id: string;
  monitoring_date: string;
  progress_percentage: number;
  carbon_sequestered: number;
  area_completed: number;
  notes?: string;
  evidence_files: any;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConservationActivityType {
  id: string;
  name: string;
  description?: string;
  carbon_factor: number;
  unit: string;
  methodology_reference?: string;
  created_at: string;
}

export interface CreateActivityData {
  activity_type: string;
  title: string;
  description?: string;
  location?: string;
  area_size?: number;
  coordinates?: any;
  start_date: string;
  end_date?: string;
  status?: 'Planejada' | 'Em Andamento' | 'Concluída' | 'Suspensa';
  investment_amount?: number;
  carbon_impact_estimate?: number;
  methodology?: string;
  monitoring_plan?: string;
  responsible_user_id?: string;
}

export interface CreateMonitoringData {
  activity_id: string;
  monitoring_date: string;
  progress_percentage: number;
  carbon_sequestered: number;
  area_completed: number;
  notes?: string;
  evidence_files?: string[];
}

export interface CompensationDashboardStats {
  total_area: number;
  total_investment: number;
  total_carbon_estimate: number;
  total_carbon_sequestered: number;
  activities_count: number;
  active_activities_count: number;
}

class CarbonCompensationService {
  // Conservation Activities CRUD
  async getActivities(): Promise<ConservationActivity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('conservation_activities')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActivity(activityId: string): Promise<ConservationActivity | null> {
    const { data, error } = await supabase
      .from('conservation_activities')
      .select('*')
      .eq('id', activityId)
      .single();

    if (error) throw error;
    return data;
  }

  async createActivity(activityData: CreateActivityData): Promise<ConservationActivity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('conservation_activities')
      .insert({
        ...activityData,
        company_id: profile.company_id,
        status: activityData.status || 'Planejada',
        investment_amount: activityData.investment_amount || 0,
        carbon_impact_estimate: activityData.carbon_impact_estimate || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateActivity(activityId: string, activityData: Partial<CreateActivityData>): Promise<ConservationActivity> {
    const { data, error } = await supabase
      .from('conservation_activities')
      .update(activityData)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('conservation_activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
  }

  // Activity Monitoring CRUD
  async getMonitoring(activityId: string): Promise<ActivityMonitoring[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('activity_monitoring')
      .select('*')
      .eq('activity_id', activityId)
      .order('monitoring_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createMonitoring(monitoringData: CreateMonitoringData): Promise<ActivityMonitoring> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil do usuário não encontrado');

    const { data, error } = await supabase
      .from('activity_monitoring')
      .insert({
        ...monitoringData,
        company_id: profile.company_id,
        created_by_user_id: user.id,
        evidence_files: monitoringData.evidence_files || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Activity Types
  async getActivityTypes(): Promise<ConservationActivityType[]> {
    const { data, error } = await supabase
      .from('conservation_activity_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<CompensationDashboardStats> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil do usuário não encontrado');

    // Use the database function to calculate stats
    const { data, error } = await supabase
      .rpc('calculate_conservation_stats', { p_company_id: profile.company_id });

    if (error) throw error;
    
    return {
      total_area: (data as any)?.total_area || 0,
      total_investment: (data as any)?.total_investment || 0,
      total_carbon_estimate: (data as any)?.total_carbon_estimate || 0,
      total_carbon_sequestered: (data as any)?.total_carbon_sequestered || 0,
      activities_count: (data as any)?.activities_count || 0,
      active_activities_count: (data as any)?.active_activities_count || 0,
    };
  }

  // Calculate carbon impact estimate based on activity type and area
  async calculateCarbonImpact(activityType: string, area: number, years: number = 10): Promise<number> {
    const activityTypes = await this.getActivityTypes();
    const type = activityTypes.find(t => t.name === activityType);
    
    if (!type) return 0;
    
    // Basic calculation: carbon_factor * area * years
    return type.carbon_factor * area * years;
  }
}

export const carbonCompensationService = new CarbonCompensationService();