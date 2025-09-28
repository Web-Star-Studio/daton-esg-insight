import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Users, Target, TrendingUp, Lightbulb } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={index} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isActive ? 'bg-primary border-primary text-primary-foreground' : 
                    isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    'border-muted-foreground/30 text-muted-foreground'}
                `}>
                  <Icon className="h-4 w-4" />
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Personalização Inteligente
            </CardTitle>
            <div className="flex justify-center">
              <Badge variant="secondary">
                Passo {currentStep + 1} de {steps.length}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between gap-4 pt-6">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={handleBack}>
                    Voltar
                  </Button>
                )}
                <Button variant="ghost" onClick={onSkip}>
                  Pular Personalização
                </Button>
              </div>
              
              <Button 
                onClick={handleNext}
                disabled={!canProceed()}
                className="min-w-32"
              >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}