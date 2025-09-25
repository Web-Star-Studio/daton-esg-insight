import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { useQualityIndicators } from '@/services/qualityIndicators';

interface StatisticalProcessControlProps {
  className?: string;
}

// Dados simulados para demonstração
const generateSPCData = (points: number = 25) => {
  const data = [];
  const centerLine = 100;
  const ucl = 115; // Upper Control Limit
  const lcl = 85;  // Lower Control Limit
  const usl = 120; // Upper Specification Limit
  const lsl = 80;  // Lower Specification Limit

  for (let i = 1; i <= points; i++) {
    // Simular alguns pontos fora de controle
    let value = centerLine + (Math.random() - 0.5) * 20;
    
    // Adicionar alguns pontos especiais
    if (i === 8 || i === 15) value = ucl + 3; // Pontos fora do limite superior
    if (i === 12) value = lcl - 2; // Ponto fora do limite inferior
    
    const isOutOfControl = value > ucl || value < lcl;
    const isOutOfSpec = value > usl || value < lsl;
    
    data.push({
      point: i,
      value: Math.round(value * 100) / 100,
      centerLine,
      ucl,
      lcl,
      usl,
      lsl,
      isOutOfControl,
      isOutOfSpec,
      date: new Date(2024, 0, i).toLocaleDateString('pt-BR'),
    });
  }
  
  return data;
};

