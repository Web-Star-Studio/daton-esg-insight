import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Scale,
  Recycle,
  Trash2,
  DollarSign,
  Download,
  ChevronDown,
  Eye,
  Pencil,
  FileText,
  Users,
  BarChart3,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getWasteLogs, getWasteDashboard, deleteWasteLog, type WasteLogListItem } from "@/services/waste"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import PGRSStatusCard from "@/components/PGRSStatusCard"
import { PGRSGoalsProgressChart } from "@/components/PGRSGoalsProgressChart"
import { useBranches } from "@/services/branches"
import { getActivePGRSStatus, getActivePGRSPlan } from "@/services/pgrsReports"
import { getBranchDisplayLabel } from "@/utils/branchDisplay"
import * as XLSX from "xlsx"

const CRITICAL_PROGRESS_FIELDS = [
  "destination_cost_per_unit",
  "destination_cost_total",
  "transport_cost",
  "revenue_per_unit",
  "revenue_total",
  "driver_name",
  "vehicle_plate",
  "storage_type",
  "invoice_generator",
  "invoice_payment",
  "cdf_number",
  "cdf_additional_1",
  "cdf_additional_2",
] as const satisfies readonly (keyof WasteLogListItem)[]

type CriticalProgressField = (typeof CRITICAL_PROGRESS_FIELDS)[number]

const CRITICAL_PROGRESS_FIELD_LABELS: Record<CriticalProgressField, string> = {
  destination_cost_per_unit: "Custo Unitário de Destinação",
  destination_cost_total: "Custo Total de Destinação",
  transport_cost: "Custo de Transporte",
  revenue_per_unit: "Receita Unitária - Venda",
  revenue_total: "Receita Total - Venda",
  driver_name: "Nome do Motorista",
  vehicle_plate: "Placa do Veículo",
  storage_type: "Tipo de Armazenamento",
  invoice_generator: "Nº NF do Gerador",
  invoice_payment: "Nº NF de Pagamento",
  cdf_number: "Nº CDF Principal",
  cdf_additional_1: "Nº CDF Adicional 1",
  cdf_additional_2: "Nº CDF Adicional 2",
}

const isFilledValue = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  return true
}

const getWasteLogProgress = (wasteLog: WasteLogListItem) => {
  const missingFields = CRITICAL_PROGRESS_FIELDS
    .filter((field) => !isFilledValue(wasteLog[field]))
    .map((field) => CRITICAL_PROGRESS_FIELD_LABELS[field])

  const total = CRITICAL_PROGRESS_FIELDS.length
  const filled = total - missingFields.length
  const percent = Math.round((filled / total) * 100)

  if (percent >= 80) {
    return {
      filled,
      total,
      percent,
      missingFields,
      barClassName: "bg-green-500",
      labelClassName: "text-green-600",
      label: percent === 100 ? "Completo" : "Quase completo",
    }
  }

  if (percent >= 40) {
    return {
      filled,
      total,
      percent,
      missingFields,
      barClassName: "bg-yellow-500",
      labelClassName: "text-yellow-600",
      label: "Em preenchimento",
    }
  }

  return {
    filled,
    total,
    percent,
    missingFields,
    barClassName: "bg-red-500",
    labelClassName: "text-red-600",
    label: "Inicial",
  }
}

type WasteExportRow = {
  "Nº MTR / Controle": string
  "Resíduo": string
  "Classe": string
  "Data da Coleta": string
  "Quantidade": string
  "Filial": string
  "Documentos": number
  "Destinador": string
  "Status": string
  "Progresso": string
  "Campos Pendentes": string
}

interface ResiduosProps {
  lockedBranchId?: string
}

