import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Search, 
  Play,
  Users,
  Leaf,
  Building,
  BarChart3,
  ArrowRight,
  CheckCircle,
  FileText,
  Video,
  Lightbulb
} from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';
import { useAuth } from '@/contexts/AuthContext';

const TUTORIAL_MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard e Visão Geral',
    icon: BarChart3,
    description: 'Aprenda a navegar e interpretar seu dashboard principal',
    tutorials: [
      { id: 'dashboard-intro', title: 'Introdução ao Dashboard', duration: '3 min', type: 'tour' },
      { id: 'kpis-overview', title: 'Entendendo os KPIs', duration: '5 min', type: 'video' },
      { id: 'dashboard-filters', title: 'Filtros e Personalizações', duration: '4 min', type: 'tour' }
    ]
  },
  {
    id: 'esg',
    title: 'Gestão ESG',
    icon: Leaf,
    description: 'Tudo sobre sustentabilidade e compliance ESG',
    tutorials: [
      { id: 'esg-basics', title: 'Fundamentos ESG', duration: '8 min', type: 'guide' },
      { id: 'emissions-tracking', title: 'Rastreamento de Emissões', duration: '6 min', type: 'tour' },
      { id: 'esg-reports', title: 'Relatórios ESG', duration: '7 min', type: 'video' }
    ]
  },
  {
    id: 'quality',
    title: 'Sistema de Qualidade',
    icon: Building,
    description: 'Processos, auditorias e gestão da qualidade',
    tutorials: [
      { id: 'quality-intro', title: 'Introdução ao Sistema', duration: '5 min', type: 'tour' },
      { id: 'audit-process', title: 'Processo de Auditoria', duration: '10 min', type: 'guide' },
      { id: 'non-conformities', title: 'Gestão de Não Conformidades', duration: '6 min', type: 'tour' }
    ]
  },
  {
    id: 'people',
    title: 'Gestão de Pessoas',
    icon: Users,
    description: 'RH, performance e desenvolvimento de equipes',
    tutorials: [
      { id: 'people-intro', title: 'Visão Geral de Pessoas', duration: '4 min', type: 'tour' },
      { id: 'performance-mgmt', title: 'Gestão de Performance', duration: '8 min', type: 'guide' },
      { id: 'training-mgmt', title: 'Gestão de Treinamentos', duration: '6 min', type: 'video' }
    ]
  }
];

const FAQ_CATEGORIES = [
  {
    title: 'Primeiros Passos',
    questions: [
      {
        q: 'Como começar a usar a plataforma?',
        a: 'Comece configurando seu perfil e empresa. Use o guia de configuração inicial para setup básico dos módulos.'
      },
      {
        q: 'Qual a diferença entre os módulos?',
        a: 'Cada módulo foca em uma área: ESG (sustentabilidade), Qualidade (processos), Pessoas (RH) e Performance (indicadores).'
      },
      {
        q: 'Como importar dados históricos?',
        a: 'Use a funcionalidade de importação em massa através de planilhas Excel ou CSV em cada módulo.'
      }
    ]
  },
  {
    title: 'Relatórios e Análises',
    questions: [
      {
        q: 'Como gerar relatórios customizados?',
        a: 'Acesse a seção de relatórios, selecione os dados desejados e use os filtros para personalizar conforme sua necessidade.'
      },
      {
        q: 'Posso agendar relatórios automáticos?',
        a: 'Sim, configure relatórios recorrentes nas configurações de cada módulo para envio automático por email.'
      }
    ]
  },
  {
    title: 'Integração e Dados',
    questions: [
      {
        q: 'Como integrar com outros sistemas?',
        a: 'A plataforma oferece APIs REST e conectores pré-configurados para sistemas ERP, CRM e outras ferramentas.'
      },
      {
        q: 'Os dados ficam seguros?',
        a: 'Sim, utilizamos criptografia de ponta e conformidade com LGPD. Todos os dados são armazenados de forma segura.'
      }
    ]
  }
];

interface UnifiedHelpCenterProps {
  trigger?: React.ReactNode;
}

