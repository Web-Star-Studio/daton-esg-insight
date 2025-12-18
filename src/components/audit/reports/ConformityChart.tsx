/**
 * ConformityChart - Gráfico de conformidade
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ScoringResult } from "@/services/audit/scoring";

interface ConformityChartProps {
  scoring: ScoringResult | null;
}

export function ConformityChart({ scoring }: ConformityChartProps) {
  if (!scoring) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Conformidade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Dados não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'Conforme', value: scoring.conforming_items, color: '#22c55e' },
    { name: 'Não Conforme', value: scoring.non_conforming_items, color: '#ef4444' },
    { name: 'Parcial', value: scoring.partial_items, color: '#eab308' },
    { name: 'N/A', value: scoring.na_items, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Conformidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item) => (
            <div 
              key={item.name}
              className="flex items-center justify-between p-2 rounded-lg"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
