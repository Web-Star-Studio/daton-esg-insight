import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { getDashboardStats, formatEmissionValue, formatEmployeeCount, formatPercentage } from '@/services/dashboardStats';
import { calculateESGScores } from '@/services/esgScoreService';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Users, 
  Leaf, 
  Shield, 
  Award,
  Calendar,
  CalendarDays,
  BarChart3,
  Zap,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { PredictiveInsightsWidget } from '@/components/dashboard/PredictiveInsightsWidget';
import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import { KPICarousel, KPIItem } from '@/components/dashboard/KPICarousel';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: any;
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
    value: formatEmissionValue(stats?.emissions?.value ?? 0),
    change: stats?.emissions?.change ?? 0,
    changeType: stats?.emissions?.changeType || 'neutral',
    icon: Leaf,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
    description: 'Total de emissões deste mês',
    route: '/inventario-gee'
  },
  {
    id: 'compliance',
    title: 'Conformidade',
    value: formatPercentage(stats?.compliance?.value ?? 0),
    change: stats?.compliance?.change ?? 0,
    changeType: stats?.compliance?.changeType || 'neutral',
    icon: Shield,
    color: 'text-sky-700',
    bgColor: 'bg-sky-500/10 ring-1 ring-sky-500/20',
    description: 'Índice de conformidade regulatória',
    route: '/compliance'
  },
  {
    id: 'employees',
    title: 'Colaboradores',
    value: formatEmployeeCount(stats?.employees?.value ?? 0),
    change: stats?.employees?.change ?? 0,
    changeType: stats?.employees?.changeType || 'neutral',
    icon: Users,
    color: 'text-violet-700',
    bgColor: 'bg-violet-500/10 ring-1 ring-violet-500/20',
    description: 'Total de colaboradores ativos',
    route: '/gestao-funcionarios'
  },
  {
    id: 'quality',
    title: 'Qualidade',
    value: formatPercentage(stats?.quality?.value ?? 0),
    change: stats?.quality?.change ?? 0,
    changeType: stats?.quality?.changeType || 'neutral',
    icon: Award,
    color: 'text-amber-700',
    bgColor: 'bg-amber-500/10 ring-1 ring-amber-500/20',
    description: 'Índice de qualidade dos processos',
    route: '/quality-dashboard'
  },
  {
    id: 'energy',
    title: 'Economia de Energia',
    value: '12.5 MWh',
    icon: Zap,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-500/10 ring-1 ring-cyan-500/20',
    description: 'Este mês',
    route: '/monitoramento-energia'
  },
  {
    id: 'co2-reduction',
    title: 'Redução CO₂',
    value: '-15.3%',
    changeType: 'positive',
    icon: Leaf,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
    description: 'vs mês anterior',
    route: '/inventario-gee'
  },
  {
    id: 'hr-satisfaction',
    title: 'Satisfação RH',
    value: '4.7/5',
    icon: Users,
    color: 'text-violet-700',
    bgColor: 'bg-violet-500/10 ring-1 ring-violet-500/20',
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
    path: '/inventario-gee'
  },
  {
    id: 'new-audit',
    title: 'Nova Auditoria',
    description: 'Iniciar processo de auditoria',
    icon: CheckCircle,
    path: '/auditoria'
  },
  {
    id: 'employee-training',
    title: 'Agendar Treinamento',
    description: 'Programar capacitação para equipe',
    icon: Calendar,
    path: '/gestao-treinamentos'
  },
  {
    id: 'generate-report',
    title: 'Gerar Relatório',
    description: 'Criar relatório personalizado',
    icon: BarChart3,
    path: '/relatorios'
  }
];

