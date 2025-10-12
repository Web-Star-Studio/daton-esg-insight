// Tipos centralizados para o sistema de tours

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type TourPriority = 'user-initiated' | 'automatic' | 'contextual';
export type TourIntensity = 'low' | 'medium' | 'high';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  placement?: TourPlacement;
  allowInteraction?: boolean;
  action?: () => void;
  tip?: string;
  skipIf?: () => boolean; // Pular step se condição for verdadeira
  highlightPulse?: boolean;
}

export interface TourDefinition {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
  requiredModules?: string[];
  priority?: TourPriority;
  autoStart?: boolean;
}

export interface TourProgress {
  tourId: string;
  completedSteps: string[];
  currentStep: number;
  startedAt: string;
  completedAt?: string;
  isCompleted: boolean;
  dismissed?: boolean;
}

export interface TourState {
  activeTour: TourDefinition | null;
  currentStepIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  progress: TourProgress[];
  queue: TourDefinition[];
}

export interface TourContextValue extends TourState {
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  pauseTour: () => void;
  resumeTour: () => void;
  completeTour: () => void;
  dismissTour: () => void;
  queueTour: (tourId: string, priority?: TourPriority) => void;
  skipStep: () => void;
  goToStep: (stepIndex: number) => void;
  getTourProgress: (tourId: string) => TourProgress | undefined;
  isTourCompleted: (tourId: string) => boolean;
}
