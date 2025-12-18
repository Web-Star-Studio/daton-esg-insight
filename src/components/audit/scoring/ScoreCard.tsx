/**
 * ScoreCard - Card de exibição da pontuação
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScoringService, GradeLevel } from "@/services/audit/scoring";
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, TrendingUp } from "lucide-react";

interface ScoreCardProps {
  totalScore: number;
  maxScore: number;
  percentage: number;
  conformingItems: number;
  nonConformingItems: number;
  partialItems: number;
  naItems: number;
  totalItems: number;
  respondedItems: number;
  grade?: string | null;
  status?: string;
  grades?: GradeLevel[];
}

export function ScoreCard({
  totalScore,
  maxScore,
  percentage,
  conformingItems,
  nonConformingItems,
  partialItems,
  naItems,
  totalItems,
  respondedItems,
  grade,
  status,
  grades
}: ScoreCardProps) {
  const gradesList = grades || ScoringService.getDefaultGrades();
  const currentGrade = grade 
    ? gradesList.find(g => g.grade === grade) 
    : ScoringService.determineGrade(percentage, gradesList);

  const getStatusColor = () => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'conditional': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'passed': return 'Aprovado';
      case 'conditional': return 'Condicional';
      case 'failed': return 'Reprovado';
      default: return 'Pendente';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Pontuação da Auditoria</span>
          {status && (
            <Badge className={getStatusColor()}>
              {getStatusLabel()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score principal */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div 
              className="text-6xl font-bold"
              style={{ color: currentGrade?.color || 'hsl(var(--foreground))' }}
            >
              {currentGrade?.grade || '-'}
            </div>
            <div className="text-left">
              <div className="text-3xl font-semibold">
                {percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {totalScore.toFixed(1)} / {maxScore.toFixed(1)} pontos
              </div>
            </div>
          </div>
          {currentGrade && (
            <div 
              className="mt-2 text-lg font-medium"
              style={{ color: currentGrade.color }}
            >
              {currentGrade.label}
            </div>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{respondedItems} / {totalItems} itens</span>
          </div>
          <Progress 
            value={(respondedItems / Math.max(totalItems, 1)) * 100} 
            className="h-2"
          />
        </div>

        {/* Breakdown por conformidade */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-lg font-semibold">{conformingItems}</div>
              <div className="text-xs text-muted-foreground">Conforme</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-lg font-semibold">{nonConformingItems}</div>
              <div className="text-xs text-muted-foreground">Não Conforme</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-lg font-semibold">{partialItems}</div>
              <div className="text-xs text-muted-foreground">Parcial</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold">{naItems}</div>
              <div className="text-xs text-muted-foreground">N/A</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
