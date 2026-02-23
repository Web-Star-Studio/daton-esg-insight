export interface ModuleConfig {
  [key: string]: any;
}

export interface OnboardingFlowState {
  currentStep: number;
  totalSteps: number;
  selectedModules: string[];
  moduleConfigurations: ModuleConfig;
  companyProfile: Record<string, any> | null;
  isCompleted: boolean;
  isLoading: boolean;
}

export interface OnboardingFlowContextType {
  state: OnboardingFlowState;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedModules: (modules: string[]) => void;
  setCompanyProfile: (profile: Record<string, any> | null) => void;
  updateModuleConfiguration: (moduleId: string, config: any) => void;
  completeOnboarding: () => Promise<void>;
  restartOnboarding: () => void;
  isStepCompleted: (step: number) => boolean;
  getStepTitle: (step: number) => string;
}

export interface OnboardingStep {
  id: string;
  title: string;
}

export interface OnboardingUser {
  id: string;
  company?: {
    id?: string | null;
  } | null;
}
