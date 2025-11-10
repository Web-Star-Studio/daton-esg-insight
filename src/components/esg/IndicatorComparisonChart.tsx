import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface IndicatorComparisonChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
    benchmark?: number;
  }>;
  unit: string;
  colors?: string[];
}

export function IndicatorComparisonChart({ 
  title, 
  data, 
  unit, 
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f43f5e']
}: IndicatorComparisonChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>Comparação entre indicadores</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
              label={{ value: unit, position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
              width={150}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, 'Valor']}
            />
            <Legend />
            <Bar dataKey="value" name="Valor Atual" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
            {data.some(d => d.benchmark) && (
              <Bar dataKey="benchmark" fill="#f59e0b" name="Benchmark" radius={[0, 8, 8, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
