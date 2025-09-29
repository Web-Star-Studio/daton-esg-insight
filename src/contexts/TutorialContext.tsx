import React, { createContext, useContext, useState, useEffect } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface TutorialProgress {
  moduleId: string;
  completedSteps: string[];
  totalSteps: number;
  isCompleted: boolean;
}

interface TutorialContextType {
  isOnboardingActive: boolean;
  currentTour: string | null;
  currentStep: number;
  tutorialProgress: TutorialProgress[];
  userProfile: 'iniciante' | 'esg' | 'qualidade' | 'rh' | 'analista';
  
  // Actions
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTour: () => void;
  markStepComplete: (moduleId: string, stepId: string) => void;
  setUserProfile: (profile: TutorialContextType['userProfile']) => void;
  showHelpCenter: () => void;
  restartOnboarding: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgress[]>([]);
  const [userProfile, setUserProfile] = useState<TutorialContextType['userProfile']>('iniciante');

  useEffect(() => {
    // Carregar progresso do tutorial do localStorage
    const savedProgress = localStorage.getItem('daton_tutorial_progress');
    if (savedProgress) {
      setTutorialProgress(JSON.parse(savedProgress));
    }

    const savedProfile = localStorage.getItem('daton_user_profile');
    if (savedProfile) {
      setUserProfile(savedProfile as TutorialContextType['userProfile']);
    }
  }, []);

  const restartOnboarding = () => {
    // Limpar todos os dados de onboarding e tutorial
    localStorage.removeItem('daton_tutorial_completed');
    localStorage.removeItem('daton_tutorial_progress');
    localStorage.removeItem('daton_user_profile');
    localStorage.removeItem('daton_onboarding_completed');
    localStorage.removeItem('daton_onboarding_progress');
    localStorage.removeItem('daton_onboarding_selections');
    
    console.log('Tutorial e onboarding reiniciados - redirecionando...');
    
    // Navegar para onboarding em vez de reload
    window.location.href = '/onboarding';
  };

  const startTour = (tourId: string) => {
    setCurrentTour(tourId);
    setCurrentStep(0);
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const completeTour = () => {
    setCurrentTour(null);
    setCurrentStep(0);
  };

  const markStepComplete = (moduleId: string, stepId: string) => {
    setTutorialProgress(prev => {
      const updated = [...prev];
      const moduleIndex = updated.findIndex(p => p.moduleId === moduleId);
      
      if (moduleIndex >= 0) {
        updated[moduleIndex].completedSteps.push(stepId);
        updated[moduleIndex].isCompleted = 
          updated[moduleIndex].completedSteps.length >= updated[moduleIndex].totalSteps;
      } else {
        updated.push({
          moduleId,
          completedSteps: [stepId],
          totalSteps: 1,
          isCompleted: false
        });
      }
      
      localStorage.setItem('daton_tutorial_progress', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSetUserProfile = (profile: TutorialContextType['userProfile']) => {
    setUserProfile(profile);
    localStorage.setItem('daton_user_profile', profile);
  };

  const showHelpCenter = () => {
    // Implementar abertura do centro de ajuda
    console.log('Abrindo centro de ajuda');
  };

  const value: TutorialContextType = {
    isOnboardingActive: false, // Removido - gerenciado pelo AuthContext
    currentTour,
    currentStep,
    tutorialProgress,
    userProfile,
    startTour,
    nextStep,
    prevStep,
    completeTour,
    markStepComplete,
    setUserProfile: handleSetUserProfile,
    showHelpCenter,
    restartOnboarding
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}