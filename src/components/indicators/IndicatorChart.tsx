import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { ExtendedQualityIndicator } from "@/services/indicatorManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface IndicatorChartProps {
  indicators: ExtendedQualityIndicator[];
  year: number;
}

const MONTHS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function IndicatorChart({ indicators, year }: IndicatorChartProps) {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  const displayIndicators = useMemo(() => {
    if (selectedIndicators.length > 0) {
      return indicators.filter(i => selectedIndicators.includes(i.id));
    }
    // Default to first 3 indicators with data
    return indicators
      .filter(i => i.period_data && i.period_data.length > 0)
      .slice(0, 3);
  }, [indicators, selectedIndicators]);

  const chartData = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const monthNum = idx + 1;
      const dataPoint: Record<string, any> = { month };
      
      displayIndicators.forEach(ind => {
        const periodData = ind.period_data?.find(pd => pd.month === monthNum && pd.year === year);
        dataPoint[ind.id] = periodData?.measured_value || null;
        dataPoint[`${ind.id}_target`] = ind.target_value;
      });
      
      return dataPoint;
    });
  }, [displayIndicators, year]);

  const toggleIndicator = (id: string) => {
    setSelectedIndicators(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  if (indicators.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Nenhum indicador cadastrado
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {indicators.slice(0, 10).map((ind, idx) => (
          <button
            key={ind.id}
            onClick={() => toggleIndicator(ind.id)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedIndicators.includes(ind.id) || (selectedIndicators.length === 0 && displayIndicators.some(d => d.id === ind.id))
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border'
            }`}
          >
            {ind.code || ind.name.slice(0, 15)}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="month" 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
          <Legend />
          
          {displayIndicators.map((ind, idx) => (
            <Line
              key={ind.id}
              type="monotone"
              dataKey={ind.id}
              name={ind.code || ind.name}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {displayIndicators.length === 0 && (
        <p className="text-center text-muted-foreground text-sm">
          Selecione indicadores para visualizar no gráfico
        </p>
      )}
    </div>
  );
}
