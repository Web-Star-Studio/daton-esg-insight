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
import { EnhancedOnboardingProgress } from './EnhancedOnboardingProgress';
import { OnboardingAssistant } from './OnboardingAssistant';
import { PostOnboardingValidation } from './PostOnboardingValidation';
import { InitialDataSetup } from './InitialDataSetup';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { OnboardingRedirectHandler } from './OnboardingRedirectHandler';

function CleanOnboardingContent() {
  const navigate = useNavigate();
  const { startTour } = useTutorial();
  const { skipOnboarding, user } = useAuth();
  const { toast } = useToast();
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showDataSetup, setShowDataSetup] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [dataSetupResults, setDataSetupResults] = useState<any>(null);
  
  const {
    state,
    nextStep,
    prevStep,
    setSelectedModules,
    updateModuleConfiguration,
    completeOnboarding,
  } = useOnboardingFlow();

  const { selectedModules, moduleConfigurations } = state;

  const stepTitles = [
    'Boas-vindas',
    'Seleção de Módulos', 
    'Configuração',
    'Validação',
    'Finalização'
  ];

  const handleWelcomeNext = (profile?: any) => {
    if (profile) {
      setCompanyProfile(profile);
    }
    nextStep();
  };

  const handleSetupInitialData = () => {
    setShowDataSetup(true);
  };

  const handleDataSetupComplete = (results: any) => {
    setDataSetupResults(results);
    setShowDataSetup(false);
    setShowValidation(true);
  };

  const handleRunValidation = () => {
    setShowValidation(true);
  };

  const handleValidationComplete = (results: any) => {
    setValidationResults(results);
    setShowValidation(false);
    nextStep(); // Move to completion step
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
      // Ensure the layout stops rendering onboarding overlay
      await skipOnboarding();
      console.log('✅ Onboarding completed, navigating to dashboard... (from)', window.location.pathname);
      navigate('/dashboard', { replace: true });
      console.log('🏁 Navigation requested to /dashboard');
      // Fallback in case routing is blocked
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          console.warn('⚠️ Route did not change, forcing navigation to /dashboard');
          window.location.href = '/dashboard';
        }
      }, 1200);
    } catch (error) {
      console.error('❌ Error in handleStartUsingPlatform:', error);
      // Force navigation even if onboarding fails
      console.log('🚨 Forcing navigation despite error...');
      await skipOnboarding();
      navigate('/dashboard');
    }
  };

  const handleTakeTour = async () => {
    console.log('🎯 Take tour - button clicked');
    try {
      console.log('⏳ Completing onboarding...');
      await completeOnboarding();
      // Ensure the layout stops rendering onboarding overlay
      await skipOnboarding();
      console.log('✅ Onboarding completed, navigating to dashboard... (from)', window.location.pathname);
      navigate('/dashboard', { replace: true });
      console.log('🏁 Navigation requested to /dashboard');
      // Start tour shortly after navigation
      setTimeout(() => {
        console.log('🎪 Starting dashboard tour...');
        startTour('dashboard-intro');
      }, 1000);
    } catch (error) {
      console.error('❌ Error in handleTakeTour:', error);
      // Force navigation even if onboarding fails
      console.log('🚨 Forcing navigation despite error...');
      await skipOnboarding();
      navigate('/dashboard');
      setTimeout(() => {
        startTour('dashboard-intro');
      }, 1000);
    }
  };

  const handleSuggestionAccept = (suggestionId: string) => {
    console.log('🎯 Accepting suggestion:', suggestionId);
    
    switch (suggestionId) {
      case 'gee-industrial':
        if (!selectedModules.includes('inventario_gee')) {
          setSelectedModules([...selectedModules, 'inventario_gee']);
          toast({
            title: 'Módulo Adicionado',
            description: 'Inventário GEE foi adicionado às suas seleções.',
          });
        }
        break;
      case 'gee-automation':
        updateModuleConfiguration('inventario_gee', {
          ...moduleConfigurations['inventario_gee'],
          automatic_calculation: true
        });
        toast({
          title: 'Configuração Atualizada',
          description: 'Cálculos automáticos foram ativados para o Inventário GEE.',
        });
        break;
      default:
        console.log('Unknown suggestion:', suggestionId);
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
        console.log('💾 Updating profile to mark onboarding as completed...');
        await supabase
          .from('profiles')
          .update({ has_completed_onboarding: true })
          .eq('id', user.id);
        console.log('✅ Profile updated successfully');
      }

      // Update layout state to hide onboarding
      console.log('🔄 Calling skipOnboarding...');
      await skipOnboarding();
      console.log('✅ skipOnboarding completed');
      
      // Force navigation
      console.log('🚀 Forcing navigation to dashboard...');
      navigate('/dashboard', { replace: true });
      
      toast({
        title: 'Onboarding Finalizado! 🎉',
        description: 'Configuração concluída com sucesso. Redirecionando...',
      });
      
      // Force page reload as backup
      setTimeout(() => {
        console.log('🔄 Forcing page reload for clean state...');
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('❌ Emergency complete failed:', error);
      // Still force navigation
      try {
        await skipOnboarding();
        navigate('/dashboard');
      } catch (e) {
        console.error('❌ Fallback also failed, forcing window redirect');
        window.location.href = '/dashboard';
      }
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
            onNext={() => {
              // Check if user wants to setup initial data
              if (state.selectedModules.length > 0) {
                setShowDataSetup(true);
              } else {
                nextStep();
              }
            }}
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
            onSetupInitialData={handleSetupInitialData}
            onRunValidation={handleRunValidation}
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

  // Show validation or data setup modals
  if (showDataSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <InitialDataSetup
          selectedModules={state.selectedModules}
          moduleConfigurations={state.moduleConfigurations}
          onSetupComplete={handleDataSetupComplete}
          onSkip={() => {
            setShowDataSetup(false);
            nextStep();
          }}
        />
      </div>
    );
  }

  if (showValidation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <PostOnboardingValidation
          selectedModules={state.selectedModules}
          moduleConfigurations={state.moduleConfigurations}
          onValidationComplete={handleValidationComplete}
          onStartPlatform={handleStartUsingPlatform}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Onboarding Redirect Handler */}
      <OnboardingRedirectHandler />
      
      {/* Enhanced Progress Header */}
      {showProgress && (
        <EnhancedOnboardingProgress
          currentStep={state.currentStep}
          totalSteps={stepTitles.length}
          stepTitles={stepTitles}
          selectedModules={state.selectedModules}
          moduleConfigurations={state.moduleConfigurations}
        />
      )}

      {/* Smart Assistant */}
      {state.currentStep > 0 && state.currentStep < 3 && (
        <OnboardingAssistant
          currentStep={state.currentStep}
          selectedModules={selectedModules}
          moduleConfigurations={moduleConfigurations}
          companyProfile={companyProfile}
          onSuggestionAccept={handleSuggestionAccept}
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