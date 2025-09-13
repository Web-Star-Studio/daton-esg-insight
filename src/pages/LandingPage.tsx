import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Shield, 
  Zap, 
  TrendingUp,
  Check,
  X,
  Menu,
  ChevronRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import datonLogo from "@/assets/daton-logo-header.png"
import amchamLogo from "@/assets/clients/amcham.png"
import cooperliquidosLogo from "@/assets/clients/cooperliquidos.png"
import gabardoLogo from "@/assets/clients/gabardo.png"
import mercosulLogo from "@/assets/clients/mercosul.png"
import proambLogo from "@/assets/clients/proamb.png"
import safewebLogo from "@/assets/clients/safeweb.png"
import thyssenkruppLogo from "@/assets/clients/thyssenkrupp.png"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const features = [
    {
      icon: BarChart3,
      title: "Gestão de Emissões",
      description: "Monitore e controle suas emissões de GEE com precisão científica",
      link: "Saiba mais →"
    },
    {
      icon: Shield,
      title: "Licenciamento Ambiental",
      description: "Acompanhe licenças e prazos para manter conformidade regulatória",
      link: "Saiba mais →"
    },
    {
      icon: Zap,
      title: "IA para ESG",
      description: "Insights inteligentes para otimizar sua performance ambiental",
      link: "Saiba mais →"
    },
    {
      icon: TrendingUp,
      title: "Relatórios Automáticos",
      description: "Gere relatórios ESG em conformidade com GRI, CDP e SASB",
      link: "Saiba mais →"
    }
  ]

  const datonBenefits = [
    "Gestão centralizada de dados ESG",
    "Conformidade regulatória garantida", 
    "Relatórios automáticos padronizados",
    "Insights de IA para tomada de decisão",
    "Monitoramento em tempo real",
    "Interface intuitiva e moderna"
  ]

  const withoutDatonIssues = [
    "Dados ESG fragmentados e manuais",
    "Risco de não conformidade",
    "Relatórios demoram semanas",
    "Falta de visibilidade estratégica",
    "Oportunidades perdidas",
    "Custos operacionais elevados"
  ]

  const clients = [
    { name: "Amcham", logo: amchamLogo },
    { name: "Cooperliquidos", logo: cooperliquidosLogo },
    { name: "Gabardo", logo: gabardoLogo },
    { name: "Mercosul", logo: mercosulLogo },
    { name: "Proamb", logo: proambLogo },
    { name: "Safeweb", logo: safewebLogo },
    { name: "ThyssenKrupp", logo: thyssenkruppLogo }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src={datonLogo} alt="Daton" className="h-8" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#funcionalidades" className="text-foreground/80 hover:text-foreground transition-colors">
                Funcionalidades
              </a>
              <a href="#contato" className="text-foreground/80 hover:text-foreground transition-colors">
                Contato
              </a>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Fazer Login
              </Button>
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate("/simulador")}
              >
                Simulador Gratuito
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/40">
              <div className="flex flex-col space-y-4">
                <a href="#funcionalidades" className="text-foreground/80 hover:text-foreground">
                  Funcionalidades
                </a>
                <a href="#contato" className="text-foreground/80 hover:text-foreground">
                  Contato
                </a>
                <Button variant="ghost" onClick={() => navigate("/auth")} className="justify-start">
                  Fazer Login
                </Button>
                <Button 
                  className="bg-primary text-primary-foreground justify-start"
                  onClick={() => navigate("/simulador")}
                >
                  Simulador Gratuito
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
                O futuro da gestão <span className="text-primary">ESG</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Daton está chegando! Seja um dos primeiros a ter acesso à 
                plataforma mais avançada para gestão ESG do Brasil.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/simulador")}
                >
                  Simulador Eco Impacto
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/auth")}
                >
                  Começar o Daton
                </Button>
              </div>
            </div>
            
            {/* Dashboard Preview */}
            <div className="relative">
              <div className="bg-card rounded-lg shadow-lg p-6 border border-border/40">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Dashboard ESG</h3>
                    <Badge variant="secondary">Em Tempo Real</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-2xl font-bold text-primary">85</div>
                      <div className="text-sm text-muted-foreground">Score ESG</div>
                    </div>
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-2xl font-bold text-success">12.5k</div>
                      <div className="text-sm text-muted-foreground">tCO₂e</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conformidade</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <div className="bg-muted/50 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full w-[94%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Funcionalidades em Destaque
            </h2>
            <p className="text-xl text-muted-foreground">
              Tudo o que você precisa para sua jornada de sustentabilidade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <a href="#" className="text-primary text-sm font-medium hover:underline">
                    {feature.link}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Por que escolher o Daton?
            </h2>
            <p className="text-xl text-muted-foreground">
              O que sua empresa ganha com nossa plataforma
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Com Daton */}
            <Card className="border-primary/20">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Com Daton</h3>
                </div>
                <ul className="space-y-4">
                  {datonBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Sem Daton */}
            <Card className="border-destructive/20">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center mr-3">
                    <X className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold">Sem Daton</h3>
                </div>
                <ul className="space-y-4">
                  {withoutDatonIssues.map((issue, index) => (
                    <li key={index} className="flex items-start">
                      <X className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Confiança que nos impulsiona
          </h2>
          <p className="text-xl text-muted-foreground mb-16">
            Clientes que já confiam na nossa expertise
          </p>
          
          <div className="overflow-hidden">
            <div className="flex client-logos-slider">
              {/* Primeira instância das logos */}
              {clients.map((client, index) => (
                <div key={`first-${index}`} className="flex-none mx-6 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="bg-card rounded-xl p-8 h-32 w-32 flex items-center justify-center border border-border/40 shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={client.logo} 
                      alt={client.name} 
                      className="h-20 w-20 object-contain filter grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                </div>
              ))}
              {/* Segunda instância para loop infinito */}
              {clients.map((client, index) => (
                <div key={`second-${index}`} className="flex-none mx-6 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="bg-card rounded-xl p-8 h-32 w-32 flex items-center justify-center border border-border/40 shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={client.logo} 
                      alt={client.name} 
                      className="h-20 w-20 object-contain filter grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Seja um dos primeiros a usar o Daton
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Garanta seu acesso antecipado e seja notificado sobre o lançamento da plataforma mais 
            inovadora do mercado ESG
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90"
            >
              Garantir acesso antecipado
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10"
              onClick={() => navigate("/simulador")}
            >
              Descubra seu impacto
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-background border-t border-border/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <img src={datonLogo} alt="Daton" className="h-8 mb-4" />
              <p className="text-muted-foreground mb-4 max-w-md">
                Plataforma completa para gestão ESG. Transforme sua 
                jornada de sustentabilidade com tecnologia de ponta.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✉ worton@worton.com.br</p>
                <p>📞 051-3359-6022</p>
                <p>📍 TECNOPUC: Av. Ipiranga, 6681 sala 802, Partenon, Parque Científico e Tecnológico da PUCRS, Porto Alegre, RS</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#funcionalidades" className="hover:text-foreground">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-foreground">Simulador</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#contato" className="hover:text-foreground">Contato</a></li>
                <li><a href="#" className="hover:text-foreground">Acessar Dashboard</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
              <p>© 2025 Worton. Todos os direitos reservados.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-foreground">Privacidade</a>
                <a href="#" className="hover:text-foreground">Termos</a>
                <div className="flex items-center space-x-2">
                  <span>Siga-nos nas redes sociais:</span>
                  <a href="#" className="hover:text-foreground">Instagram</a>
                  <a href="#" className="hover:text-foreground">LinkedIn</a>
                  <a href="#" className="hover:text-foreground">Twitter</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}