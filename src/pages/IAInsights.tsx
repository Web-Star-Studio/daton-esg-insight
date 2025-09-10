import { useState } from "react"
import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Shield, 
  Filter,
  ArrowUpDown,
  ExternalLink,
  CheckCircle,
  X
} from "lucide-react"

interface InsightCard {
  id: string
  tipo: "anomalia" | "oportunidade" | "risco"
  titulo: string
  descricao: string
  metrica: string
  acaoSugerida: string
  timestamp: Date
  relevancia: number
  lido: boolean
}

const mockInsights: InsightCard[] = [
  {
    id: "1",
    tipo: "anomalia",
    titulo: "Pico Inesperado no Consumo de Energia da Unidade SP",
    descricao: "Detectamos um aumento de 23% no consumo de eletricidade na Unidade SP na última semana, o que está significativamente fora do padrão histórico para este período.",
    metrica: "Consumo Registrado: 18.450 kWh (vs. Média de 15.000 kWh)",
    acaoSugerida: "Recomendamos verificar o sistema de climatização (HVAC) ou possíveis falhas em equipamentos de grande porte.",
    timestamp: new Date("2024-09-08"),
    relevancia: 95,
    lido: false
  },
  {
    id: "2",
    tipo: "oportunidade",
    titulo: "Potencial de Redução de Custos com Resíduos Classe II A",
    descricao: "Analisando seus registros, notamos que 85% dos seus resíduos Classe II A (não-inertes) são compostos por papel e papelão. Empresas com perfil semelhante atingem taxas de reciclagem 20% maiores para este material.",
    metrica: "Taxa de Reciclagem Atual (Papel): 65%",
    acaoSugerida: "Considere renegociar com a cooperativa de reciclagem ou iniciar uma campanha interna de conscientização. Simule o impacto desta ação em nosso simulador.",
    timestamp: new Date("2024-09-07"),
    relevancia: 88,
    lido: false
  },
  {
    id: "3",
    tipo: "risco",
    titulo: "Ritmo Atual Pode Não Atingir a Meta de Redução de Emissões",
    descricao: "Com base na projeção de suas emissões nos últimos 6 meses, há um risco de 75% de que a meta de 'Reduzir emissões em 15% até Dezembro de 2025' não seja alcançada se o ritmo atual for mantido.",
    metrica: "Progresso Necessário: 6.5% ao semestre. Progresso Atual: 4.8%",
    acaoSugerida: "Recomendamos revisar as iniciativas em andamento ou explorar novas ações, como as sugeridas no simulador, para acelerar a redução.",
    timestamp: new Date("2024-09-06"),
    relevancia: 92,
    lido: true
  },
  {
    id: "4",
    tipo: "anomalia",
    titulo: "Aumento Atípico na Geração de Resíduos Classe I",
    descricao: "Identificamos um crescimento de 18% na geração de resíduos perigosos (Classe I) na última quinzena, concentrado principalmente na área de produção.",
    metrica: "Volume Gerado: 2.8 toneladas (vs. Média de 2.4 toneladas)",
    acaoSugerida: "Investigate possíveis alterações no processo produtivo ou falhas no manuseio de materiais perigosos.",
    timestamp: new Date("2024-09-05"),
    relevancia: 87,
    lido: false
  },
  {
    id: "5",
    tipo: "oportunidade",
    titulo: "Otimização de Rotas Pode Reduzir Emissões do Transporte",
    descricao: "Nossa análise das rotas de transporte dos últimos 3 meses identificou que 35% dos trajetos poderiam ser otimizados, reduzindo distância total percorrida.",
    metrica: "Potencial de Redução: 280 km/semana (-12% das emissões de transporte)",
    acaoSugerida: "Implemente um sistema de roteirização inteligente ou revise manualmente as rotas de maior impacto.",
    timestamp: new Date("2024-09-04"),
    relevancia: 82,
    lido: true
  },
  {
    id: "6",
    tipo: "risco",
    titulo: "Prazo de Renovação da LO se Aproxima",
    descricao: "A Licença de Operação da Unidade RJ vencerá em 45 dias. Baseado no histórico de processos similares, recomendamos iniciar o protocolo de renovação imediatamente.",
    metrica: "Prazo Restante: 45 dias (Processo típico: 60-90 dias)",
    acaoSugerida: "Inicie imediatamente o processo de renovação da LO junto ao órgão ambiental competente.",
    timestamp: new Date("2024-09-03"),
    relevancia: 96,
    lido: false
  },
  {
    id: "7",
    tipo: "oportunidade",
    titulo: "Substituição por Energia Solar Viável na Sede",
    descricao: "Com base no perfil de consumo energético e análise de viabilidade, a instalação de painéis solares na sede pode suprir 70% da demanda energética atual.",
    metrica: "ROI Projetado: 4.2 anos (Economia anual: R$ 185.000)",
    acaoSugerida: "Solicite orçamentos para sistemas fotovoltaicos e avalie incentivos fiscais disponíveis.",
    timestamp: new Date("2024-09-02"),
    relevancia: 85,
    lido: true
  },
  {
    id: "8",
    tipo: "anomalia",
    titulo: "Consumo de Água Acima do Esperado na Unidade MG",
    descricao: "O consumo de água industrial na Unidade MG apresentou aumento de 28% no último mês, sem correlação com aumento na produção.",
    metrica: "Consumo Registrado: 1.250 m³ (vs. Média de 980 m³)",
    acaoSugerida: "Verifique possíveis vazamentos na rede hidráulica ou alterações nos processos que utilizam água.",
    timestamp: new Date("2024-09-01"),
    relevancia: 79,
    lido: false
  }
]

