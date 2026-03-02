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
  BarChart3
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getWasteLogs, getWasteDashboard, type WasteLogListItem } from "@/services/waste"
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

const Residuos = () => {
  const navigate = useNavigate()
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all")
  const { toast } = useToast()
  const { data: branches = [] } = useBranches()
  const branchLabelById = new Map(branches.map((branch) => [branch.id, getBranchDisplayLabel(branch)]))

  // Fetch waste logs
  const { data: wasteLogs = [], isLoading: isLoadingLogs, error: logsError } = useQuery({
    queryKey: ['waste-logs', selectedBranchId],
    queryFn: () => getWasteLogs({
      branch_id: selectedBranchId === "all" ? undefined : selectedBranchId
    }),
  })
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
    queryKey: ['waste-dashboard', selectedBranchId],
    queryFn: () => getWasteDashboard({
      branch_id: selectedBranchId === "all" ? undefined : selectedBranchId
    }),
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
                        <TableCell><Skeleton className="h-8 w-[160px]" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : wasteLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
