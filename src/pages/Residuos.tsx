
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Scale, 
  Recycle, 
  Trash2, 
  DollarSign,
  Eye,
  Pencil,
  FileText,
  Users,
  Plus,
  BarChart3
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getWasteLogs, getWasteDashboard } from "@/services/waste"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import PGRSStatusCard from "@/components/PGRSStatusCard"
import { PGRSGoalsProgressChart } from "@/components/PGRSGoalsProgressChart"
import { getActivePGRSStatus, getActivePGRSPlan } from "@/services/pgrsReports"

const Residuos = () => {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Fetch waste logs
  const { data: wasteLogs = [], isLoading: isLoadingLogs, error: logsError } = useQuery({
    queryKey: ['waste-logs'],
    queryFn: () => getWasteLogs(),
  })

  // Fetch dashboard data
  const { data: dashboard, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: ['waste-dashboard'],
    queryFn: () => getWasteDashboard(),
  })

  // Fetch PGRS status
  const { data: pgrsStatus, isLoading: isLoadingPGRS, refetch: refetchPGRS } = useQuery({
    queryKey: ['pgrs-status'],
    queryFn: () => getActivePGRSStatus(),
  })

  // Fetch active PGRS plan for goals
  const { data: activePGRS } = useQuery({
    queryKey: ['active-pgrs-goals'],
    queryFn: async () => {
      const plan = await getActivePGRSPlan();
      if (plan) {
        // Fetch goals for the plan
        const { data: goals } = await supabase
          .from('pgrs_goals')
          .select('*')
          .eq('pgrs_plan_id', plan.id);
        return { ...plan, goals: goals || [] };
      }
      return null;
    },
    enabled: !!pgrsStatus,
  })

  // Show error toast if any query fails
  if (logsError || dashboardError) {
    toast({
      variant: "destructive",
      title: "Erro ao carregar dados",
      description: "Ocorreu um erro ao buscar os dados de resíduos.",
    })
  }

  // Generate KPI data from dashboard
  const kpiData = [
    {
      title: "Total Gerado no Mês",
      value: dashboard ? `${dashboard.total_generated.value} ${dashboard.total_generated.unit}` : "0 toneladas",
      icon: Scale,
      iconColor: "text-foreground"
    },
    {
      title: "Taxa de Reciclagem",
      value: dashboard ? `${dashboard.recycling_rate_percent}%` : "0%",
      icon: Recycle,
      iconColor: "text-success"
    },
    {
      title: "Destinado a Aterro",
      value: dashboard ? `${dashboard.sent_to_landfill.value} ${dashboard.sent_to_landfill.unit}` : "0 toneladas",
      icon: Trash2,
      iconColor: "text-warning"
    },
    {
      title: "Custo de Destinação (Mês)",
      value: dashboard ? `R$ ${dashboard.disposal_cost_month.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ 0,00",
      icon: DollarSign,
      iconColor: "text-foreground"
    }
  ]

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Destinação Finalizada":
        return "success"
      case "Em Trânsito":
        return "warning"
      case "Coletado":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case "success":
        return "secondary" // Using secondary with custom styling
      case "warning":
        return "secondary"
      case "secondary":
        return "outline"
      default:
        return "outline"
    }
  }

  const getBadgeClassName = (variant: string) => {
    switch (variant) {
      case "success":
        return "bg-success/10 text-success border-success/20"
      case "warning":
        return "bg-warning/10 text-warning border-warning/20"
      case "secondary":
        return "bg-accent/10 text-accent border-accent/20"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Gestão de Resíduos Sólidos</h1>
          </div>
          <Button className="w-fit" onClick={() => navigate("/residuos/novo")}>
            + Registrar Destinação
          </Button>
        </div>

        {/* PGRS Status Card */}
        <PGRSStatusCard 
          pgrsStatus={pgrsStatus} 
          onUpdate={refetchPGRS}
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <Card key={index} className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </CardHeader>
                <CardContent>
                  {isLoadingDashboard ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* PGRS Goals Progress Chart */}
        {activePGRS?.goals && activePGRS.goals.length > 0 && (
          <PGRSGoalsProgressChart goals={activePGRS.goals} />
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/fornecedores-residuos")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Gerenciar Fornecedores
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/residuos/relatorios")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Relatórios PGRS
          </Button>
        </div>

        {/* Tabela de Movimentações de Resíduos (MTR) */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Movimentações de Resíduos (Log de MTR)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Nº MTR / Controle</TableHead>
                    <TableHead>Resíduo</TableHead>
                    <TableHead className="w-[160px]">Classe</TableHead>
                    <TableHead className="w-[120px]">Data da Coleta</TableHead>
                    <TableHead className="w-[100px]">Quantidade</TableHead>
                    <TableHead>Destinador</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLogs ? (
                    // Loading skeleton rows
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : wasteLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum registro de resíduo encontrado.
                        <Button 
                          variant="link" 
                          onClick={() => navigate("/residuos/novo")}
                          className="ml-2"
                        >
                          Registrar o primeiro
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    wasteLogs.map((item) => {
                      const statusVariant = getStatusVariant(item.status)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.mtr_number}</TableCell>
                          <TableCell>{item.waste_description}</TableCell>
                          <TableCell>
                            <span className="text-sm">{item.waste_class}</span>
                          </TableCell>
                          <TableCell>{item.collection_date}</TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{item.destination_name || "-"}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={getBadgeVariant(statusVariant)}
                              className={getBadgeClassName(statusVariant)}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Ver Detalhes/CDF"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Ver Detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}

export default Residuos