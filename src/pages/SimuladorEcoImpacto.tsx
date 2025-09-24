import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Car, Zap, Recycle, TrendingDown, DollarSign, Trash2, Plus, X, Calculator } from "lucide-react"

interface AcaoSimulacao {
  id: string
  tipo: "renovacao-frota" | "eficiencia-energetica" | "gestao-residuos"
  titulo: string
  parametros: {
    percentual?: number
    origem?: string
    destino?: string
    localizacao?: string
    tipoResiduo?: string
  }
}

interface ResultadosSimulacao {
  reducaoEmissoes: number
  economiaFinanceira: number
  reducaoResiduos: number
  emissaoAtual: number
  emissaoSimulada: number
}

const tiposAcao = [
  {
    tipo: "renovacao-frota" as const,
    titulo: "Renovação de Frota",
    descricao: "Substitua veículos convencionais por alternativas mais sustentáveis",
    icon: Car,
    cor: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    tipo: "eficiencia-energetica" as const,
    titulo: "Eficiência Energética", 
    descricao: "Reduza o consumo de energia em suas instalações",
    icon: Zap,
    cor: "bg-yellow-100 text-yellow-700 border-yellow-200"
  },
  {
    tipo: "gestao-residuos" as const,
    titulo: "Gestão de Resíduos",
    descricao: "Aumente a reciclagem e reduza resíduos enviados para aterro",
    icon: Recycle,
    cor: "bg-green-100 text-green-700 border-green-200"
  }
]

