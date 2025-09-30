import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar 
} from 'recharts';

interface InventoryChartsProps {
  stats: {
    escopo1: number;
    escopo2: number;
    escopo3: number;
  };
  emissionSources: any[];
  show: boolean;
}

const COLORS = {
  escopo1: '#ef4444',
  escopo2: '#f97316',
  escopo3: '#eab308',
};

export function InventoryCharts({ stats, emissionSources, show }: InventoryChartsProps) {
  const pieData = useMemo(() => [
    { name: 'Escopo 1', value: stats.escopo1 || 0, color: COLORS.escopo1 },
    { name: 'Escopo 2', value: stats.escopo2 || 0, color: COLORS.escopo2 },
    { name: 'Escopo 3', value: stats.escopo3 || 0, color: COLORS.escopo3 },
  ], [stats]);

  const barData = useMemo(() => {
    return emissionSources
      .filter(source => source.total_emissions > 0)
      .sort((a, b) => b.total_emissions - a.total_emissions)
      .slice(0, 10)
      .map(source => ({
        name: source.name,
        emissions: source.total_emissions,
      }));
  }, [emissionSources]);

  if (!show) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Escopo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Fontes de Emissão</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="emissions" fill={COLORS.escopo1} name="Emissões (tCO₂e)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
