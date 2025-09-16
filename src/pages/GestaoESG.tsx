import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { GlobalSearchInterface } from "@/components/GlobalSearchInterface";
import { IntelligentAlertsSystem } from "@/components/IntelligentAlertsSystem";
import { PredictiveDashboard } from "@/components/PredictiveDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardWithAI } from "@/components/CardWithAI";
import { TrendingUp, TrendingDown, Minus, ChevronRight, AlertCircle } from "lucide-react";
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
const KPICard = ({ kpi, pillar, navigate }: { kpi: any; pillar: string; navigate: any }) => {
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
    onClick={() => hasNavigation && navigate(path)}>
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
const PillarCard = ({ title, data, color, pillar, navigate }: { 
  title: string; 
  data: any; 
  color: string;
  pillar: string;
  navigate: any;
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
          <KPICard key={index} kpi={kpi} pillar={pillar} navigate={navigate} />
        ))}
      </CardContent>
    </Card>
  );
};

export default function GestaoESG() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: esgData, isLoading, error, refetch } = useQuery<ESGDashboardResponse>({
    queryKey: ['esg-dashboard'],
    queryFn: getESGDashboard,
    retry: 2,
    retryDelay: 1000,
  });

  // Mock data as fallback
  const mockESGData = {
    overall_esg_score: 75,
    environmental: {
      score: 70,
      kpis: [
        { key: "total_emissions", label: "Emissões Totais", value: "1,250", trend: -2.5, unit: "tCO₂e" },
        { key: "recycling_rate", label: "Taxa de Reciclagem", value: "68", trend: 3.2, unit: "%" },
        { key: "energy_efficiency", label: "Eficiência Energética", value: "82", trend: 1.8, unit: "%" }
      ]
    },
    social: {
      score: 80,
      kpis: [
        { key: "employee_satisfaction", label: "Satisfação dos Funcionários", value: "8.2", trend: 0.5, unit: "/10" },
        { key: "training_hours", label: "Horas de Treinamento", value: "45", trend: 12.3, unit: "h/pessoa" },
        { key: "diversity_index", label: "Índice de Diversidade", value: "7.5", trend: 2.1, unit: "/10" }
      ]
    },
    governance: {
      score: 75,
      kpis: [
        { key: "goals_on_track", label: "% Metas no Prazo", value: "100", trend: 5, unit: "%" },
        { key: "compliance_rate", label: "Taxa de Conformidade", value: "96", trend: 1.5, unit: "%" },
        { key: "audit_score", label: "Score de Auditoria", value: "8.8", trend: 0.8, unit: "/10" }
      ]
    }
  };

  const displayData = esgData || mockESGData;

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

  const KPICardComponent = ({ kpi, pillar }: { kpi: any; pillar: string }) => {
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
      const routeMap: { [key: string]: string } = {
        'total_emissions': '/inventario-gee',
        'recycling_rate': '/residuos',
        'license_compliance': '/licenciamento',
        'goals_on_track': '/metas',
        'policy_compliance': '/compliance',
        'board_diversity': '/configuracao',
        'employee_satisfaction': '/configuracao',
        'training_hours': '/configuracao',
        'diversity_index': '/configuracao',
        'compliance_rate': '/compliance',
        'audit_score': '/auditoria',
        'transparency_index': '/relatorios',
        'energy_efficiency': '/inventario-gee'
      };

      return routeMap[key] || '#';
    };

    const path = getNavigationPath(kpi.key);
    const hasNavigation = path !== '#';

    return (
      <Card className={cn(
        "transition-colors", 
        hasNavigation && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={() => hasNavigation && navigate(path)}>
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

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div />
            <GlobalSearchInterface onNavigate={(path) => navigate(path)} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Painel de Gestão Estratégica ESG</h1>
          <p className="text-lg text-muted-foreground">
            Visão consolidada dos pilares Ambiental, Social e de Governança
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-destructive/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar dados ESG. Mostrando dados de exemplo.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                className="ml-2"
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Intelligent Alerts */}
        <IntelligentAlertsSystem />

        {/* Predictive Insights */}
        <PredictiveDashboard />

        {/* Central ESG Score */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-muted-foreground">Score ESG Geral</h3>
                  <div className="flex justify-center my-6">
                    <CircularProgress value={displayData.overall_esg_score} size={180} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Baseado em métricas ambientais, sociais e de governança
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ESG Pillars Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-600">Ambiental</h3>
                  <p className="text-3xl font-bold mt-2">(E)</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                    {displayData.environmental.score}/100
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-600">Social</h3>
                  <p className="text-3xl font-bold mt-2">(S)</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-500 text-white text-lg px-3 py-1">
                    {displayData.social.score}/100
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-purple-600">Governança</h3>
                  <p className="text-3xl font-bold mt-2">(G)</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                    87/100
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics by Pillar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Environmental Metrics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-green-600 border-b border-green-200 pb-2">
              Métricas Ambientais
            </h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Emissões</p>
                      <p className="text-2xl font-bold">5.218</p>
                      <p className="text-xs text-muted-foreground">tCO₂e</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs text-red-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        12%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Reciclagem</p>
                      <p className="text-2xl font-bold">0%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Social Metrics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-600 border-b border-blue-200 pb-2">
              Métricas Sociais
            </h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Rotatividade</p>
                      <p className="text-2xl font-bold">12%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Horas de Treinamento</p>
                      <p className="text-2xl font-bold">24h</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +3%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Governance Metrics */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-purple-600 border-b border-purple-200 pb-2">
              Métricas de Governança
            </h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">% Metas no Prazo</p>
                      <p className="text-2xl font-bold">100%</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-xs text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Conformidade com Políticas</p>
                      <p className="text-2xl font-bold">95%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Sem alteração</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Insights and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                Pontos Fortes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                  Governança com score de 87/100, acima da média do setor
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                  100% das metas estão dentro do prazo estabelecido
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                  Redução de 12% nas emissões em relação ao período anterior
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-5 w-5" />
                Oportunidades de Melhoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                  Implementar programa de reciclagem para aumentar taxa de 0%
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                  Expandir horas de treinamento para superar média do setor
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></span>
                  Diversificar matriz energética com fontes renováveis
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Methodology Information */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Metodologia de Cálculo ESG</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <h4 className="font-semibold text-green-700">Ambiental (40%)</h4>
                </div>
                <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                  <li>• Gestão de Emissões GEE</li>
                  <li>• Eficiência no Uso de Recursos</li>
                  <li>• Conformidade Ambiental</li>
                  <li>• Gestão de Resíduos</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <h4 className="font-semibold text-blue-700">Social (30%)</h4>
                </div>
                <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                  <li>• Satisfação dos Colaboradores</li>
                  <li>• Desenvolvimento e Treinamento</li>
                  <li>• Diversidade e Inclusão</li>
                  <li>• Saúde e Segurança</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <h4 className="font-semibold text-purple-700">Governança (30%)</h4>
                </div>
                <ul className="text-sm text-muted-foreground ml-6 space-y-1">
                  <li>• Cumprimento de Metas</li>
                  <li>• Conformidade Regulatória</li>
                  <li>• Transparência e Ética</li>
                  <li>• Gestão de Riscos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}