import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CalibrationSchedule {
  id: string;
  company_id: string;
  asset_id: string;
  calibration_standard?: string;
  frequency_months: number;
  last_calibration_date?: string;
  next_calibration_date: string;
  calibration_provider?: string;
  certificate_required: boolean;
  tolerance_range: any;
  responsible_user_id?: string;
  estimated_cost?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalibrationRecord {
  id: string;
  company_id: string;
  asset_id: string;
  schedule_id?: string;
  calibration_date: string;
  calibration_provider?: string;
  certificate_number?: string;
  certificate_file_path?: string;
  calibration_result: string;
  measurements_before: any;
  measurements_after: any;
  adjustments_made?: string;
  next_calibration_date?: string;
  performed_by_user_id?: string;
  actual_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCalibrationScheduleData {
  asset_id: string;
  calibration_standard?: string;
  frequency_months?: number;
  next_calibration_date: string;
  calibration_provider?: string;
  certificate_required?: boolean;
  tolerance_range?: any;
  responsible_user_id?: string;
  estimated_cost?: number;
}

export interface CreateCalibrationRecordData {
  asset_id: string;
  schedule_id?: string;
  calibration_date: string;
  calibration_provider?: string;
  certificate_number?: string;
  certificate_file_path?: string;
  calibration_result?: string;
  measurements_before?: any;
  measurements_after?: any;
  adjustments_made?: string;
  next_calibration_date?: string;
  performed_by_user_id?: string;
  actual_cost?: number;
  notes?: string;
}

// Calibration Schedules
export const useCalibrationSchedules = () => {
  return useQuery({
    queryKey: ['calibration-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calibration_schedules')
        .select(`
          *,
          assets(name, asset_type, location)
        `)
        .eq('is_active', true)
        .order('next_calibration_date');

      if (error) throw error;
      return data as (CalibrationSchedule & { assets: any })[];
    }
  });
};

export const useCreateCalibrationSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCalibrationScheduleData) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID not found');

      const { data: schedule, error } = await supabase
        .from('calibration_schedules')
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
      queryClient.invalidateQueries({ queryKey: ['calibration-schedules'] });
    }
  });
};

// Calibration Records
export const useCalibrationRecords = () => {
  return useQuery({
    queryKey: ['calibration-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calibration_records')
        .select(`
          *,
          assets(name, asset_type, location)
        `)
        .order('calibration_date', { ascending: false });

      if (error) throw error;
      return data as (CalibrationRecord & { assets: any })[];
    }
  });
};

export const useCreateCalibrationRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCalibrationRecordData) => {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) throw new Error('Company ID not found');

      const { data: record, error } = await supabase
        .from('calibration_records')
        .insert({
          ...data,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;

      // Update schedule if linked
      if (data.schedule_id && data.next_calibration_date) {
        await supabase
          .from('calibration_schedules')
          .update({
            last_calibration_date: data.calibration_date,
            next_calibration_date: data.next_calibration_date
          })
          .eq('id', data.schedule_id);
      }

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calibration-records'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-schedules'] });
    }
  });
};

export const useCalibrationStats = () => {
  return useQuery({
    queryKey: ['calibration-stats'],
    queryFn: async () => {
      const { data: schedules } = await supabase
        .from('calibration_schedules')
        .select('next_calibration_date, certificate_required')
        .eq('is_active', true);

      const { data: records } = await supabase
        .from('calibration_records')
        .select('calibration_result, actual_cost, calibration_date')
        .gte('calibration_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      const today = new Date().toISOString().split('T')[0];
      const overdue = schedules?.filter(s => s.next_calibration_date < today).length || 0;
      const upcoming = schedules?.filter(s => {
        const date = new Date(s.next_calibration_date);
        const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return date <= monthFromNow && date >= new Date(today);
      }).length || 0;

      const totalCost = records?.reduce((sum, r) => sum + (r.actual_cost || 0), 0) || 0;
      const approved = records?.filter(r => r.calibration_result === 'aprovado').length || 0;
      const completedLastMonth = records?.length || 0;

      return {
        overdue,
        upcoming,
        totalCost,
        approved,
        completedLastMonth,
        totalScheduled: schedules?.length || 0,
        approvalRate: completedLastMonth > 0 ? (approved / completedLastMonth) * 100 : 0
      };
    }
  });
};