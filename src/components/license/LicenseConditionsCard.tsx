import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle, Calendar, Brain, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Condition {
  id: string;
  condition_text: string;
  condition_category?: string;
  frequency?: string;
  due_date?: string;
  priority: string;
  status: string;
  ai_extracted?: boolean;
  ai_confidence?: number;
}

interface LicenseConditionsCardProps {
  conditions?: Condition[];
  isLoading: boolean;
  onUpdateStatus: (conditionId: string, newStatus: string) => void;
}

export function LicenseConditionsCard({ conditions, isLoading, onUpdateStatus }: LicenseConditionsCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      "high": { variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
      "medium": { variant: "secondary" as const, className: "bg-warning/10 text-warning border-warning/20" },
      "low": { variant: "outline" as const, className: "bg-muted/10" }
    };

    const config = priorityMap[priority as keyof typeof priorityMap] || priorityMap["medium"];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Condicionantes da Licença
          {conditions && conditions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {conditions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : conditions && conditions.length > 0 ? (
          <div className="space-y-3">
            {conditions.map((condition) => (
              <div key={condition.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">{condition.condition_text}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="capitalize">{condition.condition_category?.replace('_', ' ')}</span>
                      {condition.frequency && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{condition.frequency}</span>
                        </>
                      )}
                      {condition.due_date && (
                        <>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(condition.due_date)}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(condition.priority)}
                      <Badge 
                        variant={condition.status === 'completed' ? 'default' : condition.status === 'in_progress' ? 'secondary' : 'outline'}
                        className={
                          condition.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                          condition.status === 'in_progress' ? 'bg-warning/10 text-warning border-warning/20' : ''
                        }
                      >
                        {condition.status === 'completed' ? 'Concluída' : 
                         condition.status === 'in_progress' ? 'Em Andamento' : 
                         condition.status === 'noted' ? 'Anotada' : 'Pendente'}
                      </Badge>
                      {condition.ai_extracted && (
                        <Badge variant="outline" className="text-xs">
                          <Brain className="h-3 w-3 mr-1" />
                          IA {Math.round((condition.ai_confidence || 0) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onUpdateStatus(condition.id, 'in_progress')}>
                        Em Andamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(condition.id, 'completed')}>
                        Marcar como Concluída
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(condition.id, 'pending')}>
                        Voltar para Pendente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma condicionante identificada</p>
            <p className="text-xs mt-1">As condicionantes serão extraídas automaticamente durante a análise IA</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
