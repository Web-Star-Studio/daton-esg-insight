import { useState } from "react"
import { MainLayout } from "@/components/MainLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { Calculator, Target, Lightbulb, TrendingUp, TrendingDown, DollarSign, Leaf, Calendar, AlertTriangle, CheckCircle, Zap, Car, Recycle, Building2, Factory, Wind, Sun } from "lucide-react"
import { ConstrutorAcoes } from "@/components/ConstrutorAcoes"
import { VisualizacaoProjecoes } from "@/components/VisualizacaoProjecoes" 
import { RecomendacoesIA } from "@/components/RecomendacoesIA"
import { CenarioDescarbonizacao, AcaoDescarbonizacao, ResultadosProjecao } from "@/services/scenarioPlanning"

export default function PlanejadorCenarios() {
  const [cenarioAtivo, setCenarioAtivo] = useState<CenarioDescarbonizacao>({
    id: "cenario-1",
    nome: "Cenário Piloto",
    descricao: "Estratégia inicial de descarbonização focada em quick wins",
    periodo_projecao: { 
      inicio: new Date("2024-01-01"), 
      fim: new Date("2030-12-31") 
    },
    acoes: [],
    baseline: {
      emissoes_totais: 31958,
      emissoes_por_escopo: { escopo1: 12500, escopo2: 15200, escopo3: 4258 },
      custo_atual_energia: 850000,
      score_esg_atual: 32
    },
    resultados_projetados: {
      reducao_emissoes: {
        total_tco2e: 0,
        por_escopo: { escopo1: 0, escopo2: 0, escopo3: 0 },
        por_ano: []
      },
      impacto_financeiro: {
        investimento_total: 0,
        economia_anual: 0,
        payback_simples: 0,
        vpl_10_anos: 0
      },
      score_esg: {
        score_atual: 32,
        score_projetado: 32,
        melhoria: 0,
        comparacao_setor: "Abaixo da média"
      },
      riscos_identificados: [],
      oportunidades: []
    }
  })

  const [cenarioComparacao, setCenarioComparacao] = useState<CenarioDescarbonizacao[]>([])
  const [modoVisualizacao, setModoVisualizacao] = useState<"detalhado" | "comparativo" | "execucao">("detalhado")

  // Dados para visualizações
  const dadosJornada = [
    { ano: 2024, baseline: 31958, projetado: 31958 },
    { ano: 2025, baseline: 31958, projetado: 28500 },
    { ano: 2026, baseline: 31958, projetado: 24800 },
    { ano: 2027, baseline: 31958, projetado: 21200 },
    { ano: 2028, baseline: 31958, projetado: 18100 },
    { ano: 2029, baseline: 31958, projetado: 15400 },
    { ano: 2030, baseline: 31958, projetado: 12800 }
  ]

  const dadosEsgRadar = [
    { pillar: "Environmental", atual: 25, projetado: 68 },
    { pillar: "Social", atual: 45, projetado: 52 }, 
    { pillar: "Governance", atual: 38, projetado: 42 },
    { pillar: "Climate Risk", atual: 20, projetado: 75 },
    { pillar: "Compliance", atual: 60, projetado: 85 },
    { pillar: "Innovation", atual: 35, projetado: 70 }
  ]

  const acoesPriorizadas = [
    { nome: "Energia Solar", impacto: 4200, custo: 480000, roi: 18, prazo: "12 meses" },
    { nome: "Eficiência Energética", impacto: 2800, custo: 120000, roi: 36, prazo: "6 meses" },
    { nome: "Eletrificação Frota", impacto: 1900, custo: 350000, roi: 24, prazo: "18 meses" },
    { nome: "Gestão de Resíduos", impacto: 650, custo: 45000, roi: 48, prazo: "3 meses" }
  ]

  const handleAdicionarAcao = (acao: AcaoDescarbonizacao) => {
    setCenarioAtivo(prev => ({
      ...prev,
      acoes: [...prev.acoes, acao]
    }))
    // Recalcular resultados automaticamente
    // Aqui chamaria o serviço de cálculo
  }

  const handleRemoverAcao = (acaoId: string) => {
    setCenarioAtivo(prev => ({
      ...prev,
      acoes: prev.acoes.filter(a => a.id !== acaoId)
    }))
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header com resumo do cenário */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Planejador de Cenários</h1>
            <p className="text-muted-foreground">
              Simule estratégias de descarbonização e projete impactos futuros
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Target className="w-3 h-3 mr-1" />
              Meta: Net Zero 2030
            </Badge>
            <Button size="sm" variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar Cenário
            </Button>
          </div>
        </div>

        {/* Cards de métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <p className="text-sm text-muted-foreground">Redução Projetada</p>
              </div>
              <p className="text-2xl font-bold text-green-600">-60%</p>
              <p className="text-xs text-muted-foreground">até 2030</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">Investimento Total</p>
              </div>
              <p className="text-2xl font-bold">R$ 1.2M</p>
              <p className="text-xs text-muted-foreground">ROI: 28 meses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <p className="text-sm text-muted-foreground">Score ESG</p>
              </div>
              <p className="text-2xl font-bold">32 → 78</p>
              <p className="text-xs text-muted-foreground">+144% melhoria</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-orange-500" />
                <p className="text-sm text-muted-foreground">Próximo Marco</p>
              </div>
              <p className="text-2xl font-bold">Q2</p>
              <p className="text-xs text-muted-foreground">Energia Solar</p>
            </CardContent>
          </Card>
        </div>

        {/* Layout principal de 3 colunas */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Coluna 1: Construtor de Cenários (30%) */}
          <div className="xl:col-span-4 space-y-6">
            <ConstrutorAcoes 
              cenario={cenarioAtivo}
              onAdicionarAcao={handleAdicionarAcao}
              onRemoverAcao={handleRemoverAcao}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="w-4 h-4" />
                  Ações Priorizadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acoesPriorizadas.map((acao, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium text-sm">{acao.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        -{acao.impacto} tCO₂e | ROI: {acao.roi} meses
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Calculator className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Visualizações e Projeções (40%) */}
          <div className="xl:col-span-5 space-y-6">
            <VisualizacaoProjecoes 
              cenario={cenarioAtivo}
              modoVisualizacao={modoVisualizacao}
              onMudarmodo={setModoVisualizacao}
            />

            {/* Jornada de Descarbonização */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trajetória de Descarbonização</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosJornada}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ano" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} tCO₂e`, '']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      name="Baseline"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="projetado" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Cenário Projetado"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ESG Score Compass */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ESG Score Compass</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={dadosEsgRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={60} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Atual" 
                      dataKey="atual" 
                      stroke="hsl(var(--muted-foreground))" 
                      fill="hsl(var(--muted-foreground))" 
                      fillOpacity={0.1}
                    />
                    <Radar 
                      name="Projetado" 
                      dataKey="projetado" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Insights e Recomendações da IA (30%) */}
          <div className="xl:col-span-3 space-y-6">
            <RecomendacoesIA cenario={cenarioAtivo} />

            {/* Timeline de Execução */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-4 h-4" />
                  Timeline Estratégica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>
                  
                  {[
                    { fase: "Q1 2024", acao: "Auditoria Energética", status: "completed" },
                    { fase: "Q2 2024", acao: "Instalação Solar", status: "in-progress" },
                    { fase: "Q3 2024", acao: "Eficiência Predial", status: "planned" },
                    { fase: "Q4 2024", acao: "Eletrificação Frota", status: "planned" },
                  ].map((item, index) => (
                    <div key={index} className="relative flex items-start gap-3 pb-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-green-500 border-green-500' :
                        item.status === 'in-progress' ? 'bg-orange-500 border-orange-500' :
                        'bg-muted border-border'
                      }`}>
                        {item.status === 'completed' && <CheckCircle className="w-3 h-3 text-white" />}
                        {item.status === 'in-progress' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.fase}</p>
                        <p className="text-xs text-muted-foreground">{item.acao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  Análise de Riscos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Dependência Climática</p>
                    <p className="text-xs text-muted-foreground">Solar: 85% eficiência</p>
                  </div>
                  <Badge variant="outline" className="text-orange-600">Médio</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Regulatório</p>
                    <p className="text-xs text-muted-foreground">CBAM impacto em 2026</p>
                  </div>
                  <Badge variant="outline" className="text-red-600">Alto</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Tecnológico</p>
                    <p className="text-xs text-muted-foreground">Maturidade das soluções</p>
                  </div>
                  <Badge variant="outline" className="text-green-600">Baixo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção de Comparação de Cenários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Comparação de Cenários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="impacto" className="w-full">
              <TabsList>
                <TabsTrigger value="impacto">Impacto Ambiental</TabsTrigger>
                <TabsTrigger value="financeiro">Análise Financeira</TabsTrigger>
                <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
              </TabsList>
              
              <TabsContent value="impacto" className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { cenario: "Conservador", reducao: 35, investimento: 800 },
                    { cenario: "Equilibrado", reducao: 60, investimento: 1200 },
                    { cenario: "Agressivo", reducao: 85, investimento: 2100 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cenario" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reducao" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="financeiro" className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">28%</p>
                    <p className="text-sm text-muted-foreground">ROI Médio</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R$ 2.1M</p>
                    <p className="text-sm text-muted-foreground">Economia 10 anos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">32 meses</p>
                    <p className="text-sm text-muted-foreground">Payback</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="cronograma" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso Geral</span>
                    <span>15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}