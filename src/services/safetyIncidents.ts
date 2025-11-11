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

  // Buscar company_id do usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) throw new Error('Empresa não encontrada');

  // Importar função de cálculo de horas trabalhadas
  const { calculateWorkedHours } = await import('./workedHoursCalculator');

  // ✅ USAR NOVA FUNÇÃO PARA CALCULAR HORAS TRABALHADAS
  const workedHoursData = await calculateWorkedHours(
    profile.company_id,
    `${currentYear}-01-01`,
    `${currentYear}-12-31`
  );

  const totalIncidents = currentYearIncidents.length;
  const daysLostTotal = currentYearIncidents.reduce((sum, inc) => sum + inc.days_lost, 0);
  const withMedicalTreatment = currentYearIncidents.filter(inc => inc.medical_treatment_required).length;
  
  // ✅ CÁLCULO CORRETO DO LTIFR (OIT/ISO 45001)
  const accidentsWithLostTime = currentYearIncidents.filter(inc => inc.days_lost > 0).length;
  const ltifr = workedHoursData.total_hours > 0 
    ? (accidentsWithLostTime * 1000000) / workedHoursData.total_hours 
    : 0;
  
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
    incidentTrend: calculateMonthlyTrend(currentYearIncidents),
    
    // ✅ ADICIONAR METADATA SOBRE QUALIDADE DO CÁLCULO
    ltifr_metadata: {
      worked_hours: workedHoursData.total_hours,
      calculation_method: workedHoursData.calculation_method,
      data_quality: workedHoursData.data_quality,
      confidence_level: workedHoursData.metadata.confidence_level,
      formula: 'LTIFR = (Nº Acidentes com Afastamento × 1.000.000) / Total Horas Trabalhadas',
      compliance: 'OIT/ISO 45001'
    }
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