export function UnifiedHelpCenter({ trigger }: UnifiedHelpCenterProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { startTour, restartOnboarding } = useTutorial();
  const { user } = useAuth();

  const filteredTutorials = TUTORIAL_MODULES.map(module => ({
    ...module,
    tutorials: module.tutorials.filter(tutorial =>
      tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(module => module.tutorials.length > 0);

  const handleStartTour = (tourId: string) => {
    startTour(tourId);
    setOpen(false);
  };

  const handleRestartOnboarding = () => {
    restartOnboarding();
    setOpen(false);
  };

  const getTutorialIcon = (type: string) => {
    switch (type) {
      case 'tour':
        return Play;
      case 'video':
        return Video;
      case 'guide':
        return FileText;
      default:
        return BookOpen;
    }
  };

  const getTutorialTypeColor = (type: string) => {
    switch (type) {
      case 'tour':
        return 'bg-blue-500';
      case 'video':
        return 'bg-green-500';
      case 'guide':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Ajuda & Tutoriais
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Central de Ajuda e Tutoriais
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar tutoriais, guias ou perguntas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="tutorials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tutorials">Tutoriais</TabsTrigger>
              <TabsTrigger value="onboarding">Configuração</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="support">Suporte</TabsTrigger>
            </TabsList>

            <TabsContent value="tutorials" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {filteredTutorials.map((module) => {
                    const Icon = module.icon;
                    return (
                      <Card key={module.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Icon className="w-5 h-5" />
                            {module.title}
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2">
                            {module.tutorials.map((tutorial) => {
                              const TutorialIcon = getTutorialIcon(tutorial.type);
                              return (
                                <div
                                  key={tutorial.id}
                                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                                  onClick={() => handleStartTour(tutorial.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded ${getTutorialTypeColor(tutorial.type)} flex items-center justify-center`}>
                                      <TutorialIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{tutorial.title}</p>
                                      <p className="text-sm text-muted-foreground">{tutorial.duration}</p>
                                    </div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="onboarding" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Configuração Inicial
                      </CardTitle>
                      <CardDescription>
                        Configure sua conta e personalize sua experiência na plataforma
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={handleRestartOnboarding}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Refazer Configuração Inicial
                      </Button>
                      
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Status da Configuração</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Perfil configurado</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Empresa cadastrada</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Módulos selecionados</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Passos Recomendados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white text-sm font-bold">1</div>
                          <div>
                            <p className="font-medium">Explore o Dashboard</p>
                            <p className="text-sm text-muted-foreground">Conheça a visão geral da plataforma</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white text-sm font-bold">2</div>
                          <div>
                            <p className="font-medium">Configure seus Módulos</p>
                            <p className="text-sm text-muted-foreground">Personalize conforme suas necessidades</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="w-8 h-8 rounded bg-purple-500 flex items-center justify-center text-white text-sm font-bold">3</div>
                          <div>
                            <p className="font-medium">Importe seus Dados</p>
                            <p className="text-sm text-muted-foreground">Adicione informações históricas</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {FAQ_CATEGORIES.map((category, categoryIndex) => (
                    <Card key={categoryIndex}>
                      <CardHeader>
                        <CardTitle>{category.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {category.questions.map((faq, faqIndex) => (
                            <div key={faqIndex} className="space-y-2">
                              <h4 className="font-medium text-sm">{faq.q}</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                              {faqIndex < category.questions.length - 1 && (
                                <div className="border-t pt-3 mt-3" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Fale Conosco
                    </CardTitle>
                    <CardDescription>
                      Nossa equipe está pronta para ajudar com suas dúvidas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Iniciar Chat Online
                    </Button>
                    
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">ou entre em contato:</p>
                      <p className="text-sm font-medium">suporte@daton.com.br</p>
                      <p className="text-sm font-medium">(11) 9999-9999</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Sistema</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usuário:</span>
                        <span>{user?.full_name || user?.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Empresa:</span>
                        <span>{user?.company?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Versão:</span>
                        <span>v2.1.0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}