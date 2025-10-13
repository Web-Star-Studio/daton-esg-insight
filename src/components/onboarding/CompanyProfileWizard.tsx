import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Building2, Users, Target, TrendingUp, Lightbulb, Info, ArrowLeft, ArrowRight } from 'lucide-react';

interface CompanyProfile {
  sector: string;
  size: string;
  goals: string[];
  maturityLevel: string;
  currentChallenges: string[];
}

interface CompanyProfileWizardProps {
  onProfileComplete: (profile: CompanyProfile) => void;
  onSkip: () => void;
}

const SECTORS = [
  { id: 'manufacturing', name: 'Indústria/Manufatura', icon: '🏭' },
  { id: 'services', name: 'Serviços', icon: '💼' },
  { id: 'retail', name: 'Varejo/Comércio', icon: '🛍️' },
  { id: 'construction', name: 'Construção', icon: '🏗️' },
  { id: 'technology', name: 'Tecnologia', icon: '💻' },
  { id: 'healthcare', name: 'Saúde', icon: '🏥' },
  { id: 'education', name: 'Educação', icon: '🎓' },
  { id: 'other', name: 'Outro', icon: '🏢' }
];

const COMPANY_SIZES = [
  { id: 'micro', name: 'Micro (até 9 funcionários)', icon: '👥' },
  { id: 'small', name: 'Pequena (10-49 funcionários)', icon: '👨‍👩‍👧‍👦' },
  { id: 'medium', name: 'Média (50-249 funcionários)', icon: '🏢' },
  { id: 'large', name: 'Grande (250+ funcionários)', icon: '🏬' }
];

const BUSINESS_GOALS = [
  { id: 'sustainability', name: 'Sustentabilidade e ESG', description: 'Relatórios, certificações ambientais' },
  { id: 'quality', name: 'Qualidade e Processos', description: 'ISO, melhoria contínua' },
  { id: 'compliance', name: 'Conformidade Regulatória', description: 'Licenças, auditorias' },
  { id: 'performance', name: 'Gestão de Desempenho', description: 'Produtividade, RH' },
  { id: 'innovation', name: 'Inovação e Crescimento', description: 'Novos produtos, mercados' },
  { id: 'cost_reduction', name: 'Redução de Custos', description: 'Eficiência operacional' }
];

const MATURITY_LEVELS = [
  { id: 'beginner', name: 'Iniciante', description: 'Começando a estruturar processos' },
  { id: 'intermediate', name: 'Intermediário', description: 'Alguns processos já estabelecidos' },
  { id: 'advanced', name: 'Avançado', description: 'Processos maduros, buscando otimização' }
];

export function CompanyProfileWizard({ onProfileComplete, onSkip }: CompanyProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<CompanyProfile>({
    sector: '',
    size: '',
    goals: [],
    maturityLevel: '',
    currentChallenges: []
  });

  const steps = [
    { title: 'Setor', icon: Building2 },
    { title: 'Tamanho', icon: Users },
    { title: 'Objetivos', icon: Target },
    { title: 'Maturidade', icon: TrendingUp }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onProfileComplete(profile);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return profile.sector !== '';
      case 1: return profile.size !== '';
      case 2: return profile.goals.length > 0;
      case 3: return profile.maturityLevel !== '';
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Qual é o setor da sua empresa?</h3>
              <p className="text-muted-foreground">
                Isso nos ajuda a personalizar as recomendações para o seu negócio
              </p>
            </div>
            
            <RadioGroup
              value={profile.sector}
              onValueChange={(value) => setProfile({ ...profile, sector: value })}
              className="grid grid-cols-2 gap-4"
            >
              {SECTORS.map((sector) => (
                <div key={sector.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={sector.id} id={sector.id} />
                  <Label 
                    htmlFor={sector.id} 
                    className="flex items-center gap-2 cursor-pointer flex-1 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <span className="text-lg">{sector.icon}</span>
                    <span className="font-medium">{sector.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Qual o tamanho da sua empresa?</h3>
              <p className="text-muted-foreground">
                Ajustamos as funcionalidades de acordo com o porte da organização
              </p>
            </div>
            
            <RadioGroup
              value={profile.size}
              onValueChange={(value) => setProfile({ ...profile, size: value })}
              className="space-y-3"
            >
              {COMPANY_SIZES.map((size) => (
                <div key={size.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={size.id} id={size.id} />
                  <Label 
                    htmlFor={size.id} 
                    className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-muted/50"
                  >
                    <span className="text-xl">{size.icon}</span>
                    <span className="font-medium">{size.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Quais são seus principais objetivos?</h3>
              <p className="text-muted-foreground">
                Selecione todas as áreas que são importantes para sua empresa
              </p>
            </div>
            
            <div className="grid gap-3">
              {BUSINESS_GOALS.map((goal) => (
                <div key={goal.id} className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/50">
                  <Checkbox
                    id={goal.id}
                    checked={profile.goals.includes(goal.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setProfile({ ...profile, goals: [...profile.goals, goal.id] });
                      } else {
                        setProfile({ ...profile, goals: profile.goals.filter(g => g !== goal.id) });
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor={goal.id} className="font-medium cursor-pointer">
                      {goal.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {goal.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Qual o nível de maturidade da sua gestão?</h3>
              <p className="text-muted-foreground">
                Isso determina a complexidade inicial das configurações
              </p>
            </div>
            
            <RadioGroup
              value={profile.maturityLevel}
              onValueChange={(value) => setProfile({ ...profile, maturityLevel: value })}
              className="space-y-3"
            >
              {MATURITY_LEVELS.map((level) => (
                <div key={level.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={level.id} id={level.id} />
                  <Label 
                    htmlFor={level.id} 
                    className="flex flex-col gap-1 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-muted/50"
                  >
                    <span className="font-medium">{level.name}</span>
                    <span className="text-sm text-muted-foreground">{level.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 animate-fade-in">
        <div className="w-full max-w-2xl space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between mb-8 px-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 cursor-help hover-scale
                        ${isActive ? 'bg-gradient-to-br from-primary to-primary/90 border-primary text-primary-foreground shadow-lg shadow-primary/30' : 
                          isCompleted ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 text-white shadow-md' : 
                          'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50'}
                      `}>
                        <Icon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-12 sm:w-16 h-1 mx-2 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-muted-foreground/20'
                        }`} />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{step.title} {isCompleted ? '✓' : isActive ? '(atual)' : ''}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          <Card className="shadow-2xl border-0 bg-gradient-to-br from-card via-card/95 to-card/90 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-6 bg-gradient-to-b from-muted/10 to-transparent">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Personalização Inteligente
            </CardTitle>
            <div className="flex justify-center mt-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-secondary to-secondary/80">
                Passo {currentStep + 1} de {steps.length}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {renderStep()}
            
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-border/20">
              <div className="flex flex-col sm:flex-row gap-2">
                {currentStep > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={handleBack} className="hover-scale group">
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Voltar para o passo anterior</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" onClick={onSkip} className="hover-scale">
                      Pular Personalização
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configurar manualmente depois</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="min-w-full sm:min-w-40 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary hover:via-primary/95 hover:to-primary/85 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all hover-scale group"
                  >
                    <span>{currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{canProceed() ? 'Avançar para o próximo passo' : 'Selecione uma opção para continuar'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Helper Text */}
        <div className="text-center animate-fade-in px-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30">
            <Info className="h-4 w-4 text-primary" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Essas configurações ajudam a personalizar sua experiência
            </p>
          </div>
        </div>
      </div>
      </div>
    </TooltipProvider>
  );
}