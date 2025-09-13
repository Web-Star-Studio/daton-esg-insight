import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Dot } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Target, CheckCircle } from "lucide-react"

interface Milestone {
  date: string
  target: number
  description: string
}

interface TargetTimelineChartProps {
  data: {
    baseline: { value: number; date: string }
    current: { value: number; date: string }
    target: { value: number; date: string }
    historicalData: Array<{ date: string; value: number; percentage: number }>
  }
  milestones: Milestone[]
}

const chartConfig = {
  progress: {
    label: "Progresso",
    color: "hsl(var(--primary))",
  },
  milestones: {
    label: "Marcos",
    color: "hsl(var(--success))",
  },
}

export function TargetTimelineChart({ data, milestones }: TargetTimelineChartProps) {
  // Create timeline data with milestones
  const timelineData = []
  
  // Add historical data points
  data.historicalData.forEach(point => {
    timelineData.push({
      date: point.date,
      value: point.value,
      type: 'historical',
      isMilestone: false
    })
  })

  // Add milestone points
  milestones.forEach(milestone => {
    const milestoneDate = milestone.date.substring(0, 7) // Get YYYY-MM format
    timelineData.push({
      date: milestoneDate,
      value: milestone.target,
      type: 'milestone',
      isMilestone: true,
      description: milestone.description
    })
  })

  // Sort by date
  timelineData.sort((a, b) => new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime())

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + '-01')
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  const formatValue = (value: number) => {
    return `${value.toLocaleString()} tCO₂e`
  }

  const MilestoneCustomDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.isMilestone) {
      return (
        <g>
          <Dot cx={cx} cy={cy} r={6} fill="hsl(var(--success))" stroke="hsl(var(--background))" strokeWidth={2} />
          <Target x={cx - 6} y={cy - 6} width={12} height={12} className="text-background" />
        </g>
      )
    }
    return <Dot cx={cx} cy={cy} r={3} fill="hsl(var(--primary))" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline de Marcos
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {milestones.length} marcos definidos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={timelineData}>
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={formatValue}
              axisLine={false}
              tickLine={false}
            />
            
            <Line
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={<MilestoneCustomDot />}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: any, name: string, props: any) => {
                    if (props.payload.isMilestone) {
                      return [
                        <div key="milestone" className="space-y-1">
                          <div className="font-medium">Marco: {formatValue(value)}</div>
                          <div className="text-xs text-muted-foreground">
                            {props.payload.description}
                          </div>
                        </div>
                      ]
                    }
                    return [formatValue(value), 'Valor Atual']
                  }}
                />
              }
            />
          </LineChart>
        </ChartContainer>

        {/* Milestones List */}
        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-sm">Próximos Marcos</h4>
          <div className="space-y-2">
            {milestones.slice(0, 3).map((milestone, index) => {
              const isUpcoming = new Date(milestone.date) > new Date()
              const monthsUntil = isUpcoming ? 
                Math.ceil((new Date(milestone.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 
                null
              
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isUpcoming ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                    }`}>
                      {isUpcoming ? (
                        <Target className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{milestone.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatValue(milestone.target)} até {new Date(milestone.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {isUpcoming && monthsUntil ? (
                      <Badge variant="outline" className="text-xs">
                        {monthsUntil} {monthsUntil === 1 ? 'mês' : 'meses'}
                      </Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground text-xs">
                        Concluído
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}