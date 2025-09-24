import { useState, useMemo } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CardWithAI } from "@/components/CardWithAI"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { SmartSkeleton } from "@/components/SmartSkeleton"
import { EmissionInsightsDashboard } from "@/components/EmissionInsightsDashboard"
import { TrendingDown, CalendarIcon, RefreshCw } from "lucide-react"
import { format, addDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { useSmartCache } from "@/hooks/useSmartCache"
import { useAutoRefresh } from "@/hooks/useAutoRefresh"
import { useRealTimeData } from "@/hooks/useRealTimeData"
import { supabase } from "@/integrations/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

// Fetch real emissions data from Supabase
const getEmissionsData = async (dateRange?: DateRange) => {
  let query = supabase
    .from('calculated_emissions')
    .select(`
      total_co2e,
      calculation_date,
      activity_data (
        period_start_date,
        period_end_date,
        emission_sources (
          scope,
          category,
          name
        )
      )
    `)
    .order('calculation_date', { ascending: true })

  // Apply date filter if provided
  if (dateRange?.from) {
    query = query.gte('calculation_date', dateRange.from.toISOString())
  }
  if (dateRange?.to) {
    query = query.lte('calculation_date', dateRange.to.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching emissions:', error)
    throw error
  }

  return data || []
}

const DashboardGHG = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1), // 01/01/2025
    to: new Date(2025, 11, 31), // 31/12/2025
  })

  const dateRangeKey = dateRange ? `${dateRange.from?.toISOString()}-${dateRange.to?.toISOString()}` : 'no-range';
  
  // Smart cache with real-time updates for emissions data
  const { data: emissionsData, isLoading, cacheInfo } = useSmartCache({
    queryKey: ['emissions-data', dateRangeKey],
    queryFn: () => getEmissionsData(dateRange),
    priority: 'high',
    preloadRelated: [['emission-factors'], ['activity-data']],
    backgroundRefetch: true,
  });

  // Auto-refresh system
  const { refresh, isRefreshing, lastRefresh } = useAutoRefresh({
    queryKeys: [['emissions-data', dateRangeKey]],
    interval: 60000, // 1 minute for dashboard data
    enableRealtime: true,
    realtimeTable: 'calculated_emissions',
  });

  // Real-time data connection
  useRealTimeData([
    {
      table: 'calculated_emissions',
      queryKey: ['emissions-data', dateRangeKey],
      events: ['INSERT', 'UPDATE'],
      debounceMs: 1000,
    },
    {
      table: 'activity_data',
      queryKey: ['emissions-data', dateRangeKey],
      events: ['INSERT', 'UPDATE', 'DELETE'],
      debounceMs: 1000,
    }
  ]);

  // Process data for charts
  const { monthlyData, escopoData, fontesEscopo1Data, totals } = useMemo(() => {
    if (!emissionsData || emissionsData.length === 0) {
      return {
        monthlyData: [],
        escopoData: [],
        fontesEscopo1Data: [],
        totals: { total: 0, escopo1: 0, escopo2: 0, escopo3: 0 }
      }
    }

    // Group by month and scope
    const monthlyTotals: Record<string, { escopo1: number; escopo2: number; escopo3: number }> = {}
    const scopeTotals = { escopo1: 0, escopo2: 0, escopo3: 0 }
    const categoryTotals: Record<string, number> = {}

    emissionsData.forEach(emission => {
      const scope = emission.activity_data?.emission_sources?.scope
      const category = emission.activity_data?.emission_sources?.category || 'Outros'
      const co2e = emission.total_co2e || 0
      const date = new Date(emission.calculation_date)
      const monthKey = format(date, 'MMM')

      // Initialize month if not exists
      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { escopo1: 0, escopo2: 0, escopo3: 0 }
      }

      // Add to monthly totals
      if (scope === 1) {
        monthlyTotals[monthKey].escopo1 += co2e
        scopeTotals.escopo1 += co2e
        if (scope === 1) categoryTotals[category] = (categoryTotals[category] || 0) + co2e
      } else if (scope === 2) {
        monthlyTotals[monthKey].escopo2 += co2e
        scopeTotals.escopo2 += co2e
      } else if (scope === 3) {
        monthlyTotals[monthKey].escopo3 += co2e
        scopeTotals.escopo3 += co2e
      }
    })

    // Convert to chart format
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const processedMonthlyData = months.map(mes => ({
      mes,
      escopo1: Math.round((monthlyTotals[mes]?.escopo1 || 0) * 100) / 100,
      escopo2: Math.round((monthlyTotals[mes]?.escopo2 || 0) * 100) / 100,
      escopo3: Math.round((monthlyTotals[mes]?.escopo3 || 0) * 100) / 100,
    }))

    const totalEmissions = scopeTotals.escopo1 + scopeTotals.escopo2 + scopeTotals.escopo3
    const processedEscopoData = [
      { 
        name: "Escopo 1", 
        value: totalEmissions > 0 ? Math.round((scopeTotals.escopo1 / totalEmissions) * 1000) / 10 : 0, 
        color: "#1e40af" 
      },
      { 
        name: "Escopo 2", 
        value: totalEmissions > 0 ? Math.round((scopeTotals.escopo2 / totalEmissions) * 1000) / 10 : 0, 
        color: "#3b82f6" 
      },
      { 
        name: "Escopo 3", 
        value: totalEmissions > 0 ? Math.round((scopeTotals.escopo3 / totalEmissions) * 1000) / 10 : 0, 
        color: "#93c5fd" 
      },
    ].filter(item => item.value > 0)

    // Process scope 1 sources
    const totalScope1 = scopeTotals.escopo1
    const processedFontesData = Object.entries(categoryTotals)
      .map(([category, value]) => ({
        name: category,
        value: totalScope1 > 0 ? Math.round((value / totalScope1) * 1000) / 10 : 0,
        color: "#" + Math.floor(Math.random()*16777215).toString(16) // Random color
      }))
      .filter(item => item.value > 0)

    return {
      monthlyData: processedMonthlyData,
      escopoData: processedEscopoData,
      fontesEscopo1Data: processedFontesData,
      totals: {
        total: Math.round(totalEmissions * 100) / 100,
        escopo1: Math.round(scopeTotals.escopo1 * 100) / 100,
        escopo2: Math.round(scopeTotals.escopo2 * 100) / 100,
        escopo3: Math.round(scopeTotals.escopo3 * 100) / 100,
      }
    }
  }, [emissionsData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0)
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm text-muted-foreground">{`Total: ${total.toFixed(0)} tCO₂e`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'escopo1' ? 'Escopo 1' : 
                 entry.dataKey === 'escopo2' ? 'Escopo 2' : 'Escopo 3'}: ${entry.value} tCO₂e`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderCustomizedLabel = (entry: any) => {
    if (entry.value > 0) {
      return `${entry.value}%`
    }
    return null
  }

  return (
    <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Emissões (GHG)</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada das emissões de Gases de Efeito Estufa
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <div className={`h-2 w-2 rounded-full mr-1 ${cacheInfo.isCached ? 'bg-success' : 'bg-warning'}`} />
                {cacheInfo.isCached ? 'Dados em cache' : 'Dados atualizando'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={isRefreshing}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
          
          {/* Filtro de Período */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Período de Análise</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione o período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* KPIs Resumidos com IA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardWithAI
            cardType="emissions_total"
            cardData={{ 
              total: totals.total, 
              previous: totals.total * 0.9, // Mock previous value
              trend: 'increase' 
            }}
            title="Emissões Totais (tCO₂e)"
            value={totals.total}
            subtitle="Período selecionado"
            className="shadow-card"
            isLoading={isLoading}
          />

          <CardWithAI
            cardType="emissions_scope"
            cardData={{ 
              escopo1: totals.escopo1,
              escopo2: totals.escopo2,
              escopo3: totals.escopo3,
              scope2_percentage: totals.total > 0 ? Math.round((totals.escopo2 / totals.total) * 100) : 0
            }}
            title="Escopo 1 (tCO₂e)"
            value={totals.escopo1}
            subtitle={`${totals.total > 0 ? Math.round((totals.escopo1 / totals.total) * 100) : 0}% do total`}
            className="shadow-card"
            isLoading={isLoading}
          />

          <CardWithAI
            cardType="emissions_scope"
            cardData={{ 
              escopo1: totals.escopo1,
              escopo2: totals.escopo2,
              escopo3: totals.escopo3,
              scope2_percentage: totals.total > 0 ? Math.round((totals.escopo2 / totals.total) * 100) : 0
            }}
            title="Escopo 2 (tCO₂e)"
            value={totals.escopo2}
            subtitle={`${totals.total > 0 ? Math.round((totals.escopo2 / totals.total) * 100) : 0}% do total`}
            className="shadow-card"
            isLoading={isLoading}
          />
        </div>

        {/* Gráfico Principal - Evolução Mensal */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Evolução Mensal das Emissões (tCO₂e)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {isLoading ? (
                <SmartSkeleton variant="chart" className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="escopo1" stackId="a" fill="#1e40af" name="Escopo 1" />
                    <Bar dataKey="escopo2" stackId="a" fill="#3b82f6" name="Escopo 2" />
                    <Bar dataKey="escopo3" stackId="a" fill="#93c5fd" name="Escopo 3" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráficos de Detalhamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emissões por Escopo */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Emissões por Escopo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <SmartSkeleton variant="chart" className="h-full" />
                ) : escopoData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={escopoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {escopoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, 'Percentual']}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry: any) => (
                          <span style={{ color: entry.color }}>{value}: {entry.payload.value}%</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado de emissões encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fontes de Emissão - Escopo 1 */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Fontes de Emissão - Escopo 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading ? (
                  <SmartSkeleton variant="chart" className="h-full" />
                ) : fontesEscopo1Data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fontesEscopo1Data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {fontesEscopo1Data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, 'Percentual']}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry: any) => (
                          <span style={{ color: entry.color }}>{value}: {entry.payload.value}%</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Nenhum dado de Escopo 1 encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <EmissionInsightsDashboard 
          dateRange={dateRange?.from && dateRange?.to ? dateRange as { from: Date; to: Date } : undefined}
          emissionData={emissionsData || []}
        />
      </div>
  )
}

export default DashboardGHG