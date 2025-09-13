import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingDown, TrendingUp, Target } from "lucide-react"

interface GapAnalysisCardProps {
  current: number
  expected: number
  target: number
  metric: string
}

export function GapAnalysisCard({ current, expected, target, metric }: GapAnalysisCardProps) {
  const gap = Math.abs(current - expected)
  const gapPercentage = (gap / Math.abs(target - expected)) * 100
  const isAhead = current < expected // For emissions, lower is better
  const progressToTarget = ((Math.abs(target - current) / Math.abs(target - expected)) * 100)
  
  const formatMetric = (value: number): string => {
    if (metric.includes('CO2') || metric.includes('emiss')) {
      return `${value.toLocaleString()} tCO₂e`
    }
    if (metric.includes('%') || metric.includes('percent')) {
      return `${value}%`
    }
    return value.toLocaleString()
  }

  const getGapSeverity = () => {
    if (gapPercentage < 5) return { level: 'low', color: 'success', label: 'Pequeno' }
    if (gapPercentage < 15) return { level: 'medium', color: 'warning', label: 'Médio' }
    return { level: 'high', color: 'destructive', label: 'Alto' }
  }

  const severity = getGapSeverity()

  const getRequiredAcceleration = () => {
    if (isAhead) return null
    const timeRemaining = 72 // months until 2030 (example)
    const currentRate = (Math.abs(target - current) / timeRemaining) 
    const requiredRate = gap / timeRemaining
    const accelerationNeeded = ((requiredRate / currentRate) - 1) * 100
    return Math.round(accelerationNeeded)
  }

  const acceleration = getRequiredAcceleration()

  return (
    <Card className={`border-l-4 ${
      severity.level === 'high' ? 'border-l-destructive' :
      severity.level === 'medium' ? 'border-l-warning' : 'border-l-success'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className={`h-4 w-4 ${
            severity.level === 'high' ? 'text-destructive' :
            severity.level === 'medium' ? 'text-warning' : 'text-success'
          }`} />
          Análise de Gap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge variant={severity.color as any} className="text-xs">
            Gap {severity.label}: {gapPercentage.toFixed(1)}%
          </Badge>
          {isAhead ? (
            <Badge className="bg-success text-success-foreground text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Adiantado
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs">
              <TrendingDown className="h-3 w-3 mr-1" />
              Atrasado
            </Badge>
          )}
        </div>

        {/* Values Comparison */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor Atual:</span>
            <span className="font-medium">{formatMetric(current)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Esperado:</span>
            <span className="font-medium">{formatMetric(expected)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gap:</span>
            <span className={`font-medium ${isAhead ? 'text-success' : 'text-destructive'}`}>
              {isAhead ? '-' : '+'}{formatMetric(gap)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso para Meta</span>
            <span>{progressToTarget.toFixed(0)}%</span>
          </div>
          <Progress 
            value={Math.min(progressToTarget, 100)} 
            className="h-2"
          />
        </div>

        {/* Action Required */}
        {!isAhead && acceleration && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Target className="h-4 w-4 text-primary" />
              Ação Necessária
            </div>
            <p className="text-xs text-muted-foreground">
              Acelerar progresso em <span className="font-medium text-foreground">{acceleration}%</span> para atingir a meta no prazo.
            </p>
          </div>
        )}

        {isAhead && (
          <div className="bg-success/10 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm font-medium mb-1 text-success">
              <TrendingUp className="h-4 w-4" />
              Parabéns!
            </div>
            <p className="text-xs text-muted-foreground">
              Você está {formatMetric(gap)} à frente do cronograma planejado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}