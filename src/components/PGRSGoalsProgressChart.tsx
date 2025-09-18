import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { PGRSGoal } from "@/services/pgrs"

interface PGRSGoalsProgressChartProps {
  goals: PGRSGoal[]
  title?: string
}

export const PGRSGoalsProgressChart = ({ goals, title = "Progresso das Metas PGRS" }: PGRSGoalsProgressChartProps) => {
  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <TrendingUp className="h-4 w-4 text-success" />
    if (progress >= 75) return <TrendingUp className="h-4 w-4 text-primary" />
    if (progress >= 50) return <Target className="h-4 w-4 text-warning" />
    if (progress >= 25) return <TrendingDown className="h-4 w-4 text-warning" />
    return <AlertTriangle className="h-4 w-4 text-destructive" />
  }

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return "bg-success"
    if (progress >= 75) return "bg-primary"
    if (progress >= 50) return "bg-warning"
    if (progress >= 25) return "bg-warning"
    return "bg-destructive"
  }

  const getStatusText = (progress: number) => {
    if (progress >= 100) return "Concluída"
    if (progress >= 75) return "Em Progresso"
    if (progress >= 50) return "Moderado"
    if (progress >= 25) return "Atrasado"
    return "Crítico"
  }

  const getStatusVariant = (progress: number) => {
    if (progress >= 100) return "default"
    if (progress >= 75) return "secondary"
    if (progress >= 50) return "outline"
    return "destructive"
  }

  if (!goals || goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma meta PGRS foi definida ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(goal.progress_percentage)}
                  <h4 className="font-medium">{goal.goal_type}</h4>
                  <Badge variant={getStatusVariant(goal.progress_percentage)}>
                    {getStatusText(goal.progress_percentage)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Baseline: {goal.baseline_value} {goal.unit} → Meta: {goal.target_value} {goal.unit}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round(goal.progress_percentage)}%</div>
                <div className="text-sm text-muted-foreground">
                  Atual: {goal.current_value} {goal.unit}
                </div>
              </div>
            </div>
            
            <Progress 
              value={goal.progress_percentage} 
              className="h-2"
              style={{
                backgroundColor: "hsl(var(--muted))"
              }}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
              <span>
                Status: {goal.status}
              </span>
            </div>
          </div>
        ))}
        
        {/* Summary Statistics */}
        <div className="border-t pt-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {goals.filter(g => g.progress_percentage >= 100).length}
              </div>
              <div className="text-xs text-muted-foreground">Concluídas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {goals.filter(g => g.progress_percentage >= 75 && g.progress_percentage < 100).length}
              </div>
              <div className="text-xs text-muted-foreground">Em Progresso</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {goals.filter(g => g.progress_percentage >= 25 && g.progress_percentage < 75).length}
              </div>
              <div className="text-xs text-muted-foreground">Atenção</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {goals.filter(g => g.progress_percentage < 25).length}
              </div>
              <div className="text-xs text-muted-foreground">Críticas</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}