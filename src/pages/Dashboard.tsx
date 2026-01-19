import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getDashboardStats, formatEmissionValue, formatEmployeeCount, formatPercentage } from '@/services/dashboardStats';
import { calculateESGScores, ESGScores } from '@/services/esgScoreService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Leaf, 
  Shield, 
  Award,
  Bell,
  Calendar,
  CalendarDays,
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
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [activePreset, setActivePreset] = useState<string>('month');

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case 'week':
        // Últimos 7 dias
        from = new Date(now);
        from.setDate(now.getDate() - 6);
        to = now;
        break;
      case 'month':
        // Mês atual completo (dia 1 até último dia do mês)
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        // Trimestre atual (3 meses)
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        from = new Date(now.getFullYear(), quarterMonth, 1);
        to = new Date(now.getFullYear(), quarterMonth + 3, 0);
        break;
      case 'year':
        // Ano atual completo
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setDateRange({ from, to });
    setActivePreset(preset);
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setActivePreset('custom');
  };

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', dateRange],
    queryFn: () => getDashboardStats('month'),
    refetchInterval: 60000,
  });

  const { data: esgScores, isLoading: isLoadingESG } = useQuery({
    queryKey: ['esg-scores'],
    queryFn: calculateESGScores,
    refetchInterval: 300000,
  });

  const isLoading = isLoadingStats || isLoadingESG;
  const kpiCards = getKPICards(dashboardStats);

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground animate-fade-in">
              Dashboard ESG
            </h1>
            <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Aqui está um resumo do seu desempenho ESG
            </p>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm">
                  {dateRange?.from && dateRange?.to 
                    ? `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
                    : 'Selecionar período'
                  }
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-background border border-border shadow-lg z-50" align="end">
              <div className="space-y-4">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                  {[
                    { key: 'week', label: 'Semana' },
                    { key: 'month', label: 'Mês' },
                    { key: 'quarter', label: 'Trimestre' },
                    { key: 'year', label: 'Ano' },
                  ].map((preset) => (
                    <Button
                      key={preset.key}
                      variant={activePreset === preset.key ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handlePresetClick(preset.key)}
                      className="text-xs h-8 px-3 rounded-lg flex-1"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <DatePickerWithRange 
                  date={dateRange} 
                  onDateChange={handleDateChange}
                  className="w-full"
                />
              </div>
            </PopoverContent>
          </Popover>
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

      {/* Intelligent Alerts */}
      <AlertsPanel />

      {/* Recent Activities & ESG Score Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.7s' }}>
        {/* Recent Activities - Compact */}
        <EnhancedCard 
          className="lg:col-span-1 border border-border"
          variant="default"
          hoverable={false}
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="w-4 h-4 text-primary" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0 px-4 pb-4">
            <div className="space-y-1">
              {RECENT_ACTIVITIES.slice(0, 4).map((activity) => {
                const Icon = activity.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
                    onClick={() => console.log('Activity clicked:', activity)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button variant="ghost" size="sm" className="w-full justify-center gap-1.5 mt-2 h-9 text-sm">
              <Eye className="w-4 h-4" />
              Ver todas
            </Button>
          </CardContent>
        </EnhancedCard>

        {/* ESG Score */}
        <EnhancedCard 
          className="lg:col-span-2 border border-border"
          variant="default"
        >
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 text-primary" />
                Score ESG Geral
              </CardTitle>
              <Badge variant="secondary" className="gap-1 text-xs px-2 py-0.5">
                <Sparkles className="w-3 h-3" />
                Tempo real
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 px-4 pb-4">
            <div className="flex items-center gap-8">
              {esgScores?.hasData ? (
                <>
                  <div className="flex-shrink-0">
                    <ESGScoreGauge 
                      score={esgScores.overall}
                      label="Score ESG"
                      showDetails={false}
                    />
                  </div>

                  <div className="flex-1 space-y-4">
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
                <div className="w-full flex items-center gap-6 py-2">
                  <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Sem dados ESG</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cadastre emissões, funcionários ou políticas para calcular seu score.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/inventario-gee')}
                    className="gap-1.5 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Iniciar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </EnhancedCard>
      </div>

      {/* Predictive Insights */}
      <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
        <PredictiveInsightsWidget />
      </div>

      {/* Production Health Widget */}
      <div className="animate-fade-in" style={{ animationDelay: '1s' }}>
        <ProductionHealthWidget />
      </div>
    </div>
  );
}