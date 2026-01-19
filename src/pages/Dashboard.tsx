import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, formatEmissionValue, formatEmployeeCount, formatPercentage } from '@/services/dashboardStats';
import { calculateESGScores, ESGScores } from '@/services/esgScoreService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Leaf, 
  Shield, 
  Award,
  Bell,
  Calendar,
  BarChart3,
  Target,
  Zap,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { ProductionHealthWidget } from '@/components/production/ProductionHealthWidget';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { PredictiveInsightsWidget } from '@/components/dashboard/PredictiveInsightsWidget';
import { ESGScoreGauge } from '@/components/esg/ESGScoreGauge';
import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import { KPICarousel, KPIItem } from '@/components/dashboard/KPICarousel';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  path: string;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  icon: any;
}

const getKPICards = (stats: any): KPIItem[] => [
  {
    id: 'emissions',
    title: 'Emissões CO₂',
    value: formatEmissionValue(stats?.emissions.value || 0),
    change: stats?.emissions.change || 0,
    changeType: stats?.emissions.changeType || 'neutral',
    icon: Leaf,
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Total de emissões deste mês',
    route: '/inventario-gee'
  },
  {
    id: 'compliance',
    title: 'Conformidade',
    value: formatPercentage(stats?.compliance.value || 0),
    change: stats?.compliance.change || 0,
    changeType: stats?.compliance.changeType || 'neutral',
    icon: Shield,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'Índice de conformidade regulatória',
    route: '/compliance'
  },
  {
    id: 'employees',
    title: 'Colaboradores',
    value: formatEmployeeCount(stats?.employees.value || 0),
    change: stats?.employees.change || 0,
    changeType: stats?.employees.changeType || 'neutral',
    icon: Users,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    description: 'Total de colaboradores ativos',
    route: '/gestao-funcionarios'
  },
  {
    id: 'quality',
    title: 'Qualidade',
    value: formatPercentage(stats?.quality.value || 0),
    change: stats?.quality.change || 0,
    changeType: stats?.quality.changeType || 'neutral',
    icon: Award,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Índice de qualidade dos processos',
    route: '/quality-dashboard'
  },
  {
    id: 'energy',
    title: 'Economia de Energia',
    value: '12.5 MWh',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-gradient-to-r from-primary/20 to-accent/20',
    description: 'Este mês',
    route: '/monitoramento-energia'
  },
  {
    id: 'co2-reduction',
    title: 'Redução CO₂',
    value: '-15.3%',
    changeType: 'positive',
    icon: Leaf,
    color: 'text-success',
    bgColor: 'bg-gradient-to-r from-success/20 to-primary/20',
    description: 'vs mês anterior',
    route: '/inventario-gee'
  },
  {
    id: 'hr-satisfaction',
    title: 'Satisfação RH',
    value: '4.7/5',
    icon: Users,
    color: 'text-accent',
    bgColor: 'bg-gradient-to-r from-accent/20 to-warning/20',
    description: 'Última pesquisa',
    route: '/gestao-funcionarios'
  }
];

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-emission',
    title: 'Registrar Emissão',
    description: 'Adicionar novo registro de emissão',
    icon: Plus,
    color: 'bg-green-500 hover:bg-green-600',
    path: '/inventario-gee'
  },
  {
    id: 'new-audit',
    title: 'Nova Auditoria',
    description: 'Iniciar processo de auditoria',
    icon: CheckCircle,
    color: 'bg-blue-500 hover:bg-blue-600',
    path: '/auditoria'
  },
  {
    id: 'employee-training',
    title: 'Agendar Treinamento',
    description: 'Programar capacitação para equipe',
    icon: Calendar,
    color: 'bg-purple-500 hover:bg-purple-600',
    path: '/gestao-treinamentos'
  },
  {
    id: 'generate-report',
    title: 'Gerar Relatório',
    description: 'Criar relatório personalizado',
    icon: BarChart3,
    color: 'bg-orange-500 hover:bg-orange-600',
    path: '/relatorios'
  }
];

const RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: '1',
    title: 'Inventário GEE atualizado',
    description: 'Novos dados de emissões inseridos para Q4 2024',
    time: '2 horas atrás',
    type: 'success',
    icon: Leaf
  },
  {
    id: '2',
    title: 'Auditoria SGQ agendada',
    description: 'Auditoria interna programada para próxima semana',
    time: '4 horas atrás',
    type: 'info',
    icon: Award
  },
  {
    id: '3',
    title: 'Licença ambiental vencendo',
    description: 'Licença de operação vence em 30 dias',
    time: '1 dia atrás',
    type: 'warning',
    icon: AlertCircle
  },
  {
    id: '4',
    title: 'Treinamento concluído',
    description: '25 colaboradores concluíram capacitação em SST',
    time: '2 dias atrás',
    type: 'success',
    icon: Users
  }
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', selectedTimeframe],
    queryFn: () => getDashboardStats(selectedTimeframe as any),
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: esgScores, isLoading: isLoadingESG } = useQuery({
    queryKey: ['esg-scores'],
    queryFn: calculateESGScores,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const isLoading = isLoadingStats || isLoadingESG;
  const kpiCards = getKPICards(dashboardStats);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  const getChangeColor = (changeType: KPIItem['changeType']) => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: KPIItem['changeType']) => {
    if (changeType === 'positive') return ArrowUpRight;
    if (changeType === 'negative') return ArrowDownRight;
    return null;
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <EnhancedLoading 
          variant="gradient" 
          size="lg" 
          text="Preparando seu dashboard..." 
          className="animate-fade-in"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in content-area" data-tour="dashboard-main" data-testid="dashboard-content">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground animate-fade-in">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Usuário'}! 👋
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Aqui está um resumo do seu desempenho ESG
            </p>
          </div>

          <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {selectedTimeframe !== 'month' && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="w-3 h-3" />
                Filtro ativo
              </Badge>
            )}
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 text-sm border border-border/50 rounded-lg bg-background hover:border-border transition-colors focus-ring"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este ano</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto pb-2 animate-fade-in" style={{ animationDelay: '0.3s' }} data-tour="quick-actions">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="minimal"
                size="sm"
                onClick={() => navigate(action.path)}
                className="flex-shrink-0 gap-2 transition-all hover:shadow-md focus-ring whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {action.title}
              </Button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Carousel */}
      <KPICarousel
        items={kpiCards}
        itemsPerPage={4}
        onItemClick={(item) => navigate(item.route)}
        onMenuClick={(item, action) => {
          if (action === 'details') {
            navigate(item.route);
          } else if (action === 'export') {
            console.log('Export data for:', item.id);
          }
        }}
      />

      {/* Intelligent Alerts & Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
        <AlertsPanel />
        <PredictiveInsightsWidget />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ESG Score Gauge - Phase 3 */}
        <EnhancedCard 
          className="lg:col-span-2 animate-fade-in" 
          style={{ animationDelay: '0.8s' }}
          variant="premium"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Score ESG Geral
              </CardTitle>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                Tempo real
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Overall ESG Score */}
              {esgScores?.hasData ? (
                <>
                  <ESGScoreGauge 
                    score={esgScores.overall}
                    label="Score ESG Geral"
                    showDetails={true}
                  />

                  {/* Individual Pillar Breakdown */}
                  <div className="space-y-4 pt-4 border-t border-border/30">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Ambiental (E)</span>
                        <span className="text-sm font-bold text-success">{esgScores.environmental}%</span>
                      </div>
                      <Progress value={esgScores.environmental} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Social (S)</span>
                        <span className="text-sm font-bold text-primary">{esgScores.social}%</span>
                      </div>
                      <Progress value={esgScores.social} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Governança (G)</span>
                        <span className="text-sm font-bold text-accent">{esgScores.governance}%</span>
                      </div>
                      <Progress value={esgScores.governance} className="h-2" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Sem dados ESG disponíveis</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Comece cadastrando fontes de emissão, funcionários ou políticas para calcular seu Score ESG.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/inventario-gee')}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Iniciar cadastro
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </EnhancedCard>

        {/* Recent Activities */}
        <EnhancedCard 
          className="animate-fade-in" 
          style={{ animationDelay: '0.9s' }}
          variant="minimal"
          hoverable={false}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-1">
              {RECENT_ACTIVITIES.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
                    onClick={() => console.log('Activity clicked:', activity)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        console.log('Activity clicked:', activity);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalhes de ${activity.title}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {activity.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-2">
                <Button variant="ghost" size="sm" className="w-full justify-center gap-2 focus-ring">
                  <Eye className="w-4 h-4" />
                  Ver todas as atividades
                </Button>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Production Health Widget */}
      <div className="animate-fade-in" style={{ animationDelay: '1s' }}>
        <ProductionHealthWidget />
      </div>
    </div>
  );
}