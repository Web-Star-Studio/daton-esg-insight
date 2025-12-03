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
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Treinamentos por Departamento</CardTitle>
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
              <BarChart data={departmentData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="url(#barGradient)" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Evolução Mensal</CardTitle>
          <CardDescription>
            Treinamentos concluídos vs inscritos por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              completed: {
                label: "Concluídos",
                color: "hsl(var(--chart-1))",
              },
              enrolled: {
                label: "Inscritos",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="lineGradient1" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="lineGradient2" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--chart-2))" />
                    <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  name="Concluídos"
                  stroke="url(#lineGradient1)" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: "hsl(var(--chart-1))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: "hsl(var(--chart-1))", fill: "hsl(var(--background))" }}
                  animationDuration={1000}
                />
                <Line 
                  type="monotone" 
                  dataKey="enrolled" 
                  name="Inscritos"
                  stroke="url(#lineGradient2)" 
                  strokeWidth={3}
                  dot={{ r: 5, fill: "hsl(var(--chart-2))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 8, strokeWidth: 2, stroke: "hsl(var(--chart-2))", fill: "hsl(var(--background))" }}
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Distribuição por Categoria</CardTitle>
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
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={`pieGradient${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  innerRadius={40}
                  dataKey="value"
                  animationDuration={800}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGradient${index % COLORS.length})`} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Distribuição por Status</CardTitle>
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
              <AreaChart data={statusData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="hsl(var(--chart-4))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={{ stroke: 'hsl(var(--border))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--chart-4))" 
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
