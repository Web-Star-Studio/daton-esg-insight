// Simplified training schedules service for now (no database table yet)
export interface TrainingSchedule {
  id: string;
  training_program_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor: string;
  max_participants: number;
  status: string;
  participants?: string[];
  created_at: string;
  updated_at: string;
}

export const getTrainingSchedules = async (): Promise<TrainingSchedule[]> => {
  // Return empty array for now since table doesn't exist
  return [];
};

export const createTrainingSchedule = async (schedule: Omit<TrainingSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingSchedule> => {
  throw new Error('Training schedules não está configurado. Funcionalidade será habilitada em breve.');
};

export const updateTrainingSchedule = async (id: string, updates: Partial<TrainingSchedule>): Promise<TrainingSchedule> => {
  throw new Error('Training schedules não está configurado. Funcionalidade será habilitada em breve.');
};