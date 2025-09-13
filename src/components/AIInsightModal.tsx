import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  ExternalLink,
  Lightbulb,
  Target,
  Clock
} from "lucide-react"
import { AIInsight, AIRecommendation } from "@/services/aiInsights"
import { useNavigate } from "react-router-dom"

interface AIInsightModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight: AIInsight | null
}

export function AIInsightModal({ open, onOpenChange, insight }: AIInsightModalProps) {
  const navigate = useNavigate()

  if (!insight) return null

  const getInsightIcon = () => {
    switch (insight.insight_type) {
      case 'contextual':
        return <Brain className="h-5 w-5 text-primary" />
      case 'comparative':
        return <TrendingUp className="h-5 w-5 text-accent" />
      case 'predictive':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-success" />
      default:
        return <Brain className="h-5 w-5 text-primary" />
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'quick_win':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'strategic':
        return <Target className="h-4 w-4 text-primary" />
      case 'urgent':
        return <Clock className="h-4 w-4 text-destructive" />
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'bg-success/10 text-success border-success/20'
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20'
    }
  }

  const handleActionClick = (recommendation: AIRecommendation) => {
    if (recommendation.target_module) {
      navigate(recommendation.target_module)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getInsightIcon()}
            <span>Insights da IA</span>
            <Badge variant="secondary" className="ml-auto">
              {Math.round(insight.confidence * 100)}% confiança
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Insight Principal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{insight.message}</CardTitle>
            </CardHeader>
            {insight.detailed_analysis && (
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.detailed_analysis}
                </p>
              </CardContent>
            )}
          </Card>

          {/* Dados de Benchmark */}
          {insight.benchmark_data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Comparação Setorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sua Performance:</span>
                    <p className="font-semibold">{insight.benchmark_data.current_value}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Média Setorial:</span>
                    <p className="font-semibold">{insight.benchmark_data.sector_average}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Melhor Prática:</span>
                    <p className="font-semibold">{insight.benchmark_data.best_practice}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Posição:</span>
                    <p className="font-semibold">{insight.benchmark_data.percentile}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recomendações */}
          {insight.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                Ações Recomendadas
              </h3>
              
              <div className="space-y-3">
                {insight.recommendations.map((recommendation, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getActionIcon(recommendation.action_type)}
                            <h4 className="font-medium">{recommendation.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={getEffortColor(recommendation.implementation_effort)}
                            >
                              {recommendation.implementation_effort === 'low' && 'Baixo Esforço'}
                              {recommendation.implementation_effort === 'medium' && 'Médio Esforço'}
                              {recommendation.implementation_effort === 'high' && 'Alto Esforço'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {recommendation.description}
                          </p>
                          
                          <p className="text-xs text-success font-medium">
                            Impacto estimado: {recommendation.estimated_impact}
                          </p>
                        </div>
                        
                        {recommendation.target_module && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActionClick(recommendation)}
                            className="ml-4"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}