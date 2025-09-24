import { supabase } from "@/integrations/supabase/client";

// Strategic Maps
export interface StrategicMap {
  id: string;
  name: string;
  description: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

// SWOT Analysis
export interface SWOTAnalysis {
  id: string;
  company_id: string;
  strategic_map_id?: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SWOTItem {
  id: string;
  swot_analysis_id: string;
  category: 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
  item_text: string;
  description?: string;
  impact_level: 'low' | 'medium' | 'high';
  order_index: number;
  created_at: string;
  updated_at: string;
}

// OKRs
export interface OKR {
  id: string;
  company_id: string;
  strategic_map_id?: string;
  title: string;
  description?: string;
  quarter: string;
  year: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress_percentage: number;
  owner_user_id?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  okr_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit?: string;
  progress_percentage: number;
  due_date?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk';
  owner_user_id?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Strategic Maps Service
export const getStrategicMaps = async (): Promise<StrategicMap[]> => {
  const { data, error } = await supabase
    .from("strategic_maps")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createStrategicMap = async (mapData: Omit<StrategicMap, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) throw new Error("Company ID não encontrado");

  const { data, error } = await supabase
    .from("strategic_maps")
    .insert([{ 
      ...mapData, 
      company_id: profile.company_id 
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// SWOT Analysis Service
export const getSWOTAnalyses = async (strategicMapId?: string): Promise<SWOTAnalysis[]> => {
  let query = supabase
    .from("swot_analysis")
    .select("*")
    .order("created_at", { ascending: false });

  if (strategicMapId) {
    query = query.eq("strategic_map_id", strategicMapId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as SWOTAnalysis[];
};

export const getSWOTItems = async (analysisId: string): Promise<SWOTItem[]> => {
  const { data, error } = await supabase
    .from("swot_items")
    .select("*")
    .eq("swot_analysis_id", analysisId)
    .order("order_index");
  
  if (error) throw error;
  return data;
};

export const createSWOTAnalysis = async (analysisData: Omit<SWOTAnalysis, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) throw new Error("Company ID não encontrado");

  const { data, error } = await supabase
    .from("swot_analysis")
    .insert([{ 
      ...analysisData, 
      company_id: profile.company_id 
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createSWOTItem = async (itemData: Omit<SWOTItem, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from("swot_items")
    .insert([itemData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSWOTItem = async (itemId: string) => {
  const { error } = await supabase
    .from("swot_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
};

// OKRs Service
export const getOKRs = async (strategicMapId?: string): Promise<OKR[]> => {
  let query = supabase
    .from("okrs")
    .select("*")
    .order("created_at", { ascending: false });

  if (strategicMapId) {
    query = query.eq("strategic_map_id", strategicMapId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as OKR[];
};

export const getKeyResults = async (okrId: string): Promise<KeyResult[]> => {
  const { data, error } = await supabase
    .from("key_results")
    .select("*")
    .eq("okr_id", okrId)
    .order("order_index");
  
  if (error) throw error;
  return data as KeyResult[];
};

export const createOKR = async (okrData: Omit<OKR, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) throw new Error("Company ID não encontrado");

  const { data, error } = await supabase
    .from("okrs")
    .insert([{ 
      ...okrData, 
      company_id: profile.company_id,
      created_by_user_id: user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createKeyResult = async (krData: Omit<KeyResult, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from("key_results")
    .insert([krData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateKeyResultProgress = async (krId: string, currentValue: number, targetValue: number) => {
  const progressPercentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  
  const { data, error } = await supabase
    .from("key_results")
    .update({ 
      current_value: currentValue,
      progress_percentage: progressPercentage,
      status: progressPercentage >= 100 ? 'completed' : 
             progressPercentage > 0 ? 'in_progress' : 'not_started'
    })
    .eq("id", krId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOKRProgress = async (okrId: string) => {
  // Get all key results for this OKR
  const keyResults = await getKeyResults(okrId);
  
  if (keyResults.length === 0) return;

  // Calculate average progress
  const averageProgress = keyResults.reduce((sum, kr) => sum + (kr.progress_percentage || 0), 0) / keyResults.length;
  
  // Update OKR progress
  const { data, error } = await supabase
    .from("okrs")
    .update({ 
      progress_percentage: Math.round(averageProgress),
      status: averageProgress >= 100 ? 'completed' : 'active'
    })
    .eq("id", okrId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Strategic Dashboard Metrics
export const getStrategicMetrics = async () => {
  // Get all strategic data in parallel
  const [maps, okrs, swot, objectives] = await Promise.all([
    supabase.from("strategic_maps").select("id"),
    supabase.from("okrs").select("id, status, progress_percentage"),
    supabase.from("swot_analysis").select("id"),
    supabase.from("bsc_objectives").select("id")
  ]);

  const activeOKRs = okrs.data?.filter(okr => okr.status === 'active').length || 0;
  const completedOKRs = okrs.data?.filter(okr => okr.status === 'completed').length || 0;
  const averageProgress = okrs.data?.length ? 
    okrs.data.reduce((sum, okr) => sum + (okr.progress_percentage || 0), 0) / okrs.data.length : 0;

  return {
    strategicMaps: maps.data?.length || 0,
    activeOKRs,
    completedOKRs,
    swotAnalyses: swot.data?.length || 0,
    objectives: objectives.data?.length || 0,
    averageProgress: Math.round(averageProgress)
  };
};

export const getRecentOKRs = async (limit = 5) => {
  const { data, error } = await supabase
    .from("okrs")
    .select("id, title, status, progress_percentage, quarter, year")
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
};

export const getUpcomingKeyResults = async (limit = 5) => {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const { data, error } = await supabase
    .from("key_results")
    .select(`
      id,
      title,
      due_date,
      progress_percentage,
      status,
      okrs!inner(title)
    `)
    .lte("due_date", nextMonth.toISOString().split('T')[0])
    .neq("status", "completed")
    .order("due_date", { ascending: true })
    .limit(limit);
  
  if (error) throw error;
  return data;
};