const PERIOD_PRESETS = [
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'quarter', label: 'Trimestre' },
  { key: 'year', label: 'Ano' },
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
        // eslint-disable-next-line no-case-declarations
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
    queryKey: ['dashboard-overview-stats', dateRange],
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
  const overallScore = Math.min(Math.max(esgScores?.overall ?? 0, 0), 100);

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-700 bg-emerald-500/10';
      case 'warning': return 'text-amber-700 bg-amber-500/10';
      case 'info': return 'text-sky-700 bg-sky-500/10';
      default: return 'text-muted-foreground bg-muted/60';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center rounded-[24px] border border-border/50 bg-background/80">
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
    <div className="content-area space-y-5 sm:space-y-6 lg:space-y-7 animate-fade-in overflow-x-hidden" data-tour="dashboard-main" data-testid="dashboard-content">
        {/* Header */}
        <div className="rounded-[28px] border border-border/60 bg-background/86 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_20px_42px_-34px_rgba(15,23,42,0.55)] backdrop-blur-md sm:p-5 lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl [font-family:'SF_Pro_Display','SF_Pro_Text',-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
                Dashboard ESG
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Resumo estratégico com foco em métricas críticas e decisões rápidas.
              </p>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 justify-start gap-2 rounded-2xl border-border/60 bg-background/90 px-3.5 text-[12.5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_10px_26px_-22px_rgba(15,23,42,0.55)] backdrop-blur-sm transition-all hover:bg-background"
                >
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
                      : 'Selecionar período'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="z-50 w-[min(94vw,680px)] rounded-2xl border border-border/60 bg-background/95 p-4 shadow-xl backdrop-blur-lg"
                align="end"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-1 rounded-xl border border-border/60 bg-muted/35 p-1">
                    {PERIOD_PRESETS.map((preset) => (
                      <Button
                        key={preset.key}
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePresetClick(preset.key)}
                        className={`h-8 rounded-lg text-xs transition-all ${
                          activePreset === preset.key
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-background/75 hover:text-foreground'
                        }`}
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
          <div
            className="mt-4 flex flex-wrap items-center gap-2 w-full sm:w-auto.5 overflow-x-auto pb-1 scrollbar-hide"
            data-tour="quick-actions"
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(action.path)}
                  title={action.description}
                  className="h-11 min-w-[164px] shrink-0 items-center justify-start gap-2 rounded-2xl border border-border/60 bg-background/90 px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_12px_24px_-22px_rgba(15,23,42,0.5)] transition-all hover:border-border hover:bg-background hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_30px_-24px_rgba(15,23,42,0.55)]"
                >
                  <div className="rounded-[10px] border border-border/45 bg-muted/60 p-1.5">
                    <Icon className="h-3.5 w-3.5 text-foreground/80" />
                  </div>
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="text-[12.5px] font-medium text-foreground">{action.title}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* KPI Cards */}
        <section className="rounded-3xl border border-border/60 bg-background/88 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_20px_40px_-34px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-foreground">Indicadores-chave</h2>
            <span className="text-[11px] text-muted-foreground">Atualização a cada minuto</span>
          </div>
          <KPICarousel
            items={kpiCards}
            itemsPerPage={4}
            onItemClick={(item) => navigate(item.route)}
            onMenuClick={(item, action) => {
              if (action === 'details') {
                navigate(item.route);
              } else if (action === 'export') {
                console.warn('Export data for:', item.id);
              }
            }}
          />
        </section>

        {/* Intelligent Alerts */}
        <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <AlertsPanel />
        </div>

        {/* Recent Activities & ESG Score */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <EnhancedCard
            className="lg:col-span-1 rounded-3xl border border-border/65 bg-background/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_36px_-32px_rgba(15,23,42,0.55)]"
            variant="minimal"
            hoverable={false}
          >
            <CardHeader className="px-4 pb-2 pt-4">
              <CardTitle className="text-sm font-semibold tracking-[-0.01em]">Atividades Recentes</CardTitle>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-1.5">
                {RECENT_ACTIVITIES.slice(0, 4).map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="group flex cursor-pointer gap-2.5 rounded-2xl border border-transparent px-2.5 py-2 transition-all hover:border-border/60 hover:bg-background/65"
                      onClick={() => console.warn('Activity clicked:', activity)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          console.warn('Activity clicked:', activity);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {activity.title}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button variant="ghost" size="sm" className="mt-2 h-9 w-full justify-center gap-1.5 rounded-xl text-sm">
                <Eye className="h-4 w-4" />
                Ver todas
              </Button>
            </CardContent>
          </EnhancedCard>

          <EnhancedCard
            className="lg:col-span-2 rounded-3xl border border-border/65 bg-background/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_36px_-32px_rgba(15,23,42,0.55)]"
            variant="minimal"
            hoverable={false}
          >
            <CardHeader className="px-4 pb-2 pt-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold tracking-[-0.01em]">
                  Score ESG Geral
                </CardTitle>
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">
                  Atualizado
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-4 pt-0">
              {esgScores?.hasData ? (
                <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
                  <div className="flex flex-col items-center gap-2 rounded-3xl border border-border/60 bg-background/80 p-4">
                    <div
                      className="grid h-36 w-36 place-items-center rounded-full border border-border/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]"
                      style={{
                        background: `conic-gradient(hsl(var(--primary)) ${overallScore * 3.6}deg, hsl(var(--muted)) 0deg)`,
                      }}
                    >
                      <div className="grid h-28 w-28 place-items-center rounded-full border border-border/60 bg-background">
                        <div className="text-center">
                          <p className="text-3xl font-semibold tracking-[-0.02em] text-foreground">{overallScore}</p>
                          <p className="text-[11px] text-muted-foreground">de 100</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Desempenho Geral</p>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Ambiental (E)</span>
                        <span className="text-sm font-semibold text-emerald-700">{esgScores.environmental}%</span>
                      </div>
                      <Progress value={esgScores.environmental} className="h-2.5 bg-muted/70" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Social (S)</span>
                        <span className="text-sm font-semibold text-sky-700">{esgScores.social}%</span>
                      </div>
                      <Progress value={esgScores.social} className="h-2.5 bg-muted/70" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Governança (G)</span>
                        <span className="text-sm font-semibold text-violet-700">{esgScores.governance}%</span>
                      </div>
                      <Progress value={esgScores.governance} className="h-2.5 bg-muted/70" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full items-center gap-5 rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted/60">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Sem dados ESG</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cadastre emissões, colaboradores ou políticas para calcular seu score.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/inventario-gee')}
                    className="gap-1.5 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                    Iniciar
                  </Button>
                </div>
              )}

              <div className="my-4 h-px bg-border/60" />
              <PredictiveInsightsWidget embedded />
            </CardContent>
          </EnhancedCard>
        </div>
    </div>
  );
}
