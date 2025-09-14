import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ComposedChart, Line, Area, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Bar } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WaterfallChartProps {
  data: {
    baseline: { value: number; date: string }
    current: { value: number; date: string }
    target: { value: number; date: string }
    historicalData: Array<{ date: string; value: number; percentage: number }>
    projectedData: Array<{ date: string; value: number; confidence: number }>
  }
  period: string
  metric: string
}

const chartConfig = {
  historical: {
    label: "Histórico",
    color: "hsl(var(--primary))",
  },
  projected: {
    label: "Projeção",
    color: "hsl(var(--muted-foreground))",
  },
  target: {
    label: "Meta",
    color: "hsl(var(--success))",
  },
  baseline: {
    label: "Baseline",
    color: "hsl(var(--destructive))",
  },
}

export function WaterfallChart({ data, period, metric }: WaterfallChartProps) {
  // Combine historical and projected data for the chart
  const combinedData = [
    ...data.historicalData.map(item => ({
      ...item,
      type: 'historical',
      projected: null,
      confidence: null
    })),
    ...data.projectedData.map(item => ({
      ...item,
      type: 'projected',
      percentage: ((data.baseline.value - item.value) / (data.baseline.value - data.target.value)) * 100
    }))
  ]

  // Add target and baseline reference points
  const chartData = combinedData.map(item => ({
    ...item,
    target: data.target.value,
    baseline: data.baseline.value,
    formatValue: formatMetric(item.value),
    formatTarget: formatMetric(data.target.value),
    formatBaseline: formatMetric(data.baseline.value),
  }))

  function formatMetric(value: number): string {
    // Verificar se metric existe antes de usar .includes()
    if (!metric) {
      return value.toLocaleString()
    }
    
    if (metric.includes('CO2') || metric.includes('emiss') || metric.includes('ghg')) {
      return `${value.toLocaleString()} tCO₂e`
    }
    if (metric.includes('%') || metric.includes('percent')) {
      return `${value}%`
    }
    if (metric.includes('waste') || metric.includes('residuo')) {
      return `${value.toLocaleString()} kg`
    }
    if (metric.includes('energy') || metric.includes('energia')) {
      return `${value.toLocaleString()} kWh`
    }
    return value.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + '-01')
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Trilha de Progresso - {metric}
          <span className="text-sm font-normal text-muted-foreground">
            (Waterfall Analysis)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ComposedChart data={chartData}>
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tickFormatter={(value) => formatMetric(value)}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Target Line */}
            <ReferenceLine 
              y={data.target.value} 
              stroke="hsl(var(--success))"
              strokeDasharray="8 8"
              strokeWidth={2}
              label={{ value: "Meta", position: "top", fill: "hsl(var(--success))" }}
            />
            
            {/* Baseline Line */}
            <ReferenceLine 
              y={data.baseline.value} 
              stroke="hsl(var(--destructive))"
              strokeDasharray="8 8"
              strokeWidth={2}
              label={{ value: "Baseline", position: "top", fill: "hsl(var(--destructive))" }}
            />

            {/* Safe zone area (between current trajectory and target) */}
            <Area
              dataKey="value"
              fill="hsl(var(--success) / 0.1)"
              stroke="none"
            />

            {/* Historical progress line */}
            <Line
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
              connectNulls={false}
            />

            {/* Projected progress line (dashed) */}
            <Line
              dataKey="value"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 0, r: 3 }}
              connectNulls={false}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: any, name: string) => {
                    if (name === 'value') {
                      return [formatMetric(value), 'Valor']
                    }
                    return [value, name]
                  }}
                />
              }
            />
          </ComposedChart>
        </ChartContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-primary rounded"></div>
            <span>Progresso Real</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-muted-foreground rounded border-dashed border border-muted-foreground"></div>
            <span>Projeção</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-success rounded border-dashed border border-success"></div>
            <span>Meta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-destructive rounded border-dashed border border-destructive"></div>
            <span>Baseline</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}