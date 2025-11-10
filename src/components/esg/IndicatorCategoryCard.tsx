import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CategoryIndicators } from "@/services/esgRecommendedIndicators";
import { IndicatorMetricCard } from "./IndicatorMetricCard";
import { Flame, Droplets, Recycle, Heart, Users, Scale, DollarSign } from "lucide-react";
import { ReactNode } from "react";

interface IndicatorCategoryCardProps {
  category: CategoryIndicators;
}

const CATEGORY_CONFIG: Record<string, { icon: ReactNode; color: string; bgColor: string }> = {
  '6.1': { icon: <Flame className="h-5 w-5" />, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  '6.2': { icon: <Droplets className="h-5 w-5" />, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  '6.3': { icon: <Recycle className="h-5 w-5" />, color: 'text-green-600', bgColor: 'bg-green-50' },
  '6.4': { icon: <Heart className="h-5 w-5" />, color: 'text-red-600', bgColor: 'bg-red-50' },
  '6.5': { icon: <Users className="h-5 w-5" />, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  '6.6': { icon: <Scale className="h-5 w-5" />, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  '6.7': { icon: <DollarSign className="h-5 w-5" />, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
};

export function IndicatorCategoryCard({ category }: IndicatorCategoryCardProps) {
  const config = CATEGORY_CONFIG[category.categoryCode] || CATEGORY_CONFIG['6.1'];

  return (
    <div className="space-y-4">
      <Card className={`${config.bgColor} border-2`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{category.categoryName}</CardTitle>
                <CardDescription>
                  {category.indicators.length} indicadores • Atualizado {new Date(category.lastCalculated).toLocaleDateString('pt-BR')}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {Math.round(category.completeness)}% completo
            </Badge>
          </div>
          <Progress value={category.completeness} className="mt-3" />
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {category.indicators.map((indicator) => (
          <IndicatorMetricCard key={indicator.code} indicator={indicator} />
        ))}
      </div>
    </div>
  );
}
