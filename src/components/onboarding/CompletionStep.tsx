import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, Rocket, ArrowRight, 
  BarChart3, FileText, Users, Target,
  BookOpen, Calendar, Settings
} from "lucide-react";

interface CompletionStepProps {
  selectedModules: string[];
  moduleConfigurations: any;
  onStartUsingPlatform: () => void;
  onTakeTour: () => void;
}

const MODULE_INFO = {
  inventario_gee: {
    name: 'Inventário GEE',
    icon: <BarChart3 className="h-4 w-4" />,
    nextSteps: ['Cadastrar fontes de emissão', 'Inserir dados de atividade', 'Gerar primeiro relatório']
  },
  gestao_licencas: {
    name: 'Gestão de Licenças',
    icon: <FileText className="h-4 w-4" />,
    nextSteps: ['Cadastrar licenças existentes', 'Configurar alertas', 'Upload de documentos']
  },
  gestao_desempenho: {
    name: 'Gestão de Desempenho',
    icon: <Users className="h-4 w-4" />,
    nextSteps: ['Cadastrar colaboradores', 'Definir competências', 'Configurar primeiro ciclo']
  },
  sistema_qualidade: {
    name: 'Sistema de Qualidade',
    icon: <Target className="h-4 w-4" />,
    nextSteps: ['Mapear processos', 'Configurar não conformidades', 'Definir indicadores']
  }
};

const QUICK_ACTIONS = [
  {
    title: 'Tour Guiado',
    description: 'Conheça todas as funcionalidades com um tour interativo',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'tour',
    variant: 'outline' as const
  },
  {
    title: 'Centro de Ajuda',
    description: 'Acesse tutoriais e documentação completa',
    icon: <Settings className="h-5 w-5" />,
    action: 'help',
    variant: 'outline' as const
  },
  {
    title: 'Agendar Treinamento',
    description: 'Agende uma sessão personalizada com nossa equipe',
    icon: <Calendar className="h-5 w-5" />,
    action: 'schedule',
    variant: 'outline' as const
  }
];

export function CompletionStep({ 
  selectedModules, 
  moduleConfigurations, 
  onStartUsingPlatform, 
  onTakeTour 
}: CompletionStepProps) {
  
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'tour':
        onTakeTour();
        break;
      case 'help':
        // Navigate to help center
        console.log('Opening help center');
        break;
      case 'schedule':
        // Open scheduling interface or external link
        console.log('Opening scheduling');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              🎉 Configuração Concluída!
            </CardTitle>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Parabéns! Sua plataforma Daton está configurada e pronta para uso. 
              Você agora pode começar a gerenciar suas iniciativas ESG de forma eficiente.
            </p>
          </CardHeader>
        </Card>

        {/* Configuration Summary */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Resumo da Configuração
            </CardTitle>
            <p className="text-muted-foreground">
              Aqui está o que foi configurado para sua empresa
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Módulos Selecionados:</span>
              <Badge variant="secondary" className="px-3 py-1">
                {selectedModules.length} módulo(s)
              </Badge>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {selectedModules.map((moduleId) => {
                const module = MODULE_INFO[moduleId as keyof typeof MODULE_INFO];
                
                return (
                  <div
                    key={moduleId}
                    className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3"
                  >
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {module.icon}
                      {module.name}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Próximos passos recomendados:
                      </p>
                      <ul className="space-y-1">
                        {module.nextSteps.map((step, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle>Como deseja continuar?</CardTitle>
            <p className="text-muted-foreground">
              Escolha uma das opções abaixo para começar sua jornada
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              {QUICK_ACTIONS.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  className="h-auto p-4 flex flex-col items-start space-y-2 text-left"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {action.icon}
                    <span className="font-medium">{action.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-normal">
                    {action.description}
                  </span>
                </Button>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                size="lg" 
                onClick={onTakeTour}
                variant="outline"
                className="flex-1 max-w-64"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Fazer Tour Guiado
              </Button>
              
              <Button 
                size="lg" 
                onClick={onStartUsingPlatform}
                className="flex-1 max-w-64"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Ir para Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="border-border/30 bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-foreground">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                Nossa equipe de suporte está disponível para ajudar você a aproveitar ao máximo a plataforma. 
                Acesse nosso centro de ajuda ou entre em contato diretamente conosco.
              </p>
              
              <div className="flex justify-center gap-4 text-sm">
                <button className="text-primary hover:underline">
                  Centro de Ajuda
                </button>
                <span className="text-muted-foreground">•</span>
                <button className="text-primary hover:underline">
                  Contato
                </button>
                <span className="text-muted-foreground">•</span>
                <button className="text-primary hover:underline">
                  Documentação
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}