import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Video, 
  Check,
  Menu,
  X,
  ChevronRight
} from "lucide-react"
import datonLogo from "@/assets/daton-logo-header.png"

export default function Contato() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    cargo: "",
    funcionarios: "",
    interesse: "",
    desafio: ""
  })
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Remove sensitive logging
    // Aqui você pode adicionar a lógica para enviar o formulário
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const demonstrationFeatures = [
    "Interface completa da plataforma",
    "Casos práticos do seu setor", 
    "ROI personalizado para sua empresa",
    "Plano de implementação"
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div 
              className="flex items-center space-x-2 cursor-pointer" 
              onClick={() => navigate("/")}
            >
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
              <button className="text-primary font-medium">
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
              <button className="block w-full text-left px-3 py-2 text-primary font-medium">
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
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Vamos <span className="text-primary">Conversar</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Agende uma demonstração personalizada e descubra como transformar sua gestão ESG
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form Section */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-8">
                Solicite sua demonstração gratuita
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input
                      id="nome"
                      placeholder="Seu nome"
                      value={formData.nome}
                      onChange={(e) => handleInputChange("nome", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email corporativo *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu.email@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa *</Label>
                    <Input
                      id="empresa"
                      placeholder="Nome da empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange("empresa", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Input
                      id="cargo"
                      placeholder="Seu cargo"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange("cargo", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de funcionários</Label>
                    <Select value={formData.funcionarios} onValueChange={(value) => handleInputChange("funcionarios", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-50">1-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="501-1000">501-1000</SelectItem>
                        <SelectItem value="1000+">1000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Principal interesse</Label>
                    <Select value={formData.interesse} onValueChange={(value) => handleInputChange("interesse", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emissoes">Gestão de Emissões GEE</SelectItem>
                        <SelectItem value="licenciamento">Licenciamento</SelectItem>
                        <SelectItem value="residuos">Gestão de Resíduos</SelectItem>
                        <SelectItem value="carbono">Projetos de Carbono</SelectItem>
                        <SelectItem value="compliance">Compliance ESG</SelectItem>
                        <SelectItem value="relatorios">Relatórios e Analytics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desafio">Conte-nos sobre seu desafio ESG</Label>
                  <Textarea
                    id="desafio"
                    placeholder="Descreva seus principais desafios e objetivos..."
                    className="min-h-[120px]"
                    value={formData.desafio}
                    onChange={(e) => handleInputChange("desafio", e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  Agendar demonstração gratuita
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-foreground">
                Entre em contato
              </h2>

              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Email</h3>
                      <p className="text-primary">worton@worton.com.br</p>
                      <p className="text-sm text-muted-foreground">Resposta em até 24 horas</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Telefone</h3>
                      <p className="text-primary">051-3369.6022</p>
                      <p className="text-sm text-muted-foreground">Seg - Sex, 9h às 18h</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Escritório</h3>
                      <p className="text-foreground">TECNOPUC, Av. Ipiranga, 6681, sala 802, Partenon</p>
                      <p className="text-foreground">Parque Científico e Tecnológico da PUCRS</p>
                      <p className="text-foreground">Porto Alegre, RS</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Reunião Online</h3>
                      <p className="text-foreground">Agende uma videochamada</p>
                      <p className="text-sm text-muted-foreground">Disponível de 9h às 18h</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Demo Features */}
              <div className="bg-muted/30 p-6 rounded-lg">
                <h3 className="font-semibold text-foreground mb-4">
                  O que você verá na demonstração:
                </h3>
                <ul className="space-y-3">
                  {demonstrationFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className="bg-primary/20 p-1 rounded-full">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src={datonLogo} alt="Daton" className="h-8" />
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Plataforma completa para gestão ESG. Transforme sua jornada de sustentabilidade com tecnologia de ponta.
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>worton@worton.com.br</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>051-3369.6022</span>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>TECNOPUC, Av. Ipiranga, 6681, sala 802, Partenon, Parque Científico e Tecnológico da PUCRS, Porto Alegre, RS</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate("/funcionalidades")} className="text-muted-foreground hover:text-primary transition-colors">Funcionalidades</button></li>
                <li><button onClick={() => navigate("/simulador")} className="text-muted-foreground hover:text-primary transition-colors">Simulador</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><button className="text-muted-foreground hover:text-primary transition-colors">Contato</button></li>
                <li><button className="text-muted-foreground hover:text-primary transition-colors">Acessar Dashboard</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Worton. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacidade</button>
              <button className="text-sm text-muted-foreground hover:text-primary transition-colors">Termos</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}