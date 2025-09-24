import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TreePine, Sprout, BarChart3, DollarSign, Eye, Plus, Trash2, MapPin, Calendar, TrendingUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { carbonCompensationService, type ConservationActivity } from "@/services/carbonCompensation"
import { ConservationActivityModal } from "@/components/ConservationActivityModal"
import { ActivityMonitoringModal } from "@/components/ActivityMonitoringModal"

export default function CompensacaoCarbono() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activities, setActivities] = useState<ConservationActivity[]>([])
  const [stats, setStats] = useState({
    total_area: 0,
    total_investment: 0,
    total_carbon_estimate: 0,
    total_carbon_sequestered: 0,
    activities_count: 0,
    active_activities_count: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [monitoringModalOpen, setMonitoringModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<ConservationActivity | null>(null)

  // SEO
  useEffect(() => {
    document.title = 'Compensação de Carbono | Atividades de Conservação e Recuperação';
    const desc = 'Gerencie atividades de conservação, reflorestamento e recuperação ambiental para compensação de carbono própria.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/projetos-carbono`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activitiesData, statsData] = await Promise.all([
        carbonCompensationService.getActivities(),
        carbonCompensationService.getDashboardStats(),
      ]);

      setActivities(activitiesData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de compensação de carbono",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const kpis = [
    {
      title: "Área Total Conservada",
      value: `${formatNumber(stats.total_area)} ha`,
      icon: TreePine,
      iconColor: "text-green-600",
    },
    {
      title: "Carbono Sequestrado",
      value: `${formatNumber(stats.total_carbon_sequestered)} tCO₂e`,
      icon: Sprout,
      iconColor: "text-emerald-600",
    },
    {
      title: "Potencial de Sequestro",
      value: `${formatNumber(stats.total_carbon_estimate)} tCO₂e`,
      icon: TrendingUp,
      iconColor: "text-blue-600",
    },
    {
      title: "Investimento Total",
      value: formatCurrency(stats.total_investment),
      icon: DollarSign,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Compensação de Carbono</h1>
              <p className="text-muted-foreground mt-2">
                Gerencie atividades próprias de conservação, reflorestamento e recuperação ambiental para compensação de carbono.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compensação de Carbono</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie atividades próprias de conservação, reflorestamento e recuperação ambiental para compensação de carbono.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedActivity(null);
                setActivityModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Atividade
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor || "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activities Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Atividades de Conservação</CardTitle>
              <Badge variant="outline">
                {stats.activities_count} total • {stats.active_activities_count} ativas
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma atividade registrada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira atividade de conservação para começar a compensar carbono
                </p>
                <Button onClick={() => {
                  setSelectedActivity(null);
                  setActivityModalOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Atividade
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atividade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Impacto Estimado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{activity.title}</span>
                          {activity.description && (
                            <span className="text-sm text-muted-foreground truncate max-w-xs">
                              {activity.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{activity.activity_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{activity.location || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.area_size ? `${formatNumber(activity.area_size)} ha` : '-'}
                      </TableCell>
                      <TableCell>
                        {formatNumber(activity.carbon_impact_estimate)} tCO₂e
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            activity.status === "Concluída" ? "default" :
                            activity.status === "Em Andamento" ? "secondary" :
                            activity.status === "Suspensa" ? "destructive" : "outline"
                          }
                          className={
                            activity.status === "Concluída" ? "bg-green-100 text-green-800" :
                            activity.status === "Em Andamento" ? "bg-blue-100 text-blue-800" : ""
                          }
                        >
                          {activity.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(activity.start_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setActivityModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setMonitoringModalOpen(true);
                            }}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <ConservationActivityModal
          open={activityModalOpen}
          onClose={() => {
            setActivityModalOpen(false);
            setSelectedActivity(null);
          }}
          onActivityCreated={loadData}
          activity={selectedActivity}
        />
        
        {selectedActivity && (
          <ActivityMonitoringModal
            open={monitoringModalOpen}
            onClose={() => {
              setMonitoringModalOpen(false);
              setSelectedActivity(null);
            }}
            onMonitoringCreated={loadData}
            activity={selectedActivity}
          />
        )}
      </div>
  )
}