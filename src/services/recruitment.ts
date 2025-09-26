import { supabase } from "@/integrations/supabase/client";

// Types
export interface JobPosting {
  id: string;
  company_id: string;
  title: string;
  department: string;
  location?: string;
  employment_type: string;
  level: string;
  description?: string;
  requirements?: any;
  benefits?: any;
  salary_range_min?: number;
  salary_range_max?: number;
  priority?: string;
  application_deadline?: string;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_posting_id: string;
  employee_id?: string;
  candidate_name?: string;
  candidate_email?: string;
  candidate_phone?: string;
  candidate_location?: string;
  application_date: string;
  status: string;
  cover_letter?: string;
  experience_years?: number;
  current_stage?: string;
  score?: number;
  notes?: string;
  additional_info?: any;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  company_id: string;
  job_application_id: string;
  interviewer_user_id?: string;
  interview_type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location_type: string;
  meeting_link?: string;
  notes?: string;
  feedback?: string;
  score?: number;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Joined data from Supabase query
  job_application?: {
    candidate_name: string;
    job_posting?: {
      title: string;
    };
  };
}

// Job Postings Service
export const getJobPostings = async () => {
  const { data, error } = await supabase
    .from('internal_job_postings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as JobPosting[];
};

export const getJobPosting = async (id: string) => {
  const { data, error } = await supabase
    .from('internal_job_postings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as JobPosting;
};

export const createJobPosting = async (jobPosting: Omit<JobPosting, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by_user_id'>) => {
  // Get current user to set required fields
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('internal_job_postings')
    .insert({
      ...jobPosting,
      company_id: 'temp', // Will be set by RLS trigger
      created_by_user_id: userData?.user?.id || 'temp', // Current user ID
      application_deadline: jobPosting.application_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobPosting;
};

export const updateJobPosting = async (id: string, updates: Partial<JobPosting>) => {
  const { data, error } = await supabase
    .from('internal_job_postings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as JobPosting;
};

export const deleteJobPosting = async (id: string) => {
  const { error } = await supabase
    .from('internal_job_postings')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Job Applications Service
export const getJobApplications = async (jobPostingId?: string) => {
  let query = supabase
    .from('job_applications')
    .select(`
      *,
      job_posting:internal_job_postings(title, department)
    `)
    .order('application_date', { ascending: false });

  if (jobPostingId) {
    query = query.eq('job_posting_id', jobPostingId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as JobApplication[];
};

export const getJobApplication = async (id: string) => {
  const { data, error } = await supabase
    .from('job_applications')
    .select(`
      *,
      job_posting:internal_job_postings(title, department)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as JobApplication;
};

export const createJobApplication = async (application: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('job_applications')
    .insert({
      ...application,
      employee_id: null // Make it optional
    })
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
};

export const updateJobApplication = async (id: string, updates: Partial<JobApplication>) => {
  const { data, error } = await supabase
    .from('job_applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as JobApplication;
};

export const deleteJobApplication = async (id: string) => {
  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Interviews Service
export const getInterviews = async () => {
  const { data, error } = await supabase
    .from('interviews')
    .select(`
      *,
      job_application:job_applications(
        candidate_name,
        job_posting:internal_job_postings(title)
      )
    `)
    .order('scheduled_date', { ascending: true });

  if (error) throw error;
  return data as Interview[];
};

export const getInterview = async (id: string) => {
  const { data, error } = await supabase
    .from('interviews')
    .select(`
      *,
      job_application:job_applications(
        candidate_name,
        job_posting:internal_job_postings(title)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Interview;
};

export const createInterview = async (interview: Omit<Interview, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by_user_id'>) => {
  // Get current user to set required fields
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('interviews')
    .insert({
      ...interview,
      company_id: 'temp', // Will be set by RLS trigger
      created_by_user_id: userData?.user?.id || 'temp'
    })
    .select()
    .single();

  if (error) throw error;
  return data as Interview;
};

export const updateInterview = async (id: string, updates: Partial<Interview>) => {
  const { data, error } = await supabase
    .from('interviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Interview;
};

export const deleteInterview = async (id: string) => {
  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Statistics
export const getRecruitmentStats = async () => {
  const [jobsResponse, applicationsResponse, interviewsResponse] = await Promise.all([
    supabase.from('internal_job_postings').select('status').eq('status', 'Ativa'),
    supabase.from('job_applications').select('*'),
    supabase.from('interviews').select('status, scheduled_date')
  ]);

  const openPositions = jobsResponse.data?.length || 0;
  const totalApplications = applicationsResponse.data?.length || 0;
  
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  const thisMonthApplications = applicationsResponse.data?.filter(app => 
    new Date(app.application_date) >= thisMonth
  ).length || 0;

  const upcomingInterviews = interviewsResponse.data?.filter(interview => 
    new Date(interview.scheduled_date) >= new Date() && 
    interview.status === 'Agendada'
  ).length || 0;

  return {
    openPositions,
    totalApplications,
    thisMonthApplications,
    upcomingInterviews,
    averageTimeToHire: 28 // This would need more complex calculation
  };
};