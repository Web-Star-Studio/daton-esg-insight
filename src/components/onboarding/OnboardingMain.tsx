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
import { SmartOnboardingOrchestrator } from './SmartOnboardingOrchestrator';
import { AdaptiveGuidanceSystem } from './AdaptiveGuidanceSystem';
import { SmartValidationHelper } from './SmartValidationHelper';
import { SmartNotificationCenter } from './SmartNotificationCenter';
import { SmartGamificationSystem } from './SmartGamificationSystem';
import { IntelligentAIAssistant } from './IntelligentAIAssistant';
import { AdvancedPersonalizationEngine } from './AdvancedPersonalizationEngine';
import { RealTimeFeedbackSystem } from './RealTimeFeedbackSystem';
import { PredictiveAnalyticsEngine } from './PredictiveAnalyticsEngine';
import { InteractiveTutorialSystem } from './InteractiveTutorialSystem';
import { SmartContentGenerator } from './SmartContentGenerator';
import { useUnifiedTour } from '@/contexts/UnifiedTourContext';

function OnboardingContent() {
  const navigate = useNavigate();
  const { startTour: startOldTour } = useTutorial();
  const { startTour } = useUnifiedTour();
  const { skipOnboarding } = useAuth();
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [userActions, setUserActions] = useState<string[]>([]);
  const [onboardingStartTime] = useState(Date.now());
  
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
      setUserActions(prev => [...prev, 'profile_completed']);
    }
    setUserActions(prev => [...prev, 'welcome_completed']);
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
      {/* Smart Notification Center */}
      <div className="fixed top-4 right-4 z-50">
        <SmartNotificationCenter
          onboardingData={{
            currentStep: state.currentStep,
            selectedModules: state.selectedModules,
            timeSpent: Date.now() - (parseInt(localStorage.getItem('onboarding_start_time') || '0')),
            completionPercentage: (state.currentStep / (state.totalSteps - 1)) * 100
          }}
          userBehavior={{
            engagementLevel: 'medium',
            strugglingAreas: state.currentStep === 1 && state.selectedModules.length === 0 ? ['module_selection'] : [],
            achievements: state.selectedModules.length > 3 ? ['good_selection'] : []
          }}
        />
      </div>

      {showProgress && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 py-4">
          <div className="container mx-auto px-4">
            <OnboardingProgress
              currentStep={state.currentStep}
              totalSteps={state.totalSteps}
              stepTitles={stepTitles}
              selectedModules={state.selectedModules}
            />
          </div>
        </div>
      )}
      
      <div className={showProgress ? 'pt-0' : ''}>
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          {/* Smart Orchestrator and Guidance - only show during active steps */}
          {state.currentStep > 0 && state.currentStep < 3 && (
            <>
              <SmartOnboardingOrchestrator
                companyData={companyProfile}
                userBehavior={{
                  timeSpentPerStep: [60, 120, 90, 30],
                  clickPatterns: [],
                  hesitationPoints: state.currentStep === 1 && state.selectedModules.length === 0 ? [1] : [],
                }}
              />

              <AdaptiveGuidanceSystem
                currentStep={state.currentStep}
                userBehavior={{
                  hesitationPoints: state.currentStep === 1 && state.selectedModules.length === 0 ? [1] : [],
                  quickSteps: [],
                  timeSpentPerStep: [60, 120, 90, 30],
                  backtrackingPattern: false,
                  helpSeekingBehavior: 'medium'
                }}
                onGuidanceAction={(actionId) => {
                  console.log('Guidance action:', actionId);
                }}
              />

              <SmartValidationHelper
                currentStep={state.currentStep}
                data={state}
                onValidationChange={(isValid, errors) => {
                  console.log('Validation:', isValid, errors);
                }}
                onAutoFix={(fixes) => {
                  if (fixes.selectedModules) {
                    setSelectedModules(fixes.selectedModules);
                  }
                }}
              />

              <SmartGamificationSystem
                currentStep={state.currentStep}
                totalSteps={state.totalSteps}
                selectedModulesCount={state.selectedModules.length}
                timeSpent={Date.now() - onboardingStartTime}
                userActions={userActions}
                onAchievementUnlocked={(achievement) => {
                  console.log('Achievement unlocked:', achievement);
                  setUserActions(prev => [...prev, `achievement_${achievement.id}`]);
                }}
              />

              <AdvancedPersonalizationEngine
                companyProfile={companyProfile}
                currentStep={state.currentStep}
                selectedModules={state.selectedModules}
                userBehavior={{
                  timeSpentPerStep: [60, 120, 90, 30],
                  clickPatterns: userActions,
                  hesitationPoints: state.currentStep === 1 && state.selectedModules.length === 0 ? [1] : []
                }}
                onSuggestionApplied={(suggestion) => {
                  console.log('Suggestion applied:', suggestion);
                  setUserActions(prev => [...prev, `suggestion_${suggestion.id}`]);
                }}
              />

              <PredictiveAnalyticsEngine
                currentStep={state.currentStep}
                totalSteps={state.totalSteps}
                selectedModules={state.selectedModules}
                companyProfile={companyProfile}
                userBehavior={{
                  sessionDuration: Date.now() - onboardingStartTime,
                  clickPatterns: userActions,
                  hesitationPoints: state.currentStep === 1 && state.selectedModules.length === 0 ? [1] : [],
                  backtrackingCount: userActions.filter(action => action.startsWith('prev_step')).length,
                  helpRequests: userActions.filter(action => action.startsWith('help')).length,
                  formCompletionRate: state.selectedModules.length > 0 ? 1 : 0.5,
                  deviceType: 'desktop',
                  timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
                }}
                onPredictionAction={(actionId, prediction) => {
                  console.log('Prediction action:', actionId, prediction);
                  setUserActions(prev => [...prev, `prediction_${actionId}`]);
                }}
              />

              <InteractiveTutorialSystem
                currentStep={state.currentStep}
                selectedModules={state.selectedModules}
                companyProfile={companyProfile}
                userSkillLevel={companyProfile?.maturityLevel || 'intermediate'}
                onTutorialComplete={(tutorialId, completionData) => {
                  console.log('Tutorial completed:', tutorialId, completionData);
                  setUserActions(prev => [...prev, `tutorial_completed_${tutorialId}`]);
                }}
                onStepComplete={(stepId, stepData) => {
                  console.log('Tutorial step completed:', stepId, stepData);
                  setUserActions(prev => [...prev, `tutorial_step_${stepId}`]);
                }}
              />

              <SmartContentGenerator
                currentStep={state.currentStep}
                selectedModules={state.selectedModules}
                companyProfile={companyProfile}
                userBehavior={{
                  preferredTone: 'friendly',
                  engagementLevel: userActions.length > 10 ? 'high' : userActions.length > 5 ? 'medium' : 'low',
                  experienceLevel: companyProfile?.maturityLevel || 'intermediate'
                }}
                onContentGenerated={(content) => {
                  console.log('Content generated:', content);
                  setUserActions(prev => [...prev, `content_generated_${content.type}`]);
                }}
                onContentApplied={(contentId) => {
                  console.log('Content applied:', contentId);
                  setUserActions(prev => [...prev, `content_applied_${contentId}`]);
                }}
              />
            </>
          )}

          {renderCurrentStep()}
        </div>
      </div>

      {/* AI Assistant */}
      <IntelligentAIAssistant
        currentStep={state.currentStep}
        selectedModules={state.selectedModules}
        companyProfile={companyProfile}
        userBehavior={{
          hesitationPoints: state.currentStep === 1 && state.selectedModules.length === 0 ? [1] : [],
          timeSpentPerStep: [60, 120, 90, 30],
          questionsAsked: userActions.filter(action => action.startsWith('question')).length
        }}
        onSuggestionAccepted={(suggestionId) => {
          setUserActions(prev => [...prev, `ai_suggestion_${suggestionId}`]);
        }}
        onNavigateToStep={(step) => {
          // Implementation for step navigation if needed
        }}
      />

      {/* Real-time Feedback */}
      <RealTimeFeedbackSystem
        currentStep={state.currentStep}
        stepTitle={getStepTitle(state.currentStep)}
        showCompact={state.currentStep > 0}
        onFeedbackSubmitted={(feedback) => {
          console.log('Feedback submitted:', feedback);
          setUserActions(prev => [...prev, 'feedback_submitted']);
        }}
      />
      
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