import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MaintenanceSchedule {
  id: string;
  company_id: string;
  asset_id: string;
  maintenance_type: string;
  frequency_days: number;
  last_maintenance_date?: string;
  next_maintenance_date: string;
  responsible_user_id?: string;
  priority: string;
  estimated_cost?: number;
  estimated_duration_hours?: number;
  maintenance_checklist: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: string;
  company_id: string;
  asset_id: string;
  schedule_id?: string;
  maintenance_type: string;
  maintenance_date: string;
  performed_by_user_id?: string;
  actual_cost?: number;
  actual_duration_hours?: number;
  status: string;
  description?: string;
  issues_found?: string;
  parts_replaced: any[];
  next_recommended_date?: string;
  evidence_files: any[];
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceScheduleData {
  asset_id: string;
  maintenance_type: string;
  frequency_days: number;
  next_maintenance_date: string;
  responsible_user_id?: string;
  priority?: string;
  estimated_cost?: number;
  estimated_duration_hours?: number;
  maintenance_checklist?: any[];
}

export interface CreateMaintenanceRecordData {
  asset_id: string;
  schedule_id?: string;
  maintenance_type: string;
  maintenance_date: string;
  performed_by_user_id?: string;
  actual_cost?: number;
  actual_duration_hours?: number;
  status?: string;
  description?: string;
  issues_found?: string;
  parts_replaced?: any[];
  next_recommended_date?: string;
  evidence_files?: any[];
}

// Maintenance Schedules
export const useMaintenanceSchedules = () => {
  return useQuery({
    queryKey: ['maintenance-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_maintenance_schedules')
        .select(`
          *,
          assets(name, asset_type, location)
        `)
        .eq('is_active', true)
        .order('next_maintenance_date');

      if (error) throw error;
      return data as (MaintenanceSchedule & { assets: any })[];
    }
  });
};

export const useCreateMaintenanceSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateMaintenanceScheduleData) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID not found');

      const { data: schedule, error } = await supabase
        .from('equipment_maintenance_schedules')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
    }
  });
};

// Maintenance Records
export const useMaintenanceRecords = () => {
  return useQuery({
    queryKey: ['maintenance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          assets(name, asset_type, location)
        `)
        .order('maintenance_date', { ascending: false });

      if (error) throw error;
      return data as (MaintenanceRecord & { assets: any })[];
    }
  });
};

export const useCreateMaintenanceRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateMaintenanceRecordData) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID not found');

      const { data: record, error } = await supabase
        .from('maintenance_records')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;

      // Update schedule if linked
      if (data.schedule_id && data.next_recommended_date) {
        await supabase
          .from('equipment_maintenance_schedules')
          .update({
            last_maintenance_date: data.maintenance_date,
            next_maintenance_date: data.next_recommended_date
          })
          .eq('id', data.schedule_id);
      }

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
    }
  });
};

export const useMaintenanceStats = () => {
  return useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => {
      const { data: schedules } = await supabase
        .from('equipment_maintenance_schedules')
        .select('next_maintenance_date, priority')
        .eq('is_active', true);

      const { data: records } = await supabase
        .from('maintenance_records')
        .select('actual_cost, maintenance_date')
        .gte('maintenance_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const today = new Date().toISOString().split('T')[0];
      const overdue = schedules?.filter(s => s.next_maintenance_date < today).length || 0;
      const upcoming = schedules?.filter(s => {
        const date = new Date(s.next_maintenance_date);
        const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return date <= weekFromNow && date >= new Date(today);
      }).length || 0;

      const totalCost = records?.reduce((sum, r) => sum + (r.actual_cost || 0), 0) || 0;
      const completedLastMonth = records?.length || 0;

      return {
        overdue,
        upcoming,
        totalCost,
        completedLastMonth,
        totalScheduled: schedules?.length || 0
      };
    }
  });
};