export function SimuladorEcoImpacto() {
  const [acoesCenario, setAcoesCenario] = useState<AcaoSimulacao[]>([
    {
      id: "1",
      tipo: "renovacao-frota",
      titulo: "Renovação de Frota",
      parametros: {
        percentual: 20,
        origem: "diesel",
        destino: "eletrico"
      }
    },
    {
      id: "2", 
      tipo: "eficiencia-energetica",
      titulo: "Eficiência Energética",
      parametros: {
        percentual: 15,
        localizacao: "sede"
      }
    }
  ])
  
  const [resultados, setResultados] = useState<ResultadosSimulacao>({
    reducaoEmissoes: 412,
    economiaFinanceira: 215000,
    reducaoResiduos: 18,
    emissaoAtual: 6248,
    emissaoSimulada: 5836
  })
  
  const [showAddModal, setShowAddModal] = useState(false)

  const calcularImpacto = () => {
    let reducaoEmissoes = 0
    let economiaFinanceira = 0
    let reducaoResiduos = 0

    acoesCenario.forEach(acao => {
      switch (acao.tipo) {
        case "renovacao-frota":
          // Fator de redução por % de frota substituída
          reducaoEmissoes += (acao.parametros.percentual || 0) * 15.2
          economiaFinanceira += (acao.parametros.percentual || 0) * 8500
          break
        case "eficiencia-energetica":
          // Fator de redução por % de consumo reduzido
          reducaoEmissoes += (acao.parametros.percentual || 0) * 8.7
          economiaFinanceira += (acao.parametros.percentual || 0) * 4200
          break
        case "gestao-residuos":
          // Fator de redução por % de reciclagem aumentada
          reducaoEmissoes += (acao.parametros.percentual || 0) * 2.1
          economiaFinanceira += (acao.parametros.percentual || 0) * 1800
          reducaoResiduos += (acao.parametros.percentual || 0) * 0.6
          break
      }
    })

    const emissaoAtual = 6248
    const emissaoSimulada = emissaoAtual - reducaoEmissoes

    setResultados({
      reducaoEmissoes: Math.round(reducaoEmissoes),
      economiaFinanceira: Math.round(economiaFinanceira),
      reducaoResiduos: Math.round(reducaoResiduos),
      emissaoAtual,
      emissaoSimulada: Math.round(emissaoSimulada)
    })
  }

  const adicionarAcao = (tipo: AcaoSimulacao["tipo"]) => {
    const novaAcao: AcaoSimulacao = {
      id: Date.now().toString(),
      tipo,
      titulo: tiposAcao.find(t => t.tipo === tipo)?.titulo || "",
      parametros: tipo === "renovacao-frota" 
        ? { percentual: 10, origem: "diesel", destino: "eletrico" }
        : tipo === "eficiencia-energetica"
        ? { percentual: 10, localizacao: "sede" }
        : { percentual: 20, tipoResiduo: "classe-2a" }
    }
    
    setAcoesCenario([...acoesCenario, novaAcao])
    setShowAddModal(false)
  }

  const removerAcao = (id: string) => {
    setAcoesCenario(acoesCenario.filter(acao => acao.id !== id))
  }

  const atualizarParametro = (id: string, campo: string, valor: any) => {
    setAcoesCenario(acoesCenario.map(acao => 
      acao.id === id 
        ? { ...acao, parametros: { ...acao.parametros, [campo]: valor } }
        : acao
    ))
  }

  const dadosGrafico = [
    { nome: "Cenário Atual", valor: resultados.emissaoAtual, fill: "hsl(var(--muted))" },
    { nome: "Cenário Simulado", valor: resultados.emissaoSimulada, fill: "hsl(var(--primary))" }
  ]

  const renderCardAcao = (acao: AcaoSimulacao) => {
    const tipoInfo = tiposAcao.find(t => t.tipo === acao.tipo)
    const Icon = tipoInfo?.icon || Car

    return (
      <Card key={acao.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-md ${tipoInfo?.cor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <CardTitle className="text-base">{acao.titulo}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removerAcao(acao.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {acao.tipo === "renovacao-frota" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Substituir</span>
                <Input
                  type="number"
                  className="w-16 h-8"
                  value={acao.parametros.percentual || 0}
                  onChange={(e) => atualizarParametro(acao.id, "percentual", Number(e.target.value))}
                />
                <span>% da frota de</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Select
                  value={acao.parametros.origem}
                  onValueChange={(valor) => atualizarParametro(acao.id, "origem", valor)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="gasolina">Gasolina</SelectItem>
                    <SelectItem value="etanol">Etanol</SelectItem>
                  </SelectContent>
                </Select>
                <span>por</span>
                <Select
                  value={acao.parametros.destino}
                  onValueChange={(valor) => atualizarParametro(acao.id, "destino", valor)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eletrico">Veículos Elétricos</SelectItem>
                    <SelectItem value="hibrido">Híbridos</SelectItem>
                    <SelectItem value="gnv">GNV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {acao.tipo === "eficiencia-energetica" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Reduzir o consumo de eletricidade da</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Select
                  value={acao.parametros.localizacao}
                  onValueChange={(valor) => atualizarParametro(acao.id, "localizacao", valor)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sede">Sede Administrativa</SelectItem>
                    <SelectItem value="fabrica">Fábrica Principal</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                  </SelectContent>
                </Select>
                <span>em</span>
                <Input
                  type="number"
                  className="w-16 h-8"
                  value={acao.parametros.percentual || 0}
                  onChange={(e) => atualizarParametro(acao.id, "percentual", Number(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>
          )}

          {acao.tipo === "gestao-residuos" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Aumentar a taxa de reciclagem de</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Select
                  value={acao.parametros.tipoResiduo}
                  onValueChange={(valor) => atualizarParametro(acao.id, "tipoResiduo", valor)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classe-2a">Resíduos Classe II A</SelectItem>
                    <SelectItem value="classe-1">Resíduos Classe I</SelectItem>
                    <SelectItem value="organicos">Resíduos Orgânicos</SelectItem>
                  </SelectContent>
                </Select>
                <span>em</span>
                <Input
                  type="number"
                  className="w-16 h-8"
                  value={acao.parametros.percentual || 0}
                  onChange={(e) => atualizarParametro(acao.id, "percentual", Number(e.target.value))}
                />
                <span>%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Simulador de Eco Impacto</h1>
          <p className="text-muted-foreground">
            Modele cenários e projete o impacto de suas ações antes de investir. Compare os resultados com seus dados atuais.
          </p>
        </div>

        {/* Layout de duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna Esquerda - Parâmetros (40%) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Construa seu Cenário
                  </CardTitle>
                  <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Ação
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Ação ao Cenário</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {tiposAcao.map((tipo) => {
                          const Icon = tipo.icon
                          return (
                            <Card
                              key={tipo.tipo}
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => adicionarAcao(tipo.tipo)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-md ${tipo.cor}`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{tipo.titulo}</h4>
                                    <p className="text-sm text-muted-foreground">{tipo.descricao}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {acoesCenario.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma ação adicionada ao cenário</p>
                    <p className="text-sm">Clique em "Adicionar Ação" para começar</p>
                  </div>
                ) : (
                  <>
                    {acoesCenario.map(renderCardAcao)}
                    <Button 
                      onClick={calcularImpacto}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Calculator className="w-5 h-5" />
                      Calcular Impacto
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Resultados (60%) */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                Resultados Projetados (Impacto Anual)
              </h2>
              
              {/* Cards de KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">Redução de Emissões</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      -{resultados.reducaoEmissoes.toLocaleString()} tCO₂e
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">Economia Anual</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {resultados.economiaFinanceira.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Trash2 className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-muted-foreground">Redução de Resíduos</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      -{resultados.reducaoResiduos} toneladas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico Comparativo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparativo de Emissões Anuais (tCO₂e)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
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
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-muted"></div>
                      <span>Cenário Atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-primary"></div>
                      <span>Cenário Simulado</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}