import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/contexts/AuthContext';
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
  Users,
  Leaf,
  Shield,
  Award,
  Bell,
  Calendar,
  CalendarDays,
  BarChart3,
  Zap,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  FileText,
  Settings,
  HelpCircle,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { KPICarousel, KPIItem } from '@/components/dashboard/KPICarousel';
import { ESGScoreGauge } from '@/components/esg/ESGScoreGauge';

// ─── Mock Data ───────────────────────────────────────────────

const MOCK_KPI_CARDS: KPIItem[] = [
  {
    id: 'emissions',
    title: 'Emissões CO₂',
    value: '1.247 tCO₂e',
    change: -8.3,
    changeType: 'positive',
    icon: Leaf,
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Total de emissões deste mês',
    route: '#',
  },
  {
    id: 'compliance',
    title: 'Conformidade',
    value: '94,2%',
    change: 2.1,
    changeType: 'positive',
    icon: Shield,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'Índice de conformidade regulatória',
    route: '#',
  },
  {
    id: 'employees',
    title: 'Colaboradores',
    value: '342',
    change: 5,
    changeType: 'positive',
    icon: Users,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    description: 'Total de colaboradores ativos',
    route: '#',
  },
  {
    id: 'quality',
    title: 'Qualidade',
    value: '91,7%',
    change: 1.8,
    changeType: 'positive',
    icon: Award,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Índice de qualidade dos processos',
    route: '#',
  },
  {
    id: 'energy',
    title: 'Economia de Energia',
    value: '12.5 MWh',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-gradient-to-r from-primary/20 to-accent/20',
    description: 'Este mês',
    route: '#',
  },
  {
    id: 'co2-reduction',
    title: 'Redução CO₂',
    value: '-15,3%',
    changeType: 'positive',
    icon: Leaf,
    color: 'text-success',
    bgColor: 'bg-gradient-to-r from-success/20 to-primary/20',
    description: 'vs mês anterior',
    route: '#',
  },
  {
    id: 'hr-satisfaction',
    title: 'Satisfação RH',
    value: '4.7/5',
    icon: Users,
    color: 'text-accent',
    bgColor: 'bg-gradient-to-r from-accent/20 to-warning/20',
    description: 'Última pesquisa',
    route: '#',
  },
];

interface QuickAction {
  id: string;
  title: string;
  icon: any;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'add-emission', title: 'Registrar Emissão', icon: Plus },
  { id: 'new-audit', title: 'Nova Auditoria', icon: CheckCircle },
  { id: 'employee-training', title: 'Agendar Treinamento', icon: Calendar },
  { id: 'generate-report', title: 'Gerar Relatório', icon: BarChart3 },
];

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  icon: any;
}

const RECENT_ACTIVITIES: RecentActivity[] = [
  { id: '1', title: 'Inventário GEE atualizado', description: 'Novos dados de emissões inseridos para Q4 2024', time: '2 horas atrás', type: 'success', icon: Leaf },
  { id: '2', title: 'Auditoria SGQ agendada', description: 'Auditoria interna programada para próxima semana', time: '4 horas atrás', type: 'info', icon: Award },
  { id: '3', title: 'Licença ambiental vencendo', description: 'Licença de operação vence em 30 dias', time: '1 dia atrás', type: 'warning', icon: AlertCircle },
  { id: '4', title: 'Treinamento concluído', description: '25 colaboradores concluíram capacitação em SST', time: '2 dias atrás', type: 'success', icon: Users },
];

const MOCK_ALERTS = [
  { id: '1', title: 'Licença de Operação vencendo', description: 'A licença LO-2024-0891 vence em 30 dias. Inicie o processo de renovação.', type: 'warning' as const },
  { id: '2', title: 'Meta de emissões em risco', description: 'A meta de redução de CO₂ do Q1 está 12% abaixo do esperado.', type: 'warning' as const },
  { id: '3', title: 'Auditoria interna concluída', description: 'Auditoria ISO 14001 finalizada com 2 não-conformidades menores.', type: 'info' as const },
];

// ─── Helper ──────────────────────────────────────────────────

const showDemoToast = () => {
  toast.info('Funcionalidade disponível na versão completa', {
    description: 'Crie sua conta gratuita para acessar todos os recursos da plataforma.',
    action: {
      label: 'Criar conta',
      onClick: () => window.location.href = '/auth',
    },
  });
};

const getActivityColor = (type: RecentActivity['type']) => {
  switch (type) {
    case 'success': return 'text-success bg-success/10';
    case 'warning': return 'text-warning bg-warning/10';
    case 'info': return 'text-primary bg-primary/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

const getAlertBorder = (type: 'warning' | 'info') => {
  return type === 'warning' ? 'border-l-warning' : 'border-l-primary';
};

// ─── Sidebar Items (visual only) ─────────────────────────────

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Leaf, label: 'Ambiental' },
  { icon: Users, label: 'Social' },
  { icon: Shield, label: 'Governança' },
  { icon: BarChart3, label: 'Relatórios' },
  { icon: FileText, label: 'Documentos' },
  { icon: Settings, label: 'Configurações' },
  { icon: HelpCircle, label: 'Ajuda' },
];

