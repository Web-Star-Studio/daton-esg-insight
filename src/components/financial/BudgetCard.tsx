import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface BudgetCardProps {
  category: string;
  planned: number;
  spent: number;
  variant?: 'default' | 'warning' | 'danger';
}

export function BudgetCard({ category, planned, spent, variant = 'default' }: BudgetCardProps) {
  const percentage = planned > 0 ? (spent / planned) * 100 : 0;
  const remaining = planned - spent;
  
  const getVariantColor = () => {
    if (variant === 'danger') return 'text-destructive';
    if (variant === 'warning') return 'text-yellow-600';
    return 'text-primary';
  };

  const getIcon = () => {
    if (percentage > 100) return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (percentage > 80) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <TrendingUp className="h-4 w-4 text-primary" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{category}</span>
          {getIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Planejado</span>
            <span className="font-semibold">R$ {planned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Realizado</span>
            <span className={`font-semibold ${getVariantColor()}`}>
              R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Progress value={Math.min(percentage, 100)} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{percentage.toFixed(1)}% executado</span>
            <span className={remaining >= 0 ? 'text-muted-foreground' : 'text-destructive'}>
              R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {remaining >= 0 ? 'restante' : 'excedido'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
