import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, Lightbulb } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface PredictionItem {
  id: string
  type: 'goal' | 'license' | 'emission' | 'compliance'
  title: string
  prediction: string
  confidence: number
  timeframe: string
  impact: 'high' | 'medium' | 'low'
  trend: 'positive' | 'negative' | 'neutral'
  actionable: boolean
  dueDate?: Date
}

const getPredictiveInsights = async (): Promise<PredictionItem[]> => {
  try {
    // Fetch goals approaching deadline
    const { data: goals } = await supabase
      .from('goals')
      .select(`
        *,
        goal_progress_updates (
          current_value,
          progress_percentage,
          update_date
        )
      `)
      .order('deadline_date', { ascending: true })
      .limit(5)

    // Fetch licenses expiring soon
    const { data: licenses } = await supabase
      .from('licenses')
      .select('*')
      .gte('expiration_date', new Date().toISOString())
      .order('expiration_date', { ascending: true })
      .limit(5)

    // Fetch recent emissions data for trend analysis
    const { data: emissions } = await supabase
      .from('calculated_emissions')
      .select('*, activity_data(emission_sources(*))')
      .order('calculation_date', { ascending: false })
      .limit(10)

    const predictions: PredictionItem[] = []

    // Generate goal predictions
    goals?.forEach((goal, index) => {
      const daysUntilDeadline = Math.ceil(
        (new Date(goal.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const progress = goal.goal_progress_updates?.[0]?.progress_percentage || 0
      const confidence = Math.min(95, 60 + (progress * 0.3))
      
      let prediction = ''
      let trend: 'positive' | 'negative' | 'neutral' = 'neutral'
      
      if (daysUntilDeadline < 30 && progress < 80) {
        prediction = `Meta em risco de atraso. Necessária aceleração do progresso.`
        trend = 'negative'
      } else if (progress > 80) {
        prediction = `Meta no caminho certo para ser concluída antes do prazo.`
        trend = 'positive'
      } else {
        prediction = `Meta requer monitoramento constante para manter o cronograma.`
        trend = 'neutral'
      }

      predictions.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        title: goal.name,
        prediction,
        confidence,
        timeframe: `${daysUntilDeadline} dias`,
        impact: daysUntilDeadline < 30 ? 'high' : 'medium',
        trend,
        actionable: trend === 'negative',
        dueDate: new Date(goal.deadline_date)
      })
    })

    // Generate license predictions
    licenses?.forEach((license) => {
      const daysUntilExpiration = Math.ceil(
        (new Date(license.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysUntilExpiration < 90) {
        predictions.push({
          id: `license-${license.id}`,
          type: 'license',
          title: license.name,
          prediction: `Renovação necessária em breve. Iniciar processo de renovação.`,
          confidence: 90,
          timeframe: `${daysUntilExpiration} dias`,
          impact: daysUntilExpiration < 30 ? 'high' : 'medium',
          trend: 'negative',
          actionable: true,
          dueDate: new Date(license.expiration_date)
        })
      }
    })

    // Generate emission trend predictions
    if (emissions && emissions.length >= 3) {
      const recent = emissions.slice(0, 3)
      const totalRecent = recent.reduce((sum, e) => sum + (e.total_co2e || 0), 0)
      const older = emissions.slice(3, 6)
      const totalOlder = older.reduce((sum, e) => sum + (e.total_co2e || 0), 0)
      
      if (totalRecent > totalOlder * 1.1) {
        predictions.push({
          id: 'emission-trend',
          type: 'emission',
          title: 'Tendência de Emissões',
          prediction: 'Aumento nas emissões detectado. Revisar fontes e implementar medidas de redução.',
          confidence: 75,
          timeframe: 'Próximos 30 dias',
          impact: 'high',
          trend: 'negative',
          actionable: true
        })
      } else if (totalRecent < totalOlder * 0.9) {
        predictions.push({
          id: 'emission-trend',
          type: 'emission',
          title: 'Tendência de Emissões',
          prediction: 'Redução nas emissões observada. Manter práticas atuais.',
          confidence: 80,
          timeframe: 'Próximos 30 dias',
          impact: 'medium',
          trend: 'positive',
          actionable: false
        })
      }
    }

    return predictions.sort((a, b) => {
      if (a.impact !== b.impact) {
        const impactOrder = { high: 3, medium: 2, low: 1 }
        return impactOrder[b.impact] - impactOrder[a.impact]
      }
      return a.confidence > b.confidence ? -1 : 1
    })

  } catch (error) {
    console.error('Error generating predictions:', error)
    return []
  }
}

export function PredictiveDashboard() {
  const { data: predictions = [], isLoading, error } = useQuery({
    queryKey: ['predictive-insights'],
    queryFn: getPredictiveInsights,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-destructive text-destructive-foreground'
      case 'medium':
        return 'bg-warning text-warning-foreground'
      case 'low':
        return 'bg-accent text-accent-foreground'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return <Target className="h-4 w-4" />
      case 'license':
        return <Calendar className="h-4 w-4" />
      case 'emission':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights Preditivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar insights preditivos. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Insights Preditivos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Análises baseadas em IA para antecipar tendências e riscos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum insight preditivo disponível no momento</p>
            <p className="text-sm">Continue coletando dados para gerar previsões</p>
          </div>
        ) : (
          predictions.map((prediction) => (
            <div key={prediction.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(prediction.type)}
                  <h4 className="font-medium">{prediction.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(prediction.trend)}
                  <Badge className={getImpactColor(prediction.impact)}>
                    {prediction.impact}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {prediction.prediction}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Prazo: {prediction.timeframe}</span>
                  {prediction.dueDate && (
                    <span>Vencimento: {prediction.dueDate.toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confiança:</span>
                  <Progress value={prediction.confidence} className="w-20 h-2" />
                  <span className="text-xs font-medium">{prediction.confidence}%</span>
                </div>
              </div>
              
              {prediction.actionable && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Ação recomendada: Esta previsão indica necessidade de intervenção
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}