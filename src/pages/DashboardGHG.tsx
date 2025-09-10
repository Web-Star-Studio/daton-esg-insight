import { useState } from "react"
import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { TrendingDown, CalendarIcon } from "lucide-react"
import { format, addDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
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

// Dados mockados para o gráfico de evolução mensal
const monthlyData = [
  { mes: "Jan", escopo1: 180, escopo2: 190, escopo3: 20 },
  { mes: "Fev", escopo1: 165, escopo2: 185, escopo3: 15 },
  { mes: "Mar", escopo1: 175, escopo2: 195, escopo3: 25 },
  { mes: "Abr", escopo1: 160, escopo2: 180, escopo3: 18 },
  { mes: "Mai", escopo1: 170, escopo2: 175, escopo3: 22 },
  { mes: "Jun", escopo1: 185, escopo2: 200, escopo3: 30 },
  { mes: "Jul", escopo1: 190, escopo2: 205, escopo3: 28 },
  { mes: "Ago", escopo1: 175, escopo2: 180, escopo3: 20 },
  { mes: "Set", escopo1: 168, escopo2: 175, escopo3: 15 },
  { mes: "Out", escopo1: 172, escopo2: 185, escopo3: 25 },
  { mes: "Nov", escopo1: 165, escopo2: 170, escopo3: 18 },
  { mes: "Dez", escopo1: 160, escopo2: 165, escopo3: 12 }
]

// Dados para gráfico de rosca - Emissões por Escopo
const escopoData = [
  { name: "Escopo 1", value: 48.9, color: "#1e40af" }, // Azul escuro
  { name: "Escopo 2", value: 51.1, color: "#3b82f6" }, // Azul médio
  { name: "Escopo 3", value: 0, color: "#93c5fd" }, // Azul claro
]

// Dados para gráfico de rosca - Fontes Escopo 1
const fontesEscopo1Data = [
  { name: "Combustão Estacionária", value: 65, color: "#1e40af" },
  { name: "Combustão Móvel", value: 30, color: "#3b82f6" },
  { name: "Emissões Fugitivas", value: 5, color: "#93c5fd" },
]

const DashboardGHG = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 1), // 01/01/2025
    to: new Date(2025, 11, 31), // 31/12/2025
  })

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
    <MainLayout>
      <div className="space-y-6">
        {/* Cabeçalho da página */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard de Emissões (GHG)</h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada das emissões de Gases de Efeito Estufa
            </p>
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

        {/* KPIs Resumidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emissões Totais (tCO₂e)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">4.204</div>
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingDown className="h-3 w-3" />
                -5.8% vs. Período Anterior
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escopo 1 (tCO₂e)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2.054</div>
              <div className="text-xs text-muted-foreground">48.9% do total</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escopo 2 (tCO₂e)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2.150</div>
              <div className="text-xs text-muted-foreground">51.1% do total</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico Principal - Evolução Mensal */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Evolução Mensal das Emissões (tCO₂e)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={escopoData.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {escopoData.filter(item => item.value > 0).map((entry, index) => (
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}

export default DashboardGHG