import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartSkeleton } from '@/components/SmartSkeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EmissionsMonthlyChartProps {
  monthlyData: Array<{
    mes: string;
    escopo1: number;
    escopo2: number;
    escopo3: number;
  }>;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        <p className="text-sm text-muted-foreground">{`Total: ${total.toFixed(0)} tCO₂e`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey === 'escopo1' ? 'Escopo 1' : 
               entry.dataKey === 'escopo2' ? 'Escopo 2' : 'Escopo 3'}: ${entry.value} tCO₂e`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function EmissionsMonthlyChart({ monthlyData, isLoading }: EmissionsMonthlyChartProps) {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Evolução Mensal das Emissões (tCO₂e)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          {isLoading ? (
            <SmartSkeleton variant="chart" className="h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="escopo1" stackId="a" fill="#1e40af" name="Escopo 1" />
                <Bar dataKey="escopo2" stackId="a" fill="#3b82f6" name="Escopo 2" />
                <Bar dataKey="escopo3" stackId="a" fill="#93c5fd" name="Escopo 3" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
