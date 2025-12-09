import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IntelligentAlertsSystem } from "@/components/IntelligentAlertsSystem";
import { PredictiveDashboard } from "@/components/PredictiveDashboard";
import { ContextualInsightsPanel } from "@/components/ContextualInsightsPanel";
import { PredictiveAlertsWidget } from "@/components/PredictiveAlertsWidget";
import { SmartRecommendationsEngine } from "@/components/SmartRecommendationsEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SmartSkeleton } from "@/components/SmartSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardWithAI } from "@/components/CardWithAI";
import { TrendingUp, TrendingDown, Minus, ChevronRight, AlertCircle } from "lucide-react";
import { getESGDashboard, type ESGDashboardResponse } from "@/services/esg";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Enhanced Circular Progress Component for ESG Score
const CircularProgress = ({ value, size = 200 }: { value: number; size?: number }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
  
  // Improved color system based on score ranges
  const getColorByScore = (score: number) => {
    if (score >= 85) return "hsl(142, 76%, 36%)"; // Vibrant green
    if (score >= 75) return "hsl(120, 60%, 45%)"; // Green
    if (score >= 65) return "hsl(84, 81%, 44%)"; // Light green
    if (score >= 55) return "hsl(45, 93%, 47%)"; // Yellow-orange
    if (score >= 40) return "hsl(25, 95%, 53%)"; // Orange
    if (score >= 25) return "hsl(14, 90%, 53%)"; // Red-orange
    return "hsl(0, 84%, 60%)"; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excelente";
    if (score >= 75) return "Muito Bom";
    if (score >= 65) return "Bom";
    if (score >= 55) return "Satisfatório";
    if (score >= 40) return "Regular";
    if (score >= 25) return "Insuficiente";
    return "Crítico";
  };

  const scoreColor = getColorByScore(value);
  
  return (
    <div className="relative flex items-center justify-center group">
      {/* Background glow effect */}
      <div 
        className="absolute rounded-full opacity-20 animate-pulse blur-lg"
        style={{ 
          width: size * 0.8, 
          height: size * 0.8, 
          backgroundColor: scoreColor,
          transition: 'all 0.5s ease-in-out'
        }}
      />
      
      {/* Main SVG circle */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="transform rotate-[-90deg] transition-all duration-700 ease-out group-hover:scale-105"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="hsl(var(--muted)/0.2)"
          strokeWidth="6"
          fill="none"
        />
        {/* Progress circle with smooth animation */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={scoreColor}
          strokeWidth="6"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.1))',
            strokeDashoffset: 0,
          }}
        />
      </svg>
      
      {/* Center content with improved styling */}
      <div className="absolute text-center space-y-1">
        <div 
          className="text-4xl md:text-5xl font-bold transition-all duration-500"
          style={{ color: scoreColor }}
        >
          {value}
        </div>
        <div className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          ESG Score
        </div>
        <div 
          className="text-xs md:text-sm font-semibold px-2 py-1 rounded-full transition-all duration-300"
          style={{ 
            color: scoreColor,
            backgroundColor: `${scoreColor}15`,
            border: `1px solid ${scoreColor}30`
          }}
        >
          {getScoreLabel(value)}
        </div>
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

    switch(pillar) {
      case 'environmental':
        return '/inventario-gee';
      case 'social':
        return '/configuracao';
      case 'governance':
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
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{kpi.value}</span>
              <span className="text-sm text-muted-foreground">{kpi.unit}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getTrendIcon(kpi.trend)}
              <span className={cn(
                "text-sm font-medium",
                kpi.trend > 0 ? "text-green-600" : kpi.trend < 0 ? "text-red-600" : "text-muted-foreground"
              )}>
                {getTrendText(kpi.trend)}
              </span>
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

  // Real ESG data will come from API - no mock fallback
  const emptyESGData = {
    overall_esg_score: 0,
    environmental: {
      score: 0,
      kpis: []
    },
    social: {
      score: 0,
      kpis: []
    },
    governance: {
      score: 0,
      kpis: []
    }
  };

  const displayData = esgData || emptyESGData;

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Painel de Gestão Estratégica ESG</h1>
        </div>

        <SmartSkeleton variant="dashboard" />
      </div>
    );
  }

  // KPICardComponent removed - using KPI cards inside PillarCard only

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2" data-tour="esg-header">
          <div className="flex items-center justify-between mb-4">
            <div />
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

        {/* Enhanced Overall ESG Score */}
        <Card className="col-span-full overflow-hidden relative group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="text-center relative z-10 pb-2">
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Score ESG Geral
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Avaliação consolidada dos pilares Environmental, Social e Governance
            </p>
          </CardHeader>
          <CardContent className="flex justify-center py-8 relative z-10">
            <div className="scale-90 sm:scale-100 md:scale-110 transition-transform duration-300">
              <CircularProgress 
                value={displayData.overall_esg_score} 
                size={200}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pillar Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PillarCard 
            title="🌱 Ambiental" 
            data={displayData.environmental} 
            color="green" 
            pillar="environmental"
            navigate={navigate}
          />
          <PillarCard 
            title="👥 Social" 
            data={displayData.social} 
            color="blue" 
            pillar="social"
            navigate={navigate}
          />
          <PillarCard 
            title="⚖️ Governança" 
            data={displayData.governance} 
            color="purple" 
            pillar="governance"
            navigate={navigate}
          />
        </div>

        {/* Smart Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IntelligentAlertsSystem />
          <PredictiveDashboard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ContextualInsightsPanel />
          <PredictiveAlertsWidget />
        </div>

        <SmartRecommendationsEngine />

        {/* ESG Methodology Card */}
        <Card>
          <CardHeader>
            <CardTitle>Metodologia ESG</CardTitle>
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
                  <li>• Eficiência Energética</li>
                  <li>• Gestão de Resíduos</li>
                  <li>• Licenciamento</li>
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
    );
  }