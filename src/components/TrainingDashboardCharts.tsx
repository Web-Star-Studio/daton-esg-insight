import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface TrainingDashboardChartsProps {
  trainingsByDepartment: Record<string, number>;
  monthlyTrend: Array<{ month: string; completed: number; enrolled: number }>;
  categoryDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function TrainingDashboardCharts({
  trainingsByDepartment,
  monthlyTrend,
  categoryDistribution,
  statusDistribution,
}: TrainingDashboardChartsProps) {
  const departmentData = Object.entries(trainingsByDepartment).map(([name, value]) => ({
    name,
    value,
  }));

  const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const statusData = Object.entries(statusDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Trainings by Department */}
      <Card>
        <CardHeader>
          <CardTitle>Treinamentos por Departamento</CardTitle>
          <CardDescription>
            Distribuição de treinamentos entre departamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: "Treinamentos",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
          <CardDescription>
            Treinamentos concluídos vs inscritos por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              completed: {
                label: "Concluídos",
                color: "hsl(var(--chart-2))",
              },
              enrolled: {
                label: "Inscritos",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="enrolled" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
          <CardDescription>
            Tipos de treinamento realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: "Treinamentos",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="hsl(var(--chart-1))"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
          <CardDescription>
            Status atual dos treinamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: "Quantidade",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-4))" 
                  fill="hsl(var(--chart-4))" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
