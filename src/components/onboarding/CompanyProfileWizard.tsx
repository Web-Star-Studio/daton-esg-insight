import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';

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
  { id: 'manufacturing', name: 'Indústria/Manufatura' },
  { id: 'services', name: 'Serviços' },
  { id: 'retail', name: 'Varejo/Comércio' },
  { id: 'construction', name: 'Construção' },
  { id: 'technology', name: 'Tecnologia' },
  { id: 'healthcare', name: 'Saúde' },
  { id: 'education', name: 'Educação' },
  { id: 'other', name: 'Outro' }
];

const COMPANY_SIZES = [
  { id: 'micro', name: 'Até 9 pessoas' },
  { id: 'small', name: '10-49 pessoas' },
  { id: 'medium', name: '50-249 pessoas' },
  { id: 'large', name: '250+ pessoas' }
];

const BUSINESS_GOALS = [
  { id: 'sustainability', name: 'Sustentabilidade e ESG' },
  { id: 'quality', name: 'Qualidade e Processos' },
  { id: 'compliance', name: 'Conformidade Regulatória' },
  { id: 'performance', name: 'Gestão de Desempenho' },
  { id: 'innovation', name: 'Inovação e Crescimento' },
  { id: 'cost_reduction', name: 'Redução de Custos' }
];

const MATURITY_LEVELS = [
  { id: 'beginner', name: 'Iniciante' },
  { id: 'intermediate', name: 'Intermediário' },
  { id: 'advanced', name: 'Avançado' }
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

  const steps = ['Setor', 'Tamanho', 'Objetivos', 'Maturidade'];

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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Qual é o setor?</h3>
            
            <RadioGroup
              value={profile.sector}
              onValueChange={(value) => setProfile({ ...profile, sector: value })}
              className="space-y-2"
            >
              {SECTORS.map((sector) => (
                <div key={sector.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={sector.id} id={sector.id} />
                  <Label htmlFor={sector.id} className="cursor-pointer">
                    {sector.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Qual o tamanho?</h3>
            
            <RadioGroup
              value={profile.size}
              onValueChange={(value) => setProfile({ ...profile, size: value })}
              className="space-y-2"
            >
              {COMPANY_SIZES.map((size) => (
                <div key={size.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={size.id} id={size.id} />
                  <Label htmlFor={size.id} className="cursor-pointer">
                    {size.name}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Quais são os objetivos?</h3>
            
            <div className="space-y-2">
              {BUSINESS_GOALS.map((goal) => (
                <div key={goal.id} className="flex items-center space-x-3">
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
                  <Label htmlFor={goal.id} className="cursor-pointer">
                    {goal.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Qual o nível de maturidade?</h3>
            
            <RadioGroup
              value={profile.maturityLevel}
              onValueChange={(value) => setProfile({ ...profile, maturityLevel: value })}
              className="space-y-2"
            >
              {MATURITY_LEVELS.map((level) => (
                <div key={level.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={level.id} id={level.id} />
                  <Label htmlFor={level.id} className="cursor-pointer">
                    {level.name}
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
    <Card className="w-full max-w-md">
      <CardContent className="p-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Perfil da Empresa {currentStep + 1}/{steps.length}
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-4">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
            <Button variant="ghost" onClick={onSkip} size="sm">
              Pular
            </Button>
          </div>
          <Button 
            onClick={handleNext}
            disabled={!canProceed()}
            size="sm"
          >
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Avançar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}