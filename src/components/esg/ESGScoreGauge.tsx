import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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

  // Dados do arc
  const radius = 55;
  const stroke = 12;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

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
          {/* Gauge Chart Layout — SVG with embedded text to avoid overlap */}
          <div className="flex flex-col items-center justify-center">
            <svg className="w-[180px] h-[135px]" viewBox="0 0 160 120">
              {/* Background arc */}
              <path
                d="M 25 80 A 55 55 0 0 1 135 80"
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeOpacity={0.18}
                className="text-foreground"
              />
              {/* Foreground arc - Score */}
              <path
                d="M 25 80 A 55 55 0 0 1 135 80"
                fill="none"
                stroke={getScoreColor(normalizedScore)}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              {/* Score number — below arc baseline (y=80 + half-stroke=6 → clear from y≥86) */}
              <text
                x="80"
                y="104"
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize="44"
                fontWeight="bold"
                fill={getScoreColor(normalizedScore)}
              >
                {normalizedScore}
              </text>
              {/* "de 100" label */}
              <text
                x="80"
                y="117"
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize="12"
                fill="currentColor"
                className="text-muted-foreground"
              >
                de 100
              </text>
            </svg>
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
