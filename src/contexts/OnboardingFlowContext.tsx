import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ModuleConfig {
  inventario_gee?: {
    ano_base: number;
    unidade_operacional: string;
    escopo: string[];
  };
  gestao_licencas?: {
    orgaos_reguladores: string[];
    tipos_licencas: string[];
    alertas_vencimento: boolean;
  };
  gestao_desempenho?: {
    ciclo_avaliacao: string;
    competencias_chave: string[];
    metas_organizacionais: string[];
  };
  sistema_qualidade?: {
    normas_aplicaveis: string[];
    processos_criticos: string[];
    politica_qualidade: string;
  };
}

interface OnboardingFlowState {
  currentStep: number;
  totalSteps: number;
  selectedModules: string[];
  moduleConfigurations: ModuleConfig;
  isCompleted: boolean;
  isLoading: boolean;
}

interface OnboardingFlowContextType {
  state: OnboardingFlowState;
  
  // Actions
  nextStep: () => void;
  prevStep: () => void;
  setSelectedModules: (modules: string[]) => void;
  updateModuleConfiguration: (moduleId: string, config: any) => void;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => void;
  
  // Utils
  isStepCompleted: (step: number) => boolean;
  getStepTitle: (step: number) => string;
}

const OnboardingFlowContext = createContext<OnboardingFlowContextType | undefined>(undefined);

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Boas-vindas' },
  { id: 'modules', title: 'Seleção de Módulos' },
  { id: 'configuration', title: 'Configuração' },
  { id: 'completion', title: 'Finalização' }
];

export function OnboardingFlowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<OnboardingFlowState>({
    currentStep: 0,
    totalSteps: ONBOARDING_STEPS.length,
    selectedModules: [],
    moduleConfigurations: {},
    isCompleted: false,
    isLoading: false
  });

  // Load existing onboarding data
  useEffect(() => {
    if (user?.id) {
      loadOnboardingData();
    }
  }, [user?.id]);

  const loadOnboardingData = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('onboarding_selections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setState(prev => ({
          ...prev,
          currentStep: data.current_step,
          selectedModules: data.selected_modules,
          moduleConfigurations: (data.module_configurations as ModuleConfig) || {},
          isCompleted: data.is_completed
        }));
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const saveOnboardingData = async () => {
    if (!user?.id) return;

    try {
      // Salvar apenas no localStorage por enquanto
      localStorage.setItem('daton_onboarding_progress', JSON.stringify({
        currentStep: state.currentStep,
        selectedModules: state.selectedModules,
        moduleConfigurations: state.moduleConfigurations,
        isCompleted: state.isCompleted
      }));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  // Auto-save on state changes
  useEffect(() => {
    if (user?.id && (state.currentStep > 0 || state.selectedModules.length > 0)) {
      const timeoutId = setTimeout(saveOnboardingData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [state.currentStep, state.selectedModules, state.moduleConfigurations, user?.id]);

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1)
    }));
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  };

  const setSelectedModules = (modules: string[]) => {
    setState(prev => ({
      ...prev,
      selectedModules: modules
    }));
  };

  const updateModuleConfiguration = (moduleId: string, config: any) => {
    setState(prev => ({
      ...prev,
      moduleConfigurations: {
        ...prev.moduleConfigurations,
        [moduleId]: config
      }
    }));
  };

  const completeOnboarding = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Mark user as completed onboarding
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user!.id);

      // Clear onboarding progress
      localStorage.removeItem('daton_onboarding_progress');

      setState(prev => ({
        ...prev,
        isCompleted: true,
        isLoading: false
      }));

      toast({
        title: 'Onboarding Concluído!',
        description: 'Sua configuração inicial foi salva com sucesso.',
      });

    } catch (error) {
      console.error('Error completing onboarding:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Erro ao finalizar',
        description: 'Ocorreu um erro ao finalizar o onboarding.',
        variant: 'destructive'
      });
    }
  };

  const restartOnboarding = () => {
    setState({
      currentStep: 0,
      totalSteps: ONBOARDING_STEPS.length,
      selectedModules: [],
      moduleConfigurations: {},
      isCompleted: false,
      isLoading: false
    });
  };

  const isStepCompleted = (step: number) => {
    switch (step) {
      case 0: return true; // Welcome step always completed
      case 1: return state.selectedModules.length > 0;
      case 2: return state.selectedModules.every(moduleId => 
        state.moduleConfigurations[moduleId] !== undefined
      );
      case 3: return state.isCompleted;
      default: return false;
    }
  };

  const getStepTitle = (step: number) => {
    return ONBOARDING_STEPS[step]?.title || '';
  };

  const value: OnboardingFlowContextType = {
    state,
    nextStep,
    prevStep,
    setSelectedModules,
    updateModuleConfiguration,
    completeOnboarding,
    restartOnboarding,
    isStepCompleted,
    getStepTitle
  };

  return (
    <OnboardingFlowContext.Provider value={value}>
      {children}
    </OnboardingFlowContext.Provider>
  );
}

export function useOnboardingFlow() {
  const context = useContext(OnboardingFlowContext);
  if (context === undefined) {
    throw new Error('useOnboardingFlow must be used within a OnboardingFlowProvider');
  }
  return context;
}