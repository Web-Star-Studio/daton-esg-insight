import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, BookOpen, ClipboardCheck, Percent } from 'lucide-react';
import type { PortalParticipationIndicator } from '@/services/supplierIndicatorsService';

interface PortalParticipationCardProps {
  data: PortalParticipationIndicator;
  isLoading?: boolean;
}

export function PortalParticipationCard({ data, isLoading }: PortalParticipationCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getRateColor = (rate: number) => {
    if (rate >= 80) return 'text-emerald-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const cards = [
    {
      title: 'Treinamentos',
      total: data.trainings.total,
      completed: data.trainings.completed,
      rate: data.trainings.rate,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      label: 'Concluídos'
    },
    {
      title: 'Leituras',
      total: data.readings.total,
      completed: data.readings.confirmed,
      rate: data.readings.rate,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      label: 'Confirmadas'
    },
    {
      title: 'Pesquisas',
      total: data.surveys.total,
      completed: data.surveys.responded,
      rate: data.surveys.rate,
      icon: ClipboardCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      label: 'Respondidas'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium">{card.title}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Enviado</span>
                    <span className="font-medium">{card.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{card.label}</span>
                    <span className="font-medium">{card.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa</span>
                    <span className={`font-bold ${getRateColor(card.rate)}`}>
                      {card.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
