import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronRight } from 'lucide-react';
import { CostCenterWithChildren } from '@/services/costCenters';

interface CostCenterTreeProps {
  centers: CostCenterWithChildren[];
  onSelect?: (center: CostCenterWithChildren) => void;
}

export function CostCenterTree({ centers, onSelect }: CostCenterTreeProps) {
  const renderCenter = (center: CostCenterWithChildren, level: number = 0) => {
    const hasChildren = center.children && center.children.length > 0;
    const budgetUsage = center.budget ? (center.totalSpent / center.budget) * 100 : 0;
    
    const getBudgetColor = () => {
      if (budgetUsage > 100) return 'text-destructive';
      if (budgetUsage > 80) return 'text-yellow-600';
      return 'text-muted-foreground';
    };

    return (
      <div key={center.id}>
        <div 
          className={`flex items-center justify-between p-3 hover:bg-accent/50 rounded-md cursor-pointer transition-colors ${level > 0 ? 'ml-6' : ''}`}
          onClick={() => onSelect?.(center)}
        >
          <div className="flex items-center gap-2">
            {hasChildren && <ChevronRight className="h-4 w-4" />}
            <Building2 className="h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">{center.name}</div>
              {center.code && <div className="text-xs text-muted-foreground">{center.code}</div>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {center.budget && (
              <div className="text-right text-sm">
                <div className={getBudgetColor()}>
                  R$ {center.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                  de R$ {center.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
            <Badge variant={center.status === 'ativo' ? 'default' : 'secondary'}>
              {center.status}
            </Badge>
          </div>
        </div>
        {hasChildren && (
          <div className="mt-1">
            {center.children!.map(child => renderCenter(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hierarquia de Centros de Custo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {centers.map(center => renderCenter(center))}
        </div>
      </CardContent>
    </Card>
  );
}