// Função para calcular capacidade do processo
const calculateProcessCapability = (data: any[]) => {
  const values = data.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (values.length - 1);
  const stdDev = Math.sqrt(variance);
  
  // Especificações (USL e LSL)
  const usl = 120;
  const lsl = 80;
  
  // Capacidade do processo
  const cp = (usl - lsl) / (6 * stdDev);
  const cpk = Math.min((usl - mean) / (3 * stdDev), (mean - lsl) / (3 * stdDev));
  const pp = (usl - lsl) / (6 * stdDev); // Performance do processo
  const ppk = Math.min((usl - mean) / (3 * stdDev), (mean - lsl) / (3 * stdDev));
  
  return {
    mean: Math.round(mean * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    cp: Math.round(cp * 100) / 100,
    cpk: Math.round(cpk * 100) / 100,
    pp: Math.round(pp * 100) / 100,
    ppk: Math.round(ppk * 100) / 100,
  };
};

export const StatisticalProcessControl: React.FC<StatisticalProcessControlProps> = ({ className }) => {
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');
  const [chartType, setChartType] = useState<string>('xbar-r');
  
  const { data: indicators } = useQualityIndicators();
  
  const spcData = generateSPCData();
  const capability = calculateProcessCapability(spcData);
  
  // Identificar padrões especiais
  const outOfControlPoints = spcData.filter(d => d.isOutOfControl).length;
  const outOfSpecPoints = spcData.filter(d => d.isOutOfSpec).length;
  
  // Gráfico de controle customizado
  const ControlChart = ({ data, title }: { data: any[], title: string }) => (
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="point" />
          <YAxis />
          <Tooltip 
            formatter={(value: any, name: string) => [
              typeof value === 'number' ? value.toFixed(2) : value,
              name === 'value' ? 'Valor' : name
            ]}
            labelFormatter={(label) => `Ponto: ${label}`}
          />
          
          {/* Limites de especificação */}
          <ReferenceLine y={data[0]?.usl} stroke="#dc2626" strokeDasharray="5 5" label="LSE" />
          <ReferenceLine y={data[0]?.lsl} stroke="#dc2626" strokeDasharray="5 5" label="LIE" />
          
          {/* Limites de controle */}
          <ReferenceLine y={data[0]?.ucl} stroke="#f59e0b" strokeDasharray="3 3" label="LSC" />
          <ReferenceLine y={data[0]?.lcl} stroke="#f59e0b" strokeDasharray="3 3" label="LIC" />
          
          {/* Linha central */}
          <ReferenceLine y={data[0]?.centerLine} stroke="#10b981" label="LC" />
          
          {/* Dados do processo */}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={payload.isOutOfControl ? '#dc2626' : payload.isOutOfSpec ? '#f59e0b' : '#2563eb'}
                  stroke={payload.isOutOfControl ? '#dc2626' : payload.isOutOfSpec ? '#f59e0b' : '#2563eb'}
                  strokeWidth={2}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );

  // Histograma de capacidade
  const CapabilityHistogram = ({ data }: { data: any[] }) => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 10;
    const binWidth = (max - min) / binCount;
    
    const histogram = Array.from({ length: binCount }, (_, i) => {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      
      return {
        bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        midpoint: binStart + binWidth / 2,
      };
    });

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={histogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bin" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Area
              dataKey="count"
              fill="#3b82f6"
              fillOpacity={0.6}
              stroke="#3b82f6"
            />
            <ReferenceLine x="80-88" stroke="#dc2626" strokeDasharray="5 5" label="LIE" />
            <ReferenceLine x="112-120" stroke="#dc2626" strokeDasharray="5 5" label="LSE" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Controle Estatístico do Processo (CEP)</CardTitle>
          <CardDescription>
            Monitore a estabilidade do processo e capacidade através de gráficos de controle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um indicador" />
                </SelectTrigger>
                <SelectContent>
                  {indicators?.map((indicator) => (
                    <SelectItem key={indicator.id} value={indicator.id}>
                      {indicator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de gráfico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xbar-r">X̄-R (Média-Amplitude)</SelectItem>
                <SelectItem value="xbar-s">X̄-S (Média-Desvio)</SelectItem>
                <SelectItem value="individual">Individual (I-MR)</SelectItem>
                <SelectItem value="p-chart">p (Proporção)</SelectItem>
                <SelectItem value="c-chart">c (Contagem)</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs do Processo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cp (Capacidade)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capability.cp}</div>
            <p className="text-xs text-muted-foreground">
              {capability.cp >= 1.33 ? 'Capaz' : capability.cp >= 1.0 ? 'Marginal' : 'Incapaz'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cpk (Capacidade Real)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capability.cpk}</div>
            <p className="text-xs text-muted-foreground">
              {capability.cpk >= 1.33 ? 'Capaz' : capability.cpk >= 1.0 ? 'Marginal' : 'Incapaz'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Fora de Controle</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfControlPoints}</div>
            <p className="text-xs text-muted-foreground">
              De {spcData.length} pontos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fora de Especificação</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfSpecPoints}</div>
            <p className="text-xs text-muted-foreground">
              {((1 - outOfSpecPoints / spcData.length) * 100).toFixed(1)}% conformes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="control-chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="control-chart">Gráfico de Controle</TabsTrigger>
          <TabsTrigger value="capability">Capacidade do Processo</TabsTrigger>
          <TabsTrigger value="histogram">Histograma</TabsTrigger>
          <TabsTrigger value="rules">Regras de Controle</TabsTrigger>
        </TabsList>

        <TabsContent value="control-chart">
          <Card>
            <CardHeader>
              <CardTitle>Gráfico X̄-R (Média e Amplitude)</CardTitle>
              <CardDescription>
                Monitore a média do processo e sua variabilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ControlChart data={spcData} title="Gráfico de Controle X̄-R" />
              
              {/* Interpretação */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Interpretação:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Badge variant={outOfControlPoints === 0 ? "default" : "destructive"}>
                      {outOfControlPoints === 0 ? "Sob Controle" : "Fora de Controle"}
                    </Badge>
                    <p className="mt-1 text-muted-foreground">
                      {outOfControlPoints} pontos fora dos limites de controle
                    </p>
                  </div>
                  <div>
                    <Badge variant={capability.cp >= 1.33 ? "default" : "secondary"}>
                      Cp = {capability.cp}
                    </Badge>
                    <p className="mt-1 text-muted-foreground">
                      Capacidade potencial do processo
                    </p>
                  </div>
                  <div>
                    <Badge variant={capability.cpk >= 1.33 ? "default" : "secondary"}>
                      Cpk = {capability.cpk}
                    </Badge>
                    <p className="mt-1 text-muted-foreground">
                      Capacidade real considerando centralização
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Índices de Capacidade</CardTitle>
                <CardDescription>
                  Avaliação da capacidade do processo em atender especificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{capability.cp}</div>
                      <div className="text-sm text-muted-foreground">Cp</div>
                      <div className="text-xs mt-1">
                        {capability.cp >= 1.33 ? '✅ Capaz' : capability.cp >= 1.0 ? '⚠️ Marginal' : '❌ Incapaz'}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{capability.cpk}</div>
                      <div className="text-sm text-muted-foreground">Cpk</div>
                      <div className="text-xs mt-1">
                        {capability.cpk >= 1.33 ? '✅ Capaz' : capability.cpk >= 1.0 ? '⚠️ Marginal' : '❌ Incapaz'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{capability.pp}</div>
                      <div className="text-sm text-muted-foreground">Pp</div>
                      <div className="text-xs mt-1">Performance Potencial</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{capability.ppk}</div>
                      <div className="text-sm text-muted-foreground">Ppk</div>
                      <div className="text-xs mt-1">Performance Real</div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p><strong>Interpretação:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Cp/Pp ≥ 1,33: Processo capaz</li>
                      <li>1,00 ≤ Cp/Pp &lt; 1,33: Processo marginalmente capaz</li>
                      <li>Cp/Pp &lt; 1,00: Processo incapaz</li>
                      <li>Cpk/Ppk considera o deslocamento da média</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas do Processo</CardTitle>
                <CardDescription>
                  Resumo estatístico dos dados do processo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Média (X̄)</div>
                      <div className="text-2xl font-bold">{capability.mean}</div>
                    </div>
                    <div>
                      <div className="font-medium">Desvio Padrão (σ)</div>
                      <div className="text-2xl font-bold">{capability.stdDev}</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>LSE (Limite Superior de Especificação):</span>
                        <span className="font-medium">120</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LIE (Limite Inferior de Especificação):</span>
                        <span className="font-medium">80</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LSC (Limite Superior de Controle):</span>
                        <span className="font-medium">115</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LIC (Limite Inferior de Controle):</span>
                        <span className="font-medium">85</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="histogram">
          <Card>
            <CardHeader>
              <CardTitle>Histograma de Capacidade</CardTitle>
              <CardDescription>
                Distribuição dos valores do processo versus especificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CapabilityHistogram data={spcData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Controle Estatístico</CardTitle>
              <CardDescription>
                Critérios para identificar causas especiais de variação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Regras de Nelson/Western Electric</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <div className="font-medium">Ponto fora dos limites de controle</div>
                        <div className="text-muted-foreground">Qualquer ponto além de 3σ da linha central</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <div className="font-medium">9 pontos consecutivos do mesmo lado</div>
                        <div className="text-muted-foreground">9 pontos seguidos acima ou abaixo da linha central</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <div className="font-medium">6 pontos em tendência</div>
                        <div className="text-muted-foreground">6 pontos consecutivos crescentes ou decrescentes</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">4</div>
                      <div>
                        <div className="font-medium">14 pontos alternando</div>
                        <div className="text-muted-foreground">14 pontos alternando para cima e para baixo</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Interpretação de Padrões</h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="font-medium text-red-800">Causa Especial Detectada</div>
                      <div className="text-red-700">
                        {outOfControlPoints > 0 ? 
                          `${outOfControlPoints} pontos fora de controle detectados` :
                          'Nenhuma causa especial detectada'
                        }
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">Processo Estável</div>
                      <div className="text-green-700">
                        {outOfControlPoints === 0 ? 
                          'Processo sob controle estatístico' :
                          'Investigar causas dos pontos especiais'
                        }
                      </div>
                    </div>
                    
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">Capacidade</div>
                      <div className="text-blue-700">
                        {capability.cpk >= 1.33 ? 
                          'Processo capaz de atender especificações' :
                          'Melhorias necessárias para atender especificações'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};