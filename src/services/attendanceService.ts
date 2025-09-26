import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  averageHoursWorked: number;
  overtimeHours: number;
  leaveRequests: number;
  pendingApprovals: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee?: {
    full_name: string;
    employee_code: string;
    department: string;
  };
  date: string;
  check_in?: string;
  check_out?: string;
  break_start?: string;
  break_end?: string;
  total_hours?: number;
  overtime_hours?: number;
  status: string;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee?: {
    full_name: string;
    employee_code: string;
    department: string;
  };
  type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  status: string;
  requested_by_user_id: string;
  approved_by_user_id?: string;
  approved_at?: string;
  notes?: string;
}

export interface WorkSchedule {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  work_days: number[];
  is_active: boolean;
}

// Services
class AttendanceService {
  // Statistics
  async getAttendanceStats(companyId: string): Promise<AttendanceStats> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get total employees
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'Ativo');

    if (employeesError) throw employeesError;
    const totalEmployees = employees?.length || 0;

    // Get today's attendance records
    const { data: todayRecords, error: recordsError } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('company_id', companyId)
      .eq('date', today);

    if (recordsError) throw recordsError;

    const presentToday = todayRecords?.filter(r => r.status === 'present').length || 0;
    const lateToday = todayRecords?.filter(r => r.status === 'late').length || 0;
    const absentToday = totalEmployees - (todayRecords?.length || 0);

    // Get current month overtime
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: monthlyRecords, error: monthlyError } = await supabase
      .from('attendance_records')
      .select('overtime_hours, total_hours')
      .eq('company_id', companyId)
      .gte('date', startOfMonth);

    if (monthlyError) throw monthlyError;

    const overtimeHours = monthlyRecords?.reduce((sum, record) => sum + (record.overtime_hours || 0), 0) || 0;
    const averageHoursWorked = monthlyRecords?.reduce((sum, record) => sum + (record.total_hours || 0), 0) / (monthlyRecords?.length || 1) || 0;

    // Get pending leave requests
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'pending');

    if (leaveError) throw leaveError;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      averageHoursWorked: Math.round(averageHoursWorked * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      leaveRequests: leaveRequests?.length || 0,
      pendingApprovals: leaveRequests?.length || 0
    };
  }

  // Attendance Records
  async getAttendanceRecords(companyId: string, filters?: { 
    startDate?: string; 
    endDate?: string; 
    employeeId?: string;
    department?: string;
    status?: string;
  }): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance_records')
      .select(`
        *,
        employee:employees!employee_id (
          full_name,
          employee_code,
          department
        )
      `)
      .eq('company_id', companyId)
      .order('date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data?.filter(record => {
      if (filters?.department && filters.department !== 'all') {
        return record.employee?.department === filters.department;
      }
      return true;
    }) || [];
  }

  async createAttendanceRecord(companyId: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const { employee, ...recordData } = record;
    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        company_id: companyId,
        employee_id: recordData.employee_id!,
        date: recordData.date!,
        check_in: recordData.check_in,
        check_out: recordData.check_out,
        break_start: recordData.break_start,
        break_end: recordData.break_end,
        total_hours: recordData.total_hours,
        overtime_hours: recordData.overtime_hours,
        status: recordData.status || 'present',
        notes: recordData.notes
      })
      .select(`
        *,
        employee:employees!employee_id (
          full_name,
          employee_code,
          department
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        employee:employees!employee_id (
          full_name,
          employee_code,
          department
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Leave Requests
  async getLeaveRequests(companyId: string, filters?: { status?: string }): Promise<LeaveRequest[]> {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees!employee_id (
          full_name,
          employee_code,
          department
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createLeaveRequest(companyId: string, request: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const { employee, ...requestData } = request;
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        company_id: companyId,
        employee_id: requestData.employee_id!,
        type: requestData.type!,
        start_date: requestData.start_date!,
        end_date: requestData.end_date!,
        days_count: requestData.days_count!,
        reason: requestData.reason,
        status: requestData.status || 'pending',
        requested_by_user_id: requestData.requested_by_user_id!,
        notes: requestData.notes
      })
      .select(`
        *,
        employee:employees!employee_id (
          full_name,
          employee_code,
          department
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateLeaveRequestStatus(id: string, status: string, approverUserId?: string, notes?: string): Promise<LeaveRequest> {
    const updates: any = {
      status,
      notes
    };

    if (status === 'approved') {
      updates.approved_by_user_id = approverUserId;
      updates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        employee:employees!employee_id (
          full_name,
          employee_code,
          department
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Work Schedules
  async getWorkSchedules(companyId: string): Promise<WorkSchedule[]> {
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async createWorkSchedule(companyId: string, schedule: Partial<WorkSchedule>): Promise<WorkSchedule> {
    const { data, error } = await supabase
      .from('work_schedules')
      .insert({
        company_id: companyId,
        name: schedule.name!,
        description: schedule.description,
        start_time: schedule.start_time!,
        end_time: schedule.end_time!,
        break_duration: schedule.break_duration || 60,
        work_days: schedule.work_days || [1, 2, 3, 4, 5],
        is_active: schedule.is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Leave Types
  async getLeaveTypes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Employees for dropdowns
  async getEmployees(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, employee_code, department')
      .eq('company_id', companyId)
      .eq('status', 'Ativo')
      .order('full_name');

    if (error) throw error;
    return data || [];
  }
}

const attendanceService = new AttendanceService();

// React Query Hooks
export function useAttendanceStats(companyId: string) {
  return useQuery({
    queryKey: ['attendanceStats', companyId],
    queryFn: () => attendanceService.getAttendanceStats(companyId),
    enabled: !!companyId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useAttendanceRecords(companyId: string, filters?: any) {
  return useQuery({
    queryKey: ['attendanceRecords', companyId, filters],
    queryFn: () => attendanceService.getAttendanceRecords(companyId, filters),
    enabled: !!companyId,
  });
}

export function useLeaveRequests(companyId: string, filters?: any) {
  return useQuery({
    queryKey: ['leaveRequests', companyId, filters],
    queryFn: () => attendanceService.getLeaveRequests(companyId, filters),
    enabled: !!companyId,
  });
}

export function useWorkSchedules(companyId: string) {
  return useQuery({
    queryKey: ['workSchedules', companyId],
    queryFn: () => attendanceService.getWorkSchedules(companyId),
    enabled: !!companyId,
  });
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leaveTypes'],
    queryFn: () => attendanceService.getLeaveTypes(),
  });
}

export function useEmployees(companyId: string) {
  return useQuery({
    queryKey: ['employees', companyId],
    queryFn: () => attendanceService.getEmployees(companyId),
    enabled: !!companyId,
  });
}

// Mutations
export function useCreateAttendanceRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ companyId, record }: { companyId: string; record: Partial<AttendanceRecord> }) => 
      attendanceService.createAttendanceRecord(companyId, record),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords', companyId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats', companyId] });
    },
  });
}

export function useUpdateLeaveRequestStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, approverUserId, notes }: { 
      id: string; 
      status: string; 
      approverUserId?: string; 
      notes?: string;
    }) => attendanceService.updateLeaveRequestStatus(id, status, approverUserId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats'] });
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ companyId, request }: { companyId: string; request: Partial<LeaveRequest> }) => 
      attendanceService.createLeaveRequest(companyId, request),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests', companyId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceStats', companyId] });
    },
  });
}

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ companyId, schedule }: { companyId: string; schedule: Partial<WorkSchedule> }) => 
      attendanceService.createWorkSchedule(companyId, schedule),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['workSchedules', companyId] });
    },
  });
}

export default attendanceService;