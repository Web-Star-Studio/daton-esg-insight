import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, BarChart3, Eye, GitCompare, Calendar } from "lucide-react"
import { CenarioDescarbonizacao } from "@/services/scenarioPlanning"

interface VisualizacaoProjecoesProps {
  cenario: CenarioDescarbonizacao
  modoVisualizacao: "detalhado" | "comparativo" | "execucao"
  onMudarmodo: (modo: "detalhado" | "comparativo" | "execucao") => void
}

export function VisualizacaoProjecoes({ cenario, modoVisualizacao, onMudarmodo }: VisualizacaoProjecoesProps) {
  
  // Dados simulados para visualizações
  const dadosReducaoAnual = [
    { ano: "2024", baseline: 31958, cenario: 28500, meta: 30000 },
    { ano: "2025", baseline: 31958, cenario: 24800, meta: 25000 },
    { ano: "2026", baseline: 31958, cenario: 21200, meta: 20000 },
    { ano: "2027", baseline: 31958, cenario: 18100, meta: 16000 },
    { ano: "2028", baseline: 31958, cenario: 15400, meta: 12000 },
    { ano: "2029", baseline: 31958, cenario: 12800, meta: 9500 },
    { ano: "2030", baseline: 31958, cenario: 9600, meta: 6400 }
  ]

  const dadosInvestimentoRetorno = [
    { categoria: "Energia Solar", investimento: 480000, economia_anual: 96000, payback: 5.0 },
    { categoria: "Eficiência Energética", investimento: 120000, economia_anual: 48000, payback: 2.5 },
    { categoria: "Eletrificação", investimento: 350000, economia_anual: 42000, payback: 8.3 },
    { categoria: "Gestão Resíduos", investimento: 45000, economia_anual: 18000, payback: 2.5 }
  ]

  const dadosDistribuicaoEmissoes = [
    { nome: "Escopo 1", valor: 12500, cor: "#ef4444" },
    { nome: "Escopo 2", valor: 15200, cor: "#f97316" },
    { nome: "Escopo 3", valor: 4258, cor: "#eab308" }
  ]

  const dadosDistribuicaoProjetada = [
    { nome: "Escopo 1", valor: 8750, cor: "#22c55e" },
    { nome: "Escopo 2", valor: 7600, cor: "#10b981" },
    { nome: "Escopo 3", valor: 3250, cor: "#059669" }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Projeções e Análises
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant={modoVisualizacao === "detalhado" ? "default" : "outline"}
              size="sm"
              onClick={() => onMudarmodo("detalhado")}
            >
              <Eye className="w-3 h-3 mr-1" />
              Detalhado
            </Button>
            <Button
              variant={modoVisualizacao === "comparativo" ? "default" : "outline"}
              size="sm"
              onClick={() => onMudarmodo("comparativo")}
            >
              <GitCompare className="w-3 h-3 mr-1" />
              Comparar
            </Button>
            <Button
              variant={modoVisualizacao === "execucao" ? "default" : "outline"}
              size="sm"
              onClick={() => onMudarmodo("execucao")}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Execução
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="reducao" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reducao">Redução</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reducao" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Trajetória de Emissões</h3>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  Baseline
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Cenário
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Meta Setorial
                </Badge>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dadosReducaoAnual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} tCO₂e`, '']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="baseline" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  name="Baseline"
                />
                <Line 
                  type="monotone" 
                  dataKey="cenario" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  name="Cenário Planejado"
                />
                <Line 
                  type="monotone" 
                  dataKey="meta" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  name="Meta Setorial"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <h3 className="text-lg font-medium">Análise de Investimento vs Retorno</h3>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dadosInvestimentoRetorno}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'investimento' ? `R$ ${value.toLocaleString()}` :
                    name === 'economia_anual' ? `R$ ${value.toLocaleString()}/ano` :
                    `${value} anos`,
                    name === 'investimento' ? 'Investimento' :
                    name === 'economia_anual' ? 'Economia Anual' : 'Payback'
                  ]}
                />
                <Bar dataKey="investimento" fill="hsl(var(--muted))" name="Investimento" />
                <Bar dataKey="economia_anual" fill="hsl(var(--primary))" name="Economia Anual" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {dadosInvestimentoRetorno.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">{item.categoria}</p>
                  <p className="text-xs text-muted-foreground">
                    Payback: {item.payback} anos
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (6 - item.payback) / 6 * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="distribuicao" className="space-y-4">
            <h3 className="text-lg font-medium">Distribuição por Escopo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-center">Situação Atual</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dadosDistribuicaoEmissoes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="valor"
                      label={({ nome, valor }) => `${nome}: ${valor.toLocaleString()}`}
                    >
                      {dadosDistribuicaoEmissoes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} tCO₂e`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="font-medium mb-3 text-center">Projeção 2030</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dadosDistribuicaoProjetada}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="valor"
                      label={({ nome, valor }) => `${nome}: ${valor.toLocaleString()}`}
                    >
                      {dadosDistribuicaoProjetada.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} tCO₂e`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Resumo da redução */}
            <div className="bg-accent p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo da Redução por Escopo</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Escopo 1</p>
                  <p className="font-bold text-green-600">
                    -{((12500 - 8750) / 12500 * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Escopo 2</p>
                  <p className="font-bold text-green-600">
                    -{((15200 - 7600) / 15200 * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Escopo 3</p>
                  <p className="font-bold text-green-600">
                    -{((4258 - 3250) / 4258 * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metas" className="space-y-4">
            <h3 className="text-lg font-medium">Alinhamento com Metas</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Meta Net Zero 2030</h4>
                  <Badge variant="outline" className="text-green-600">No caminho</Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: "70%" }}></div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">70% de progresso até a meta</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Science Based Targets</h4>
                  <Badge variant="outline" className="text-orange-600">Atenção</Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-orange-500 h-3 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">45% - Necessário acelerar implementação</p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Acordo de Paris (1.5°C)</h4>
                  <Badge variant="outline" className="text-green-600">Alinhado</Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: "85%" }}></div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">85% de alinhamento com trajetória 1.5°C</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Oportunidade de Melhoria</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Acelerar implementação da energia solar pode melhorar alinhamento com SBTi de 45% para 75% até 2026.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}