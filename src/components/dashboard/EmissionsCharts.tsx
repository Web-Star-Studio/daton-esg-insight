import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartSkeleton } from '@/components/SmartSkeleton';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EmissionsChartsProps {
  escopoData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  fontesEscopo1Data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  isLoading: boolean;
}

const renderCustomizedLabel = (entry: any) => {
  if (entry.value > 0) {
    return `${entry.value}%`;
  }
  return null;
};

export function EmissionsCharts({ escopoData, fontesEscopo1Data, isLoading }: EmissionsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Emissões por Escopo */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Emissões por Escopo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <SmartSkeleton variant="chart" className="h-full" />
            ) : escopoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={escopoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {escopoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Percentual']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color }}>{value}: {entry.payload.value}%</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado de emissões encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fontes de Emissão - Escopo 1 */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Fontes de Emissão - Escopo 1</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {isLoading ? (
              <SmartSkeleton variant="chart" className="h-full" />
            ) : fontesEscopo1Data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fontesEscopo1Data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fontesEscopo1Data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Percentual']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => (
                      <span style={{ color: entry.color }}>{value}: {entry.payload.value}%</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum dado de Escopo 1 encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
