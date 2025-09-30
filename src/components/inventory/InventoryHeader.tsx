import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Factory, 
  Zap, 
  TrendingUp, 
  AlertTriangle 
} from "lucide-react";

interface InventoryHeaderProps {
  stats: {
    total: number;
    escopo1: number;
    escopo2: number;
    escopo3: number;
    fontes_ativas: number;
  };
  highEmissionThreshold?: number;
}

export function InventoryHeader({ stats, highEmissionThreshold = 100 }: InventoryHeaderProps) {
  const formatEmission = (value: number) => {
    if (!value) return "0,00";
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const totalEmissions = stats.total || 0;
  const hasHighEmissions = totalEmissions > highEmissionThreshold;

  const statCards = [
    {
      title: "Total de Emissões",
      value: formatEmission(totalEmissions),
      unit: "tCO₂e",
      icon: TrendingUp,
      color: hasHighEmissions ? "text-destructive" : "text-primary",
      bgColor: hasHighEmissions ? "bg-destructive/10" : "bg-primary/10",
      alert: hasHighEmissions,
    },
    {
      title: "Escopo 1",
      value: formatEmission(stats.escopo1 || 0),
      unit: "tCO₂e",
      icon: Factory,
      color: "text-[#ef4444]",
      bgColor: "bg-[#ef4444]/10",
    },
    {
      title: "Escopo 2",
      value: formatEmission(stats.escopo2 || 0),
      unit: "tCO₂e",
      icon: Zap,
      color: "text-[#f97316]",
      bgColor: "bg-[#f97316]/10",
    },
    {
      title: "Escopo 3",
      value: formatEmission(stats.escopo3 || 0),
      unit: "tCO₂e",
      icon: Building2,
      color: "text-[#eab308]",
      bgColor: "bg-[#eab308]/10",
    },
  ];

  return (
    <>
      {hasHighEmissions && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Emissões Elevadas Detectadas</p>
            <p className="text-sm text-muted-foreground">
              As emissões totais de {formatEmission(totalEmissions)} tCO₂e estão acima do limite de {highEmissionThreshold} tCO₂e. 
              Considere revisar suas fontes de emissão e implementar medidas de redução.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <span className="text-xs text-muted-foreground">{stat.unit}</span>
              </div>
              {stat.alert && (
                <Badge variant="destructive" className="mt-2">
                  Acima do limite
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
