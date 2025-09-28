import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTutorial } from '@/contexts/TutorialContext';
import { 
  MessageCircle, 
  X, 
  Lightbulb, 
  Play, 
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const CONTEXTUAL_TIPS = {
  '/': [
    'Bem-vindo! Use o Dashboard para ter uma visão geral de todas as suas métricas.',
    'Dica: Configure primeiro sua empresa nas configurações para personalizar a experiência.'
  ],
  '/gestao-desempenho': [
    'No módulo de Desempenho, você pode criar ciclos de avaliação e acompanhar metas.',
    'Dica: Comece criando um ciclo de avaliação e depois adicione colaboradores.'
  ],
  '/emissoes': [
    'O módulo de Emissões permite calcular e monitorar gases de efeito estufa.',
    'Dica: Configure primeiro suas fontes de emissão para começar a coletar dados.'
  ],
  '/qualidade': [
    'Gerencie processos, auditorias e não conformidades no Sistema de Qualidade.',
    'Dica: Comece mapeando seus processos principais.'
  ]
};

const QUICK_ACTIONS = [
  {
    id: 'dashboard-tour',
    title: 'Tour pelo Dashboard',
    description: 'Conheça a interface principal',
    icon: Play,
    action: 'dashboard-intro'
  },
  {
    id: 'help-center',
    title: 'Centro de Ajuda',
    description: 'Tutoriais e documentação',
    icon: HelpCircle,
    action: 'help-center'
  },
  {
    id: 'profile-setup',
    title: 'Configurar Perfil',
    description: 'Personalize sua experiência',
    icon: Sparkles,
    action: 'profile-setup'
  }
];

export function TutorialAssistant() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<string>('');
  const [hasSeenToday, setHasSeenToday] = useState(false);
  const { startTour, showHelpCenter, userProfile } = useTutorial();

  useEffect(() => {
    // Verificar se já viu o assistente hoje
    const lastSeen = localStorage.getItem('tutorial_assistant_last_seen');
    const today = new Date().toDateString();
    
    if (lastSeen !== today) {
      setTimeout(() => {
        setIsVisible(true);
        setCurrentTip(getContextualTip());
      }, 3000); // Mostrar após 3 segundos
    } else {
      setHasSeenToday(true);
    }
  }, []);

  useEffect(() => {
    // Atualizar dica quando a rota mudar
    const tip = getContextualTip();
    if (tip !== currentTip) {
      setCurrentTip(tip);
    }
  }, [currentTip]);

  const getContextualTip = () => {
    const currentPath = window.location.pathname;
    const tips = CONTEXTUAL_TIPS[currentPath as keyof typeof CONTEXTUAL_TIPS] || CONTEXTUAL_TIPS['/'];
    return tips[Math.floor(Math.random() * tips.length)];
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('tutorial_assistant_last_seen', new Date().toDateString());
    setHasSeenToday(true);
  };

  const handleAction = (actionId: string) => {
    switch (actionId) {
      case 'help-center':
        showHelpCenter();
        break;
      case 'profile-setup':
        // Implementar configuração de perfil
        break;
      default:
        startTour(actionId);
    }
    handleDismiss();
  };

  if (!isVisible && hasSeenToday) {
    // Botão flutuante para reabrir
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-30 rounded-full w-12 h-12 shadow-lg"
        size="sm"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
    );
  }

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-6 right-6 z-40 w-80 shadow-xl border-primary/20 bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm">Assistente Daton</div>
              <Badge variant="secondary" className="text-xs">
                {userProfile === 'iniciante' ? 'Novo usuário' : `Perfil: ${userProfile}`}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Dica contextual */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{currentTip}</p>
            </div>
          </div>

          {/* Ações rápidas */}
          <div>
            <h4 className="font-medium text-sm mb-2">Ações Rápidas</h4>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(action.action)}
                    className="w-full justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <div className="text-left">
                        <div className="font-medium text-xs">{action.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground"
            >
              Não mostrar mais hoje
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}