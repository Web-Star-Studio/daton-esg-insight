/**
 * OccurrenceSummary - Resumo de ocorrências e penalidades
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertOctagon, AlertTriangle, Eye, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";

interface OccurrenceSummaryProps {
  ncMajorCount: number;
  ncMinorCount: number;
  observationCount: number;
  opportunityCount: number;
  ncMajorPenalty?: number;
  ncMinorPenalty?: number;
  observationPenalty?: number;
  opportunityBonus?: number;
}

export function OccurrenceSummary({
  ncMajorCount,
  ncMinorCount,
  observationCount,
  opportunityCount,
  ncMajorPenalty = 10,
  ncMinorPenalty = 5,
  observationPenalty = 2,
  opportunityBonus = 1
}: OccurrenceSummaryProps) {
  const totalPenalty = 
    (ncMajorCount * ncMajorPenalty) +
    (ncMinorCount * ncMinorPenalty) +
    (observationCount * observationPenalty);
  
  const totalBonus = opportunityCount * opportunityBonus;
  const netImpact = totalBonus - totalPenalty;

  const occurrences = [
    {
      label: 'NC Maior',
      count: ncMajorCount,
      penalty: ncMajorPenalty,
      total: ncMajorCount * ncMajorPenalty,
      icon: AlertOctagon,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'NC Menor',
      count: ncMinorCount,
      penalty: ncMinorPenalty,
      total: ncMinorCount * ncMinorPenalty,
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Observação',
      count: observationCount,
      penalty: observationPenalty,
      total: observationCount * observationPenalty,
      icon: Eye,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: 'Oportunidade',
      count: opportunityCount,
      penalty: -opportunityBonus,
      total: opportunityCount * opportunityBonus,
      icon: Lightbulb,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      isBonus: true
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Impacto das Ocorrências</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {occurrences.map((occ) => (
          <div 
            key={occ.label}
            className={`flex items-center justify-between p-3 rounded-lg ${occ.bgColor}`}
          >
            <div className="flex items-center gap-3">
              <occ.icon className={`h-5 w-5 ${occ.color}`} />
              <div>
                <div className="font-medium">{occ.label}</div>
                <div className="text-xs text-muted-foreground">
                  {occ.count} × {Math.abs(occ.penalty)} pts
                </div>
              </div>
            </div>
            <div className={`text-lg font-semibold ${occ.isBonus ? 'text-green-500' : 'text-red-500'}`}>
              {occ.isBonus ? '+' : '-'}{occ.total}
            </div>
          </div>
        ))}

        {/* Resumo do impacto */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Impacto Total</span>
            <div className={`flex items-center gap-2 text-xl font-bold ${
              netImpact >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {netImpact >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {netImpact >= 0 ? '+' : ''}{netImpact} pts
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
