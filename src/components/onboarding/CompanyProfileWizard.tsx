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
  { id: 'agro', name: 'Agronegócio' },
  { id: 'food_beverage', name: 'Alimentos e Bebidas' },
  { id: 'mining', name: 'Mineração' },
  { id: 'oil_gas', name: 'Óleo e Gás' },
  { id: 'energy', name: 'Energia' },
  { id: 'chemical', name: 'Químico e Petroquímico' },
  { id: 'pulp_paper', name: 'Papel e Celulose' },
  { id: 'steel', name: 'Siderurgia' },
  { id: 'logistics', name: 'Logística' },
  { id: 'financial', name: 'Financeiro' },
  { id: 'telecom', name: 'Telecom' },
  { id: 'public', name: 'Setor Público' },
  { id: 'pharma_cosmetics', name: 'Farmacêutico e Cosméticos' },
  { id: 'automotive', name: 'Automotivo' },
  { id: 'technology', name: 'Tecnologia' },
  { id: 'consumer_goods', name: 'Bens de Consumo' },
  { id: 'utilities', name: 'Saneamento e Utilidades' },
  { id: 'healthcare', name: 'Saúde' },
  { id: 'education', name: 'Educação' },
  { id: 'retail', name: 'Varejo/Comércio' },
  { id: 'construction', name: 'Construção' },
  { id: 'services', name: 'Serviços Profissionais' },
  { id: 'other', name: 'Outro' }
];

const COMPANY_SIZES = [
  { id: 'micro', name: 'Até 9 pessoas' },
  { id: 'small', name: '10-49 pessoas' },
  { id: 'medium', name: '50-249 pessoas' },
  { id: 'large', name: '250-999 pessoas' },
  { id: 'xlarge', name: '1000-4999 pessoas' },
  { id: 'enterprise', name: '5000+ pessoas' }
];

const BUSINESS_GOALS = [
  { id: 'emissions_reduction', name: 'Redução de Emissões' },
  { id: 'environmental_compliance', name: 'Conformidade Ambiental' },
  { id: 'health_safety', name: 'Saúde e Segurança' },
  { id: 'energy_efficiency', name: 'Eficiência Energética' },
  { id: 'water_management', name: 'Gestão de Água' },
  { id: 'waste_reduction', name: 'Redução de Resíduos' },
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
            <h3 className="text-lg font-medium">Qual o setor?</h3>
            <div className="space-y-2">
              {SECTORS.map((sector) => (
                <label
                  key={sector.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="sector"
                    value={sector.id}
                    checked={profile.sector === sector.id}
                    onChange={(e) => setProfile({ ...profile, sector: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{sector.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Qual o tamanho?</h3>
            <div className="space-y-2">
              {COMPANY_SIZES.map((size) => (
                <label
                  key={size.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="size"
                    value={size.id}
                    checked={profile.size === size.id}
                    onChange={(e) => setProfile({ ...profile, size: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{size.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Objetivos principais?</h3>
              <p className="text-xs text-muted-foreground">Selecione os que se aplicam</p>
            </div>
            <div className="space-y-2">
              {BUSINESS_GOALS.map((goal) => (
                <label
                  key={goal.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={profile.goals.includes(goal.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProfile({ ...profile, goals: [...profile.goals, goal.id] });
                      } else {
                        setProfile({ ...profile, goals: profile.goals.filter(g => g !== goal.id) });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{goal.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Nível de maturidade ESG?</h3>
            <div className="space-y-2">
              {MATURITY_LEVELS.map((level) => (
                <label
                  key={level.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="maturity"
                    value={level.id}
                    checked={profile.maturityLevel === level.id}
                    onChange={(e) => setProfile({ ...profile, maturityLevel: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{level.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Etapa {currentStep + 1} de {steps.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {renderStep()}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            onClick={handleBack}
            variant="outline"
            className="flex-1 h-11"
          >
            Voltar
          </Button>
        )}
        <Button
          onClick={currentStep === steps.length - 1 ? onProfileComplete.bind(null, profile) : handleNext}
          disabled={!canProceed()}
          className="flex-1 h-11"
        >
          {currentStep === steps.length - 1 ? 'Concluir' : 'Avançar'}
        </Button>
      </div>
    </div>
  );
}