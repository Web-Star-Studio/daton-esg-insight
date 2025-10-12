import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, MoreVertical, Brain, CheckCircle2, Clock, Circle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { updateConditionStatus } from '@/services/licenseAI';
import { toast } from 'sonner';

interface ConditionCardProps {
  condition: any;
  onUpdate: () => void;
  onCreateObservation?: () => void;
}

export const ConditionCard: React.FC<ConditionCardProps> = ({ condition, onUpdate, onCreateObservation }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateConditionStatus(condition.id, newStatus);
      toast.success('Status atualizado');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-muted/10 text-muted-foreground';
      default: return 'bg-muted/10';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Concluída' };
      case 'in_progress':
        return { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Em Andamento' };
      case 'noted':
        return { icon: Circle, color: 'text-accent', bg: 'bg-accent/10', label: 'Anotada' };
      default:
        return { icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/10', label: 'Pendente' };
    }
  };

  const statusConfig = getStatusConfig(condition.status);
  const StatusIcon = statusConfig.icon;

  const isOverdue = condition.due_date && new Date(condition.due_date) < new Date();

  return (
    <Card className={`transition-all hover:shadow-md ${isOverdue ? 'border-destructive/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Condition Text */}
            <p className="text-sm font-medium leading-relaxed">{condition.condition_text}</p>

            {/* Meta Information */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
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
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(condition.due_date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    {isOverdue && <Badge variant="destructive" className="text-xs ml-1">Atrasada</Badge>}
                  </div>
                </>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={getPriorityColor(condition.priority)}
              >
                {condition.priority === 'high' ? 'Alta' : 
                 condition.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
              
              <Badge variant="outline" className={statusConfig.bg}>
                <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.color}`} />
                {statusConfig.label}
              </Badge>
              
              {condition.ai_extracted && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  IA {Math.round((condition.ai_confidence || 0) * 100)}%
                </Badge>
              )}
            </div>

            {/* Quick Action: Create Observation */}
            {onCreateObservation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateObservation}
                className="mt-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                Adicionar Observação
              </Button>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                <Clock className="h-4 w-4 mr-2" />
                Em Andamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como Concluída
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('pending')}>
                <Circle className="h-4 w-4 mr-2" />
                Voltar para Pendente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
