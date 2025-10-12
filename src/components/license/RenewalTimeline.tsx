import React from 'react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RenewalTimelineProps {
  startDate: Date;
  protocolDeadline: Date;
  expirationDate: Date;
}

export const RenewalTimeline: React.FC<RenewalTimelineProps> = ({
  startDate,
  protocolDeadline,
  expirationDate,
}) => {
  const today = new Date();
  const totalDays = differenceInDays(expirationDate, startDate);
  const daysSinceStart = differenceInDays(today, startDate);
  const daysUntilProtocol = differenceInDays(protocolDeadline, today);
  const daysUntilExpiration = differenceInDays(expirationDate, today);

  const milestones = [
    {
      label: 'Início',
      date: startDate,
      icon: CheckCircle2,
      status: daysSinceStart >= 0 ? 'completed' : 'pending',
    },
    {
      label: 'Protocolo',
      date: protocolDeadline,
      icon: Clock,
      status: daysUntilProtocol <= 0 ? 'completed' : daysUntilProtocol < 7 ? 'urgent' : 'pending',
    },
    {
      label: 'Vencimento',
      date: expirationDate,
      icon: AlertTriangle,
      status: daysUntilExpiration <= 0 ? 'overdue' : 'pending',
    },
  ];

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h4 className="text-sm font-medium">Timeline do Processo</h4>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        
        {/* Milestones */}
        <div className="relative flex justify-between">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const statusColors = {
              completed: 'bg-success text-success-foreground',
              pending: 'bg-muted text-muted-foreground',
              urgent: 'bg-warning text-warning-foreground',
              overdue: 'bg-destructive text-destructive-foreground',
            };

            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center relative z-10',
                    statusColors[milestone.status]
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{milestone.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(milestone.date, 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-background rounded">
          <p className="text-muted-foreground">Prazo de Protocolo</p>
          <p className="font-medium">
            {daysUntilProtocol > 0 ? `${daysUntilProtocol} dias restantes` : 'Prazo vencido'}
          </p>
        </div>
        <div className="p-2 bg-background rounded">
          <p className="text-muted-foreground">Vencimento da Licença</p>
          <p className="font-medium">
            {daysUntilExpiration > 0 ? `${daysUntilExpiration} dias` : 'Vencida'}
          </p>
        </div>
      </div>
    </div>
  );
};
