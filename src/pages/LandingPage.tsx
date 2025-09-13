import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Shield, 
  Zap, 
  TrendingUp,
  Check,
  X,
  Menu,
  ChevronRight,
  Building2,
  Leaf,
  Brain,
  FileText,
  TrendingDown,
  Target,
  DollarSign,
  Star,
  Users,
  Clock,
  Search,
  Crown,
  Award
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
      description: "Rastreamento automático e cálculo preciso de emissões de gases do efeito estufa",
      benefits: [
        "Cálculos automáticos de Escopo 1, 2 e 3",
        "Fatores de emissão atualizados",
        "Relatórios em tempo real"
      ]
    },
    {
      icon: Shield,
      title: "Compliance Automatizado",
      description: "Gestão inteligente de licenças e conformidade regulatória",
      benefits: [
        "Alertas de vencimento automáticos",
        "Acompanhamento de condicionantes",
        "Dashboard de status regulatório"
      ]
    },
    {
      icon: Brain,
      title: "Inteligência Artificial",
      description: "IA para análise preditiva e insights acionáveis",
      benefits: [
        "Predição de tendências ESG",
        "Recomendações automáticas",
        "Análise de riscos climáticos"
      ]
    },
    {
      icon: FileText,
      title: "Relatórios Automáticos",
      description: "Geração automática de relatórios ESG padronizados",
      benefits: [
        "Formatos GRI, SASB, TCFD",
        "Exportação em múltiplos formatos",
        "Auditoria completa de dados"
      ]
    },
    {
      icon: Leaf,
      title: "Gestão de Resíduos",
      description: "Controle completo do ciclo de vida dos resíduos",
      benefits: [
        "Rastreamento de destinação",
        "Cálculo de taxas de reciclagem",
        "Conformidade com PNRS"
      ]
    },
    {
      icon: TrendingUp,
      title: "Metas e KPIs",
      description: "Definição e acompanhamento de metas ESG",
      benefits: [
        "Metas science-based",
        "Tracking automático de progresso",
        "Benchmarking setorial"
      ]
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

  const testimonials = [
    {
      name: "Marina Santos",
      role: "Diretora de Sustentabilidade",
      company: "Mercosul Energia",
      avatar: "M",
      color: "blue",
      quote: "Reduzimos 75% do tempo gasto em relatórios ESG. O Daton automatizou processos que antes levavam semanas e agora temos dados em tempo real para tomada de decisões estratégicas.",
      metrics: { timeReduction: "75%", savings: "R$ 2.3M" }
    },
    {
      name: "Carlos Mendes", 
      role: "Gerente de Compliance",
      company: "ThyssenKrupp",
      avatar: "C",
      color: "green",
      quote: "A plataforma transformou nossa gestão de licenças ambientais. Zero multas no último ano graças aos alertas inteligentes e monitoramento automatizado do Daton.",
      metrics: { compliance: "100%", fines: "Zero" }
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img src={datonLogo} alt="Daton" className="h-8" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button 
                onClick={() => navigate("/funcionalidades")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => navigate("/contato")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Contato
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="text-foreground hover:text-primary transition-colors"
              >
                Fazer Login
              </button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/simulador")}
              >
                Simulador Gratuito
              </Button>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <button 
                onClick={() => navigate("/funcionalidades")}
                className="block w-full text-left px-3 py-2 text-foreground hover:text-primary transition-colors"
              >
                Funcionalidades
              </button>
              <button 
                onClick={() => navigate("/contato")}
                className="block w-full text-left px-3 py-2 text-foreground hover:text-primary transition-colors"
              >
                Contato
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="block w-full text-left px-3 py-2 text-foreground hover:text-primary transition-colors"
              >
                Fazer Login
              </button>
              <Button 
                className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => navigate("/simulador")}
              >
                Simulador Gratuito
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-br from-muted/30 to-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  🚀 Plataforma ESG mais avançada do Brasil
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Lidere a transformação para uma <span className="text-primary">economia sustentável</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Mais que eficiência operacional: torne-se um líder ESG com nossa plataforma completa. 
                  Construa vantagem competitiva, gerencie riscos climáticos e prepare sua empresa para o futuro 
                  da economia sustentável.
                </p>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 py-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">70%</div>
                  <div className="text-sm text-muted-foreground">Menos tempo em relatórios</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">99%</div>
                  <div className="text-sm text-muted-foreground">Precisão em compliance</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">15min</div>
                  <div className="text-sm text-muted-foreground">Para setup completo</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6"
                  onClick={() => navigate("/simulador")}
                >
                  Simular meu ROI ESG
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 border-2"
                  onClick={() => navigate("/contato")}
                >
                  Agendar demonstração
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="text-sm text-muted-foreground ml-4">Dashboard ESG - Tempo Real</div>
                </div>
                
                {/* Mock Dashboard */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Compliance Score</span>
                    <span className="text-lg font-bold text-green-600">98%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">2.340</div>
                      <div className="text-xs text-muted-foreground">tCO2e reduzidas</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-600">45</div>
                      <div className="text-xs text-muted-foreground">Licenças ativas</div>
                    </div>
                  </div>
                  <div className="h-20 bg-gradient-to-r from-green-100 to-green-200 rounded-lg flex items-end p-3">
                    <div className="flex space-x-1 items-end w-full">
                      <div className="bg-green-500 h-8 w-4 rounded-sm"></div>
                      <div className="bg-green-500 h-12 w-4 rounded-sm"></div>
                      <div className="bg-green-500 h-6 w-4 rounded-sm"></div>
                      <div className="bg-green-600 h-16 w-4 rounded-sm"></div>
                      <div className="bg-green-500 h-10 w-4 rounded-sm"></div>
                      <div className="bg-green-500 h-14 w-4 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results & ROI Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Resultados comprovados em <span className="text-primary">gestão ESG</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empresas que usam Daton economizam tempo, reduzem custos e melhoram significativamente 
              sua performance ESG
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 text-center border-2 hover:border-primary/20 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">70%</div>
              <div className="text-lg font-semibold text-foreground mb-2">Redução no tempo</div>
              <p className="text-muted-foreground">
                de preparação de relatórios ESG e compliance ambiental
              </p>
            </Card>

            <Card className="p-8 text-center border-2 hover:border-primary/20 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">99%</div>
              <div className="text-lg font-semibold text-foreground mb-2">Precisão</div>
              <p className="text-muted-foreground">
                em cálculos de emissões e conformidade regulatória
              </p>
            </Card>

            <Card className="p-8 text-center border-2 hover:border-primary/20 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2">300%</div>
              <div className="text-lg font-semibold text-foreground mb-2">ROI médio</div>
              <p className="text-muted-foreground">
                em eficiência operacional e redução de multas
              </p>
            </Card>
          </div>

          {/* Process Visualization */}
          <div className="bg-muted/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">
              Do caos à excelência ESG em 3 passos
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h4 className="font-semibold text-foreground mb-2">Conecte suas fontes</h4>
                <p className="text-muted-foreground text-sm">
                  Integração automática com sistemas existentes e coleta de dados em tempo real
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h4 className="font-semibold text-foreground mb-2">Monitore e analise</h4>
                <p className="text-muted-foreground text-sm">
                  IA processa dados, identifica padrões e gera insights acionáveis automaticamente
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h4 className="font-semibold text-foreground mb-2">Relate e melhore</h4>
                <p className="text-muted-foreground text-sm">
                  Relatórios automáticos, dashboards personalizados e recomendações inteligentes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Lidere a nova <span className="text-primary">economia sustentável</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              ESG não é mais apenas conformidade - é diferenciação estratégica. Prepare-se para um futuro onde 
              sustentabilidade define liderança de mercado, atrai os melhores talentos e conquista investidores conscientes.
            </p>
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 mb-12 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">Gestão de Riscos</div>
                  <p className="text-sm text-muted-foreground">Antecipe mudanças regulatórias e climáticas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">Marca Forte</div>
                  <p className="text-sm text-muted-foreground">Construa reputação e atraia stakeholders</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">Investidores ESG</div>
                  <p className="text-sm text-muted-foreground">Acesse capital e mercados sustentáveis</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-xl transition-all border-0 bg-white">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start space-x-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Partnership Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Por que Escolher o Daton como Parceiro Estratégico
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mais que uma ferramenta, somos seu parceiro na construção de uma liderança sustentável que gera valor para todos os stakeholders.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-3">Gestão de Riscos Climáticos</h3>
              <p className="text-muted-foreground">Antecipe regulamentações e proteja seu negócio contra riscos ESG emergentes.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-3">Construção de Marca</h3>
              <p className="text-muted-foreground">Fortaleça sua reputação e atraia talentos com um posicionamento ESG autêntico.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-3">Acesso a Capital ESG</h3>
              <p className="text-muted-foreground">Prepare-se para investidores ESG e acesse linhas de crédito sustentáveis.</p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
              <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-3">Vantagem Competitiva</h3>
              <p className="text-muted-foreground">Torne-se referência no seu setor com estratégias ESG diferenciadas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="py-24 bg-gradient-to-br from-background via-muted/10 to-background">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Sua Jornada de Descarbonização com a Daton
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
              Do caos regulatório à liderança ESG em 4 etapas transformadoras. 
              Visualize como nossa plataforma transforma sua operação em referência de sustentabilidade.
            </p>
            
            {/* Central Impact Metrics */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border">
                <span className="text-2xl font-bold text-primary">6 meses → 15 min</span>
                <span className="text-sm text-muted-foreground ml-2">setup de relatórios</span>
              </div>
              <div className="bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border">
                <span className="text-2xl font-bold text-primary">R$ 500K → R$ 0</span>
                <span className="text-sm text-muted-foreground ml-2">multas evitadas</span>
              </div>
              <div className="bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border">
                <span className="text-2xl font-bold text-primary">Invisível → Top 10%</span>
                <span className="text-sm text-muted-foreground ml-2">posição setorial</span>
              </div>
            </div>
          </div>

          {/* Interactive Journey Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-muted via-primary/50 to-muted"></div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
              {/* Step 1: Diagnóstico */}
              <div className="group relative">
                <div className="bg-card hover:bg-card/80 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 border border-border/50 hover:border-primary/30">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-center mb-3">Radiografia ESG Completa</h3>
                  
                  {/* Before/After */}
                  <div className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-lg border-l-4 border-destructive">
                      <p className="text-sm font-medium text-destructive">Antes:</p>
                      <p className="text-xs text-muted-foreground">Dados dispersos, relatórios manuais, riscos invisíveis</p>
                    </div>
                    
                    <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium text-primary">Com Daton:</p>
                      <p className="text-xs text-muted-foreground">Coleta automatizada, visão 360°, baseline preciso</p>
                    </div>
                  </div>
                  
                  {/* Result Badge */}
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">
                      Semanas → 1 dia
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Planejamento */}
              <div className="group relative">
                <div className="bg-card hover:bg-card/80 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 border border-border/50 hover:border-primary/30">
                  <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-3">Estratégia Science-Based</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-lg border-l-4 border-destructive">
                      <p className="text-sm font-medium text-destructive">Antes:</p>
                      <p className="text-xs text-muted-foreground">Metas genéricas, sem base científica</p>
                    </div>
                    
                    <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium text-primary">Com Daton:</p>
                      <p className="text-xs text-muted-foreground">Metas validadas, roadmap claro, benchmarking</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">
                      Credibilidade com investidores
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Ação */}
              <div className="group relative">
                <div className="bg-card hover:bg-card/80 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 border border-border/50 hover:border-primary/30">
                  <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <TrendingDown className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-3">Execução Inteligente</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-lg border-l-4 border-destructive">
                      <p className="text-sm font-medium text-destructive">Antes:</p>
                      <p className="text-xs text-muted-foreground">Ações isoladas, sem monitoramento</p>
                    </div>
                    
                    <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium text-primary">Com Daton:</p>
                      <p className="text-xs text-muted-foreground">Plano coordenado, alertas automáticos</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">
                      70% redução tempo, 99% precisão
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Liderança */}
              <div className="group relative">
                <div className="bg-card hover:bg-card/80 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 border border-border/50 hover:border-primary/30">
                  <div className="absolute -top-4 left-8 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-center mb-3">Referência de Mercado</h3>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-destructive/10 rounded-lg border-l-4 border-destructive">
                      <p className="text-sm font-medium text-destructive">Antes:</p>
                      <p className="text-xs text-muted-foreground">Compliance básico, invisibilidade setorial</p>
                    </div>
                    
                    <div className="p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium text-primary">Com Daton:</p>
                      <p className="text-xs text-muted-foreground">Relatórios robustos, storytelling ESG, liderança</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-accent px-3 py-1 rounded-full text-xs font-medium text-accent-foreground">
                      Top 10% setor, acesso capital ESG
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Pronto para Liderar sua Jornada de Descarbonização?</h3>
              <p className="text-muted-foreground mb-6">
                Descubra em qual etapa sua empresa está e como acelerar sua transformação ESG.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Ver Minha Jornada Personalizada
                </Button>
                <Button variant="outline" size="lg">
                  Falar com Especialista
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Empresas líderes confiam no <span className="text-primary">Daton</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Veja como nossos clientes transformaram sua gestão ESG
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4 mb-6">
                  <div className={`w-16 h-16 bg-${testimonial.color}-100 rounded-full flex items-center justify-center`}>
                    <span className={`text-2xl font-bold text-${testimonial.color}-600`}>{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm text-primary font-medium">{testimonial.company}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4">
                  "{testimonial.quote}"
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(testimonial.metrics).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-semibold text-primary">{value}</span> {key === 'timeReduction' ? 'menos tempo' : key === 'savings' ? 'economizados' : key === 'compliance' ? 'compliance' : 'multas'}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Success Metrics */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-foreground text-center mb-8">
              Resultados em números
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Empresas ativas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10M+</div>
                <div className="text-sm text-muted-foreground">Dados processados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">85%</div>
                <div className="text-sm text-muted-foreground">Redução de custos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoramento</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Beyond Numbers Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Impacto além dos <span className="text-primary">números</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Juntos, estamos construindo um futuro mais sustentável e uma economia que beneficia a todos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 text-center border-0 bg-white shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">1.2M</div>
              <div className="text-lg font-semibold text-foreground mb-2">tCO2e evitadas</div>
              <p className="text-muted-foreground text-sm">
                pelos nossos clientes no último ano, contribuindo para as metas climáticas globais
              </p>
            </Card>

            <Card className="p-8 text-center border-0 bg-white shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
              <div className="text-lg font-semibold text-foreground mb-2">ODS impactados</div>
              <p className="text-muted-foreground text-sm">
                Objetivos de Desenvolvimento Sustentável atendidos através das nossas soluções
              </p>
            </Card>

            <Card className="p-8 text-center border-0 bg-white shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
              <div className="text-lg font-semibold text-foreground mb-2">líderes setoriais</div>
              <p className="text-muted-foreground text-sm">
                dos nossos clientes se tornaram referência ESG em seus mercados
              </p>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              A nova economia já começou
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Empresas sustentáveis crescem 2.5x mais rápido, têm 70% menos turnover e acesso a 
              US$ 30 trilhões em investimentos ESG globais. O futuro pertence aos líderes de hoje.
            </p>
          </div>
        </div>
      </section>

      {/* Expert Team Section */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Especialistas em <span className="text-primary">ESG e Tecnologia</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Nossa equipe combina décadas de experiência em sustentabilidade com inovação tecnológica
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">DR</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Dr. Roberto Silva</h3>
              <p className="text-sm text-primary mb-2">Chief Technology Officer</p>
              <p className="text-sm text-muted-foreground mb-4">
                PhD em Engenharia Ambiental, 15+ anos em soluções ESG corporativas
              </p>
              <div className="flex justify-center space-x-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">ESG Strategy</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">AI/ML</span>
              </div>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">AM</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Ana Martins</h3>
              <p className="text-sm text-primary mb-2">Head of Sustainability</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ex-consultora Deloitte, especialista em compliance e relatórios corporativos
              </p>
              <div className="flex justify-center space-x-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Compliance</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">GRI/SASB</span>
              </div>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">LC</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Luís Carlos</h3>
              <p className="text-sm text-primary mb-2">Product Manager</p>
              <p className="text-sm text-muted-foreground mb-4">
                10+ anos em produtos SaaS, ex-Microsoft, focado em UX para sustentabilidade
              </p>
              <div className="flex justify-center space-x-2">
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">Product</span>
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">UX Design</span>
              </div>
            </Card>
          </div>

          {/* Support Promise */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Consultoria estratégica incluída
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Muito além de uma plataforma: somos seus parceiros na jornada de liderança ESG. 
              Nossa equipe trabalha com você para posicionar sua empresa como referência setorial, 
              preparar para investidores ESG e construir vantagem competitiva duradoura.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center space-x-3">
                <Users className="h-6 w-6 text-primary" />
                <span className="font-medium text-foreground">Estratégia de liderança ESG</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <TrendingUp className="h-6 w-6 text-primary" />
                <span className="font-medium text-foreground">Preparação para investidores</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <Target className="h-6 w-6 text-primary" />
                <span className="font-medium text-foreground">Roadmap de transformação</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section - Client Logos */}
      <section className="py-20 bg-background">
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
                  <div className="bg-card rounded-xl p-8 h-32 w-64 flex items-center justify-center border border-border/40 shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={client.logo} 
                      alt={client.name} 
                      className="h-20 w-56 object-contain filter grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                </div>
              ))}
              {/* Segunda instância para loop infinito */}
              {clients.map((client, index) => (
                <div key={`second-${index}`} className="flex-none mx-6 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="bg-card rounded-xl p-8 h-32 w-64 flex items-center justify-center border border-border/40 shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={client.logo} 
                      alt={client.name} 
                      className="h-20 w-56 object-contain filter grayscale hover:grayscale-0 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Lidere a transformação sustentável do seu setor
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Pioneiros na adoção de ESG estratégico se tornam líderes de mercado. Seja reconhecido como 
            referência em sustentabilidade e construa vantagem competitiva duradoura.
          </p>
          <div className="flex justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => navigate("/simulador")}
            >
              Quero liderar meu setor
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-background border-t border-border/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src={datonLogo} alt="Daton" className="h-8" />
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Plataforma completa para gestão ESG. Transforme sua jornada de sustentabilidade 
                com tecnologia de ponta.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>📧 contato@daton.com.br</div>
                <div>📞 (11) 9999-9999</div>
                <div>📍 São Paulo, Brasil</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/funcionalidades")} className="text-muted-foreground hover:text-primary transition-colors">Funcionalidades</button></li>
                <li><button onClick={() => navigate("/simulador")} className="text-muted-foreground hover:text-primary transition-colors">Simulador</button></li>
                <li><button className="text-muted-foreground hover:text-primary transition-colors">Preços</button></li>
                <li><button className="text-muted-foreground hover:text-primary transition-colors">Casos de Uso</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/contato")} className="text-muted-foreground hover:text-primary transition-colors">Contato</button></li>
                <li><button className="text-muted-foreground hover:text-primary transition-colors">Sobre Nós</button></li>
                <li><button className="text-muted-foreground hover:text-primary transition-colors">Blog</button></li>
                <li><button onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-primary transition-colors">Acessar Dashboard</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Daton. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</button>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos</button>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}