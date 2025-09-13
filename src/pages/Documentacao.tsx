import React, { useState } from 'react';
import { ChevronRight, FileText, Zap, Shield, Target, Users, Cpu, Globe, Award, TrendingUp, Clock, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const Documentacao = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Visão Geral', icon: FileText },
    { id: 'modules', title: 'Módulos e Funcionalidades', icon: Zap },
    { id: 'technologies', title: 'Tecnologias', icon: Cpu },
    { id: 'benefits', title: 'Benefícios', icon: Target },
    { id: 'clients', title: 'Casos de Uso', icon: Users },
    { id: 'security', title: 'Segurança', icon: Shield },
    { id: 'support', title: 'Suporte', icon: Globe },
    { id: 'roadmap', title: 'Roadmap', icon: TrendingUp },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <img src="/src/assets/daton-logo.png" alt="Daton" className="h-8 w-auto" />
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">Documentação</h1>
          </div>
          <Button asChild>
            <a href="/" className="flex items-center gap-2">
              Voltar ao Site <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 shrink-0">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Navegação</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <nav className="space-y-1 p-4">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                              activeSection === section.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {section.title}
                          </button>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-12">
            {/* Visão Geral */}
            <section id="overview" className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Documentação Daton</h2>
                <p className="text-xl text-muted-foreground">
                  A plataforma ESG mais avançada do Brasil para gestão completa de sustentabilidade empresarial
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>O que é o Daton?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Daton é a plataforma ESG (Environmental, Social & Governance) mais avançada do Brasil, 
                    desenvolvida para automatizar e otimizar toda a gestão de sustentabilidade empresarial.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                      <Clock className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">70% menos tempo</div>
                        <div className="text-sm text-muted-foreground">em relatórios ESG</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">99% de precisão</div>
                        <div className="text-sm text-muted-foreground">em compliance</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                      <Zap className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-semibold">15 minutos</div>
                        <div className="text-sm text-muted-foreground">setup completo</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Módulos e Funcionalidades */}
            <section id="modules" className="space-y-6">
              <h2 className="text-3xl font-bold">Módulos e Funcionalidades</h2>
              
              <div className="grid gap-6">
                {/* GEE */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Gestão de Emissões GEE
                    </CardTitle>
                    <CardDescription>
                      Monitoramento automático e cálculo preciso de gases de efeito estufa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        'Rastreamento automático de emissões',
                        'Cálculos por Escopo 1, 2 e 3',
                        'Biblioteca de fatores atualizados',
                        'Relatórios em tempo real',
                        'Alertas de meta',
                        'Benchmarking setorial'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Compliance e Licenciamento
                    </CardTitle>
                    <CardDescription>
                      Gestão inteligente de licenças e conformidade regulatória
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        'Gestão inteligente de licenças',
                        'Alertas de vencimento automáticos',
                        'Controle de condicionantes',
                        'Dashboard de status',
                        'Histórico completo',
                        'Score de compliance'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* IA e Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-primary" />
                      Inteligência Artificial
                    </CardTitle>
                    <CardDescription>
                      IA preditiva e analytics avançado para insights acionáveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        'IA preditiva para cenários',
                        'Recomendações automáticas',
                        'Análise de riscos climáticos',
                        'Detecção de padrões',
                        'Processamento de documentos',
                        'Dashboards inteligentes'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Outros módulos em formato resumido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gestão de Resíduos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Controle completo do ciclo de vida dos resíduos, destinação inteligente e conformidade PNRS.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Relatórios ESG</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Padrões internacionais GRI, SASB, TCFD, CDP com geração automática e templates personalizáveis.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Projetos de Carbono</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Portfólio completo, validação de créditos, ROI ambiental e certificações internacionais.
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Metas e KPIs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Science-Based Targets, tracking automático, benchmarking e alertas de performance.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Tecnologias */}
            <section id="technologies" className="space-y-6">
              <h2 className="text-3xl font-bold">Tecnologias Utilizadas</h2>
              
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Frontend Moderno</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">React 18.3.1</Badge>
                        <Badge variant="secondary">TypeScript</Badge>
                        <Badge variant="secondary">Vite</Badge>
                        <Badge variant="secondary">Tailwind CSS</Badge>
                        <Badge variant="secondary">Shadcn/ui</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interface moderna, responsiva e acessível com componentes reutilizáveis.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Backend Robusto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Supabase</Badge>
                        <Badge variant="secondary">PostgreSQL</Badge>
                        <Badge variant="secondary">Edge Functions</Badge>
                        <Badge variant="secondary">RLS</Badge>
                        <Badge variant="secondary">Real-time</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Infraestrutura escalável com segurança granular e atualizações em tempo real.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Inteligência Artificial</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">OpenAI GPT-4</Badge>
                        <Badge variant="secondary">Computer Vision</Badge>
                        <Badge variant="secondary">OCR</Badge>
                        <Badge variant="secondary">Machine Learning</Badge>
                        <Badge variant="secondary">NLP</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        IA proprietária especializada em processamento de documentos e análise ESG.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Integrações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">ERPs</Badge>
                        <Badge variant="secondary">Power BI</Badge>
                        <Badge variant="secondary">APIs REST</Badge>
                        <Badge variant="secondary">Webhooks</Badge>
                        <Badge variant="secondary">Excel/CSV</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Conectividade total com sistemas existentes e ferramentas de negócio.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Benefícios */}
            <section id="benefits" className="space-y-6">
              <h2 className="text-3xl font-bold">Benefícios Comprovados</h2>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ROI e Eficiência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-primary">70%</div>
                        <div className="text-sm text-muted-foreground">Redução no tempo de relatórios ESG</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-primary">300%</div>
                        <div className="text-sm text-muted-foreground">ROI médio em eficiência operacional</div>
                      </div>
                      <div className="text-center space-y-2">
                        <div className="text-3xl font-bold text-primary">0</div>
                        <div className="text-sm text-muted-foreground">Multas com alertas inteligentes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Vantagens Competitivas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ul className="space-y-1 text-sm">
                        <li>• Compliance automatizado</li>
                        <li>• Decisões baseadas em dados</li>
                        <li>• Redução de riscos regulatórios</li>
                        <li>• Melhoria da reputação corporativa</li>
                        <li>• Preparação contínua para auditoria</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Impacto em Sustentabilidade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <ul className="space-y-1 text-sm">
                        <li>• Monitoramento preciso da pegada de carbono</li>
                        <li>• Otimização de recursos</li>
                        <li>• Implementação de economia circular</li>
                        <li>• Transparência com stakeholders</li>
                        <li>• Contribuição para ODS da ONU</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Casos de Uso e Clientes */}
            <section id="clients" className="space-y-6">
              <h2 className="text-3xl font-bold">Casos de Uso e Clientes</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Indústrias Atendidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Mercosul Energia', sector: 'Energia' },
                      { name: 'ThyssenKrupp', sector: 'Metalurgia' },
                      { name: 'Cooperlíquidos', sector: 'Agronegócio' },
                      { name: 'Gabardo', sector: 'Consultoria' },
                      { name: 'Amcham', sector: 'Organizações' },
                      { name: 'Safeweb', sector: 'Tecnologia' },
                    ].map((client, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="font-semibold text-sm">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.sector}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Depoimentos de Clientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <blockquote className="border-l-4 border-primary pl-4 italic">
                      "Reduzimos 75% do tempo em relatórios ESG, economizando R$ 2.3M anuais."
                    </blockquote>
                    <div className="text-sm text-muted-foreground">
                      — Marina Santos, Gerente de Sustentabilidade, Mercosul Energia
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <blockquote className="border-l-4 border-primary pl-4 italic">
                      "Zero multas no último ano graças aos alertas inteligentes da plataforma."
                    </blockquote>
                    <div className="text-sm text-muted-foreground">
                      — Carlos Mendes, Diretor Ambiental, ThyssenKrupp
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Segurança */}
            <section id="security" className="space-y-6">
              <h2 className="text-3xl font-bold">Segurança e Compliance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Segurança de Dados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="space-y-1 text-sm">
                      <li>• Criptografia end-to-end</li>
                      <li>• Row Level Security (RLS)</li>
                      <li>• Auditoria completa de acessos</li>
                      <li>• Backup automático</li>
                      <li>• Conformidade LGPD</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Certificações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Em Processo</Badge>
                        <span className="text-sm">ISO 27001</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Em Processo</Badge>
                        <span className="text-sm">SOC 2 Type II</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Ativo</Badge>
                        <span className="text-sm">Conformidade LGPD</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Ativo</Badge>
                        <span className="text-sm">Padrões ESG Internacionais</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Suporte */}
            <section id="support" className="space-y-6">
              <h2 className="text-3xl font-bold">Suporte e Implementação</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Processo de Implementação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-lg font-bold text-primary">1</span>
                      </div>
                      <h4 className="font-semibold">Conectar</h4>
                      <p className="text-sm text-muted-foreground">Integração com sistemas existentes</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-lg font-bold text-primary">2</span>
                      </div>
                      <h4 className="font-semibold">Monitorar</h4>
                      <p className="text-sm text-muted-foreground">IA processa dados automaticamente</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-lg font-bold text-primary">3</span>
                      </div>
                      <h4 className="font-semibold">Relatar</h4>
                      <p className="text-sm text-muted-foreground">Dashboards e recomendações</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suporte Completo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center space-y-2">
                      <Users className="h-8 w-8 text-primary mx-auto" />
                      <div className="text-sm font-semibold">Onboarding Personalizado</div>
                    </div>
                    <div className="text-center space-y-2">
                      <Globe className="h-8 w-8 text-primary mx-auto" />
                      <div className="text-sm font-semibold">Suporte 24/7</div>
                    </div>
                    <div className="text-center space-y-2">
                      <Target className="h-8 w-8 text-primary mx-auto" />
                      <div className="text-sm font-semibold">Consultoria Especializada</div>
                    </div>
                    <div className="text-center space-y-2">
                      <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                      <div className="text-sm font-semibold">Atualizações Automáticas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Roadmap */}
            <section id="roadmap" className="space-y-6">
              <h2 className="text-3xl font-bold">Roadmap e Inovações</h2>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Funcionalidades em Desenvolvimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        'Blockchain para rastreabilidade',
                        'IoT para monitoramento em tempo real',
                        'Análise de ciclo de vida (LCA)',
                        'Relatórios de biodiversidade',
                        'ESG Score automático',
                        'Mobile app nativo'
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Planos de Expansão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">2024</Badge>
                        <span className="text-sm">Expansão para mercado internacional</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">2025</Badge>
                        <span className="text-sm">Novos módulos setoriais especializados</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">2025</Badge>
                        <span className="text-sm">Marketplace de soluções ESG</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Call to Action */}
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
              <CardContent className="p-8 text-center space-y-4">
                <h3 className="text-2xl font-bold">Pronto para transformar sua gestão ESG?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Junte-se às empresas líderes que já utilizam a Daton para otimizar 
                  sua performance ambiental e garantir compliance total.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <a href="/contato" className="flex items-center gap-2">
                      Agendar Demo <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/simulador" className="flex items-center gap-2">
                      Testar Simulador <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Documentacao;