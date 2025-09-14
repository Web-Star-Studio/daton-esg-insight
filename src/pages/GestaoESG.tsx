import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardWithAI } from "@/components/CardWithAI";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { getESGDashboard, type ESGDashboardResponse } from "@/services/esg";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Circular Progress Component for ESG Score
const CircularProgress = ({ value, size = 200 }: { value: number; size?: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
  
  const getColorByScore = (score: number) => {
    if (score >= 80) return "hsl(var(--chart-2))"; // Green
    if (score >= 60) return "hsl(var(--chart-3))"; // Yellow
    return "hsl(var(--chart-1))"; // Red
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColorByScore(value)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">Score ESG</span>
      </div>
    </div>
  );
};

// KPI Card Component
const KPICard = ({ kpi, pillar }: { kpi: any; pillar: string }) => {
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendText = (trend: number) => {
    if (trend === 0) return "Sem alteração";
    return `${trend > 0 ? '+' : ''}${trend}%`;
  };

  const getNavigationPath = (key: string) => {
    switch (key) {
      case 'total_emissions':
        return '/dashboard-ghg';
      case 'recycling_rate':
        return '/residuos';
      case 'license_compliance':
        return '/licenciamento';
      case 'goals_on_track':
        return '/metas';
      default:
        return '#';
    }
  };

  const path = getNavigationPath(kpi.key);
  const hasNavigation = path !== '#';

  return (
    <Card className={cn(
      "transition-colors", 
      hasNavigation && "cursor-pointer hover:bg-muted/50"
    )}
    onClick={() => hasNavigation && (window.location.href = path)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl font-semibold">
              {kpi.value}{kpi.unit && kpi.unit !== 'índice' && ` ${kpi.unit}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs">
              {getTrendIcon(kpi.trend)}
              <span className="ml-1">{getTrendText(kpi.trend)}</span>
            </div>
            {hasNavigation && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Pillar Card Component
const PillarCard = ({ title, data, color, pillar }: { 
  title: string; 
  data: any; 
  color: string;
  pillar: string;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge className={cn("text-white", getScoreColor(data.score))}>
            {data.score}/100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.kpis.map((kpi: any, index: number) => (
          <KPICard key={index} kpi={kpi} pillar={pillar} />
        ))}
      </CardContent>
    </Card>
  );
};

export default function GestaoESG() {
  const { toast } = useToast();
  
  const { data: esgData, isLoading, error } = useQuery<ESGDashboardResponse>({
    queryKey: ['esg-dashboard'],
    queryFn: getESGDashboard,
    retry: 1,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard ESG",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Painel de Gestão Estratégica ESG</h1>
          </div>

          {/* Loading Skeleton */}
          <div className="flex justify-center">
            <Skeleton className="w-[200px] h-[200px] rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !esgData) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Erro ao carregar dados ESG
          </h1>
          <p className="text-muted-foreground">
            Verifique sua conexão e tente novamente
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Painel de Gestão Estratégica ESG</h1>
            <p className="text-muted-foreground mt-2">
              Visão consolidada dos pilares Ambiental, Social e de Governança
            </p>
          </div>
        </div>

        {/* Central ESG Score com IA */}
        <div className="flex justify-center">
          <CardWithAI
            cardType="esg_score"
            cardData={{ 
              overall_esg_score: esgData.overall_esg_score || 0,
              environmental: esgData.environmental,
              social: esgData.social,
              governance: esgData.governance
            }}
            title="Score ESG Geral"
            value={esgData.overall_esg_score}
            subtitle="Baseado em métricas ambientais, sociais e de governança"
            className="text-center p-8 min-w-[300px]"
          >
            <div className="mb-4 flex justify-center">
              <CircularProgress value={esgData.overall_esg_score} size={200} />
            </div>
          </CardWithAI>
        </div>

        {/* ESG Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PillarCard
            title="Ambiental (E)"
            data={esgData.environmental}
            color="green"
            pillar="environmental"
          />
          <PillarCard
            title="Social (S)"
            data={esgData.social}
            color="blue"
            pillar="social"
          />
          <PillarCard
            title="Governança (G)"
            data={esgData.governance}
            color="purple"
            pillar="governance"
          />
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Como o Score ESG é Calculado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-green-600">Ambiental (40%)</h4>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Conformidade de Licenças (40%)</li>
                  <li>• Taxa de Reciclagem (35%)</li>
                  <li>• Gestão de Emissões (25%)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600">Social (30%)</h4>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Taxa de Rotatividade (40%)</li>
                  <li>• Horas de Treinamento (35%)</li>
                  <li>• Índice de Diversidade (25%)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600">Governança (30%)</h4>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>• Metas no Prazo (50%)</li>
                  <li>• Conformidade Política (30%)</li>
                  <li>• Diversidade Conselho (20%)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}