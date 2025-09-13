import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertCircle, Target, Zap, DollarSign, Clock } from "lucide-react"
import { CenarioDescarbonizacao } from "@/services/scenarioPlanning"

interface RecomendacoesIAProps {
  cenario: CenarioDescarbonizacao
}

export function RecomendacoesIA({ cenario }: RecomendacoesIAProps) {
  
  const recomendacoes = [
    {
      id: "1",
      tipo: "quick-win",
      prioridade: "alta",
      titulo: "Energia Solar - Quick Win",
      descricao: "Instalar 100kW de energia solar pode reduzir 54 tCO₂e/ano com ROI de 18 meses",
      impacto_co2: 54,
      investimento: 420000,
      roi_meses: 18,
      confianca: 95
    },
    {
      id: "2", 
      tipo: "otimizacao",
      prioridade: "media",
      titulo: "Sequenciamento Inteligente",
      descricao: "Implementar energia solar antes da eletrificação reduz custo total em 15%",
      impacto_co2: 0,
      investimento: -180000,
      roi_meses: 0,
      confianca: 87
    },
    {
      id: "3",
      tipo: "risco",
      prioridade: "alta", 
      titulo: "Risco Regulatório CBAM",
      descricao: "CBAM europeu impactará exportações em 2026. Acelerar descarbonização pode evitar taxas",
      impacto_co2: 0,
      investimento: 0,
      roi_meses: 0,
      confianca: 78
    },
    {
      id: "4",
      tipo: "benchmark",
      prioridade: "baixa",
      titulo: "Liderança Setorial",
      descricao: "Cenário atual posiciona empresa no top 15% do setor manufatureiro",
      impacto_co2: 0,
      investimento: 0,
      roi_meses: 0,
      confianca: 92
    }
  ]

  const insights = [
    {
      titulo: "Potencial de Economia",
      valor: "R$ 2.1M",
      descricao: "em 10 anos com implementação completa",
      icone: DollarSign,
      cor: "text-green-600"
    },
    {
      titulo: "Time to Net Zero",
      valor: "6.2 anos",
      descricao: "com cenário atual vs 8.5 anos baseline",
      icone: Clock,
      cor: "text-blue-600"
    },
    {
      titulo: "Redução Total",
      valor: "60%",
      descricao: "até 2030 vs meta setorial de 45%",
      icone: TrendingUp,
      cor: "text-emerald-600"
    }
  ]

  const getIconePrioridade = (tipo: string) => {
    switch (tipo) {
      case "quick-win": return <Zap className="w-4 h-4" />
      case "otimizacao": return <Target className="w-4 h-4" />
      case "risco": return <AlertCircle className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  const getCorPrioridade = (prioridade: string) => {
    switch (prioridade) {
      case "alta": return "border-red-200 bg-red-50"
      case "media": return "border-orange-200 bg-orange-50"
      case "baixa": return "border-blue-200 bg-blue-50"
      default: return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      {/* Card principal de recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recomendações da IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recomendacoes.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 border rounded-lg transition-colors hover:bg-accent ${getCorPrioridade(rec.prioridade)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getIconePrioridade(rec.tipo)}
                  <h4 className="font-medium text-sm">{rec.titulo}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      rec.prioridade === 'alta' ? 'text-red-600' :
                      rec.prioridade === 'media' ? 'text-orange-600' : 'text-blue-600'
                    }`}
                  >
                    {rec.prioridade.charAt(0).toUpperCase() + rec.prioridade.slice(1)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {rec.confianca}% confiança
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{rec.descricao}</p>
              
              {rec.impacto_co2 > 0 && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Impacto:</span>
                    <p className="font-medium text-green-600">-{rec.impacto_co2} tCO₂e/ano</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ROI:</span>
                    <p className="font-medium">{rec.roi_meses} meses</p>
                  </div>
                </div>
              )}
              
              {rec.investimento !== 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">
                    {rec.investimento > 0 ? 'Investimento:' : 'Economia:'}
                  </span>
                  <p className={`font-medium ${rec.investimento > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {rec.investimento > 0 ? 'R$' : '+'} {Math.abs(rec.investimento).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights Estratégicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4" />
            Insights Estratégicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const Icone = insight.icone
            return (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-md bg-accent`}>
                  <Icone className={`w-4 h-4 ${insight.cor}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{insight.titulo}</p>
                  <p className={`text-lg font-bold ${insight.cor}`}>{insight.valor}</p>
                  <p className="text-xs text-muted-foreground">{insight.descricao}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Benchmarking Setorial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Posição Setorial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Score ESG Atual</span>
                <span className="text-lg font-bold text-orange-600">32/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-orange-500 h-3 rounded-full" style={{ width: "32%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Posição: 68º percentil</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Score ESG Projetado</span>
                <span className="text-lg font-bold text-green-600">78/100</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: "78%" }}></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Posição: 15º percentil (Top 15%)</p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Salto para Liderança Setorial
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Com implementação completa, empresa ficará entre as 10% mais sustentáveis do setor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start text-sm">
            <Clock className="w-3 h-3 mr-2" />
            Agendar auditoria energética
          </Button>
          <Button variant="outline" className="w-full justify-start text-sm">
            <DollarSign className="w-3 h-3 mr-2" />
            Solicitar orçamento energia solar
          </Button>
          <Button variant="outline" className="w-full justify-start text-sm">
            <Target className="w-3 h-3 mr-2" />
            Definir metas intermediárias
          </Button>
          <Button variant="outline" className="w-full justify-start text-sm">
            <Zap className="w-3 h-3 mr-2" />
            Implementar monitoramento IoT
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}