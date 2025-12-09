import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Shield, Recycle, Leaf, Brain, FileText, TrendingUp, Database, Zap,
  Users, Target, Award, Building2, CheckCircle2, Calendar, Clock,
  Search, Upload, Settings, Map, Briefcase, TreePine, Gauge, GraduationCap,
  UserCheck, BookOpen, Clipboard, AlertTriangle, Activity
} from "lucide-react";
import datonLogo from "@/assets/daton-logo-header.png";

const Funcionalidades = () => {
  const featureCategories = [
    {
      category: "ESG & Sustentabilidade",
      description: "Módulos essenciais para gestão ESG completa e sustentabilidade corporativa",
      features: [
        {
          icon: BarChart3,
          title: "Gestão de Emissões GEE",
          description: "Monitore e controle suas emissões de gases de efeito estufa com precisão científica",
          items: [
            "Cálculo automático por escopos 1, 2 e 3",
            "Fatores de emissão atualizados",
            "Monitoramento em tempo real",
            "Relatórios de inventário GEE"
          ]
        },
        {
          icon: Shield,
          title: "Licenciamento",
          description: "Mantenha conformidade regulatória com acompanhamento inteligente de licenças",
          items: [
            "Controle de prazos e renovações",
            "Alertas automáticas de vencimento",
            "Histórico completo de documentos",
            "Dashboard de conformidade"
          ]
        },
        {
          icon: Recycle,
          title: "Gestão de Resíduos",
          description: "Otimize sua gestão de resíduos com rastreamento completo e economia circular",
          items: [
            "Rastreamento por tipo e destino",
            "Indicadores de circularidade",
            "Controle de fornecedores",
            "Relatórios de destinação"
          ]
        },
        {
          icon: Leaf,
          title: "Projetos de Carbono",
          description: "Gerencie projetos de compensação e créditos de carbono com transparência",
          items: [
            "Portfólio de projetos",
            "Validação de créditos",
            "ROI ambiental",
            "Certificações internacionais"
          ]
        },
        {
          icon: Target,
          title: "Metas de Sustentabilidade",
          description: "Defina e acompanhe metas ESG alinhadas aos ODS",
          items: [
            "Metas SMART definidas",
            "Acompanhamento de progresso",
            "Alinhamento com ODS",
            "Relatórios de performance"
          ]
        },
        {
          icon: Users,
          title: "Gestão de Stakeholders",
          description: "Gerencie relacionamento com partes interessadas",
          items: [
            "Mapeamento de stakeholders",
            "Matriz de materialidade",
            "Planos de engajamento",
            "Feedback e consultas"
          ]
        }
      ]
    },
    {
      category: "Qualidade & Processos",
      description: "Sistema de gestão da qualidade e melhoria contínua dos processos",
      features: [
        {
          icon: Award,
          title: "Sistema de Qualidade",
          description: "SGQ completo com conformidade ISO 9001, 14001, 45001 e outras normas",
          items: [
            "Gestão de documentos ISO",
            "Controle de processos",
            "Auditorias internas",
            "Melhoria contínua"
          ]
        },
        {
          icon: AlertTriangle,
          title: "Gestão de Riscos",
          description: "Identifique, avalie e trate riscos operacionais e estratégicos",
          items: [
            "Matriz de riscos",
            "Avaliação quantitativa",
            "Planos de tratamento",
            "Monitoramento contínuo"
          ]
        },
        {
          icon: CheckCircle2,
          title: "Não Conformidades",
          description: "Controle completo de não conformidades e ações corretivas",
          items: [
            "Registro e classificação",
            "Workflow de aprovação",
            "Planos de ação",
            "Análise de tendências"
          ]
        },
        {
          icon: Search,
          title: "Auditorias",
          description: "Planeje e execute auditorias internas com eficiência",
          items: [
            "Cronograma de auditorias",
            "Checklists personalizados",
            "Relatórios automáticos",
            "Follow-up de achados"
          ]
        },
        {
          icon: Activity,
          title: "Indicadores de Performance",
          description: "Monitore KPIs de qualidade e desempenho operacional",
          items: [
            "Dashboards em tempo real",
            "Metas e limites de controle",
            "Alertas automáticos",
            "Análise estatística"
          ]
        }
      ]
    },
    {
      category: "Pessoas & RH",
      description: "Gestão de pessoas e desenvolvimento organizacional completo",
      features: [
        {
          icon: Users,
          title: "Gestão de Desempenho",
          description: "Avalie e desenvolva colaboradores com ciclos estruturados",
          items: [
            "Ciclos de avaliação 360°",
            "Matriz de competências",
            "PDI personalizado",
            "Feedback contínuo"
          ]
        },
        {
          icon: GraduationCap,
          title: "Treinamentos",
          description: "Capacite sua equipe com trilhas de aprendizado personalizadas",
          items: [
            "Trilhas de desenvolvimento",
            "Controle de certificações",
            "ROI de treinamentos",
            "Avaliações de eficácia"
          ]
        },
        {
          icon: TrendingUp,
          title: "Planos de Carreira",
          description: "Estruture o crescimento profissional dos colaboradores",
          items: [
            "Mapeamento de carreiras",
            "Sucessão de cargos",
            "Gaps de competência",
            "Planos de desenvolvimento"
          ]
        },
        {
          icon: UserCheck,
          title: "Recrutamento & Seleção",
          description: "Gerencie processos seletivos de forma eficiente",
          items: [
            "Banco de talentos",
            "Entrevistas estruturadas",
            "Avaliação de fit cultural",
            "Onboarding automatizado"
          ]
        },
        {
          icon: Clock,
          title: "Controle de Ponto",
          description: "Monitore jornada de trabalho e horas extras",
          items: [
            "Registro biométrico/digital",
            "Controle de absenteísmo",
            "Relatórios de produtividade",
            "Integração com folha"
          ]
        }
      ]
    },
    {
      category: "Dados & Documentos",
      description: "Gestão inteligente de informações e documentos corporativos",
      features: [
        {
          icon: FileText,
          title: "Gestão Documental",
          description: "Organize e controle documentos com versionamento inteligente",
          items: [
            "Controle de versões",
            "Workflow de aprovações",
            "Pesquisa avançada",
            "Backup automático"
          ]
        },
        {
          icon: Upload,
          title: "Formulários Dinâmicos",
          description: "Crie formulários personalizados para coleta de dados",
          items: [
            "Designer visual",
            "Validações automáticas",
            "Integração com base de dados",
            "Relatórios customizados"
          ]
        },
        {
          icon: Brain,
          title: "IA para Dados",
          description: "Extraia informações automaticamente de documentos",
          items: [
            "OCR inteligente",
            "Extração de dados",
            "Classificação automática",
            "Insights preditivos"
          ]
        },
        {
          icon: Clipboard,
          title: "Compliance",
          description: "Assegure conformidade com regulamentações",
          items: [
            "Checklist de conformidade",
            "Monitoramento regulatório",
            "Alertas de mudanças",
            "Relatórios de auditoria"
          ]
        }
      ]
    },
    {
      category: "Estratégia & Governança",
      description: "Ferramentas para gestão estratégica e governança corporativa",
      features: [
        {
          icon: Target,
          title: "Balanced Scorecard",
          description: "Implemente BSC para alinhamento estratégico organizacional",
          items: [
            "4 perspectivas do BSC",
            "Mapas estratégicos",
            "Indicadores balanceados",
            "Cascateamento de metas"
          ]
        },
        {
          icon: TrendingUp,
          title: "OKRs",
          description: "Gerencie objetivos e resultados-chave da organização",
          items: [
            "Objetivos SMART",
            "Key Results mensuráveis",
            "Check-ins regulares",
            "Alinhamento estratégico"
          ]
        },
        {
          icon: Building2,
          title: "Governança Corporativa",
          description: "Estruture conselhos e comitês de governança",
          items: [
            "Gestão de conselhos",
            "Atas e deliberações",
            "Políticas corporativas",
            "Compliance governance"
          ]
        },
        {
          icon: Briefcase,
          title: "Gestão de Projetos",
          description: "Gerencie projetos estratégicos e iniciativas",
          items: [
            "Cronogramas detalhados",
            "Controle de recursos",
            "Relatórios de progresso",
            "Gestão de riscos"
          ]
        }
      ]
    }
  ];

  const integrations = [
    {
      icon: TrendingUp,
      title: "ERPs",
      description: "SAP, Oracle, Microsoft Dynamics"
    },
    {
      icon: Database,
      title: "Relatórios",
      description: "Power BI, Tableau, Excel"
    },
    {
      icon: Zap,
      title: "APIs",
      description: "REST APIs e webhooks"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src={datonLogo} alt="Daton" className="h-8" />
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/funcionalidades" className="text-primary font-medium">
              Funcionalidades
            </Link>
            <Link to="/contato" className="text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </Link>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
              Fazer Login
            </Link>
            <Link to="/simulador">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Simulador Gratuito
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Funcionalidades <span className="text-primary">Completas</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Descubra como nossa plataforma oferece todas as ferramentas necessárias para
            transformar sua gestão ESG em vantagem competitiva
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Solicite uma demonstração
          </Button>
        </div>
      </section>

      {/* Features Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {featureCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-20">
              {/* Category Header */}
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{category.category}</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  {category.description}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {category.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{feature.description}</p>
                        <ul className="space-y-1.5">
                          {feature.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start space-x-2 text-xs">
                              <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Separator */}
              {categoryIndex < featureCategories.length - 1 && (
                <div className="mt-16 border-t border-border/50" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher o Daton?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Mais de 30 módulos integrados em uma única plataforma para transformar sua gestão ESG
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IA Integrada</h3>
              <p className="text-sm text-muted-foreground">Insights automáticos e recomendações personalizadas</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dados Centralizados</h3>
              <p className="text-sm text-muted-foreground">Todas as informações em um só lugar</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Relatórios Automáticos</h3>
              <p className="text-sm text-muted-foreground">GRI, SASB, CDP e outros padrões</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Integração Fácil</h3>
              <p className="text-sm text-muted-foreground">APIs e conectores para seus sistemas</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para experimentar?</h2>
          <p className="text-lg mb-8 opacity-90">
            Veja todas essas funcionalidades em ação com uma demonstração personalizada
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Agendar demonstração
            </Button>
            <Link to="/simulador">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Testar simulador
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={datonLogo} alt="Daton" className="h-6" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Plataforma completa para gestão ESG. Transforme sua
                jornada de sustentabilidade com tecnologia de ponta.
              </p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>✉ worton@worton.com.br</p>
                <p>📞 (51) 3309.8622</p>
                <p>📍 TECNOPUC, Av. Ipiranga, 6681, sala 802, Partenon, Parque Científico e Tecnológico da PUCRS, Porto Alegre, RS</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/funcionalidades" className="text-muted-foreground hover:text-foreground">Funcionalidades</Link></li>
                <li><Link to="/simulador" className="text-muted-foreground hover:text-foreground">Simulador</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contato" className="text-muted-foreground hover:text-foreground">Contato</Link></li>
                <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Acessar Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Siga-nos nas redes sociais</h4>
              <div className="flex space-x-2 text-sm text-muted-foreground">
                <span>Instagram</span>
                <span>LinkedIn</span>
                <span>X (Twitter)</span>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2025 Worton. Todos os direitos reservados.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link to="#" className="hover:text-foreground">Privacidade</Link>
              <Link to="#" className="hover:text-foreground">Termos</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Funcionalidades;