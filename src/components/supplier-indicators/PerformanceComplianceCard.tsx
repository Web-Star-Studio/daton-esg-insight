import { Card, CardContent } from '@/components/ui/card';
import { Users, Star, Award, Package, DollarSign } from 'lucide-react';
import type { PerformanceIndicator } from '@/services/supplierIndicatorsService';

interface PerformanceComplianceCardProps {
  data: PerformanceIndicator;
  isLoading?: boolean;
}

export function PerformanceComplianceCard({ data, isLoading }: PerformanceComplianceCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 4) return { color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
    if (score >= 3) return { color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const cards = [
    {
      title: 'Avaliados',
      value: data.totalEvaluated,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Nota Média',
      value: data.averageScore.toFixed(1),
      icon: Star,
      ...getScoreColor(data.averageScore)
    },
    {
      title: 'Qualidade',
      value: data.qualityScore.toFixed(1),
      icon: Award,
      ...getScoreColor(data.qualityScore)
    },
    {
      title: 'Entrega',
      value: data.deliveryScore.toFixed(1),
      icon: Package,
      ...getScoreColor(data.deliveryScore)
    },
    {
      title: 'Preço',
      value: data.priceScore.toFixed(1),
      icon: DollarSign,
      ...getScoreColor(data.priceScore)
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
