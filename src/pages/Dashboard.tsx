import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface KPICard {
  id: string;
  title: string;
  value: string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: any;
  color: string;
  bgColor: string;
  description: string;
}

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

const KPI_CARDS: KPICard[] = [
  {
    id: 'emissions',
    title: 'Emissões CO₂',
    value: '1.247 tCO₂e',
    change: -12.5,
    changeType: 'positive',
    icon: Leaf,
    color: 'text-success',
    bgColor: 'bg-success/10',
    description: 'Total de emissões deste mês'
  },
  {
    id: 'compliance',
    title: 'Conformidade',
    value: '94%',
    change: 3.2,
    changeType: 'positive',
    icon: Shield,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    description: 'Índice de conformidade regulatória'
  },
  {
    id: 'employees',
    title: 'Colaboradores',
    value: '1.234',
    change: 5.8,
    changeType: 'positive',
    icon: Users,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    description: 'Total de colaboradores ativos'
  },
  {
    id: 'quality',
    title: 'Qualidade',
    value: '98.5%',
    change: -0.5,
    changeType: 'negative',
    icon: Award,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    description: 'Índice de qualidade dos processos'
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Bom dia';
    if (hour < 18) return '☀️ Boa tarde';
    return '🌙 Boa noite';
  };

  const getChangeColor = (changeType: KPICard['changeType']) => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: KPICard['changeType']) => {
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
            <Button variant="minimal" size="sm" className="gap-2 focus-ring">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="stats-cards">
        {KPI_CARDS.map((kpi, index) => {
          const Icon = kpi.icon;
          const ChangeIcon = getChangeIcon(kpi.changeType);
          
          return (
            <EnhancedCard
              key={kpi.id}
              title={kpi.title}
              subtitle={kpi.description}
              icon={Icon}
              iconColor={kpi.color}
              iconBg={kpi.bgColor}
              value={kpi.value}
              change={kpi.change}
              changeType={kpi.changeType}
              trend={ChangeIcon && <ChangeIcon className="w-4 h-4" />}
              variant="stat"
              className="group animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            />
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <EnhancedCard 
          className="lg:col-span-2 animate-fade-in" 
          style={{ animationDelay: '0.8s' }}
          variant="premium"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Desempenho ESG
              </CardTitle>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                Tempo real
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Progress Indicators */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Ambiental (E)</span>
                    <span className="text-sm font-bold text-success">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Social (S)</span>
                    <span className="text-sm font-bold text-primary">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Governança (G)</span>
                    <span className="text-sm font-bold text-accent">95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="w-4 h-4" />
                    Meta geral: 90%
                  </div>
                  <span className="text-sm font-bold text-primary">91.3%</span>
                </div>
              </div>
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

      {/* Quick Stats & System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '1s' }}>
        <EnhancedCard variant="minimal" className="group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Economia de Energia</p>
                <p className="text-xl font-bold text-foreground">12.5 MWh</p>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard variant="minimal" className="group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-success to-primary rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Redução CO₂</p>
                <p className="text-xl font-bold text-success">-15.3%</p>
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        <EnhancedCard variant="minimal" className="group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-warning rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Satisfação RH</p>
                <p className="text-xl font-bold text-foreground">4.7/5</p>
                <p className="text-xs text-muted-foreground">Última pesquisa</p>
              </div>
            </div>
          </CardContent>
        </EnhancedCard>

        {/* Production Health Widget */}
        <ProductionHealthWidget />
      </div>
    </div>
  );
}