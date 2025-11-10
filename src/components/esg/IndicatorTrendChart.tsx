import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IndicatorTrendChartProps {
  title: string;
  data: Array<{
    period: string;
    value: number;
    benchmark?: number;
    target?: number;
  }>;
  unit: string;
  color?: string;
}

export function IndicatorTrendChart({ title, data, unit, color = '#3b82f6' }: IndicatorTrendChartProps) {
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const trend = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
  const isPositive = trend >= 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        </div>
        <CardDescription>Evolução temporal - Últimos 12 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
              label={{ value: unit, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
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
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              name="Valor Real"
            />
            {data.some(d => d.benchmark) && (
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="Benchmark"
              />
            )}
            {data.some(d => d.target) && (
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#10b981" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="Meta"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
