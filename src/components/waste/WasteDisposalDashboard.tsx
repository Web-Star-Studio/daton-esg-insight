/**
 * Waste Disposal Dashboard - GRI 306-5
 * Dashboard para monitorar e MINIMIZAR % de aterro/incineração
 * OBJETIVO: Reduzir disposal para ≤10% (Zero Waste)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, TrendingDown, TrendingUp, Award, 
  Cloud, DollarSign, Trash2, AlertTriangle, CheckCircle
} from "lucide-react";
import type { WasteDisposalResult } from "@/services/wasteDisposal";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface WasteDisposalDashboardProps {
  disposalData: WasteDisposalResult;
  year: number;
  sectorBenchmark?: {
    excellent: number;
    good: number;
    average: number;
  };
}

export function WasteDisposalDashboard({ disposalData, year, sectorBenchmark }: WasteDisposalDashboardProps) {
  
  // Cores para classificação (INVERTIDO: menor = melhor)
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'Zero Waste':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Excelente':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Bom':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Regular':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Crítico':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'Zero Waste':
        return <Award className="h-5 w-5 text-green-600" />;
      case 'Excelente':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'Bom':
        return <CheckCircle className="h-5 w-5 text-yellow-600" />;
      case 'Regular':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'Crítico':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  // Dados para gráfico de pizza
  const pieData = [
    { 
      name: 'Aterro Sanitário', 
      value: disposalData.landfill_volume_tonnes,
      percentage: disposalData.landfill_percentage,
      color: '#dc2626' // red-600
    },
    { 
      name: 'Incineração', 
      value: disposalData.incineration_volume_tonnes,
      percentage: disposalData.incineration_percentage,
      color: '#f97316' // orange-500
    }
  ].filter(item => item.value > 0);

  // Dados para gráfico de barras (Top 10 resíduos em disposal)
  const barData = disposalData.disposal_by_waste_type.slice(0, 10).map(item => ({
    name: item.waste_description.length > 30 
      ? item.waste_description.substring(0, 30) + '...' 
      : item.waste_description,
    Aterro: item.landfill_tonnes,
    Incineração: item.incineration_tonnes,
    Total: item.total_disposal_tonnes,
    class: item.waste_class
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">
            Percentual de Aterro/Incineração
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            GRI 306-5 - Waste directed to disposal | Ano: {year}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          5º e 6º níveis da hierarquia
        </Badge>
      </div>

      {/* Alertas Inteligentes */}
      {disposalData.disposal_percentage > 60 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-900 font-semibold">
            🔴 CRÍTICO: Taxa de Disposal Muito Alta
          </AlertTitle>
          <AlertDescription className="text-red-800">
            {disposalData.disposal_percentage.toFixed(1)}% dos resíduos estão indo para aterro/incineração. 
            <strong className="ml-1">Plano de ação urgente necessário!</strong>
            <br />
            <span className="text-xs mt-1 block">
              Meta recomendada: Reduzir para &lt;10% (Zero Waste). 
              Gap atual: {disposalData.zero_waste_compliance.gap_to_target.toFixed(1)} pontos percentuais.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {disposalData.disposal_percentage > 40 && disposalData.disposal_percentage <= 60 && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            🟠 ATENÇÃO: Disposal Acima do Recomendado
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            {disposalData.disposal_percentage.toFixed(1)}% para disposição final. 
            Revisar processos de segregação e aumentar reciclagem/reuso.
          </AlertDescription>
        </Alert>
      )}

      {disposalData.zero_waste_compliance.is_compliant && (
        <Alert className="border-green-500 bg-green-50">
          <Award className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900 font-semibold">
            🏆 PARABÉNS! Certificação Zero Waste Alcançada
          </AlertTitle>
          <AlertDescription className="text-green-800">
            Apenas {disposalData.disposal_percentage.toFixed(1)}% de disposal. 
            Empresa elegível para certificação Zero Waste (TRUE, UL 2799).
          </AlertDescription>
        </Alert>
      )}

      {disposalData.is_improving !== undefined && disposalData.is_improving && (
        <Alert className="border-green-500 bg-green-50">
          <TrendingDown className="h-5 w-5 text-green-600" />
          <AlertTitle className="text-green-900 font-semibold">
            ✅ Melhoria Detectada!
          </AlertTitle>
          <AlertDescription className="text-green-800">
            Redução de {Math.abs(disposalData.improvement_percent || 0).toFixed(1)}% vs. ano anterior. 
            Continue investindo em desvio de aterro!
          </AlertDescription>
        </Alert>
      )}

      {/* Card Principal - Percentual de Disposal */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className={`h-8 w-8 ${
                disposalData.disposal_percentage > 40 ? 'text-red-600' : 
                disposalData.disposal_percentage > 25 ? 'text-orange-600' : 
                'text-green-600'
              }`} />
              <div>
                <CardTitle className="text-base">Disposal Total</CardTitle>
                <CardDescription className="text-xs">
                  Aterro + Incineração (quanto MENOR, melhor)
                </CardDescription>
              </div>
            </div>
            <Badge className={`${getClassificationColor(disposalData.performance_classification)} border`}>
              {disposalData.performance_classification}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-5xl font-bold ${
                disposalData.disposal_percentage > 40 ? 'text-red-600' : 
                disposalData.disposal_percentage > 25 ? 'text-orange-600' : 
                'text-green-600'
              }`}>
                {disposalData.disposal_percentage.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {disposalData.disposal_volume_tonnes.toFixed(2)} t de {disposalData.total_generated_tonnes.toFixed(2)} t geradas
              </p>
            </div>

            {/* Breakdown Aterro vs. Incineração */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">
                  {disposalData.landfill_percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Aterro Sanitário
                </p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {disposalData.landfill_volume_tonnes.toFixed(2)} t
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-orange-600">
                  {disposalData.incineration_percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Incineração
                </p>
                <p className="text-xs font-medium text-foreground mt-1">
                  {disposalData.incineration_volume_tonnes.toFixed(2)} t
                </p>
              </div>
            </div>

            {/* Comparação com ano anterior */}
            {disposalData.baseline_disposal_percentage !== undefined && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">vs. {year - 1}:</span>
                  <div className="flex items-center gap-2">
                    {disposalData.is_improving ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          -{Math.abs(disposalData.improvement_percent || 0).toFixed(1)}% 
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-red-600">
                          +{Math.abs(disposalData.improvement_percent || 0).toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ano anterior: {disposalData.baseline_disposal_percentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards - Zero Waste, Impacto, Custo */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Zero Waste Compliance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {disposalData.zero_waste_compliance.is_compliant ? (
                <Award className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              )}
              <CardTitle className="text-sm">Zero Waste</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Meta: ≤10%</span>
                  <span className={`font-semibold ${
                    disposalData.zero_waste_compliance.is_compliant 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {disposalData.disposal_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, (disposalData.disposal_percentage / 10) * 100)} 
                  className="h-2"
                />
              </div>
              <Badge 
                variant="outline" 
                className={disposalData.zero_waste_compliance.is_compliant 
                  ? 'bg-green-50 text-green-700 border-green-300' 
                  : 'bg-orange-50 text-orange-700 border-orange-300'
                }
              >
                {disposalData.zero_waste_compliance.is_compliant ? 'Conforme' : 'Não Conforme'}
              </Badge>
              {!disposalData.zero_waste_compliance.is_compliant && (
                <p className="text-xs text-muted-foreground mt-2">
                  Faltam {disposalData.zero_waste_compliance.gap_to_target.toFixed(1)} pontos percentuais
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Impacto Ambiental */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm">Impacto Ambiental</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {(disposalData.environmental_impact.total_disposal_emissions_kg / 1000).toFixed(1)} t
                </div>
                <p className="text-xs text-muted-foreground">CO₂e emitido</p>
              </div>
              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Aterro:</span>
                  <span className="font-medium">
                    {(disposalData.environmental_impact.landfill_co2_emissions_kg / 1000).toFixed(2)} t CO₂e
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Incineração:</span>
                  <span className="font-medium">
                    {(disposalData.environmental_impact.incineration_co2_emissions_kg / 1000).toFixed(2)} t CO₂e
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custo Estimado */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm">Custo Estimado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  R$ {disposalData.disposal_cost_estimate.total_disposal_cost_brl.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Custo de disposal</p>
              </div>
              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Aterro:</span>
                  <span className="font-medium">
                    R$ {disposalData.disposal_cost_estimate.landfill_cost_brl.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Incineração:</span>
                  <span className="font-medium">
                    R$ {disposalData.disposal_cost_estimate.incineration_cost_brl.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Gráfico de Barras - Top 10 Resíduos em Disposal */}
        {barData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 Resíduos em Disposal</CardTitle>
              <CardDescription className="text-xs">
                Resíduos que mais vão para aterro/incineração (priorizar redução)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Aterro" fill="#dc2626" />
                  <Bar dataKey="Incineração" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Pizza - Composição do Disposal */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Composição do Disposal</CardTitle>
              <CardDescription className="text-xs">
                Distribuição entre aterro e incineração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Breakdown por Perigosidade */}
      {disposalData.disposal_breakdown.hazardous_disposal_tonnes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown por Perigosidade</CardTitle>
            <CardDescription className="text-xs">
              Classificação dos resíduos em disposal por NBR 10004
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">
                  {disposalData.disposal_breakdown.hazardous_disposal_tonnes.toFixed(2)} t
                </div>
                <p className="text-sm text-muted-foreground mt-1">Classe I - Perigosos</p>
                <p className="text-xs text-muted-foreground">
                  {disposalData.disposal_breakdown.hazardous_percentage.toFixed(1)}% do disposal
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">
                  {disposalData.disposal_breakdown.non_hazardous_disposal_tonnes.toFixed(2)} t
                </div>
                <p className="text-sm text-muted-foreground mt-1">Classe II - Não Perigosos</p>
                <p className="text-xs text-muted-foreground">
                  {(100 - disposalData.disposal_breakdown.hazardous_percentage).toFixed(1)}% do disposal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Benchmarks Setoriais */}
      {sectorBenchmark && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benchmarks Setoriais</CardTitle>
            <CardDescription className="text-xs">
              Comparação com melhores práticas do setor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Excelente (classe mundial):</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  ≤{sectorBenchmark.excellent}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bom (acima da média):</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  ≤{sectorBenchmark.good}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Média do setor:</span>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                  {sectorBenchmark.average}%
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-semibold">Sua empresa:</span>
                <Badge className={getClassificationColor(disposalData.performance_classification)}>
                  {disposalData.disposal_percentage.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarquia de Resíduos (Visual Educativo) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hierarquia de Resíduos</CardTitle>
          <CardDescription className="text-xs">
            Disposal é o último recurso - priorizar opções superiores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl">⭐⭐⭐⭐⭐</div>
              <div>
                <div className="font-semibold text-sm text-green-800">1. Não Geração / Redução na Fonte</div>
                <p className="text-xs text-green-700">Melhor opção - evitar criar resíduos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl">⭐⭐⭐⭐</div>
              <div>
                <div className="font-semibold text-sm text-blue-800">2. Reuso / Reutilização</div>
                <p className="text-xs text-blue-700">Segunda melhor - usar novamente</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <div className="text-2xl">⭐⭐⭐</div>
              <div>
                <div className="font-semibold text-sm text-cyan-800">3. Reciclagem / Compostagem</div>
                <p className="text-xs text-cyan-700">Transformar em nova matéria-prima</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-2xl">⭐⭐</div>
              <div>
                <div className="font-semibold text-sm text-orange-800">4. Recuperação Energética (Incineração)</div>
                <p className="text-xs text-orange-700">⚠️ Minimizar - gera emissões CO₂</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-2xl">⭐</div>
              <div>
                <div className="font-semibold text-sm text-red-800">5. Aterro Sanitário</div>
                <p className="text-xs text-red-700">⚠️ EVITAR - pior opção ambiental</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nota Metodológica */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-sm">Nota Metodológica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">GRI 306-5:</strong> Waste directed to disposal (resíduos destinados à disposição final)
            </p>
            <p>
              <strong className="text-foreground">Fórmula:</strong> Disposal (%) = (Aterro + Incineração) / Total Gerado × 100
            </p>
            <p>
              <strong className="text-foreground">Fontes:</strong> MTRs (Manifesto de Transporte de Resíduos), waste_logs
            </p>
            <p>
              <strong className="text-foreground">Meta Zero Waste:</strong> ≤10% disposal para certificação (TRUE, UL 2799)
            </p>
            <p>
              <strong className="text-foreground">Emissões estimadas:</strong> Aterro ~500 kg CO₂e/t | Incineração ~700 kg CO₂e/t
            </p>
            <p>
              <strong className="text-foreground">Custos médios:</strong> Aterro R$150-300/t | Incineração R$400-800/t
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
