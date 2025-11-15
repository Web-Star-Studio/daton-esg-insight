import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CashFlowChartProps {
  data: Array<{
    month: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Fluxo de Caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="entradas" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Entradas"
            />
            <Line 
              type="monotone" 
              dataKey="saidas" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="Saídas"
            />
            <Line 
              type="monotone" 
              dataKey="saldo" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              name="Saldo"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
