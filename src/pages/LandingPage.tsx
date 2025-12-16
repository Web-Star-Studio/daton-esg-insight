import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Shield, 
  Brain, 
  FileText, 
  Leaf,
  Menu,
  X,
  ChevronRight,
  ArrowRight
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import datonLogo from "@/assets/daton-logo-header.png"
import amchamLogo from "@/assets/clients/amcham-new.png"
import cooperliquidosLogo from "@/assets/clients/cooperliquidos-new.png"
import gabardoLogo from "@/assets/clients/gabardo-new.png"
import mercosulLogo from "@/assets/clients/mercosul-new.png"
import proambLogo from "@/assets/clients/proamb-new.png"
import safewebLogo from "@/assets/clients/safeweb-new.png"
import thyssenkruppLogo from "@/assets/clients/thyssenkrupp-new.png"

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const features = [
    {
      icon: BarChart3,
      title: "Monitoramento GEE",
      description: "Cálculo automático de emissões conforme GHG Protocol"
    },
    {
      icon: Shield,
      title: "Compliance",
      description: "Gestão de licenças e conformidade regulatória"
    },
    {
      icon: Brain,
      title: "Inteligência Artificial",
      description: "Análise preditiva e insights acionáveis"
    },
    {
      icon: FileText,
      title: "Relatórios",
      description: "Geração automática em formatos GRI, SASB, TCFD"
    },
    {
      icon: Leaf,
      title: "Gestão de Resíduos",
      description: "Controle completo do ciclo de vida dos resíduos"
    }
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

  // Client logos slideshow
  const [currentSlide, setCurrentSlide] = useState(0)
  const logosPerSlide = 4
  const totalSlides = Math.ceil(clients.length / logosPerSlide)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 3000)
    return () => clearInterval(timer)
  }, [totalSlides])

  const getVisibleLogos = () => {
    const start = currentSlide * logosPerSlide
    const end = start + logosPerSlide
    return clients.slice(start, end)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={datonLogo} alt="Daton" className="h-7" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => navigate("/funcionalidades")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => navigate("/contato")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contato
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </button>
              <Button 
                size="sm"
                onClick={() => navigate("/contato")}
              >
                Agendar Demo
              </Button>
            </nav>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/40 space-y-3">
              <button 
                onClick={() => navigate("/funcionalidades")}
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => navigate("/contato")}
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground"
              >
                Contato
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="block w-full text-left text-sm text-muted-foreground hover:text-foreground"
              >
                Login
              </button>
              <Button 
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate("/contato")}
              >
                Agendar Demo
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-semibold text-foreground leading-tight tracking-tight mb-6">
            Gestão ESG simplificada
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Plataforma completa para monitoramento de emissões, compliance ambiental e relatórios ESG. 
            Tudo em um só lugar.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              onClick={() => navigate("/contato")}
              className="px-8"
            >
              Agendar demonstração
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="px-8"
            >
              Acessar plataforma
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div>
              <div className="text-2xl font-semibold text-foreground">70%</div>
              <div className="text-sm text-muted-foreground">menos tempo</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">99%</div>
              <div className="text-sm text-muted-foreground">precisão</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">15min</div>
              <div className="text-sm text-muted-foreground">setup</div>
            </div>
          </div>
        </div>
      </section>

      {/* Client Logos Slideshow */}
      <section className="py-12 border-y border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Empresas que confiam no Daton
          </p>
          <div className="relative overflow-hidden">
            <div 
              className="flex items-center justify-center gap-12 transition-all duration-500 ease-in-out"
            >
              {getVisibleLogos().map((client, index) => (
                <div 
                  key={`${client.name}-${currentSlide}-${index}`}
                  className="flex-shrink-0 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all"
                >
                  <img 
                    src={client.logo} 
                    alt={client.name} 
                    className="h-8 md:h-10 object-contain"
                  />
                </div>
              ))}
            </div>
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-4">
              Tudo que você precisa para gestão ESG
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Automatize processos, garanta compliance e tome decisões baseadas em dados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="p-6 rounded-lg border border-border/50 hover:border-border hover:bg-muted/30 transition-all group"
              >
                <feature.icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-4">
              Simples de começar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                1
              </div>
              <h3 className="font-medium text-foreground mb-2">Conecte</h3>
              <p className="text-sm text-muted-foreground">
                Integração com seus sistemas existentes
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                2
              </div>
              <h3 className="font-medium text-foreground mb-2">Monitore</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe métricas em tempo real
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                3
              </div>
              <h3 className="font-medium text-foreground mb-2">Relate</h3>
              <p className="text-sm text-muted-foreground">
                Gere relatórios automaticamente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-semibold text-foreground mb-4">
            Pronto para simplificar sua gestão ESG?
          </h2>
          <p className="text-muted-foreground mb-8">
            Agende uma demonstração gratuita e veja como o Daton pode ajudar sua empresa
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate("/contato")}
              className="px-8"
            >
              Falar com especialista
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img src={datonLogo} alt="Daton" className="h-6" />
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <button 
                onClick={() => navigate("/funcionalidades")}
                className="hover:text-foreground transition-colors"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => navigate("/contato")}
                className="hover:text-foreground transition-colors"
              >
                Contato
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="hover:text-foreground transition-colors"
              >
                Login
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Daton. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
