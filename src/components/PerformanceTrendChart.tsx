import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PerformanceTrendChartProps {
  data: Array<{
    period: string;
    averageScore: number;
    evaluationsCount: number;
  }>;
}

export function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  const chartData = data.map(item => ({
    ...item,
    formattedPeriod: format(new Date(item.period), "MMM/yy", { locale: ptBR })
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Desempenho</CardTitle>
        <CardDescription>
          Evolução da pontuação média de desempenho ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedPeriod" />
              <YAxis domain={[0, 5]} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  const labels: Record<string, string> = {
                    averageScore: "Pontuação Média",
                    evaluationsCount: "Nº de Avaliações"
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 6 }}
                name="Pontuação Média"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Dados insuficientes para exibir tendência
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}