const Residuos = ({ lockedBranchId }: ResiduosProps = {}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedBranchId, setSelectedBranchId] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"pendentes" | "concluidos" | "all">("pendentes")
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const { toast } = useToast()
  const { data: branches = [] } = useBranches()

  const deleteMutation = useMutation({
    mutationFn: deleteWasteLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-logs'] })
      queryClient.invalidateQueries({ queryKey: ['waste-dashboard'] })
      toast({ title: "Registro excluído com sucesso." })
      setDeleteTargetId(null)
    },
    onError: () => {
      toast({ variant: "destructive", title: "Erro ao excluir registro." })
      setDeleteTargetId(null)
    },
  })
  const branchLabelById = new Map(branches.map((branch) => [branch.id, getBranchDisplayLabel(branch)]))

  const effectiveBranchId = lockedBranchId ?? (selectedBranchId === "all" ? undefined : selectedBranchId)

  // Fetch waste logs
  const { data: wasteLogs = [], isLoading: isLoadingLogs, error: logsError } = useQuery({
    queryKey: ['waste-logs', effectiveBranchId ?? "all"],
    queryFn: () => getWasteLogs({ branch_id: effectiveBranchId }),
  })
  const concluidosCount = useMemo(() => wasteLogs.filter((l) => l.status === "Destinação Finalizada").length, [wasteLogs])
  const pendentesCount = useMemo(() => wasteLogs.filter((l) => l.status !== "Destinação Finalizada").length, [wasteLogs])
  const filteredWasteLogs = useMemo(() => {
    if (statusFilter === "concluidos") return wasteLogs.filter((l) => l.status === "Destinação Finalizada")
    if (statusFilter === "pendentes") return wasteLogs.filter((l) => l.status !== "Destinação Finalizada")
    return wasteLogs
  }, [wasteLogs, statusFilter])
  const wasteLogIds = useMemo(() => wasteLogs.map((log) => log.id), [wasteLogs])

  const { data: documentCountByWasteLog = {} } = useQuery({
    queryKey: ['waste-logs', 'documents-count', wasteLogIds.join(',')],
    queryFn: async () => {
      if (wasteLogIds.length === 0) return {} as Record<string, number>

      const { data, error } = await supabase
        .from('documents')
        .select('related_id')
        .eq('related_model', 'waste_logs')
        .in('related_id', wasteLogIds)

      if (error) {
        console.error('Error fetching waste log document counts:', error)
        return {} as Record<string, number>
      }

      return (data || []).reduce<Record<string, number>>((acc, item) => {
        if (!item.related_id) return acc
        acc[item.related_id] = (acc[item.related_id] || 0) + 1
        return acc
      }, {})
    },
    enabled: wasteLogIds.length > 0,
  })

  // Fetch dashboard data
  const { data: dashboard, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: ['waste-dashboard', effectiveBranchId ?? "all"],
    queryFn: () => getWasteDashboard({ branch_id: effectiveBranchId }),
  })

  // Fetch PGRS status
  const { data: pgrsStatus, refetch: refetchPGRS } = useQuery({
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

  const buildExportRows = (): WasteExportRow[] =>
    wasteLogs.map((item) => {
      const progress = getWasteLogProgress(item)
      return {
        "Nº MTR / Controle": item.mtr_number,
        "Resíduo": item.waste_description,
        "Classe": item.waste_class || "-",
        "Data da Coleta": item.collection_date,
        "Quantidade": `${item.quantity} ${item.unit}`,
        "Filial": item.branch_id ? branchLabelById.get(item.branch_id) || item.branch_id : "-",
        "Documentos": documentCountByWasteLog[item.id] || 0,
        "Destinador": item.destination_name || "-",
        "Status": item.status,
        "Progresso": `${progress.filled}/${progress.total} (${progress.percent}%) - ${progress.label}`,
        "Campos Pendentes": progress.missingFields.length > 0 ? progress.missingFields.join(" | ") : "Nenhum",
      }
    })

  const triggerCsvDownload = (content: string, filename: string) => {
    const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    if (wasteLogs.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há movimentações de resíduos na lista atual.",
        variant: "destructive",
      })
      return
    }

    const rows = buildExportRows()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ";", RS: "\n" })
    const dateRef = new Date().toISOString().slice(0, 10)

    triggerCsvDownload(csv, `movimentacoes-residuos-${dateRef}.csv`)
    toast({
      title: "Exportação concluída",
      description: "Arquivo CSV gerado com sucesso.",
    })
  }

  const handleExportXLSX = () => {
    if (wasteLogs.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há movimentações de resíduos na lista atual.",
        variant: "destructive",
      })
      return
    }

    const rows = buildExportRows()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movimentacoes")
    const dateRef = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `movimentacoes-residuos-${dateRef}.xlsx`)

    toast({
      title: "Exportação concluída",
      description: "Arquivo XLSX gerado com sucesso.",
    })
  }

  return (
    <div className="space-y-6 pb-24 md:pb-28">
        {/* Cabeçalho da página */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            {lockedBranchId && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2 text-muted-foreground"
                onClick={() => navigate("/residuos")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Todas as filiais
              </Button>
            )}
            <h1 className="text-3xl font-bold text-foreground">
              {lockedBranchId
                ? (branchLabelById.get(lockedBranchId) ?? "Filial")
                : "Gestão de Resíduos Sólidos"}
            </h1>
            {lockedBranchId && (
              <p className="text-sm text-muted-foreground">Gestão de Resíduos Sólidos</p>
            )}
          </div>
          <Button className="w-fit" onClick={() => navigate("/residuos/registrar-destinacao")}>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" disabled={isLoadingLogs}>
                <Download className="h-4 w-4" />
                Exportar
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleExportCSV}>
                CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportXLSX}>
                Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-2 border rounded-md p-1">
            <Button
              size="sm"
              variant={statusFilter === "pendentes" ? "default" : "ghost"}
              className="h-7 gap-1.5 text-xs"
              onClick={() => setStatusFilter(statusFilter === "pendentes" ? "all" : "pendentes")}
            >
              Pendentes
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
                {pendentesCount}
              </Badge>
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "concluidos" ? "default" : "ghost"}
              className="h-7 gap-1.5 text-xs"
              onClick={() => setStatusFilter(statusFilter === "concluidos" ? "all" : "concluidos")}
            >
              Concluídos
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
                {concluidosCount}
              </Badge>
            </Button>
          </div>
          {!lockedBranchId && (
            <div className="w-full sm:w-[320px]">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as filiais</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {getBranchDisplayLabel(branch)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
                    <TableHead className="w-[180px]">Filial</TableHead>
                    <TableHead className="w-[100px]">Documentos</TableHead>
                    <TableHead>Destinador</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[160px]">Financeiro</TableHead>
                    <TableHead className="min-w-[180px]">Progresso</TableHead>
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
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-[160px]" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredWasteLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        {wasteLogs.length === 0 ? (
                          <>
                            Nenhum registro de resíduo encontrado.
                            <Button
                              variant="link"
                              onClick={() => navigate("/residuos/novo")}
                              className="ml-2"
                            >
                              Registrar o primeiro
                            </Button>
                          </>
                        ) : (
                          <>
                            Nenhum registro {statusFilter === "pendentes" ? "pendente" : "concluído"} encontrado.
                            <Button variant="link" className="ml-2" onClick={() => setStatusFilter("all")}>
                              Ver todos
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWasteLogs.map((item) => {
                      const statusVariant = getStatusVariant(item.status)
                      const progress = getWasteLogProgress(item)
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.mtr_number}</TableCell>
                          <TableCell>{item.waste_description}</TableCell>
                          <TableCell>
                            <span className="text-sm">{item.waste_class}</span>
                          </TableCell>
                          <TableCell>{item.collection_date}</TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{item.branch_id ? branchLabelById.get(item.branch_id) || item.branch_id : "-"}</TableCell>
                          <TableCell>{documentCountByWasteLog[item.id] || 0}</TableCell>
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
                            {(() => {
                              const rev = (item.revenue_total || 0) + (item.revenue_per_unit || 0);
                              const cost = (item.destination_cost_total || 0) + (item.transport_cost || 0);
                              if (rev > 0) {
                                const val = item.revenue_total || item.revenue_per_unit || 0;
                                return (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                                      <TrendingUp className="h-3.5 w-3.5" />
                                      Recebendo
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      R$ {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                );
                              }
                              if (cost > 0) {
                                return (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                                      <TrendingDown className="h-3.5 w-3.5" />
                                      Pagando
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      R$ {cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                );
                              }
                              return <span className="text-xs text-muted-foreground">-</span>;
                            })()}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="space-y-1 cursor-help">
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all ${progress.barClassName}`}
                                        style={{ width: `${progress.percent}%` }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                                      {progress.filled}/{progress.total}
                                    </span>
                                  </div>
                                  <p className={`text-[10px] leading-tight font-medium ${progress.labelClassName}`}>
                                    {progress.label}
                                  </p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm">
                                {progress.missingFields.length > 0 ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold">Campos que precisam de atenção:</p>
                                    <ul className="list-disc pl-4 text-xs space-y-0.5">
                                      {progress.missingFields.map((fieldLabel) => (
                                        <li key={fieldLabel}>{fieldLabel}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="text-xs">Todos os campos críticos foram preenchidos.</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Ver Detalhes/CDF"
                          onClick={() => {
                            navigate(`/residuos/${item.id}?tab=documents`)
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Ver Detalhes"
                          onClick={() => {
                            navigate(`/residuos/${item.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title="Editar"
                          onClick={() => {
                            navigate(`/residuos/registrar-destinacao?edit=${item.id}`)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Excluir"
                          onClick={() => setDeleteTargetId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de resíduo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTargetId) deleteMutation.mutate(deleteTargetId) }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}

export default Residuos