const categorias = [
  { key: "todos", label: "Todos", count: 8 },
  { key: "oportunidade", label: "Oportunidades", count: 3 },
  { key: "risco", label: "Riscos", count: 2 },
  { key: "anomalia", label: "Anomalias", count: 3 }
]

const tipoConfig = {
  anomalia: {
    icon: AlertTriangle,
    label: "Anomalia Detectada",
    colorClass: "text-orange-600 border-orange-200 bg-orange-50",
    badgeClass: "bg-orange-100 text-orange-800"
  },
  oportunidade: {
    icon: Lightbulb,
    label: "Oportunidade de Melhoria", 
    colorClass: "text-green-600 border-green-200 bg-green-50",
    badgeClass: "bg-green-100 text-green-800"
  },
  risco: {
    icon: Shield,
    label: "Alerta de Risco",
    colorClass: "text-red-600 border-red-200 bg-red-50", 
    badgeClass: "bg-red-100 text-red-800"
  }
}

export default function IAInsights() {
  const navigate = useNavigate()
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("relevantes")
  const [insights, setInsights] = useState<InsightCard[]>(mockInsights)

  const insightsFiltrados = insights
    .filter(insight => filtroCategoria === "todos" || insight.tipo === filtroCategoria)
    .sort((a, b) => {
      if (ordenacao === "relevantes") {
        return b.relevancia - a.relevancia
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })

  const marcarComoLido = (id: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === id ? { ...insight, lido: true } : insight
    ))
    toast.success("Insight marcado como lido")
  }

  const dispensarAlerta = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id))
    toast.success("Alerta dispensado")
  }

  const criarTarefa = () => {
    toast.success("Tarefa de verificação criada com sucesso")
  }

  const navigateToSimulator = () => {
    navigate("/simulador")
  }

  const navigateToMetas = () => {
    navigate("/metas")
  }

  const navigateToLicenciamento = () => {
    navigate("/licenciamento")
  }

  const renderInsightCard = (insight: InsightCard) => {
    const config = tipoConfig[insight.tipo]
    const IconComponent = config.icon
    
    return (
      <Card 
        key={insight.id} 
        className={`relative transition-all duration-200 hover:shadow-lg ${config.colorClass} ${
          !insight.lido ? 'ring-2 ring-primary/20' : ''
        }`}
      >
        {!insight.lido && (
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full" />
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/80">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <Badge variant="secondary" className={config.badgeClass}>
                  {config.label}
                </Badge>
                <CardTitle className="text-lg leading-tight">
                  {insight.titulo}
                </CardTitle>
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {insight.timestamp.toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.descricao}
          </p>
          
          <div className="p-3 bg-background/60 rounded-lg border">
            <p className="text-sm font-medium text-foreground">
              {insight.metrica}
            </p>
          </div>

          <div className="p-3 bg-background/40 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Ação sugerida:</strong> {insight.acaoSugerida}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {insight.tipo === "anomalia" && (
              <>
                <Button onClick={criarTarefa} size="sm" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Criar Tarefa de Verificação
                </Button>
                <Button 
                  onClick={() => dispensarAlerta(insight.id)}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Dispensar Alerta
                </Button>
              </>
            )}
            
            {insight.tipo === "oportunidade" && (
              <>
                <Button onClick={navigateToSimulator} size="sm" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Ir para o Simulador
                </Button>
                <Button 
                  onClick={() => marcarComoLido(insight.id)}
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marcar como Lido
                </Button>
              </>
            )}
            
            {insight.tipo === "risco" && (
              <>
                <Button onClick={navigateToMetas} size="sm" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Ver Detalhes da Meta
                </Button>
                <Button onClick={navigateToLicenciamento} size="sm" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Explorar Ações Corretivas
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Central de Inteligência & Insights</h1>
          </div>
          <p className="text-muted-foreground">
            Nossos algoritmos estão sempre analisando seus dados para ajudá-lo a tomar as melhores decisões.
          </p>
        </div>

        {/* Controles de Filtragem */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filtrar por Categoria
              </div>
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria.key}
                    variant={filtroCategoria === categoria.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroCategoria(categoria.key)}
                    className="flex items-center gap-2"
                  >
                    {categoria.label}
                    <Badge variant="secondary" className="ml-1">
                      {categoria.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowUpDown className="w-4 h-4" />
                Ordenar por
              </div>
              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevantes">Mais Relevantes</SelectItem>
                  <SelectItem value="recentes">Mais Recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Feed de Insights */}
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="space-y-4">
            {insightsFiltrados.length > 0 ? (
              insightsFiltrados.map(renderInsightCard)
            ) : (
              <Card className="p-8 text-center">
                <div className="space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">Nenhum insight encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Tente ajustar os filtros para ver mais insights.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </MainLayout>
  )
}