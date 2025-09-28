import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  Video, 
  FileText, 
  MessageCircle,
  Leaf,
  Building,
  Users,
  BarChart3,
  Lightbulb,
  Play,
  CheckCircle
} from 'lucide-react';

const TUTORIAL_MODULES = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    icon: BarChart3,
    description: 'Visão geral da plataforma e métricas principais',
    tutorials: [
      { id: 'dash-intro', title: 'Navegação no Dashboard', duration: '5 min', type: 'video' },
      { id: 'dash-widgets', title: 'Configurando Widgets', duration: '3 min', type: 'guide' },
    ]
  },
  {
    id: 'emissions',
    title: 'Gestão de Emissões',
    icon: Leaf,
    description: 'Monitoramento e cálculo de emissões de GEE',
    tutorials: [
      { id: 'em-setup', title: 'Configuração Inicial', duration: '8 min', type: 'video' },
      { id: 'em-calc', title: 'Metodologias de Cálculo', duration: '12 min', type: 'guide' },
      { id: 'em-report', title: 'Relatórios de Emissões', duration: '6 min', type: 'video' },
    ]
  },
  {
    id: 'quality',
    title: 'Sistema de Qualidade',
    icon: Building,
    description: 'Processos, auditorias e não conformidades',
    tutorials: [
      { id: 'qa-process', title: 'Mapeamento de Processos', duration: '10 min', type: 'guide' },
      { id: 'qa-audit', title: 'Planejamento de Auditorias', duration: '7 min', type: 'video' },
    ]
  },
  {
    id: 'performance',
    title: 'Gestão de Desempenho',
    icon: Users,
    description: 'Avaliações, metas e desenvolvimento',
    tutorials: [
      { id: 'perf-eval', title: 'Ciclos de Avaliação', duration: '9 min', type: 'video' },
      { id: 'perf-goals', title: 'Definindo Metas', duration: '5 min', type: 'guide' },
    ]
  }
];

const FAQ_CATEGORIES = [
  {
    title: 'Primeiros Passos',
    items: [
      { q: 'Como configurar minha empresa na plataforma?', a: 'Acesse Configurações > Empresa e preencha os dados básicos...' },
      { q: 'Onde encontro os relatórios?', a: 'Os relatórios estão disponíveis no módulo Relatórios no menu lateral...' },
    ]
  },
  {
    title: 'Emissões e ESG',
    items: [
      { q: 'Quais metodologias de cálculo são suportadas?', a: 'Suportamos GHG Protocol, ISO 14064, ABNT NBR ISO...' },
      { q: 'Como importar dados de consumo?', a: 'Use o módulo Dados & Documentos para importar planilhas...' },
    ]
  },
  {
    title: 'Sistema de Qualidade',
    items: [
      { q: 'Como criar um processo no sistema?', a: 'Acesse Sistema Qualidade > Processos e clique em Novo Processo...' },
      { q: 'Posso integrar com normas ISO?', a: 'Sim, temos templates para ISO 9001, 14001, 45001...' },
    ]
  }
];

const GLOSSARY_TERMS = [
  { term: 'GEE', definition: 'Gases de Efeito Estufa - gases que absorvem radiação infravermelha', category: 'Ambiental' },
  { term: 'Escopo 1', definition: 'Emissões diretas de fontes próprias ou controladas pela empresa', category: 'Emissões' },
  { term: 'ISO 14001', definition: 'Norma internacional para sistemas de gestão ambiental', category: 'Qualidade' },
  { term: 'KPI', definition: 'Indicador-Chave de Performance', category: 'Gestão' },
  { term: 'ESG', definition: 'Environmental, Social and Governance - critérios de sustentabilidade', category: 'Sustentabilidade' },
];

interface HelpCenterProps {
  trigger?: React.ReactNode;
}

export function HelpCenter({ trigger }: HelpCenterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const filteredModules = TUTORIAL_MODULES.filter(module =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGlossary = GLOSSARY_TERMS.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <HelpCircle className="w-4 h-4 mr-2" />
      Ajuda
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Centro de Ajuda Daton
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar tutoriais, FAQ, glossário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="tutorials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tutorials">Tutoriais</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="glossary">Glossário</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
            </TabsList>

            <TabsContent value="tutorials" className="mt-4">
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{module.title}</CardTitle>
                              <CardDescription className="text-xs">
                                {module.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {module.tutorials.map((tutorial) => (
                              <div key={tutorial.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  {tutorial.type === 'video' ? (
                                    <Video className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <FileText className="w-4 h-4 text-green-500" />
                                  )}
                                  <span className="text-sm font-medium">{tutorial.title}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {tutorial.duration}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="faq" className="mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {FAQ_CATEGORIES.map((category, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{category.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {category.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="border-l-2 border-primary/20 pl-4">
                              <h4 className="font-medium text-sm mb-1">{item.q}</h4>
                              <p className="text-sm text-muted-foreground">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="glossary" className="mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {filteredGlossary.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.term}</h4>
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{item.definition}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="contact" className="mt-4">
              <div className="text-center space-y-4">
                <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto" />
                <div>
                  <h3 className="font-semibold mb-2">Precisa de mais ajuda?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nossa equipe de suporte está pronta para ajudar você
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Chat Online</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Segunda a sexta, 9h às 18h
                      </p>
                      <Button size="sm" className="w-full">
                        Iniciar Chat
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <FileText className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <h4 className="font-medium mb-1">Documentação</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Guias completos e API
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Acessar Docs
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}