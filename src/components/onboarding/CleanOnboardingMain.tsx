import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlowProvider, useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useUnifiedTour } from '@/contexts/UnifiedTourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
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
import { MODULE_MAP_BY_ID } from './modulesCatalog';

function CleanOnboardingContent() {
  const navigate = useNavigate();
  const { startTour } = useUnifiedTour();
  const { restartOnboarding } = useTutorial();
  const { skipOnboarding, user } = useAuth();
  const { toast } = useToast();
  const [showValidation, setShowValidation] = useState(false);
  const [showDataSetup, setShowDataSetup] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [dataSetupResults, setDataSetupResults] = useState<any>(null);
  
  const {
    state,
    nextStep,
    prevStep,
    setSelectedModules,
    setCompanyProfile,
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
      setCompanyProfile(profile); // Save to context (persisted to database)
      logger.debug('Company profile saved to context', 'ui', profile);
    }
    
    if (recommendedModules && recommendedModules.length > 0) {
      logger.debug('Pre-selecting recommended modules', 'ui', recommendedModules);
      
      // Validate modules - filter only modules that exist in catalog
      const validModules = recommendedModules.filter(moduleId => {
        const exists = MODULE_MAP_BY_ID[moduleId];
        if (!exists) {
          logger.warn(`Module ${moduleId} recommended but not in catalog`, 'ui');
        }
        return exists;
      });
      
      setSelectedModules(validModules);
      
      toast({
        title: 'Módulos Recomendados',
        description: `${validModules.length} módulos foram pré-selecionados com base no seu perfil.`,
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
      logger.error('Error skipping onboarding', error, 'ui');
    }
  };

  const handleStartUsingPlatform = async () => {
    logger.info('Starting platform usage', 'ui');
    
    try {
      if (!user?.id) {
        throw new Error('User not found');
      }
      
      // 1. Complete onboarding in OnboardingFlowContext
      logger.debug('Completing onboarding in context', 'ui');
      await completeOnboarding();
      
      // 2. Ensure profile is marked as complete
      logger.debug('Updating profile', 'database');
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);
        
      if (profileError) {
        logger.error('Profile update error', profileError, 'database');
        throw profileError;
      }
      
      // 3. Clear onboarding local storage
      logger.debug('Clearing local storage', 'ui');
      localStorage.removeItem('daton_onboarding_progress');
      localStorage.removeItem('daton_onboarding_selections');
      
      // 4. Update auth context
      await skipOnboarding();
      
      logger.info('Onboarding completed successfully', 'ui');
      
      toast({
        title: "Configuração concluída! 🎉",
        description: "Bem-vindo à plataforma Daton ESG!",
      });
      
      // Small delay to ensure state updates
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
      
    } catch (error) {
      logger.error('Error starting platform', error, 'ui');
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
    logger.info('Taking guided tour', 'ui');
    
    try {
      // Complete onboarding first
      await handleStartUsingPlatform();
      
      // Start tour after navigation
      setTimeout(() => {
        logger.debug('Starting dashboard tour', 'ui');
        startTour('dashboard-intro');
      }, 1000);
      
    } catch (error) {
      logger.error('Error starting tour', error, 'ui');
    }
  };

  const handleSuggestionAccept = (suggestionId: string) => {
    logger.debug('Accepting suggestion', 'ui', suggestionId);
    
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
        logger.debug('Unknown suggestion', 'ui', suggestionId);
    }
  };

  const handleEmergencyComplete = async () => {
    logger.warn('EMERGENCY COMPLETION TRIGGERED', 'ui');
    
    try {
      if (user?.id) {
        // Get company_id with fallback
        let companyId = user.company?.id;
        
        if (!companyId) {
          logger.warn('Company ID not available, fetching from profile', 'database');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();
            
          if (profileError || !profileData?.company_id) {
            logger.error('Cannot complete without company_id, will skip selections', profileError, 'database');
          } else {
            companyId = profileData.company_id;
          }
        }
        
        // 1. Update profile first (most critical)
        logger.debug('Updating profile', 'database');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ has_completed_onboarding: true })
          .eq('id', user.id);
          
        if (profileError) {
          logger.error('Profile update error', profileError, 'database');
          throw profileError;
        }
        logger.info('Profile updated successfully', 'database');
        
        // 2. Complete onboarding selections (only if we have company_id)
        if (companyId) {
          logger.debug('Completing onboarding selections', 'database');
          const { error: selectionsError } = await supabase
            .from('onboarding_selections')
            .upsert([{
              user_id: user.id,
              company_id: companyId,
              is_completed: true,
              completed_at: new Date().toISOString(),
              selected_modules: state.selectedModules || [],
              module_configurations: state.moduleConfigurations || {},
              company_profile: state.companyProfile || {},
              current_step: state.totalSteps - 1
            }], {
              onConflict: 'user_id'
            });
            
          if (selectionsError && selectionsError.code !== '23505') {
            logger.warn('Selections error (non-critical)', 'database', selectionsError);
          } else {
            logger.info('Selections marked complete', 'database');
          }
        }
        
        // 3. Clear onboarding-related local storage
        logger.debug('Clearing onboarding local storage', 'ui');
        localStorage.removeItem('daton_onboarding_progress');
        localStorage.removeItem('daton_onboarding_selections');
        localStorage.removeItem('daton_onboarding_completed');
        
        // 4. Update auth context
        await skipOnboarding();
      }
      
      // 5. Navigate to dashboard
      logger.info('Navigating to dashboard', 'ui');
      toast({
        title: "Onboarding concluído! 🎉",
        description: "Bem-vindo à plataforma!",
      });
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
      
    } catch (error: any) {
      logger.error('Emergency completion error', error, 'ui');
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível concluir o onboarding. Redirecionando...",
        variant: "destructive"
      });
      
      // Force navigation on error
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
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
            companyProfile={state.companyProfile}
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
          companyProfile={state.companyProfile}
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