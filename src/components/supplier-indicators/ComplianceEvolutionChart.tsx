import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { DocumentComplianceEvolution, PerformanceEvolution, PortalParticipationIndicator } from '@/services/supplierIndicatorsService';

interface DocumentEvolutionChartProps {
  data: DocumentComplianceEvolution[];
  isLoading?: boolean;
}

export function DocumentEvolutionChart({ data, isLoading }: DocumentEvolutionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate-pulse bg-muted rounded" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução Mensal - Conformidade Documental</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
            <Legend />
            <Bar dataKey="compliant" name="Conformes" fill="hsl(var(--chart-2))" stackId="a" />
            <Bar dataKey="nonCompliant" name="Não Conformes" fill="hsl(var(--destructive))" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface PerformanceEvolutionChartProps {
  data: PerformanceEvolution[];
  isLoading?: boolean;
}

export function PerformanceEvolutionChart({ data, isLoading }: PerformanceEvolutionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Nota Média</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate-pulse bg-muted rounded" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evolução Mensal - Notas de Fornecimento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis domain={[0, 5]} className="text-xs" />
            <Tooltip 
              formatter={(value: number) => value.toFixed(2)}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))' 
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="averageScore" name="Média Geral" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="qualityScore" name="Qualidade" stroke="hsl(var(--chart-1))" strokeWidth={1} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="deliveryScore" name="Entrega" stroke="hsl(var(--chart-2))" strokeWidth={1} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="priceScore" name="Preço" stroke="hsl(var(--chart-3))" strokeWidth={1} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ParticipationPieChartProps {
  data: PortalParticipationIndicator;
  isLoading?: boolean;
}

export function ParticipationPieChart({ data, isLoading }: ParticipationPieChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] animate-pulse bg-muted rounded" />
      </Card>
    );
  }

  const totalCompleted = data.trainings.completed + data.readings.confirmed + data.surveys.responded;
  const totalPending = (data.trainings.total - data.trainings.completed) + 
                       (data.readings.total - data.readings.confirmed) + 
                       (data.surveys.total - data.surveys.responded);
  
  const chartData = [
    { name: 'Concluído', value: totalCompleted, color: 'hsl(var(--chart-2))' },
    { name: 'Pendente', value: totalPending, color: 'hsl(var(--muted-foreground))' }
  ];

  const total = totalCompleted + totalPending;
  const completionRate = total > 0 ? (totalCompleted / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição Geral de Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))' 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{completionRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
            </div>
            <div className="space-y-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
