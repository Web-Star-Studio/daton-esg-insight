import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  userProfile: 'iniciante' | 'esg' | 'qualidade' | 'rh' | 'analista';
  setUserProfile: (profile: TutorialContextType['userProfile']) => void;
  restartOnboarding: () => void;
  
  // Legacy - mantido para compatibilidade com ProgressTracker
  tutorialProgress: TutorialProgress[];
  startTour: (tourId: string) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
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
    console.log('🔄 TutorialContext: Restarting onboarding from tutorial context...');
    
    // Limpar todos os dados de onboarding e tutorial
    localStorage.removeItem('daton_tutorial_completed');
    localStorage.removeItem('daton_tutorial_progress');
    localStorage.removeItem('daton_user_profile');
    localStorage.removeItem('daton_onboarding_completed');
    localStorage.removeItem('daton_onboarding_progress');
    localStorage.removeItem('daton_onboarding_selections');
    localStorage.removeItem('unified_tour_progress');
    localStorage.removeItem('daton_primeiros_passos_dismissed');
    
    console.log('✅ Local storage cleared - reloading page...');
    
    // Reload page to ensure clean state
    window.location.reload();
  };

  // Legacy startTour - mantido para compatibilidade, mas não faz nada
  const startTour = (tourId: string) => {
    console.warn('TutorialContext.startTour is deprecated. Use UnifiedTourContext.startTour instead.');
  };

  const handleSetUserProfile = (profile: TutorialContextType['userProfile']) => {
    setUserProfile(profile);
    localStorage.setItem('daton_user_profile', profile);
  };

  const value: TutorialContextType = {
    userProfile,
    setUserProfile: handleSetUserProfile,
    restartOnboarding,
    tutorialProgress,
    startTour,
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