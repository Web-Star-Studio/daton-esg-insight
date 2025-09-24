import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { carbonCompensationService, type ConservationActivityType } from "@/services/carbonCompensation"
import { CalendarIcon, TreePine, Calculator, Sprout, MapPin } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

const RegistrarAtividadeConservacao = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activityTypes, setActivityTypes] = useState<ConservationActivityType[]>([])
  const [loading, setLoading] = useState(false)
  const [calculatingImpact, setCalculatingImpact] = useState(false)
  
  const [formData, setFormData] = useState({
    activity_type: "",
    title: "",
    description: "",
    location: "",
    area_size: 0,
    start_date: new Date(),
    end_date: undefined as Date | undefined,
    status: "Planejada" as const,
    investment_amount: 0,
    carbon_impact_estimate: 0,
    methodology: "",
    monitoring_plan: "",
  })

  // SEO
  useEffect(() => {
    document.title = 'Registrar Atividade de Conservação | Compensação de Carbono';
    const desc = 'Registre atividades de conservação, reflorestamento e recuperação ambiental para compensação de carbono.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/projetos-carbono/registrar-atividade`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);

  useEffect(() => {
    loadActivityTypes();
  }, []);

  const loadActivityTypes = async () => {
    try {
      const types = await carbonCompensationService.getActivityTypes();
      setActivityTypes(types);
    } catch (error) {
      console.error('Erro ao carregar tipos de atividade:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const calculateCarbonImpact = async () => {
    if (!formData.activity_type || !formData.area_size) {
      toast({
        title: "Aviso",
        description: "Selecione o tipo de atividade e informe a área para calcular o impacto",
        variant: "destructive",
      });
      return;
    }

    try {
      setCalculatingImpact(true);
      const years = formData.end_date && formData.start_date 
        ? Math.ceil((formData.end_date.getTime() - formData.start_date.getTime()) / (1000 * 60 * 60 * 24 * 365))
        : 10; // Default 10 years

      const impact = await carbonCompensationService.calculateCarbonImpact(
        formData.activity_type,
        formData.area_size,
        years
      );

      setFormData(prev => ({ ...prev, carbon_impact_estimate: impact }));
      
      toast({
        title: "Impacto Calculado",
        description: `Estimativa: ${impact.toFixed(2)} tCO₂e em ${years} anos`,
      });
    } catch (error) {
      console.error('Erro ao calcular impacto:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular impacto de carbono",
        variant: "destructive",
      });
    } finally {
      setCalculatingImpact(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.activity_type || !formData.start_date) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const data = {
        ...formData,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date?.toISOString().split('T')[0],
      };

      await carbonCompensationService.createActivity(data);
      
      toast({
        title: "Sucesso",
        description: "Atividade de conservação registrada com sucesso!",
      });
      
      navigate("/projetos-carbono");
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar atividade de conservação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/projetos-carbono")
  }

  const selectedType = activityTypes.find(t => t.name === formData.activity_type);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Registrar Atividade de Conservação</h1>
            <p className="text-muted-foreground mt-1">
              Crie uma nova atividade de conservação, reflorestamento ou recuperação ambiental
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="atividade-form" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Atividade"}
            </Button>
          </div>
        </div>

        <form id="atividade-form" onSubmit={onSubmit} className="space-y-6">
          {/* Layout de duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da Esquerda */}
            <div className="space-y-6">
              {/* Seção 1: Informações Básicas */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="activity_type">Tipo de Atividade *</Label>
                    <Select 
                      value={formData.activity_type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de atividade" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{type.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {type.carbon_factor} tCO₂e/{type.unit}/ano
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedType && (
                      <p className="text-sm text-muted-foreground">
                        {selectedType.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título da Atividade *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Reflorestamento da Área Norte da Fazenda"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva os objetivos, escopo e detalhes da atividade..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status Inicial</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planejada">Planejada</SelectItem>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Concluída">Concluída</SelectItem>
                        <SelectItem value="Suspensa">Suspensa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Seção 2: Localização e Área */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localização e Área
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Ex: Fazenda São João, Distrito de Água Limpa, MG"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area_size">
                      Área ({selectedType?.unit || 'hectares'})
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="area_size"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.area_size}
                        onChange={(e) => setFormData(prev => ({ ...prev, area_size: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={calculateCarbonImpact}
                        disabled={calculatingImpact}
                        className="shrink-0"
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna da Direita */}
            <div className="space-y-6">
              {/* Seção 3: Cronograma */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Cronograma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data de Início *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.start_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.start_date ? format(formData.start_date, "PPP", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => setFormData(prev => ({ ...prev, start_date: date || new Date() }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Término (Opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.end_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.end_date ? format(formData.end_date, "PPP", { locale: ptBR }) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => setFormData(prev => ({ ...prev, end_date: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Seção 4: Impacto e Investimento */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sprout className="h-5 w-5" />
                    Impacto e Investimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="carbon_impact_estimate">Impacto Estimado (tCO₂e)</Label>
                    <Input
                      id="carbon_impact_estimate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.carbon_impact_estimate}
                      onChange={(e) => setFormData(prev => ({ ...prev, carbon_impact_estimate: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use o botão calculadora ao lado da área para estimar automaticamente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investment_amount">Investimento Previsto (R$)</Label>
                    <Input
                      id="investment_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.investment_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, investment_amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                    {formData.investment_amount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Valor formatado: {formatCurrency(formData.investment_amount)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Seção 5: Metodologia e Monitoramento */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Metodologia e Monitoramento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="methodology">Metodologia</Label>
                    <Input
                      id="methodology"
                      value={formData.methodology}
                      onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                      placeholder={selectedType?.methodology_reference || "Ex: REDD+, CDM-AR, VCS"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monitoring_plan">Plano de Monitoramento</Label>
                    <Textarea
                      id="monitoring_plan"
                      value={formData.monitoring_plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, monitoring_plan: e.target.value }))}
                      placeholder="Descreva como será feito o monitoramento da atividade, frequência, indicadores..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

export default RegistrarAtividadeConservacao