import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart, TrendingUp, Award, Users, Building } from "lucide-react"

interface BenchmarkComparisonProps {
  currentValue: number
  sector: string
  metric: string
}

export function BenchmarkComparison({ currentValue, sector, metric }: BenchmarkComparisonProps) {
  // Mock benchmark data - in real app this would come from API
  const benchmarkData = {
    sectorAverage: 920,
    top10Percent: 650,
    median: 980,
    top25Percent: 750,
    worst25Percent: 1200,
    companiesInSector: 347,
    yourRanking: 82 // percentile ranking
  }

  const formatMetric = (value: number): string => {
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

  // Calculate position relative to benchmarks
  const getPerformanceLevel = () => {
    if (currentValue <= benchmarkData.top10Percent) {
      return { level: 'excellent', label: 'Top 10%', color: 'success' }
    } else if (currentValue <= benchmarkData.top25Percent) {
      return { level: 'good', label: 'Top 25%', color: 'success' }
    } else if (currentValue <= benchmarkData.sectorAverage) {
      return { level: 'above-average', label: 'Acima da Média', color: 'primary' }
    } else if (currentValue <= benchmarkData.median) {
      return { level: 'average', label: 'Na Média', color: 'warning' }
    } else {
      return { level: 'below-average', label: 'Abaixo da Média', color: 'destructive' }
    }
  }

  const performance = getPerformanceLevel()

  // Calculate improvement potential
  const improvementToTop25 = currentValue - benchmarkData.top25Percent
  const improvementToTop10 = currentValue - benchmarkData.top10Percent

  const benchmarks = [
    {
      label: 'Top 10%',
      value: benchmarkData.top10Percent,
      icon: Award,
      color: 'text-success',
      description: 'Líderes do setor'
    },
    {
      label: 'Top 25%',
      value: benchmarkData.top25Percent,
      icon: TrendingUp,
      color: 'text-primary',
      description: 'Bom desempenho'
    },
    {
      label: 'Média Setorial',
      value: benchmarkData.sectorAverage,
      icon: Users,
      color: 'text-muted-foreground',
      description: `${sector}`
    },
    {
      label: 'Mediana',
      value: benchmarkData.median,
      icon: BarChart,
      color: 'text-muted-foreground',
      description: '50% das empresas'
    }
  ]

  // Sort benchmarks for display
  const sortedBenchmarks = benchmarks.sort((a, b) => a.value - b.value)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          Benchmark Setorial - {sector}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={`bg-${performance.color} text-${performance.color}-foreground`}>
            {performance.label}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Posição: {benchmarkData.yourRanking}º percentil
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Position */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Sua Posição</span>
            <span className="font-bold text-lg">{formatMetric(currentValue)}</span>
          </div>
          <div className="relative">
            <Progress 
              value={(benchmarkData.yourRanking / 100) * 100} 
              className="h-3"
            />
            <div className="absolute top-0 left-0 w-full h-3 flex items-center justify-center">
              <span className="text-xs font-medium text-background">
                {benchmarkData.yourRanking}º percentil
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Entre {benchmarkData.companiesInSector} empresas do setor {sector}
          </p>
        </div>

        {/* Benchmarks List */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Referências do Setor</h4>
          <div className="space-y-2">
            {sortedBenchmarks.map((benchmark, index) => {
              const Icon = benchmark.icon
              const isYourLevel = (
                (performance.level === 'excellent' && benchmark.label === 'Top 10%') ||
                (performance.level === 'good' && benchmark.label === 'Top 25%') ||
                (performance.level === 'above-average' && benchmark.label === 'Média Setorial') ||
                (performance.level === 'average' && benchmark.label === 'Mediana')
              )

              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isYourLevel ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${benchmark.color}`} />
                    <div>
                      <div className="font-medium text-sm">{benchmark.label}</div>
                      <div className="text-xs text-muted-foreground">{benchmark.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatMetric(benchmark.value)}</div>
                    {benchmark.value !== currentValue && (
                      <div className={`text-xs ${
                        benchmark.value < currentValue ? 'text-success' : 'text-muted-foreground'
                      }`}>
                        {benchmark.value < currentValue ? 
                          `${formatMetric(currentValue - benchmark.value)} atrás` :
                          `${formatMetric(benchmark.value - currentValue)} à frente`
                        }
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Improvement Potential */}
        {improvementToTop25 > 0 && (
          <div className="bg-muted/50 rounded-lg p-3">
            <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Potencial de Melhoria
            </h4>
            <div className="space-y-2 text-sm">
              {improvementToTop25 > 0 && (
                <div>
                  <span className="text-muted-foreground">Para Top 25%: </span>
                  <span className="font-medium text-success">
                    reduzir {formatMetric(improvementToTop25)}
                  </span>
                </div>
              )}
              {improvementToTop10 > 0 && (
                <div>
                  <span className="text-muted-foreground">Para Top 10%: </span>
                  <span className="font-medium text-success">
                    reduzir {formatMetric(improvementToTop10)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sector Insights */}
        <div className="bg-primary/5 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2">Insights do Setor</h4>
          <p className="text-xs text-muted-foreground">
            {performance.level === 'excellent' ? 
              `Parabéns! Você está entre os líderes do setor ${sector}. Continue investindo em inovação para manter a posição.` :
              performance.level === 'good' ?
              `Bom desempenho no setor ${sector}. Com esforço adicional, você pode alcançar o top 10%.` :
              `Há oportunidade de melhoria significativa no setor ${sector}. Considere benchmarking com líderes.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}