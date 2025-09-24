import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { supabase } from "@/integrations/supabase/client"
import { 
  Sparkles, 
  AlertTriangle, 
  Lightbulb, 
  Shield, 
  Filter,
  ArrowUpDown,
  ExternalLink,
  CheckCircle,
  X,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"

interface AIInsight {
  id: string
  card_type: string
  insight_type: 'contextual' | 'comparative' | 'predictive' | 'recommendation'
  message: string
  detailed_analysis?: string
  recommendations: Array<{
    id: string
    title: string
    description: string
    action_type: 'quick_win' | 'strategic' | 'urgent'
    estimated_impact: string
    implementation_effort: 'low' | 'medium' | 'high'
    target_module?: string
  }>
  confidence: number
  benchmark_data?: {
    current_value: string
    sector_average: string
    best_practice: string
    percentile: string
  }
  trigger_condition: string
  created_at: string
  read?: boolean
}

const categorias = [
  { key: "todos", label: "Todos Insights" },
  { key: "recommendation", label: "Recomendações" },
  { key: "predictive", label: "Predições" },
  { key: "comparative", label: "Comparações" },
  { key: "contextual", label: "Contextuais" }
]

const tipoConfig = {
  recommendation: {
    icon: Lightbulb,
    label: "Recomendação de IA",
    colorClass: "text-blue-600 border-blue-200 bg-blue-50",
    badgeClass: "bg-blue-100 text-blue-800"
  },
  predictive: {
    icon: TrendingUp,
    label: "Predição Inteligente", 
    colorClass: "text-purple-600 border-purple-200 bg-purple-50",
    badgeClass: "bg-purple-100 text-purple-800"
  },
  comparative: {
    icon: TrendingDown,
    label: "Análise Comparativa",
    colorClass: "text-green-600 border-green-200 bg-green-50", 
    badgeClass: "bg-green-100 text-green-800"
  },
  contextual: {
    icon: Shield,
    label: "Insight Contextual",
    colorClass: "text-orange-600 border-orange-200 bg-orange-50",
    badgeClass: "bg-orange-100 text-orange-800"
  }
}

export default function IAInsights() {
  const navigate = useNavigate()
  const [filtroCategoria, setFiltroCategoria] = useState("todos")
  const [ordenacao, setOrdenacao] = useState("relevantes")
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchInsights = async () => {
    try {
      setLoading(true)
      console.log('Fetching AI insights...')

      // Get insights for different card types
      const cardTypes = [
        { type: 'esg_score', data: { overall_esg_score: 45 } },
        { type: 'emissions', data: { total_emissions: 75000 } },
        { type: 'licenses', data: { active_licenses: 5, expiring_soon: 2 } },
        { type: 'waste', data: { total_waste: 120 } }
      ]

      const allInsights: AIInsight[] = []

      for (const cardType of cardTypes) {
        try {
          const { data, error } = await supabase.functions.invoke('ai-insights-engine', {
            body: {
              card_type: cardType.type,
              card_data: cardType.data,
              context: {
                timestamp: new Date().toISOString()
              }
            }
          })

          if (error) {
            console.error(`Error fetching insights for ${cardType.type}:`, error)
            continue
          }

          if (data?.insights && Array.isArray(data.insights)) {
            allInsights.push(...data.insights)
          }
        } catch (error) {
          console.error(`Failed to fetch insights for ${cardType.type}:`, error)
        }
      }

      console.log('Fetched insights:', allInsights)
      setInsights(allInsights)

    } catch (error) {
      console.error('Error fetching insights:', error)
      toast.error('Erro ao carregar insights da IA')
    } finally {
      setLoading(false)
    }
  }

  const refreshInsights = async () => {
    setRefreshing(true)
    await fetchInsights()
    setRefreshing(false)
    toast.success('Insights atualizados!')
  }

  useEffect(() => {
    fetchInsights()
  }, [])

  const insightsFiltrados = insights
    .filter(insight => filtroCategoria === "todos" || insight.insight_type === filtroCategoria)
    .sort((a, b) => {
      if (ordenacao === "relevantes") {
        return b.confidence - a.confidence
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const marcarComoLido = (id: string) => {
    setInsights(prev => prev.map(insight => 
      insight.id === id ? { ...insight, read: true } : insight
    ))
    toast.success("Insight marcado como lido")
  }

  const dispensarInsight = (id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id))
    toast.success("Insight dispensado")
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'urgent': return AlertTriangle
      case 'strategic': return TrendingUp  
      case 'quick_win': return CheckCircle
      default: return ExternalLink
    }
  }

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'urgent': return 'text-red-600'
      case 'strategic': return 'text-blue-600'
      case 'quick_win': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const navigateToModule = (module?: string) => {
    switch (module) {
      case 'emissions':
        navigate('/inventario-gee')
        break
      case 'licenses':  
        navigate('/licenciamento')
        break
      case 'performance':
        navigate('/desempenho')
        break
      case 'goals':
        navigate('/metas')
        break
      default:
        navigate('/dashboard-ghg')
    }
  }

  const renderInsightCard = (insight: AIInsight) => {
    const config = tipoConfig[insight.insight_type] || tipoConfig.contextual
    const IconComponent = config.icon
    
    return (
      <Card 
        key={insight.id} 
        className={`relative transition-all duration-200 hover:shadow-lg ${config.colorClass} ${
          !insight.read ? 'ring-2 ring-primary/20' : ''
        }`}
      >
        {!insight.read && (
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
        )}
        
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/80">
                <IconComponent className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={config.badgeClass}>
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(insight.confidence * 100)}% confiança
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">
                  {insight.message}
                </CardTitle>
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(insight.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {insight.detailed_analysis && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.detailed_analysis}
            </p>
          )}
          
          {insight.benchmark_data && (
            <div className="p-3 bg-background/60 rounded-lg border space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Benchmark Setorial
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Atual:</span>
                  <span className="ml-2 font-medium">{insight.benchmark_data.current_value}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Média:</span>
                  <span className="ml-2 font-medium">{insight.benchmark_data.sector_average}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Percentil:</span>
                  <span className="ml-2 font-medium">{insight.benchmark_data.percentile}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Best-in-class:</span>
                  <span className="ml-2 font-medium">{insight.benchmark_data.best_practice}</span>
                </div>
              </div>
            </div>
          )}

          {insight.recommendations && insight.recommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">
                Recomendações da IA:
              </h4>
              {insight.recommendations.map((rec) => {
                const ActionIcon = getActionIcon(rec.action_type)
                return (
                  <div key={rec.id} className="p-3 bg-background/40 rounded-lg border-l-4 border-l-primary/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <ActionIcon className={`w-4 h-4 ${getActionColor(rec.action_type)}`} />
                          <h5 className="text-sm font-medium">{rec.title}</h5>
                          <Badge variant="outline" className="text-xs">
                            {rec.implementation_effort} esforço
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                        <p className="text-xs text-primary font-medium">
                          Impacto estimado: {rec.estimated_impact}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {insight.recommendations.some(r => r.target_module) && (
              <Button 
                onClick={() => navigateToModule(insight.recommendations.find(r => r.target_module)?.target_module)}
                size="sm" 
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ir para Módulo
              </Button>
            )}
            
            <Button 
              onClick={() => marcarComoLido(insight.id)}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Marcar como Lido
            </Button>
            
            <Button 
              onClick={() => dispensarInsight(insight.id)}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
              Dispensar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h1 className="text-3xl font-bold tracking-tight">Central de Inteligência & Insights</h1>
          </div>
          <p className="text-muted-foreground">
            A IA está analisando seus dados para gerar insights personalizados...
          </p>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-64 h-5" />
                  </div>
                </div>
                <Skeleton className="w-full h-16" />
                <div className="flex gap-2">
                  <Skeleton className="w-24 h-8" />
                  <Skeleton className="w-20 h-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Central de Inteligência & Insights</h1>
            </div>
            <Button 
              onClick={refreshInsights} 
              disabled={refreshing}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Nossa IA GPT-4o analisa seus dados em tempo real para gerar insights acionáveis e recomendações personalizadas.
          </p>
        </div>

        {/* Controles de Filtragem */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4" />
                Filtrar por Tipo
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
                      {categoria.key === "todos" 
                        ? insights.length 
                        : insights.filter(i => i.insight_type === categoria.key).length
                      }
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
                  <SelectItem value="relevantes">Maior Confiança</SelectItem>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-muted rounded-full">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Nenhum insight encontrado</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      {insights.length === 0 
                        ? "A IA está processando seus dados. Novos insights aparecerão em breve."
                        : "Tente ajustar os filtros para ver insights de diferentes tipos."
                      }
                    </p>
                    {insights.length === 0 && (
                      <Button 
                        onClick={refreshInsights} 
                        className="mt-4"
                        disabled={refreshing}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar Análise
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }