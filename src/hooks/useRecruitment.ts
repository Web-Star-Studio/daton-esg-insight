import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getJobPostings, 
  getJobPosting,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  getJobApplications,
  getJobApplication,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication,
  getInterviews,
  getInterview,
  createInterview,
  updateInterview,
  deleteInterview,
  getRecruitmentStats,
  JobPosting,
  JobApplication,
  Interview
} from '@/services/recruitment';
import { toast } from 'sonner';

// Job Postings Hooks
export const useJobPostings = () => {
  return useQuery({
    queryKey: ['job-postings'],
    queryFn: getJobPostings,
  });
};

export const useJobPosting = (id: string) => {
  return useQuery({
    queryKey: ['job-posting', id],
    queryFn: () => getJobPosting(id),
    enabled: !!id,
  });
};

export const useCreateJobPosting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobPosting: Omit<JobPosting, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by_user_id'>) => 
      createJobPosting(jobPosting),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Vaga criada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar vaga');
    },
  });
};

export const useUpdateJobPosting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<JobPosting> }) => 
      updateJobPosting(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Vaga atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar vaga');
    },
  });
};

export const useDeleteJobPosting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteJobPosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Vaga excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir vaga');
    },
  });
};

// Job Applications Hooks
export const useJobApplications = (jobPostingId?: string) => {
  return useQuery({
    queryKey: ['job-applications', jobPostingId],
    queryFn: () => getJobApplications(jobPostingId),
  });
};

export const useJobApplication = (id: string) => {
  return useQuery({
    queryKey: ['job-application', id],
    queryFn: () => getJobApplication(id),
    enabled: !!id,
  });
};

export const useCreateJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (application: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) => 
      createJobApplication(application),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Candidatura registrada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao registrar candidatura');
    },
  });
};

export const useUpdateJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<JobApplication> }) => 
      updateJobApplication(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast.success('Candidatura atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar candidatura');
    },
  });
};

export const useDeleteJobApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteJobApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Candidatura excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir candidatura');
    },
  });
};

// Interviews Hooks
export const useInterviews = () => {
  return useQuery({
    queryKey: ['interviews'],
    queryFn: getInterviews,
  });
};

export const useInterview = (id: string) => {
  return useQuery({
    queryKey: ['interview', id],
    queryFn: () => getInterview(id),
    enabled: !!id,
  });
};

export const useCreateInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (interview: Omit<Interview, 'id' | 'created_at' | 'updated_at' | 'company_id' | 'created_by_user_id'>) => 
      createInterview(interview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Entrevista agendada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao agendar entrevista');
    },
  });
};

export const useUpdateInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Interview> }) => 
      updateInterview(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      toast.success('Entrevista atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar entrevista');
    },
  });
};

export const useDeleteInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['recruitment-stats'] });
      toast.success('Entrevista cancelada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cancelar entrevista');
    },
  });
};

// Stats Hook
export const useRecruitmentStats = () => {
  return useQuery({
    queryKey: ['recruitment-stats'],
    queryFn: getRecruitmentStats,
  });
};