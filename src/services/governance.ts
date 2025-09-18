import { supabase } from "@/integrations/supabase/client";

export interface BoardMember {
  id: string;
  company_id: string;
  full_name: string;
  position: string;
  committee?: string;
  appointment_date: string;
  term_end_date?: string;
  is_independent: boolean;
  gender?: string;
  age?: number;
  experience_years?: number;
  expertise_areas?: string[];
  biography?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CorporatePolicy {
  id: string;
  company_id: string;
  title: string;
  category: string;
  description?: string;
  content?: string;
  version: string;
  effective_date: string;
  review_date?: string;
  approval_date?: string;
  approved_by_user_id?: string;
  status: string;
  file_path?: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WhistleblowerReport {
  id: string;
  company_id: string;
  report_code: string;
  category: string;
  description: string;
  incident_date?: string;
  location?: string;
  people_involved?: string;
  evidence_description?: string;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  status: string;
  priority: string;
  assigned_to_user_id?: string;
  investigation_notes?: string;
  resolution_summary?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

// Board Members
export const getBoardMembers = async () => {
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .order('appointment_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const createBoardMember = async (member: Omit<BoardMember, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('board_members')
    .insert(member)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBoardMember = async (id: string, updates: Partial<BoardMember>) => {
  const { data, error } = await supabase
    .from('board_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBoardMember = async (id: string) => {
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Corporate Policies
export const getCorporatePolicies = async () => {
  const { data, error } = await supabase
    .from('corporate_policies')
    .select('*')
    .order('effective_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const createCorporatePolicy = async (policy: Omit<CorporatePolicy, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('corporate_policies')
    .insert(policy)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCorporatePolicy = async (id: string, updates: Partial<CorporatePolicy>) => {
  const { data, error } = await supabase
    .from('corporate_policies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Whistleblower Reports
export const getWhistleblowerReports = async () => {
  const { data, error } = await supabase
    .from('whistleblower_reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createWhistleblowerReport = async (report: Omit<WhistleblowerReport, 'id' | 'report_code' | 'created_at' | 'updated_at'>) => {
  // Generate unique report code
  const reportCode = `WB-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const { data, error } = await supabase
    .from('whistleblower_reports')
    .insert({ ...report, report_code: reportCode })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWhistleblowerReport = async (id: string, updates: Partial<WhistleblowerReport>) => {
  const { data, error } = await supabase
    .from('whistleblower_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getGovernanceMetrics = async () => {
  const [boardData, policiesData, reportsData] = await Promise.all([
    supabase.from('board_members').select('*'),
    supabase.from('corporate_policies').select('*'),
    supabase.from('whistleblower_reports').select('*')
  ]);

  if (boardData.error) throw boardData.error;
  if (policiesData.error) throw policiesData.error;
  if (reportsData.error) throw reportsData.error;

  const board = boardData.data;
  const policies = policiesData.data;
  const reports = reportsData.data;

  // Board metrics
  const totalBoardMembers = board.length;
  const independentMembers = board.filter(m => m.is_independent).length;
  const genderDiversity = board.reduce((acc, member) => {
    const gender = member.gender || 'Não informado';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Policies metrics
  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.status === 'Ativo').length;
  const policiesNeedingReview = policies.filter(p => 
    p.review_date && new Date(p.review_date) < new Date()
  ).length;

  // Reports metrics
  const totalReports = reports.length;
  const openReports = reports.filter(r => r.status !== 'Fechada').length;
  const currentYearReports = reports.filter(r => 
    new Date(r.created_at).getFullYear() === new Date().getFullYear()
  ).length;

  return {
    board: {
      totalMembers: totalBoardMembers,
      independentMembers,
      independenceRate: totalBoardMembers > 0 ? (independentMembers / totalBoardMembers) * 100 : 0,
      genderDiversity
    },
    policies: {
      totalPolicies,
      activePolicies,
      policiesNeedingReview,
      reviewComplianceRate: totalPolicies > 0 ? ((totalPolicies - policiesNeedingReview) / totalPolicies) * 100 : 0
    },
    ethics: {
      totalReports,
      openReports,
      currentYearReports,
      resolutionRate: totalReports > 0 ? ((totalReports - openReports) / totalReports) * 100 : 0
    }
  };
};