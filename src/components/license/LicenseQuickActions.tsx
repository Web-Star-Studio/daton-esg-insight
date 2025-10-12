import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, FileText, ArrowRight } from 'lucide-react';
import type { LicenseDetail } from '@/services/licenses';

interface LicenseQuickActionsProps {
  license: LicenseDetail;
  conditionsCount: number;
  pendingConditionsCount: number;
  onScheduleRenewal: () => void;
  onViewConditions: () => void;
  onGenerateReport: () => void;
}

export const LicenseQuickActions: React.FC<LicenseQuickActionsProps> = ({
  license,
  conditionsCount,
  pendingConditionsCount,
  onScheduleRenewal,
  onViewConditions,
  onGenerateReport,
}) => {
  const daysUntilExpiration = Math.ceil(
    (new Date(license.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const actions = [
    {
      id: 'schedule',
      title: 'Agendar Renovação',
      description: 'Configure o processo de renovação',
      icon: Calendar,
      badge: daysUntilExpiration < 120 ? {
        text: `${daysUntilExpiration} dias restantes`,
        variant: daysUntilExpiration < 45 ? 'destructive' as const : 'secondary' as const,
      } : undefined,
      onClick: onScheduleRenewal,
      disabled: license.status === 'Vencida',
      iconColor: 'text-primary',
      bgColor: 'bg-primary/5 hover:bg-primary/10',
    },
    {
      id: 'conditions',
      title: 'Ver Condicionantes',
      description: 'Gerencie e acompanhe o cumprimento',
      icon: CheckSquare,
      badge: pendingConditionsCount > 0 ? {
        text: `${pendingConditionsCount} pendentes`,
        variant: 'secondary' as const,
      } : undefined,
      onClick: onViewConditions,
      disabled: false,
      iconColor: 'text-success',
      bgColor: 'bg-success/5 hover:bg-success/10',
    },
    {
      id: 'report',
      title: 'Gerar Relatório',
      description: 'Exporte documentos e análises',
      icon: FileText,
      badge: {
        text: '4 modelos',
        variant: 'outline' as const,
      },
      onClick: onGenerateReport,
      disabled: false,
      iconColor: 'text-accent',
      bgColor: 'bg-accent/5 hover:bg-accent/10',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Ações Rápidas
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Card
            key={action.id}
            onClick={action.disabled ? undefined : action.onClick}
            className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
              action.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${action.bgColor} transition-colors`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                {action.badge && (
                  <Badge variant={action.badge.variant} className="text-xs">
                    {action.badge.text}
                  </Badge>
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
              
              <div className="flex items-center text-sm font-medium text-primary">
                <span>Acessar</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
