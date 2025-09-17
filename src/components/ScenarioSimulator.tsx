import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { 
  Calculator, 
  Target, 
  Lightbulb, 
  TrendingDown,
  Zap,
  Leaf,
  Factory,
  Truck
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine
} from "recharts";

interface ScenarioSimulatorProps {
  currentData?: {
    summary: {
      total_emissions: number;
      scope1_percentage: number;
      scope2_percentage: number;
      scope3_percentage: number;
    };
  };
  isLoading?: boolean;
}

interface ScenarioParams {
  energyEfficiency: number;
  renewableEnergy: number;
  processOptimization: number;
  transportEfficiency: number;
  wasteReduction: number;
}

export function ScenarioSimulator({ currentData, isLoading }: ScenarioSimulatorProps) {
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    energyEfficiency: 0,
    renewableEnergy: 0,
    processOptimization: 0,
    transportEfficiency: 0,
    wasteReduction: 0
  });

  const currentEmissions = currentData?.summary?.total_emissions || 1000;
  const scope1Percentage = currentData?.summary?.scope1_percentage || 40;
  const scope2Percentage = currentData?.summary?.scope2_percentage || 35;
  const scope3Percentage = currentData?.summary?.scope3_percentage || 25;

  const calculateImpact = (params: ScenarioParams) => {
    // Realistic reduction factors based on industry data
    const scope1Reduction = 
      (params.energyEfficiency * 0.3) + 
      (params.processOptimization * 0.4) + 
      (params.wasteReduction * 0.2);
    
    const scope2Reduction = 
      (params.energyEfficiency * 0.4) + 
      (params.renewableEnergy * 0.6);
    
    const scope3Reduction = 
      (params.transportEfficiency * 0.5) + 
      (params.wasteReduction * 0.3);

    const totalReduction = 
      (scope1Reduction * scope1Percentage / 100) +
      (scope2Reduction * scope2Percentage / 100) +
      (scope3Reduction * scope3Percentage / 100);

    return {
      totalReduction: Math.min(totalReduction, 80), // Cap at 80% reduction
      newEmissions: currentEmissions * (1 - Math.min(totalReduction / 100, 0.8)),
      scope1Impact: scope1Reduction,
      scope2Impact: scope2Reduction,
      scope3Impact: scope3Reduction,
      costEstimate: calculateCost(params),
      timeframe: calculateTimeframe(params),
      roi: calculateROI(params, totalReduction)
    };
  };

  const calculateCost = (params: ScenarioParams): number => {
    // Cost per percentage reduction (in thousands)
    const costs = {
      energyEfficiency: params.energyEfficiency * 15,
      renewableEnergy: params.renewableEnergy * 25,
      processOptimization: params.processOptimization * 20,
      transportEfficiency: params.transportEfficiency * 18,
      wasteReduction: params.wasteReduction * 10
    };
    
    return Object.values(costs).reduce((a, b) => a + b, 0);
  };

  const calculateTimeframe = (params: ScenarioParams): number => {
    // Implementation timeframe in months
    const maxParam = Math.max(...Object.values(params));
    return Math.ceil(6 + (maxParam / 10) * 18); // 6-24 months
  };

  const calculateROI = (params: ScenarioParams, reduction: number): number => {
    const carbonPrice = 50; // USD per tCO2e
    const annualSavings = (currentEmissions * reduction / 100) * carbonPrice;
    const totalCost = calculateCost(params) * 1000;
    return totalCost > 0 ? (annualSavings * 5 / totalCost) * 100 : 0; // 5-year ROI
  };

  const impact = calculateImpact(scenarioParams);

  const scenarioData = [
    {
      name: 'Atual',
      scope1: currentEmissions * (scope1Percentage / 100),
      scope2: currentEmissions * (scope2Percentage / 100),
      scope3: currentEmissions * (scope3Percentage / 100),
      total: currentEmissions
    },
    {
      name: 'Cenário',
      scope1: currentEmissions * (scope1Percentage / 100) * (1 - impact.scope1Impact / 100),
      scope2: currentEmissions * (scope2Percentage / 100) * (1 - impact.scope2Impact / 100),
      scope3: currentEmissions * (scope3Percentage / 100) * (1 - impact.scope3Impact / 100),
      total: impact.newEmissions
    }
  ];

  const progressionData = Array.from({ length: 13 }, (_, i) => {
    const month = i;
    const progress = Math.min(i / 12, 1); // Linear implementation over 12 months
    const currentReduction = impact.totalReduction * progress;
    
    return {
      month: `Mês ${i}`,
      emissions: currentEmissions * (1 - currentReduction / 100),
      reduction: currentReduction
    };
  });

  const presetScenarios = [
    {
      name: "Quick Wins",
      description: "Melhorias rápidas e baratas",
      params: { energyEfficiency: 15, renewableEnergy: 5, processOptimization: 10, transportEfficiency: 8, wasteReduction: 12 },
      icon: Zap
    },
    {
      name: "Ambicioso",
      description: "Transformação completa",
      params: { energyEfficiency: 40, renewableEnergy: 60, processOptimization: 35, transportEfficiency: 30, wasteReduction: 25 },
      icon: Target
    },
    {
      name: "Conservador",
      description: "Abordagem cautelosa",
      params: { energyEfficiency: 8, renewableEnergy: 15, processOptimization: 5, transportEfficiency: 10, wasteReduction: 8 },
      icon: Leaf
    }
  ];

  const applyPreset = (params: ScenarioParams) => {
    setScenarioParams(params);
  };

  return (
    <div className="space-y-6">
      {/* Preset Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <span>Cenários Pré-definidos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presetScenarios.map((scenario, index) => {
              const presetImpact = calculateImpact(scenario.params);
              const IconComponent = scenario.icon;
              
              return (
                <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{scenario.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{scenario.description}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Redução:</span>
                            <span className="font-medium text-success">
                              -{presetImpact.totalReduction.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Custo:</span>
                            <span className="font-medium">
                              ${presetImpact.costEstimate.toFixed(0)}k
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Prazo:</span>
                            <span className="font-medium">
                              {presetImpact.timeframe} meses
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full"
                          onClick={() => applyPreset(scenario.params)}
                        >
                          Aplicar Cenário
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Parameter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Simulador Personalizado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { key: 'energyEfficiency', label: 'Eficiência Energética', icon: Zap, max: 50 },
            { key: 'renewableEnergy', label: 'Energia Renovável', icon: Leaf, max: 70 },
            { key: 'processOptimization', label: 'Otimização de Processos', icon: Factory, max: 40 },
            { key: 'transportEfficiency', label: 'Eficiência de Transporte', icon: Truck, max: 35 },
            { key: 'wasteReduction', label: 'Redução de Resíduos', icon: Target, max: 30 }
          ].map(({ key, label, icon: IconComponent, max }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-sm font-bold">
                  {scenarioParams[key as keyof ScenarioParams]}%
                </span>
              </div>
              <Slider
                value={[scenarioParams[key as keyof ScenarioParams]]}
                onValueChange={([value]) => 
                  setScenarioParams(prev => ({ ...prev, [key]: value }))
                }
                max={max}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>{max}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingDown className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">-{impact.totalReduction.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Redução Total</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{impact.newEmissions.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">tCO₂e Finais</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calculator className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">${impact.costEstimate.toFixed(0)}k</p>
              <p className="text-sm text-muted-foreground">Investimento</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lightbulb className="h-8 w-8 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">{impact.roi.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">ROI 5 anos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Cenários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <SmartSkeleton variant="chart" className="h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(0)} tCO₂e`, '']}
                  />
                  <Legend />
                  <Bar dataKey="scope1" stackId="a" fill="hsl(var(--chart-1))" name="Escopo 1" />
                  <Bar dataKey="scope2" stackId="a" fill="hsl(var(--chart-2))" name="Escopo 2" />
                  <Bar dataKey="scope3" stackId="a" fill="hsl(var(--chart-3))" name="Escopo 3" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Cronograma de Implementação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="emissions" orientation="left" />
                <YAxis yAxisId="reduction" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="emissions"
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Emissões (tCO₂e)"
                />
                <Line 
                  yAxisId="reduction"
                  type="monotone" 
                  dataKey="reduction" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="% Redução"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Plano de Implementação Recomendado</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Fase 1 (0-6 meses)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Auditoria energética</li>
                  <li>• Otimizações básicas</li>
                  <li>• Treinamento equipe</li>
                  <li>• Sistemas de monitoramento</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fase 2 (6-18 meses)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Projetos de eficiência</li>
                  <li>• Contratos energia renovável</li>
                  <li>• Otimização processos</li>
                  <li>• Gestão de resíduos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fase 3 (18+ meses)</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Tecnologias avançadas</li>
                  <li>• Automação processos</li>
                  <li>• Certificações</li>
                  <li>• Melhoria contínua</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}