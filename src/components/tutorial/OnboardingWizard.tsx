import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTutorial } from '@/contexts/TutorialContext';
import { CheckCircle, Users, Leaf, Building, BarChart3, ArrowRight, ArrowLeft, Play } from 'lucide-react';

const PROFILE_OPTIONS = [
  {
    id: 'iniciante' as const,
    title: 'Novo na Plataforma',
    description: 'Primeiro contato com gestão ESG e sustentabilidade',
    icon: Play,
    color: 'bg-blue-500',
    modules: ['Dashboard', 'Configurações Básicas', 'Primeiros Dados']
  },
  {
    id: 'esg' as const,
    title: 'Gestor ESG',
    description: 'Foco em relatórios de sustentabilidade e compliance',
    icon: Leaf,
    color: 'bg-green-500',
    modules: ['ESG Completo', 'Emissões', 'Relatórios', 'Ambiental']
  },
  {
    id: 'qualidade' as const,
    title: 'Gestor de Qualidade',
    description: 'Processos, auditorias e sistema de qualidade',
    icon: Building,
    color: 'bg-orange-500',
    modules: ['Sistema Qualidade', 'Auditorias', 'Não Conformidades', 'Documentos']
  },
  {
    id: 'rh' as const,
    title: 'Recursos Humanos',
    description: 'Gestão de pessoas, desempenho e treinamentos',
    icon: Users,
    color: 'bg-purple-500',
    modules: ['Gestão Desempenho', 'Treinamentos', 'Competências', 'Colaboradores']
  },
  {
    id: 'analista' as const,
    title: 'Analista/Técnico',
    description: 'Coleta de dados, monitoramento e análises técnicas',
    icon: BarChart3,
    color: 'bg-cyan-500',
    modules: ['Dados & Documentos', 'Análise Geral', 'Monitoramento', 'Indicadores']
  }
];

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo à Daton!',
    description: 'Sua plataforma completa para gestão ESG, qualidade e sustentabilidade'
  },
  {
    id: 'profile',
    title: 'Qual seu perfil?',
    description: 'Vamos personalizar sua experiência baseada na sua função'
  },
  {
    id: 'modules',
    title: 'Seus módulos principais',
    description: 'Estes são os módulos mais relevantes para seu perfil'
  },
  {
    id: 'setup',
    title: 'Configuração inicial',
    description: 'Algumas configurações para começar'
  }
];

export function OnboardingWizard() {
  const { isOnboardingActive, completeOnboarding, userProfile, setUserProfile } = useTutorial();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProfile, setSelectedProfile] = useState<typeof userProfile | null>(null);

  if (!isOnboardingActive) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const selectedProfileData = PROFILE_OPTIONS.find(p => p.id === selectedProfile);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (selectedProfile) {
        setUserProfile(selectedProfile);
      }
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto">
              <Leaf className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Transforme sua gestão ESG</h3>
              <p className="text-muted-foreground text-lg">
                A Daton oferece tudo que você precisa para gerenciar sustentabilidade, 
                qualidade e performance em uma única plataforma.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Card className="text-center">
                <CardContent className="pt-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">8 Módulos Integrados</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">Relatórios Automáticos</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Selecione seu perfil profissional</h3>
              <p className="text-muted-foreground">
                Isso nos ajuda a personalizar sua experiência na plataforma
              </p>
            </div>
            
            <div className="grid gap-3">
              {PROFILE_OPTIONS.map((profile) => {
                const Icon = profile.icon;
                return (
                  <Card 
                    key={profile.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedProfile === profile.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedProfile(profile.id)}
                  >
                    <CardContent className="flex items-center space-x-4 p-4">
                      <div className={`w-12 h-12 rounded-lg ${profile.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{profile.title}</h4>
                        <p className="text-sm text-muted-foreground">{profile.description}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        {selectedProfile === profile.id && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'modules':
        return (
          <div className="space-y-6">
            {selectedProfileData && (
              <>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full ${selectedProfileData.color} flex items-center justify-center mx-auto mb-4`}>
                    <selectedProfileData.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Perfeito para {selectedProfileData.title}</h3>
                  <p className="text-muted-foreground">
                    Estes são os módulos principais recomendados para seu perfil
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {selectedProfileData.modules.map((module, index) => (
                    <Card key={module} className="text-center">
                      <CardContent className="pt-4 pb-3">
                        <Badge variant="secondary" className="mb-2">
                          #{index + 1}
                        </Badge>
                        <p className="font-medium text-sm">{module}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'setup':
        return (
          <div className="text-center space-y-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold mb-2">Tudo pronto!</h3>
              <p className="text-muted-foreground">
                Sua conta está configurada. Agora você pode começar a explorar a plataforma 
                com tours guiados personalizados para seu perfil.
              </p>
            </div>
            
            <Card className="bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/20">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Próximos passos</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Explore o Dashboard principal</li>
                  <li>• Configure suas preferências</li>
                  <li>• Comece a inserir dados</li>
                  <li>• Acesse tutoriais específicos</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOnboardingActive} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{currentStepData.title}</DialogTitle>
            <Badge variant="outline">
              {currentStep + 1} de {ONBOARDING_STEPS.length}
            </Badge>
          </div>
          <Progress value={((currentStep + 1) / ONBOARDING_STEPS.length) * 100} className="w-full" />
        </DialogHeader>

        <div className="py-6">
          {renderStepContent()}
        </div>

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button 
            onClick={nextStep}
            disabled={currentStep === 1 && !selectedProfile}
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Finalizar' : 'Próximo'}
            {currentStep !== ONBOARDING_STEPS.length - 1 && (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}