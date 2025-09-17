import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { BenchmarkComparisonWidget } from "./BenchmarkComparisonWidget";
import { EmissionHotspots } from "./EmissionHotspots";
import { TrendAnalysisChart } from "./TrendAnalysisChart";
import { ScenarioSimulator } from "./ScenarioSimulator";
import { GoalTrackingWidget } from "./GoalTrackingWidget";
import { IntelligentInsights } from "./IntelligentInsights";
import { useSmartCache } from "@/hooks/useSmartCache";
import { getAdvancedEmissionAnalytics } from "@/services/advancedAnalytics";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2 
} from "lucide-react";

interface EmissionInsightsDashboardProps {
  dateRange?: { from: Date; to: Date };
  emissionData: any[];
}

export function EmissionInsightsDashboard({ dateRange, emissionData }: EmissionInsightsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("12months");

  const { data: analyticsData, isLoading } = useSmartCache({
    queryKey: ['advanced-analytics', selectedPeriod],
    queryFn: () => getAdvancedEmissionAnalytics(selectedPeriod),
    priority: 'high',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const insights = analyticsData?.insights || [];
  const recommendations = analyticsData?.recommendations || [];
  const summary = analyticsData?.summary;

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Intensidade de Carbono</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <SmartSkeleton variant="text" className="w-16 h-6" /> : 
                   `${summary?.intensity?.toFixed(2) || 0}`}
                </p>
                <p className="text-xs text-muted-foreground">tCO₂e/unidade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tendência</p>
                <p className="text-2xl font-bold flex items-center">
                  {isLoading ? <SmartSkeleton variant="text" className="w-16 h-6" /> : (
                    <>
                      {summary?.trend > 0 ? (
                        <TrendingUp className="h-5 w-5 text-destructive mr-1" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-success mr-1" />
                      )}
                      {Math.abs(summary?.trend || 0).toFixed(1)}%
                    </>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">vs. período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-warning" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Oportunidades</p>
                <p className="text-2xl font-bold">
                  {isLoading ? <SmartSkeleton variant="text" className="w-16 h-6" /> : 
                   recommendations.filter(r => r.priority === 'high').length}
                </p>
                <p className="text-xs text-muted-foreground">alta prioridade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-info" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Qualidade dos Dados</p>
                <p className="text-2xl font-bold flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-success mr-1" />
                  95%
                </p>
                <p className="text-xs text-muted-foreground">completude</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <IntelligentInsights 
            insights={insights}
            recommendations={recommendations}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <TrendAnalysisChart 
            data={analyticsData?.monthly_trends || []}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="hotspots" className="space-y-4">
          <EmissionHotspots 
            sources={analyticsData?.top_sources || []}
            categories={analyticsData?.category_breakdown || []}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          <BenchmarkComparisonWidget 
            currentData={summary}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <GoalTrackingWidget 
            currentEmissions={summary?.total_emissions || 0}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <ScenarioSimulator 
            currentData={analyticsData}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Ações Recomendadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <Badge 
                key={index}
                variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                className="cursor-pointer hover:scale-105 transition-transform"
              >
                {rec.title}
                {rec.potential_reduction && (
                  <span className="ml-1 text-xs">(-{rec.potential_reduction}%)</span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}