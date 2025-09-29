import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlowProvider, useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CleanWelcomeStep } from './CleanWelcomeStep';
import { CleanModuleSelectionStep } from './CleanModuleSelectionStep';
import { CleanDataCreationStep } from './CleanDataCreationStep';
import { CleanCompletionStep } from './CleanCompletionStep';
import { OnboardingProgress } from './OnboardingProgress';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';

function CleanOnboardingContent() {
  const navigate = useNavigate();
  const { startTour } = useTutorial();
  const { skipOnboarding, user } = useAuth();
  const { toast } = useToast();
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  
  const {
    state,
    nextStep,
    prevStep,
    setSelectedModules,
    updateModuleConfiguration,
    completeOnboarding,
  } = useOnboardingFlow();

  const stepTitles = [
    'Boas-vindas',
    'Seleção de Módulos', 
    'Configuração',
    'Finalização'
  ];

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
    console.log('🔄 Starting platform - button clicked');
    try {
      console.log('⏳ Completing onboarding...');
      await completeOnboarding();
      console.log('✅ Onboarding completed, navigating to dashboard...');
      navigate('/');
      console.log('🏁 Navigation completed');
    } catch (error) {
      console.error('❌ Error in handleStartUsingPlatform:', error);
      // Force navigation even if onboarding fails
      console.log('🚨 Forcing navigation despite error...');
      navigate('/');
    }
  };

  const handleTakeTour = async () => {
    console.log('🎯 Take tour - button clicked');
    try {
      console.log('⏳ Completing onboarding...');
      await completeOnboarding();
      console.log('✅ Onboarding completed, navigating to dashboard...');
      navigate('/');
      setTimeout(() => {
        console.log('🎪 Starting dashboard tour...');
        startTour('dashboard-intro');
      }, 1000);
      console.log('🏁 Navigation completed');
    } catch (error) {
      console.error('❌ Error in handleTakeTour:', error);
      // Force navigation even if onboarding fails
      console.log('🚨 Forcing navigation despite error...');
      navigate('/');
      setTimeout(() => {
        startTour('dashboard-intro');
      }, 1000);
    }
  };

  const handleEmergencyComplete = async () => {
    console.log('🚨 Emergency complete - forcing onboarding completion');
    try {
      // Clear all localStorage
      localStorage.removeItem('daton_onboarding_progress');
      localStorage.removeItem('daton_tutorial_completed');
      localStorage.removeItem('daton_primeiros_passos_dismissed');
      
      // Force update profile
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ has_completed_onboarding: true })
          .eq('id', user.id);
      }
      
      // Force navigation
      navigate('/');
      
      toast({
        title: 'Onboarding Finalizado!',
        description: 'Configuração concluída com sucesso.',
      });
    } catch (error) {
      console.error('❌ Emergency complete failed:', error);
      // Still force navigation
      navigate('/');
    }
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <CleanWelcomeStep 
            onNext={handleWelcomeNext} 
            onSkip={handleSkipOnboarding} 
          />
        );
      
      case 1:
        return (
          <CleanModuleSelectionStep
            selectedModules={state.selectedModules}
            onModulesChange={setSelectedModules}
            onNext={nextStep}
            onPrev={prevStep}
            companyProfile={companyProfile}
          />
        );
      
      case 2:
        return (
          <CleanDataCreationStep
            selectedModules={state.selectedModules}
            moduleConfigurations={state.moduleConfigurations}
            onConfigurationChange={updateModuleConfiguration}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      
      case 3:
        return (
          <CleanCompletionStep
            selectedModules={state.selectedModules}
            moduleConfigurations={state.moduleConfigurations}
            onStartUsingPlatform={handleStartUsingPlatform}
            onTakeTour={handleTakeTour}
            onEmergencyComplete={handleEmergencyComplete}
          />
        );
      
      default:
        return (
          <CleanWelcomeStep 
            onNext={handleWelcomeNext} 
            onSkip={handleSkipOnboarding} 
          />
        );
    }
  };

  const showProgress = state.currentStep > 0 && state.currentStep < 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Enhanced Progress Header */}
      {showProgress && (
        <OnboardingProgress
          currentStep={state.currentStep}
          totalSteps={stepTitles.length}
          stepTitles={stepTitles}
          selectedModules={state.selectedModules}
        />
      )}
      
      {/* Main Content with enhanced animations */}
      <div className={showProgress ? 'pt-8' : ''}>
        {renderCurrentStep()}
      </div>
      
      {/* Enhanced Loading State */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <EnhancedLoading 
            variant="gradient" 
            size="lg" 
            text="Finalizando configuração..." 
            subtext="Criando seu ambiente personalizado"
            className="animate-scale-in"
          />
        </div>
      )}
    </div>
  );
}

export function CleanOnboardingMain() {
  return (
    <OnboardingFlowProvider>
      <CleanOnboardingContent />
    </OnboardingFlowProvider>
  );
}