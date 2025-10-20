import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlowProvider, useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useUnifiedTour } from '@/contexts/UnifiedTourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CleanWelcomeStep } from './CleanWelcomeStep';
import { CleanModuleSelectionStep } from './CleanModuleSelectionStep';
import { CleanDataCreationStep } from './CleanDataCreationStep';
import { CleanCompletionStep } from './CleanCompletionStep';
import { OnboardingAssistant } from './OnboardingAssistant';
import { PostOnboardingValidation } from './PostOnboardingValidation';
import { InitialDataSetup } from './InitialDataSetup';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { OnboardingRedirectHandler } from './OnboardingRedirectHandler';
import { OnboardingErrorBoundary } from './OnboardingErrorBoundary';

function CleanOnboardingContent() {
  const navigate = useNavigate();
  const { startTour } = useUnifiedTour();
  const { restartOnboarding } = useTutorial();
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

  const handleWelcomeNext = (profile?: any, recommendedModules?: string[]) => {
    if (profile) {
      setCompanyProfile(profile);
      console.log('📝 Company profile saved:', profile);
    }
    
    if (recommendedModules && recommendedModules.length > 0) {
      console.log('🎯 Pre-selecting recommended modules:', recommendedModules);
      setSelectedModules(recommendedModules);
      toast({
        title: 'Módulos Recomendados',
        description: `${recommendedModules.length} módulos foram pré-selecionados com base no seu perfil.`,
      });
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
    console.log('🚀 Starting platform usage...');
    
    try {
      if (!user?.id) {
        throw new Error('User not found');
      }
      
      // 1. Complete onboarding in OnboardingFlowContext
      console.log('📝 Completing onboarding in context...');
      await completeOnboarding();
      
      // 2. Ensure profile is marked as complete
      console.log('📝 Updating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
        
      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw profileError;
      }
      
      // 3. Clear onboarding local storage
      console.log('🧹 Clearing local storage...');
      localStorage.removeItem('daton_onboarding_progress');
      localStorage.removeItem('daton_onboarding_selections');
      
      // 4. Update auth context
      await skipOnboarding();
      
      console.log('✅ Onboarding completed successfully');
      
      toast({
        title: "Configuração concluída! 🎉",
        description: "Bem-vindo à plataforma Daton ESG!",
      });
      
      // Small delay to ensure state updates
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('❌ Error starting platform:', error);
      toast({
        title: "Erro ao concluir",
        description: "Tentando método alternativo...",
        variant: "destructive"
      });
      
      // Fallback to emergency complete
      await handleEmergencyComplete();
    }
  };

  const handleTakeTour = async () => {
    console.log('🎯 Taking guided tour...');
    
    try {
      // Complete onboarding first
      await handleStartUsingPlatform();
      
      // Start tour after navigation
      setTimeout(() => {
        console.log('🎪 Starting dashboard tour...');
        startTour('dashboard-intro');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error starting tour:', error);
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
    console.log('🚨 EMERGENCY COMPLETION TRIGGERED');
    
    try {
      if (user?.id) {
        // Get company_id with fallback
        let companyId = user.company?.id;
        
        if (!companyId) {
          console.warn('⚠️ Company ID not available, fetching from profile...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
            
          if (profileError || !profileData?.company_id) {
            console.error('❌ Cannot complete without company_id, will skip selections');
          } else {
            companyId = profileData.company_id;
          }
        }
        
        // 1. Update profile first (most critical)
        console.log('📝 Updating profile...');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ has_completed_onboarding: true })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('❌ Profile update error:', profileError);
          throw profileError;
        }
        console.log('✅ Profile updated successfully');
        
        // 2. Complete onboarding selections (only if we have company_id)
        if (companyId) {
          console.log('🏁 Completing onboarding selections...');
          const { error: selectionsError } = await supabase
            .from('onboarding_selections')
            .upsert([{
              user_id: user.id,
              company_id: companyId,
              is_completed: true,
              completed_at: new Date().toISOString(),
              selected_modules: state.selectedModules || [],
              module_configurations: state.moduleConfigurations || {},
              current_step: state.totalSteps - 1
            }], {
              onConflict: 'user_id'
            });
            
          if (selectionsError && selectionsError.code !== '23505') {
            console.warn('⚠️ Selections error (non-critical):', selectionsError);
          } else {
            console.log('✅ Selections marked complete');
          }
        }
        
        // 3. Clear onboarding-related local storage
        console.log('🧹 Clearing onboarding local storage...');
        localStorage.removeItem('daton_onboarding_progress');
        localStorage.removeItem('daton_onboarding_selections');
        localStorage.removeItem('daton_onboarding_completed');
        
        // 4. Update auth context
        await skipOnboarding();
      }
      
      // 5. Navigate to dashboard
      console.log('🚀 Navigating to dashboard...');
      toast({
        title: "Onboarding concluído! 🎉",
        description: "Bem-vindo à plataforma!",
      });
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Emergency completion error:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível concluir o onboarding. Redirecionando...",
        variant: "destructive"
      });
      
      // Force navigation on error
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
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
      <div>
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
    <OnboardingErrorBoundary>
      <OnboardingFlowProvider>
        <CleanOnboardingContent />
      </OnboardingFlowProvider>
    </OnboardingErrorBoundary>
  );
}