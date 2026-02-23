import { ONBOARDING_STEPS } from "./constants";
import type { OnboardingFlowState } from "./types";

export const isOnboardingStepCompleted = (
  state: OnboardingFlowState,
  step: number,
): boolean => {
  switch (step) {
    case 0:
      return true;
    case 1:
      return state.selectedModules.length > 0;
    case 2:
      return true;
    case 3:
      return state.isCompleted;
    default:
      return false;
  }
};

export const getOnboardingStepTitle = (step: number): string => {
  return ONBOARDING_STEPS[step]?.title || "";
};
