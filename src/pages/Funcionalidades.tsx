import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Shield, Recycle, Leaf, Brain, FileText, TrendingUp, Database, Zap } from "lucide-react";
import datonLogo from "@/assets/daton-logo-header.png";

const Funcionalidades = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Gestão de Emissões GEE",
      description: "Monitore e controle suas emissões de gases de efeito estufa com precisão científica",
      items: [
        "Cálculo automático por escopos 1, 2 e 3",
        "Monitoramento em tempo real",
        "Alertas de desvio de metas",
        "Comparação com benchmarks setoriais"
      ]
    },
    {
      icon: Shield,
      title: "Licenciamento Ambiental",
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
      description: "Otimize sua gestão de resíduos com rastreamento completo e insights de economia circular",
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
      description: "Gerencie projetos de compensação e créditos de carbono com transparência total",
      items: [
        "Portfólio de projetos",
        "Validação de créditos",
        "ROI ambiental",
        "Certificações internacionais"
      ]
    },
    {
      icon: Brain,
      title: "Inteligência Artificial",
      description: "IA avançada para identificar oportunidades de melhoria e otimizar performance ESG",
      items: [
        "Insights preditivos",
        "Recomendações personalizadas",
        "Análise de cenários",
        "Detecção de padrões"
      ]
    },
    {
      icon: FileText,
      title: "Relatórios Automáticos",
      description: "Gere relatórios ESG em conformidade com padrões internacionais",
      items: [
        "Conformidade GRI, CDP, SASB",
        "Geração automática",
        "Templates personalizáveis",
        "Exportação em múltiplos formatos"
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

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="bg-card rounded-lg p-8 shadow-sm border">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground mb-4">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center space-x-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Integração Total</h2>
          <p className="text-muted-foreground mb-12">
            Conecte-se facilmente com seus sistemas existentes
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {integrations.map((integration, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <integration.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{integration.title}</h3>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </div>
            ))}
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