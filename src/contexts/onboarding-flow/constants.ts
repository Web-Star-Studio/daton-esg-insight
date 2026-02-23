import type { OnboardingFlowState, OnboardingStep } from "./types";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "welcome", title: "Boas-vindas" },
  { id: "modules", title: "Seleção de Módulos" },
  { id: "configuration", title: "Configuração" },
  { id: "completion", title: "Finalização" },
];

export const createInitialOnboardingState = (): OnboardingFlowState => ({
  currentStep: 0,
  totalSteps: ONBOARDING_STEPS.length,
  selectedModules: [],
  moduleConfigurations: {},
  companyProfile: null,
  isCompleted: false,
  isLoading: false,
});
