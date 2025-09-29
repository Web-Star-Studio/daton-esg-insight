import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ModuleConfig {
  [key: string]: any;
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
  { id: 'shortcuts', title: 'Atalhos Guiados' },
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
      console.log('🔄 Loading onboarding data for user:', user.id);
      
      const { data, error } = await supabase
        .from('onboarding_selections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found, this is normal for new users
          console.log('📝 No onboarding data found, user is new');
          return;
        }
        throw error;
      }

      if (data) {
        console.log('✅ Onboarding data loaded:', data);
        setState(prev => ({
          ...prev,
          currentStep: data.current_step || 0,
          selectedModules: data.selected_modules || [],
          moduleConfigurations: (data.module_configurations as ModuleConfig) || {},
          isCompleted: data.is_completed || false
        }));
      }
    } catch (error) {
      console.error('❌ Error loading onboarding data:', error);
      // Don't block the UI, just log the error
      setState(prev => ({
        ...prev,
        currentStep: 0,
        selectedModules: [],
        moduleConfigurations: {},
        isCompleted: false
      }));
    }
  };

  const saveOnboardingData = async () => {
    if (!user?.id) return;

    try {
      // Primeiro tenta inserir, se falhar, faz update
      const { error } = await supabase
        .from('onboarding_selections')
        .upsert([{
          user_id: user.id,
          company_id: user.company?.id!,
          current_step: state.currentStep,
          selected_modules: state.selectedModules,
          module_configurations: state.moduleConfigurations,
          is_completed: state.isCompleted,
          updated_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error saving to database:', error);
        // Fallback para localStorage se der erro no banco
        localStorage.setItem('daton_onboarding_progress', JSON.stringify({
          currentStep: state.currentStep,
          selectedModules: state.selectedModules,
          moduleConfigurations: state.moduleConfigurations,
          isCompleted: state.isCompleted
        }));
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Fallback para localStorage
      localStorage.setItem('daton_onboarding_progress', JSON.stringify({
        currentStep: state.currentStep,
        selectedModules: state.selectedModules,
        moduleConfigurations: state.moduleConfigurations,
        isCompleted: state.isCompleted
      }));
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
    console.log('🚀 Starting onboarding completion...');
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      if (!user?.id) {
        throw new Error('User ID not found');
      }

      if (!user.company?.id) {
        throw new Error('Company ID not found');
      }

      console.log('💾 Saving onboarding selections to database...');
      
      // Salvar configurações finais no banco com upsert
      const { error: upsertError } = await supabase
        .from('onboarding_selections')
        .upsert([{
          user_id: user.id,
          company_id: user.company.id,
          current_step: state.currentStep,
          selected_modules: state.selectedModules,
          module_configurations: state.moduleConfigurations,
          is_completed: true,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('❌ Database upsert error:', upsertError);
        throw upsertError;
      }

      console.log('✅ Onboarding selections saved successfully');

      // Mark user as completed onboarding
      console.log('👤 Updating user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }

      console.log('✅ User profile updated successfully');

      // Clear onboarding progress from localStorage
      localStorage.removeItem('daton_onboarding_progress');
      console.log('🧹 localStorage cleared');

      setState(prev => ({
        ...prev,
        isCompleted: true,
        isLoading: false
      }));

      toast({
        title: 'Onboarding Concluído! 🎉',
        description: 'Sua configuração inicial foi salva com sucesso. Bem-vindo ao Daton!',
      });

      console.log('🎉 Onboarding completed successfully!');

    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: 'Erro ao finalizar',
        description: `Ocorreu um erro ao finalizar o onboarding: ${error.message || 'Erro desconhecido'}`,
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