// ─── Component ───────────────────────────────────────────────

export default function DemoDashboard() {
  const navigate = useNavigate();
  const { user, isApproved } = useAuth();
  const isLoggedInPending = !!user && !isApproved;
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [activePreset, setActivePreset] = useState<string>('month');

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case 'week':
        from = new Date(now); from.setDate(now.getDate() - 6); to = now; break;
      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0); break;
      case 'quarter':
        const qm = Math.floor(now.getMonth() / 3) * 3;
        from = new Date(now.getFullYear(), qm, 1);
        to = new Date(now.getFullYear(), qm + 3, 0); break;
      case 'year':
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), 11, 31); break;
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    setDateRange({ from, to });
    setActivePreset(preset);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Simplified Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Daton</h2>
          <p className="text-xs text-muted-foreground mt-1">Plataforma ESG</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.active ? undefined : showDemoToast}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  item.active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        {!isLoggedInPending && (
          <div className="p-4 border-t border-border">
            <Button className="w-full gap-2" onClick={() => navigate('/auth')}>
              <LogIn className="w-4 h-4" />
              Criar conta gratuita
            </Button>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Demo Banner */}
        {isLoggedInPending ? (
          <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-warning/10 border-b border-warning/20 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm text-foreground">
                  Sua conta está <strong>em análise</strong>. Um administrador aprovará seu acesso em breve.
                </span>
              </div>
              <Badge variant="outline" className="border-warning/30 text-warning">
                Acesso pendente
              </Badge>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-primary/20 px-4 py-3">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">
                  Você está visualizando uma <strong>versão demonstrativa</strong> da plataforma Daton
                </span>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/auth')}>
                Criar conta gratuita
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Daton</h2>
          <Button size="sm" variant="outline" onClick={() => navigate('/auth')}>
            <LogIn className="w-4 h-4 mr-1.5" />
            Entrar
          </Button>
        </div>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard ESG</h1>
                  <p className="text-sm text-muted-foreground">Aqui está um resumo do seu desempenho ESG</p>
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-sm">
                        {dateRange?.from && dateRange?.to
                          ? `${format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
                          : 'Selecionar período'}
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
                        onDateChange={(range) => { setDateRange(range); setActivePreset('custom'); }}
                        className="w-full"
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="minimal"
                      size="sm"
                      onClick={showDemoToast}
                      className="flex-shrink-0 gap-2 transition-all hover:shadow-md whitespace-nowrap h-10 min-w-[44px] text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden xs:inline">{action.title}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* KPI Carousel */}
            <KPICarousel
              items={MOCK_KPI_CARDS}
              itemsPerPage={4}
              onItemClick={showDemoToast}
              onMenuClick={showDemoToast}
            />

            {/* Alerts */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                Alertas Inteligentes
              </h3>
              <div className="grid gap-3">
                {MOCK_ALERTS.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`border-l-4 ${getAlertBorder(alert.type)} cursor-pointer hover:shadow-md transition-all`}
                    onClick={showDemoToast}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                        </div>
                        <Badge variant={alert.type === 'warning' ? 'destructive' : 'secondary'} className="text-xs flex-shrink-0">
                          {alert.type === 'warning' ? 'Atenção' : 'Info'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Activities & ESG Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent Activities */}
              <EnhancedCard className="lg:col-span-1 border border-border" variant="default" hoverable={false}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Bell className="w-4 h-4 text-primary" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <div className="space-y-1">
                    {RECENT_ACTIVITIES.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={activity.id}
                          className="flex gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
                          onClick={showDemoToast}
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
                              <span className="text-xs text-muted-foreground">{activity.time}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full justify-center gap-1.5 mt-2 h-9 text-sm" onClick={showDemoToast}>
                    <Eye className="w-4 h-4" />
                    Ver todas
                  </Button>
                </CardContent>
              </EnhancedCard>

              {/* ESG Score */}
              <EnhancedCard className="lg:col-span-2 border border-border" variant="default">
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
                    <div className="flex-shrink-0">
                      <ESGScoreGauge score={78} label="Score ESG" showDetails={false} />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Ambiental (E)</span>
                          <span className="text-sm font-bold text-success">82%</span>
                        </div>
                        <Progress value={82} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Social (S)</span>
                          <span className="text-sm font-bold text-primary">74%</span>
                        </div>
                        <Progress value={74} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Governança (G)</span>
                          <span className="text-sm font-bold text-accent">79%</span>
                        </div>
                        <Progress value={79} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </EnhancedCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
