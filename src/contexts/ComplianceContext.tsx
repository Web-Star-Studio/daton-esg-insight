import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { complianceService, type ComplianceTask, type RegulatoryRequirement, type ComplianceStats } from '@/services/compliance';

interface ComplianceContextType {
  // Data
  tasks: ComplianceTask[] | undefined;
  requirements: RegulatoryRequirement[] | undefined;
  stats: ComplianceStats | undefined;
  users: any[] | undefined;
  
  // Loading states
  tasksLoading: boolean;
  requirementsLoading: boolean;
  statsLoading: boolean;
  
  // Filters and search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  
  // Modals
  showTaskModal: boolean;
  setShowTaskModal: (show: boolean) => void;
  showRequirementModal: boolean;
  setShowRequirementModal: (show: boolean) => void;
  selectedTask: ComplianceTask | null;
  setSelectedTask: (task: ComplianceTask | null) => void;
  
  // Actions
  createTask: (data: any) => Promise<void>;
  updateTask: (id: string, data: any) => Promise<void>;
  createRequirement: (data: any) => Promise<void>;
  
  // Computed values
  filteredTasks: ComplianceTask[];
  criticalTasks: ComplianceTask[];
  overdueTasks: ComplianceTask[];
  upcomingTasks: ComplianceTask[];
}

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ComplianceTask | null>(null);

  // Queries
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['compliance-tasks'],
    queryFn: () => complianceService.getTasks(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['regulatory-requirements'],
    queryFn: complianceService.getRequirements,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: complianceService.getStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: complianceService.getUsers,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: complianceService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      toast.success('Tarefa criada com sucesso!');
      setShowTaskModal(false);
      setSelectedTask(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar tarefa: ' + error.message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      complianceService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-stats'] });
      toast.success('Tarefa atualizada com sucesso!');
      setShowTaskModal(false);
      setSelectedTask(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar tarefa: ' + error.message);
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: complianceService.createRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulatory-requirements'] });
      toast.success('Requisito regulatório criado com sucesso!');
      setShowRequirementModal(false);
    },
    onError: (error: any) => {
      toast.error('Erro ao criar requisito: ' + error.message);
    },
  });

  // Actions
  const createTask = useCallback(async (data: any) => {
    await createTaskMutation.mutateAsync(data);
  }, [createTaskMutation]);

  const updateTask = useCallback(async (id: string, data: any) => {
    await updateTaskMutation.mutateAsync({ id, data });
  }, [updateTaskMutation]);

  const createRequirement = useCallback(async (data: any) => {
    await createRequirementMutation.mutateAsync(data);
  }, [createRequirementMutation]);

  // Computed values
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.requirement?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.responsible?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      // Priority filter based on due date and status
      let matchesPriority = true;
      if (priorityFilter !== 'all') {
        const today = new Date();
        const dueDate = new Date(task.due_date);
        const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (priorityFilter === 'critical') {
          matchesPriority = daysDiff < 0 || (daysDiff <= 3 && task.status !== 'Concluído');
        } else if (priorityFilter === 'high') {
          matchesPriority = daysDiff > 0 && daysDiff <= 7 && task.status !== 'Concluído';
        } else if (priorityFilter === 'medium') {
          matchesPriority = daysDiff > 7 && daysDiff <= 30;
        } else if (priorityFilter === 'low') {
          matchesPriority = daysDiff > 30;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const criticalTasks = React.useMemo(() => {
    if (!tasks) return [];
    const today = new Date();
    return tasks.filter(task => {
      const dueDate = new Date(task.due_date);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff < 0 || (daysDiff <= 3 && task.status !== 'Concluído');
    });
  }, [tasks]);

  const overdueTasks = React.useMemo(() => {
    if (!tasks) return [];
    const today = new Date();
    return tasks.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate < today && task.status !== 'Concluído';
    });
  }, [tasks]);

  const upcomingTasks = React.useMemo(() => {
    if (!tasks) return [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter(task => {
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate <= nextWeek && task.status !== 'Concluído';
    });
  }, [tasks]);

  const value: ComplianceContextType = {
    // Data
    tasks,
    requirements,
    stats,
    users,
    
    // Loading states
    tasksLoading,
    requirementsLoading,
    statsLoading,
    
    // Filters and search
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    
    // Modals
    showTaskModal,
    setShowTaskModal,
    showRequirementModal,
    setShowRequirementModal,
    selectedTask,
    setSelectedTask,
    
    // Actions
    createTask,
    updateTask,
    createRequirement,
    
    // Computed values
    filteredTasks,
    criticalTasks,
    overdueTasks,
    upcomingTasks,
  };

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  const context = useContext(ComplianceContext);
  if (context === undefined) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
}