import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  Zap, 
  Target,
  ArrowRight,
  Factory,
  Fuel,
  Building2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface EmissionSource {
  name: string;
  category: string;
  emissions: number;
  percentage: number;
}

interface CategoryBreakdown {
  category: string;
  emissions: number;
  percentage: number;
}

interface EmissionHotspotsProps {
  sources: EmissionSource[];
  categories: CategoryBreakdown[];
  isLoading?: boolean;
}

export function EmissionHotspots({ sources, categories, isLoading }: EmissionHotspotsProps) {
  const getHotspotLevel = (percentage: number) => {
    if (percentage >= 50) return { level: 'critical', color: 'destructive', icon: AlertTriangle };
    if (percentage >= 25) return { level: 'high', color: 'secondary', icon: Flame };
    if (percentage >= 10) return { level: 'medium', color: 'default', icon: TrendingUp };
    return { level: 'low', color: 'secondary', icon: Target };
  };

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('combustão')) return Factory;
    if (category.toLowerCase().includes('energia')) return Zap;
    if (category.toLowerCase().includes('transporte')) return Fuel;
    return Building2;
  };

  const chartData = categories.map((cat, index) => ({
    name: cat.category,
    value: cat.emissions,
    percentage: cat.percentage,
    fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Generate distinct colors
  }));

  const reductionOpportunities = sources
    .filter(source => source.percentage >= 10)
    .map(source => ({
      ...source,
      reduction_potential: Math.min(source.percentage * 0.3, 25), // Realistic reduction estimate
      implementation_effort: source.percentage > 30 ? 'high' : source.percentage > 15 ? 'medium' : 'low'
    }))
    .sort((a, b) => b.reduction_potential - a.reduction_potential);

  return (
    <div className="space-y-6">
      {/* Top Sources Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Flame className="h-5 w-5" />
            <span>Principais Fontes de Emissão</span>
            <Badge variant="outline" className="ml-auto">
              Top {sources.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SmartSkeleton variant="list" className="space-y-3" />
          ) : (
            <div className="space-y-4">
              {sources.map((source, index) => {
                const hotspot = getHotspotLevel(source.percentage);
                const IconComponent = hotspot.icon;
                
                return (
                  <div key={index} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-full bg-muted">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <Badge variant={hotspot.color as "default" | "destructive" | "secondary" | "outline"}>
                        {hotspot.level.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{source.name}</p>
                      <p className="text-sm text-muted-foreground">{source.category}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">{source.emissions.toFixed(1)} tCO₂e</p>
                      <p className="text-sm text-muted-foreground">{source.percentage}% do total</p>
                    </div>
                    
                    <Button variant="ghost">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Distribuição por Categoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <SmartSkeleton variant="chart" className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage}%`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)} tCO₂e`, 'Emissões']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reduction Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Oportunidades de Redução Prioritárias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SmartSkeleton variant="list" className="space-y-4" />
          ) : (
            <div className="space-y-4">
              {reductionOpportunities.map((opportunity, index) => (
                <div key={index} className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{opportunity.name}</h4>
                        <Badge 
                          variant={
                            opportunity.implementation_effort === 'high' ? 'destructive' :
                            opportunity.implementation_effort === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {opportunity.implementation_effort === 'high' ? 'Alto Esforço' :
                           opportunity.implementation_effort === 'medium' ? 'Médio Esforço' : 'Baixo Esforço'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{opportunity.category}</p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Emissões atuais:</span>
                          <span className="font-medium ml-1">{opportunity.emissions.toFixed(1)} tCO₂e</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Redução potencial:</span>
                          <span className="font-medium ml-1 text-primary">
                            -{opportunity.reduction_potential.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline">
                      Analisar
                    </Button>
                  </div>
                </div>
              ))}
              
              {reductionOpportunities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma oportunidade significativa identificada</p>
                  <p className="text-sm">Suas emissões estão bem distribuídas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Ações Imediatas Recomendadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Auditoria Energética</p>
                <p className="text-sm text-muted-foreground">Identificar ineficiências</p>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Plano de Eficiência</p>
                <p className="text-sm text-muted-foreground">Reduzir principais fontes</p>
              </div>
            </Button>
            
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <p className="font-medium">Monitoramento Contínuo</p>
                <p className="text-sm text-muted-foreground">Acompanhar progressos</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}