import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { getBurndownData, getProject } from '@/services/projectManagement';
import { format, differenceInDays, addDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BurndownChartProps {
  projectId: string;
}

export function BurndownChart({ projectId }: BurndownChartProps) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: burndownData = [], isLoading } = useQuery({
    queryKey: ['burndown-data', projectId],
    queryFn: () => getBurndownData(projectId),
  });

  // Generate ideal burndown line
  const generateIdealBurndown = () => {
    if (!project?.planned_start_date || !project?.planned_end_date) return [];
    
    const startDate = new Date(project.planned_start_date);
    const endDate = new Date(project.planned_end_date);
    const totalDays = differenceInDays(endDate, startDate);
    
    if (totalDays <= 0) return [];

    // Assuming 100 story points/hours as total work (this could be dynamic)
    const totalWork = 100;
    const data = [];

    for (let i = 0; i <= totalDays; i++) {
      const currentDate = addDays(startDate, i);
      const remainingWork = totalWork * (1 - i / totalDays);
      
      data.push({
        date: format(currentDate, 'dd/MM'),
        idealRemaining: Math.max(0, remainingWork),
        fullDate: currentDate
      });
    }

    return data;
  };

  const idealData = generateIdealBurndown();

  // Combine actual data with ideal data
  const chartData = idealData.map(ideal => {
    const actual = burndownData.find(bd => 
      format(new Date(bd.date), 'dd/MM') === ideal.date
    );

    return {
      ...ideal,
      actualRemaining: actual?.actual_work_remaining || null,
      workCompleted: actual?.work_completed || 0
    };
  });

  // Calculate velocity and trend
  const calculateVelocity = () => {
    if (burndownData.length < 2) return null;
    
    const recent = burndownData.slice(-5); // Last 5 data points
    const velocitySum = recent.reduce((acc, curr, index) => {
      if (index === 0) return acc;
      return acc + (recent[index - 1].actual_work_remaining - curr.actual_work_remaining);
    }, 0);
    
    return velocitySum / (recent.length - 1);
  };

  // Predict completion date based on current velocity
  const predictCompletion = () => {
    const velocity = calculateVelocity();
    if (!velocity || velocity <= 0 || burndownData.length === 0) return null;
    
    const lastData = burndownData[burndownData.length - 1];
    const daysToComplete = Math.ceil(lastData.actual_work_remaining / velocity);
    const predictedDate = addDays(new Date(lastData.date), daysToComplete);
    
    return predictedDate;
  };

  const velocity = calculateVelocity();
  const predictedCompletion = predictCompletion();
  const lastActualData = burndownData[burndownData.length - 1];

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    );
  }

  if (burndownData.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Dados insuficientes</h3>
          <p className="text-muted-foreground">
            O gráfico burndown será gerado automaticamente conforme o progresso das tarefas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trabalho Restante</p>
                <p className="text-2xl font-bold">
                  {lastActualData ? Math.round(lastActualData.actual_work_remaining) : 0}
                </p>
                <p className="text-xs text-muted-foreground">pontos de história</p>
              </div>
              <TrendingDown className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Velocidade</p>
                <p className="text-2xl font-bold">
                  {velocity ? Math.round(velocity * 10) / 10 : 0}
                </p>
                <p className="text-xs text-muted-foreground">pontos/dia</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${velocity && velocity > 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Previsão de Conclusão</p>
              <p className="text-lg font-bold">
                {predictedCompletion 
                  ? format(predictedCompletion, 'dd/MM/yyyy', { locale: ptBR })
                  : 'Indefinida'
                }
              </p>
              {predictedCompletion && project?.planned_end_date && (
                <p className={`text-xs ${
                  predictedCompletion <= new Date(project.planned_end_date) 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {predictedCompletion <= new Date(project.planned_end_date) 
                    ? 'No prazo' 
                    : 'Atrasado'
                  }
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Burndown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Burndown</CardTitle>
          <CardDescription>
            Progresso real vs. ideal do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  label={{ value: 'Trabalho Restante', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: any, name: string) => [
                    `${Math.round(value * 10) / 10} pontos`,
                    name === 'idealRemaining' ? 'Ideal' : 'Real'
                  ]}
                />
                <Legend />
                
                <Line
                  type="monotone"
                  dataKey="idealRemaining"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Burndown Ideal"
                  dot={false}
                />
                
                <Line
                  type="monotone"
                  dataKey="actualRemaining"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name="Burndown Real"
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Insights */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <h4 className="font-medium">Análise do Progresso</h4>
            
            {velocity && velocity > 0 && (
              <p className="text-sm text-green-600">
                ✓ Velocidade positiva: {Math.round(velocity * 10) / 10} pontos/dia
              </p>
            )}
            
            {velocity && velocity <= 0 && (
              <p className="text-sm text-red-600">
                ⚠ Velocidade baixa ou negativa - verifique impedimentos
              </p>
            )}
            
            {lastActualData && chartData.length > 0 && (
              <>
                {lastActualData.actual_work_remaining > chartData[chartData.length - 1]?.idealRemaining && (
                  <p className="text-sm text-yellow-600">
                    ⚠ Projeto está atrás do cronograma ideal
                  </p>
                )}
                
                {lastActualData.actual_work_remaining <= (chartData[chartData.length - 1]?.idealRemaining || 0) && (
                  <p className="text-sm text-green-600">
                    ✓ Projeto está no cronograma ou adiantado
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}