import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number;
  category?: 'critical' | 'low' | 'medium' | 'high' | 'excellent';
  showScore?: boolean;
  className?: string;
}

export function HealthScoreBadge({ 
  score, 
  category, 
  showScore = true,
  className 
}: HealthScoreBadgeProps) {
  const getCategory = (score: number) => {
    if (score <= 20) return 'critical';
    if (score <= 40) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 80) return 'high';
    return 'excellent';
  };

  const cat = category || getCategory(score);

  const variants = {
    critical: "bg-red-100 text-red-800 border-red-200",
    low: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-green-100 text-green-800 border-green-200",
    excellent: "bg-emerald-100 text-emerald-800 border-emerald-200"
  };

  const labels = {
    critical: 'Crítico',
    low: 'Baixo',
    medium: 'Médio',
    high: 'Alto',
    excellent: 'Excelente'
  };

  return (
    <Badge variant="outline" className={cn(variants[cat], className)}>
      {showScore && `${score} - `}{labels[cat]}
    </Badge>
  );
}
