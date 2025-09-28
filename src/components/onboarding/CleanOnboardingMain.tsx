import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingFlowProvider, useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';
import { CleanWelcomeStep } from './CleanWelcomeStep';
import { CleanModuleSelectionStep } from './CleanModuleSelectionStep';
import { CleanDataCreationStep } from './CleanDataCreationStep';
import { CleanCompletionStep } from './CleanCompletionStep';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function CleanOnboardingContent() {
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

  const showProgress = state.currentStep > 0 && state.currentStep < 3;
  const progressValue = (state.currentStep / (stepTitles.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Enhanced Progress Header */}
      {showProgress && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 animate-slide-in-right">
          <div className="container mx-auto px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground animate-fade-in">
                  {stepTitles[state.currentStep]}
                </h2>
                <Badge variant="outline" className="text-sm animate-scale-in">
                  {state.currentStep} de {stepTitles.length - 1}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Progress value={progressValue} className="h-3 animate-fade-in" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {stepTitles.slice(0, -1).map((title, index) => (
                    <div 
                      key={title} 
                      className={`flex items-center gap-1 transition-all duration-300 ${
                        index <= state.currentStep ? 'text-primary animate-scale-in' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {index < state.currentStep ? (
                        <CheckCircle className="w-3 h-3 animate-scale-in" />
                      ) : (
                        <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                          index === state.currentStep 
                            ? 'border-primary bg-primary animate-pulse' 
                            : 'border-muted-foreground'
                        }`} />
                      )}
                      <span className="hidden sm:inline">{title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Tips based on current step */}
              {state.currentStep === 1 && state.selectedModules.length === 0 && (
                <Card className="bg-blue-50/50 border-blue-200/50 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800">
                        <strong>Dica:</strong> Selecione pelo menos 2 módulos para começar
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {state.currentStep === 2 && (
                <Card className="bg-green-50/50 border-green-200/50 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-800">
                        Quase pronto! Configure as opções básicas para finalizar
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content with enhanced animations */}
      <div className={showProgress ? 'pt-8' : ''}>
        {renderCurrentStep()}
      </div>
      
      {/* Enhanced Loading State */}
      {state.isLoading && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Finalizando configuração...
              </p>
              <p className="text-sm text-muted-foreground animate-pulse">
                Criando seu ambiente personalizado
              </p>
              <div className="flex justify-center gap-1 mt-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
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