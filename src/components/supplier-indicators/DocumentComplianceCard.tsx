import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, FileX, Files, TrendingUp } from 'lucide-react';
import type { DocumentComplianceIndicator } from '@/services/supplierIndicatorsService';

interface DocumentComplianceCardProps {
  data: DocumentComplianceIndicator;
  isLoading?: boolean;
}

export function DocumentComplianceCard({ data, isLoading }: DocumentComplianceCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Avaliados',
      value: data.totalEvaluated,
      icon: Files,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Conformes',
      value: data.compliant,
      icon: FileCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Não Conformes',
      value: data.nonCompliant,
      icon: FileX,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: '% Conformidade',
      value: `${data.complianceRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: data.complianceRate >= 80 ? 'text-emerald-600' : data.complianceRate >= 60 ? 'text-yellow-600' : 'text-red-600',
      bgColor: data.complianceRate >= 80 ? 'bg-emerald-50' : data.complianceRate >= 60 ? 'bg-yellow-50' : 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
