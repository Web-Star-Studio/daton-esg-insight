import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface ESGScoreGaugeProps {
  score: number; // 0-100
  label?: string;
  showDetails?: boolean;
}

export function ESGScoreGauge({ score, label = "Score ESG Geral", showDetails = true }: ESGScoreGaugeProps) {
  // Garantir que o score está entre 0-100
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // Determinar cor baseada no score
  const getScoreColor = (value: number) => {
    if (value >= 80) return "hsl(var(--success))";
    if (value >= 60) return "hsl(var(--warning))";
    if (value >= 40) return "hsl(var(--accent))";
    return "hsl(var(--destructive))";
  };

  // Determinar nível qualitativo
  const getScoreLevel = (value: number) => {
    if (value >= 80) return "Excelente";
    if (value >= 60) return "Bom";
    if (value >= 40) return "Regular";
    return "Necessita Melhoria";
  };

  // Dados para o gauge (semi-círculo)
  const gaugeData = [
    { name: "Score", value: normalizedScore, fill: getScoreColor(normalizedScore) },
    { name: "Restante", value: 100 - normalizedScore, fill: "hsl(var(--muted))" }
  ];

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {label}
          <InfoTooltip
            title="Score ESG"
            content="O Score ESG é calculado com base nos indicadores de desempenho ambiental, social e de governança da sua empresa. Quanto maior o score, melhor o desempenho ESG."
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Gauge Chart */}
          <div className="relative w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="80%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius="70%"
                  outerRadius="100%"
                  paddingAngle={0}
                  dataKey="value"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Score Display */}
            <div className="absolute inset-0 flex items-end justify-center pb-4">
              <div className="text-center">
                <div className="text-5xl font-bold" style={{ color: getScoreColor(normalizedScore) }}>
                  {normalizedScore}
                </div>
                <div className="text-sm text-muted-foreground">de 100</div>
              </div>
            </div>
          </div>

          {/* Score Level Indicator */}
          {showDetails && (
            <div className="mt-6 w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Nível:</span>
                <span 
                  className="text-sm font-bold px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${getScoreColor(normalizedScore)}20`,
                    color: getScoreColor(normalizedScore)
                  }}
                >
                  {getScoreLevel(normalizedScore)}
                </span>
              </div>

              {/* Score Range Indicator */}
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Faixa de Pontuação:</div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${normalizedScore}%`,
                      backgroundColor: getScoreColor(normalizedScore)
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
              </div>

              {/* Benchmarks */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--destructive) / 0.1)" }}>
                  <div className="font-semibold text-destructive">0-39</div>
                  <div className="text-muted-foreground">Crítico</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--accent) / 0.1)" }}>
                  <div className="font-semibold text-accent">40-59</div>
                  <div className="text-muted-foreground">Regular</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--warning) / 0.1)" }}>
                  <div className="font-semibold text-warning">60-79</div>
                  <div className="text-muted-foreground">Bom</div>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--success) / 0.1)" }}>
                  <div className="font-semibold text-success">80-100</div>
                  <div className="text-muted-foreground">Excelente</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
