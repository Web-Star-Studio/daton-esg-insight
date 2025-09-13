import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react"
import { useState } from "react"

interface ProjectionInsightsProps {
  data: {
    baseline: { value: number; date: string }
    current: { value: number; date: string }
    target: { value: number; date: string }
    projectedData: Array<{ date: string; value: number; confidence: number }>
  }
  currentStatus: 'on-track' | 'attention' | 'risk'
  goal: any
}

export function ProjectionInsights({ data, currentStatus, goal }: ProjectionInsightsProps) {
  const [showAllRecommendations, setShowAllRecommendations] = useState(false)

  // Calculate projections and insights
  const finalProjection = data.projectedData[data.projectedData.length - 1]
  const targetAchievement = ((data.baseline.value - finalProjection.value) / (data.baseline.value - data.target.value)) * 100
  const willMeetTarget = targetAchievement >= 95
  
  // Calculate trend
  const recentData = data.projectedData.slice(-3)
  const trend = recentData.length > 1 ? 
    (recentData[recentData.length - 1].value - recentData[0].value) / recentData[0].value * 100 : 0

  const formatMetric = (value: number): string => {
    if (goal.metric.includes('CO2') || goal.metric.includes('emiss')) {
      return `${value.toLocaleString()} tCO₂e`
    }
    if (goal.metric.includes('%') || goal.metric.includes('percent')) {
      return `${value}%`
    }
    return value.toLocaleString()
  }

  // AI-generated insights based on status
  const getInsights = () => {
    const baseInsights = [
      {
        type: 'projection',
        title: 'Projeção de Atingimento',
        content: `Com base na tendência atual, você alcançará ${targetAchievement.toFixed(0)}% da meta até 2030.`,
        severity: willMeetTarget ? 'success' : targetAchievement > 80 ? 'warning' : 'error',
        confidence: finalProjection.confidence
      },
      {
        type: 'trend',
        title: 'Análise de Tendência',
        content: trend > 0 ? 
          `Tendência de desaceleração detectada (${Math.abs(trend).toFixed(1)}% nos últimos trimestres).` :
          `Bom progresso mantido com aceleração de ${Math.abs(trend).toFixed(1)}%.`,
        severity: trend > 0 ? 'warning' : 'success',
        confidence: 0.8
      }
    ]

    if (currentStatus === 'risk') {
      baseInsights.push({
        type: 'alert',
        title: 'Atenção Crítica',
        content: `Risco alto de não atingir a meta. Intervenção imediata necessária.`,
        severity: 'error',
        confidence: 0.9
      })
    }

    return baseInsights
  }

  // AI-generated recommendations
  const getRecommendations = () => {
    const recs = []
    
    if (currentStatus === 'risk' || !willMeetTarget) {
      recs.push(
        {
          title: 'Auditoria Energética Urgente',
          description: 'Identificar e corrigir vazamentos e ineficiências nos sistemas.',
          impact: 'Alto',
          effort: 'Médio',
          timeframe: '3-6 meses',
          module: 'auditoria'
        },
        {
          title: 'Aceleração de Energia Renovável',
          description: 'Expandir projeto de energia solar ou contratar energia limpa.',
          impact: 'Alto', 
          effort: 'Alto',
          timeframe: '6-12 meses',
          module: 'projetos-carbono'
        }
      )
    }

    if (currentStatus === 'attention') {
      recs.push(
        {
          title: 'Otimização de Processos',
          description: 'Implementar melhorias em equipamentos e processos produtivos.',
          impact: 'Médio',
          effort: 'Médio', 
          timeframe: '3-9 meses',
          module: 'performance'
        }
      )
    }

    recs.push(
      {
        title: 'Monitoramento Inteligente',
        description: 'Instalar sensores IoT para monitoramento em tempo real.',
        impact: 'Médio',
        effort: 'Baixo',
        timeframe: '1-3 meses',
        module: 'coleta-dados'
      }
    )

    return recs
  }

  const insights = getInsights()
  const recommendations = getRecommendations()

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'Baixo': return 'bg-success text-success-foreground'
      case 'Médio': return 'bg-warning text-warning-foreground'
      case 'Alto': return 'bg-destructive text-destructive-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success': return <TrendingUp className="h-4 w-4 text-success" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />
      default: return <Brain className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Insights da IA & Projeções
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Projection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Probabilidade de Atingir Meta</span>
            <Badge className={willMeetTarget ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>
              {targetAchievement.toFixed(0)}%
            </Badge>
          </div>
          <Progress value={Math.min(targetAchievement, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Projeção baseada na tendência dos últimos 12 meses (confiança: {(finalProjection.confidence * 100).toFixed(0)}%)
          </p>
        </div>

        {/* AI Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Análises Inteligentes
          </h4>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                {getSeverityIcon(insight.severity)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{insight.title}</div>
                  <p className="text-xs text-muted-foreground mt-1">{insight.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Confiança: {(insight.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Ações Recomendadas</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAllRecommendations(!showAllRecommendations)}
            >
              {showAllRecommendations ? 'Menos' : 'Ver Todas'}
            </Button>
          </div>
          <div className="space-y-2">
            {(showAllRecommendations ? recommendations : recommendations.slice(0, 2)).map((rec, index) => (
              <div key={index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{rec.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getEffortColor(rec.effort) + " text-xs"}>
                        {rec.effort}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.timeframe}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="shrink-0"
                    onClick={() => {
                      // Navigate to relevant module
                      console.log('Navigate to:', rec.module)
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}