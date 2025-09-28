import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, SkipForward, RotateCcw, CheckCircle2, 
  ArrowRight, ArrowLeft, Mouse, Keyboard, Eye,
  Lightbulb, Target, Zap, BookOpen, HelpCircle
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action: 'click' | 'hover' | 'type' | 'scroll' | 'wait' | 'highlight';
  duration: number; // in seconds
  optional: boolean;
  tips: string[];
  validation?: {
    type: 'element_exists' | 'text_contains' | 'attribute_equals' | 'custom';
    condition: string;
  };
}

interface Tutorial {
  id: string;
  name: string;
  description: string;
  category: 'onboarding' | 'feature' | 'advanced';
  steps: TutorialStep[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
}

interface InteractiveTutorialSystemProps {
  currentStep: number;
  selectedModules: string[];
  companyProfile?: any;
  userSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  onTutorialComplete?: (tutorialId: string, completionData: any) => void;
  onStepComplete?: (stepId: string, stepData: any) => void;
}

const AVAILABLE_TUTORIALS: Tutorial[] = [
  {
    id: 'module_selection_guide',
    name: 'Guia de Seleção de Módulos',
    description: 'Aprenda a escolher os módulos ideais para sua empresa',
    category: 'onboarding',
    estimatedTime: 120,
    difficulty: 'beginner',
    prerequisites: [],
    steps: [
      {
        id: 'intro_modules',
        title: 'Visão Geral dos Módulos',
        description: 'Vamos começar explorando os diferentes tipos de módulos disponíveis',
        target: '.module-categories',
        position: 'center',
        action: 'highlight',
        duration: 5,
        optional: false,
        tips: ['Cada categoria tem módulos específicos para diferentes necessidades', 'Você pode selecionar quantos módulos precisar']
      },
      {
        id: 'category_exploration',
        title: 'Explorando Categorias',
        description: 'Clique em uma categoria para ver os módulos disponíveis',
        target: '[data-category="esg_sustentabilidade"]',
        position: 'right',
        action: 'click',
        duration: 3,
        optional: false,
        tips: ['Cada categoria agrupa módulos relacionados', 'ESG & Sustentabilidade é geralmente uma boa escolha inicial']
      },
      {
        id: 'module_details',
        title: 'Detalhes do Módulo',
        description: 'Veja as informações detalhadas sobre cada módulo',
        target: '.module-card',
        position: 'top',
        action: 'hover',
        duration: 4,
        optional: false,
        tips: ['Preste atenção aos recursos principais', 'Verifique o nível de dificuldade', 'Considere o tempo estimado de configuração']
      },
      {
        id: 'smart_recommendations',
        title: 'Recomendações Inteligentes',
        description: 'Use nossas recomendações baseadas no perfil da sua empresa',
        target: '.smart-recommendations',
        position: 'left',
        action: 'click',
        duration: 3,
        optional: true,
        tips: ['As recomendações são baseadas no seu setor e tamanho da empresa', 'Você sempre pode personalizar depois']
      }
    ]
  },
  {
    id: 'shortcuts_configuration',
    name: 'Configuração de Atalhos',
    description: 'Aprenda a configurar atalhos personalizados para máxima eficiência',
    category: 'feature',
    estimatedTime: 180,
    difficulty: 'intermediate',
    prerequisites: ['module_selection_guide'],
    steps: [
      {
        id: 'shortcuts_intro',
        title: 'O que são Atalhos Guiados',
        description: 'Atalhos são caminhos diretos para as funcionalidades mais usadas',
        target: '.shortcuts-explanation',
        position: 'center',
        action: 'highlight',
        duration: 6,
        optional: false,
        tips: ['Atalhos economizam tempo no dia a dia', 'Cada módulo tem atalhos específicos', 'Você pode personalizar conforme sua rotina']
      },
      {
        id: 'example_data',
        title: 'Dados de Exemplo',
        description: 'Configure dados de exemplo para testar rapidamente',
        target: '.example-data-toggle',
        position: 'bottom',
        action: 'click',
        duration: 3,
        optional: true,
        tips: ['Dados de exemplo aceleram os primeiros testes', 'Você pode remover depois', 'Baseados em casos reais de uso']
      },
      {
        id: 'direct_navigation',
        title: 'Navegação Direta',
        description: 'Teste a navegação direta para o módulo configurado',
        target: '.direct-navigation-button',
        position: 'top',
        action: 'click',
        duration: 2,
        optional: false,
        tips: ['Navegação direta leva você exatamente onde precisa', 'Perfeito para usuários experientes']
      }
    ]
  },
  {
    id: 'advanced_personalization',
    name: 'Personalização Avançada',
    description: 'Técnicas avançadas para personalizar completamente sua experiência',
    category: 'advanced',
    estimatedTime: 240,
    difficulty: 'advanced',
    prerequisites: ['module_selection_guide', 'shortcuts_configuration'],
    steps: [
      {
        id: 'ai_assistant',
        title: 'Assistente IA',
        description: 'Configure o assistente IA para suas necessidades específicas',
        target: '.ai-assistant',
        position: 'right',
        action: 'click',
        duration: 5,
        optional: false,
        tips: ['O assistente aprende com seu comportamento', 'Pode dar sugestões contextuais', 'Disponível em todo o sistema']
      },
      {
        id: 'custom_workflows',
        title: 'Fluxos Personalizados',
        description: 'Crie fluxos de trabalho personalizados para sua empresa',
        target: '.workflow-builder',
        position: 'left',
        action: 'hover',
        duration: 8,
        optional: true,
        tips: ['Fluxos personalizados aumentam a eficiência', 'Podem ser compartilhados com a equipe', 'Adaptam-se aos seus processos']
      }
    ]
  }
];

export function InteractiveTutorialSystem({
  currentStep,
  selectedModules,
  companyProfile,
  userSkillLevel,
  onTutorialComplete,
  onStepComplete
}: InteractiveTutorialSystemProps) {
  const [availableTutorials, setAvailableTutorials] = useState<Tutorial[]>([]);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, number>>({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const highlightRef = useRef<HTMLDivElement>(null);
  const stepTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    filterAvailableTutorials();
  }, [currentStep, selectedModules, userSkillLevel, companyProfile]);

  useEffect(() => {
    if (activeTutorial && isPlaying) {
      executeCurrentStep();
    }
  }, [activeTutorial, currentTutorialStep, isPlaying]);

  const filterAvailableTutorials = () => {
    let filtered = AVAILABLE_TUTORIALS.filter(tutorial => {
      // Filter by skill level
      if (userSkillLevel === 'beginner' && tutorial.difficulty === 'advanced') return false;
      if (userSkillLevel === 'intermediate' && tutorial.difficulty === 'advanced') return false;
      
      // Filter by context
      if (tutorial.category === 'onboarding' && currentStep > 2) return false;
      if (tutorial.id === 'module_selection_guide' && currentStep !== 1) return false;
      if (tutorial.id === 'shortcuts_configuration' && currentStep !== 2) return false;
      
      // Filter by prerequisites
      const hasPrerequisites = tutorial.prerequisites.every(prereq => 
        tutorialProgress[prereq] === 1 // 1 means completed
      );
      
      return hasPrerequisites;
    });

    // Add company-specific tutorials
    if (companyProfile?.sector === 'manufacturing') {
      filtered = filtered.map(tutorial => ({
        ...tutorial,
        steps: tutorial.steps.map(step => ({
          ...step,
          tips: [...step.tips, 'Dica específica para indústrias: Foque em compliance ambiental']
        }))
      }));
    }

    setAvailableTutorials(filtered);
  };

  const startTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentTutorialStep(0);
    setIsPlaying(true);
    setCompletedSteps([]);
    
    // Track tutorial start
    onStepComplete?.('tutorial_started', {
      tutorialId: tutorial.id,
      timestamp: Date.now(),
      userSkill: userSkillLevel,
      context: { currentStep, selectedModules: selectedModules.length }
    });
  };

  const executeCurrentStep = () => {
    if (!activeTutorial) return;
    
    const step = activeTutorial.steps[currentTutorialStep];
    if (!step) return;

    // Clear previous timer
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }

    // Find target element
    const targetElement = document.querySelector(step.target);
    if (!targetElement && step.action !== 'wait') {
      // Element not found, skip step or show fallback
      console.warn(`Tutorial step target not found: ${step.target}`);
      nextStep();
      return;
    }

    // Execute step action
    switch (step.action) {
      case 'highlight':
        highlightElement(targetElement as HTMLElement);
        showStepTooltip(step, targetElement as HTMLElement);
        break;
        
      case 'click':
        highlightElement(targetElement as HTMLElement);
        showStepTooltip(step, targetElement as HTMLElement);
        // Simulate click after delay
        setTimeout(() => {
          (targetElement as HTMLElement).click();
        }, 1000);
        break;
        
      case 'hover':
        highlightElement(targetElement as HTMLElement);
        showStepTooltip(step, targetElement as HTMLElement);
        // Simulate hover
        const hoverEvent = new MouseEvent('mouseenter', { bubbles: true });
        targetElement.dispatchEvent(hoverEvent);
        break;
        
      case 'type':
        highlightElement(targetElement as HTMLElement);
        showStepTooltip(step, targetElement as HTMLElement);
        // Focus on input element
        (targetElement as HTMLInputElement).focus();
        break;
        
      case 'wait':
        showStepTooltip(step);
        break;
        
      case 'scroll':
        targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showStepTooltip(step, targetElement as HTMLElement);
        break;
    }

