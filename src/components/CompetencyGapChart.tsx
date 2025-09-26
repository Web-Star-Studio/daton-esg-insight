import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CompetencyGapReport } from "@/services/reportService";

interface CompetencyGapChartProps {
  data: CompetencyGapReport[];
}

export function CompetencyGapChart({ data }: CompetencyGapChartProps) {
  const chartData = data.map(item => ({
    name: item.competency_name,
    gap: item.average_gap,
    current: item.average_current_level,
    target: item.average_target_level,
    critical: item.critical_gaps
  }));

  const getBarColor = (gap: number) => {
    if (gap >= 2) return "#ef4444"; // red-500
    if (gap >= 1) return "#f59e0b"; // amber-500
    return "#10b981"; // emerald-500
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Lacunas de Competência</CardTitle>
        <CardDescription>
          Diferença entre nível atual e nível desejado por competência
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  const labels: Record<string, string> = {
                    gap: "Lacuna",
                    current: "Nível Atual",
                    target: "Nível Desejado",
                    critical: "Gaps Críticos"
                  };
                  return [value, labels[name] || name];
                }}
              />
              <Bar dataKey="gap" name="Lacuna">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.gap)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum dado de lacuna de competência disponível
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}