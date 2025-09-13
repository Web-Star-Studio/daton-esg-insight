import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WaterfallChart } from "./WaterfallChart"
import { TargetTimelineChart } from "./TargetTimelineChart"
import { GapAnalysisCard } from "./GapAnalysisCard"
import { ProjectionInsights } from "./ProjectionInsights"
import { BenchmarkComparison } from "./BenchmarkComparison"
import { Target, TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react"
import { useState } from "react"

interface TargetTrackingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: any
}

export function TargetTrackingModal({ open, onOpenChange, goal }: TargetTrackingModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  
  if (!goal) return null

  // Mock data for demonstration
  const targetData = {
    baseline: { value: 1000, date: "2023-01-01" },
    current: { value: 850, date: "2024-12-01" },
    target: { value: 500, date: "2030-12-31" },
    historicalData: [
      { date: "2023-01", value: 1000, percentage: 0 },
      { date: "2023-04", value: 950, percentage: 5 },
      { date: "2023-07", value: 920, percentage: 8 },
      { date: "2023-10", value: 900, percentage: 10 },
      { date: "2024-01", value: 880, percentage: 12 },
      { date: "2024-04", value: 870, percentage: 13 },
      { date: "2024-07", value: 860, percentage: 14 },
      { date: "2024-10", value: 850, percentage: 15 },
    ],
    projectedData: [
      { date: "2025-01", value: 840, confidence: 0.9 },
      { date: "2026-01", value: 780, confidence: 0.8 },
      { date: "2027-01", value: 720, confidence: 0.7 },
      { date: "2028-01", value: 660, confidence: 0.6 },
      { date: "2029-01", value: 600, confidence: 0.5 },
      { date: "2030-01", value: 550, confidence: 0.4 },
    ],
    milestones: [
      { date: "2025-12-31", target: 800, description: "Milestone 1: 20% reduction" },
      { date: "2027-12-31", target: 700, description: "Milestone 2: 30% reduction" },
      { date: "2030-12-31", target: 500, description: "Final Goal: 50% reduction" },
    ]
  }

  const currentProgress = ((targetData.baseline.value - targetData.current.value) / (targetData.baseline.value - targetData.target.value)) * 100
  const expectedProgress = 25 // Based on timeline
  const status = currentProgress >= expectedProgress * 0.95 ? "on-track" : 
                currentProgress >= expectedProgress * 0.8 ? "attention" : "risk"

  const getStatusBadge = () => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-success text-success-foreground">🟢 No Caminho Certo</Badge>
      case "attention":
        return <Badge className="bg-warning text-warning-foreground">🟡 Atenção Necessária</Badge>
      case "risk":
        return <Badge variant="destructive">🔴 Risco Alto</Badge>
    }
  }

  const formatMetric = (value: number) => {
    if (goal.metric.includes('CO2') || goal.metric.includes('emiss')) {
      return `${value.toLocaleString()} tCO₂e`
    }
    if (goal.metric.includes('%') || goal.metric.includes('percent')) {
      return `${value}%`
    }
    return value.toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-xl">{goal.name}</DialogTitle>
                <p className="text-muted-foreground mt-1">
                  {formatMetric(targetData.baseline.value)} → {formatMetric(targetData.target.value)} até {new Date(targetData.target.date).getFullYear()}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Status Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Progresso Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentProgress.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">
                  {formatMetric(targetData.current.value)} atual
                </div>
                <div className="flex items-center text-sm mt-2">
                  {currentProgress > expectedProgress ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-success mr-1" />
                      <span className="text-success">Acima do esperado</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                      <span className="text-destructive">Abaixo do esperado</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Próximo Marco</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{formatMetric(targetData.milestones[0].target)}</div>
                <div className="text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {new Date(targetData.milestones[0].date).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-sm mt-2">
                  Faltam {Math.ceil((new Date(targetData.milestones[0].date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))} meses
                </div>
              </CardContent>
            </Card>

            <GapAnalysisCard 
              current={targetData.current.value}
              expected={targetData.baseline.value - (expectedProgress / 100 * (targetData.baseline.value - targetData.target.value))}
              target={targetData.target.value}
              metric={goal.metric}
            />
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="6m">6 Meses</TabsTrigger>
                  <TabsTrigger value="1y">1 Ano</TabsTrigger>
                  <TabsTrigger value="all">Histórico Completo</TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm">
                  Simular Cenários
                </Button>
              </div>

              <TabsContent value={selectedPeriod} className="space-y-6 mt-6">
                <WaterfallChart 
                  data={targetData}
                  period={selectedPeriod}
                  metric={goal.metric}
                />
                
                <TargetTimelineChart 
                  data={targetData}
                  milestones={targetData.milestones}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Section - Insights and Benchmarks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <ProjectionInsights 
            data={targetData}
            currentStatus={status}
            goal={goal}
          />
          
          <BenchmarkComparison 
            currentValue={targetData.current.value}
            sector="Manufatura"
            metric={goal.metric}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}