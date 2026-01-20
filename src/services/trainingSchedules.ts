import { supabase } from '@/integrations/supabase/client';

// Types
export interface TrainingSchedule {
  id: string;
  company_id: string;
  training_program_id: string | null;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  instructor?: string | null;
  max_participants: number;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Relationships
  training_program?: { id: string; name: string; category: string } | null;
  participants?: ScheduleParticipant[];
}

export interface ScheduleParticipant {
  id: string;
  schedule_id: string;
  employee_id: string;
  confirmed: boolean;
  attended: boolean | null;
  attendance_marked_at: string | null;
  notes: string | null;
  created_at: string;
  employee?: { id: string; full_name: string; position: string | null };
}

export interface CreateTrainingScheduleInput {
  training_program_id?: string | null;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location?: string;
  instructor?: string;
  max_participants?: number;
  status?: string;
  participants?: string[]; // Array of employee IDs
}

export interface UpdateTrainingScheduleInput {
  training_program_id?: string | null;
  title?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  instructor?: string;
  max_participants?: number;
  status?: string;
}

// Helper to get user's company ID using RPC (more robust, consistent with other modules)
const getUserCompanyId = async (): Promise<string> => {
  const { data: companyId, error } = await supabase.rpc('get_user_company_id');
  
  if (error) {
    console.error('Error getting company ID:', error);
    throw new Error('Erro ao obter empresa do usuário');
  }
  
  if (!companyId) {
    throw new Error('Empresa do usuário não encontrada');
  }

  return companyId;
};

// Get all training schedules for the company
export const getTrainingSchedules = async (): Promise<TrainingSchedule[]> => {
  const { data, error } = await supabase
    .from('training_schedules')
    .select(`
      *,
      training_program:training_programs(id, name, category),
      participants:training_schedule_participants(
        id,
        employee_id,
        confirmed,
        attended,
        attendance_marked_at,
        notes,
        created_at,
        employee:employees(id, full_name, position)
      )
    `)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as TrainingSchedule[];
};

// Get a single training schedule by ID
export const getTrainingScheduleById = async (id: string): Promise<TrainingSchedule | null> => {
  const { data, error } = await supabase
    .from('training_schedules')
    .select(`
      *,
      training_program:training_programs(id, name, category),
      participants:training_schedule_participants(
        id,
        employee_id,
        confirmed,
        attended,
        attendance_marked_at,
        notes,
        created_at,
        employee:employees(id, full_name, position)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  
  return data as unknown as TrainingSchedule;
};

// Create a new training schedule
export const createTrainingSchedule = async (
  input: CreateTrainingScheduleInput
): Promise<TrainingSchedule> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const companyId = await getUserCompanyId();
  const { participants, ...scheduleData } = input;

  // Create the schedule
  const { data, error } = await supabase
    .from('training_schedules')
    .insert({
      ...scheduleData,
      company_id: companyId,
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Add participants if provided
  if (participants && participants.length > 0) {
    const { error: participantsError } = await supabase
      .from('training_schedule_participants')
      .insert(
        participants.map(employeeId => ({
          schedule_id: data.id,
          employee_id: employeeId,
        }))
      );

    if (participantsError) {
      console.error('Erro ao adicionar participantes:', participantsError);
      // Don't throw - schedule was created successfully
    }
  }

  // Return the complete schedule with relationships
  return getTrainingScheduleById(data.id) as Promise<TrainingSchedule>;
};

// Update a training schedule
export const updateTrainingSchedule = async (
  id: string,
  input: UpdateTrainingScheduleInput
): Promise<TrainingSchedule> => {
  const { data, error } = await supabase
    .from('training_schedules')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return getTrainingScheduleById(data.id) as Promise<TrainingSchedule>;
};

// Delete a training schedule
export const deleteTrainingSchedule = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('training_schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Add a participant to a schedule
export const addParticipant = async (
  scheduleId: string,
  employeeId: string
): Promise<ScheduleParticipant> => {
  const { data, error } = await supabase
    .from('training_schedule_participants')
    .insert({
      schedule_id: scheduleId,
      employee_id: employeeId,
    })
    .select(`
      *,
      employee:employees(id, full_name, position)
    `)
    .single();

  if (error) throw error;
  return data as unknown as ScheduleParticipant;
};

// Remove a participant from a schedule
export const removeParticipant = async (
  scheduleId: string,
  employeeId: string
): Promise<void> => {
  const { error } = await supabase
    .from('training_schedule_participants')
    .delete()
    .eq('schedule_id', scheduleId)
    .eq('employee_id', employeeId);

  if (error) throw error;
};

// Update participant confirmation status
export const updateParticipantConfirmation = async (
  scheduleId: string,
  employeeId: string,
  confirmed: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('training_schedule_participants')
    .update({ confirmed })
    .eq('schedule_id', scheduleId)
    .eq('employee_id', employeeId);

  if (error) throw error;
};

// Mark attendance for a participant
export const markParticipantAttendance = async (
  scheduleId: string,
  employeeId: string,
  attended: boolean | null
): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('training_schedule_participants')
    .update({
      attended,
      attendance_marked_at: attended !== null ? new Date().toISOString() : null,
      attendance_marked_by: attended !== null ? user?.id : null,
    })
    .eq('schedule_id', scheduleId)
    .eq('employee_id', employeeId);

  if (error) throw error;
};

// Bulk add participants
export const addParticipants = async (
  scheduleId: string,
  employeeIds: string[]
): Promise<void> => {
  if (employeeIds.length === 0) return;

  const { error } = await supabase
    .from('training_schedule_participants')
    .insert(
      employeeIds.map(employeeId => ({
        schedule_id: scheduleId,
        employee_id: employeeId,
      }))
    );

  if (error) throw error;
};

// Update participants list (replace all)
export const updateParticipants = async (
  scheduleId: string,
  employeeIds: string[]
): Promise<void> => {
  // Remove all existing participants
  const { error: deleteError } = await supabase
    .from('training_schedule_participants')
    .delete()
    .eq('schedule_id', scheduleId);

  if (deleteError) throw deleteError;

  // Add new participants
  if (employeeIds.length > 0) {
    await addParticipants(scheduleId, employeeIds);
  }
};

// Get schedules by date range
export const getSchedulesByDateRange = async (
  startDate: string,
  endDate: string
): Promise<TrainingSchedule[]> => {
  const { data, error } = await supabase
    .from('training_schedules')
    .select(`
      *,
      training_program:training_programs(id, name, category),
      participants:training_schedule_participants(
        id,
        employee_id,
        confirmed,
        attended,
        employee:employees(id, full_name, position)
      )
    `)
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as TrainingSchedule[];
};

// Get schedules by status
export const getSchedulesByStatus = async (
  status: string
): Promise<TrainingSchedule[]> => {
  const { data, error } = await supabase
    .from('training_schedules')
    .select(`
      *,
      training_program:training_programs(id, name, category),
      participants:training_schedule_participants(
        id,
        employee_id,
        confirmed,
        attended,
        employee:employees(id, full_name, position)
      )
    `)
    .eq('status', status)
    .order('start_date', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as TrainingSchedule[];
};

// Get schedules for a specific employee
export const getSchedulesForEmployee = async (
  employeeId: string
): Promise<TrainingSchedule[]> => {
  const { data, error } = await supabase
    .from('training_schedule_participants')
    .select(`
      schedule:training_schedules(
        *,
        training_program:training_programs(id, name, category)
      )
    `)
    .eq('employee_id', employeeId);

  if (error) throw error;
  
  return (data || [])
    .map(item => item.schedule)
    .filter(Boolean) as unknown as TrainingSchedule[];
};
