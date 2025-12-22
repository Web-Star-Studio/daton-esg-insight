import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface NPSData {
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  score: number;
  category: 'excellent' | 'very_good' | 'reasonable' | 'bad';
}

interface NPSScoreCardProps {
  fieldLabel: string;
  data: NPSData;
}

const categoryConfig = {
  excellent: {
    label: 'Excelente',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-500',
    description: '75 a 100'
  },
  very_good: {
    label: 'Muito Bom',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-500',
    description: '50 a 74'
  },
  reasonable: {
    label: 'Razoável',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-500',
    description: '0 a 49'
  },
  bad: {
    label: 'Ruim',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-500',
    description: 'Negativo'
  }
};

export function calculateNPS(responses: number[]): NPSData {
  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  responses.forEach(score => {
    if (score >= 9) promoters++;
    else if (score >= 7) passives++;
    else detractors++;
  });

  const total = promoters + passives + detractors;
  const score = total > 0
    ? Math.round((promoters / total) * 100 - (detractors / total) * 100)
    : 0;

  let category: NPSData['category'] = 'bad';
  if (score >= 75) category = 'excellent';
  else if (score >= 50) category = 'very_good';
  else if (score >= 0) category = 'reasonable';

  return { promoters, passives, detractors, total, score, category };
}

export function NPSScoreCard({ fieldLabel, data }: NPSScoreCardProps) {
  const config = categoryConfig[data.category];
  const promotersPct = data.total > 0 ? Math.round((data.promoters / data.total) * 100) : 0;
  const passivesPct = data.total > 0 ? Math.round((data.passives / data.total) * 100) : 0;
  const detractorsPct = data.total > 0 ? Math.round((data.detractors / data.total) * 100) : 0;

  // Determine trend icon
  const TrendIcon = data.score > 0 ? TrendingUp : data.score < 0 ? TrendingDown : Minus;

  return (
    <Card className={cn("overflow-hidden border-l-4", config.borderColor)}>
      <CardHeader className={cn("pb-2", config.bgColor)}>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          📊 NPS - {fieldLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Main Score */}
        <div className="text-center">
          <div className={cn("text-5xl font-bold", config.color)}>
            {data.score > 0 ? `+${data.score}` : data.score}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <TrendIcon className={cn("h-4 w-4", config.color)} />
            <span className={cn("font-semibold", config.color)}>{config.label}</span>
            <span className="text-muted-foreground text-sm">({config.description})</span>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="space-y-3 pt-3 border-t">
          {/* Promoters */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                <span>Promotores (9-10)</span>
              </div>
              <span className="font-medium">{promotersPct}% ({data.promoters})</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${promotersPct}%` }}
              ></div>
            </div>
          </div>

          {/* Passives */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500"></span>
                <span>Neutros (7-8)</span>
              </div>
              <span className="font-medium">{passivesPct}% ({data.passives})</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${passivesPct}%` }}
              ></div>
            </div>
          </div>

          {/* Detractors */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                <span>Detratores (0-6)</span>
              </div>
              <span className="font-medium">{detractorsPct}% ({data.detractors})</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${detractorsPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          Total de respostas: <span className="font-semibold">{data.total}</span>
        </div>
      </CardContent>
    </Card>
  );
}