    // Auto-advance after duration
    stepTimerRef.current = setTimeout(() => {
      if (step.validation) {
        if (validateStep(step)) {
          completeStep(step);
        } else {
          // Retry or show help
          showStepHelp(step);
        }
      } else {
        completeStep(step);
      }
    }, step.duration * 1000);
  };

  const highlightElement = (element: HTMLElement) => {
    if (!element) return;
    
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    // Add highlight to target element
    element.classList.add('tutorial-highlight');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add pulsing effect
    element.style.animation = 'tutorial-pulse 2s infinite';
  };

  const showStepTooltip = (step: TutorialStep, targetElement?: HTMLElement) => {
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const position = calculateTooltipPosition(rect, step.position);
      setTooltipPosition(position);
    } else {
      // Center of screen for non-targeted steps
      setTooltipPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
      });
    }
    
    setShowTooltip(true);
  };

  const calculateTooltipPosition = (targetRect: DOMRect, position: string) => {
    const offset = 20;
    
    switch (position) {
      case 'top':
        return { x: targetRect.left + targetRect.width / 2, y: targetRect.top - offset };
      case 'bottom':
        return { x: targetRect.left + targetRect.width / 2, y: targetRect.bottom + offset };
      case 'left':
        return { x: targetRect.left - offset, y: targetRect.top + targetRect.height / 2 };
      case 'right':
        return { x: targetRect.right + offset, y: targetRect.top + targetRect.height / 2 };
      default:
        return { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };
    }
  };

  const validateStep = (step: TutorialStep): boolean => {
    if (!step.validation) return true;
    
    const { type, condition } = step.validation;
    
    switch (type) {
      case 'element_exists':
        return document.querySelector(condition) !== null;
        
      case 'text_contains':
        const [selector, text] = condition.split('|');
        const element = document.querySelector(selector);
        return element?.textContent?.includes(text) || false;
        
      case 'attribute_equals':
        const [attrSelector, attr, value] = condition.split('|');
        const attrElement = document.querySelector(attrSelector);
        return attrElement?.getAttribute(attr) === value;
        
      default:
        return true;
    }
  };

  const completeStep = (step: TutorialStep) => {
    setCompletedSteps(prev => [...prev, step.id]);
    
    onStepComplete?.(step.id, {
      tutorialId: activeTutorial?.id,
      stepId: step.id,
      duration: step.duration,
      completed: true,
      timestamp: Date.now()
    });
    
    if (currentTutorialStep < (activeTutorial?.steps.length || 0) - 1) {
      nextStep();
    } else {
      completeTutorial();
    }
  };

  const nextStep = () => {
    setShowTooltip(false);
    
    // Clear highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
      (el as HTMLElement).style.animation = '';
    });
    
    if (activeTutorial && currentTutorialStep < activeTutorial.steps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setShowTooltip(false);
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(prev => prev - 1);
    }
  };

  const completeTutorial = () => {
    if (!activeTutorial) return;
    
    setTutorialProgress(prev => ({
      ...prev,
      [activeTutorial.id]: 1
    }));
    
    onTutorialComplete?.(activeTutorial.id, {
      completedSteps: completedSteps.length,
      totalSteps: activeTutorial.steps.length,
      completionRate: completedSteps.length / activeTutorial.steps.length,
      timestamp: Date.now(),
      userSkill: userSkillLevel
    });
    
    setActiveTutorial(null);
    setIsPlaying(false);
    setShowTooltip(false);
  };

  const pauseTutorial = () => {
    setIsPlaying(false);
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
    }
  };

  const resumeTutorial = () => {
    setIsPlaying(true);
  };

  const skipTutorial = () => {
    setActiveTutorial(null);
    setIsPlaying(false);
    setShowTooltip(false);
    
    // Clear highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
      (el as HTMLElement).style.animation = '';
    });
  };

  const showStepHelp = (step: TutorialStep) => {
    // Show additional help for stuck users
    console.log('Showing help for step:', step.title);
  };

  if (!activeTutorial) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-blue/5 to-purple/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Tutoriais Interativos</h3>
                <p className="text-sm text-muted-foreground">
                  Aprenda com tutoriais guiados adaptados ao seu nível
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {availableTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  className="p-4 bg-background rounded-lg border border-border/50 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{tutorial.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{tutorial.description}</p>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">
                          {tutorial.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(tutorial.estimatedTime / 60)} min
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tutorial.steps.length} passos
                        </Badge>
                      </div>
                      
                      {tutorialProgress[tutorial.id] === 1 && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluído
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => startTutorial(tutorial)}
                      size="sm"
                      disabled={tutorialProgress[tutorial.id] === 1}
                      className="ml-4"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {tutorialProgress[tutorial.id] === 1 ? 'Revisar' : 'Iniciar'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStepData = activeTutorial.steps[currentTutorialStep];
  const progress = ((currentTutorialStep + 1) / activeTutorial.steps.length) * 100;

  return (
    <>
      {/* Tutorial Control Panel */}
      <Card className="fixed bottom-4 left-4 w-80 border-primary/20 bg-card/95 backdrop-blur-sm shadow-xl z-50">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-sm">{activeTutorial.name}</h4>
              <Badge variant="outline" className="text-xs">
                {currentTutorialStep + 1}/{activeTutorial.steps.length}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={isPlaying ? pauseTutorial : resumeTutorial}
                size="sm"
                variant="outline"
                className="h-8"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              
              <Button
                onClick={prevStep}
                size="sm"
                variant="outline"
                disabled={currentTutorialStep === 0}
                className="h-8"
              >
                <ArrowLeft className="h-3 w-3" />
              </Button>
              
              <Button
                onClick={nextStep}
                size="sm"
                variant="outline"
                disabled={currentTutorialStep === activeTutorial.steps.length - 1}
                className="h-8"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
              
              <Button
                onClick={skipTutorial}
                size="sm"
                variant="ghost"
                className="h-8 ml-auto"
              >
                <SkipForward className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Tooltip */}
      {showTooltip && currentStepData && (
        <div
          className="fixed z-50 max-w-sm p-4 bg-white rounded-lg shadow-xl border border-border/50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground mb-1">{currentStepData.title}</h4>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
            
            {currentStepData.tips.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Lightbulb className="h-3 w-3" />
                  Dicas
                </div>
                {currentStepData.tips.map((tip, index) => (
                  <p key={index} className="text-xs text-muted-foreground">• {tip}</p>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {currentStepData.action === 'click' && <Mouse className="h-3 w-3" />}
              {currentStepData.action === 'type' && <Keyboard className="h-3 w-3" />}
              {currentStepData.action === 'hover' && <Eye className="h-3 w-3" />}
              <span className="capitalize">{currentStepData.action}</span>
              {!currentStepData.optional && <span className="text-red-500">• Obrigatório</span>}
            </div>
          </div>
        </div>
      )}

      {/* CSS for tutorial highlights */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .tutorial-highlight {
            position: relative !important;
            z-index: 1000 !important;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 8px rgba(59, 130, 246, 0.2) !important;
            border-radius: 6px !important;
          }
          
          @keyframes tutorial-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
        `
      }} />
    </>
  );
}