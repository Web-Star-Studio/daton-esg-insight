import { supabase } from "@/integrations/supabase/client";

export interface SafetyIncident {
  id: string;
  company_id: string;
  employee_id?: string;
  incident_date: string;
  incident_time?: string;
  location?: string;
  incident_type: string;
  severity: string;
  description: string;
  immediate_cause?: string;
  root_cause?: string;
  corrective_actions?: string;
  days_lost: number;
  medical_treatment_required: boolean;
  reported_by_user_id: string;
  status: string;
  investigation_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const getSafetyIncidents = async () => {
  const { data, error } = await supabase
    .from('safety_incidents')
    .select('*')
    .order('incident_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getSafetyIncident = async (id: string) => {
  const { data, error } = await supabase
    .from('safety_incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createSafetyIncident = async (incident: Omit<SafetyIncident, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('safety_incidents')
    .insert(incident)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSafetyIncident = async (id: string, updates: Partial<SafetyIncident>) => {
  const { data, error } = await supabase
    .from('safety_incidents')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSafetyIncident = async (id: string) => {
  const { error } = await supabase
    .from('safety_incidents')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getSafetyMetrics = async () => {
  const { data: incidents, error } = await supabase
    .from('safety_incidents')
    .select('*');

  if (error) throw error;

  const currentYear = new Date().getFullYear();
  const currentYearIncidents = incidents.filter(incident => 
    new Date(incident.incident_date).getFullYear() === currentYear
  );

  const totalIncidents = currentYearIncidents.length;
  const daysLostTotal = currentYearIncidents.reduce((sum, inc) => sum + inc.days_lost, 0);
  const withMedicalTreatment = currentYearIncidents.filter(inc => inc.medical_treatment_required).length;
  
  // Calcula LTIFR (Lost Time Injury Frequency Rate) - assumindo 200.000 horas trabalhadas
  const hoursWorked = 200000; // Pode ser calculado dinamicamente baseado no número de funcionários
  const ltifr = (currentYearIncidents.filter(inc => inc.days_lost > 0).length / hoursWorked) * 200000;
  
  const severityDistribution = currentYearIncidents.reduce((acc, inc) => {
    acc[inc.severity] = (acc[inc.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalIncidents,
    daysLostTotal,
    withMedicalTreatment,
    ltifr: Number(ltifr.toFixed(2)),
    severityDistribution,
    incidentTrend: calculateMonthlyTrend(currentYearIncidents)
  };
};

const calculateMonthlyTrend = (incidents: SafetyIncident[]) => {
  const monthlyData = incidents.reduce((acc, incident) => {
    const month = new Date(incident.incident_date).getMonth();
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    incidents: monthlyData[i] || 0
  }));
};