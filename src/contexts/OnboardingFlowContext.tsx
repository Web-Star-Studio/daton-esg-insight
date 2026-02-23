import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { getModuleById } from "@/components/onboarding/modulesCatalog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createPerformanceLogger,
  logDatabaseOperation,
} from "@/utils/formLogging";

import { createInitialOnboardingState } from "./onboarding-flow/constants";
import {
  fetchOnboardingSelection,
  finalizeOnboardingInDatabase,
  resolveCompanyIdForCompletion,
  resolveCompanyIdForSave,
  upsertOnboardingProgress,
} from "./onboarding-flow/persistence";
import type {
  ModuleConfig,
  OnboardingFlowContextType,
  OnboardingFlowState,
  OnboardingUser,
} from "./onboarding-flow/types";
import {
  getOnboardingStepTitle,
  isOnboardingStepCompleted,
} from "./onboarding-flow/utils";

const OnboardingFlowContext = createContext<OnboardingFlowContextType | undefined>(
  undefined,
);

export function OnboardingFlowProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<OnboardingFlowState>(
    createInitialOnboardingState,
  );
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadOnboardingData = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      console.warn("🔄 Loading onboarding data for user:", user.id);

      const data = await fetchOnboardingSelection(user.id);

      if (!data) {
        console.warn("📝 No onboarding data found, user is new");
        return;
      }

      if (!data.is_completed) {
        console.warn("✅ Onboarding data loaded (in progress):", data);

        const validModules = (data.selected_modules || []).filter((id) => {
          const module = getModuleById(id);
          if (!module) {
            console.warn(`⚠️ Removendo módulo inválido do histórico: ${id}`);
            return false;
          }
          return true;
        });

        if (data.current_step > 0 || validModules.length > 0) {
          setState((prev) => ({
            ...prev,
            currentStep: data.current_step || 0,
            selectedModules: validModules,
            moduleConfigurations:
              (data.module_configurations as ModuleConfig) || {},
            companyProfile: data.company_profile || null,
            isCompleted: false,
          }));
        }
      } else {
        console.warn("⚠️ Onboarding already completed, not restoring state");
      }
    } catch (error) {
      console.error("❌ Error loading onboarding data:", error);
      setState((prev) => ({
        ...prev,
        currentStep: 0,
        selectedModules: [],
        moduleConfigurations: {},
        isCompleted: false,
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      void loadOnboardingData();
    }
  }, [loadOnboardingData, user?.id]);

  const saveOnboardingData = useCallback(async () => {
    const currentState = stateRef.current;

    if (!user?.id) {
      console.warn("⚠️ User ID not available for saving onboarding data");
      return;
    }

    const perfLogger = createPerformanceLogger("saveOnboardingData");
    const onboardingUser: OnboardingUser = {
      id: user.id,
      company: { id: user.company?.id || null },
    };

    try {
      const companyId = await resolveCompanyIdForSave(onboardingUser);

      if (!companyId) {
        console.error("❌ Cannot save onboarding data without company_id");
        toast({
          title: "Aviso",
          description:
            "Não foi possível salvar o progresso. Suas seleções serão mantidas localmente.",
          variant: "default",
        });
        return;
      }

      await upsertOnboardingProgress({
        userId: user.id,
        companyId,
        state: currentState,
      });

      logDatabaseOperation("upsert", "onboarding_selections", true, null);
      perfLogger.end(true);
      console.warn("✅ Onboarding progress saved silently");
    } catch (error) {
      perfLogger.end(false, error);
      console.error("❌ Error saving onboarding data:", error);
    }
  }, [toast, user?.company?.id, user?.id]);

  useEffect(() => {
    if (user?.id && (state.currentStep > 0 || state.selectedModules.length > 0)) {
      const timeoutId = setTimeout(() => {
        void saveOnboardingData();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [
    saveOnboardingData,
    state.currentStep,
    state.moduleConfigurations,
    state.selectedModules,
    user?.id,
  ]);

  const nextStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, prev.totalSteps - 1),
    }));
  };

  const prevStep = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  };

  const setSelectedModules = (modules: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedModules: modules,
    }));
  };

  const setCompanyProfile = (profile: unknown) => {
    setState((prev) => ({
      ...prev,
      companyProfile: profile,
    }));
  };

  const updateModuleConfiguration = (moduleId: string, config: unknown) => {
    setState((prev) => ({
      ...prev,
      moduleConfigurations: {
        ...prev.moduleConfigurations,
        [moduleId]: config,
      },
    }));
  };

  const completeOnboarding = async () => {
    if (!user?.id) {
      console.error("❌ OnboardingFlowContext: Cannot complete - no user");
      throw new Error("No user found");
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      console.warn("📝 OnboardingFlowContext: Completing onboarding...");

      const currentState = stateRef.current;
      const companyId = await resolveCompanyIdForCompletion({
        id: user.id,
        company: { id: user.company?.id || null },
      });

      await finalizeOnboardingInDatabase({
        userId: user.id,
        companyId,
        state: currentState,
      });

      console.warn("✅ OnboardingFlowContext: Selections updated");
      console.warn("✅ OnboardingFlowContext: Profile updated");

      localStorage.removeItem("daton_onboarding_progress");
      localStorage.removeItem("daton_onboarding_selections");
      console.warn("🧹 OnboardingFlowContext: Local storage cleared");

      setState((prev) => ({
        ...prev,
        isCompleted: true,
        isLoading: false,
      }));

      toast({
        title: "Onboarding Concluído! 🎉",
        description:
          "Sua configuração inicial foi salva com sucesso. Bem-vindo ao Daton!",
      });

      console.warn("✅ OnboardingFlowContext: Onboarding completed successfully");
    } catch (error: any) {
      console.error("❌ OnboardingFlowContext: Error completing onboarding:", error);
      setState((prev) => ({ ...prev, isLoading: false }));

      toast({
        title: "Erro ao finalizar",
        description: error?.message || "Ocorreu um erro ao finalizar o onboarding",
        variant: "destructive",
      });

      throw error;
    }
  };

  const restartOnboarding = () => {
    setState(createInitialOnboardingState());
  };

  const isStepCompleted = (step: number) =>
    isOnboardingStepCompleted(state, step);
  const getStepTitle = (step: number) => getOnboardingStepTitle(step);

  const value: OnboardingFlowContextType = {
    state,
    nextStep,
    prevStep,
    setSelectedModules,
    setCompanyProfile,
    updateModuleConfiguration,
    completeOnboarding,
    restartOnboarding,
    isStepCompleted,
    getStepTitle,
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
    throw new Error("useOnboardingFlow must be used within a OnboardingFlowProvider");
  }
  return context;
}
