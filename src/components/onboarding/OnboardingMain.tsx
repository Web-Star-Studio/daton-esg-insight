import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlowProvider, useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedWelcomeStep } from './EnhancedWelcomeStep';
import { EnhancedModuleSelectionStep } from './EnhancedModuleSelectionStep';
import { EnhancedDataCreationStep } from './EnhancedDataCreationStep';
import { EnhancedCompletionStep } from './EnhancedCompletionStep';
import { OnboardingProgress } from './OnboardingProgress';
import { OnboardingAnalytics } from './OnboardingAnalytics';

function OnboardingContent() {
  const navigate = useNavigate();
  const { startTour } = useTutorial();
  const { skipOnboarding } = useAuth();
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  
  const {
    state,
    nextStep,
    prevStep,
    setSelectedModules,
    updateModuleConfiguration,
    completeOnboarding,
    isStepCompleted,
    getStepTitle
  } = useOnboardingFlow();

  const stepTitles = [
    'Boas-vindas',
    'Seleção de Módulos',
    'Atalhos Guiados',
    'Finalização'
  ];

  const completedSteps = stepTitles.map((_, index) => isStepCompleted(index));

  const handleWelcomeNext = (profile?: any) => {
    if (profile) {
      setCompanyProfile(profile);
    }
    nextStep();
  };

  const handleSkipOnboarding = async () => {
    try {
      await skipOnboarding();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  const handleStartUsingPlatform = async () => {
    try {
      await completeOnboarding();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleTakeTour = async () => {
    try {
      await completeOnboarding();
      navigate('/dashboard');
      // Small delay to ensure navigation completes
      setTimeout(() => {
        startTour('dashboard-intro');
      }, 500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return <EnhancedWelcomeStep onNext={handleWelcomeNext} onSkip={handleSkipOnboarding} />;
      
      case 1:
        return (
          <EnhancedModuleSelectionStep
            selectedModules={state.selectedModules}
            onModulesChange={setSelectedModules}
            onNext={nextStep}
            onPrev={prevStep}
            companyProfile={companyProfile}
          />
        );
      
      case 2:
        return (
          <EnhancedDataCreationStep
            selectedModules={state.selectedModules}
            moduleConfigurations={state.moduleConfigurations}
            onConfigurationChange={updateModuleConfiguration}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      
      case 3:
        return (
          <EnhancedCompletionStep
            selectedModules={state.selectedModules}
            moduleConfigurations={state.moduleConfigurations}
            onStartUsingPlatform={handleStartUsingPlatform}
            onTakeTour={handleTakeTour}
          />
        );
      
      default:
        return <EnhancedWelcomeStep onNext={nextStep} />;
    }
  };

  // Don't show progress on welcome and completion steps
  const showProgress = state.currentStep > 0 && state.currentStep < 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {showProgress && (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 py-4">
          <div className="container mx-auto px-4">
            <OnboardingProgress
              currentStep={state.currentStep}
              totalSteps={state.totalSteps}
              stepTitles={stepTitles}
              completedSteps={completedSteps}
              selectedModules={state.selectedModules}
              smartMode={!!companyProfile}
            />
          </div>
        </div>
      )}
      
      <div className={showProgress ? 'pt-0' : ''}>
        {renderCurrentStep()}
      </div>
      
      {/* Analytics Tracking */}
      <OnboardingAnalytics
        currentStep={state.currentStep}
        selectedModules={state.selectedModules}
        companyProfile={companyProfile}
      />
      
      {/* Loading overlay */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-lg font-medium text-foreground">
              Finalizando configuração...
            </p>
            <p className="text-sm text-muted-foreground">
              Salvando suas preferências e preparando a plataforma
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function OnboardingMain() {
  return (
    <OnboardingFlowProvider>
      <OnboardingContent />
    </OnboardingFlowProvider>
  );
}