import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlowProvider, useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { WelcomeStep } from './WelcomeStep';
import { ModuleSelectionStep } from './ModuleSelectionStep';
import { GuidedConfigurationStep } from './GuidedConfigurationStep';
import { CompletionStep } from './CompletionStep';
import { OnboardingProgress } from './OnboardingProgress';

function OnboardingContent() {
  const navigate = useNavigate();
  const { startTour } = useTutorial();
  
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
    'Módulos',
    'Configuração',
    'Finalização'
  ];

  const completedSteps = stepTitles.map((_, index) => isStepCompleted(index));

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
        return <WelcomeStep onNext={nextStep} />;
      
      case 1:
        return (
          <ModuleSelectionStep
            selectedModules={state.selectedModules}
            onModulesChange={setSelectedModules}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      
      case 2:
        return (
          <GuidedConfigurationStep
            selectedModules={state.selectedModules}
            moduleConfigurations={state.moduleConfigurations}
            onConfigurationChange={updateModuleConfiguration}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      
      case 3:
        return (
          <CompletionStep
            selectedModules={state.selectedModules}
            moduleConfigurations={state.moduleConfigurations}
            onStartUsingPlatform={handleStartUsingPlatform}
            onTakeTour={handleTakeTour}
          />
        );
      
      default:
        return <WelcomeStep onNext={nextStep} />;
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
            />
          </div>
        </div>
      )}
      
      <div className={showProgress ? 'pt-0' : ''}>
        {renderCurrentStep()}
      </div>
      
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