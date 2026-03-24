import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, BarChart3, Users, ArrowRight, Layers } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useBranches } from "@/services/branches"
import { getBranchDisplayLabel } from "@/utils/branchDisplay"
import PGRSStatusCard from "@/components/PGRSStatusCard"
import { getActivePGRSStatus } from "@/services/pgrsReports"

const ResiduosFiliais = () => {
  const navigate = useNavigate()
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches()

  const { data: pgrsStatus, refetch: refetchPGRS } = useQuery({
    queryKey: ["pgrs-status"],
    queryFn: () => getActivePGRSStatus(),
  })

  const { data: allLogs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["waste-logs-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waste_logs")
        .select("id, branch_id, status, collection_date")
        .order("collection_date", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const summaryByBranch = useMemo(() => {
    const map = new Map<string, { pendentes: number; concluidos: number; lastDate: string | null }>()
    for (const log of allLogs) {
      const key = log.branch_id ?? "__none__"
      if (!map.has(key)) map.set(key, { pendentes: 0, concluidos: 0, lastDate: null })
      const entry = map.get(key)!
      if (log.status === "Destinação Finalizada") {
        entry.concluidos++
      } else {
        entry.pendentes++
      }
      if (!entry.lastDate || log.collection_date > entry.lastDate) {
        entry.lastDate = log.collection_date
      }
    }
    return map
  }, [allLogs])

  const totalLogs = allLogs.length
  const totalPendentes = allLogs.filter((l) => l.status !== "Destinação Finalizada").length
  const totalConcluidos = allLogs.filter((l) => l.status === "Destinação Finalizada").length

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR")
  }

  const isLoading = isLoadingBranches || isLoadingLogs

  return (
    <div className="space-y-6 pb-24 md:pb-28">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Resíduos Sólidos</h1>
          <p className="text-sm text-muted-foreground mt-1">Selecione uma filial para gerenciar os registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/residuos/geral")}>
            <Layers className="h-4 w-4" />
            Visão Consolidada
          </Button>
          <Button onClick={() => navigate("/residuos/registrar-destinacao")}>
            + Registrar Destinação
          </Button>
        </div>
      </div>

      <PGRSStatusCard pgrsStatus={pgrsStatus} onUpdate={refetchPGRS} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalLogs}</div>}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes (todas as filiais)</CardTitle>
            <Building2 className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-warning">{totalPendentes}</div>}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos (todas as filiais)</CardTitle>
            <Building2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-success">{totalConcluidos}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/fornecedores-residuos")}>
          <Users className="h-4 w-4" />
          Gerenciar Fornecedores
        </Button>
        <Button variant="outline" className="flex items-center gap-2" onClick={() => navigate("/residuos/relatorios")}>
          <BarChart3 className="h-4 w-4" />
          Relatórios PGRS
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Filiais</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /></div>
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma filial cadastrada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => {
              const summary = summaryByBranch.get(branch.id)
              const pendentes = summary?.pendentes ?? 0
              const concluidos = summary?.concluidos ?? 0
              const lastDate = summary?.lastDate ?? null
              const total = pendentes + concluidos

              return (
                <Card
                  key={branch.id}
                  className="shadow-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/residuos/filial/${branch.id}`)}
                >
                  <CardContent className="pt-5 pb-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground leading-tight">{getBranchDisplayLabel(branch)}</p>
                        {(branch.city || branch.state) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[branch.city, branch.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      {branch.is_headquarters && (
                        <Badge variant="outline" className="text-[10px] shrink-0">Sede</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 gap-1">
                        {pendentes} pendente{pendentes !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20 gap-1">
                        {concluidos} concluído{concluidos !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{total} registro{total !== 1 ? "s" : ""} no total</span>
                      {lastDate && <span>Última coleta: {formatDate(lastDate)}</span>}
                    </div>

                    <Button
                      size="sm"
                      className="w-full gap-1"
                      onClick={(e) => { e.stopPropagation(); navigate(`/residuos/filial/${branch.id}`) }}
                    >
                      Acessar
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ResiduosFiliais
